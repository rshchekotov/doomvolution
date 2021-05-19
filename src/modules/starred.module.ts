import { guilds } from '@/app';
import { Logger } from '@/services/logger.service';
import { GuildEventHandler } from '@/events/guild.handler';
import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Module } from '@/interfaces/module.interface';
import { getMessage, send } from '@/util/discord.util';
import { MessageEmbed } from 'discord.js';

const stars = ['⭐', '🤩', '🌠', '🌟'];

export class StarredModule extends Module {
  public name: string = 'starred';
  types: string[] = ['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'];
  requires: string[] = ['star_channel', 'star_count'];

  man: string[] = [
    '***__Starred Module__***\n' +
      `The ${this.name} module allows to vote for 'pins'! ` +
      'Those pins are embeds that will be sent in a specialized ' +
      'channel! To star a message, you can react with ' +
      `one of these default discord emotes: ${stars.join(', ')}`,
    '_**Requirements**_\n' +
      '`star_channel` - the channel for pinned messages\n' +
      '`star_count` - the reaction count for a pin',
  ];

  verify = async (event: string, data: any, config: GuildConfig) => {
    return stars.includes(data.emoji.name) || data.emoji.name.includes('star');
  };

  run = async (event: string, data: any, config: GuildConfig) => {
    let users = new Set<string>();
    let msg = await getMessage(data.channel_id, data.message_id);
    if (!msg) return;

    Logger.debug('Reaction Accepted for ' + msg.id);
    msg.reactions.cache.forEach((react) => {
      if (stars.includes(react.emoji.name)) {
        react.users.cache
          .array()
          .map((user) => user.username)
          .forEach((name) => {
            users.add(name);
          });
      }
    });

    let pins: { source: string; pin: string }[] | undefined = config.data.pins;
    if (users.size >= config.data.star_count) {
      // Check if Pinned
      if (!pins || !pins.map((pin) => pin.source).includes(data.message_id)) {
        pins = pins || [];

        let isEmbed = msg.embeds && msg.embeds.length > 0;
        let hasMedia = () => {
          if (msg!.content) {
            let img = /https?:\/\/.+\.(?:png|gif|jpe?g|mp4)/.exec(msg!.content);

            Logger.debug(`Image Detected? ${img}`);

            if (img) return img[0];
            else return undefined;
          } else if (isEmbed) {
            if (msg!.embeds[0].image) {
              return msg!.embeds[0].image.url;
            } else {
              return undefined;
            }
          }
        };
        let embed = new MessageEmbed()
          .setTitle(
            `Precious Message${isEmbed ? ` (${msg.embeds[0].title})` : ''}`
          )
          .setDescription(isEmbed ? msg.embeds[0].description : msg.content)
          .setURL(
            `https://discord.com/channels/${msg.guild!.id}/${msg.channel.id}/${
              msg.id
            }`
          )
          .addField('Starred By:', Array.from(users).join(', '), false)
          .addField(
            'Message From:',
            new Date(
              msg.editedTimestamp || msg.createdTimestamp
            ).toLocaleString()
          )
          .setTimestamp();

        let media = hasMedia();
        if (media) {
          embed.setTitle('Precious Media');
          embed.setDescription('');
          embed.setImage(media);
        }
        if (!isEmbed)
          embed.setFooter(
            `Quote by: ${
              msg.member && msg.member.nickname
                ? msg.member.nickname
                : msg.author.username
            }`,
            'https://media1.tenor.com/images/e7e211a3c1a5b8e18a1801c3bc84c46a/tenor.gif'
          );
        let pin = await send(config.data.star_channel, embed);

        pins.push({ source: data.message_id, pin: pin.id });
        config.data.pins = pins;

        let handler = <GuildEventHandler>guilds.get(data.guild_id);
        handler.config = config;
        handler.pushConfig();
      } else {
        let starred = await getMessage(
          config.data.star_channel,
          pins.find((pin) => pin.source === data.message_id)!.pin
        );
        if (!starred) return;
        let embed = starred.embeds[0];
        embed.fields[0] = {
          name: 'Starred By:',
          value: Array.from(users).join(', '),
          inline: false,
        };
        await starred.edit(embed);
        return;
      }
    } else if (
      pins &&
      pins.map((pin) => pin.source).includes(data.message_id)
    ) {
      let starred = await getMessage(
        config.data.star_channel,
        pins.find((pin) => pin.source === data.message_id)!.pin
      );
      if (!starred) return;

      await starred.delete();
      config.data.pins = pins.filter((pin) => pin.pin !== starred!.id);

      let handler = <GuildEventHandler>guilds.get(data.guild_id);
      handler.config = config;
      handler.pushConfig();
    }
  };
}
