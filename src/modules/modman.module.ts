import { guilds } from "@/app";
import { GuildEventHandler } from "@/events/guild.handler";
import { GuildConfig } from "@/interfaces/guild-config.interface";
import { Module } from "@/interfaces/module.interface";
import { Logger } from "@/services/logger.service";
import { kvSplit } from "@/util/data.util";
import { checkReactions, getMessage, getReaction, getUser, send } from "@/util/discord.util";
import { MessageEmbed } from "discord.js";
import { modules } from ".";

const number = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
const install = ['get', 'install', 'download', 'add', 'i'];
const remove = ['remove', 'uninstall', 'delete', 'rm', 'del'];
const conf = ['set', 'data', 'conf'];
const ls = ['list', 'ls', 'show'];
const search = ['search', 'find'];

export class ModManModule extends Module {
    public name: string = 'modman';
    types: string[] = ['MESSAGE_CREATE','MESSAGE_REACTION_ADD'];
    requires: string[] = [];
    permissions = ['moderator', 'dev'];
    man: string[] = [ 
        '***__Module Manager Module__***\n' +
        `The ${this.name} module is responsible ` +
        'for all modules. This module enables you to ' +
        'search, install and remove modules, in the same ' +
        'fashion you would do it in a Package Manger.\n' +
        'It\'s second function is to configure the bot ' +
        'data. For example the bot-channel is defined ' +
        'through this module. Removing this module is ' +
        'discouraged, but can be used to make the current ' +
        'server settings permanent!',
        '_**Module Search**_\n' +
        'Searches for a Module in the Global Repository.\n' +
        'Syntax: `modman search [package]`\n' +
        `Aliases: ${search.map(cmd => `\`${cmd}\``).join(', ')}\n` +
        '```\n$modman search ready\n```\n' +
        'Note: You can use RegEx if you put it inside a ' +
        'RegEx Literal (e.g.: /.+/) and you can list all, by ' +
        'providing \'all\' as the search parameter!\n' +
        '```\n$modman search /(\\w)a\\1/\n``` ' +
        '```\n$modman search all\n```',
        '_**Install**_\n' +
        'Syntax: `modman install [package1] [package2]`\n' +
        'Installs a Module from the Global Repository.\n' +
        `Aliases: ${install.map(cmd => `\`${cmd}\``).join(', ')}\n` +
        '```\n$modman install ready modman\n```',
        '_**Remove**_\n' +
        'Removes a Module from the Server Configuration.\n' +
        'Syntax: `modman remove [package1] [package2]`\n' +
        `Aliases: ${remove.map(cmd => `\`${cmd}\``).join(', ')}\n` +
        '```\n$modman remove ready\n```', 
        '_**List Installed**_\n' +
        'Lists all installed Modules.\n' +
        'Syntax: `modman list`\n' +
        `Aliases: ${ls.map(cmd => `\`${cmd}\``).join(', ')}\n` +
        '```\n$modman list\n```',
        '_**Configure**_\n' +
        'Sets a configuration option, often required for modules!\n' +
        'Syntax: `modman conf [option]=[value]`\n' +
        `Aliases: ${conf.map(cmd => `\`${cmd}\``).join(', ')}\n` +
        '```\n$modman conf channel="0123456789"\n```'
    ];

    cache: { [msg: string]: { pages: string[], page: number } | undefined } = {};

    re = /^modman (\w+) ?(.*)/;

    verify = async (event: string, data: any, config: GuildConfig) => {
        return event === this.types[1] || ((await this.cmd(data, this.re, config)) !== null);
    };

    run = async (event: string, data: any, config: GuildConfig) => {
        if(event === this.types[0]) {
            if(data.author.bot) return;
            let res = await this.cmd(data, this.re, config);
            let gid = config.gid;
            let handler = (<GuildEventHandler> guilds.get(gid));
            let keyword = res![1];
            
            if(install.includes(keyword)) {
                let packages = res![2].split(/ +/g);
    
                packages.forEach((pkg: string) => {
                    if(!modules[pkg]) {
                        send(data.channel_id, `'${pkg}' was not found!`);
                        return;
                    }
                    let missing = modules[pkg].check(handler.config);
                    let allowed = modules[pkg].private.length === 0 || 
                        modules[pkg].private.includes(config.gid);
    
                    if(!allowed) {
                        send(data.channel_id, `The specified module is private!`);
                    } else if(missing.length !== 0) {
                        send(data.channel_id, `Missing Following Dependencies/Settings: ${missing.join(', ')}`);
                    } else if(config.modules.includes(pkg)) {
                        send(data.channel_id, `${pkg} already installed!`);
                    } else {
                        handler.addConfig(['modules'], pkg, true);
                        send(data.channel_id, `Successfully Installed: ${pkg} ✅`);
                    }
                });
            } else if(conf.includes(keyword)) {
                let confData = kvSplit(res![2], ' ', '=', ':', '>');
                
                if(confData.length === 0) {
                    send(data.channel_id, 'Wrong Syntax! Use:\n`modman set option=value`');
                    return;
                }
    
                let dat = confData[1];
                //Parse Strings correctly:
                if((/[{}\[\]"']*/.exec(dat) === null) && /\D/.exec(dat)) dat = `"${dat}"`;
                Logger.trace(dat);
                let datJSON: any;

                try {
                    datJSON = JSON.parse(dat);
                } catch {
                    send(data.channel_id, `Are you re-tari-ded?`);
                    return;
                }

                handler.setData(confData[0], datJSON);
                send(data.channel_id, `Successfully Set: \`${confData[0]}\` to \`${dat}\``);
    
            } else if(remove.includes(keyword)) {
                let packages = res![2].split(/ +/g);
    
                packages.forEach((pkg: string) => {
                    if(pkg === 'modman' || pkg === 'man') {
                        send(data.channel_id, 
                            'To prevent damage, I will NOT remove ' + pkg +
                            '. If you really want to remove it, please contact ' +
                            'a developer!');
                        return;
                    }
                    let installed = handler.config.modules.includes(pkg);
    
                    if(installed) {
                        handler.config.modules = handler.config.modules.filter(mod => mod !== pkg);
                        handler.pushConfig();
                        send(data.channel_id, `Successfully Removed: ${pkg} ❌`);
                    } else {
                        send(data.channel_id, `Package '${pkg}' not installed. *nothing happened*`);
                    }
                });
            } else if(ls.includes(keyword)) {
                let response = 'Installed Modules:\n' + handler.config.modules.map(mod => `- ${mod}`).join('\n');
                send(data.channel_id, response.substr(0, 2000));
            } else if(search.includes(keyword)) {
                let research = /\/([^/]+)\//.exec(res![2]);
                let term: string | RegExp = (research === null) ? res![2] : new RegExp(research![1]);
                let found: string[] = [];
    
                for(let module in modules) {
                    if(term instanceof RegExp && term.test(module)) {
                        found.push(module);
                    } else if(typeof term === 'string' && module.includes(term) || term === 'all') {
                        found.push(module);
                    }
                }
    
                if(found.length === 0) {
                    send(data.channel_id, `Nothing found for: '${term}'`);
                } else {
                    let results: string[] = [];
                    found.sort((a, b) => a !== b ? a < b ? -1 : 1 : 0);
                    for(let i = 0; i < found.length; i++) {
                        let mod = `- ${found[i]}${ config.modules.includes(found[i]) ? ' [installed]' : '' }\n`;

                        if(i % 10 === 0) results.push(mod);
                        else results[Math.floor(i / 10)] += mod;
                    }
                    
                    let embed = new MessageEmbed()
                        .setTitle('Search Results for \'' + term + '\'')
                        .setDescription(results[0])
                        .setAuthor(`Search${ found.length > 10 ? ` 1/${Math.floor(found.length/10) + 1}` : ''}`, 
                            'https://cdn.discordapp.com/emojis/789210400914145352.png')
                        .setTimestamp()
                        .setFooter(`Found ${found.length} matching modules.`);

                    let msg = await send(data.channel_id, embed);
                    this.cache[msg.id] = { pages: results, page: 0 };

                    await msg.react('❌');
                    for(let i = 0; i < Math.floor((found.length-1)/10)+1; i++)
                        await msg.react(number[i]);
                }
            }
        } else if(event === this.types[1]) {
            // Fetch Reaction
            let eid = data.emoji.id || data.emoji.name;

            // Fetch User
            let user = await getUser(data.user_id);
            if(user.bot) return;

            // Fetch Message
            let msg = await getMessage(data.channel_id, data.message_id);
            if(!msg.embeds || msg.embeds.length < 1) { return; }; // Skip if no Embed

            // Get Embed
            let embed = msg.embeds[0];
            let search = this.cache[msg.id];
            Logger.debug('ID: ' + msg.id);
            if(search) {
                if(number.includes(eid)) {
                    this.cache[msg.id]!.page = number.indexOf(eid);
                    embed.setDescription(search.pages[number.indexOf(eid)])
                        .setAuthor(`Search${ search.pages.length > 1 ? ` ${search.page + 1}/${search.pages.length}` : ''}`, 
                            'https://cdn.discordapp.com/emojis/789210400914145352.png');
                    await msg.edit(embed);
                    
                    let reaction = await getReaction(eid, msg.id, msg.channel.id);
                    await reaction?.remove(data.user_id);
                    Logger.warn('[ModMan] Removing User Reaction');
                    await checkReactions(msg.channel.id, msg.id, ['❌'].concat(number.slice(0, search.pages.length)));
                } else if(eid === '❌') {
                    this.cache[msg.id] = undefined;
                    await msg.delete();
                }
            }
        }
    };
}