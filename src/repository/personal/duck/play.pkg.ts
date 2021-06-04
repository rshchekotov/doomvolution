import { Duck } from "@/interfaces/duck.interface";
import { PackageInput } from "@/interfaces/package.interface";
import { Package } from "@/repository/package";
import { getMessage, send } from "@/util/discord.util";
import { GuildHandler } from "@/util/package.util";
import { MessageEmbed } from "discord.js";
import { getDuck, saveDuck } from "../duck.pkg";

export class PlayPackage extends Package {
    name: string = 'duck play';
    repository: string = 'personal';

    events = ['MESSAGE_CREATE'];
    triggers = ['play'];

    help = async () => [];
    exec = async (input: PackageInput) => {
        let duck = getDuck(input.config, input.data.author.id);
        if(!duck) return true;

        let applicable = async (duck: Duck) => {
            if(duck.state < 5) return 1;
            let passed = ((new Date().getTime()) - duck.lastPlayed.getTime()) / (1000 * 60 * 60);
            if(passed < 4) return 2;
            return 0;
        };

        let code = await applicable(duck);

        if(code === 1) {
            let embed = new MessageEmbed()
            .setTitle('You don\'t play with Eggs!')
            .setImage('https://i1.wp.com/decider.com/wp-content/uploads/2021/01/wonder-egg-priority.jpg');
            await send(input.data.channel_id, embed);
        } else if(code === 2) {
            let embed = new MessageEmbed()
                .setTitle('Duckiee\'s tired!')
                .setDescription('You can play with your duck only once in 4 hours, please wait a bit!');

            if(duck.state === 5) embed.setImage('https://i.redd.it/4bw6cdfy3bi41.jpg');
            if(duck.state === 6) embed.setImage('https://farm1.staticflickr.com/51/124652329_83bf315f6d_z.jpg');

            await send(input.data.channel_id, embed);
        }

        if(code !== 0) return;

        duck.consective++;
        duck.value += duck.consective;
        
        let msg = await getMessage(input.data.channel_id, input.data.id);
        let interacted = 0;
        if(msg && msg.mentions && msg.mentions.users.array().length > 0) {
            for(let user of msg.mentions.users.array()) {
                let oduck = getDuck(input.config, user.id);
                if(oduck) {
                    let ocode = await applicable(oduck);
                    if(ocode === 0) {
                        // You can't Play Date a Higher Value Duck (to prevent farming)
                        if(oduck.consective < duck.consective) {
                            oduck.value += (oduck.consective + duck.consective);
                            oduck.lastPlayed = new Date();
                            await saveDuck(input.config, oduck);
                            interacted++;
                        } else {
                            await send(input.data.channel_id, `Can't play with ${oduck.name} (owned by: ${user.username}). They have a higher streak than you.`);
                            await send(input.data.channel_id, `https://media1.tenor.com/images/1973ca779fa83525890dd1ab2a423689/tenor.gif`);
                        }
                    } else {
                        await send(input.data.channel_id, `${oduck.name} is resting, try again later!`);
                    }
                } else {
                    await send(input.data.channel_id, `${user.username} doesn't own a duck q.q! Maybe you could convince them!`);
                }
            }
        }

        await send(input.data.channel_id, interacted === 0 ? '*Playing alone*.' : `${interacted + 1} ducks play together! How wonderful.`);
        duck.value += duck.consective;
        duck.lastPlayed = new Date();

        await saveDuck(input.config, duck);
        await send(input.data.channel_id, 'https://tenor.com/view/dancing-duck-dance-gif-21293093');

        return true;
    };

}