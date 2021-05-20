export interface SpotifyToken {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
}

export interface SpotifyPlaylist {
  collaborative: boolean;
  description: string;
  external_urls: { spotify: string };
  followers: { href: any; total: number };
  href: string;
  id: string;
  images: {
    height: number;
    width: number;
    url: string;
  }[];
  name: string;
  owner: {
    display_name: string;
    external_urls: { spotify: string };
    href: string;
    id: string;
    type: 'user';
    uri: string;
  };
  primary_color: any;
  public: boolean;
  snapshot_id: string;
  tracks: {
    href: string;
    items: SpotifyPlaylistItem[];
    limit: number;
    next: any;
    offset: number;
    previous: any;
    total: number;
  };
  type: 'playlist';
  uri: string;
}

export interface SpotifyPlaylistItem {
  added_at: string;
  added_by: any;
  is_local: boolean;
  primary_color: any;
  track: SpotifyTrack;
  video_thumbnail: { url: string | null };
}

export interface SpotifyUser {
  external_urls: { spotify: string };
  href: string;
  id: string;
  type: 'user';
  uri: string;
}

export interface SpotifyTrack {
  album: SpotifyAlbum;
  artists: SpotifyArtist[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: { isrc: string };
  external_urls: { spotify: string };
  href: string;
  id: string;
  is_local: boolean;
  name: string;
  popularity: number;
  preview_url: string | null;
  track_number: number;
  type: 'track';
  uri: string;
}

export interface SpotifyAlbum {
  album_type: string;
  artists: string[];
  available_markets: string[];
  external_urls: { spotify: string };
  href: string;
  id: string;
  images: {
    height: number;
    width: number;
    url: string;
  }[];
  name: string;
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  type: 'album';
  uri: string;
}

export interface SpotifyArtist {
  external_urls: { spotify: string };
  href: string;
  id: string;
  name: string;
  type: 'artist';
  uri: string;
}
