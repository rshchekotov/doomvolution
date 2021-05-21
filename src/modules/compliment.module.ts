import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Module } from '@/interfaces/module.interface';
import { Logger } from '@/services/logger.service';
import { getMessage, send } from '@/util/discord.util';
import { choose } from '@/util/random.util';

const triggers = {
  positive: [
    'genius',
    'smart',
    'intelligent',
    'charming',
    'epic',
    'legendary',
    'humble',
    'sweet',
    'lovely',
    'great',
    'krista',
    'talented',
    'boppin',
    'awesome',
    'nice',
    'perfect',
    'lit',
  ],
  negative: [
    'sad',
    'depress',
    'frustrat',
    'infuriating',
    'angry',
    'shit',
    'r.i.p.',
    'pissed',
    'screwed',
    'cheesed',
    'annoy',
    'fuck',
    'retard'
  ],
};

//TODO: Add Resources!
const responses = {
  you: [
    'https://media1.tenor.com/images/3ca8f884da9396c1a23864cfcaf087e6/tenor.gif',
  ], // Youuuuu
  alright: [
    'https://media1.tenor.com/images/29d99d32b76c4af3187ddaff2bf0e18f/tenor.gif',
    'https://media1.tenor.com/images/d2c682ddff76731059bd413130473d3f/tenor.gif',
    'https://media1.tenor.com/images/f40403b20b1aca18e61137a6caef5fdc/tenor.gif',
    'https://media1.tenor.com/images/eb106be6f33b022bb34781e741e74db9/tenor.gif',
  ], // It's gonna be alright
};

export class ComplimentModule extends Module {
  public name: string = 'compliment';
  types: string[] = ['MESSAGE_CREATE'];
  requires: string[] = [];
  man: string =
    '' +
    '***__Compliment Module__***\n' +
    `The ${this.name} module is there to motivate ` +
    'all the hardworking folks among us and send some ' +
    'occasional lovely statements!';

  verify = async (event: string, data: any, config: GuildConfig) => {
    return true;
  };

  run = async (event: string, data: any, config: GuildConfig) => {
    let msg = await getMessage(data.channel_id, data.id);
    if (!msg || msg.author.bot) return;

    let match: RegExpExecArray | null = null;

    if (
      (match = /^who(?: is|['’’']s) (?:a )?(.+)\??/.exec(
        data.content.toLowerCase()
      )) != null
    ) {
      if (triggers.positive.includes(match[1].split('W')[0]))
        send(data.channel_id, choose(responses.you)!);
    } else if (
      triggers.negative.some((n) => data.content.toLowerCase().includes(n))
    ) {
      try {
        await send(data.channel_id, choose(responses.alright)!);
        await msg.react('🤗');
        await msg.react('💕');
      } catch {
        Logger.warn('Message doesn\'t exist!');
      }
    }
  };
}
