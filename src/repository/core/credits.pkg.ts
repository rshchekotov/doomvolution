import { PagedEmbed } from "@/discord/paged.embed";
import { GuildConfig } from "@/interfaces/guild-config.interface";
import { PackageInput, PackageTrigger } from "@/interfaces/package.interface";
import { Package } from "../package";

export class CreditsPackage extends Package {
    name: string = 'credits';
    repository: string = 'core';

    events: string[] = ['MESSAGE_CREATE'];

    triggers: PackageTrigger[] = [
        'credits'
    ];

    help = async (config?: GuildConfig) => {
        return [
            '`' + config!.prefix + 'credits`\nCheck it. Some appreciation ' +
            'for all the people who supported me on this journey so far!'
        ];
    };

    exec = async (input: PackageInput) => {
        let embed = new PagedEmbed('Credits', [
            '__***Introduction***__\n' +
            'Welcome to the Credits Page. Since this is an ' +
            'Open Source Collaborative Project, I\'ll expand ' +
            'this section every time we get a new person contributing ' +
            'to the wonderful entity the bot has become!\nAfter a ' +
            'decent amount of new features I though about introducing ' +
            'this one, since I used quite a lot of help from the ' +
            'outside and want to honor and credit those people properly ' +
            'for their accomplishments and contributions to the bot!\n' +
            'Some of these are just personal thanks to the people who ' +
            'were part of the bot development in a direct on indirect way!',
            '__***Mood and Atmosphere***__\n' +
            'Most people do not appreciate this factor enough, so I\'ll ' +
            'explictly mention it! Further down you\'ll see a list of ' +
            'people who made my development sessions a lot more fun, by ' +
            'whatever means, be it, by listening music together, ' +
            'recommending tracks, just down-to-earth talking or motivational ' +
            'and funny memes!\n' +
            '❦ Tari\n❦ Krista\n❦ Wesam\n❦ Snowiee\n❦ Duckieeee\n❦ Rei',
            '__***Artworks***__\n' +
            'I don\'t like most artworks of mine, maybe that\'s, because ' +
            'I always see better artworks or, because I see all my mistakes ' +
            'and things I could\'ve done better. Therefore I have had a few ' +
            'insanely talented artists help me with some designs used in some ' +
            'of the bots modules.\n' +
            '❦ Dabdab\n❦ Krista',
            '__***Hosting***__\n' +
            'The bot wouldn\'t exist as it does without a proper hoster, who ' +
            'could keep the bot online 24/7. Spennorex was this one person ' +
            'for this bot, who helped me numerous times with the setup on his ' +
            'servers and helped maintaining overall stability!\n❦ Spennorex',
            '__***Contributors***__\n' +
            'Overall there are lots of people who contributed to the bot either ' +
            'by suggesting features, which make the bot what it is today or by ' +
            'submitting data, to enrich the experience of other users, for ' +
            'example by adding quotes and member facts! Same goes for all the ' +
            'people who helped accumulate data for other modules, which apply ' +
            'on an inter-server scale!\n' +
            '❦ Promiselight\n❦ Zoe\n❦ Aggy\n❦ Duckieeee\n❦ Tari\n❦ Shane\n❦ Kami\n'
        ]);
        await embed.send(input.data.channel_id);
    };

}