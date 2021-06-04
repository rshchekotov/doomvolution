import { PackageInput, PackageTrigger } from "@/interfaces/package.interface";
import { Package } from "../package"
import { send } from '@/util/discord.util';
import { formatComic, getComic, getRandomComic } from "@/util/xkcd.util";
import { XKCDComic } from "@/interfaces/xkcd.interface";
import { GuildConfig } from "@/db/models/guild-config.model";

export class XKCDPackage extends Package {
    name: string = 'xkcd';
    repository: string = 'fun';

    events: string[] = ['MESSAGE_CREATE'];

    triggers: PackageTrigger[] = [
        'xkcd'
    ];

    help = async (config?: GuildConfig) => [
        '***__XKCD Package__***\n' +
        `The ${this.name} package exists to provide you ` +
        'with awesome web-comics! You can call them using: ' +
        '```\n' + config!.prefix + 'xkcd [id]\n```If you ' +
        'do not provide an id, you will get a random comic ' +
        'instead!'
    ];
    exec = async (input: PackageInput) => {
        if(input.command) {
            let comic: XKCDComic | null = null;
            if(input.command.param === '') {
                comic = await getRandomComic();
            } else {
                let num = parseInt(input.command.param);
                if(!isNaN(num)) {
                    comic = await getComic(num);
                }
            }

            if(comic) {
                let xkcd = formatComic(comic);
                await send(input.data.channel_id, xkcd);
            }
        }
    }
}