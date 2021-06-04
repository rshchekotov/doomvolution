import * as fs from 'fs/promises';
import { PagedEmbed } from "@/discord/paged.embed";
import { PackageInput, PackageTrigger } from "@/interfaces/package.interface";
import { choose } from "@/util/random.util";
import { Package } from "../package"
import { Logger } from '@/services/logger.service';

export class ComfortPackage extends Package {
    name: string = 'comfort';
    repository: string = 'fun';

    events: string[] = ['MESSAGE_CREATE','BOT_READY'];

    emotions: string[][] = [];
    responses: string[][][] = [];

    triggers: PackageTrigger[] = [
        (input: PackageInput) => {
            let all = this.emotions.flat();
            let match = all.some(str => {
                let re = new RegExp(`(?<!not |un|:\w+|(?:https?:\/\/|www\.)[^ ]+)${str}`,'gi');
                return re.test(input.data.content);
            });

            return match;
        }
    ];

    async loadResources() {
        const raw = await fs.readFile('assets/data/comfort.data.json', { encoding: 'utf8' });
        const res = JSON.parse(raw);
        this.emotions = res.emotions;
        this.responses = res.responses;
        Logger.debug(`Loaded ${res.index.length} Emotions!`);
    }

    help = async () => [
        '***__Comfort package__***\n' +
        `The ${this.name} package as its name implies ` +
        'is there to comfort all the hardworking folks ' +
        'among us with some occasional lovely enccouragement!'
    ];
    exec = async (input: PackageInput) => {
        if(input.event === 'BOT_READY') {
            await this.loadResources();
            return;
        }

        let code = 0;
        
        this.emotions.forEach((emotion, index) => {
            let triggered = emotion.some((trigger) => {
                if(trigger === '') return false;
                let re = new RegExp(`(?<!not |un|:[^ ]*|(?:https?:\/\/|www\.)[^ ]*)${trigger}`,'gi');
                return re.test(input.data.content);
            });
            if(triggered) code += (1 << index);
        });

        let response = (this.responses.length > code) ? choose(this.responses[code]) : [''];
        if(!response || response.toString() === '') return;
        
        await new PagedEmbed('', response).send(input.data.channel_id);
    }
}