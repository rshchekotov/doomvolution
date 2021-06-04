import { PackageInput } from "@/interfaces/package.interface";
import { Package } from "@/repository/package";
import { Logger } from "@/services/logger.service";
import { getUser, send } from "@/util/discord.util";
import { MessageAttachment, MessageEmbed } from "discord.js";
import { getDuck } from "../duck.pkg";

export class InfoPackage extends Package {
    name: string = 'duck info';
    repository: string = 'personal';

    events = ['MESSAGE_CREATE'];
    triggers = ['info'];

    help = async () => [];
    exec = async (input: PackageInput) => {
        Logger.debug('DUCK INFO DETECTED');
        let duck = getDuck(input.config, input.data.author.id);
        if(!duck) return true;

        let age = ((new Date().getTime()) - duck.birthday.getTime()) / (1000 * 60 * 60 * 24);
        let user = await getUser(duck.owner);
        let growth = 2 - 3*Math.pow(Math.E,-Math.pow(duck.state-4.5,2))
                    + 5 * Math.pow(Math.E,-Math.pow(duck.state-5,2));

        let image = ['egg_0','egg_1','egg_2','egg_3','egg_4','duck-0_0','duck-1_0'];
        const attachment = new MessageAttachment(`./assets/images/duck/${image[duck.state]}.png`, `duck.png`);
        const embed = new MessageEmbed()
            .setTitle(`${duck.name} | Info`)
            .addFields([
                { 'name': 'Age (Days):', 'value': (Math.round(age*100)/100) },
                { 'name': 'Birthday', 'value': duck.birthday.toLocaleDateString() },
                { 'name': 'Time To Grow', 'value': duck.state < 6 ? (Math.round(growth * 100)/100 + ' Days') : 'Grown Up'},
                { 'name': 'Owner', 'value': user.username },
                { 'name': 'State', 'value': (duck.state < 5) ? 'Egg' : (duck.state === 5) ? 'Duckling' : 'Duck' }
            ])
            .attachFiles([attachment])
            .setImage(`attachment://duck.png`);
        
        await send(input.data.channel_id, embed);
        return true;
    };

}