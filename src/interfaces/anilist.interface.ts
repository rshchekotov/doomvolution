export interface AniListResult {
  type: string;
  title: { romaji: string; english: string; native: string };
  description: string;
  coverImage: { large: string };
  siteUrl: string;
  tags: { name: string }[];
}
