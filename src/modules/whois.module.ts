import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Module } from '@/interfaces/module.interface';
import {
  getAvatar,
  getMember,
  getMessage,
  getUser,
  send,
} from '@/util/discord.util';
import { choose } from '@/util/random.util';
import { MessageEmbed } from 'discord.js';

const aliases = ['whois', 'who'];

export class WhoIsModule extends Module {
  public name: string = 'whois';
  types: string[] = ['MESSAGE_CREATE'];
  requires: string[] = [];
  man: string =
    '' +
    '***__Who Is Module__***\n' +
    `The ${this.name} module provides a way to ` +
    'find out information about a certain user! ' +
    'You can do so, by simply typing: ```$whois ' +
    '@ping```';

  re: RegExp = /^(\w+) *<@!(\d+)> */;

  verify = async (event: string, data: any, config: GuildConfig) => {
    return (await this.cmd(data, this.re, config)) != null;
  };

  run = async (event: string, data: any, config: GuildConfig) => {
    let match = await this.cmd(data, this.re, config);
    if (aliases.includes(match![1])) {
      let initial = await getMessage(data.channel_id, data.id);
      if (!initial) return;

      let mentioned = initial.mentions.members;
      if (!mentioned) return;

      let user = mentioned.first();
      if (!user) return;

      let embed = new MessageEmbed()
        .setTitle(`${user.nickname || user.user.username}`)
        .setImage(getAvatar(user.user))
        .addFields([
          { name: 'User ID', value: user.id },
          { name: 'Tag', value: user.user.tag },
          {
            name: 'Bot',
            value: user.user.bot || user.user.system ? 'Yep' : 'Nope',
          },
          { name: '\u200B', value: '\u200B' },
          {
            name: 'Exists Since',
            value: new Date(user.user.createdTimestamp).toLocaleString(),
          },
          { name: 'Color', value: user.displayHexColor },
          { name: 'Status', value: user.presence.status },
        ])
        .setURL(`https://discord.com/channels/@me/${user.id}`)
        .setFooter(
          `requested by ${initial.member!.nickname || initial.author.username}`
        )
        .setTimestamp();

      // Empty Message Bug
      await send(data.channel_id, embed);
    }
  };
}
