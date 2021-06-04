import * as fs from 'fs/promises';
import { PackageInput, PackageTrigger } from "@/interfaces/package.interface";
import { Package } from "../package"
import { send } from '@/util/discord.util';
import { choose } from "@/util/random.util";
import { Logger } from '@/services/logger.service';
import { MessageEmbed } from 'discord.js';
import { GuildConfig } from '@/interfaces/guild-config.interface';

export class HelloPackage extends Package {
    name: string = 'hello';
    repository: string = 'fun';

    events: string[] = ['MESSAGE_CREATE','BOT_READY'];

    triggers: PackageTrigger[] = [
        'hello'
    ];

    images = [];
    welcomes = [];

    async loadAssets() {
        const raw = await fs.readFile('assets/data/hello.data.json', { encoding: 'utf8' });
        const res = JSON.parse(raw);
        this.images = res.images;
        this.welcomes = res.welcomes;
        Logger.debug(`Loaded ${res.welcomes.length} Welcomes and ${res.images.length} Images!`);
        return;
    }

    check = (input: PackageInput) => {
        let msg = Package.prototype.check.call(this, input);
        if(msg.startsWith('Success')) {
            this.loadAssets();
        }
        return msg;
    }

    help = async (config?: GuildConfig) => [
        '***__Hello Package__***\n' +
        `The ${this.name} package is one way to welcome your buddies!` +
        'Send a greeting with:```\n' + config!.prefix + 
        'hello\n```If you want someone specific to receive it - feel ' + 
        'free to append pings!\n'
    ];
    exec = async (input: PackageInput) => {
        if(input.event === 'BOT_READY') {
            await this.loadAssets();
            return;
        }

        let embed: MessageEmbed = new MessageEmbed()
            .setTitle(choose(this.welcomes)!)
            .setImage(choose(this.images)!);
        await send(input.data.channel_id, embed);
    }
}