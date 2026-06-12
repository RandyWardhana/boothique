import type { Env } from './index';

/**
 * Streams every object under `shares/` as a single ZIP download.
 *
 * This intentionally ignores the 72h user-facing TTL: it backs up ALL shares,
 * including expired ones. Those objects are kept in R2 past 72h (see TTL_MS in
 * index.ts) precisely so this export can capture them for backup.
 *
 * Admin-only. Auth is the same ADMIN_SECRET used by the skin endpoints, supplied
 * either via the `x-admin-secret` header or a `?k=` query param (so the archive
 * can be pulled by a plain browser navigation). On missing/wrong secret this
 * returns 404 rather than 401 — the endpoint should be indistinguishable from a
 * non-existent path to anyone who doesn't already hold the secret. Obscurity is
 * NOT the security control here; the secret is. The unguessable path is only a
 * second layer so the route never shows up to casual probing.
 *
 * Format: ZIP, store (no compression — payloads are already-compressed PNG/MP4),
 * written in streaming mode with data descriptors so nothing is buffered: each
 * object is read chunk-by-chunk straight from R2 into the response. Standard
 * (non-ZIP64) ZIP, so the practical ceilings are <4 GB total archive size and
 * <65535 files. A 72h-TTL photo booth stays well under both.
 */

// Streaming data descriptor (bit 3) + UTF-8 filenames (bit 11).
const FLAG = 0x0808;
// DOS date for 1980-01-01, time 00:00 — a valid fixed timestamp.
const DOS_DATE = 0x0021;
const DOS_TIME = 0x0000;

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

/** Update a running (pre-final) CRC-32 with more bytes. */
function crc32Append(crc: number, data: Uint8Array): number {
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc >>> 0;
}

interface CentralRecord {
  nameBytes: Uint8Array;
  crc: number;
  size: number;
  offset: number;
}

function localHeader(nameBytes: Uint8Array): Uint8Array {
  const h = new Uint8Array(30 + nameBytes.length);
  const dv = new DataView(h.buffer);
  dv.setUint32(0, 0x04034b50, true);
  dv.setUint16(4, 20, true); // version needed
  dv.setUint16(6, FLAG, true);
  dv.setUint16(8, 0, true); // method: store
  dv.setUint16(10, DOS_TIME, true);
  dv.setUint16(12, DOS_DATE, true);
  dv.setUint32(14, 0, true); // crc — deferred to data descriptor
  dv.setUint32(18, 0, true); // compressed size — deferred
  dv.setUint32(22, 0, true); // uncompressed size — deferred
  dv.setUint16(26, nameBytes.length, true);
  dv.setUint16(28, 0, true); // extra len
  h.set(nameBytes, 30);
  return h;
}

function dataDescriptor(crc: number, size: number): Uint8Array {
  const d = new Uint8Array(16);
  const dv = new DataView(d.buffer);
  dv.setUint32(0, 0x08074b50, true);
  dv.setUint32(4, crc, true);
  dv.setUint32(8, size, true); // compressed == uncompressed (store)
  dv.setUint32(12, size, true);
  return d;
}

function centralHeader(rec: CentralRecord): Uint8Array {
  const h = new Uint8Array(46 + rec.nameBytes.length);
  const dv = new DataView(h.buffer);
  dv.setUint32(0, 0x02014b50, true);
  dv.setUint16(4, 20, true); // version made by
  dv.setUint16(6, 20, true); // version needed
  dv.setUint16(8, FLAG, true);
  dv.setUint16(10, 0, true); // method
  dv.setUint16(12, DOS_TIME, true);
  dv.setUint16(14, DOS_DATE, true);
  dv.setUint32(16, rec.crc, true);
  dv.setUint32(20, rec.size, true);
  dv.setUint32(24, rec.size, true);
  dv.setUint16(28, rec.nameBytes.length, true);
  dv.setUint16(30, 0, true); // extra len
  dv.setUint16(32, 0, true); // comment len
  dv.setUint16(34, 0, true); // disk start
  dv.setUint16(36, 0, true); // internal attrs
  dv.setUint32(38, 0, true); // external attrs
  dv.setUint32(42, rec.offset, true); // local header offset
  h.set(rec.nameBytes, 46);
  return h;
}

function endOfCentralDirectory(count: number, cdSize: number, cdOffset: number): Uint8Array {
  const e = new Uint8Array(22);
  const dv = new DataView(e.buffer);
  dv.setUint32(0, 0x06054b50, true);
  dv.setUint16(4, 0, true); // disk number
  dv.setUint16(6, 0, true); // disk with central dir
  dv.setUint16(8, count, true);
  dv.setUint16(10, count, true);
  dv.setUint32(12, cdSize, true);
  dv.setUint32(16, cdOffset, true);
  dv.setUint16(20, 0, true); // comment len
  return e;
}

export async function handleExportShares(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const provided = request.headers.get('x-admin-secret') ?? url.searchParams.get('k');
  if (!env.ADMIN_SECRET || provided !== env.ADMIN_SECRET) {
    // Deliberately 404, not 401 — don't confirm the route exists.
    return new Response('Not found', { status: 404 });
  }

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  void (async () => {
    let offset = 0;
    const central: CentralRecord[] = [];
    const write = async (chunk: Uint8Array) => {
      await writer.write(chunk);
      offset += chunk.length;
    };

    try {
      let cursor: string | undefined;
      do {
        const listed = await env.SHARES.list({ prefix: 'shares/', cursor, limit: 1000 });
        for (const entry of listed.objects) {
          const object = await env.SHARES.get(entry.key);
          if (!object || !object.body) continue;

          const nameBytes = encoder.encode(entry.key);
          const localOffset = offset;
          await write(localHeader(nameBytes));

          let crc = 0xffffffff;
          let size = 0;
          const reader = object.body.getReader();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            crc = crc32Append(crc, value);
            size += value.length;
            await write(value);
          }
          crc = (crc ^ 0xffffffff) >>> 0;

          await write(dataDescriptor(crc, size));
          central.push({ nameBytes, crc, size, offset: localOffset });
        }
        cursor = listed.truncated ? listed.cursor : undefined;
      } while (cursor);

      const cdStart = offset;
      let cdSize = 0;
      for (const rec of central) {
        const h = centralHeader(rec);
        await write(h);
        cdSize += h.length;
      }
      await write(endOfCentralDirectory(central.length, cdSize, cdStart));
      await writer.close();
    } catch (err) {
      await writer.abort(err);
    }
  })();

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(readable, {
    status: 200,
    headers: {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="boothique-shares-${stamp}.zip"`,
      'cache-control': 'no-store',
    },
  });
}
