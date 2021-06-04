import { client } from "@/app";
import { EmoteConfig, EmoteConfigModel } from "@/db/models/emote.model";
import { Emote, ErrorEmote } from "@/interfaces/emote.interface";
import { GuildConfig } from "@/interfaces/guild-config.interface";
import { PackageInput, PackageTrigger } from "@/interfaces/package.interface";
import { Logger } from "@/services/logger.service";
import { getGuild, getMessage, hookify, sendAsHook } from "@/util/discord.util";
import { escapeRegExp } from "@/util/package.util";
import { Package } from "../package"
import { dependencies } from "../repository";
import { CreatePackage } from "./emote/create.pkg";
import { DeletePackage } from "./emote/delete.pkg";
import { ListPackage } from "./emote/list.pkg";

export class EmotePackage extends Package {
    name: string = 'emote';
    repository: string = 'fun';

    dependencies = [ 
        dependencies['emoji_server'],
        dependencies['emoji_delim']
    ];

    events: string[] = ['MESSAGE_CREATE','BOT_READY'];

    triggers: PackageTrigger[] = [
        'emote'
    ];

    subpackage: Package[] = [
        new ListPackage(),
        new CreatePackage(),
        new DeletePackage()
    ];

    /**
     * Gets the Guild-Emoji RegEx for use in Emoji Detection.
     * @param config Guild Configuration
     * @returns Regular Expression with Custom Emoji Delimiters
     */
    getRegex(config: GuildConfig) {
        let delim = config.data.emoji_delim.map(escapeRegExp);
        return new RegExp(`(?<!<a?)${delim[0]}(\\w+)${delim[1]}(?!\\d{18}>)`);
    }

    check = (input: PackageInput) => {
        let msg = Package.prototype.check.call(this, input);
        if(msg.startsWith('Success')) {
            loadEmotes(input.config);
        }
        return msg;
    }

    help = async (config?: GuildConfig) => [
        '***__Emote Package__***\n' +
        `This package might be a favorite to some people! ` +
        `I reached the ultimate goal - allowing people to use ` +
        `Nitro Emotes AND have an unlimited amount of emote slots!\n` +
        'After specifying an `emote_server`, where all the emotes will ' +
        'be added to you can create emotes, list emotes and remove those! ' +
        'You can create emotes with: ```\n' + config!.prefix + 
        'emote create [link] [name]\n```You can remove emotes with: ```\n' + config!.prefix + 
        'emote delete [name]\n```Important Note for the Addition of Emotes: ' +
        'Emotes ONLY get accepted if they end with a valid image extension, those being ' +
        'png, jpg, jpeg and gif, if there\'s something after those extensions ' +
        'the emote will not be able to be added!\n' +
        'Lastly, you can list all emotes with ```\n' + config!.prefix + 'emote list\n```' +
        'For this particular one I\'d ask you to be patient since there\'s ' +
        'a lot of mechanical stuff in the back making this possible, which takes it\'s time. ' +
        'In order to filter the list using a specific search query, just append it on the back like so: ' +
        '```\n' + config!.prefix + 'emote list [search]\n```'
    ];

    exec = async (input: PackageInput) => {
        // Initialization
        if(input.event === 'BOT_READY') {
            loadEmotes(input.config);
            this.triggers.push(this.getRegex(input.config));
            return;
        }

        if(input.command) {
            let consumed = await this.forward(input);
            if(consumed) return;
            // Handling
            return;
        }

        let match: RegExpExecArray | null;

        // Search-and-Replace Loop
        while(this.getRegex(input.config).test(input.data.content)) {
            match = this.getRegex(input.config).exec(input.data.content)!;
            Logger.debug('Match: ' + match[0]);
            Logger.trace('Text: ' + input.data.content);

            let found = await EmoteConfigModel.findOne({ "name": match[1] });
            let emo: Emote;
            if(found && found.deleted) emo = await recallEmote(input.config, found);

            input.data.content = input.data.content.replace(this.getRegex(input.config), (m, p1) => {
                if(found) {
                    if(!found.deleted) {
                        emo = new Emote(found.animated, found.author, found.createdAt, 
                            found.deleted, found.guild, found.eid, found.name, found.url);
                    }
                    return emo.getEmoji();
                } else {
                    return `(*insert ${p1}*)`;
                }
            });

            if(input.data.content.length > 2000) {
                Logger.error('Bailed Out. Message Too Long!');
                return;
            }
        }

        // Send Hookified Message and Delete Original.
        let msg = await getMessage(input.data.channel_id, input.data.id);
        if(!msg) return;

        await sendAsHook(msg.channel.id, await hookify(msg.member!), input.data.content);
        await msg.delete();

        
    }
}

/**
 * Deletes the Emote from the Emoji Server. Usually
 * used to make place for new / other emojis!
 * @param config Guild Configuration
 * @param emote The Emote to Forget
 */
export async function forgetEmote(config: GuildConfig, emote: EmoteConfig) {
    let server = await getGuild(config.data.emoji_server);
    let emoji = server.emojis.cache.find((e, i) => {
        return emote.name === e.name && emote.eid === i;
    });

    if(!emoji) {
        Logger.debug(`Emoji not found. Likely registered in other Guild!`);
        return;
    }

    await emoji.delete();
    await EmoteConfigModel.findOneAndUpdate(
        { name: emote.name, eid: emote.eid }, 
        { "deleted": true, "eid": "-" }
    ).exec();
}

/**
 * Recalls an Emote from the Database into the Emoji Server
 * @param config Guild Configuration
 * @param emote The Emote to Recall from the Database
 */
export async function recallEmote(config: GuildConfig, emote: EmoteConfig) {
    let server = await getGuild(config.data.emoji_server);
    let emoji = { id: emote.eid };

    if(emote.deleted) {
        while(server.emojis.cache.array().length > 40) {
            let e = server.emojis.cache.first()!;
            let ef = await EmoteConfigModel.findOne({
                "name": e.name,
                "eid": e.id
            }).exec();
            if(!ef) return ErrorEmote; // If not found. Bail out.
            await forgetEmote(config, ef);
        }
        
        emoji = await server.emojis.create(emote.url, emote.name);

        await EmoteConfigModel.findOneAndUpdate(
            { name: emote.name }, 
            { "deleted": false, "eid": emoji.id }
        ).exec();
    }

    return new Emote(emote.animated, emote.author, emote.createdAt, 
        false, emote.guild, emoji.id, emote.name, emote.url);
}

/**
 * Loads all the client-cached emoji's into the 
 * database for reusability!
 * @param config Guild Configuration
 */
export async function loadEmotes(config: GuildConfig) {
    // Register all Cached Emoji's into the DB!
    client.emojis.cache.forEach(async emote => {
        let found = await EmoteConfigModel.find(
            { "name": emote.name }
        ).exec();

        // If not found yet!
        if(found.length < 1) {
            // Won't add Same Names, different ID's!
            Logger.debug(`Added ${emote.name} to Database!`);
            await EmoteConfigModel.create({
                "guild": config.gid,
                "name": emote.name,
                "url": emote.url,
                "animated": emote.animated,
                "author": config.data.user_id,
                "createdAt": emote.createdAt,
                "deleted": emote.deleted,
                "eid": emote.id
            });
        }
    });
}