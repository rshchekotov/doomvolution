import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Module } from '@/interfaces/module.interface';
import { send } from '@/util/discord.util';

export class DadModule extends Module {
  public name: string = 'dad';
  types: string[] = ['MESSAGE_CREATE'];
  requires: string[] = [];
  man: string =
    '' +
    '***__Dad Module__***\n' +
    `The ${this.name} module is rather for jokes ` +
    'than for anything else. When enabled it will respond ' +
    "to every message starting with `I'm` and similar with " +
    'the well-known dad answer.';

  re: RegExp = /(?:^(?:i|l)(?:'|’|`|′|`)?m|^(?:i|l) am) (.+)/;

  verify = async (event: string, data: any, config: GuildConfig) => {
    return this.re.exec(data.content.toLowerCase()) !== null;
  };

  run = (event: string, data: any, config: GuildConfig) => {
    let who = this.re.exec(data.content.toLowerCase())![1];
    send(data.channel_id, `Hey, ${who}. I'm dad!`);
  };
}
