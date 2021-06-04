import { GuildConfig } from "@/interfaces/guild-config.interface";
import { PackageInput } from "@/interfaces/package.interface";
import { kvSplit } from "@/util/data.util";
import { getMessage, send } from "@/util/discord.util";
import { GuildHandler } from "@/util/package.util";
import { MessageEmbed } from "discord.js";
import { Package } from "../package";
import { dependencies } from "../repository";

export class ConfPackage extends Package {
    name: string = 'conf';
    repository: string = 'core';
    
    events: string[] = ['MESSAGE_CREATE'];
    triggers = ['conf'];
    subpackage = [ ];

    help = async (config?: GuildConfig) => {
        return [
            '***__Conf Package__***\n' +
            'This package provides you with some options to change ' +
            'many bot settings and find out what the settings do! A simple ' +
            'example for this usage would be: ```\n' + config!.prefix +
            'conf public\n```in order to look up what `public` means and: ' +
            '```\n' + config!.prefix + 'conf public="842767814376161290"\n```' +
            'in order to set the option to a value. I will note here, that ' +
            'whenever an ID (e.g.: Channel ID) or Text (e.g.: `welcome`) is ' +
            'expected, you would need to encapsulate the value in speech marks (' +
            '")! If a truth value (such as `true`/`false`, see `nsfw_locked`) is ' +
            'expected, you would leave out those speech marks and simply write ' +
            '`true`/`false`, same with a number, where you would also NOT use ' +
            'the speech marks!\n' +
            'A quite special value is also the `array`, as seen in `emoji_delim`. ' +
            'That one looks like this: `[value-1, value-2, ..., value-n]`. ' +
            'The values themselves are usually either numbers or words and have to ' +
            'be formatted appropriately (as stated above in the section for text and ' +
            'numbers)!'
        ];
    };

    exec = async (input: PackageInput) => {
        if(input.command) {
            if(input.command.param !== '') {
                let d = kvSplit(input.command.param, '=');
                if(d && d.length < 1) {
                    let dep = dependencies[input.command.param];
                    if(dep && dep.type === 'config') {
                        let embed: MessageEmbed = new MessageEmbed();
                        embed.setTitle(`⚙️ ${dep.name}`);
                        embed.setDescription(dep.description);
                        await send(input.data.channel_id, embed);
                    }
                    return;
                }
                let geh = GuildHandler(input.config.gid)!;
                if(['prefix','name'].includes(d[0])) {
                    geh.config[d[0]] = d[1];
                } else geh.config.data[d[0]] = d[1];
                await geh.pushConfig();

                let msg = await getMessage(input.data.channel_id, input.data.id);
                if(!msg) return;
                await msg.react('✅');
                await msg.reply('Successfully set `' + d[0] + '` to `' + d[1] + '`!');
            } else await send(input.data.channel_id, 'You have to provide a `key=value` input!');
        }
    };
}