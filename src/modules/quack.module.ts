import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Module } from '@/interfaces/module.interface';
import { getMessage } from '@/util/discord.util';
import { weightedChoose } from '@/util/random.util';

const DUCKIEEE = '761742403685842954';

const text = [
  { obj: 'Quack', w: 16 },
  { obj: 'quack', w: 8 },
  { obj: 'QUACK', w: 2 },
  { obj: 'QUAAAAACK', w: 1 },
  { obj: 'QUAAAATTTFFF - oop, getting out of character', w: 0.1 },
];

const markdown = [
  { obj: '', w: 32 },
  { obj: '*', w: 16 },
  { obj: '**', w: 8 },
  { obj: '***', w: 4 },
  { obj: '__', w: 4 },
  { obj: '~~', w: 1 },
  { obj: '||', w: 1 },
];

export class QuackModule extends Module {
  public name: string = 'quack';
  types: string[] = ['MESSAGE_CREATE'];
  requires: string[] = [];
  man: string =
    '' +
    '***__Quack Module__***\n' +
    'Quack  quaaack quack, quuack quack quaaackkk.\n' +
    'Quack... Quack? - Quack!\n' +
    '||if you don\'t understand this - not my fault... ' +
    'Guess you gotta learn some duck language... ' +
    'Here\'s a little help:||\n' +
    '||https://www.backyardduck.com/duck-language/||';

  re: RegExp = /(?:^| *)q+u+a+c+k+(?: *|$)/;

  verify = async (_event: string, data: any) => {
    let msg = await getMessage(data.channel_id, data.id);
    if(!msg) return false;
    return msg.author.id === DUCKIEEE || this.re.exec(data.content.toLowerCase()) !== null;
  };

  run = async (_event: string, data: any, config: GuildConfig) => {
    let msg = await getMessage(data.channel_id, data.id);
    if (!msg) return;
    if (msg.author.bot) return;

    if (msg.author.id === DUCKIEEE && (!config.data.duck || config.data.duck !== 'nope'))
      await msg.react('🦆');
    
    if(this.re.exec(msg.content.toLowerCase())) {
      let md = weightedChoose(markdown);
      await msg.channel.send(`${md}${weightedChoose(text)}${md}`);
    }
  };
}
