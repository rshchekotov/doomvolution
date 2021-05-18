import { GuildConfig } from "@/interfaces/guild-config.interface";
import { Module } from "@/interfaces/module.interface";
import { getMessage, send } from "@/util/discord.util";
import { choose } from "@/util/random.util";
import { MessageEmbed } from "discord.js";

const aliases = ['hi', 'hey', 'hello', 'oi'];

const greetings = [
    ":flag_de: Hallo! :flag_de:",
    ":flag_nl: Hallo! :flag_nl:",
    ":flag_ru: Привет :flag_ru:",
    ":flag_jp: こんにちは :flag_jp:",
    ":flag_jp: もしもし :flag_jp:",
    ":flag_ph: Kamusta :flag_ph:",
    ":flag_fr: Salut :flag_fr:",
    ":flag_pl: cześć :flag_pl:",
    ":flag_us: Hey! :flag_us:",
    ":flag_in: नमस्ते :flag_in:",
    ":flag_au: ollǝH :flag_au:",
    ":flag_es: Hola :flag_es:",
    ":duck: Booo! :duck:",
    ":sunglasses: WHAT'S UP MY DIGGITY DIGGITY DAWG :sunglasses:",
    ":sandwich: sammich sammich! :sandwich:"
];

const images = [
    "https://media1.tenor.com/images/056c584d9335fcabf080ca43e583e3c4/tenor.gif?itemid=8994845",
    "https://media1.tenor.com/images/79f33c2f524cbfed4ef6896b39e67663/tenor.gif?itemid=9416181",
    "https://media1.tenor.com/images/72c9b849aa10b222371ebb99a6b1896a/tenor.gif?itemid=8807701",
    "https://media1.tenor.com/images/f82fdfe817cfb8dacb5bd5c7dadb632d/tenor.gif?itemid=8718221",
    "https://media1.tenor.com/images/af87df7587d7c41691d464fdccdfba34/tenor.gif?itemid=5634612"
];

export class HelloModule extends Module {
    public name: string = 'hello';
    types: string[] = ['MESSAGE_CREATE'];
    requires: string[] = [];
    man: string = '' + 
    '***__Hello Module__***\n' +
    `The ${this.name} module is one way to welcome your buddies!` +
    'Send a greeting with: ```$hello```. If you want someone ' +
    'specific to receive it - feel free to append pings!'

    re: RegExp = /^(\w+).*/;

    verify = async (event: string, data: any, config: GuildConfig) => {
        return (await this.cmd(data, this.re, config)) != null;
    };

    run = async (event: string, data: any, config: GuildConfig) => {
        if(aliases.includes((await this.cmd(data, this.re, config))![1])) {
            let initial = await getMessage(data.channel_id, data.id);

            let embed = new MessageEmbed()
                .setTitle(choose(greetings))
                .setImage(choose(images)!)
                .setFooter(`from ${initial.member!.nickname || initial.author.username}`)
                .setTimestamp();
            
            // Empty Message Bug
            await send(data.channel_id, embed);
            if(initial.mentions && initial.mentions.users.array().length > 0) 
                await send(data.channel_id, initial.mentions.users.map((user) => `<@!${user.id}>`).join(' '));
        }
    };

}
