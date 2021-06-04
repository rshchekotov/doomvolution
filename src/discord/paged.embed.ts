import { Logger } from '@/services/logger.service';
import { getMessage, getReaction, send } from '@/util/discord.util';
import { Message, MessageAttachment, MessageEmbed } from 'discord.js';
import * as Cache from 'node-cache';

export const PagedEmbeds = new Cache();

export class PagedEmbed {
    loaded: boolean = false;
    channel: string = '';
    message: string = '';
    title: string;
    page: number = 0;
    pages: string[];
    attached: string[] = [];
    files: {p: number, a: MessageAttachment}[] = [];
    updateAction = async (page: number) => {};

    constructor(title: string, pages: string[]) {
        this.title = title;
        this.pages = pages;
    }

    async emote(eid: string, uid: string) {
        if(this.message === '' || this.channel === '') return;
        let r = ['◀️','❌','▶️'];
        if(r.includes(eid)) {

          let reaction = await getReaction(eid, this.message, this.channel);
          if(reaction) await reaction.remove(uid);

          if(!this.loaded) return;
          
          if(eid === r[1]) {
            await this.rm();
          } else {
            await this.turn(r.indexOf(eid)-1);
            await this.update();
          }
        }
    }

    async send(cid: string, waiting?: string) {
        let embed = new MessageEmbed().setTitle('Loading Embed');
        let msg: Message;
        
        if(waiting === undefined || waiting !== '') {
            embed.setImage(waiting ? waiting :'https://media1.tenor.com/images/5c0e9a59364291b87ad912d88d37438c/tenor.gif');
        } else {
            embed = this.format().pagedEmbed;
        }
        this.files = this.getLocal();
        embed.attachFiles(this.files.map(o => o.a));
        msg = await send(cid, embed);
        // Wait for Patch Release:
        // https://github.com/discordjs/discord.js/pull/5557/commits/5aed94f7fca36af3f77d02562460d1dd62bdd4ef
        // msg.reaction

        this.channel = cid;
        this.message = msg.id;
        if(this.pages.length > 1) await msg.react('◀️');
        await msg.react('❌');
        if(this.pages.length > 1) await msg.react('▶️');
        if(this.pages.length > 1) PagedEmbeds.set(msg.id, this);
        
        let source = this.format();
        let current = this.files.find(o => o.p === this.page && /.+\.(?:png|jpe?g|gif)/.test(o.a.name!));
        if(current) source.pagedEmbed.setImage(`attachment://${current.a.name}`);

        await msg.edit({ embed: source.pagedEmbed });
        this.loaded = true;
        this.updateAttachments(source.attachments);
    }

    async update() {
        if(this.channel === '' || this.message === '') return;
        let msg = await getMessage(this.channel, this.message);
        if(!msg) return;
        Logger.trace('Updating Embed!');
        let edit = this.format();
        if(!edit || !edit.pagedEmbed || !edit.pagedEmbed.footer) return;

        Logger.debug(JSON.stringify(this.files));
        let current = this.files.find(o => o.p === this.page && /.+\.(?:png|jpe?g|gif)/.test(o.a.name!));
        Logger.debug(JSON.stringify(current));
        if(current) edit.pagedEmbed.setImage(`attachment://${current.a.name}`);

        if(/Page \d+\/\d+/.test(edit.pagedEmbed.footer.text || '')) {
            await msg.edit({embed: edit.pagedEmbed});
            if(edit.attachments.length > 0)
                await this.updateAttachments(edit.attachments);
        }
    }

    format() {
        let embed: MessageEmbed = new MessageEmbed()
            .setTitle(this.title)
            .setTimestamp();
        
        if(this.pages.length > 1) embed.setFooter(`Page ${this.page+1}/${this.pages.length}`);
        let content = this.pages[this.page];

        // TITLE PARSING
        let titleRegex = /‡title=([^‡]+)‡\n?/;
        if(titleRegex.test(content)) {
            let title = titleRegex.exec(content)![1];
            embed.setTitle(title);
            content = content.replace(titleRegex, () => '');
        }

        let attachments: (string)[] = [];
        // Field Parsing
        let fieldRegex = /‡([^‡]+):=:([^‡]+)‡\n?/;
        while(fieldRegex.test(content)) {
            content = content.replace(fieldRegex, (m, p1, p2) => {
                embed.addField(p1,p2);
                return '';
            });
        }

        // MEDIA ATTACHMENTS
        let mediaRegEx = /(?:https?|attachment):\/\/[^ ]*\.(?:png|jpe?g|gifv?)/;

        while(mediaRegEx.test(content)) {
            content = content.replace(mediaRegEx, (m) => {
                if(!m.startsWith('attachment')) attachments.push(m);
                return `[attach-#${attachments.length}]`;
            });
        }

        if(attachments.length > 0) {
            if(attachments.length === 1) {
                embed.setImage(attachments[0]);
                attachments = [];
            }
        }

        // EMBED DESCRIPTION
        embed.setDescription(content);

        return { 
            pagedEmbed: embed,
            attachments: attachments 
        };
    }

    //TODO
    getLocal() {
        let attachments: { p: number, a: MessageAttachment}[] = [];

        this.pages = this.pages.map((page, index) => {
            let attachRegex = /‡attach=([^‡]+)‡\n?/;
            if(attachRegex.test(page)) {
                let attapath = attachRegex.exec(page)![1];
                let file = attapath.split('/');
                const attachment = new MessageAttachment(attapath, file[file.length-1]);
                attachments.push({p: index, a: attachment});
                return page.replace(attachRegex, () => '');
            }
            return page;
        });

        return attachments;
    }

    async turn(count: number) {
        let mod = this.pages.length;
        let dest = (mod + count + this.page) % mod;
        this.page = dest;
        await this.updateAction(this.page);
        this.save();
    }

    async goto(dest: number) {
        await this.turn(dest - this.page);
    }

    save() {
        if(this.message !== '') PagedEmbeds.set(this.message, this);
    }

    async updateAttachments(attachments: (string | MessageAttachment)[]) {
        let msg: Message | undefined;
        // Kill old Attachments
        for(let attach of this.attached) {
            msg = await getMessage(this.channel, attach);
            if(!msg) return;
            await msg.delete();
        }
        this.attached = [];
        for(let attach of attachments) {
            msg = await send(this.channel, new MessageEmbed()
                .setTitle(`Attachment #${attachments.indexOf(attach)+1}`)
                .setImage(typeof attach === 'string' ? attach : attach.url));
            this.attached.push(msg.id);
        }
        this.save();
    }

    async rm() {
        if(PagedEmbeds.has(this.message)) PagedEmbeds.del(this.message);
        if(this.message.length === 0 || this.channel.length === 0) return;
        let msg = await getMessage(this.channel, this.message);
        if(!msg) return;
        await msg.delete();
        this.attached.forEach(async attach => {
            msg = await getMessage(this.channel, attach);
            if(!msg) return;
            await msg.delete();
        });
    }
}