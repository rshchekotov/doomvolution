import { PackageInput } from "@/interfaces/package.interface";
import { Package } from "@/repository/package";
import { send } from "@/util/discord.util";
import { MessageEmbed } from "discord.js";
import { getDuck, saveDuck } from "../duck.pkg";

export class FeedPackage extends Package {
    name: string = 'duck feed';
    repository: string = 'personal';

    events = ['MESSAGE_CREATE'];
    triggers = ['feed'];

    help = async () => [];
    exec = async (input: PackageInput) => {
        let duck = getDuck(input.config, input.data.author.id);
        if(!duck) return true;

        if(duck.state < 5) { 
            await send(input.data.channel_id, 
                'Your duck\'s consuming the nutrients in the egg, in order to become a great healthy duck! ' +
                'Duckie doesn\'t need your help at the moment. Just wait and see how the egg grows!');
            return true;
        }

        let passed = ((new Date().getTime()) - duck.lastFed.getTime()) / (1000 * 60 * 60);
        if(passed < 4) {
            let embed = new MessageEmbed().setTitle('Your Duck is well nurtured. Give it some rest 💗.');

            await send(input.data.channel_id, embed);
            return true;
        }

        if(passed < 48) {
            duck.consective++;
        } else duck.consective = 1;

        duck.value += duck.consective;

        let duckGoddess = input.data.author.id === '761742403685842954';
        if(duckGoddess) duck.consective *= 2;
        duck.lastFed = new Date();

        await saveDuck(input.config, duck);

        let title = duckGoddess ? `After utmost care of the Duck Deity ${duck.name} is well-fed and satisfied.` : 'Duckie\'s peacefully chewing on Grass!';
        let embed = new MessageEmbed().setTitle(title);
        if(duck.state === 5) embed.setImage('https://images.fineartamerica.com/images-medium-large-5/yellow-baby-duck-eating-grass-lynn-langmade.jpg');
        if(duck.state === 6) embed.setImage('https://il1.picdn.net/shutterstock/videos/7285966/thumb/1.jpg');

        await send(input.data.channel_id, embed);

        return true;
    };

}