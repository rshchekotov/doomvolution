import { GuildConfig } from "@/interfaces/guild-config.interface";
import { Module } from "@/interfaces/module.interface";
import { Logger } from "@/services/logger.service";
import { getMessage, getReaction, getUser, send } from "@/util/discord.util";
import { MessageEmbed, MessageReaction, ReactionUserManager } from "discord.js";
import { modules } from ".";

const right = ['➡️'];
const lock = ['🛑'];
const left = ['⬅️'];

export class ManualModule extends Module {
    public name: string = 'man';
    types: string[] = ['MESSAGE_CREATE','MESSAGE_REACTION_ADD'];
    requires: string[] = [];

    man: string[] = [        
        '***__[Wonderful] Manual Module__***\n' +
        `The ${this.name} (also: woman [= Wonderful Manual]) module 
        provides descriptions  for every module registered in the ' + 
        'global repository!`,
        '_**How to Use**_\n' +
        'This module is used to look up what modules do and how ' +
        'to use them properly! Each module has a small documentation, ' +
        'which is intended to introduce you to it and show you the ' +
        'whole functionality, potential dependencies and tips!',
        '_**Navigation**_\n' +
        'In order to navigate around in the manual you can use ' +
        '`man [module]` or if you know specifically where to look for ' +
        'something _or_ were linked by something like: `[see man(3)]`' +
        'then you can specify the page as well: `man [module] [page]`.\n\n' +
        '**Example:**\n' +
        '```\n$man ready\n``` ```\n$man anilookup 2\n```',
        'If you arrived here in order to obtain more information about ' +
        'how to use the bot, you might find the entry for `[see modman]` ' +
        'useful, since it is the main way to manage the bots features! ' +
        'Without having a module installed, it won\'t work - enabling ' +
        'the high configurability and modularity!'
    ];

    re = /^(?:wo)?man (\w+) ?(\d*)/;

    cache: { [mid: string]: number } = { };

    verify = async (event: string, data: any, config: GuildConfig) => (event === this.types[1]) || 
        await this.cmd(data, this.re, config) !== null;

    run = async (event: string, data: any, config: GuildConfig) => {
        if(event === this.types[1]) {
            // Fetch Reaction
            let eid = data.emoji.id || data.emoji.name;
            let react: ReactionUserManager;
            try {
                react = (await getReaction(eid, data.message_id, data.channel_id))!;
            } catch {
                return;
            }
            if(!react) return;

            // Fetch User
            let user = await getUser(data.user_id);
            if(user.bot) return;

            // Fetch Message
            let msg = await getMessage(data.channel_id, data.message_id);
            if(!msg.embeds || msg.embeds.length < 1) { return; }; // Skip if no Embed

            // Get Embed
            let embed = msg.embeds[0];
            if(!embed.title?.startsWith('Man') && !embed.title?.startsWith('WoMan')) { return; }; // Skip if not Man Entry

            let page: RegExpExecArray | null = null;

            // If not Cached:
            if(!this.cache[data.channel_id]) {
                // Check if has Pages:
                page = /Page: (\d+) \/ (\d+)/.exec((embed.footer || { text: '' }).text || '');
                if(!page) { return; }; // Skip if One-Page Entry / Not Found
            }

            let mod = modules[/(?:Wo)?Man \| (\w+)/.exec(embed.title)![1]];
            let p = parseInt(page![1]) - 1;
            let m = parseInt(page![2]);
            let pn = 0;

            if(right.includes(eid)) {
                pn = (p + 1) % m;
                await msg.edit(embed);
            } else if(left.includes(eid)) {
                pn = (m + p - 1) % m;
            } else if(lock.includes(eid)) {
                pn = p;
                await msg.reactions.removeAll();
            }

            if(right.concat(left).concat(lock).includes(eid)) {
                embed.setDescription(mod.man[pn]);
                embed.setFooter(`Page: ${pn + 1} / ${mod.man.length}`);
                embed.setTimestamp();
                await msg.edit(embed);
            }

            // Remove User Reaction
            if(msg.reactions.cache.array().length > 0) {
                await react.remove(user.id);
                Logger.warn('[Man] Removing User Reaction');
            }
        } else {
            let match = await this.cmd(data, this.re, config);
            let mod: Partial<Module> = modules[match![1]];
            let resp: MessageEmbed = new MessageEmbed()
                .setTitle(mod ? `${ match![0].startsWith('wo') ? "WoMan" : "Man"} | ${mod.name}` : `Man | No Results for '${match![1]}'`)
                .setDescription('¯\\\\_(ツ)\\_/¯')
                .setTimestamp();
            
            if(!mod) mod = { man: '' };
            if(typeof mod.man === 'string' && mod.man !== '') {
                resp.setDescription(mod.man);
                await send(data.channel_id, resp);
            } else if(typeof mod.man === 'object') {
                let page = parseInt(match![2]);
                if(Number.isNaN(page)) page = 1;

                resp.setDescription(mod.man[(page - 1) % mod.man.length]);
                resp.setFooter(`Page: ${page} / ${mod.man.length}`);

                let sent = await send(data.channel_id, resp);

                this.cache[sent!.id] = page-1;
                await sent!.react(left[0]);
                await sent!.react(lock[0]);
                await sent!.react(right[0]);
            }
        }
    };
}