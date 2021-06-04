export class Emote {
    animated: boolean;
    author: string;
    createdAt: Date;
    deleted: boolean;
    guild: string;
    eid: string;
    name: string;
    url: string;

    constructor(animated: boolean, author: string, createdAt: Date, deleted: boolean, guild: string, eid: string, name: string, url: string) {
        this.animated = animated;
        this.author = author;
        this.createdAt = createdAt;
        this.deleted = deleted;
        this.guild = guild;
        this.eid = eid;
        this.name = name;
        this.url = url;
    }

    getEmoji() {
        return `<${this.animated ? 'a' : ''}:${this.name}:${this.eid}>`;
    }
}

export const ErrorEmote = new Emote(false, '-1', new Date(), false, '-1', '-1', 'error', '');