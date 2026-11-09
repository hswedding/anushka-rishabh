// Shared helpers for the site-performance scripts.
import { openSync, readSync, fstatSync, closeSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

/** Runs ffmpeg and returns the spawn result (stderr carries its report). */
export const ffmpeg = (args, opts = {}) =>
  spawnSync(ffmpegPath, ['-hide_banner', ...args], { encoding: 'utf8', maxBuffer: 1 << 28, ...opts });

/** Runs ffmpeg quietly, throwing its error output on failure. */
export function run(args, opts) {
  const r = ffmpeg(['-loglevel', 'error', '-y', ...args], opts);
  if (r.status !== 0) throw new Error(r.stderr || `ffmpeg exited ${r.status}`);
}

/** Top-level MP4 box types in file order. */
export function boxes(file) {
  const fd = openSync(file, 'r'), size = fstatSync(fd).size, b = Buffer.alloc(16), out = [];
  try {
    for (let p = 0; p < size;) {
      readSync(fd, b, 0, 16, p);
      let n = b.readUInt32BE(0);
      if (n === 1) n = Number(b.readBigUInt64BE(8));
      else if (n === 0) n = size - p;
      if (n < 8) break;
      out.push(b.toString('latin1', 4, 8));
      p += n;
    }
  } finally { closeSync(fd); }
  return out;
}

/** True when the index (moov) comes before the media data, so playback can start at once. */
export const fastStart = (file) => {
  const b = boxes(file);
  return b.includes('moov') && (!b.includes('mdat') || b.indexOf('moov') < b.indexOf('mdat'));
};

/** Codec, size, colour tags, bitrate and x264 settings of a video. */
export function probe(file) {
  const s = ffmpeg(['-i', file]).stderr;
  const v = s.match(/Video: (\w+).*?, (yuv\w+|nv12|rgb\w+|gbr\w+)(?:\(([^)]*)\))?.*?, (\d{2,5})x(\d{2,5})/);
  const d = s.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const fd = openSync(file, 'r'), head = Buffer.alloc(Math.min(fstatSync(fd).size, 8 << 20));
  readSync(fd, head, 0, head.length, 0);
  closeSync(fd);
  const sei = head.toString('latin1');
  const crf = sei.match(/ crf=([\d.]+)/), keyint = sei.match(/ keyint=(\d+)/);
  return {
    codec: v?.[1], pixfmt: v?.[2], colour: v?.[3] || '', width: +v?.[4], height: +v?.[5],
    seconds: d ? +d[1] * 3600 + +d[2] * 60 + +d[3] : 0,
    kbps: +(s.match(/bitrate: (\d+) kb\/s/)?.[1] || 0),
    audio: s.match(/Audio: (\w+)/)?.[1] || null,
    x264: sei.includes('x264 - core') ? { crf: crf && +crf[1], keyint: keyint && +keyint[1] } : null,
  };
}

/** Colour matrix browsers use for this video: its tag, else BT.709 for HD (verified in Chrome). */
export const matrixOf = (p) =>
  /bt709/.test(p.colour) ? 'bt709'
    : /bt470bg|smpte170m/.test(p.colour) ? 'bt601'
      : p.height >= 720 || p.width >= 1280 ? 'bt709' : 'bt601';

export const mb = (n) => `${(n / 1048576).toFixed(2)} MB`;
export const kb = (n) => `${Math.round(n / 1024)} KB`;
