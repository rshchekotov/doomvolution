import { GuildConfig } from "@/interfaces/guild-config.interface";
import { PackageInput } from "@/interfaces/package.interface";
import { Package } from "../package";
import { InstallPackage } from "./pkg/install.pkg";
import { RemovePackage } from "./pkg/remove.pkg";
import { RepoPackage } from "./pkg/repo.pkg";

export class PKGPackage extends Package {
    name: string = 'pkg';
    repository: string = 'core';
    
    events: string[] = ['MESSAGE_CREATE'];
    triggers = ['pkg'];
    subpackage = [
        new RepoPackage(),
        new InstallPackage(),
        new RemovePackage()
    ];

    help = async (config?: GuildConfig) => {
        let p = config!.prefix;
        return [
            '***__PKG Package__***\n' +
            'Since Doomie v3 I retired ModMan, the old module manager ' +
            'and introduced the new `pkg` - package manager. The basic ' +
            'design is still the same. You can install, remove and list ' +
            'packages! The difference... is probably just the name.\n' +
            'Just kidding. This version introduces the concept of folders ' +
            'or in formal language repositories. You can show the available ' +
            'ones using: ```\n' + p + 'pkg repo list\n```Now you have to add ' +
            'repositories in order to add their contents. This is done to ' +
            'allow duplicate names (if the packages are in __different__ ' +
            'repositories and there is only one repo installed!) and also ' +
            'to categorize the modules into groups to prevent paging through ' +
            'the whole package list in order to find what you need!\n' +
            'To List the Contents of a repository the command: ```\n' + p + 
            'pkg repo list [repository]\n```where repository has to be ' +
            'replaced by the repository/folder in question.\n' +
            'Adding and Removing Repositories works simply by: ```\n' + p +
            'pkg repo install [repository]\n``` and ```\n' + p + 'pkg repo remove ' +
            '[repository]\n```' +
            'As soon as a repository is added and you want to install a ' +
            'package you found, you simply use: ```\n' + p + 'pkg install [package]\n```' +
            ' and ```\n' + p + 'pkg remove [package]\n```respectively!'
        ];
    };

    exec = async (input: PackageInput) => {
        if(input.command) {
            let consumed = await this.forward(input);
            if(consumed) return;

            let help = await this.getHelp(input.config);
            await help.send(input.data.channel_id);
        }
    };
}