import * as canvas from 'canvas';
import * as fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { Logger } from '@/services/logger.service';
import { randomColor } from './random.util';

export async function gallery(images: string[], captions: string[], columns: number, colWidth: number) {
    let width = (colWidth * columns) + ((columns + 1) * 20); // 20 Spacing
    let rows = Math.ceil(images.length / columns);
    let rowHeight = colWidth + 10 + 30; // 10 Spacing, 30 Font
    let height = (rowHeight * rows) + ((rows + 1) * 20); // 20 Spacing

    const canv = canvas.createCanvas(width, height);
    const ctx = canv.getContext('2d');

    for(let i = 0; i < images.length; i ++) {
        // Image Position
        let xi = 20 + (i%columns) * (colWidth + 20);
        let yi = 20 + Math.floor(i / columns) * (rowHeight + 20); // Top Line

        // Load and Draw
        let image = await canvas.loadImage(images[i]);
        ctx.drawImage(image, xi, yi, colWidth, colWidth);

        // Font Properties
        ctx.font = "12px Terminus (TTF)";
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#ffffff';

        // Text Position
        let txt = ctx.measureText(captions[i]).width;
        let xf = xi + colWidth / 2 - txt/2;
        let yf = yi + rowHeight; // Bottom Line        

        // Draw
        ctx.fillText(captions[i], xf, yf);

    }

    let file: string = randomColor().substring(1);
    const out = createWriteStream(`tmp/${file}.png`);
    canv.createPNGStream().pipe(out);

    function t() {
        return new Promise((resolve, reject) => {
            out.on('finish', () => resolve(file));
        });
    }
    
    return t();
}