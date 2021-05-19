import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Module } from '@/interfaces/module.interface';
import { send } from '@/util/discord.util';
import { choose } from '@/util/random.util';

const arrival = [
  ' arrived!',
  ' spawned!',
  ' appeared out of nowhere!',
  ' got resurrected.',
  ' warped in.',
  ' switched on.',
  ': \\*beep beep boop boop\\*',
];

export class ReadyModule extends Module {
  public name: string = 'ready';
  types: string[] = ['BOT_READY'];
  requires: string[] = ['channel'];
  man: string =
    '' +
    '***__Ready Module__***\n' +
    `The ${this.name} module is simple in terms ` +
    'of functionality. Everything it does is post ' +
    'a message in the configured channel (config: channel) ' +
    'on bot start up! It is recommended to remove this ' +
    "module during bot tests, otherwise it'll spam the " +
    'specified channel!';

  verify = async () => true;

  run = async (event: string, data: any, config: GuildConfig) => {
    send(config.data.channel, `${config.nick}${choose(arrival)}`);
  };
}
