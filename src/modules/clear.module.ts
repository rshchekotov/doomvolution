import { GuildConfig } from "@/interfaces/guild-config.interface";
import { Module } from "@/interfaces/module.interface";
import { getChannel, send } from "@/util/discord.util";
import { TextChannel } from "discord.js";

export class ClearModule extends Module {
    public name: string = 'clear';
    types: string[] = ['MESSAGE_CREATE'];
    requires: string[] = [];
    permissions = ['dev'];
    man: string = '' + 
    '***__Clear Module__***\n' +
    `The ${this.name} module is an administrative ` +
    'cleaning tool. You\'re not supposed to use it, ' +
    'it\'s limited to developer usage only!'

    re: RegExp = /^clear (\d+)/;

    verify = async (event: string, data: any, config: GuildConfig) => {
        return await this.cmd(data, this.re, config) != null;
    };

    run = async (event: string, data: any, config: GuildConfig) => {
        let count = parseInt((await this.cmd(data, this.re, config))![1]);
        let channel = <TextChannel> (await getChannel(data.channel_id));
        
        if(count > 100) { 
            send(data.channel_id, 'Too Many Messages!');
            return;
        }


        let fetched = await channel.messages.fetch({ limit: count });
        await channel.bulkDelete(fetched);
    };

}