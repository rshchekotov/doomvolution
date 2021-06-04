import { GuildConfig } from "@/db/models/guild-config.model";
import { PagedEmbed } from "@/discord/paged.embed";
import { PackageDependency, PackageInput, PackageTrigger } from "@/interfaces/package.interface";
import { Logger } from "@/services/logger.service";
import { byBot, subdata } from "@/util/package.util";

export abstract class Package {
    abstract name: string;
    abstract repository: string;
    
    events: string[] = [];
    triggers: PackageTrigger[] = [];
    private: string[] = [];
    permissions: string[] = [];
    subpackage: Package[] = [];
    dependencies: PackageDependency[] = [];

    abstract help: (config?: GuildConfig) => Promise<string[]>;
    abstract exec: (input: PackageInput) => Promise<any>;
    
    getHelp = async(config: GuildConfig) => {
        // TODO: Append SubPackage Help Pages!
        // TODO: Append Requirements Page!
        return new PagedEmbed(`Help | ${this.name}`, await this.help(config));
    };

    check(input: PackageInput) {
        let msg = '';
        if(this.private.length > 0 && !this.private.includes(input.config.gid))
            return 'Cannot install private Package on this Server!';
        if(input.config.packages.includes(this.name))
            return 'Package already installed!';
        this.dependencies.forEach(dep => {
            if(dep.type === 'config') {
                let bool = Object.keys(input.config.data).includes(dep.name);
                if(!bool) msg += `, ⚙️ ${dep.name}`;
                return bool;
            } else if(dep.type === 'module') {
                let bool = input.config.packages.includes(dep.name);
                if(!bool) msg += `, 💾 ${dep.repository}/${dep.name}`;
                return bool;
            }
        });
        return !msg.startsWith(', ') ? `Successfully installed '${this.name}'` : 
            `You\'re missing: ${msg.substr(2)}`;
    }

    verify = async (input: PackageInput) => {
        if(!this.events.includes(input.event))
            return false;
        
        // Text-Based Events!
        if(['MESSAGE_CREATE','MESSAGE_UPDATE'].includes(input.event)) {
            if(await byBot('message', input.data)) return false;
        
            let verification = (input.command) ? 
                [input.command.keyword, input.data.content.substring(input.config.prefix.length)] : 
                [input.data.content, input.data.content];

            return this.triggers.some(trigger => {
                if(typeof trigger === 'string') {
                    return verification[0] === trigger;
                } else if(trigger instanceof RegExp) {
                    return trigger.test(verification[1]);
                } else {
                    return trigger(input);
                }
            });
        }

        // Leave it to the Dev to handle!
        return true;
    };

    forward = async (pkgin: PackageInput) => {
        let input = Object.assign({}, pkgin);
        if(!input.command) return false;
        if(input.command.param !== '') {
            Logger.debug(`${JSON.stringify(input.command)}`);
            let subinput = subdata(input);
            Logger.debug(`=> ${JSON.stringify(subinput.command)}`);
            for(let sub of this.subpackage) {
                if(await sub.verify(subinput)) {
                    let res = await sub.exec(subinput);
                    if(res) return true;
                }
            }
        }
        return false;
    };
}