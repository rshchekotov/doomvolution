import { GuildConfig } from "@/interfaces/guild-config.interface";
import { PackageInput } from "@/interfaces/package.interface";
import { getMessage, send } from "@/util/discord.util";
import { MessageEmbed } from "discord.js";
import { Package } from "../package";

export class PingPackage extends Package {
    name: string = 'ping';
    repository: string = 'core';
    
    events: string[] = ['MESSAGE_CREATE'];
    triggers = ['ping'];
    subpackage = [ ];

    help = async (config?: GuildConfig) => {
        return [
            '***__Ping Package__***\n' +
            `The ${this.name} package exists in order ` +
            'to test the latency or simply to see if the ' +
            'bot is online!\nUsage:```\n' + config!.prefix +
            'ping\n```'
        ];
    };

    exec = async (input: PackageInput) => {
        if(input.command) {
            let original = await getMessage(input.data.channel_id, input.data.id);
            if (!original || original.author.bot) return;
            let embed: MessageEmbed = new MessageEmbed();
            embed.setTitle('Computing Latency...');
            embed.setImage('https://i.ytimg.com/vi/pm4wzdYhOAo/maxresdefault.jpg');
            let msg = await send(input.data.channel_id, embed);
            embed.setTitle(`Latency: ${msg.createdTimestamp - original.createdTimestamp}ms`);
            embed.setImage(`https://i.pinimg.com/originals/50/89/a9/5089a9a36884bb90e14312d3af951317.gif`);
            await msg.edit(embed);
        }
    };
}