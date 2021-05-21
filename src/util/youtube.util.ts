import {
  YouTubeSearchList,
  YouTubeSearchResult,
  YTSRObject,
} from '@/interfaces/youtube.interface';
import { Logger } from '@/services/logger.service';
import fetch from 'node-fetch';
import * as ytsr from 'ytsr';

const options = {
  limit: 5
};

export async function searchYouTubeV2(term: string): Promise<any> {
  const results: YTSRObject = <YTSRObject> (await ytsr(term, options));
  return results.items[0] || null;
}

export async function searchYouTube(
  term: string,
  top?: boolean
): Promise<null | YouTubeSearchResult | YouTubeSearchResult[]> {
  
  let api_key = <string>process.env.youtube_key;
  let search = await fetch(
    `https://www.googleapis.com/youtube/v3/search?key=${api_key}&type=video&part=snippet&maxResults=10&q=${term}`,
    {
      method: 'GET',
    }
  );

  if (!search.ok) {
    Logger.warn(JSON.stringify(search));
    return null;
  };

  let results: YouTubeSearchList = await search.json();

  if (top) return results.items[0];
  else return results.items;
}

export async function getPlaylist(id: string) {
    let api_key = <string>process.env.youtube_key;
    let search = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?key=${api_key}&part=contentDetails,snippet&playlistId=${id}&maxResults=10`,
      {
          method: 'GET',
      }
    );

    if(!search.ok) return null;
    let results: YouTubeSearchList = await search.json();
    return results.items;
}
