import { addSchedule, reloadSchedules } from "@/discord/cron-tab";
import { GuildConfig } from "@/interfaces/guild-config.interface";
import { PackageInput } from "@/interfaces/package.interface";
import { Logger } from "@/services/logger.service";
import { getChannel, getMember, getMessage, send } from "@/util/discord.util";
import { GuildHandler } from "@/util/package.util";
import { choose } from "@/util/random.util";
import { currentDate } from "@/util/time.util";
import { MessageEmbed, TextChannel } from "discord.js";
import * as cron from 'node-cron';
import { Package } from "../package";
import { dependencies } from "../repository";

export class BirthdayPackage extends Package {
    name: string = 'birthday';
    repository: string = 'social';
    
    events: string[] = ['MESSAGE_CREATE','BOT_READY'];
    triggers = ['birthday'];
    subpackage = [ ];
    dependencies = [ dependencies['public'] ];

    schedules: { [user: string]: cron.ScheduledTask } = {};

    help = async (config?: GuildConfig) => {
        return [
            '***__Birthday Package__***\n' +
            `The ${this.name} package allows the server family ` +
            'to save and celebrate member birthdays. The Bot will ' +
            'send 2 congratulations at 9AM and 6PM Bot Time in order ' +
            'to cover most time zones in the case of an international ' +
            'server.\n' +
            `*Bot Startup Time: ${new Date().toLocaleString()}*\n`,
            '_**Submit Birthday**_\n' +
            'You can submit your birthday in the format: `YYYY-MM-DD`. ' +
            'If you would like to use only the date without the year, ' +
            'please enter `0000` for the year! The member applied has to ' +
            'be a valid ping!\n\n' +
            '*Examples:*\n' +
            'Unknown Year: ' +
            '```' + config!.prefix + 'birthday @ping 0000-12-31```' +
            'Known Year: ' +
            `\`\`\`${config!.prefix}birthday @ping ${currentDate()}\`\`\``,
        ];
    };

    exec = async (input: PackageInput) => {
        if(input.command) {
            if(input.command.param !== '') {
                let msg = await getMessage(input.data.channel_id, input.data.id);
                if(msg) {
                    let person = msg.author.id;
                    if(msg.mentions && msg.mentions.users && msg.mentions.users.array().length > 0)
                        person = msg.mentions.users.firstKey() || '-1';
                    let date = /([012][09]\d\d)([\x2d-\x2f])([01]\d)\2([0123]\d)/.exec(msg.content);
                    if(date && person !== '-1') {
                        // Load User
                        let user = await getMember(input.config.gid, person);

                        // Load into Config
                        let bdays: { [user: string]: string[] } = input.config.data.birthdays || { };
                        bdays[person] = [date[1],date[3],date[4]];
                        let geh = GuildHandler(input.config.gid)!;
                        geh.config.data.birthdays = bdays;
                        await geh.pushConfig();
                        // Load into Cron
                        reloadSchedules('birthday');

                        // Accept
                        await msg.react('✅');
                        await msg.reply(`Set Birthday for ${user.nickname || user.user.username} to \`${date[0]}\``);
                    } else if(person === '-1') {
                        await send(msg.channel.id, 'Failed to find Member! A Mention/Ping should do the Job!');
                    } else {
                        await send(msg.channel.id, 'Failed to find or parse date! Please provide your date in: `yyyy-mm-dd` format!');
                    }
                }
            } else await send(input.data.channel_id, 'You have to provide a date (yyyy-mm-dd) and optionally a ping as arguments to this command!');
        } else if(input.event === 'BOT_READY') {
            this.load(input.config);
        }
    };

    load(config: GuildConfig) {
        Logger.debug('Loaded Birthdays for `' + config.gid + '`!');

        for(let birthday in config.data.birthdays) {
            let d: string[] = config.data.birthdays[birthday];
            // ToDo: Check for Time Zone Detection!
            addSchedule('birthday', birthday, `0 9,18 ${d[2]} ${d[1]} *`, async () => {
                await congratulate(config, birthday);
            });
        }

        reloadSchedules('birthday');
    }
}

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
    await send(config.data.public, embed);
}
  