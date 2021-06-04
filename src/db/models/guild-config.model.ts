import { DefaultConfig } from '@/interfaces/guild-config.interface';
import {
  getModelForClass,
  modelOptions,
  prop,
  Severity,
} from '@typegoose/typegoose';

@modelOptions({ options: { allowMixed: Severity.ALLOW } })
class GuildConfig {
  @prop({ required: true })
  public gid: string = DefaultConfig.gid;

  @prop()
  public prefix: string = DefaultConfig.prefix;

  @prop()
  public nick: string = DefaultConfig.nick;

  @prop()
  public packages: string[] = DefaultConfig.packages;
  
  @prop()
  public repositories: string[] = DefaultConfig.repositories;

  @prop()
  public environments: {[channel: string]: string[]} = DefaultConfig.environments;

  @prop()
  public data: any = DefaultConfig.data;
}

const GuildConfigModel = getModelForClass(GuildConfig);

export { GuildConfig, GuildConfigModel };
