import * as fs from 'fs/promises';
import { EmoteConfig, EmoteConfigModel } from "@/db/models/emote.model";
import { PagedEmbed } from "@/discord/paged.embed";
import { PackageInput } from "@/interfaces/package.interface";
import { Package } from "@/repository/package";
import { send } from "@/util/discord.util";
import { gallery } from "@/util/image.util";
import { partition } from "@/util/package.util";

export class ListPackage extends Package {
    name: string = 'emote list';
    repository: string = 'fun';

    events = ['MESSAGE_CREATE'];
    triggers = ['list'];

    help = async () => [];
    exec = async (input: PackageInput) => {
        let wait = await send(input.data.channel_id, 'Please give this a moment. There are a lot of operations happening to make this work properly, which sometimes ' +
            'results in a waiting time, depending on the amount of emotes available to you. Tip: If you wanna shorten that time: try specific searches ' +
            'instead of opening up all available emotes!');
        // Clean Up Directory
        let dir = await fs.readdir('tmp');
        dir.forEach(async file => {
            await fs.rm(`tmp/${file}`);
        });

        // Pull Sources
        let emotes = await EmoteConfigModel.find({}).lean().exec();

        if(emotes.length > 0) {
            if(input.command!.param !== '') emotes = emotes.filter(e => 
                e.name.toLowerCase().includes(input.command!.param.toLowerCase()));
            
            if(emotes.length === 0) {
                await send(input.data.channel_id, `No Emotes Found!`);
                return true;
            } 
            let pages: Array<Array<EmoteConfig>> = partition(emotes, 16);
            let images = pages.map(page => page.map(emote => emote.url));
            let captions = pages.map(page => page.map(emote => emote.name));
            
            let p: string[] = [];
            for(let i = 0; i < pages.length; i++) {
                let file = await gallery(images[i], captions[i], 4, 80);
                p.push(`‡attach=./tmp/${file}.png‡attachment://${file}.png`);
            }

            let embed = new PagedEmbed(`Emote List (${emotes.length} Emotes)`, p);
            await embed.send(input.data.channel_id);
        } else {
            await send(input.data.channel_id, 'No Emotes registered!');
        }
        await wait.delete();
    };
}