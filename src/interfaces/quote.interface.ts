export interface Quote {
  quote: string; //quote text
  author: string; //original quote author
  addedBy: string; //message author id
  type: 'ANIME' | 'LIFE'; //quote type
  date?: string;
  show?: string;
  image?: string;
  link?: string;
}
