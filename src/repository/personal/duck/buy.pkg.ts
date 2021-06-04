import { PackageInput } from "@/interfaces/package.interface";
import { Package } from "@/repository/package";
import { send } from "@/util/discord.util";
import { getDuck } from "../duck.pkg";

export class BuyPackage extends Package {
    name: string = 'duck buy';
    repository: string = 'personal';

    events = ['MESSAGE_CREATE'];
    triggers = ['buy'];

    help = async () => [];
    exec = async (input: PackageInput) => {
        let duck = getDuck(input.config, input.data.author.id);
        if(!duck) return true;
        await send(input.data.channel_id, 'The Stores are closed at the moment. Come back later :D!');
        return true;
    };

}