import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Module } from '@/interfaces/module.interface';
import { Logger } from '@/services/logger.service';
import {
  checkReactions,
  getMessage,
  getReaction,
  getUser,
  send,
} from '@/util/discord.util';
import { Message, MessageEmbed } from 'discord.js';

let pages = [
  '***__Part I: Introduction__***\n' +
    'In order to introduce you to the bots philosophy, let me ' +
    'explain what it is inspired by. The bots is built in a ' +
    'similar way to Unix (an operating system). You can get what ' +
    "you like and remove what you don't like and you're only " +
    'forced to have what is necessary for the bot to work as intended!\n' +
    'In this little tutorial you will learn how to list all ' +
    'available modules, how to obtain information on one of those ' +
    'modules, how to install a module and, if it has required ' +
    'settings configure those before! And to end the workflow, ' +
    "we'll uninstall the module, so you can enjoy a fresh start!\n" +
    "Whenever you see a '🖥️' it means that you should run the " +
    'commands attached in a code-block below in order to proceed ' +
    'with the tutorial!\n' +
    'React with a ✅ to get to the next page (this also applies to ' +
    'all the following pages). To get back to the last page, feel ' +
    "free to react with a '◀️' You can halt the tutorial at any " +
    "point by reacting with '❌'.",

  '***__Part II: Module Manager (modman)__***\n' +
    'Most workflow for this bot uses 2 commands - `man` and `modman`. ' +
    "First we'll look at latter! To provide a quick definition: " +
    'modman - the Module Manager - is used to search, install and ' +
    'remove individual modules of the bot - features if you wish.\n' +
    "Let's start with listing all available features! This can be " +
    'achieved using: 🖥️ ```$modman search all```Now you probably got ' +
    'a list of decent size. You will be able to inspect that list and ' +
    "get everything that you like later, but for now let's stick with " +
    'the "ready" module!\n' +
    'In order to install a module, you have to type 🖥️' +
    "```$modman install ready```Now a message indicating, that you're " +
    'missing a configuration should pop up! Those configurations are ' +
    'going to appear from time to time, when installing new modules and ' +
    'are required settings for the module to work. How to check what each ' +
    'configuration means will be shown in Part III. In this case, we simply ' +
    'need to specify a channel id, which will serve as the channel, where ' +
    'the "ready" message will pop up. To do this, we type following 🖥️, ' +
    'but make sure to use your channel-id instead of mine. This is just so you know how ' +
    'it should look like' +
    '```$modman set channel="842751898808877087"```' +
    'Now, you can install the "ready" module and everything will work as ' +
    'it should! As the last thing in this part, we\'ll uninstall "ready" ' +
    'by using 🖥️: ```$modman remove ready```This should give you a ' +
    'notification, that "ready" was removed successfully!',

  '***__Part III: Wonderful Manual ([wo]man)__***\n' +
    "Now we'll get to the interesting part. We already can list modules, " +
    'install, remove and set options for them! At the moment we still have ' +
    'no idea though what exactly those modules do! To resolve this problem, ' +
    "I created a per-default installed utility called 'man'. It provides us " +
    'with helpful information about individual modules! For example you should ' +
    'try 🖥️ ```$man ready```Now you know what we installed and removed in Part ' +
    'II. You can put any module, which is listed in `$modman search all` after ' +
    '`$man ` and receive information about it! As soon as you feel ready, you can ' +
    'open the manual entry for "modman". It\'s quite long, but also explains ' +
    'quite well what you can do in terms of module manipulation with this bot!\n' +
    "Now let's get to the last bit of this tutorial: Providing Date to Modules. " +
    'Some modules, such as "embed" require a complex data structure to be provided ' +
    "for them to work! This is exactly what we'll cover in this last part. First - " +
    'let\'s install the "embed" module, I\'ll assume you know how that goes, if ' +
    'you read everything from Part II. Now, to use it, I first recommend to read ' +
    "it's manual to grasp what it does. After having read it, you should know now " +
    'how to use the Bot.',

  '***__Part IV: Conclusion__***\n' +
    "Reevaluating everything that you've learnt in this tutorial one can say, that now " +
    "you're able to search, install, uninstall and configure modules as well as provide " +
    'data for more complex modules, such as: "embed", "fact" and "quote" (at the time of ' +
    'writing this - the only ones)!\n' +
    "I - Doomie, hope that you'll have lots of fun and find joy in using this Bot! I'm " +
    'trying to add new features as I write this, so - be prepared for more cool modules!\n' +
    '💗💗💗',
];

export class TutorialModule extends Module {
  public name: string = 'tutorial';
  types: string[] = ['MESSAGE_CREATE', 'MESSAGE_REACTION_ADD'];
  requires: string[] = [];
  man: string =
    '' +
    '***__Tutorial Module__***\n' +
    `The ${this.name} module provides an interactive ` +
    'introduction to the bot. Hopefully after going ' +
    'through the introduction, there are no open questions, ' +
    'but in case there are - feel free to message Doomie ' +
    "any time and he'll try to add a FAQ Section to the " +
    'tutorial where he answers those questions!';

  cache: { [key: string]: number } = {};

  verify = async (event: string, data: any, config: GuildConfig) => {
    return (
      event === this.types[1] ||
      (await this.cmd(data, /^tutorial$/, config)) != null
    );
  };

  // DEBUG THIS. WONT EXECUTE
  run = async (event: string, data: any, config: GuildConfig) => {
    if (event === this.types[0]) {
      let user = await getUser(data.author.id);
      let id = user.id;
      if (!this.cache[id]) this.cache[id] = 0;

      let embed: MessageEmbed = new MessageEmbed()
        .setTitle('Bot Introduction')
        .setTimestamp()
        .setDescription(pages[this.cache[id]])
        .setColor('#009900')
        .setThumbnail(
          'https://hocarm.org/content/images/2020/04/Tutorial-Graphic_Web-04-1.png'
        )
        .setFooter(`${user.username} | Quick Bot Overview`);

      let msg = await send(data.channel_id, embed);
      await msg.react('◀️');
      await msg.react('❌');
      await msg.react('✅');
    } else {
      let msg = await getMessage(data.channel_id, data.message_id);

      if (!msg || !msg.embeds || msg.embeds.length === 0) return;

      let user = await getUser(data.user_id);
      if (user.bot) return;

      let eid = data.emoji.id || data.emoji.name;

      let embed = msg.embeds[0];
      if (
        embed.title === 'Bot Introduction' &&
        embed.footer &&
        embed.footer.text
      ) {
        let username = embed.footer.text.split(' | ')[0];
        if (user.username !== username) return;

        if (this.cache[user.id] === undefined) this.cache[user.id] = -1;

        let react = await getReaction(eid, msg.id, msg.channel.id);

        if (eid === '✅') {
          this.cache[user.id] = (this.cache[user.id] + 1) % pages.length;
          embed.setDescription(pages[this.cache[user.id]]);
          await msg.edit(embed);
          await react!.remove(user.id);
          Logger.debug('[Tutorial] Removing User Reaction');
        } else if (eid === '❌') {
          this.cache[user.id] = 0;
          await msg.delete();
        } else if (eid === '◀️') {
          this.cache[user.id] =
            (pages.length + this.cache[user.id] - 1) % pages.length;
          embed.setDescription(pages[this.cache[user.id]]);
          await msg.edit(embed);
          await react!.remove(user.id);
          Logger.warn('[Tutorial] Removing User Reaction');
        }

        if (!msg.deleted) {
          await checkReactions(msg.channel.id, msg.id, ['◀️', '❌', '✅']);
        }
      }
    }
  };
}
