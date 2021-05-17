import * as puppeteer from "puppeteer";
import * as fs from 'fs/promises';
import { randomColor } from "./random.util";

export const HTMLSize = { width: 1280, height: 720 };

export async function getView(page: string) {
    (await fs.readdir('tmp')).forEach(async (file) => {
        await fs.rm(`tmp/${file}`);
    });
    let random = randomColor().substr(1);
    await fs.writeFile(`tmp/${random}.html`, page);
    const browser = await puppeteer.launch();
    const tab = await browser.newPage();
    await tab.setViewport(HTMLSize);
    await tab.goto(`file://${process.cwd()}/tmp/${random}.html`);
    await tab.screenshot({
        path: `tmp/${random}.png`
    });
    await browser.close();
    return `tmp/${random}.png`;
}