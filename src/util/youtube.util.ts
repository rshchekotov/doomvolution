import {
  YouTubeSearchList,
  YouTubeSearchResult,
} from '@/interfaces/youtube.interface';

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

  if (!search.ok) return null;
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
