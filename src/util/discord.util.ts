import { client } from "@/app";
import { GuildConfig } from "@/interfaces/guild-config.interface";
import { WebhookData } from "@/interfaces/webhook.data.interface";
import { Logger } from "@/services/logger.service";
import { Channel, Guild, GuildMember, Message, MessageEmbed, TextChannel, User } from "discord.js";

export async function send(cid: string, content: string | MessageEmbed) {
    let channel = <TextChannel> (await getChannel(cid));
    return await channel.send(content);
}

export async function getMessage(cid: string, mid: string): Promise<Message> {
    let chan = <TextChannel> await getChannel(cid);
    if(chan.messages.cache.has(mid))
        return chan.messages.cache.get(mid)!;
    return await chan.messages.fetch(mid);
}

export async function getGuild(gid: string): Promise<Guild> {
    if(client.guilds.cache.has(gid))
        return client.guilds.cache.get(gid)!;
    return await client.guilds.fetch(gid);
}

export async function getChannel(cid: string): Promise<Channel> {
    if(client.channels.cache.has(cid))
        return client.channels.cache.get(cid)!;
    return await client.channels.fetch(cid);
}

export async function getUser(uid: string): Promise<User> {
    if(client.users.cache.has(uid))
        return client.users.cache.get(uid)!;
    return await client.users.fetch(uid);
}

export async function getMember(gid: string, uid: string): Promise<GuildMember> {
    let guild = await getGuild(gid);
    if(guild.members.cache.has(uid))
        return guild.members.cache.get(uid)!;
    return await guild.members.fetch(uid);
}

export async function getReaction(rid: string, mid: string, cid: string) {
    return (await getMessage(cid, mid)).reactions.cache.get(rid)?.users;
}

export async function sendAsHook(cid: string, data: WebhookData, content: string | MessageEmbed) {
    let channel = <TextChannel> (await getChannel(cid));
    let hooks = await channel.fetchWebhooks();
    let hook = hooks.first();
    if(!hook) hook = await channel.createWebhook(data.name, data.options);
    else hook = await hook.edit({ name: data.name, avatar: data.options.avatar, reason: data.options.reason });
    return await hook.send(content);
}

// Own Helpers

export function hasARole(user: string, config: GuildConfig, roles: string[]) {
    if(config.data.users) {
        if(!config.data.users[user]) return ['member'];
        else {
            return roles.some(role => config.data.users[user].includes(role)) ? [] : roles;
        }
    } else return [];
}

export function getAvatar(user: User) {
    return user.avatarURL({
        format: 'png',
        dynamic: true,
        size: 512
    }) || user.defaultAvatarURL;
}

export async function hookify(user: GuildMember | User): Promise<WebhookData> {
    return {
        name: (user instanceof User) ? user.username : user.user.username,
        options: {
            avatar: getAvatar((user instanceof User) ? user: user.user),
            reason: 'Why not?'
        }
    };
}

export async function checkReactions(cid: string, mid: string, expected: string[]) {
    let msg = await getMessage(cid, mid);
    let valid = expected.every(r => {
        return msg.reactions.cache.has(r);
    });
    if(valid) return true;
    else {
        try {
            await msg.reactions.removeAll();
            for(let emoji of expected) {
                await msg.react(emoji);
            }
        } catch {
            return false;
        }
    }
    return true;
}