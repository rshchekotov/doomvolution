import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Module } from '@/interfaces/module.interface';
import { Logger } from '@/services/logger.service';
import { getMessage, send } from '@/util/discord.util';
import { MessageEmbed } from 'discord.js';

export class PingModule extends Module {
  public name: string = 'ping';
  types: string[] = ['MESSAGE_CREATE'];
  requires: string[] = [];
  man: string =
    '' +
    '***__Ping Module__***\n' +
    `The ${this.name} module exists in order ` +
    'to test the latency or simply to see if the ' +
    'bot is online!';

  re: RegExp = /^ping$/;

  verify = async (event: string, data: any, config: GuildConfig) => {
    return (await this.cmd(data, this.re, config)) !== null;
  };

  run = async (event: string, data: any, config: GuildConfig) => {
    let original = await getMessage(data.channel_id, data.id);
    if (!original || original.author.bot) return;
    let embed: MessageEmbed = new MessageEmbed();
    embed.setTitle('Computing Latency...');
    embed.setImage('https://i.ytimg.com/vi/pm4wzdYhOAo/maxresdefault.jpg');
    let msg = await send(data.channel_id, embed);
    embed.setTitle(
      `Latency: ${msg.createdTimestamp - original.createdTimestamp}ms`
    );
    embed.setImage(
      `https://i.pinimg.com/originals/50/89/a9/5089a9a36884bb90e14312d3af951317.gif`
    );
    await msg.edit(embed);
  };
}
