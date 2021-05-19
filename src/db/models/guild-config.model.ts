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
  public modules: string[] = DefaultConfig.modules;

  @prop()
  public data: any = DefaultConfig.data;
}

const GuildConfigModel = getModelForClass(GuildConfig);

export { GuildConfig, GuildConfigModel };
