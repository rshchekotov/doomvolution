import { modules } from '@/modules';
import { Logger } from '@/services/logger.service';
import { getUser, hasARole, send } from '@/util/discord.util';
import { GuildConfig } from './guild-config.interface';

// Technically not an Interface...
export abstract class Module {
  public abstract name: string;
  abstract types: string[];
  abstract requires: string[];
  abstract man: string | string[];
  permissions: string[] = ['member'];
  private: string[] = [];

  cmd = async (data: any, re: RegExp, config: GuildConfig) => {
    if (data.webhook_id) return null;
    if ((await getUser(data.author.id)).bot) return null;

    let regex = re.exec(data.content.substr(config.prefix.length));
    if (!data.content.startsWith(config.prefix) || !regex) {
      return null;
    }

    let roles = hasARole(data.author.id, config, this.permissions);
    if (roles.length > 0) {
      //send(data.channel_id, '❌ Error: Insufficient Permissions! Missing: ' + roles.join(', '));
      return null;
    }

    return regex;
  };

  check = (config: GuildConfig) => {
    let missing: string[] = [];
    this.requires.every((req: string) => {
      if (modules[req] !== undefined && !config.modules.includes(req))
        missing.push(`[💽 ${req}]`);
      else if (config.data[req] === undefined) missing.push(`[⚙️ ${req}]`);
      return true;
    });

    return missing;
  };

  abstract verify: (
    event: string,
    data: any,
    config: GuildConfig
  ) => Promise<boolean>;
  abstract run: (event: string, data: any, config: GuildConfig) => any;
}
