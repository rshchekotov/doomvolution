export interface GuildConfig {
  gid: string;
  prefix: string;
  nick: string;
  packages: string[];
  repositories: string[];
  environments: { [channel: string]: string[] };
  data: { [key: string]: any };
}

export const DefaultConfig: GuildConfig = {
  gid: '-1',
  prefix: '$',
  nick: 'Lil Doomie',
  packages: ['pkg', 'help', 'conf', 'ping', 'changelog'],
  repositories: ['core'],
  environments: {
    0: ['common']
  },
  data: {
    configured: false,
  },
};
