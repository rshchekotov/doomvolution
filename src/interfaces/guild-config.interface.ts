export interface GuildConfig {
  gid: string;
  prefix: string;
  nick: string;
  modules: string[];
  data: { [key: string]: any };
}

export const DefaultConfig = {
  gid: '-1',
  prefix: '$',
  nick: 'Lil Doomie',
  modules: ['modman', 'man', 'tutorial'],
  data: {
    configured: false,
  },
};
