import { botDevs, guilds } from '@/app';
import { GuildEventHandler } from '@/events/guild.handler';
import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Module } from '@/interfaces/module.interface';
import { getGuild, send } from '@/util/discord.util';
import { GuildMember } from 'discord.js';

const role = ['role', 'usermod'];

export function hasRole(user: string, config: GuildConfig, roles: string[]) {
  if (config.data.users) {
    if (!config.data.users[user]) return false;
    else {
      return roles.every((role) => {
        return config.data.users[user].includes(role);
      });
    }
  } else return true;
}

export class PermissionModule extends Module {
  public name: string = 'permission';
  types: string[] = ['BOT_READY', 'GUILD_MEMBER_ADD', 'MESSAGE_CREATE'];
  requires: string[] = [];
  permissions = ['moderator', 'dev'];

  man: string[] = [
    '***__Permission Module__***\n' +
      `The ${this.name} module is there to manage Guild Member ` +
      'roles and allow certain members to interact with some modules ' +
      'and prevent others from doing so! When installed every regular ' +
      "user gets the member role, which for example doesn't allow " +
      'installing or removing modules!',
    '_**Role Assignment**_\n' +
      'To assign a role to someone, you have to be an Admin, Moderator or ' +
      'Bot Developer! Then you can type following to assign a role to someone: ' +
      '```$role @ping role```The Syntax in the general sense looks like this: ' +
      '```$role [ping] [role-name]```',
  ];

  re: RegExp = /(\w+) <@!(\d+)>(?: (.+))?/;

  verify = async (event: string, data: any, config: GuildConfig) => {
    return (
      event === this.types[0] ||
      event === this.types[1] ||
      (await this.cmd(data, this.re, config)) != null
    );
  };

  run = async (event: string, data: any, config: GuildConfig) => {
    if (event === this.types[0]) {
      if (!config.data.users) {
        config.data.users = {};
        let guild = await getGuild(config.gid);
        guild.members.cache.forEach((member: GuildMember) => {
          config.data.users[member.id] = [];
          if (member.hasPermission(['ADMINISTRATOR'])) {
            config.data.users[member.id].push('admin', 'moderator');
          } else if (member.hasPermission(['BAN_MEMBERS', 'KICK_MEMBERS'])) {
            config.data.users[member.id].push('moderator');
          }
          if (botDevs.includes(member.id)) {
            config.data.users[member.id].push('dev');
          }

          if (!member.user.bot) config.data.users[member.id].push('member');
        });
        let handler = <GuildEventHandler>guilds.get(guild.id);
        handler.config = config;
        handler.pushConfig();
      }
    } else if (event === this.types[1]) {
      config.data.users[data.user.id] = ['member'];

      let handler = <GuildEventHandler>guilds.get(config.gid);
      handler.config = config;
      handler.pushConfig();
    } else if (event === this.types[2]) {
      let match = await this.cmd(data, this.re, config);
      if (!config.data.users) config.data.users = {};
      if (role.includes(match![1])) {
        if (match![3]) {
          config.data.users[match![2]].push(match![3]);
          send(
            data.channel_id,
            `Successfully added ${match![3]} to <!@${match![2]}>`
          );
        } else {
          send(
            data.channel_id,
            `User Roles for <@!${match![2]}>: [${config.data.users[
              match![2]
            ].join(', ')}]`
          );
        }
      }
    }
  };
}
