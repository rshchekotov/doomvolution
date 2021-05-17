import { AniListResult } from "@/interfaces/anilist.interface";
import { MessageEmbed } from "discord.js";
import fetch from "node-fetch";
import { randomColor } from "./random.util";

const url = 'https://graphql.anilist.co';
const query = `
query MediaQuery($name: String) {
    Media(search: $name) {
        type
        title {
            romaji
            english
            native
        }
        description
        coverImage {
            large
        }
        siteUrl
        tags {
            name
        }
    }
}
`;

export async function aniSearch(anime: string) {
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            query: query,
            variables: { name: anime }
        })
    };

    let response = await fetch(url, options);
    if(response.ok)
        return <AniListResult> (await response.json()).data.Media;
    return null;
}

export function formatAniSearch(data: AniListResult) {
    let embed = new MessageEmbed();
    let icon = (data.type === 'MANGA') ? 
        ':book: ' : (data.type === 'ANIME') ?
        ':tv: ' : '';
    
    embed.setTitle(`${icon}${data.title.native || ''}${data.title.english ? ` (${data.title.english})` : ''}`);
    let desc = data.description;
    while(desc.includes('<br>') || /\n{3,}/.test(desc)) {
        desc = desc.replace(/<br>/, '\n');
        desc = desc.replace(/\n{3,}/, '\n\n');
    }
    embed.setDescription(desc);
    embed.addField('Tags', data.tags.map(tag => tag.name).join(', ') || 'None Found');
    embed.setImage(data.coverImage.large);
    embed.setURL(data.siteUrl);
    embed.setColor(randomColor());

    return embed;
}