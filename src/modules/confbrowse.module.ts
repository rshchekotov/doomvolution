import { botDevs, guilds } from '@/app';
import { GuildEventHandler } from '@/events/guild.handler';
import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Module } from '@/interfaces/module.interface';
import { Logger } from '@/services/logger.service';
import { getMessage, getReaction, getUser, send } from '@/util/discord.util';
import { MessageEmbed } from 'discord.js';

const number = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

interface ConfigStoreObject {
    config: GuildConfig,
    path: string[],
    current: any,
    page: number
}

function getFromPath(object: any, path: string[]) {
    let o = object;
    if(path.length > 0) {
        let next = path.shift()!;
        o = o[next];
        o = getFromPath(o, path);
    }
    return o;
}

function rm(cso: ConfigStoreObject) {
    let parent = cd(cso, -1);
    if(parent !== cso) {
        parent[cso.path[cso.path.length-1]] = undefined;
    } // Is Root - Do Nothing.
    return parent;
}

function cd(cso: ConfigStoreObject, i: number) {
    let arr = Object.keys(cso.current || {});
    if(i === -1) {
        if(cso.path.length > 0) {
            cso.path = cso.path.slice(0,-1);
        }
    } else if(i < arr.length) {
        cso.path.push(arr[i]);
        cso.current = cso.current[arr[i]];
    } else {
        Logger.warn(`Index ${i} is greater than Key!`);
        return cso;
    }
    cso.current = getFromPath(cso.config, [...cso.path]);
    return cso;
}

function formatConfig (obj: any, page: number) {
    let embed = new MessageEmbed()
        .setTitle(`Inspect DB`)
        .setColor('#000000')
        .setTimestamp();
    
    if(typeof obj === 'object') {
        let counter = 0;
        let pages = Math.ceil(Object.keys(obj).length / 5);
        for(let prop in obj) {
            counter++;
            page = page % pages;
            if(counter <= (5*(page)) || counter > (5*((page+1)))) continue;

            if(typeof obj[prop] === 'object') {
                embed.addField(prop, obj[prop] instanceof Array ? `[...]` : `{...}`);
            } else {
                embed.addField(prop, obj[prop]);
            }
        }
    } else {
        embed.setDescription(obj);
    }

    return embed;
}

export class ConfigBrowserModule extends Module {
  public name: string = 'confbrowse';
  types: string[] = ['MESSAGE_CREATE','MESSAGE_REACTION_ADD'];
  requires: string[] = [];
  man: string =
    '' +
    '***__Config Browser Module__***\n' +
    `The ${this.name} module is made to browse ` +
    'the configuration files of the specified ' +
    'server and modify / delete them. Thus this ' +
    'is a module exclusively available to bot ' +
    'admins for the sake of resolving database ' +
    'related issues!'

    re = /^confbrowse (\d+)/;

    cache: {[message: string]: ConfigStoreObject } = {};

    verify = async (event: string, data: any, config: GuildConfig) => {
        return (event === this.types[1] && botDevs.includes(data.user_id)) || 
            (((await this.cmd(data, this.re, config)) != null) && 
            botDevs.includes(data.author.id));
    };

    run = async (event: string, data: any, config: GuildConfig) => {
        // ADMIN ZONE
        if(event === this.types[1]) {
            // Fetch Reaction
            let eid = data.emoji.id || data.emoji.name;

            // Fetch User
            let user = await getUser(data.user_id);
            if (user.bot) return;

            // Fetch Message
            let msg = await getMessage(data.channel_id, data.message_id);
            if (!msg || !msg.embeds || msg.embeds.length < 1) return;

            // Match Title
            let embed = msg.embeds[0];
            if(embed.title !== 'Inspect DB') return;

            if(this.cache[msg.id]) {
                let cso = this.cache[msg.id];

                if(eid === '▶️') cso.page++;
                if(eid === '◀️') cso.page--;
                if(eid === '⬆️') cso = cd(cso, -1);
                if(number.includes(eid)) {
                    cso = cd(cso, number.indexOf(eid));
                }
                if(eid === '💚') {
                    //Saving Mechanics
                    await msg.delete();
                } else if(eid === '❤️') {
                    await msg.delete();
                }

                try {
                    let react = await getReaction(eid, msg.id, msg.channel.id);
                    if(react) await react?.remove(data.user_id);
                    embed = formatConfig(cso.current, cso.page);
                    await msg.edit(embed);
                } catch {
                    Logger.warn('Message probably deleted!');
                }
            }
        } else {
            let match = (await this.cmd(data, this.re, config))!;
            let configuration = (<GuildEventHandler> guilds.get(match[1]!)).config;

            let confmsg = await send(data.channel_id, formatConfig(configuration, 0));
            this.cache[confmsg.id] = { 
                config: configuration, 
                path: new Array<string>(), 
                current: configuration,
                page: 0
             };

            try {
                await confmsg.react('◀️');
                await confmsg.react('⬆️');
                for(let i = 0; i < Math.min(Object.keys(configuration).length,5); i++) {
                    await confmsg.react(number[i]);
                }
                await confmsg.react('▶️');
                await confmsg.react('💚');
                await confmsg.react('❤️');
            } catch {
                Logger.warn('Message probably deleted!');
            }
        }
    };
}