import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Module } from '@/interfaces/module.interface';
import { send } from '@/util/discord.util';
import { MessageEmbed } from 'discord.js';

const changes =
  '__***Change Log v1.0.1: Bugs and Fixes vol. 1***__\n' +
  "-> `[anilookup]` Added 'Not Found' warning to `man`.\n" +
  '-> `[birthday]` fixed RegEx to allow spaces\n' +
  '-> `[changelog]` *added*\n' +
  '-> `[compliment]` changed triggers\n' +
  "-> `[compliment]` added Promise's `’`\n" +
  '-> `[emote]` added a lil something to `man` \n' +
  '-> `[emote]` fixed colon-link bug, should work now.\n' +
  '-> `[hello]` added welcome message option\n' +
  '-> `[meep]` fixed RegEx\n' +
  '-> `[morph]` added `DO NOT OVERUSE`-label \n' +
  '-> `[sixdigit]` fixed RegEx\n' +
  '-> `overall` made bot more crash-proof\n';

export class ChangelogModule extends Module {
  public name: string = 'changelog';
  types: string[] = ['MESSAGE_CREATE'];
  requires: string[] = [];
  man: string =
    '' +
    '***__Changelog Module__***\n' +
    `The ${this.name} module is there to provide ` +
    'you with the information about the most recent ' +
    'changes! You can simply look it up using:' +
    '```\n$changelog\n```';

  verify = async (event: string, data: any, config: GuildConfig) => {
    return (await this.cmd(data, /^changelog$/, config)) != null;
  };

  run = (event: string, data: any, config: GuildConfig) => {
    let embed = new MessageEmbed()
      .setTitle(`Change Log | ${changes.split('\n')[0]}`)
      .setDescription(changes)
      .setFooter('v1.0.1')
      .setThumbnail('https://www.microspot.com/images/upgradesnav.png');
    send(data.channel_id, embed);
  };
}
