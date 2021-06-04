import { PackageInput, PackageTrigger } from "@/interfaces/package.interface";
import { Package } from "@/repository/package";
import { repositories } from "@/repository/repository";
import { send } from "@/util/discord.util";

export class InstallPackage extends Package {
    name: string = 'pkg repo install';
    repository: string = 'core';

    events: string[] = ['MESSAGE_CREATE'];
    triggers: PackageTrigger[] = ['install'];

    help = async () => [];

    exec = async (input: PackageInput) => {
        if(input.command) {
            if(input.command.param !== '') {
                if(Object.keys(repositories).includes(input.command.param)) {
                    if(input.config.repositories.includes(input.command.param)) {
                        await send(input.data.channel_id, 'Repository already added!');
                    } else {
                        await repositories[input.command.param].install(input.config.gid);
                        await send(input.data.channel_id, `Successfully added '${input.command.param}'.`);
                    }
                }
                return true;
            }
        }
        return false;
    };
}