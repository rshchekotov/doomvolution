import { initDB } from '@/db/db.handler';
import { ClientOptions } from 'discord.js';
import * as dotenv from 'dotenv';

export const configure = async () => {
  dotenv.config();
  await initDB();
};

export const options: ClientOptions = {
  presence: {
    status: 'online',
    activity: {
      name: `${new Date().toString().split(' ')[0]} Vibes`,
      type: 'LISTENING',
    },
  },
};
