import { guilds } from '@/app';
import { GuildEventHandler } from '@/events/guild.handler';
import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Module } from '@/interfaces/module.interface';
import { getMessage, send } from '@/util/discord.util';
import { choose } from '@/util/random.util';

const react = ['react', 'r'];
const structure = ['structure', 'struct', 'list', 'ls', 'all', 'available'];

function create(obj: any, path: string[], data: string) {
  let location = path.shift()!;

  let pre = obj[location];
  if (pre) {
    if (typeof pre === 'string') {
      if (path.length > 0) {
        obj[location] = create({ default: [pre] }, path, data);
      } else {
        obj[location] = [pre, data];
      }
    } else if (pre instanceof Array) {
      if (path.length > 0) {
        obj[location] = create({ default: pre }, path, data);
      } else {
        obj[location].push(data);
      }
    } else {
      if (path.length > 0) {
        obj[location] = create(obj[location], path, data);
      } else {
        if (!obj[location].default) obj[location].default = [data];
        else obj[location].default.push(data);
      }
    }
  } else {
    if (path.length > 0) {
      obj[location] = create({}, path, data);
    } else {
      obj[location] = [data];
    }
  }

  return obj;
}

function getArray(obj: any, path: string[]) {
  if (path.length < 1) {
    if (typeof obj === 'string') return [obj];
    if (obj instanceof Array) return obj;

    let res: string[] = [];
    for (let a in obj) res = res.concat(getArray(obj[a], path));
    return res;
  }

  let location = path.shift()!;
  if (!obj[location]) return [];
  else return getArray(obj[location], path);
}

export class ReactModule extends Module {
  public name: string = 'react';
  types: string[] = ['MESSAGE_CREATE'];
  requires: string[] = [];
  man: string[] = [
    '***__React Module__***\n' +
      `The ${this.name} module provides reaction ` +
      'images and allows to add them.',
    '_**Adding Reactions**_\n' +
      'In order to add a reaction, you need to specify ' +
      'a path where it will be stored and the source to ' +
      'the reaction image! The path is separated by ' +
      'either `.`, `>` or `/` or simply a space (` `) and ' +
      'indicates the structure of where the Image Link will be stored!\n' +
      'As an Example: 02.smug would store the image inside the ' +
      'smug folder, which itself is in the 02 folder!\n' +
      'The image also must meet a few requirements! It has to be ' +
      'ending with a valid image extension (png/jpg/jpeg/gif) and ' +
      'has to be starting with `http[s]://`.\n\n' +
      '**Example:** ' +
      '```\n$react 02.smile https://i.imgur.com/MS5CAkN.jpeg\n```',
    '_**Available Reactions**_\n' +
      'To list all currently available reactions, you can simply ' +
      "type: `$react all` or one of it's aliases.\n" +
      `*Aliases:* ${structure.join(', ')}`,
    '_**React**_\n' +
      'You can simply react (make a reaction image pop up) by ' +
      'typing `+react path`. If there are multiple images found ' +
      'it will pick a random one. If you want a specific one, out ' +
      'of a collection you can specify an index!\n' +
      'With the Example from Page 2, you can specify the first image ' +
      'found in the folder `02>smug` by typing: ' +
      '```\n$react 02>smug>0\n```',
  ];

  re: RegExp = /(\w+) (.+)/;

  verify = async (event: string, data: any, config: GuildConfig) => {
    return (await this.cmd(data, this.re, config)) !== null;
  };

  run = async (event: string, data: any, config: GuildConfig) => {
    let match = await this.cmd(data, this.re, config);
    let keyword = match![1];
    if (react.includes(keyword)) {
      let content = match![2];
      if (structure.includes(content)) {
        let struc = config.data.react || {};
        let response = '';
        let indentation = 0;

        let print = (object: any) => {
          Object.keys(object).forEach((key) => {
            let l = object[key].length;
            response +=
              '\t'.repeat(indentation) + `${key} ${l ? `(${l})` : '{'}\n`;
            if (!object[key][0]) {
              indentation++;
              print(object[key]);
              indentation--;
              response += '\t'.repeat(indentation) + '}\n';
            }
          });
        };
        print(struc);

        send(data.channel_id, response);
        return;
      }

      let insert = /^(.+) (https?:\/\/.*\.(?:gif|png|jpg|jpeg))$/.exec(content);
      let show = /^(.+)/.exec(content);

      config.data.react = config.data.react || {};
      if (insert) {
        let guild = <GuildEventHandler>guilds.get(config.gid);
        guild.config.data.react = create(
          config.data.react,
          insert[1].split(/[ >./]+/),
          insert[2]
        );
        guild.pushConfig();
        let msg = await getMessage(data.channel_id, data.id);
        if (!msg) return;
        msg.react('✅');
      } else if (show) {
        let options: string[] = getArray(
          config.data.react,
          show[1].split(/[ >./]+/)
        );
        if (options.length > 0) {
          send(data.channel_id, choose(options)!);
        } else {
          let msg = await getMessage(data.channel_id, data.id);
          if (!msg) return;
          await msg.react('❌');
        }
      }
    }
  };
}
