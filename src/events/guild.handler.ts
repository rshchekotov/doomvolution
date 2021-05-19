import { client, guilds } from '@/app';
import { GuildConfigModel } from '@/db/models/guild-config.model';
import {
  DefaultConfig,
  GuildConfig,
} from '@/interfaces/guild-config.interface';
import { modules } from '@/modules';
import { Logger } from '@/services/logger.service';
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
        modules: doc.modules,
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
    for (let mod of this.config.modules) {
      // If such module exists in global store!
      if (modules[mod]) {
        // If module matches sent event!
        if (modules[mod].types.includes(name)) {
          // If module passes verification:
          if (await modules[mod].verify(name, data, this.config)) {
            await modules[mod].run(name, data, this.config);
          }
        }
      }
    }
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
