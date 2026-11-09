#!/usr/bin/env node
/* Image tools that never visibly change the art.
     node images.mjs webp <art.png...>
       Near-lossless WebP beside each file (no channel moves more than a few
       levels out of 255), typically about half the PNG. Originals are kept;
       point the imports at the .webp and delete the PNGs yourself. A WebP
       that wouldn't be 10% smaller is discarded.
     node images.mjs favicon <logo> [out=favicon.png] [--bg "#fdf9ef"]
       180×180 PNG: the iOS home-screen size, and plenty for browser tabs.
       iOS paints transparent icon areas black; --bg flattens onto a colour. */
import { statSync, unlinkSync } from 'node:fs';
import sharp from 'sharp';
import { kb } from './lib.mjs';

const [cmd, ...rest] = process.argv.slice(2);

/** Largest per-channel error after alpha premultiplication: what lands on the page. */
async function maxError(a, b) {
  const [x, y] = await Promise.all([a, b].map((i) => sharp(i).ensureAlpha().raw().toBuffer()));
  let max = 0;
  for (let i = 0; i < x.length; i += 4) for (let c = 0; c < 3; c++)
    max = Math.max(max, Math.abs(x[i + c] * x[i + 3] - y[i + c] * y[i + 3]) / 255);
  return Math.round(max);
}

if (cmd === 'webp' && rest.length) {
  let before = 0, after = 0;
  for (const f of rest) {
    const out = f.replace(/\.\w+$/, '.webp'), size = statSync(f).size;
    const { size: s } = await sharp(f).webp({ nearLossless: true, quality: 60, effort: 6 }).toFile(out);
    if (s > size * 0.9) { unlinkSync(out); console.log(`${f}: keep as is (WebP would save under 10%)`); continue; }
    before += size; after += s;
    console.log(`${f} → ${out}: ${kb(size)} → ${kb(s)}, max error ${await maxError(f, out)}/255`);
  }
  if (before) console.log(`Total ${kb(before)} → ${kb(after)}. Update the imports, then delete the originals.`);
} else if (cmd === 'favicon' && rest.length) {
  const bgI = rest.indexOf('--bg'), bg = bgI < 0 ? null : rest.splice(bgI, 2)[1];
  const [src, out = 'favicon.png'] = rest;
  let img = sharp(src).resize(180, 180, { fit: 'cover', kernel: 'lanczos3' });
  if (bg) img = img.flatten({ background: bg });
  const info = await img.png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(out);
  const alpha = (await sharp(out).stats()).isOpaque === false;
  console.log(`${out}: 180x180, ${kb(info.size)}${alpha ? ' — has transparency; iOS shows it on black (use --bg)' : ''}`);
} else {
  console.error('usage: node images.mjs webp <art.png...>\n       node images.mjs favicon <logo> [out.png] [--bg "#fdf9ef"]');
  process.exit(1);
}
