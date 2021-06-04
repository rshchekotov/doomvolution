import { guilds } from "@/app";
import { GuildEventHandler } from "@/events/guild.handler";
import { PackageInput, PackageTrigger } from "@/interfaces/package.interface";
import { Package } from "@/repository/package";
import { send } from "@/util/discord.util";
import { findGlobal, findPackage } from "@/util/package.util";

export class RemovePackage extends Package {
    name: string = 'pkg remove';
    repository: string = 'core';

    events: string[] = ['MESSAGE_CREATE'];
    triggers: PackageTrigger[] = ['remove'];

    help = async () => [];

    exec = async (input: PackageInput) => {
        if(input.command) {
            if(input.command.param !== '') {
                let found = await findGlobal(input.config, input.command.param);
                if(found) {
                    if(input.config.packages.includes(found.name)) {
                        let geh = <GuildEventHandler> guilds.get(input.config.gid);
                        let pkgs = geh.config.packages.filter(pkg => pkg !== found!.name);
                        await geh.addConfig(['packages'], pkgs, false);
                        await send(input.data.channel_id, `Successfully removed ${found.name}`);
                    } else {
                        await send(input.data.channel_id, 'Package is not installed!');
                    }
                } else {
                    await send(input.data.channel_id, `Package '${input.command.param}' was not found!`);
                }
                return true;
            }
        }
        return false;
    };

}