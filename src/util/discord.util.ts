import { client } from '@/app';
import { GuildConfig } from '@/interfaces/guild-config.interface';
import { WebhookData } from '@/interfaces/webhook.data.interface';
import { Logger } from '@/services/logger.service';
import {
  Channel,
  Guild,
  GuildMember,
  Message,
  MessageAdditions,
  MessageEmbed,
  TextChannel,
  User,
} from 'discord.js';

export async function send(cid: string, content: string | MessageEmbed, options?: MessageAdditions) {
  let channel = <TextChannel>await getChannel(cid);
  if(options) return await channel.send(content, options);
  return await channel.send(content);
}

export async function getMessage(
  cid: string,
  mid: string
): Promise<Message | undefined> {
  try {
    let chan = <TextChannel> await getChannel(cid);
    if (chan.messages.cache.has(mid)) return chan.messages.cache.get(mid)!;
    return await chan.messages.fetch(mid);
  } catch(e) {
    Logger.error(`\n${e.stack}\n${e.name}\n${e.message}`);
    Logger.warn(`Message '${mid}' Not Found!`);
    return undefined;
  }
}

export async function getGuild(gid: string): Promise<Guild> {
  if (client.guilds.cache.has(gid)) return client.guilds.cache.get(gid)!;
  return await client.guilds.fetch(gid);
}

export async function getChannel(cid: string): Promise<Channel> {
  if (client.channels.cache.has(cid)) return client.channels.cache.get(cid)!;
  return await client.channels.fetch(cid);
}

export async function getUser(uid: string): Promise<User> {
  if (client.users.cache.has(uid)) return client.users.cache.get(uid)!;
  return await client.users.fetch(uid);
}

export async function getMember(
  gid: string,
  uid: string
): Promise<GuildMember> {
  let guild = await getGuild(gid);
  if (guild.members.cache.has(uid)) return guild.members.cache.get(uid)!;
  return await guild.members.fetch(uid);
}

export async function getReaction(rid: string, mid: string, cid: string) {
  try {
    return (await getMessage(cid, mid))!.reactions.cache.get(rid)!.users;
  } catch {
    Logger.warn('Reaction: Failure');
    return undefined;
  }
}

export async function sendAsHook(
  cid: string,
  data: WebhookData,
  content: string | MessageEmbed
) {
  let channel = <TextChannel>await getChannel(cid);
  let hooks = await channel.fetchWebhooks();
  let hook = hooks.first();
  if (!hook) hook = await channel.createWebhook(data.name, data.options);
  else
    hook = await hook.edit({
      name: data.name,
      avatar: data.options.avatar,
      reason: data.options.reason,
    });
  return await hook.send(content);
}

// Own Helpers

export function hasARole(user: string, config: GuildConfig, roles: string[]) {
  // TODO
}

export function getAvatar(user: User) {
  return (
    user.avatarURL({
      format: 'png',
      dynamic: true,
      size: 512,
    }) || user.defaultAvatarURL
  );
}

export async function hookify(user: GuildMember | User): Promise<WebhookData> {
  return {
    name: user instanceof User ? user.username : (user.nickname || user.user.username),
    options: {
      avatar: getAvatar(user instanceof User ? user : user.user),
      reason: 'Why not?',
    },
  };
}

export async function checkReactions(
  cid: string,
  mid: string,
  expected: string[]
) {
  let msg = await getMessage(cid, mid);
  if (!msg) return;

  let valid = expected.every((r) => {
    // @ts-ignore
    return msg.reactions.cache.has(r);
  });
  if (valid) return true;
  else {
    try {
      await msg.reactions.removeAll();
      for (let emoji of expected) {
        await msg.react(emoji);
      }
    } catch {
      return false;
    }
  }
  return true;
}


export const markdown = [
  { obj: '', w: 32 },
  { obj: '*', w: 16 },
  { obj: '**', w: 8 },
  { obj: '***', w: 4 },
  { obj: '__', w: 4 },
  { obj: '~~', w: 1 },
  { obj: '||', w: 1 },
];