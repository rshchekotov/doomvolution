import { PackageInput } from "@/interfaces/package.interface";
import { getChannel, send } from "@/util/discord.util";
import { TextChannel } from "discord.js";
import { Package } from "../package";

export class ClearPackage extends Package {
    name: string = 'clear';
    repository: string = 'core';
    
    events: string[] = ['MESSAGE_CREATE'];
    triggers = ['clear'];
    subpackage = [ ];

    help = async () => {
        return [
            '***__Clear Module__***\n' +
            `The ${this.name} module is an administrative ` +
            "cleaning tool **reserved** for developer usage only."
        ];
    };

    exec = async (input: PackageInput) => {
        if(input.command) {
            if(input.command.param !== '') {
                let num = parseInt(input.command.param);
                if(!isNaN(num)) {
                    let chan = <TextChannel> await getChannel(input.data.channel_id);
                    let fetched = await chan.messages.fetch({ limit: num + 1 });
                    await chan.bulkDelete(fetched);
                } else await send(input.data.channel_id, 'Invalid Input!');
            } else await send(input.data.channel_id, 'You have to provide a number as input!');
        }
    };
}