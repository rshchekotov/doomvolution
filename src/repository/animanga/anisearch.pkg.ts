import { GuildConfig } from "@/db/models/guild-config.model";
import { PackageInput } from "@/interfaces/package.interface";
import { aniSearch, formatAniSearch } from "@/util/anilist.util";
import { send } from "@/util/discord.util";
import { Package } from "../package";

export class AniSearchPackage extends Package {
    name: string = 'anisearch';
    repository: string = 'animanga';
    
    events: string[] = ['MESSAGE_CREATE'];
    triggers = ['anisearch'];
    subpackage = [ ];

    help = async (config?: GuildConfig) => {
        return [
            '***__Anime Search Package__***\n' +
            `The ${this.name} package has a quite self-explanatory ` +
            'purpose: **looking up anime**. This pacakge queries the AniList ' +
            "(GraphQL) API. In simple words: anything that's on there " +
            'should be able to pop up here!',
            '_**Examples**_\n' +
            "```\n" + config!.prefix +"anilookup Darling in the FranXX\n```Note: If you didn't" +
            "find the requested Anime, it's either not in the Database or " +
            'you could try the Japanese Title for more accurate matches!',
        ];
    };

    exec = async (input: PackageInput) => {
        if(input.command) {
            if(input.command.param !== '') {
                let term = input.command.param;
                let search = await aniSearch(term);
                if(!search) {
                    await send(input.data.channel_id, `Couldn't find anything for '${term}'`);
                    return;
                }
                let embed = formatAniSearch(search);
                await send(input.data.channel_id, embed);
            } else await send(input.data.channel_id, 'You have to provide a search as input!');
        }
    };
}