// Array of Search Results
export interface YouTubeSearchList {
  kind: 'youtube#searchListResponse' | 'youtube#playlistItemListResponse';
  etag: string;
  nextPageToken: string;
  regionCode: string | undefined;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeSearchResult[];
}

// Returns from `search/`- Route
export interface YouTubeSearchResult {
  kind: 'youtube#searchResult' | 'youtube#playlistItem';
  etag: string;
  id: {
    kind: 'youtube#video';
    videoId?: string;
  } | string;
  snippet: YouTubeVideo;
  contentDetails: {
    videoId: string;
    videoPublishedAt: string;
  } | undefined;
}

// Video Object
export interface YouTubeVideo {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    default: YouTubeThumbnail;
    medium?: YouTubeThumbnail;
    high?: YouTubeThumbnail;
  };
  channelTitle: string;
  playlistId: string | undefined;
  position: number | undefined;
  resourceId: {
    kind: 'youtube#video';
    videoId: string;
  } | undefined;
  videoOwnerChannelTitle: string | undefined;
  videoOwnerChannelId: string | undefined;
  liveBroadcastContent: string | undefined;
  publishTime: string | undefined;
}

// Thumbnail Format
export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}