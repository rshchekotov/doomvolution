import { PagedEmbed } from "@/discord/paged.embed";
import { GuildConfig } from "@/interfaces/guild-config.interface";
import { PackageInput, PackageTrigger } from "@/interfaces/package.interface";
import { send } from "@/util/discord.util";
import { findPackage, subdata } from "@/util/package.util";
import { Package } from "../package";

export class HelpPackage extends Package {
    name: string = 'help';
    repository: string = 'core';

    events: string[] = ['MESSAGE_CREATE'];

    triggers: PackageTrigger[] = [
        'help'
    ];

    help = async (config?: GuildConfig) => {
        return [
            '__***Help Package***__\n' +
            'You can lookup what a package does, by supplying the ' +
            'package as an argument to this command! You might wanna ' +
            'start with:\n```\n' + config!.prefix + 'help pkg\n```'
        ];
    };

    exec = async (input: PackageInput) => {
        // Only if Command!
        if(input.command) {
            let paged: PagedEmbed | undefined;
            
            // If Empty Command
            if(input.command.param === '') {
                paged = await this.getHelp(input.config);
            } else {
                let pack = input.command.param.split(/ +/g);
                let found = await findPackage(input.config, pack[0], async (pkg, cmp) => pkg.name === cmp);
                if(found && found.length > 0) paged = await found[0].getHelp(input.config);
            }

            if(!paged) paged = new PagedEmbed(`Help | Not Found`, [
                `We searched far and wide and couldn't find '${input.command.param}' ` +
                'in any known repository. Consider adding it yourself or ' + 
                'requesting it in Doom\'s DM\'s! ❤️'
            ]);

            await paged.send(input.data.channel_id);
        }
    };

}