import { Client } from 'discord.js';
import * as Cache from 'node-cache';
import { GuildEventHandler } from './events/guild.handler';
import { configure, options } from './services/config.service';
import { Logger } from './services/logger.service';

const guilds = new Cache();
const botDevs = [
  '835090016119685141',
  '756757056941326397',
  '754575352998658049',
  '539910274698969088'
];

let events = {
  guild: ['GUILD_CREATE'],
  message: ['MESSAGE_CREATE', 'MESSAGE_UPDATE'],
  reaction: ['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'],
  member: ['GUILD_MEMBER_UPDATE', 'GUILD_MEMBER_ADD'],
  presence: ['PRESENCE_UPDATE'],
  void: [
    'READY',
    'TYPING_START',
    'MESSAGE_DELETE',
    'MESSAGE_REACTION_REMOVE_ALL',
  ],
};

let client: Client;

async function start() {
  await configure();
  client = new Client(options);

  client.on('raw', (data) => {
    if (!data.t) return;

    if (events.void.includes(data.t)) {
      // print > /dev/null
    } else if (events.guild.includes(data.t)) {
      if (data.t === 'GUILD_CREATE') {
        new GuildEventHandler(data.d);
      }
    } else if (
      events.message.includes(data.t) ||
      events.member.includes(data.t) ||
      events.presence.includes(data.t) ||
      events.reaction.includes(data.t)
    ) {
      let gid = data.d.guild_id;
      let guildHandler: GuildEventHandler = guilds.get(gid)!;
      guildHandler.handleEvent(data.t, data.d);
    } else {
      Logger.debug(data.t);
    }
  });

  await client.login(process.env.build_token);

  // Setup Image
  try {
    if (!client.user) return;
    await client.user.setAvatar(
      'https://c.wallhere.com/photos/c3/d3/simple_background_bandage_Darling_in_the_FranXX_feet_horns_Zero_Two_Darling_in_the_FranXX-1332201.jpg!d'
    );
  } catch {
    Logger.warn('Profile Picture unchanged!');
  }
}

start();

export { client, guilds, botDevs };
