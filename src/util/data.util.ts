import { Logger } from '@/services/logger.service';

export const jsonRegex =
  /(?:```json\n)?({[\n ]*(?:[\t ]*(?:['"`][^'"`]+['"`]|[\d\.]+): ?(?:['"`][^'"`]+['"`]|[\d\.]+)[,]?[\n ]*)*})(?:\n```)?/;
export const tomlRegex = /(?:```toml\n)?((?:[^=]+=[^=\n]+\n)*)(?:```)?/;

export function parseData(data: string): any | null {
  let match: RegExpExecArray | null = null;
  let obj: any = {};

  if ((match = jsonRegex.exec(data)) !== null) {
    try {
      obj = JSON.parse(match![1]);
    } catch {
      Logger.error('[DataUtil]: Invalid JSON Format');
    }
  } else if ((match = tomlRegex.exec(data)) !== null) {
    let lines: string[] = data.split(/\n/);
    lines.forEach((line) => {
      let tok = kvSplit(line, '=', ' ');
      if (tok.length === 0) return;

      let num = !Number.isNaN(parseFloat(tok[1])); // isNumber
      let str = isJSONString(tok[1]); // isJSONString

      Logger.debug(`${tok[0]} => ${tok[1]} (${num}, ${str})`);
      obj[tok[0]] = num
        ? parseFloat(tok[1]) // Number
        : str
        ? tok[1].slice(1, -1) // JSON String
        : tok[1]; // Plain Value
    });
  } else {
    return null;
  }

  return obj;
}

export function kvSplit(data: string, ...delims: string[]) {
  let match = /[ =>:]+/.exec(data); // TODO: Fix to include Variable Delims instead!
  Logger.debug(`${JSON.stringify(match)}`);
  if (match && match[0]) {
    let split = Math.min(
      ...delims.map((e) => data.indexOf(e)).filter((e) => e !== -1)
    );
    let key = data.substr(0, split);
    let value = data.substr(split + match[0].length);
    
    // Try Parsing the Value to JSON.
    try { value = JSON.parse(value); }
    catch { value = data.substr(split + match[0].length); }

    // If is JSON String:
    if(typeof value !== 'object' && isJSONString(value)) value = value.slice(1,-1);

    return [key, value];
  } else return [];
}


function isJSONString(obj: any) {
  let str = obj.toString();
  let s = str.charAt(0);
  let e = str.charAt(str.length-1);
  return (s === e && [`'`,`"`].includes(s));
}