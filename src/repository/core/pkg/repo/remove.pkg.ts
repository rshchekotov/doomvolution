import { PackageInput, PackageTrigger } from "@/interfaces/package.interface";
import { Package } from "@/repository/package";
import { repositories } from "@/repository/repository";
import { send } from "@/util/discord.util";

export class RemovePackage extends Package {
    name: string = 'pkg repo remove';
    repository: string = 'core';

    events: string[] = ['MESSAGE_CREATE'];
    triggers: PackageTrigger[] = ['remove'];

    help = async () => [];

    exec = async (input: PackageInput) => {
        if(input.command) {
            if(input.command.param !== '') {
                if(Object.keys(repositories).includes(input.command.param)) {
                    if(input.config.repositories.includes(input.command.param)) {
                        await send(input.data.channel_id, `Successfully removed ${input.command.param}.`);
                        await repositories[input.command.param].remove(input.config);
                    } else {
                        await send(input.data.channel_id, `Repository not added! Nothing changed.`);
                    }
                }
                return true;
            }
        }
        return false;
    };
}