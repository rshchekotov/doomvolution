import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Module } from '@/interfaces/module.interface';
import * as Cache from 'node-cache';
import { getChannel, getMessage, send } from '@/util/discord.util';
import {
  authSpotify,
  getSpotifyPlaylist,
  getSpotifyTrack,
} from '@/util/spotify.util';
import { SpotifyToken, SpotifyTrack } from '@/interfaces/spotify.interface';
import { searchYouTubeV2 } from '@/util/youtube.util';
import { YTSRItem } from '@/interfaces/youtube.interface';
import { Message, MessageEmbed, StreamDispatcher, VoiceConnection } from 'discord.js';
import * as ytdl from 'ytdl-core';
import { Logger } from '@/services/logger.service';

const dj = ['dj', 'deejay'];
const play = ['play', 'p'];
const dc = ['dc','disconnect','kill'];
const queue = ['queue', 'q'];
const np = ['now', 'n', 'np'];

const media =
  /(\w+) https:\/\/(open\.spotify\.com|(?:w{3}\.)?youtube\.com|youtu\.be)\/(track\/\w+|playlist(?:\/\w+|\?list=[\w\-]+)|watch\?v=\w+(?:&list=[\w\-]+)?|[\w\-]+$)/;

/*
  Test Data:

  play https://open.spotify.com/track/6YUTL4dYpB9xZO5qExPf05?si=d50d97c3d17c49bf
  play https://open.spotify.com/playlist/6PXdsh1VLGoq7Tf8H64ICa?si=1ab63813e8184d57
  play https://www.youtube.com/watch?v=SbelQW2JaDQ
  play https://www.youtube.com/watch?v=RgKAFK5djSk&list=PL_UQIFzJwtppLzhVvwicH4IG5o5QL-T1e
*/

export class DeeJayModule extends Module {
  public name: string = 'deejay';
  types: string[] = ['MESSAGE_CREATE'];
  requires: string[] = [];
  man: string[] = [
    '***__DJ Module__***\n' +
    `The ${this.name} module is made to listen to music ` +
    '- this is an early attempt, so there might be some ' +
    "issues, but eventually I'll make this work at least " +
    'as good as Rythm, including custom features, such as ' +
    'the creation of a playlist from the current queue and ' +
    'similar!',
    '**_Command Reference_**\n' +
    'At the moment there are 4 available commands with a ' +
    'few aliases for convenience sake! All of them are ' +
    'prefixed with `$dj` and have to be executed whilst ' +
    'in a voice channel!\nPlease keep in mind that all of ' +
    'this is heavily work in progress, so it\'s not even ' +
    'close to being where it\'s gonna be at some point!\n' +
    '1. **Play**\n' +
    '```\n$dj play [yt/spotify-url]\n```' +
    '2. **Queue**\n' +
    '```\n$dj queue\n```' +
    '3. **Now Playing**\n' +
    '```\n$dj now\n```' +
    '4. **Disconnect**\n' +
    '```\n$dj disconnect\n```'
  ];

  re: RegExp = /^(\w+) ?(.*)/;

  // Cache for Tokens
  cache = new Cache();

  // Play Queue
  queue: {
    title: string;
    artist: string;
    link: string;
    cover?: string;
  }[] = [];

  // Dispatcher
  dispatcher: StreamDispatcher | undefined;

  init = async (msg: Message) => {
    let channel = msg.member!.voice.channel!;
    let connection = await channel.join();
    this.dispatcher = this.play(connection);

    this.dispatcher.on('finish', () => {
      this.queue.shift(); // Remove Played Item
      if(this.queue.length > 1)
        return this.play(connection);
      channel.leave();
    }).on('error', e => {
      msg.reply('Error. Something went South!');
      Logger.error(e);
      return channel.leave();
    });
  }

  play = (connection: VoiceConnection) => {
    if(this.dispatcher) this.dispatcher.destroy();
    let link = this.queue[0]!.link;

    return connection.play(ytdl(link, {
      quality: "highestaudio",
      highWaterMark: 1024 * 1024 * 10
    }));
  }

  verify = async (event: string, data: any, config: GuildConfig) => {
    return (await this.cmd(data, this.re, config)) !== null;
  };

  run = async (event: string, data: any, config: GuildConfig) => {
    Logger.debug('Verification Passed');
    let match = (await this.cmd(data, this.re, config))!;

    if (dj.includes(match[1]) && match[2]) {
      Logger.debug('Command Passed');
      let message = await getMessage(data.channel_id, data.id);
      if(!message || !message.guild || !message.member) return;
      Logger.debug('Message from Guild!');
      if(!message.member.voice || !message.member.voice.channel) {
        message.reply('You have to be in a Voice Channel to use this command!');
        return;
      }

      let sub = /^(\w+) ?.*/.exec(match[2]);
      if (!sub) return; // If no sub-command

      if (play.includes(sub[1])) {
        let qstate = this.queue.length === 0;
        let query = media.exec(match[2]);
        if(!query) return;

        let provider = query[2];
        if (provider.includes('spotify')) {
          let token: SpotifyToken;
          if (!this.cache.has('token')) {
            let tokObj = await authSpotify();
            if (!tokObj) {
              Logger.warn('Spotify Authentication Failed!');
              return; // Auth Failed.
            }
            this.cache.set('token', tokObj, tokObj.expires_in);
            token = tokObj;
          } else {
            token = <SpotifyToken> this.cache.get('token');
          }

          let type = query[3];
          if (type.startsWith('track')) {
            // Get Spotify Track
            let track = await getSpotifyTrack(type.split('/')[1], token);
            if (!track) {
              Logger.warn('[ST] Spotify Track was not found!');
              return;
            }
            // Get Entry
            let entry = await Spotify(track);
            if(!entry) return;
            this.queue.push(entry);
          } else if (type.startsWith('playlist')) {
            // Get Spotify Playlist
            let list = await getSpotifyPlaylist(type.split('/')[1], token);
            if (!list) {
              Logger.warn('[SP] Spotify Playlist was not found!');
              return
            };
            
            // Iterate over List
            for(let item of list.tracks.items) {
              let entry = await Spotify(item.track);
              if(!entry) return;
              this.queue.push(entry);
            }
          }
        } else if (provider.includes('youtu')) {
          let type = query[3];
          let match: null | RegExpExecArray;

          // YouTube Playlists
          if ((match = /(?<=(?:&list=))[\w\-]+/.exec(type))) {
            let id = match[0];
            await message.channel.send('YouTube Playlists are currently not supported, but it\'s on the ToDo List though!');
            // YouTube Standard
          } else if ((match = /(?<=(?:watch\?v=))[\w\-]+/.exec(type))) {
            let entry = await YouTube(match[0]);
            if(!entry) return;
            this.queue.push(entry);
            // YouTube Mobile
          } else if (/[\w\-]+/.test(type)) {
            let entry = await YouTube(type);
            if(!entry) return;
            this.queue.push(entry);
          }
        }

        // Launch Voice Connection
        // if the only song added
        // is the current one.
        if(qstate) {
          await this.init(message);
        }
      } else if(dc.includes(sub[1])) {
        let voice = message.member.voice.channel;
        this.queue = []; // Clear Queue
        if(this.dispatcher) {
          try {
            voice?.leave();
            this.dispatcher.pause();
            this.dispatcher.destroy();
          } catch {
            Logger.warn('Something went wrong during Voice Disconnect!');
          }
        }
      } else if(queue.includes(sub[1])) {
        let q = this.queue.map(e => `${e.title} - ${e.artist}`).join('\n');

        await message.channel.send(q);
      } else if(np.includes(sub[1])) {
        let embed = new MessageEmbed()
          .setTitle(`Nothing's playing on the Server!`)
          .setColor(`#990000`)
          .setTimestamp();
        if(this.queue.length < 1) {
          await message.channel.send(embed);
          return;
        }
        
        embed.setTitle(`${this.queue[0].title} - ${this.queue[0].artist}`);
        embed.setImage(this.queue[0].cover || 'https://4.bp.blogspot.com/-FUoPaGKn0FA/Tlys73-VTnI/AAAAAAAABwg/_oVT_8_n7L4/s1600/house_electro_music_wallpaper_5.jpg');
        embed.setURL(this.queue[0].link);
        await message.channel.send(embed);    
      }
    }
  };
}

async function YouTube(id: string) {
  // Fetch from YouTube!
  let result = await searchYouTubeV2(id);
  return formatSearch(result);
}

async function Spotify(track: SpotifyTrack) {
  // Fetch Videos
  let result = await searchYouTubeV2(`${track.name} - ${track.artists[0].name} - Lyrics`);
  return formatSearch(result);
}

async function formatSearch(item: YTSRItem | null) {
    if (!item) {
      Logger.warn('[YT] Error while fetching YouTube Video!');
      return;
    };
  
    if(item.type === 'video') {
      return {
        title: item.title,
        artist: item.author!.name,
        link: item.url,
        cover: item.bestThumbnail!.url
      };
    } else {
      return {
        title: item.firstVideo?.title!,
        artist: `Playlist by ${item.owner}`,
        link: item.url,
        cover: item.firstVideo?.bestThumbnail.url!
      }
    }
}