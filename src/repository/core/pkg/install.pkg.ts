import { guilds } from "@/app";
import { GuildEventHandler } from "@/events/guild.handler";
import { PackageInput, PackageTrigger } from "@/interfaces/package.interface";
import { Package } from "@/repository/package";
import { send } from "@/util/discord.util";
import { findGlobal } from "@/util/package.util";

export class InstallPackage extends Package {
    name: string = 'pkg install';
    repository: string = 'core';

    events: string[] = ['MESSAGE_CREATE'];
    triggers: PackageTrigger[] = ['install'];

    help = async () => [];

    exec = async (input: PackageInput) => {
        if(input.command) {
            if(input.command.param !== '') {
                let found = await findGlobal(input.config, input.command.param);
                if(found) {
                    let msg = found.check(input);
                    if(msg.startsWith('Success')) {
                        let geh = <GuildEventHandler> guilds.get(input.config.gid);
                        await geh.addConfig(['packages'], found.name, true);
                    }
                    await send(input.data.channel_id, msg);
                } else {
                    await send(input.data.channel_id, `Package '${input.command.param}' was not found!`);
                }
                return true;
            }
        }
        return false;
    };
}