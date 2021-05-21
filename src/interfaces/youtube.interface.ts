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

export interface YTSRObject {
  originalQuery: string;
  correctedQuery: string;
  results: number;
  activeFilters: {
    name: string;
    active: boolean;
    url: any;
    description: string;
  }[];
  refinements: any[];
  items: YTSRItem[];
  continuation: any;
}

export interface YTSRItem {
  type: 'video' | 'playlist';
  title: string;
  id: string | undefined; // For Videos
  playlistID: string | undefined; // For Playlists
  url: string;
  firstVideo: {
    id: string;
    shortURL: string;
    url: string;
    title: string;
    length: string;
    bestThumbnail: YouTubeThumbnail;
    thumbnails: YouTubeThumbnail[];
  } | undefined; // For Playlists
  bestThumbnail: YouTubeThumbnail | undefined;
  thumbnails: YouTubeThumbnail[] | undefined;
  isUpcoming: boolean | undefined;
  upcoming: any | undefined;
  isLive: boolean | undefined;
  badges: any[] | undefined;
  author: YouTubeCreator | undefined; // For Videos
  owner: YouTubeCreator | undefined; // For Playlists
  description: any | undefined;
  views: number | undefined;
  duration: string | undefined;
  uploadedAt: string | undefined;
  publishedAt: any | undefined; // Playlists
  length: number | undefined;
}

export interface YouTubeCreator {
  name: string;
  channelID: string;
  url: string;
  bestAvatar: YouTubeThumbnail | undefined;
  avatars: YouTubeThumbnail[] | undefined;
  ownerBadges: string[];
  verified: boolean;
}