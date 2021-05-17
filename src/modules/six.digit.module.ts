import { GuildConfig } from "@/interfaces/guild-config.interface";
import { Module } from "@/interfaces/module.interface";
import { getChannel, send } from "@/util/discord.util";
import { formatHentai, searchHentai } from "@/util/hentai.util";
import { Hentai } from '@/interfaces/hentai.interface';
import { MessageEmbed, TextChannel } from "discord.js";
import { Logger } from "@/services/logger.service";

const b0 = [false, 'false', 'no', 'wrong', 'disabled'];
const b1 = [true, 'true', 'yes', 'correct', 'enabled'];

export class SixDigitModule extends Module {
    public name: string = 'sixdigit';
    types: string[] = ['MESSAGE_CREATE'];
    requires: string[] = ['nsfw_locked'];
    man: string = '' + 
    '***__Six Digit Module__***\n' +
    `The ${this.name} module is there for those familiar ` +
    'with the expression. If you are not, no need to use it.  ' +
    'Just ignore it and continue your peaceful journey of life!\n' +
    'If you are familiar with it. You probably know what to do. ' +
    'For Safety\'s sake: Prepend an \'s\' before the code!\n' +
    'Contrary to the name - I made all codes from 1 to 6 digits with ' +
    'the given prefix work! The nsfw_locked setting is required, but ' +
    'if you specify some gibberish (accepted values: true/false, yes/no, ' +
    'correct/wrong, enabled/disabled), then it will always default to ' +
    '\'yes\', meaning that this feature is exclusive to NSFW Channels!'; 

    re: RegExp = /(^| )s(\d{1,6})( |$)/;

    verify = async (event: string, data: any, config: GuildConfig) => {
        return this.re.exec(data.content.toLowerCase()) !== null;
    };

    run = async (event: string, data: any, config: GuildConfig) => {
        let channel = <TextChannel> await getChannel(data.channel_id);
        Logger.debug(`Reached: ${typeof config.data.nsfw_locked}`);
        if((!b0.includes(config.data.nsfw_locked) && channel.nsfw) || b0.includes(config.data.nsfw_locked)) {
            let match = this.re.exec(data.content.toLowerCase());
            let hentai: Hentai | undefined = await searchHentai(match![1]);
            let formatted: MessageEmbed = formatHentai(hentai, match![1]);
            send(data.channel_id, formatted);
        }
    };

}