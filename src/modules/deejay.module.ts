import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Module } from '@/interfaces/module.interface';
import { send } from '@/util/discord.util';

const dj = ['dj'];

export class DeeJayModule extends Module {
  public name: string = 'deejay';
  types: string[] = ['MESSAGE_CREATE'];
  requires: string[] = [];
  man: string =
    '' +
    '***__DJ Module__***\n' +
    `The ${this.name} module is made to listen to music ` +
    '- this is an early attempt, so there might be some ' +
    'issues, but eventually I\'ll make this work at least ' +
    'as good as Rythm, including custom features, such as ' +
    'the creation of a playlist from the current queue and ' +
    'similar!';

  re: RegExp = /^(\w+) ?(.*)/;

  verify = async (event: string, data: any, config: GuildConfig) => {
    return (await this.cmd(data, this.re, config)) !== null;
  };

  run = async (event: string, data: any, config: GuildConfig) => {
    let match = (await this.cmd(data, this.re, config))!;
    
    if(dj.includes(match[1])) {

    }
  };
}
