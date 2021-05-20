import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Module } from '@/interfaces/module.interface';
import * as Cache from 'node-cache';
import { getMessage } from '@/util/discord.util';
import {
  authSpotify,
  getSpotifyPlaylist,
  getSpotifyTrack,
} from '@/util/spotify.util';
import { SpotifyToken, SpotifyTrack } from '@/interfaces/spotify.interface';
import { getPlaylist, searchYouTube } from '@/util/youtube.util';
import { YouTubeSearchList, YouTubeSearchResult, YouTubeVideo } from '@/interfaces/youtube.interface';
import { Message, StreamDispatcher, VoiceChannel, VoiceConnection } from 'discord.js';
import ytdl from 'ytdl-core';
import { Logger } from '@/services/logger.service';

const dj = ['dj'];
const play = ['play'];
const dc = ['dc','disconnect','kill'];

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
  man: string =
    '' +
    '***__DJ Module__***\n' +
    `The ${this.name} module is made to listen to music ` +
    '- this is an early attempt, so there might be some ' +
    "issues, but eventually I'll make this work at least " +
    'as good as Rythm, including custom features, such as ' +
    'the creation of a playlist from the current queue and ' +
    'similar!';

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

    return connection.play(ytdl(this.queue[0].link, {
      quality: "highestaudio",
      highWaterMark: 1024 * 1024 * 10
    }));
  }

  verify = async (event: string, data: any, config: GuildConfig) => {
    return (await this.cmd(data, this.re, config)) !== null;
  };

  run = async (event: string, data: any, config: GuildConfig) => {
    let match = (await this.cmd(data, this.re, config))!;

    if (dj.includes(match[1]) && match[2]) {
      let message = await getMessage(data.channel_id, data.is);
      if(!message || !message.guild || !message.member) return;
      if(!message.member.voice || !message.member.voice.channel) {
        message.reply('You have to be in a Voice Channel to use this command!');
        return;
      }

      let sub = media.exec(match[2]);
      if (!sub) return; // If no sub-command

      if (play.includes(sub[1])) {
        let provider = sub[2];
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

          let type = sub[3];
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
          let type = sub[3];
          let match: null | RegExpExecArray;

          // YouTube Playlists
          if ((match = /(?<=(?:&list=))[\w\-]+/.exec(type))) {
            let id = match[0];
            let list = await getPlaylist(id);
            if (!list) {
              Logger.warn('Could not find YouTube Playlist!');
              return;
            };
            list.forEach(item => {
              let video: YouTubeVideo = item.snippet;

              this.queue.push({
                title: video.title,
                artist: video.videoOwnerChannelTitle || video.channelTitle,
                link: `https://www.youtube.com/watch?v=${video.resourceId!.videoId}`,
                cover: video.thumbnails.default.url,
              });
            });
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
        if(!this.dispatcher && this.queue.length > 0) {
          await this.init(message);
        }
      }
    } else if(dc.includes(match[1])) {
      if(this.dispatcher) {
        this.dispatcher.destroy();
      }
    }
  };
}

async function YouTube(id: string) {
  // Fetch from YouTube!
  let result:
  | undefined | null
  | YouTubeSearchResult
  | Array<YouTubeSearchResult> = await searchYouTube(id);

  // Get First Hit
  if (result instanceof Array) result = result.shift();

  // If `error` or no first element.
  if (!result || result.kind === 'youtube#playlistItem') {
    Logger.warn('[YT] Error while fetching YouTube Video!');
    return;
  };

  let video: YouTubeVideo = <YouTubeVideo> result.snippet;
  let thumbs = video.thumbnails;
  return {
    title: video.title,
    artist: video.videoOwnerChannelTitle || video.channelTitle,
    link: `https://www.youtube.com/watch?v=${id}`,
    cover: (thumbs.high || thumbs.medium || thumbs.default).url
  };
}

async function Spotify(track: SpotifyTrack) {
  // Fetch Videos
  let videos = await searchYouTube(`${track.name} - ${track.artists[0].name} - Lyrics`);
  if(!videos || (videos instanceof Array && videos.length < 1)) {
    Logger.warn('[ST] Could not get Spotify Track!');
    return;
  }

  // Get Single Video
  let video: YouTubeSearchResult = (videos instanceof Array) ? videos.shift()! : videos;

  // Pass items into Queue
  let link = ((typeof video.id === 'object') ? video.id.videoId! : video.contentDetails?.videoId);
  if(!link) {
    Logger.warn('[ST] Link could not be processed!');
    return;
  }

  return {
    title: track.name,
    artist: track.artists[0].name,
    link: `https://www.youtube.com/watch?v=${link}`,
    cover: track.album.images[0].url
  };
}