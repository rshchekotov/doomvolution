import { guilds } from "@/app";
import { GuildEventHandler } from "@/events/guild.handler";
import { GuildConfig } from "@/interfaces/guild-config.interface";
import { PackageInput } from "@/interfaces/package.interface";
import { Package } from "@/repository/package";
import { repositories } from "@/repository/repository";
import { Logger } from "@/services/logger.service";
import { getUser } from "./discord.util";

export function GuildHandler(gid: string): GuildEventHandler | null {
    return <GuildEventHandler> guilds.get(gid);
}

export function makePackageInput(event: string, data: any, config: GuildConfig): PackageInput {
    let input: PackageInput = { event: event, data: data, config: config };
    if(['MESSAGE_CREATE','MESSAGE_UPDATE'].includes(input.event)) {
        if(data.content && data.content.startsWith(config.prefix)) {
            let raw: string = data.content.substr(config.prefix.length);
            let pair = (raw.indexOf(' ') !== -1);

            let keyword = pair ? raw.substr(0,raw.indexOf(' ')) : raw;
            let param = pair ? raw.substr(raw.indexOf(' ') + 1) : '';
            input.command = { keyword: keyword, param: param };
        }
    }
    return input;
}

export async function byBot(type: 'message' | 'reaction', data: any) {
    if(type === 'message') {
        return data.webhook_id || !data.author || data.author.bot;
    } else {
        return (await getUser(data.user_id)).bot;
    }
}

export async function findGlobal(config: GuildConfig, pkg: string) {
    for(let repo of config.repositories) {
        if(Object.keys(repositories).includes(repo)) {
            let p = repositories[repo].search(pkg);
            if(p) return p;
        } else {
            Logger.debug(`Error! Illegal Repository! ${repo} not in ${Object.keys(repositories)}`);
        }
    }
    return undefined;
}

export async function findPackage(config: GuildConfig, fd: any, filter: (pkg: Package, cmp: any) => Promise<boolean>) {
    let found: Package[] = [];
    config.packages.every(async pkg => {
        return config.repositories.every(async repo => {
            let repository = repositories[repo];
            let pack = repository.search(pkg);
            if(pack && (await filter(pack, fd))) {
                found.push(pack);
                return false;
            }
            return true;
        });
    });

    return found;
}

export function partition(array: any[], size: number) {
    let partitions: any[][] = [];
    array.forEach((data, index) => {
        if(index % size === 0) partitions.push([]);
        partitions[partitions.length-1].push(data);
    });
    return partitions;
}

export function subdata(input: PackageInput) {
    if(!input.command) return input;
    else {
        let sub = input.command.param;
        let pair = (sub.indexOf(' ') !== -1);

        let keyword = pair ? sub.substr(0,sub.indexOf(' ')) : sub;
        let param = pair ? sub.substr(sub.indexOf(' ') + 1) : '';
        input.command = { keyword: keyword, param: param };
        return input;
    }
};

export function escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const number = [
    '1️⃣','2️⃣','3️⃣','4️⃣','5️⃣',
    '6️⃣','7️⃣','8️⃣','9️⃣','🔟'
];