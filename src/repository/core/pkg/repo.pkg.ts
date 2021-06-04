import { PackageInput, PackageTrigger } from "@/interfaces/package.interface";
import { Package } from "@/repository/package";
import { repositories } from "@/repository/repository";
import { Logger } from "@/services/logger.service";
import { send } from "@/util/discord.util";
import { MessageEmbed } from "discord.js";
import { InstallPackage } from "./repo/install.pkg";
import { ListPackage } from "./repo/list.pkg";
import { RemovePackage } from "./repo/remove.pkg";

export class RepoPackage extends Package {
    name: string = 'pkg repo';
    repository: string = 'core';

    events: string[] = ['MESSAGE_CREATE'];
    triggers: PackageTrigger[] = ['repo'];
    subpackage: Package[] = [
        new ListPackage(),
        new InstallPackage(),
        new RemovePackage()
    ];

    help = async () => [];

    exec = async (input: PackageInput) => {
        if(input.command) {
            let consumed = await this.forward(input);
            if(consumed) return true;

            Logger.debug(`Command: ${JSON.stringify(input.command)}`);
            for(let repo in repositories) {
                let rep = repositories[repo];

                if(input.command.param === rep.name) {
                    let embed: MessageEmbed = new MessageEmbed()
                        .setTitle(`Repository Info | ${rep.name}`)
                        .setDescription(rep.description);
                    await send(input.data.channel_id, embed);
                    return true;
                }
            }
            return false;
        }
    };

}