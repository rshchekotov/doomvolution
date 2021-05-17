import { client } from "@/app";
import { GuildConfig } from "@/interfaces/guild-config.interface";
import { Module } from "@/interfaces/module.interface";
import { Logger } from "@/services/logger.service";
import { getGuild, getMember, getMessage, hookify, send, sendAsHook } from "@/util/discord.util";

function escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function getRegex(config: GuildConfig) {
    return new RegExp(`${escapeRegExp(config.data.emoji_delim[0])}(\\w+)${escapeRegExp(config.data.emoji_delim[1])}(?!\\d{18})`);
}

async function parse(local: string, config: GuildConfig) {
    let pattern = getRegex(config);
    local = local.replace(pattern, (match, p1) => {
        let emote: string = `${p1}`;
        
        client.emojis.cache.array().every(emoji => {
            if(p1 === emoji.name) {
                emote = `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`;
                Logger.debug('' + p1);
                return false;
            } else if(p1.toLowerCase() === emoji.name.toLowerCase() && emote === `${p1}`) {
                emote = `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`;
            }
            return true;
        });

        return emote;
    });

    if(pattern.exec(local)) {
        let res: string;

        try {
            res = await parse(local, config);
        } catch {
            res = local;
            Logger.warn('Almost Crashed (Range Error)');
        }
        return res;
    }
    return local;
}

export class EmoteModule extends Module {
    public name: string = 'emote';
    types: string[] = ['MESSAGE_CREATE'];
    requires: string[] = ["emoji_delim","emote_server"];
    man: string = '' + 
    '***__Emote Module__***\n' +
    `The ${this.name} module allows you to compose messages ` + 
    'as if you\'re a Discord Nitro User! In order for it to work ' +
    'you need to setup 2 emoji_delim characters though.\nThey can ' +
    'be identical or different! An example configuration would be: ' +
    '```\n$modman conf emoji_delim=[":",":"]\n```'

    verify = async (event: string, data: any, config: GuildConfig) => {
        return (!data.webhook_id && !data.author.bot) && 
            (getRegex(config).exec(data.content) !== null || 
            (await this.cmd(data, /emote *(<a?:\w+:\d+>) */, config)) !== null);
    };

    run = async (event: string, data: any, config: GuildConfig) => {
        let create = /emote <(a?):([^:]+):(\d+)>/.exec(data.content.substring(config.prefix.length));
        let use = getRegex(config).exec(data.content);
        let original = await getMessage(data.channel_id, data.id);

        if(create) {
            try {
                Logger.trace(`Create: ${create}, Use: ${use}`);
                let msg = await getMessage(data.channel_id, data.id);
                let server = await getGuild(config.data.emote_server);
                await server.emojis.create(`https://cdn.discordapp.com/emojis/${create[3]}.${create[1] ? 'gif' : 'png'}`, create[2]);
                await msg.react('✅');
            } catch {
                Logger.warn('Something\'s wrong here I can feel it!');
            }
            return;
        } else if(use) {
            Logger.trace(`Create: ${create}, Use: ${use}`);
            let content = await parse(original.content, config);
            await sendAsHook(data.channel_id, await hookify(await getMember(config.gid, data.author.id)), content);
            await original.delete();
        }
    };

}