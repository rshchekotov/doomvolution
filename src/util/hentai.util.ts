import { Hentai } from '@/interfaces/hentai.interface';
import { MessageEmbed } from 'discord.js';
import fetch from 'node-fetch';

const url = 'https://nhentai.net/api/gallery/';
const media_url = 'https://t.nhentai.net/galleries/';

export async function searchHentai(term: string) {
  let response = await fetch(url + term);
  if (response.ok) {
    let hentai: Hentai = await response.json();
    return hentai;
  }
}

export function formatHentai(
  hentai: Hentai | undefined,
  search: string
): MessageEmbed {
  if (!hentai)
    return new MessageEmbed()
      .setColor(0x990000)
      .setTitle(`Didn't find anything for ${search}`)
      .setTimestamp();
  return new MessageEmbed()
    .setColor(0x990000)
    .setTitle(
      `${hentai.id} | ${hentai.title.japanese} / ${hentai.title.english}`
    )
    .setURL(`https://nhentai.net/g/${hentai.id}/`)
    .addFields(
      {
        name: 'Tags',
        value: hentai.tags.map((tag) => `(${tag.id} | ${tag.name})`).join(', '),
      },
      { name: 'Pages', value: hentai.num_pages }
    )
    .attachFiles([
      {
        attachment: `${media_url}${hentai.media_id}/cover.jpg`,
        name: `SPOILER_${hentai.id}.jpg`,
      },
    ])
    .setTimestamp();
}
