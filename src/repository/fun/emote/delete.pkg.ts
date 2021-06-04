import { EmoteConfigModel } from "@/db/models/emote.model";
import { PackageInput } from "@/interfaces/package.interface";
import { Package } from "@/repository/package";
import { Logger } from "@/services/logger.service";
import { getGuild, send } from "@/util/discord.util";
import { Guild } from "discord.js";

export class DeletePackage extends Package {
    name: string = 'emote delete';
    repository: string = 'fun';

    events = ['MESSAGE_CREATE'];
    triggers = ['delete'];

    help = async () => [];
    exec = async (input: PackageInput) => {
        if(input.command) {
            let name = input.command.param.split(/ +/g);
            let failed: string[] = [];
            if(name) {
                for(let emote of name) {
                    let doc = await EmoteConfigModel.findOneAndDelete({ name: emote }).exec();
                    if(doc) {
                        let guild: Guild = await getGuild(input.config.gid);
                        let emote = guild.emojis.cache.find(e => e.name === doc!.name);
                        if(emote) await emote.delete();
                        Logger.info(`Removed Emoji ${doc.name}!`);
                    } else {
                        Logger.info(`Couldn't find ${emote}!`);
                        failed.push(emote);
                    }
                }
            }

            if(failed.length < name.length) await send(input.data.channel_id, `Successfully deleted ${name.length-failed.length} emotes!`);
            if(failed.length > 0) await send(input.data.channel_id, `Failed to delete: ${failed}`);
        }
    };
}