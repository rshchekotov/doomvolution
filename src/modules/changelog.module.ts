import { Changelog } from '@/interfaces/changelog.interface';
import { GuildConfig } from '@/interfaces/guild-config.interface';
import { Module } from '@/interfaces/module.interface';
import { send } from '@/util/discord.util';
import { MessageEmbed } from 'discord.js';
import fs from 'fs/promises';

async function getVersions() {
  const rawLogs = await fs.readFile('assets/changelog.json', { encoding: 'utf8' });
  const json: Changelog[] = JSON.parse(rawLogs);
  return json.map(e => e.version);
}

async function getChangelogs(version?: string) {
  const rawLogs = await fs.readFile('assets/changelog.json', { encoding: 'utf8' });
  const json: Changelog[] = JSON.parse(rawLogs);
  const entries: { [version: string]: Changelog } = {};
  json.forEach(entry => entries[entry.version] = entry);

  let selected: Changelog = json[0];
  if(version) selected = entries[version] || json[0];
  return selected;
}

function formatChangelog(log: Changelog) {
  return new MessageEmbed()
    .setTitle(`Changelog v${log.version} | ${log.title}`)
    .setDescription(log.note + '\n\n' + log.desc.map(upd => `❦ [${upd.module}] ${upd.desc}`).join('\n'))
    .setFooter(`v${log.version}`)
    .setThumbnail('https://www.microspot.com/images/upgradesnav.png');
}

export class ChangelogModule extends Module {
  public name: string = 'changelog';
  types: string[] = ['MESSAGE_CREATE'];
  requires: string[] = [];
  man: string =
    '' +
    '***__Changelog Module__***\n' +
    `The ${this.name} module is there to provide ` +
    'you with the information about the most recent ' +
    'changes! You can simply look it up using:' +
    '```\n$changelog\n```Optionally you can pass along ' +
    'a version like this:```\n$changelog v1.0.1\n``` and ' +
    'list all released versions like this:'  +
    '```\n$changelogs\n```';

  verify = async (event: string, data: any, config: GuildConfig) => {
    return (await this.cmd(data, /^changelogs?(?: *([\d\.]+))$/, config)) != null;
  };

  run = async (event: string, data: any, config: GuildConfig) => {
    let resp: string | MessageEmbed | undefined = undefined;
    let match = (await this.cmd(data, /^changelogs?(?: +v?([\d\.]+))?$/, config))!;

    if(match[0] === 'changelog') {
      resp = formatChangelog(await getChangelogs(match[1]))
    } else if(match[0] === 'changelogs') {
      resp = "Released Versions:\n" + (await getVersions()).join(', ');
    }

    if(resp) await send(data.channel_id, resp);
  };
}
