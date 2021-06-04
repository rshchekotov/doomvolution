import { PackageInput, PackageTrigger } from "@/interfaces/package.interface";
import { Package } from "../package"
import { send } from '@/util/discord.util';
import { choose } from "@/util/random.util";

const prefix = [
    `What's good`, `What's up`, `Hey`, `Hello`,
    `Hi`, `How is it going`, `Hola`, `Oiii`,
    `Heya`, `Sup`, `Whazzup`, `Greetings`,
    `Good day`, `Salutations`, `Yo`
];
const postfix = [
    `I'm dad.`, `Relatable!`, `I get that.`
];

export class DadPackage extends Package {
    name: string = 'dad';
    repository: string = 'fun';

    events: string[] = ['MESSAGE_CREATE'];

    triggers: PackageTrigger[] = [
        /(?:^(?:i|l)(?:'|’|`|′)?m|^(?:i|l) am) (.+)/i
    ];

    help = async () => [
        '***__Dad Package__***\n' +
        `The ${this.name} package is more for jokes ` +
        'than for anything else. When enabled it will respond ' +
        "to every message starting with `I'm` and similar with " +
        'the well-known dad answer.'
    ];
    exec = async (input: PackageInput) => {
        let re = <RegExp> this.triggers[0];
        let match = re.exec(input.data.content)!;
        await send(input.data.channel_id, `${choose(prefix)}, ${match[1]}. ${choose(postfix)}`);
    }
}