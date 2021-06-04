import { Emote } from '@/interfaces/emote.interface';
import {
  getModelForClass,
  prop
} from '@typegoose/typegoose';
  

class EmoteConfig {
  @prop({ required: true })
  public guild!: string;

  @prop()
  public name!: string;

  @prop()
  public url!: string;

  @prop()
  public animated!: boolean;

  @prop()
  public author!: string;
  
  @prop()
  public createdAt!: Date;
  
  @prop()
  public deleted!: boolean;
  
  @prop()
  public eid!: string;
}

export function getEmote(emote: EmoteConfig) {
  return new Emote(emote.animated, emote.author, emote.createdAt, 
    emote.deleted, emote.guild, emote.eid, emote.name, emote.url);
}

const EmoteConfigModel = getModelForClass(EmoteConfig);

export { EmoteConfig, EmoteConfigModel };