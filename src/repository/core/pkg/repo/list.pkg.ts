import { PagedEmbed } from "@/discord/paged.embed";
import { PackageInput, PackageTrigger } from "@/interfaces/package.interface";
import { Package } from "@/repository/package";
import { repositories } from "@/repository/repository";
import { number, partition } from "@/util/package.util";

export class ListPackage extends Package {
    name: string = 'pkg repo list';
    repository: string = 'core';

    events: string[] = ['MESSAGE_CREATE'];
    triggers: PackageTrigger[] = ['list'];

    help = async () => [];

    exec = async (input: PackageInput) => {
        if(input.command) {
            if(input.command.param !== '') {
                let repo = repositories[input.command.param];
                if(repo) { 
                    await repo.list(input.config).send(input.data.channel_id);
                    return true;
                }
            } else {
                let repos = Object.keys(repositories);
                let parts: string[] = partition(repos, 10).map(page => {
                    return page.map((repo, index) => `${number[index]}  ` +
                        repo + (input.config.repositories.includes(repo) ? ' [installed]' : '')).join('\n')
                });
                await new PagedEmbed('Repository List', parts).send(input.data.channel_id);
                return true;
            }
        }
    };

}