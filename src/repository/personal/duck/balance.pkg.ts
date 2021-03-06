import { PackageInput } from "@/interfaces/package.interface";
import { Package } from "@/repository/package";
import { Logger } from "@/services/logger.service";
import { send } from "@/util/discord.util";
import { MessageAttachment, MessageEmbed } from "discord.js";
import { getDuck } from "../duck.pkg";

export class BalancePackage extends Package {
    name: string = 'duck balance';
    repository: string = 'personal';

    events = ['MESSAGE_CREATE'];
    triggers = ['balance','bal'];

    help = async () => [];
    exec = async (input: PackageInput) => {
        let duck = getDuck(input.config, input.data.author.id);
        if(!duck) return true;

        const attachment = new MessageAttachment(`./assets/images/duck/duckcoin.png`, `duckcoin.png`);
        let val = input.data.author.id === '756757056941326397' ? 'Infinite' : duck.value;
        let embed = new MessageEmbed()
            .setTitle(`Thanks to your awesome duckie, you got ${val} Quack Coins`)
            .attachFiles([attachment])
            .setImage('attachment://duckcoin.png');
        await send(input.data.channel_id, embed);
        return true;
    };

}