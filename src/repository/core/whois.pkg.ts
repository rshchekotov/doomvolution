import { PackageInput, PackageTrigger } from "@/interfaces/package.interface";
import { Package } from "../package"
import { getAvatar, getMessage, send } from '@/util/discord.util';
import { MessageEmbed } from "discord.js";
import { GuildConfig } from "@/interfaces/guild-config.interface";

export class WhoIsPackage extends Package {
    name: string = 'whois';
    repository: string = 'core';

    events: string[] = ['MESSAGE_CREATE'];

    triggers: PackageTrigger[] = [
        'whois'
    ];

    help = async (config?: GuildConfig) => [
        '__***Who Is Package***__\n' +
        'Who\'s Joe you ask? It\'s Spen\'s Dog and to prevent such questions ' +
        'in the future there is this package to find you some basic information ' +
        'about a Guild Member. Simply type `' + config!.prefix + 'whois [ping]` ' +
        'and replace the `[ping]` with an actual member ping!'
    ];
    exec = async (input: PackageInput) => {
        if(input.command) {
            let msg = await getMessage(input.data.channel_id, input.data.id);
            if(msg && msg.mentions.members && msg.mentions.members.array().length > 0) {
                let member = msg.mentions.members.first()!;
                let name = member.nickname || member.user.username;

                let embed = new MessageEmbed()
                    .setTitle(`Who is '${name}'?`)
                    .setImage(getAvatar(member.user))
                    .addFields([
                    { name: 'User ID', value: member.id },
                    { name: 'Tag', value: member.user.tag, inline: true },
                    {
                        name: 'Bot',
                        value: member.user.bot || member.user.system ? 'Yep' : 'Nope',
                        inline: true
                    },
                    {
                        name: 'Exists Since',
                        value: new Date(member.user.createdTimestamp).toLocaleString(),
                    },
                    { name: 'Color', value: member.displayHexColor },
                    { name: 'Availability', value: member.presence.status, inline: true },
                    { name: 'Status', value: member.presence.activities[0] || 'None.', inline: true },
                    ])
                    .setURL(`https://discord.com/channels/@me/${member.id}`)
                    .setFooter(
                    `requested by ${msg.member!.nickname || msg.author.username}`
                    )
                    .setTimestamp()
                await send(msg.channel.id, embed);
            }
        }
    }
}