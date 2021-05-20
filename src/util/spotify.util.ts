import {
  SpotifyPlaylist,
  SpotifyToken,
  SpotifyTrack,
} from '@/interfaces/spotify.interface';
import fetch from 'node-fetch';

export async function authSpotify(): Promise<SpotifyToken | null> {
  let client = <string>process.env.spotify_client;
  let secret = <string>process.env.spotify_secret;

  let tokreq = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${client}:${secret}`)}`,
    },
    body: 'grant_type=client_credentials',
  });
  if (!tokreq.ok) return null;
  return <SpotifyToken>await tokreq.json();
}

export async function getSpotifyTrack(
  id: string,
  token: SpotifyToken
): Promise<SpotifyTrack | null> {
  let trackreq = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${token.access_token}`,
    },
  });
  if (!trackreq.ok) return null;
  return <SpotifyTrack>await trackreq.json();
}

export async function getSpotifyPlaylist(
  id: string,
  token: SpotifyToken
): Promise<SpotifyPlaylist | null> {
  let plreq = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${token.access_token}`,
    },
  });
  if (!plreq.ok) return null;
  return <SpotifyPlaylist>await plreq.json();
}
