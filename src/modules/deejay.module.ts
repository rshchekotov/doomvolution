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
import {
  Message,
  MessageEmbed,
  StreamDispatcher,
  VoiceConnection,
} from 'discord.js';
import * as ytdl from 'ytdl-core';
import { Readable } from 'stream';
import { Logger } from '@/services/logger.service';

const dj = ['dj', 'deejay'];
const play = ['play', 'p'];
const dc = ['dc', 'disconnect', 'kill'];
const queue = ['queue', 'q'];
const np = ['now', 'n', 'np'];
const skip = ['s', 'skip'];
const clear = ['clear', 'cl'];
const rm = ['rm', 'remove'];
const shuffle = ['shuffle'];

const media =
  /(\w+) https:\/\/(open\.spotify\.com|(?:w{3}\.)?youtube\.com|youtu\.be)\/(track\/\w+|playlist(?:\/\w+|\?list=[\w\-]+)|watch\?v=\w+(?:&list=[\w\-]+)?|[\w\-]+$)/;

/*
  TODO:
  => Swap Tracks
  => Track Duration
  => Queue Duration
  => Queue Embed Formatting
  => SkipTo Subcommand
  => Seek Subcommand
  => Create/Load Playlist
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
      "this is heavily work in progress, so it's not even " +
      "close to being where it's gonna be at some point!\n" +
      '1. **Play**\n' +
      '```\n$dj play [yt/spotify-url]\n```' +
      '2. **Queue**\n' +
      '```\n$dj queue\n```' +
      '3. **Now Playing**\n' +
      '```\n$dj now\n```' +
      '4. **Disconnect**\n' +
      '```\n$dj disconnect\n```',
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

    this.dispatcher
      .on('finish', () => {
        this.queue.shift(); // Remove Played Item
        if (this.queue.length >= 1) return this.play(connection);
        this.track = null;
      })
      .on('error', (e) => {
        msg.reply('Error. Something went South!');
        Logger.error(e);
        return channel.leave();
      });
  };

  track: Readable | null = null;
  play = (connection: VoiceConnection) => {
    if (this.dispatcher) this.dispatcher.destroy();
    let link = this.queue[0]!.link;
    this.track = ytdl(link, {
      quality: 'highestaudio',
      highWaterMark: 1024 * 1024 * 10,
    });
    return connection.play(this.track);
  };

  verify = async (event: string, data: any, config: GuildConfig) => {
    return (await this.cmd(data, this.re, config)) !== null;
  };

  run = async (event: string, data: any, config: GuildConfig) => {
    Logger.debug('Verification Passed');
    let match = (await this.cmd(data, this.re, config))!;

    if (dj.includes(match[1]) && match[2]) {
      Logger.debug('Command Passed');
      let message = await getMessage(data.channel_id, data.id);
      if (!message || !message.guild || !message.member) return;
      Logger.debug('Message from Guild!');
      if (!message.member.voice || !message.member.voice.channel) {
        message.reply('You have to be in a Voice Channel to use this command!');
        return;
      }

      let sub = /^(\w+) ?(.*)/.exec(match[2]);
      if (!sub) return; // If no sub-command

      if (play.includes(sub[1])) {
        let qstate = this.queue.length === 0;
        let query = media.exec(match[2]);
        if (!query) return;

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
            token = <SpotifyToken>this.cache.get('token');
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
            if (!entry) return;
            this.queue.push(entry);
          } else if (type.startsWith('playlist')) {
            // Get Spotify Playlist
            let list = await getSpotifyPlaylist(type.split('/')[1], token);
            if (!list) {
              Logger.warn('[SP] Spotify Playlist was not found!');
              return;
            }

            // Iterate over List
            for (let item of list.tracks.items) {
              let entry = await Spotify(item.track);
              if (!entry) return;
              this.queue.push(entry);
            }
          }
        } else if (provider.includes('youtu')) {
          let type = query[3];
          let match: null | RegExpExecArray;

          // YouTube Playlists
          if ((match = /(?<=(?:&list=))[\w\-]+/.exec(type))) {
            let id = match[0];
            await message.channel.send(
              "YouTube Playlists are currently not supported, but it's on the ToDo List though!"
            );
            // YouTube Standard
          } else if ((match = /(?<=(?:watch\?v=))[\w\-]+/.exec(type))) {
            let entry = await YouTube(match[0]);
            if (!entry) return;
            this.queue.push(entry);
            // YouTube Mobile
          } else if (/[\w\-]+/.test(type)) {
            let entry = await YouTube(type);
            if (!entry) return;
            this.queue.push(entry);
          }
        }

        // Launch Voice Connection
        // if the only song added
        // is the current one.
        await message.channel.send(
          'Added ' + this.queue.length + ' song(s) to the queue!'
        );
        if (qstate) {
          await this.init(message);
        }
      } else if (dc.includes(sub[1])) {
        let voice = message.member.voice.channel;
        this.queue = []; // Clear Queue
        if (this.dispatcher) {
          try {
            voice?.leave();
            this.dispatcher.pause();
            this.dispatcher.destroy();
          } catch {
            Logger.warn('Something went wrong during Voice Disconnect!');
          }
        }
        message.channel.send(`*Disconnected*`);
      } else if (queue.includes(sub[1])) {
        let embed = new MessageEmbed()
          .setTitle(`Nothing's playing on the Server!`)
          .setColor(`#990000`)
          .setTimestamp();
        if (this.queue.length < 1) {
          await message.channel.send(embed);
          return;
        }

        let q = this.queue
          .slice(0, 10)
          .map((e, i) => `${i}) ${e.title} - ${e.artist}`)
          .join('\n');
        embed.setTitle('Queue');
        embed.setDescription(q);

        await message.channel.send(embed);
      } else if (np.includes(sub[1])) {
        let embed = new MessageEmbed()
          .setTitle(`Nothing's playing on the Server!`)
          .setColor(`#990000`)
          .setTimestamp();
        if (this.queue.length < 1) {
          await message.channel.send(embed);
          return;
        }

        embed.setTitle(`${this.queue[0].title} - ${this.queue[0].artist}`);
        embed.setImage(
          this.queue[0].cover ||
            'https://4.bp.blogspot.com/-FUoPaGKn0FA/Tlys73-VTnI/AAAAAAAABwg/_oVT_8_n7L4/s1600/house_electro_music_wallpaper_5.jpg'
        );
        embed.setURL(this.queue[0].link);
        await message.channel.send(embed);
      } else if (skip.includes(sub[1])) {
        let times = 1;

        if (sub[2]) {
          let tmp = Number(sub[2]);
          if (!Number.isNaN(tmp)) times = tmp;
        }

        let track;
        for (let i = 0; i < times; i++) {
          track = this.queue.shift();
        }

        if (!track) {
          message.channel.send(`Queue already empty!`);
          return;
        } else {
          message.channel.send(
            `Popped ${
              times === 1 ? track.title : `${times} items`
            } off the queue!`
          );
        }

        if (this.queue.length > 0) this.init(message);
      } else if (clear.includes(sub[1])) {
        message.channel.send(
          `Successfully Cleared ${this.queue.length} items!`
        );
        this.queue = this.queue[0] ? [this.queue[0]] : [];
      } else if (rm.includes(sub[1])) {
        let track = Number(sub[2]);
        if (Number.isNaN(track) || track >= this.queue.length) return;
        this.queue = this.queue.filter((e, i) => i !== track);
        message.channel.send(`Successfully Removed Track ${track}!`);
      } else if (shuffle.includes(sub[1])) {
        if (this.queue.length === 0) {
          await message.channel.send("Queue's empty!");
          return;
        }
        let playing = this.queue.shift()!;
        for (let i = this.queue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          let tmp = this.queue[j];
          this.queue[j] = this.queue[i];
          this.queue[i] = tmp;
        }
        this.queue.unshift(playing);
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
  let result = await searchYouTubeV2(
    `${track.name} - ${track.artists[0].name} - Lyrics`
  );
  return formatSearch(result);
}

async function formatSearch(item: YTSRItem | null) {
  if (!item) {
    Logger.warn('[YT] Error while fetching YouTube Video!');
    return;
  }

  if (item.type === 'video') {
    return {
      title: item.title,
      artist: item.author!.name,
      link: item.url,
      cover: item.bestThumbnail!.url,
    };
  } else {
    return {
      title: item.firstVideo?.title!,
      artist: `Playlist by ${item.owner}`,
      link: item.url,
      cover: item.firstVideo?.bestThumbnail.url!,
    };
  }
}
