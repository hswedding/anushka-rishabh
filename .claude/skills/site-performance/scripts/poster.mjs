#!/usr/bin/env node
/* The envelope poster: the film's first frame as WebP, colour-matched to how
   browsers draw the video, so the opening screen paints before any video
   loads and nothing shifts when the guest taps play.
     node poster.mjs <envelop.mp4> [out.webp]     (default: envelop-poster.webp beside it)
   Run it on the FINAL film (after films.mjs), every time the film changes. */
import { mkdtempSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { probe, run, matrixOf, kb } from './lib.mjs';

const [film, outArg] = process.argv.slice(2);
if (!film) { console.error('usage: node poster.mjs <envelop.mp4> [out.webp]'); process.exit(1); }
const src = resolve(film), out = resolve(outArg || join(dirname(src), 'envelop-poster.webp'));
const p = probe(src), matrix = matrixOf(p), range = /\bpc\b/.test(p.colour) ? 'pc' : 'tv';

const tmp = mkdtempSync(join(tmpdir(), 'poster-')), png = join(tmp, 'frame.png');
run(['-i', src, '-frames:v', '1', '-vf',
  `scale=in_color_matrix=${matrix}:in_range=${range}:out_range=pc:flags=accurate_rnd+full_chroma_int,format=rgb24`, png]);
// q95 sits ~52 dB from the frame — closer than the film's own compression noise.
const info = await sharp(png).webp({ quality: 95, effort: 6, smartSubsample: true }).toFile(out);
rmSync(tmp, { recursive: true, force: true });
console.log(`${out}: ${info.width}x${info.height}, ${kb(info.size)} (frame 0, ${matrix} ${range} range)`);
