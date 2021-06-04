import { client, guilds } from '@/app';
import { GuildConfigModel } from '@/db/models/guild-config.model';
import { PagedEmbed, PagedEmbeds } from '@/discord/paged.embed';
import {
  DefaultConfig,
  GuildConfig,
} from '@/interfaces/guild-config.interface';
import { PackageInput } from '@/interfaces/package.interface';
import { Package } from '@/repository/package';
import { repositories } from '@/repository/repository';
import { Logger } from '@/services/logger.service';
import { getReaction } from '@/util/discord.util';
import { byBot, findPackage, makePackageInput } from '@/util/package.util';
import { Guild } from 'discord.js';

const registered: string[] = [];

export class GuildEventHandler {
  public config: GuildConfig;

  constructor(guild: Guild) {
    this.config = DefaultConfig;
    this.setupConfig(guild);
  }

  async setupConfig(guild: Guild) {
    let document = await GuildConfigModel.find({ gid: guild.id });

    if (document.length === 0) {
      Logger.info(`Created Configuration for '${guild.name}'`);
      let conf = DefaultConfig;
      // Set Correct Guild ID.
      conf.gid = guild.id;
      conf.data.configured = true;
      GuildConfigModel.create(conf);
      this.config = conf;
    } else {
      Logger.info(`Loaded Configuration for '${guild.name}'`);
      let doc = document.shift()!;
      this.config = {
        gid: doc.gid,
        prefix: doc.prefix,
        nick: doc.nick,
        packages: doc.packages,
        repositories: doc.repositories,
        environments: doc.environments,
        data: doc.data,
      };
    }
    registered.push(guild.id);

    let g = client.guilds.cache
      .filter((_, key: string) => key === guild.id)
      .first();
    await g!.me!.edit({ nick: this.config.nick });
    guilds.set(this.config.gid, this);

    this.handleEvent('BOT_READY', guild);
  }

  async handleEvent(name: string, data: any) {
    // Check Paginations
    if(['MESSAGE_REACTION_ADD'].includes(name)) { 
      if(await byBot('reaction', data)) return;
      let embed = <PagedEmbed | undefined> PagedEmbeds.get(data.message_id)
      if(embed) {
        let eid = data.emoji.id || data.emoji.name;
        let uid = data.user_id;
        await embed.emote(eid, uid);
        return;
      }
    }

    // Parse Input Data
    let input = makePackageInput(name, data, this.config);

    // Pass Onto Packages!
    await findPackage(this.config, input, async (pkg: Package, dat: PackageInput) => {
      let passed = await pkg.verify(dat);
      if(passed) {
        await pkg.exec(dat);
        return true;
      }
      return false;
    });
  }

  async pushConfig() {
    guilds.set(this.config.gid, this);
    await GuildConfigModel.replaceOne(
      { gid: this.config.gid },
      this.config
    ).exec();
  }

  async addConfig(path: string[], cfg: any, append: boolean) {
    let field = path.shift() || 'q.q';
    let extension = this.setConfig(this.config[field], path, cfg, append);
    this.config[field] = extension;
    await this.pushConfig();
  }

  async setData(key: string, obj: any) {
    this.config.data[key] = obj;
    await this.pushConfig();
  }

  setConfig(base: any, path: string[], cfg: any, append: boolean) {
    if (path.length > 0) {
      let field = path.shift() || 'q.q';
      base = Object.assign(
        base,
        this.setConfig(base[field], path, cfg, append)
      );
    } else {
      if (append) {
        if (base instanceof Array) {
          base.push(cfg);
        } else if (base instanceof String) {
          base += cfg;
        } else {
          Logger.warn('@GuildEventHandler::setConfig');
        }
      } else {
        base = cfg;
      }
      return base;
    }
  }
}
