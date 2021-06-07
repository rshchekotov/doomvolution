import * as fs from 'fs/promises';
import { PackageInput } from "@/interfaces/package.interface";
import { getMessage, markdown, send } from "@/util/discord.util";
import { choose, weightedChoose } from "@/util/random.util";
import { Package } from "../package";
import { Logger } from '@/services/logger.service';
import { HatchPackage } from './duck/hatch.pkg';
import { InfoPackage } from './duck/info.pkg';
import { PlayPackage } from './duck/play.pkg';
import { FeedPackage } from './duck/feed.pkg';
import { BuyPackage } from './duck/buy.pkg';
import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Duck } from '@/interfaces/duck.interface';
import { BalancePackage } from './duck/balance.pkg';
import { addSchedule, getScheduledFunction, reloadSchedules, timer } from '@/discord/cron-tab';
import { GuildHandler } from '@/util/package.util';

const text = [
    { obj: 'Quack', w: 8 },
    { obj: 'quack', w: 4 },
    { obj: 'QUACK', w: 1 },
];

export class DuckieeeePackage extends Package {
    name: string = 'duckieeee';
    repository: string = 'personal';

    events = ['MESSAGE_CREATE','BOT_READY'];
    triggers = [
        /quack/i,
        /duck (?:pic|photo)/i,
        'duck'
    ];

    subpackage = [
        new HatchPackage(),
        new InfoPackage(),
        new PlayPackage(),
        new FeedPackage(),
        new BuyPackage(),
        new BalancePackage()
    ];

    gallery: string[] = [];
    async loadResources(config: GuildConfig) {
        const raw = await fs.readFile('assets/data/duckieeee.data.json', { encoding: 'utf8' });
        const res = JSON.parse(raw);
        this.gallery = res.pictures;
        Logger.debug(`Added ${this.gallery.length} D*ck pics! You know that it means, duck, right?`);

        for(let owner in config.data.ducks) {
            await growDuck(config, owner);
        }
        reloadSchedules('duckieeee');
    }

    help = async (config?: GuildConfig) => [
        '__***Duckie Package***__\n' +
        'An awesome package dedicated to an awesome person. This package provides ' + 
        'some quacky entertainment and provides the leader of the duck cult with ' +
        'an infinite army of ducks. There are more aspects yet to discover about this. ',
        '**Secret Page**\n' +
        'How did you get here? Uhhmm, yeah... Anyways... maybe you should try typing\n' +
        `\`\`\`\n${config!.prefix}duck hatch\n\`\`\``
    ];

    exec = async (input: PackageInput) => {
        if(input.event === 'BOT_READY') {
            await this.loadResources(input.config);
            return;
        }

        if(input.data.author.id === '761742403685842954') {
            let message = await getMessage(input.data.channel_id, input.data.id);
            if(message) await message.react('🦆');
        }

        if(input.command) {
            let consumed = await this.forward(input);
            if(consumed) return;
            // Handle Command not Found.
            return;
        }

        if((<RegExp> this.triggers[0]).test(input.data.content)) {
            let md = weightedChoose(markdown);
            let txt = weightedChoose(text);
            await send(input.data.channel_id, `${md}${txt}${md}`);
        } else if((<RegExp> this.triggers[1]).test(input.data.content)) {
            await send(input.data.channel_id, choose(this.gallery)!);
        }
    };
}

export function getDuck(config: GuildConfig, author: string): null | Duck {
    if(config.data.ducks && config.data.ducks[author])
        return config.data.ducks[author];
    return null;
}

export async function saveDuck(config: GuildConfig, duck: Duck) {
    let geh = GuildHandler(config.gid)!;
    // Making sure it's not empty!
    geh.config.data.ducks = geh.config.data.ducks || {};
    geh.config.data.ducks[duck.owner] = duck;

    await geh.pushConfig();
}

export async function growDuck(config: GuildConfig, owner: string) {
    let duck: Duck = config.data.ducks[owner];
    if(duck.state >= 6) {
        duck.nextStageAt = new Date(Date.now() + 12*365*24*60*60*1000);
        return;
    } // Skip Grown-Ups
    let days = (1+Math.random()*2) - 3*Math.pow(Math.E,-Math.pow(duck.state-4.5,2))
        + 5 * Math.pow(Math.E,-Math.pow(duck.state-5,2));

    duck.nextStageAt = new Date(Date.now() + days*24*60*60*1000);
    await saveDuck(config, duck);

    addSchedule('duckieeee', owner, timer(days * 24 * 60 * 60), async () => {
        let sduck = getDuck(config, owner)!;
        sduck.state++;
        await saveDuck(config, sduck);
        if(sduck.state >= 6) {
            sduck.nextStageAt = new Date(Date.now() + 12*365*24*60*60*1000);
            return;
        } // Skip Grown-Ups

        let sdays = (1+Math.random()*2) - 3*Math.pow(Math.E,-Math.pow(sduck.state-4.5,2))
            + 5 * Math.pow(Math.E,-Math.pow(sduck.state-5,2));
        
        sduck.nextStageAt = new Date(Date.now() + sdays*24*60*60*1000);

        addSchedule('duckieeee', owner, timer(sdays * 24 * 60 * 60), getScheduledFunction('duckieeee', owner));
    });
}