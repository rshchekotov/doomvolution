import { guilds } from "@/app";
import { PagedEmbed } from "@/discord/paged.embed";
import { GuildEventHandler } from "@/events/guild.handler";
import { GuildConfig } from "@/interfaces/guild-config.interface";
import { PackageDependency } from "@/interfaces/package.interface";
import { Logger } from "@/services/logger.service";
import { number, partition } from "@/util/package.util";
import { AniSearchPackage } from "./animanga/anisearch.pkg";
import { SixDigitPackage } from "./animanga/sixdigit.pkg";
import { ChangelogPackage } from "./core/changelog.pkg";
import { ClearPackage } from "./core/clear.pkg";
import { ConfPackage } from "./core/conf.pkg";
import { CreditsPackage } from "./core/credits.pkg";
import { HelpPackage } from "./core/help.pkg";
import { PingPackage } from "./core/ping.pkg";
import { PKGPackage } from "./core/pkg.pkg";
import { WhoIsPackage } from "./core/whois.pkg";
import { ComfortPackage } from "./fun/comfort.pkg";
import { DadPackage } from "./fun/dad.pkg";
import { DefinePackage } from "./fun/define.pkg";
import { EmotePackage } from "./fun/emote.pkg";
import { HelloPackage } from "./fun/hello.pkg";
import { XKCDPackage } from "./fun/xkcd.pkg";
import { EpicPackage } from "./game/epic.pkg";
import { Package } from "./package";
import { DuckieeeePackage } from "./personal/duck.pkg";
import { SpenPackage } from "./personal/spen.pkg";
import { BirthdayPackage } from "./social/birthday.pkg";
import { StarPackage } from "./social/star.pkg";

class Repository {
    name: string;
    description: string;
    private: string[] = [];
    packages: Package[] = [];

    constructor(name: string, desc: string) {
        this.name = name;
        this.description = desc;
    }

    search(pkg: string) {
        return this.packages.find(p => p.name === pkg);
    }

    add(pkg: Package) {
        this.packages.push(pkg);
        return this;
    }

    list(config: GuildConfig) {
        this.packages = this.packages.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });

        let partitions = partition(this.packages, 10).map(page => 
            page.map((pkg: Package, index) => 
                `${number[index]} *${pkg.name + (config.packages.includes(pkg.name) ? ' [installed]' : '')}*`).join('\n'));

        return new PagedEmbed(`Repository: ${this.name + (config.repositories.includes(this.name) ? ' [added]' : '')}`, partitions);
    }

    async install(guild: string) {
        let geh = <GuildEventHandler> guilds.get(guild);
        geh.config.repositories.push(this.name);
        geh.config.repositories = Array.of(... new Set(geh.config.repositories));
        await geh.pushConfig();
    }

    async remove(config: GuildConfig) {
        let geh = <GuildEventHandler> guilds.get(config.gid);
        geh.config.repositories = config.repositories.filter(repo => repo !== this.name);
        await geh.pushConfig();
    }
}

export const dependencies: { [name: string]: PackageDependency} = {
    'public': {
        "name": "public",
        "repository": "*",
        "description": "Outwards facing channel ID for announcements. Used in various packages to refer to a general channel for all server members.",
        "type": "config"
    },
    'emoji_delim': {
        "name": "emoji_delim",
        "repository": "fun",
        "description": "The Emoji Delimiter, which is used to explain the bot what emote you mean. You have to provide a pair (array) for this. An example value would look like this: `[\":\", \":\"]`",
        "type": "config"
    },
    'emoji_server': {
        "name": "emoji_server",
        "repository": "fun",
        "description": "The Server ID where new Emoji's will be added to!",
        "type": "config"
    },
    'nsfw_locked': {
        "name": "nsfw_locked",
        "repository": "*",
        "description": "Enables the NSFW Lock for all NSFW containing Packages.",
        "type": "config"
    },
    'star_channel': {
        "name": "star_channel",
        "repository": "*",
        "description": "Sets the Channel for Starred Messages!",
        "type": "config"
    },
    'star_count': {
        "name": "star_count",
        "repository": "*",
        "description": "Sets the Count required to pin a message in the Star Channel.",
        "type": "config"
    }
};

export const repositories: {
    [name: string]: Repository
} = {
    "core": new Repository(
        'core', 
        'The Core Utilities of this Bot, of which ' +
        'most are required for proper function!')
        .add(new HelpPackage())
        .add(new PKGPackage())
        .add(new ChangelogPackage())
        .add(new CreditsPackage())
        .add(new ClearPackage())
        .add(new ConfPackage())
        .add(new PingPackage())
        .add(new WhoIsPackage()),
    "fun": new Repository(
        'fun',
        'The Repository, where you can find a lot of ' +
        'cool, hilarious and awesome utilities!')
        .add(new DefinePackage())
        .add(new ComfortPackage())
        .add(new DadPackage())
        .add(new EmotePackage())
        .add(new HelloPackage())
        .add(new XKCDPackage()),
    "animanga": new Repository(
        'animanga',
        'The Repository, that offers everything a self ' +
        'respecting weeb requires!')
        .add(new AniSearchPackage())
        .add(new SixDigitPackage()),
    "social": new Repository(
        'social',
        'The Repository for everything concerning social ' +
        'interaction with other members!')
        .add(new BirthdayPackage())
        .add(new StarPackage()),
    "personal": new Repository(
        'personal',
        'The Repository, which contains quite personal packages ' +
        'made for awesome outstanding people! Most of these packages ' +
        'are private to the servers that the people and I share!')
        .add(new SpenPackage())
        .add(new DuckieeeePackage()),
    "game": new Repository(
        'game',
        'The Repository used for Games and Gaming related topics. ' +
        'Game Updates, Reviews and similar will be found here in the ' +
        'future. Stay tuned!')
        .add(new EpicPackage())
};