import { guilds } from "@/app";
import { GuildEventHandler } from "@/events/guild.handler";
import { Fact } from "@/interfaces/fact.interface";
import { GuildConfig } from "@/interfaces/guild-config.interface";
import { Module } from "@/interfaces/module.interface";
import { Logger } from "@/services/logger.service";
import { parseData } from "@/util/data.util";
import { getMessage, getReaction, getUser, send } from "@/util/discord.util";
import { randomColor, weightedChoose, WeightedObject } from "@/util/random.util";
import { MessageEmbed } from "discord.js";

const conf = ['✅'];
const dism = ['❌'];
const count = ['count', 'amount', 'length'];
const create = ['create', 'add'];

function printFact(fact: Fact, footer: string) {
    let embed: MessageEmbed = new MessageEmbed()
        .setTitle(fact.fact)
        .setColor(fact.color)
        .setFooter(footer);
    if(fact.image) embed.setImage(fact.image);
    if(fact.url) embed.setURL(fact.url);

    return embed;
}

export class FactModule extends Module {
    public name: string = 'fact';
    types: string[] = ['MESSAGE_CREATE','MESSAGE_REACTION_ADD'];
    requires: string[] = ['channel', 'fact_frequency'];
    permissions = ['dev'];

    man: string[] = [
        '***__Fact Module__***\n' +
        `The ${this.name} module provides ` +
        'the server with custom setup facts. Those facts ' +
        'are intended to be about the server members, but ' +
        'can be anything you would like to pop up after some ' +
        'set amount of messages! This modules provides some commands for the addition of ' +
        'facts.\n *Note: examples on the following pages will use the ' +
        'default prefix. If you will use it on your server, you will ' +
        'need to use the prefix of your server!*',

        '_**Requirements**_\n' +
        'There are 2 requirements for this module to work:\n'+
        '- `channel`: The channel the facts will be sent in.\n' +
        '- `fact_frequency`: amount of msg. after which a fact will be sent.',

        '_**Create Fact**_\n' +
        'Creates a Fact, if required fields are present! As soon ' +
        'as you create a fact, you will have to confirm it\'s validity ' +
        'and only then it will be added to the guild\'s collection of facts!\n' +
        'Syntax: `fact create [data]`\n' +
        `Aliases: ${create.map(cmd => `\`${cmd}\``).join(', ')}\n` +
        '```\n$fact create\n``` ```json\n{\n\t"fact": "Some Fact",\n\t"color": "#990000",\n\t"rarity": "Common",\n\t"chance": 1.0\n}\n\`\`\`',

        '_**Count Facts**_\n' +
        'Prints the Amount of Facts!\n' +
        'Syntax: `fact count`\n' +
        `Aliases: ${count.map(cmd => `\`${cmd}\``).join(', ')}\n` +
        '```\n$fact count\n```',

        '_**Data Syntax**_\n' +
        'The data for the facts can be provided in two formats:\n' +
        '- json\n- toml\nBoth formats are quite easy to use. For standard ' +
        'consumers without programming experience the `toml` format is ' +
        'preferred though. An example for a toml fact datum would be:\n' +
        '```toml\nfact="Simple Fact"\ncolor="#000099"\nrarity="Common"\nchance=1.0\n```\n' +
        'As you can tell, this format is simpler than what you might have seen on page 3, ' +
        'but both work! Note: In both formats you have to put speech marks around _text_ ' +
        'on the right hand side! That does NOT apply to numbers (e.g. `chance`) AND it is ' +
        'highly advised to put the triple backticks in new lines! The first line being for ' +
        'example: "\`\`\`toml" and the last line being "\`\`\`", with nothing in the same line ' +
        'since that could interfere with the parsing logic!',

        '_**Data Options**_\n' +
        'There are some options for the data you can provide for a fact. Some of the ' +
        'options are required, others are optional. The optional ones will be marked ' +
        'with a `?`.\n' +
        '`fact` [text]: text that will appear (max. 256 chars)\n' +
        '`color` [hex]: color in hex format (e.g.: `#aad1ed`)\n' +
        '`rarity` [text]: type of fact (e.g. \'Fun\')\n' +
        '`chance` [number]: higher chance => higher occurence\n' +
        '`image?` [text]: proper image-link (with a [png,jpeg,gif] extension)\n' +
        '`url?` [text]: link that will be activated when you click the title'
    ];

    cache: { [verification: string]: Fact | undefined } = {};

    counter = 0;
    re =/^fact (\w+)[\n ]*([\s\S]*)/;

    verify = async (event: string, data: any, config: GuildConfig) => {
        this.counter++;
        let confirm = event === this.types[1];
        let print = false, interact = false;
        if(!confirm) {
            print = this.counter % config.data.fact_frequency === 0;
            interact = await this.cmd(data, this.re, config) != null;
        }
        return confirm || print || interact;
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
            let match = /f-([a-f\d]{6}).*/.exec(embed.footer?.text || '');
            if(embed.footer?.text && match) {
                let fid = match[1];

                if(conf.includes(eid)) {
                    let handler = (<GuildEventHandler> guilds.get(config.gid));
                    let fact = this.cache[fid];
                    if(config.data.facts) { // Check if exists
                        config.data.facts.push(fact);
                    } else {
                        config.data.facts = [ fact ];
                    }
                    // Remove from Cache
                    this.cache[fid] = undefined;

                    // Update Changes
                    handler.config = config;
                    await handler.pushConfig();
                    // Delete Verification Post
                    (await getMessage(data.channel_id, data.message_id)).delete();
                    await send(data.channel_id, `Successfully added Fact (${fid})!`);
                } else if(dism.includes(eid)) {
                    // Remove from Cache
                    this.cache[fid] = undefined;
                    // Delete Verification Post
                    (await getMessage(data.channel_id, data.message_id)).delete();
                    await send(data.channel_id, `Dismissed Fact (${fid})!`);
                }
            } // Skip if not Fact Verification Code
            return;
        }

        let match = await this.cmd(data, this.re, config);
        if(match) { // Fact Modification
            let keyword = match[1];
            let stripped = data.content.substring(config.prefix.length);

            if(create.includes(keyword)) {
                let raw = match![2];
                let body = parseData(raw);
                
                if(!body) {
                    send(data.channel_id, 'Invalid Syntax! Please use valid JSON/TOML Syntax!');
                    return;
                }

                if(body.fact && body.color && body.chance && body.rarity) {
                    let fid = `${randomColor().substr(1)}`;
                    this.cache[fid] = <Fact> body;
                    (await getMessage(data.channel_id, data.id)).delete();
                    let msg = (await send(data.channel_id, printFact(this.cache[fid]!, `f-${fid} | confirm`)));
                    await msg?.react(conf[0]);
                    await msg?.react(dism[0]);
                } else {
                    Logger.debug(JSON.stringify(body));
                    send(data.channel_id, 'Missing one of required Properties: [fact, color, chance, rarity]');
                }
            } else if(count.includes(keyword)) {
                send(data.channel_id, `Currently there are ${(config.data.facts || []).length} facts.`);
            }
        }
        
        // Fact Print
        if(this.counter % config.data.fact_frequency === 0) {
            let facts: Array<Fact> = config.data.facts;
            if(!facts || facts.length < 1) return;

            let weighted: Array<WeightedObject<Fact>> = facts.map(fact => { return { obj: fact, w: fact.chance }});
            let fact = weightedChoose(weighted)!;
            send(config.data.channel, printFact(fact, `${fact.rarity} Fact #${facts.indexOf(fact)}`));
        }
    };

}