import { guilds } from '@/app';
import { GuildEventHandler } from '@/events/guild.handler';
import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Module } from '@/interfaces/module.interface';
import { Logger } from '@/services/logger.service';
import { getGuild, getMessage, send } from '@/util/discord.util';

export class PrefixModule extends Module {
  public name: string = 'prefix';
  types: string[] = ['MESSAGE_CREATE'];
  requires: string[] = [];
  permissions = ['moderator', 'dev'];
  man: string =
    '' +
    '***__Prefix Module__***\n' +
    `The ${this.name} module is there so you can ` +
    'show all available modules and change the current ' +
    'prefix!\nIn order to list all available modules ' +
    'just type the prefix (e.g.:) ```$``` in order to ' +
    'change the prefix, you type something like: ' +
    '```$ set +```The above would change the current ' +
    'prefix ($) to `+`!';

  verify = async (event: string, data: any, config: GuildConfig) => {
    return (
      data.content === config.prefix ||
      (await this.cmd(data, /^ set (.+)/, config)) !== null
    );
  };

  run = async (event: string, data: any, config: GuildConfig) => {
    let handler = <GuildEventHandler>guilds.get(config.gid);
    if (data.content === config.prefix) {
      send(
        data.channel_id,
        handler.config.modules.map((mod) => `- ${mod}`).join('\n')
      );
    } else {
      let msg = await getMessage(data.channel_id, data.id);
      if (!msg) return;
      let match = await this.cmd(data, /^ set (.+)/, config);
      handler.config.prefix = match![1];
      handler.pushConfig();
      await msg.react('🆗');
      await msg.reply(
        `Prefix successfully changed from '${config.prefix}' to ${handler.config.prefix}`
      );
    }
  };
}
