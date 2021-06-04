import { GuildConfig } from "@/db/models/guild-config.model";
import { Hentai } from "@/interfaces/hentai.interface";
import { PackageInput } from "@/interfaces/package.interface";
import { getChannel, send } from "@/util/discord.util";
import { formatHentai, searchHentai } from "@/util/hentai.util";
import { MessageEmbed, TextChannel } from "discord.js";
import { Package } from "../package";
import { dependencies } from "../repository";

export class SixDigitPackage extends Package {
    name: string = 'sixdigit';
    repository: string = 'animanga';
    
    events: string[] = ['MESSAGE_CREATE'];
    triggers = [
        /(?:^| )s(\d+)(?: |$)/
    ];
    subpackage = [ ];

    dependencies = [ dependencies['nsfw_locked'] ];

    help = async (config?: GuildConfig) => {
        return [
            '***__Six Digit Module__***\n' +
            `The ${this.name} module is there for those familiar ` +
            'with the expression. If you are not, no need to use it.  ' +
            'Just ignore it and continue your peaceful journey of life!\n' +
            'If you are familiar with it, you probably know what to do. ' +
            "For safety's sake, prepend an `s` before the code.\n" +
            'Contrary to the name - all codes from 1 to 6 digits with the ' +
            'given prefix should work. The `nsfw_locked` setting is required ' +
            'and by default `enabled` (set to: `true`), meaning this feature ' +
            ' is exclusive to NSFW Channels! You may disable this by changing ' +
            "the setting to `disabled` (set to: false). Look up `" + config!.prefix + 
            'conf nsfw_locked` for more details!'
        ];
    };

    exec = async (input: PackageInput) => {
        if(input.config.data.nsfw_locked) {
            let channel = <TextChannel> await getChannel(input.data.channel_id);
            if(!channel.nsfw) return;
        }

        let match = (<RegExp> this.triggers[0]).exec(input.data.content);
        let hentai: Hentai | undefined = await searchHentai(match![1]);
        if(!hentai) {
            await send(input.data.channel_id, `Hentai ${match![1]} was not found!`);
            return;
        }
        let formatted: MessageEmbed = formatHentai(hentai, match![1]);
        await send(input.data.channel_id, formatted);
    };
}