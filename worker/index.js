/* ============================================================================
 *  Media Worker — adds HTTP Range support (206 Partial Content) for films and
 *  music. Cloudflare's static-asset server answers Range requests with the
 *  whole file (200), and Safari on iPhone/Mac refuses to play <video> served
 *  that way. wrangler.jsonc routes only media paths and /api/* (the RSVP
 *  sheet, worker/rsvp.js) here (`run_worker_first`); every other file is
 *  served straight from static assets, untouched.
 * ========================================================================== */
import { handleApi } from './rsvp.js';

// File sizes are written here by the `mediaSizes` plugin in vite.config.js on
// every build (the asset server doesn't expose Content-Length to the Worker).
import sizes from './media-sizes.json';

const RANGE_RE = /^bytes=(\d*)-(\d*)$/;

export default {
  async fetch(request, env, ctx) {
    if (new URL(request.url).pathname.startsWith('/api/')) return handleApi(request, env);
    const range = request.headers.get('Range');

    // Pass the request through as-is; if the asset server ever starts
    // honouring Range itself, its 206 is returned unchanged.
    const res = await env.ASSETS.fetch(request);
    if (!range || res.status !== 200) return withAcceptRanges(res);

    let path;
    try {
      path = decodeURIComponent(new URL(request.url).pathname);
    } catch {
      path = new URL(request.url).pathname;
    }
    const size = Number(res.headers.get('Content-Length') || sizes[path]);
    const m = RANGE_RE.exec(range.trim());
    if (!m || !Number.isFinite(size) || size <= 0 || (m[1] === '' && m[2] === '')) {
      return withAcceptRanges(res); // multi-range or unknown size: send the whole file
    }

    let start;
    let end;
    if (m[1] === '') {
      // suffix range: the last N bytes
      start = Math.max(size - Number(m[2]), 0);
      end = size - 1;
    } else {
      start = Number(m[1]);
      end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
    }

    if (start >= size || start > end) {
      res.body?.cancel();
      return new Response(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${size}`, 'Accept-Ranges': 'bytes' },
      });
    }

    const headers = new Headers(res.headers);
    headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
    headers.set('Content-Length', String(end - start + 1));
    headers.set('Accept-Ranges', 'bytes');

    if (request.method === 'HEAD') {
      res.body?.cancel();
      return new Response(null, { status: 206, headers });
    }
    // FixedLengthStream makes Cloudflare send a real Content-Length (Safari
    // is strict about it on 206) instead of chunked encoding.
    const { readable, writable } = new FixedLengthStream(end - start + 1);
    ctx.waitUntil(sliceStream(res.body, start, end).pipeTo(writable).catch(() => {}));
    return new Response(readable, { status: 206, headers });
  },
};

function withAcceptRanges(res) {
  const out = new Response(res.body, res);
  out.headers.set('Accept-Ranges', 'bytes');
  return out;
}

/** Stream only bytes [start, end] (inclusive) of `body`, then stop reading. */
function sliceStream(body, start, end) {
  const reader = body.getReader();
  let pos = 0;
  return new ReadableStream({
    async pull(controller) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        const chunkStart = pos;
        pos += value.byteLength;
        if (pos <= start) continue; // still before the range — skip

        const from = Math.max(start - chunkStart, 0);
        const to = Math.min(end + 1 - chunkStart, value.byteLength);
        controller.enqueue(value.subarray(from, to));
        if (chunkStart + to > end) {
          controller.close();
          reader.cancel();
        }
        return;
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}
