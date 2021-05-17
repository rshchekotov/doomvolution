import { GuildConfig } from "@/interfaces/guild-config.interface";
import { Module } from "@/interfaces/module.interface";
import { getPagedEmbed, PagedEmbed } from "@/interfaces/paged.embed.interface";
import { UrbanResult } from "@/interfaces/urban.interface";
import { Logger } from "@/services/logger.service";
import { checkReactions, getMessage, getReaction, getUser, send } from "@/util/discord.util";
import { formatDefinitions, searchDefinition } from "@/util/urban.util";
import { MessageEmbed } from "discord.js";

const def = ['def', 'define'];
const right = ['➡️'];
const lock = ['🛑'];
const left = ['⬅️'];

export class DefineModule extends Module {
    public name: string = 'define';
    types: string[] = ['MESSAGE_CREATE','MESSAGE_REACTION_ADD'];
    requires: string[] = [];
    man: string[] = [ 
        '***__Define Module__***\n' +
        `The ${this.name} module is used to ` +
        'define terms using the Urban Dictionary ' +
        'API.',
        '_**Examples**_\n' +
        'The usage is quite simple. To get a defintion ' +
        'for a certain term, you can type: ' + 
        '```$define [term]```' +
        `These aliases also work: ${def.join(', ')}`
    ]

    cache: { [message: string]: PagedEmbed | undefined } = {};
    re: RegExp = /(\w+) (.+)/;

    verify = async (event: string, data: any, config: GuildConfig) => {
        return event === this.types[1] || await this.cmd(data, this.re, config) !== null;
    };

    run = async (event: string, data: any, config: GuildConfig) => {
        if(event === this.types[1]) {
            let user = await getUser(data.user_id);
            if(user.bot) return;

            let msg = await getMessage(data.channel_id, data.message_id);

            let eid = data.emoji.id || data.emoji.name;
            let react = await getReaction(eid, msg.id, msg.channel.id);
            if(!react) return;
                
            let paged = this.cache[data.message_id];

            if(paged && msg.embeds && msg.embeds.length > 0) {
                if(left.includes(eid)) {
                    paged.page = (paged.pages.length+paged.page-1) % paged.pages.length;
                } else if(right.includes(eid)) {
                    paged.page = (paged.page + 1) % paged.pages.length;
                } else if(lock.includes(eid)) {
                    await msg.reactions.removeAll();
                } else {
                    return;
                }
                
                let embed = getPagedEmbed(paged);
                if(lock.includes(eid)) {
                    embed.title = '[🛑] ' + embed.title;
                    embed.footer = { text: 'No Pages Available' };
                    this.cache[msg.id] = undefined;
                }
                await msg.edit(embed);
                if(lock.includes(eid)) return;

                await react.remove(user.id);
                Logger.warn('[Define] Removing User Reaction');
                await checkReactions(msg.channel.id, msg.id, left.concat(lock).concat(right));
            } else {
                if(msg.embeds && msg.embeds.length > 0 && msg.embeds[0].title && msg.embeds[0].title.startsWith('Definition')) {
                    await msg.reactions.removeAll();
                    let embed = msg.embeds[0];
                    embed.title = '[🛑] ' + embed.title;
                    embed.footer = { text: 'No Pages Available' };
                    msg.edit(embed);
                }
            }
            return;
        }

        let match = await this.cmd(data, this.re, config);
        if(def.includes(match![1])) {
            let term = match![2];
            let results: UrbanResult[]| undefined = await searchDefinition(term);
            let formatted: PagedEmbed | MessageEmbed = formatDefinitions(results || [], term);

            if(formatted instanceof MessageEmbed) {
                await send(data.channel_id, formatted);
            } else {
                let msg = await send(data.channel_id, getPagedEmbed(formatted));
                await msg.react(left[0]);
                await msg.react(lock[0]);
                await msg.react(right[0]);
                this.cache[msg.id] = formatted;
            }
        }
    };

}