import { EmoteConfig, EmoteConfigModel, getEmote } from "@/db/models/emote.model";
import { Emote } from "@/interfaces/emote.interface";
import { PackageInput } from "@/interfaces/package.interface";
import { Package } from "@/repository/package";
import { Logger } from "@/services/logger.service";
import { getGuild, getMessage, send } from "@/util/discord.util";
import { forgetEmote, loadEmotes } from "../emote.pkg";

export class CreatePackage extends Package {
    name: string = 'emote create';
    repository: string = 'fun';

    events = ['MESSAGE_CREATE'];
    triggers = ['create'];

    help = async () => [];
    exec = async (input: PackageInput) => {
        if(input.command) {
            let link = /https?:\/\/[^ ]+\.(?:png|jpe?g|gif)/.exec(input.command.param);
            if(link) {
                let name = /\w+/.exec(input.command.param.replace(link[0], ''));
                if(name) {
                    let reserved = await EmoteConfigModel.findOne({ name: name[0] });
                    if(reserved) {
                        await send(input.data.channel_id, `Could not add Emote. '${name[0]}' already exists!`);
                        return true;
                    }

                    let server = await getGuild(input.config.data.emoji_server);
                    try {
                        // Newly Created Emote
                        let emote = await server.emojis.create(link[0], name[0]);
                        while(server.emojis.cache.array().length > 40) {
                            // Old Emote
                            Logger.debug('Emote Overflow: ' + (server.emojis.cache.array().length - 40));
                            let emo = server.emojis.cache.first();
                            if(emo) {
                                let dbemo = await EmoteConfigModel.findOne({ name: emo.name, eid: emo.id }).lean().exec();
                                if(dbemo) {
                                    await forgetEmote(input.config, getEmote(<EmoteConfig> dbemo));
                                    Logger.debug(`Removed ${dbemo.name} from Server.`);
                                    server.emojis.cache.delete(emo.id);
                                } else Logger.warn('Couln\'t find Emoji in Database!');
                            } else {
                                Logger.warn(`No Emotes found!`);
                            }
                        }
                        loadEmotes(input.config);

                        let msg = await getMessage(input.data.channel_id, input.data.id);
                        if(!msg) return;
                        await msg.react('✅');
                        await msg.channel.send(`<${emote.animated ? 'a' : ''}:${emote.name}:${emote.id}>`);
                    } catch {
                        await send(input.data.channel_id, 'Error occured, while adding Emote.\nTry an Emote with a File Size less than 256 kb!');
                    }
                }
            }
        }
    };
}