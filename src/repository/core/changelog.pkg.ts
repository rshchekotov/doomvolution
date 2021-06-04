import { PagedEmbed } from "@/discord/paged.embed";
import { PackageInput, PackageTrigger } from "@/interfaces/package.interface";
import { Package } from "../package";
import * as fs from 'fs/promises';
import { Changelog } from "@/interfaces/changelog.interface";
import { GuildConfig } from "@/interfaces/guild-config.interface";

export class ChangelogPackage extends Package {
    name: string = 'changelog';
    repository: string = 'core';

    events: string[] = ['MESSAGE_CREATE'];

    triggers: PackageTrigger[] = [
        'changelog'
    ];

    help = async (config?: GuildConfig) => {
        return [
            '***__Changelog Module__***\n' +
            `The ${this.name} module is there to provide ` +
            'you with the information about the change ' +
            'history of this project! You can simply look it ' +
            'up using: ```\n' + config!.prefix +  'changelog\n```!'
        ];
    };

    exec = async (input: PackageInput) => {
        const rawLogs = await fs.readFile('assets/changelog.json', {
            encoding: 'utf8',
        });
        const json: Changelog[] = JSON.parse(rawLogs);
        const pages = json.map(log => {
            return `‡title=Changelog v${log.version} | ${log.title}‡` + 
                `${log.note}` +
                `${log.desc.map(d => `‡❦ ${d.module}:=:${d.desc}‡`).join('')}`;
        });
        await new PagedEmbed('', pages).send(input.data.channel_id);
    };

}