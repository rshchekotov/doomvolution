import { PagedEmbed } from "@/interfaces/paged.embed.interface";
import { UrbanResult } from "@/interfaces/urban.interface";
import { MessageEmbed } from "discord.js";
import fetch from 'node-fetch';

const url = 'http://api.urbandictionary.com/v0/define?term=';

export async function searchDefinition(term: string) {
    let response = await fetch(url + term);
    if(response.ok) {
        let definitions: UrbanResult[] = (await response.json()).list;
        return definitions;
    }
}

export function formatDefinitions(results: UrbanResult[], term: string): PagedEmbed | MessageEmbed {
    if(results.length === 0) 
        return new MessageEmbed()
            .setTitle(`${term} not found!`)
            .setDescription('`¯\\_(ツ)_/¯`');
    let result: PagedEmbed = {
        "base": undefined,
        "page": 0,
        "pages": results.map(result => {
            return { 
                "title": `Definition: ${result.word}${term === result.word ? '' : ' (Closest Match)'}`,
                "description": `:closed_book: **Definition:**\n` + 
                    result.definition.split(/[\n\r]+/).map((val, index) => `\`${val}\``).join('\n') +
                    `\n\n:scroll: **Examples:**\n` +
                    result.example.split(/[\n\r]+/).map((val, index) => `\`${val}\``).join('\n\n'),
                "footer": {
                    "text": `Page: 1 / ${results.length}`
                },
                "timestamp": new Date().getTime()
            };
        })
    };
    return result;
}