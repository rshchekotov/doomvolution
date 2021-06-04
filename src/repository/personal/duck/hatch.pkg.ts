import { addSchedule, getScheduledFunction, reloadSchedules, timer } from "@/discord/cron-tab";
import { Duck } from "@/interfaces/duck.interface";
import { PackageInput } from "@/interfaces/package.interface";
import { Package } from "@/repository/package";
import { send } from "@/util/discord.util";
import { GuildHandler } from "@/util/package.util";
import { Message } from "discord.js";
import { getDuck, growDuck, saveDuck } from "../duck.pkg";

export class HatchPackage extends Package {
    name: string = 'duck hatch';
    repository: string = 'personal';

    events = ['MESSAGE_CREATE'];
    triggers = ['hatch'];

    help = async () => [];
    exec = async (input: PackageInput) => {
        let duck = getDuck(input.config, input.data.author.id);
        if(duck) {
            await send(input.data.channel_id, `Don't be greedy! Raise ${duck.name} properly first!`);
            return true;
        }

        if(!input.command) return;
        
        let name: string;
        if(/^ *$/.test(input.command.param)) {
            let msg = await send(input.data.channel_id, 'Please name your Duck! Be careful with the name decision, a name\'s given for a lifetime!');
            name = (await msg.channel.awaitMessages((m: Message) => {
                return input.data.author.id === m.author.id;
            }, { max: 1 })).first()!.content;
        } else {
            name = input.command.param;
        }

        duck = {
            name: name,
            birthday: new Date(),
            owner: input.data.author.id,
            state: 0,
            kind: 0,
            lastFed: new Date(),
            lastPlayed: new Date(),
            consective: 0,
            value: 1
        };

        let geh = GuildHandler(input.config.gid)!;
        // Making sure it's not empty!
        geh.config.data.ducks = geh.config.data.ducks || {};
        geh.config.data.ducks[input.data.author.id] = duck;
        await geh.pushConfig();

        await send(input.data.channel_id, 'You started the Hatching Process! ' +
            `Watch your progress with \`${input.config.prefix}duck info\` other available actions, apart from \`info\` are ` +
            `\`feed\`, \`play\`, \`balance\` and \`buy\`!`);
        
        // Add Duck Grow Up Schedule!
        await growDuck(geh.config, duck.owner);
        reloadSchedules();

        return true;
    };
}