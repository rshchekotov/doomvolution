import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Module } from '@/interfaces/module.interface';
import { WebhookData } from '@/interfaces/webhook.data.interface';
import {
  getGuild,
  getMember,
  getMessage,
  hookify,
  send,
  sendAsHook,
} from '@/util/discord.util';
import { GuildMember } from 'discord.js';

export class MorphModule extends Module {
  public name: string = 'morph';
  types: string[] = ['MESSAGE_CREATE'];
  requires: string[] = [];
  man: string =
    '' +
    '***__Morph Module__***\n' +
    `The ${this.name} module is made to obtain the ` +
    'ability to become another person! This module ' +
    'allows you to take on the appearance of another ' +
    'member through a webhook!\n\n' +
    '_**Examples:**_\n' +
    'Morph into Someone: ```$morph someones name```or ' +
    '```$morph @ping```\nIn order to get back: ' +
    '```$morph own-name```or ```$morph @self-ping``` will work!\n' +
    'ALTHOUGH: Please do yourself and everyone else a ' +
    "favor and don't overuse this feature!";

  cache: { [user: string]: WebhookData | undefined } = {};

  re: RegExp = /^morph (.+|<@!\d+>)/;

  verify = async (event: string, data: any, config: GuildConfig) => {
    return true;
  };

  run = async (event: string, data: any, config: GuildConfig) => {
    let match = await this.cmd(data, this.re, config);

    // Command
    if (match !== null) {
      let mem: GuildMember;
      let identifier = match![1];

      let msg = await getMessage(data.channel_id, data.id);
      if (!msg) return;
      await msg.delete();

      if ((match = /<@!(\d+)>/.exec(identifier))) {
        mem = await getMember(config.gid, match![1]);
      } else {
        let guild = await getGuild(config.gid);
        let lost = guild.members.cache.every((member) => {
          let miss = (member.nickname || member.user.username) !== identifier;
          if (!miss) mem = member;
          return miss;
        });

        if (lost) {
          send(data.channel_id, `Couldn't find Member "${identifier}"!`);
          return;
        }
      }

      if (mem!.user.id === data.author.id) {
        this.cache[data.author.id] = undefined;
      } else {
        this.cache[data.author.id] = await hookify(mem!);
      }
    } else {
      let hookData = this.cache[data.author.id];
      if (hookData) {
        let msg = await getMessage(data.channel_id, data.id);
        if (!msg) return;
        await sendAsHook(data.channel_id, hookData, data.content);
        await msg.delete();
      }
    }
  };
}
