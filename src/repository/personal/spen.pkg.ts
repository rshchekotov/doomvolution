import { PackageInput } from "@/interfaces/package.interface";
import { getUser, markdown, send } from "@/util/discord.util";
import { choose, weightedChoose } from "@/util/random.util";
import { Package } from "../package";

const text = [
    { obj: 'Meep', w: 8 },
    { obj: 'meep', w: 4 },
    { obj: 'MEEP', w: 1 },
];

const phrases = [
    `Oi <@!322069361852416005>, someone's talkin aboutcha!`,
    `Someone called Tech and Torture Support, <@!322069361852416005>!`
];

export class SpenPackage extends Package {
    name: string = 'spen';
    repository: string = 'personal';

    events = ['MESSAGE_CREATE'];
    triggers = [
        /(?:^| )me+p(?: |$)/i,
        /(?:^| )spe+n+(?:o*|y*)(?:r+ex+)?(?: |$)/i
    ];

    help = async () => [
        '***__Spen Package__***\n' +
        `The ${this.name} package is made for Spenno ` +
        '(Spennorex#1775), who can also be found @' +
        ' https://spennorex.net/. This package is simple, ' +
        "to find out exactly what it does - say 'Meep' :D. " +
        '(You have to have it installed ofc)'
    ];
    exec = async (input: PackageInput) => {
        if((<RegExp> this.triggers[0]).test(input.data.content)) {
            let sur = weightedChoose(markdown);
            let txt = weightedChoose(text);
            await send(input.data.channel_id, `${sur}${txt}${sur}`);
        } else if((<RegExp> this.triggers[1]).test(input.data.content)) {
            let user = await getUser('322069361852416005');
            if(user.presence.status === 'offline') {
                await send(input.data.channel_id, choose(phrases)!);
            }
        }
    };
}