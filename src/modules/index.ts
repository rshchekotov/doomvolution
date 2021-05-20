import { Module } from '@/interfaces/module.interface';
import { AniLookupModule } from './anilookup.module';
import { BirthdayModule } from './birthday.module';
import { ChangelogModule } from './changelog.module';
import { ClearModule } from './clear.module';
import { ComplimentModule } from './compliment.module';
import { DadModule } from './dad.module';
import { DeeJayModule } from './deejay.module';
import { DefineModule } from './define.module';
import { EmbedModule } from './embed.module';
import { EmoteModule } from './emote.module';
import { FactModule } from './fact.module';
import { HelloModule } from './hello.module';
import { ManualModule } from './man.module';
import { MeepModule } from './meep.module';
import { ModManModule } from './modman.module';
import { MorphModule } from './morph.module';
import { PermissionModule } from './permission.module';
import { PingModule } from './ping.module';
import { PrefixModule } from './prefix.module';
import { QuoteModule } from './quote.module';
import { ReactModule } from './react.module';
import { ReadyModule } from './ready.module';
import { ShutdownModule } from './shutdown.module';
import { SixDigitModule } from './six.digit.module';
import { StarredModule } from './starred.module';
import { TutorialModule } from './tutorial.module';
import { WhoIsModule } from './whois.module';
import { XKCDModule } from './xkcd.module';

export const modules: { [key: string]: Module } = {
  modman: new ModManModule(),
  man: new ManualModule(),
  ready: new ReadyModule(),
  dad: new DadModule(),
  fact: new FactModule(),
  react: new ReactModule(),
  birthday: new BirthdayModule(),
  permission: new PermissionModule(),
  hello: new HelloModule(),
  clear: new ClearModule(),
  anilookup: new AniLookupModule(),
  meep: new MeepModule(),
  define: new DefineModule(),
  ping: new PingModule(),
  compliment: new ComplimentModule(),
  shutdown: new ShutdownModule(),
  sixdigit: new SixDigitModule(),
  morph: new MorphModule(),
  starred: new StarredModule(),
  embed: new EmbedModule(),
  prefix: new PrefixModule(),
  quote: new QuoteModule(),
  emote: new EmoteModule(),
  xkcd: new XKCDModule(),
  tutorial: new TutorialModule(),
  whois: new WhoIsModule(),
  changelog: new ChangelogModule(),
  deejay: new DeeJayModule()
};
