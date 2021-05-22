import { botDevs, guilds } from '@/app';
import { GuildEventHandler } from '@/events/guild.handler';
import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Module } from '@/interfaces/module.interface';
import { Logger } from '@/services/logger.service';
import { getMessage, getReaction, getUser, send } from '@/util/discord.util';
import { Message, MessageEmbed } from 'discord.js';

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
    let old = Object.assign({}, cso);
    let prev: any, cur: any;
    let path = [...old.path]; // data>react>02>smile>0

    if(path.length < 1) return cso;
    
    let child = path.splice(path.length-1,1)[0]; // 0
    prev = getFromPath(old.config, path); // data>react>02>smile
    delete prev[child]; // DEL smile>0

    while(path.length > 0) {
        let child = path.splice(path.length-1,1)[0]; // smile
        cur = getFromPath(old.config, path); // data>react>02
        cur[child] = prev; // 02 = smile
        prev  = cur; // Set Back
    }

    return { config: prev, path: [], current: prev, page: 0 };
}

function cd(cso: ConfigStoreObject, i: number) {
    let arr = Object.keys(cso.current || {});
    if(i === -1) {
        if(cso.path.length > 0) {
            cso.path = cso.path.slice(0,-1);
            cso.page = 0;
        }
    } else if(i < arr.length) {
        cso.path.push(arr[i]);
        //cso.current = cso.current[arr[i]];
        cso.page = 0;
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
        .setFooter(`Page: ${page+1}/${Math.ceil(Object.keys(obj).length/5)}`)
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
                let pages = Object.keys(cso.current).length/5;

                if(eid === '▶️')
                    cso.page = (cso.page + 1) % pages;
                if(eid === '◀️') 
                    cso.page = (cso.page + pages - 1) % pages;
                if(eid === '⬆️') {
                    cso = cd(cso, -1);
                }
                if(number.includes(eid)) {
                    cso = cd(cso, cso.page*5 + number.indexOf(eid));
                }
                if(eid === '🟩') {
                    await msg.channel.send('Are you sure you want to save the current config?\nType `YES` to confirm.');
                
                    let collection = await msg.channel.awaitMessages((m: Message) => {
                        return botDevs.includes(m.author.id) && m.channel.id === msg?.channel.id;
                    }, { max: 1 });
                    
                    let polled = collection.first();
                    if(polled && polled.content === 'YES') {
                        let conf = (<GuildEventHandler> guilds.get(msg.guild!.id));
                        conf.config = cso.config;
                        await conf.pushConfig();
                        await msg.channel.send('Saved Guild Config successfully!');
                    } else {
                        await msg.channel.send('Exited DB Browser successfully!');
                    }
                    await msg.delete();
                    return;

                } else if(eid === '🟥') {
                    await msg.channel.send('Are you sure you want to permanently delete `' + 
                        cso.path.slice(-1)[0] +
                        '`?\nType `YES` to confirm.');
                    
                    let collection = await msg.channel.awaitMessages((m: Message) => {
                        return botDevs.includes(m.author.id) && m.channel.id === msg?.channel.id;
                    }, { max: 1 });
                    
                    let polled = collection.first();
                    if(polled && polled.content === 'YES')
                        cso = rm(cso);
                    else await msg.channel.send('Action was cancelled successfully!');
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

            let embed = formatConfig(configuration, 0);
            let browser = embed.fields;
            embed.setImage('https://i.ytimg.com/vi/pm4wzdYhOAo/maxresdefault.jpg');
            embed.fields = []; // Empty fields during loading.

            let confmsg = await send(data.channel_id, embed);
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
                await confmsg.react('🟩');
                await confmsg.react('🟥');
                
                embed.addFields(browser);
                embed.image = null;
                await confmsg.edit(embed);
            } catch {
                Logger.warn('Message probably deleted!');
            }
        }
    };
}