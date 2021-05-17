import { guilds } from "@/app";
import { GuildEventHandler } from "@/events/guild.handler";
import { GuildConfig } from "@/interfaces/guild-config.interface";
import { Module } from "@/interfaces/module.interface";
import { Quote } from "@/interfaces/quote.interface";
import { Logger } from "@/services/logger.service";
import { aniSearch } from "@/util/anilist.util";
import { parseData } from "@/util/data.util";
import { getMember, getMessage, getUser, send } from "@/util/discord.util";
import { choose, randomColor } from "@/util/random.util";
import { Message, MessageEmbed } from "discord.js";

const conf = ['✅'];
const dism = ['❌'];
const create = [
    'add',
    'create',
    'insert',
    'append'
];
const display = [
    'display',
    'show'
];

async function formatQuote(quote: Quote, config: GuildConfig, footer?: string) {
    let embed: MessageEmbed = new MessageEmbed().setTimestamp();

    if(!validate(quote)) return;

    if(quote.type === 'ANIME') {
        // Query API
        let anime = await aniSearch(quote.show!);
        // Quote Show
        embed.setTitle(`${quote.author} (from ${ anime?.title.english || anime?.title.native || quote.show })`);
        let img = quote.image || anime?.coverImage.large;
        if(img) embed.setImage(img);
        // Url
        let url = quote.link || anime?.siteUrl;
        if(url) embed.setURL(url);
        // Quote
        embed.setDescription(quote.quote);
        // Brought By
        let member = await getMember(config.gid, quote.addedBy);
        embed.setFooter(footer || `Quote By: ${quote.author} | Brought by: ${member.nickname || member.user.username}`);
    } else if(quote.type === 'LIFE') {
        // Quote Author + Date
        embed.setTitle(`${quote.author}${quote.date ? ` (${quote.date})` : ''}`);
        // Quote
        embed.setDescription(quote.quote);
        // Image & Link
        if(quote.image) embed.setImage(quote.image);
        if(quote.link) embed.setURL(quote.link);
        // Brought By (+ From Show)
        let member = await getMember(config.gid, quote.addedBy);
        let bottom = quote.show ? `Quote From: ${quote.show} | ` : '';
        bottom += `Brought by: ${member.nickname || member.user.username}`;
        embed.setFooter(footer || bottom);
    }

    return embed;
}

function validate(quote: Quote) {
    if(quote.type) {
        if(quote.quote && quote.author) {
            if(quote.type === "ANIME") {
                return quote.show !== undefined;
            }
            return true;
        }
        return false;
    }
    return false;
}

export class QuoteModule extends Module {
    public name: string = 'quote';
    types: string[] = ['MESSAGE_CREATE','MESSAGE_REACTION_ADD'];
    requires: string[] = ['quote_frequency','quote_channel'];
    man: string[] = [ 
        '***__Quote Module__***\n' +
        `The ${this.name} module is used to ` +
        'add quotes.' //TODO: Add Quote Stuff
    ]

    cache: { [verification: string]: Quote | undefined } = {};
    re: RegExp = /^quote (\w+)[\n ]*([\s\S]*)/;

    verify = async (event: string, data: any, config: GuildConfig) => {
        return event === this.types[1] || 
            await this.cmd(data, this.re, config) !== null;
    };

    run = async (event: string, data: any, config: GuildConfig) => {
        if(event === this.types[1]) {
            // Fetch Reaction
            let eid = data.emoji.id || data.emoji.name;

            // Fetch User
            let user = await getUser(data.user_id);
            if(user.bot) return;

            // Fetch Message
            let msg = await getMessage(data.channel_id, data.message_id);
            if(!msg.embeds || msg.embeds.length < 1) { return; }; // Skip if no Embed

            // Get Embed
            let embed = msg.embeds[0];
            let match = /q-([a-f\d]{6}).*/.exec(embed.footer?.text || '');
            if(embed.footer?.text && match) {
                let qid = match[1];

                if(conf.includes(eid)) {
                    let handler = (<GuildEventHandler> guilds.get(config.gid));
                    let quote = this.cache[qid];
                    if(config.data.quotes) { // Check if exists
                        config.data.quotes.push(quote);
                    } else {
                        config.data.quotes = [ quote ];
                    }
                    // Remove from Cache
                    this.cache[qid] = undefined;

                    // Update Changes
                    handler.config = config;
                    await handler.pushConfig();
                    // Delete Verification Post
                    (await getMessage(data.channel_id, data.message_id)).delete();
                    await send(data.channel_id, `Successfully added Quote (${qid})!`);
                } else if(dism.includes(eid)) {
                    // Remove from Cache
                    this.cache[qid] = undefined;
                    // Delete Verification Post
                    (await getMessage(data.channel_id, data.message_id)).delete();
                    await send(data.channel_id, `Dismissed Quote (${qid})!`);
                }
            } // Skip if not Quote Verification Code
            return;
        }

        let match = await this.cmd(data, this.re, config);
        let keyword = match![1];

        if(create.includes(keyword)) {
            let body: Quote = parseData(match![2]);
            body.addedBy = data.author.id;
            if(!validate(body)) {
                send(data.channel_id, 'Missing a required Property!\nQuote: `type`. `quote`, `author`.\nAnime-Quote: `type`, `quote`, `author` and `show`.');
                return;
            } else {
                let qid = `${randomColor().substr(1)}`;
                this.cache[qid] = <Quote> body;
                (await getMessage(data.channel_id, data.id)).delete();
                let msg = (await send(data.channel_id, (await formatQuote(this.cache[qid]!, config, `q-${qid} | confirm`))!));
                await msg?.react(conf[0]);
                await msg?.react(dism[0]);
            }
        } else if(display.includes(keyword)) {
            if(config.data.quotes && config.data.quotes.length > 0) {
                let quote: MessageEmbed = (await formatQuote(choose(config.data.quotes)!, config))!;
                await send(data.channel_id, quote);
            } else {
                await send(data.channel_id, 'No Quotes found!');
            }
        }
    };

}