import { MessageEmbed } from "discord.js";

export interface PagedEmbed {
    base: MessageEmbed | undefined;
    pages: Partial<MessageEmbed>[] | string[];
    page: number;
}

export function getPagedEmbed(paged: PagedEmbed) {
    let embed: MessageEmbed = new MessageEmbed()
    let content = paged.pages[paged.page];
    
    if(paged.base && typeof content === 'string') {
        embed = paged.base;
        if(content.length > 2048) 
            content = content.substr(0, 2044) + '...`';
        embed.setDescription(content);
    } else {
        embed = Object.assign(embed, paged.pages[paged.page]);
        if(embed.description && embed.description.length > 2048) 
            embed.description = embed.description.substr(0, 2044) + '...`';
    }
    embed.setFooter(`Page ${paged.page + 1} / ${paged.pages.length}`);
    return embed;
}