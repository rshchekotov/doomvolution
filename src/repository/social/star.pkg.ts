import { PackageInput, PackageTrigger } from "@/interfaces/package.interface";
import { Package } from "../package"
import { getMember, getMessage, getReaction, getUser, send } from '@/util/discord.util';
import { dependencies } from "../repository";
import { GuildHandler } from "@/util/package.util";
import { Message, MessageEmbed } from "discord.js";
import { Logger } from "@/services/logger.service";

const stars = ['⭐', '🤩', '🌠', '🌟'];

interface PinnedMessage {
    author: string;
    content?: string;
    media?: string;
    starred: string[];
    link: string;
}

function makePin(msg: Message, users: string[]) {
    let pin: PinnedMessage = {
        author: msg.author.id,
        starred: users,
        link: `https://discord.com/channels/${msg.guild!.id}/${msg.channel.id}/${msg.id}`
    };

    if(msg.content) pin.content = msg.content;
    if(msg.attachments && msg.attachments.array().length > 0) 
        pin.media = msg.attachments.first()!.url;
    
    return pin;
}

async function formatPin(gid: string, pin: PinnedMessage) {
    let user = await getMember(gid, pin.author);
    let users: string[] = [];
    for(let member of pin.starred) {
        let mem = await getMember(gid, member);
        if(mem) users.push(mem.nickname || mem.user.username);
    }
    let embed = new MessageEmbed()
        .setTitle(`Precious Quote by ${user.nickname || user.user.username}`)
        .setURL(pin.link)
        .addField('Liked by', users.join(', '));
    if(pin.content) embed.setDescription(pin.content);
    if(pin.media) {
        let extension = pin.media.split('.').reverse().shift()!;
        embed.attachFiles([{ attachment: pin.media, name: `media.${extension}` }])
        if(['png','jpeg','jpg','gif'].includes(extension))
            embed.setImage(`attachment://media.${extension}`);
    }
    return embed;
}

export class StarPackage extends Package {
    name: string = 'star';
    repository: string = 'social';

    events: string[] = ['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'];
    dependencies = [ dependencies['star_channel'], dependencies['star_count'] ];
    triggers: PackageTrigger[] = [
        (input: PackageInput) => {
            return stars.includes(input.data.emoji.name);
        }
    ];

    help = async () => [
        '***__Star Package__***\n' +
        `The ${this.name} package allows to vote for 'pins'! ` +
        'Those pins are embeds that will be sent in a specialized ' +
        'channel! To star a message, you can react with ' +
        `one of these default discord emotes: ${stars.join(', ')}`,
        '_**Requirements**_\n' +
        '`star_channel` - the channel for pinned messages\n' +
        '`star_count` - the reaction count for a pin',
    ];

    exec = async (input: PackageInput) => {
        let msg = await getMessage(input.data.channel_id, input.data.message_id);
        if(!msg) return;

        if(!input.config.data.pins) input.config.data.pins = {};

        // Check if Message redirects to a Pin
        if(input.data.channel_id === input.config.data.star_channel &&
            input.event === this.events[0]) {
            for(let pin in input.config.data.pins) {
                if(input.config.data.pins[pin] === msg.id) {
                    let react = await getReaction(input.data.emoji.name, msg.id, msg.channel.id);
                    if(react) await react.remove(input.data.user_id);
                    let warn = await send(input.data.channel_id, `Oi, Bro. You don't react here. Get over to the original message and react there!`);
                    await warn.delete({ timeout: 30*1000 });
                }
            }
        }

        let users: string[] = [];

        let count = 0;
        let countArray: number[] = msg.reactions.cache.array().map(emoji => {
            if(stars.includes(emoji.emoji.name)) {
                let count = 0;
                emoji.users.cache.array().map(user => {
                    if(!users.includes(user.id)) {
                        users.push(user.id);
                        return 1;
                    }
                    return 0;
                }).forEach(val => count += val);
                return count;
            }
            return 0;
        });
        
        if(countArray.length > 0) count = countArray.reduce((accu, cur) => (accu || 0) + (cur || 0))

        if(count >= input.config.data.star_count) {
            let pin = makePin(msg, users);
            let format = await formatPin(input.config.gid, pin);
            
            if(input.config.data.pins[msg.id]) {
                let pinMsg = await getMessage(
                    input.config.data.star_channel, 
                    input.config.data.pins[msg.id]
                );
                if(pinMsg) {
                    await pinMsg.edit(format);
                } else delete input.config.data.pins[msg.id];
            }

            if(!input.config.data.pins[msg.id]) {
                let pinMsg = await send(input.config.data.star_channel, format);
                input.config.data.pins[msg.id] = pinMsg.id;
            }
        } else {
            if(input.config.data.pins[msg.id]) {
                let pinMsg = await getMessage(
                    input.config.data.star_channel, 
                    input.config.data.pins[msg.id]
                );

                if(pinMsg) {
                    await pinMsg.delete();
                } else delete input.config.data.pins[msg.id];
            }
        }

        let geh = GuildHandler(input.config.gid)!;
        geh.config = input.config;
        await geh.pushConfig();
    }
}