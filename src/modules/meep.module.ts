import { Module } from "@/interfaces/module.interface";
import { getMessage } from "@/util/discord.util";
import { weightedChoose } from "@/util/random.util";

const text = [
    { obj: 'Meep', w: 8 },
    { obj: 'meep', w: 4 },
    { obj: 'MEEP', w: 1 },
];

const markdown = [
    { obj: '', w: 32 },
    { obj: '*', w: 16 },
    { obj: '**', w: 8 },
    { obj: '***', w: 4 },
    { obj: '__', w: 4 },
    { obj: '~~', w: 1 },
    { obj: '||', w: 1 }
];

export class MeepModule extends Module {
    public name: string = 'meep';
    types: string[] = ['MESSAGE_CREATE'];
    requires: string[] = [];
    man: string = '' + 
    '***__Meep Module__***\n' +
    `The ${this.name} module is made for Spenno ` +
    '(Spennorex#1775), who can also be found @' + 
    ' https://spennorex.net/. This module is simple, ' +
    'to find out exactly what it does - say \'Meep\' :D. ' +
    '(You have to have it installed ofc)'

    re: RegExp = /^m+e+p+ /;

    verify = async (event: string, data: any) => {
        return this.re.exec(data.content.toLowerCase()) !== null;
    };

    run = async (event: string, data: any) => {
        let msg = await getMessage(data.channel_id, data.id);
        if(msg.author.bot) return;
        let md = weightedChoose(markdown);
        msg.reply(`${md}${weightedChoose(text)}${md}`);
    };

}