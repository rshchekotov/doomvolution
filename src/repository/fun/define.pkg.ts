import { PagedEmbed } from "@/discord/paged.embed";
import { GuildConfig } from "@/interfaces/guild-config.interface";
import { PackageInput } from "@/interfaces/package.interface";
import { UrbanResult } from "@/interfaces/urban.interface";
import { Logger } from "@/services/logger.service";
import { send } from "@/util/discord.util";
import { searchDefinition } from "@/util/urban.util";
import { MessageEmbed } from "discord.js";
import { Package } from "../package";

export class DefinePackage extends Package {
    name: string = 'define';
    repository: string = 'fun';
    
    events: string[] = ['MESSAGE_CREATE'];
    triggers = ['define','def'];
    subpackage = [ ];

    help = async (config?: GuildConfig) => {
        return [
            '***__Define Package__***\n' +
            `The ${this.name} package is used to ` +
            'define terms using the Urban Dictionary ' +
            'API.',
            '_**Examples**_\n' +
            'The usage is quite simple. To get a defintion ' +
            'for a certain term, you can type: ' +
            '```' + config!.prefix + 'define [term]```'
        ];
    };

    exec = async (input: PackageInput) => {
        if(input.command) {
            if(input.command.param !== '') {
                let term = input.command.param;

                let results: UrbanResult[] | undefined = await searchDefinition(term);
                if(results !== undefined) {
                    let pages = results.map(def => {
                        let title = `‡title=Definition: ${def.word}${term === def.word ? '' : ' (Closest Match)'}‡`;
                        let defs = `:closed_book: **Definition:**\n` + def.definition.split(/[\n\r]+/).map((val) => `\`${val}\``).join('\n');
                        let exmp = `\n\n:scroll: **Examples:**\n` + def.example.split(/[\n\r]+/).map((val, index) => `\`${val}\``).join('\n\n');
                        return title + 
                            ((defs.length < 1024) ? defs : (defs.substr(0, 1020) + '...`')) +
                            ((exmp.length < 1024) ? exmp : (exmp.substr(0, 1020) + '...`'));
                    });
                    if(pages !== undefined && pages.length > 0) await new PagedEmbed('', pages).send(input.data.channel_id, '');
                    else await send(input.data.channel_id, new MessageEmbed().setTitle('Something Failed! Report this, please <3'));
                } else {
                    let embed = new MessageEmbed()
                        .setTitle(`${input.command.param} not found!`)
                        .setDescription('`¯\\_(ツ)_/¯`');
                    await send(input.data.channel_id, embed);
                }
            } else await send(input.data.channel_id, 'You have to provide a term as input!');
        }
    };
}