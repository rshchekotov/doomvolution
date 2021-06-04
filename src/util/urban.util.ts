import { UrbanResult } from '@/interfaces/urban.interface';
import fetch from 'node-fetch';

const url = 'http://api.urbandictionary.com/v0/define?term=';

export async function searchDefinition(term: string) {
  let response = await fetch(url + term);
  if (response.ok) {
    let definitions: UrbanResult[] = (await response.json()).list;
    return definitions;
  }
}