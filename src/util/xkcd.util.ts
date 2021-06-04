import { XKCDComic } from '@/interfaces/xkcd.interface';
import { Logger } from '@/services/logger.service';
import { MessageEmbed } from 'discord.js';
import fetch from 'node-fetch';

let url = 'https://xkcd.com/';

export function formatComic(comic: XKCDComic) {
  let embed: MessageEmbed = new MessageEmbed();
  embed.setTitle(`${comic.num} | ${comic.safe_title}`);
  embed.setImage(comic.img);
  embed.setDescription(comic.alt);
  embed.setFooter(`from ${comic.month}/${comic.day}/${comic.year}`);
  embed.setURL(`${url}${comic.num}`);
  return embed;
}

export async function getComic(num: number): Promise<XKCDComic | null> {
  if (num > 0 && num > 2463) {
    Logger.warn(`XKCD Comic ${num} is probably not released yet!`);
    return null;
  } else {
    let response = await fetch(`${url}${num}/info.0.json`);
    if (response.ok) {
      let data: XKCDComic = await response.json();
      return data;
    } else {
      Logger.warn(`XKCD Request for ${num} failed!`);
      return null;
    }
  }
}

export async function getRandomComic() {
  return await getComic(Math.floor(Math.random() * 2463))!;
}
