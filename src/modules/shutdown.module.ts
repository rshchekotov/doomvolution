import { botDevs, client } from "@/app";
import { GuildConfig } from "@/interfaces/guild-config.interface";
import { Module } from "@/interfaces/module.interface";
import { Logger } from "@/services/logger.service";
import { getMember, getMessage, send } from "@/util/discord.util";
import { choose } from "@/util/random.util";
import * as cp from 'child_process';
import { Message } from "discord.js";

const bye = [
    'logs out!',
    'was terminated.'
];

export class ShutdownModule extends Module {
    public name: string = 'shutdown';
    types: string[] = ['MESSAGE_CREATE'];
    requires: string[] = [];
    man: string = '' + 
    '***__Shutdown Module__***\n' +
    `The ${this.name} module is used in order to shut the ` +
    'bot down. This function is limited to the use of bot ' +
    'developers! Full Shutdown (with no option to boot ' +
    'the bot back up:) ```$shutdown``` Reboot: ' +
    '```$shutdown -r```'

    re: RegExp = /^shutdown ?(-r)?/;

    verify = async (event: string, data: any, config: GuildConfig) => {
        let msg: Message;
        try {
            msg = await getMessage(data.channel_id, data.id);
        } catch {
            Logger.warn('Message already deleted!');
            return false;
        }
        
        return botDevs.includes(msg.author.id) && await this.cmd(data, this.re, config) !== null;
    };

    run = async (event: string, data: any, config: GuildConfig) => {
        let match = await this.cmd(data, this.re, config);
        if(match![1]) {
            Logger.warn('Restarting!');
            await send(data.channel_id, `${(await getMember(config.gid, client.user!.id)).nickname || client.user!.username} ${choose(bye)}`);
            setTimeout(() => {
                process.on('exit', () => {
                    cp.spawn('./launch.sh', [], {
                        cwd: process.cwd(),
                        detached: true,
                        stdio: "inherit"
                    });
                });
                process.exit(0);
            }, 5000);
        } else {
            Logger.warn('Shutting Down!');
            await send(data.channel_id, `${(await getMember(config.gid, client.user!.id)).nickname || client.user!.username} ${choose(bye)}`);
            client.destroy();
            process.exit(0);
        }
    };

}
