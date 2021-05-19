import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Module } from '@/interfaces/module.interface';
import { Logger } from '@/services/logger.service';
import { parseData } from '@/util/data.util';
import { getMessage, send } from '@/util/discord.util';
import { MessageEmbed } from 'discord.js';

export class EmbedModule extends Module {
  public name: string = 'embed';
  types: string[] = ['MESSAGE_CREATE'];
  requires: string[] = [];
  man: string[] = [
    '***__Embed Module__***\n' +
      `The ${this.name} module is used to build embeds ` +
      'as a regular user! You can supply certain arguments, ' +
      "such as `title`, `description`, etc. You'll find a " +
      'more detailed list on the next pages!',

    '_**Data Options**_\n' +
      'There are some options for the data you can provide for an embed. Some of the ' +
      'options are required, others are optional. The optional ones will be marked ' +
      'with a `?`.\n' +
      '`title`\n❦ **[text]**\n❦ text that will appear (max. 256 chars)\n' +
      '`description?`\n❦**[text]**\n❦ the long body of the embed (max: 2048 chars)\n' +
      '`color?`\n❦ **[hex]**\n❦ color in hex format (e.g.: `#aad1ed`)\n' +
      '`image?`\n❦ **[text]**\n❦ proper image-link (with a [png,jpeg,gif] extension)\n' +
      '`url?`\n❦ **[text]**\n❦ link that will be activated when you click the title\n' +
      '`thumbnail?`\n❦ **[text]**\n❦ proper image-link (with a [png,jpeg,gif] extension)\n' +
      '`fields?`\n❦ **[list]**\n❦ comma and `=` separated list \n❦\t\t(e.g.: `Name = Doomie, Age = unknown`)\n' +
      '`author?`\n❦ **[list|text]**\n❦ if text, then name, otherwise comma-sep. list containing ' +
      'name, image-link?, link?',

    '_**Data Format**_\n' +
      'You can provide Data in JSON and TOML. The Embed JSON Format would look like: ' +
      '```\n$embed\n``` ```json\n{\n\t"title": "Cool Embed",\n\t"color": "#990000"\n}\n```' +
      'The same for the TOML format woud look like: ' +
      '```\n$embed\n``` ```toml\ntitle="Cool Embed"\ncolor="#990000"\n```\n' +
      'In Order to create those beautiful boxes with proper highlighting you simply ' +
      'need to type:\n\\`\\`\\`json\ndata here\n\\`\\`\\`\n' +
      "if it's toml, then you just need to write `toml` instead of json!",
  ];

  re: RegExp = /^embed[\n ]+([\s\S]+)/;

  verify = async (event: string, data: any, config: GuildConfig) => {
    return (await this.cmd(data, this.re, config)) !== null;
  };

  run = async (event: string, data: any, config: GuildConfig) => {
    let match = await this.cmd(data, this.re, config);
    let body = parseData(match![1]);

    if (!body) {
      send(
        data.channel_id,
        'Invalid Syntax! Please use valid JSON/TOML Syntax!'
      );
      return;
    }

    if (!body.title) {
      send(data.channel_id, 'The Embed needs a Title!');
    } else {
      let embed: MessageEmbed = new MessageEmbed()
        .setTitle(body.title)
        .setTimestamp();
      if (body.description) embed.setDescription(body.description);
      if (body.color) embed.setColor(body.color);
      if (body.image) embed.setImage(body.image);
      if (body.url) embed.setURL(body.url);
      if (body.footer) embed.setFooter(body.footer);
      if (body.thumbnail) embed.setThumbnail(body.thumbnail);
      if (body.fields) {
        let fields = body.fields.split(/ *, */).map((field: string) => {
          let pair = field.split(/ *= */);
          return { name: pair[0], value: pair[1] };
        });

        embed.addFields(fields);
      }
      if (body.author) {
        let author = body.author.split(/, */);
        if (author.length === 3)
          embed.setAuthor(author[0], author[1], author[2]);
        if (author.length === 2) embed.setAuthor(author[0], author[1]);
        if (author.length === 1) embed.setAuthor(author[0]);
      }

      await send(data.channel_id, embed);
      let msg = await getMessage(data.channel_id, data.id);
      if (!msg) return;
      msg.delete();
    }
  };
}
