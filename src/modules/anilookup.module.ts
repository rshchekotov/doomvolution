import { GuildConfig } from "@/interfaces/guild-config.interface";
import { Module } from "@/interfaces/module.interface";
import { Logger } from "@/services/logger.service";
import { aniSearch, formatAniSearch } from "@/util/anilist.util";
import { send } from "@/util/discord.util";

const anisearch = ['anisearch', 'as', 'anilookup', 'alu']; 

export class AniLookupModule extends Module {
    public name: string = 'anilookup';
    types: string[] = ['MESSAGE_CREATE'];
    requires: string[] = [];
    man: string[] = [
        '***__Anime Lookup Module__***\n' +
        `The ${this.name} module has a quite self-explanatory ` +
        'purpose: looking up anime. This Module queries the AniList ' +
        '(GraphQL) API. In simple words: anything that\'s on there ' +
        'should be able to pop up here!',
        '_**Examples**_\n' +
        '```$anilookup Darling in the FranXX```'
    ];

    re: RegExp = /^(\w+) (.+)/;

    verify = async (event: string, data: any, config: GuildConfig) => {
        return (await this.cmd(data, this.re, config)) != null;
    };

    run = async (event: string, data: any, config: GuildConfig) => {
        let match = await this.cmd(data, this.re, config);
        if(anisearch.includes(match![1])) {
            let result = await aniSearch(match![2]);
            await send(data.channel_id, result ? formatAniSearch(result) : 
                `Nothing found for ${match![2]}. Maybe try the Native Name.`);
        }
    };

}