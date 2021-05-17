import { Logger } from "@/services/logger.service";

export const jsonRegex = /(?:```json\n)?({[\n ]*(?:[\t ]*(?:['"`][^'"`]+['"`]|[\d\.]+): ?(?:['"`][^'"`]+['"`]|[\d\.]+)[,]?[\n ]*)*})(?:\n```)?/;
export const tomlRegex = /(?:```toml\n)?((?:[^=]+=[^=\n]+\n)*)(?:```)?/;

export function parseData(data: string): any | null {
    let match: RegExpExecArray | null = null;
    let obj: any = {};

    if((match = jsonRegex.exec(data)) !== null) {
        try {
            obj = JSON.parse(match![1]);
        } catch {
            Logger.error('[DataUtil]: Invalid JSON Format');
        }
    } else if((match = tomlRegex.exec(data)) !== null) {
        let lines: string[] = data.split(/\n/);
        lines.forEach(line => {
            let tok = kvSplit(line, '=', ' ');
            if(tok.length === 0) return;

            let num = !Number.isNaN(parseFloat(tok[1])); // isNumber
            let str = /^["'][^"']+["']$/.exec(tok[1]) != null; // isJSONString

            Logger.debug(`${tok[0]} => ${tok[1]} (${num}, ${str})`);
            obj[tok[0]] = num ? 
                parseFloat(tok[1]) :        // Number
                (str ? 
                    tok[1].slice(1,-1) :    // JSON String 
                    tok[1]);                // Plain Value
        });
    } else {
        return null;
    }

    return obj;
}

export function kvSplit(data: string, ...delims: string[]) {
    let match = /[ =>:]+/.exec(data);
    if(match && match[0]) {
        let split = Math.min(...delims.map(e => data.indexOf(e)).filter(e => e !== -1));
        return [
            data.substr(0, split),
            data.substr(split + match[0].length)
        ];
    } else return [];
}