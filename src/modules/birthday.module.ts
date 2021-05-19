import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Module } from '@/interfaces/module.interface';
import { getMessage, getMember, send } from '@/util/discord.util';
import * as cron from 'node-cron';
import { GuildEventHandler } from '@/events/guild.handler';
import { guilds } from '@/app';
import { MessageEmbed } from 'discord.js';
import { choose } from '@/util/random.util';
import { currentDate } from '@/util/time.util';

const bday = ['bd', 'bday', 'birthday'];
const image = [
  'https://media.tenor.com/images/a5647a901e3fd9337fd553f748e86f1d/tenor.gif',
  'https://media1.tenor.com/images/ce4762b6f8709ed29956f84148c1e46f/tenor.gif',
  'https://media1.tenor.com/images/b7e33bd26c649ee7ee5114835cad8898/tenor.gif',
  'https://media1.tenor.com/images/cbfd54d3c9fd2ed0a600eb6f1db00b2d/tenor.gif',
  'https://media1.tenor.com/images/ee72c83e7ed41b639d1c47913a419f81/tenor.gif',
];

const description = [
  'On this day, may your most cherished desires come true; I wish you success in life. Happy birthday!',
  'As you move into another year of your life, may the blessings and success follow you always. Happy birthday!',
  'I am blessed to have a friend like you, Loving thoughts and warm wishes on your birthday. Happy birthday!',
  'Happy birthday! May the finest things come your way.',
  'As you start a new year, may your days ahead be brighter. Have a wonderful birthday!',
  'It’s time to go out and party; you deserve the best, blow the candles and burst some balloons. I wish you a happy birthday.',
  'There is no other day like today; it is a beautiful and lovely day in your life. I wish that your life blossoms forever.  I wish you a happy birthday.',
  'You are a year older, a year wiser, a year smarter. Here’s wishing you a blessed Happy Birthday.',
  'Happy birthday to the person who motivates and inspires me in life!',
  'May peace, joy, and happiness be with you today and beyond, I wish you a happy birthday.',
  'Finding a great person like you in life is very hard, I am glad to have you in my life. May joy and happiness fill your life. Happy Bday!',
];

async function congratulate(config: GuildConfig, id: string) {
  let user = await getMember(config.gid, id);
  let embed = new MessageEmbed()
    .setTitle(`Happy Birthday, ${user.nickname || user.user.username}!`)
    .setDescription(`Dear <@!${user.id}>,\n` + choose(description))
    .setImage(choose(image)!)
    .setTimestamp()
    .setThumbnail(
      'https://www.positivelyosceola.com/wp-content/uploads/2017/06/celebrationfireworks.jpg'
    )
    .setFooter(
      `For ${user.nickname || user.user.username} | Brought to you by everyone!`
    );
  send(config.data.channel, embed);
}

export class BirthdayModule extends Module {
  public name: string = 'birthday';
  types: string[] = ['BOT_READY', 'MESSAGE_CREATE'];
  requires: string[] = ['channel'];
  man: string[] = [
    '***__Birthday Module__***\n' +
      `The ${this.name} module allows the server family ` +
      'to save and celebrate member birthdays. The Bot will ' +
      'send 2 congratulations at 9AM and 6PM Bot Time in order ' +
      'to cover most time zones in the case of an international ' +
      'server.\n' +
      `*Current Bot Time: ${new Date().toLocaleString()}*\n`,
    '_**Submit Birthday**_\n' +
      'You can submit your birthday in the format: `YYYY-MM-DD`. ' +
      'If you would like to use only the date without the year, ' +
      'please enter `0000` for the year! The user supplied has to ' +
      'be a valid ping!\n\n' +
      '*Examples:*\n' +
      'Unknown Year: ' +
      '```$birthday @ping 0000-12-31```' +
      'Known Year: ' +
      `\`\`\`$birthday @ping ${currentDate()}\`\`\``,
  ];

  crontasks: cron.ScheduledTask[] = [];

  re = /^(\w+) *<@!(\d+)> *(\d{4}-\d{2}-\d{2}) */;

  load(config: GuildConfig) {
    if (this.crontasks.length > 0) {
      this.crontasks.forEach((task) => task.stop());
      this.crontasks = [];
    }

    if (config.data.birthdays) {
      for (let birthday in config.data.birthdays) {
        let tokens = config.data.birthdays[birthday].split('-');
        if (Number(tokens[0]) < 1950) tokens[0] = 9999;
        let date = new Date(tokens);
        this.crontasks.push(
          cron.schedule(
            `0 */9 ${date.getDate()} ${date.getMonth() + 1} *`,
            () => {
              congratulate(config, birthday);
            }
          )
        );
      }
    }
  }

  verify = async (event: string, data: any, config: GuildConfig) => {
    return (
      event === this.types[0] ||
      (await this.cmd(data, this.re, config)) !== null
    );
  };

  run = async (event: string, data: any, config: GuildConfig) => {
    if (event === this.types[0]) {
      this.load(config);
    } else {
      let match = await this.cmd(data, this.re, config);
      if (bday.includes(match![1])) {
        if (!config.data.birthdays) config.data.birthdays = {};
        config.data.birthdays[match![2]] = match![3];

        let handler = <GuildEventHandler>guilds.get(config.gid);
        handler.config = config;
        handler.pushConfig();
        this.load(config);
        let msg = await getMessage(data.channel_id, data.id);
        if (!msg) return;
        await msg.react('✅');
      }
    }
  };
}
