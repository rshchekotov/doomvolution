import { PackageInput, PackageTrigger } from "@/interfaces/package.interface";
import { send } from "@/util/discord.util";
import { Package } from "../package"
import fetch from 'node-fetch';
import { Logger } from "@/services/logger.service";
import { PagedEmbed } from "@/discord/paged.embed";
import { GuildConfig } from "@/db/models/guild-config.model";

export class EpicPackage extends Package {
    name: string = 'epic';
    repository: string = 'game';

    events: string[] = ['MESSAGE_CREATE'];

    triggers: PackageTrigger[] = [
        'epic'
    ];

    help = async (config?: GuildConfig) => [
        '__***Epic Module***__\n' +
        'Imagine you could check the current Free Epic Games without going into ' +
        'the Launcher. `' + config!.prefix + 'epic` causes these wonders to get real!\n' +
        '||Side Note: Their Documentation for this is Non-Existant, had to magically figure stuff out... ' +
        'Maybe I should really become a Professional Magician||'
    ];
    exec = async (input: PackageInput) => {
        if(input.command) {
            let request = await fetch('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions' +
                '?searchParams=' + 
                '%22%7B%5C%22locale%5C%22%3A%5C%22en%5C%22,'+ 
                '%5C%22country%5C%22%3A%5C%22US%5C%22,' +
                '%5C%22allowCountries%5C%22%3A%5C%22US%5C%22%7D%22'
            );

            if(request.ok) {
                let body = await request.json();
                let games = body.data.Catalog.searchStore.elements;
                let pages = games.filter(
                    game => game.title !== 'Mystery Game' && 
                    game.status === 'ACTIVE' &&
                    game.promotions.promotionalOffers.length > 0
                ).map(game => {
                    let title = game.title;
                    let pub = game.customAttributes.find(attr => attr.key === 'publisherName').value;
                    let dev = game.customAttributes.find(attr => attr.key === 'developerName').value;
                    let img = game.keyImages.find(img => img.type === 'DieselStoreFrontWide').url + '?.png';

                    let sraw = game.promotions.promotionalOffers[0].promotionalOffers[0].startDate;
                    let eraw = game.promotions.promotionalOffers[0].promotionalOffers[0].endDate;

                    let formatDate = (date: Date) => {
                        let tok = date.toDateString().split(' ');
                        return `${tok[2]} ${tok[1]} ${tok[3]} (${tok[0]})`;
                    };

                    let start = formatDate(new Date(sraw));
                    let end = formatDate(new Date(eraw));
                    let today = formatDate(new Date());

                    return `‡title=${game.title}‡` +
                        `‡Publisher:=:${pub}‡` +
                        `‡Developer:=:${dev}‡` +
                        `‡Time Frame:=:${start} - ${end}‡` +
                        `‡Today:=:${today}‡` + img;
                });
                await new PagedEmbed('', pages).send(input.data.channel_id);
            }
        }
    }
}