import { GuildConfig } from "@/interfaces/guild-config.interface";
import { Module } from "@/interfaces/module.interface";
import { send } from "@/util/discord.util";
import { formatComic, getComic, getRandomComic } from "@/util/xkcd.util";

export class XKCDModule extends Module {
    public name: string = 'xkcd';
    types: string[] = ['MESSAGE_CREATE'];
    requires: string[] = [];
    man: string = '' + 
    '***__XKCD Module__***\n' +
    `The ${this.name} module exists to provide you ` +
    'with awesome web-comics! You can call them using: ' +
    '```$xkcd [id]```'

    re: RegExp = /^xkcd (random|[\d]+)/;

    verify = async (event: string, data: any, config: GuildConfig) => {
        return await this.cmd(data, this.re, config) !== null;
    };

    run = async (event: string, data: any, config: GuildConfig) => {
        let match = await this.cmd(data, this.re, config);

        if(match![1] === 'random') {
            let comic = await getRandomComic();
            if(comic) send(data.channel_id, formatComic(comic));
            else send(data.channel_id, 'Something went wrong there!');
        } else {
            let comic = await getComic(Number(match![1]));
            if(comic) send(data.channel_id, formatComic(comic));
            else send(data.channel_id, 'Something went wrong there!');
        }
    };

}