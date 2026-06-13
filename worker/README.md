# Boothique share Worker

A Cloudflare Worker that hosts shared booth results for **72 hours** on R2 and
serves them through a branded result page.

## Endpoints

| Method | Path                    | Purpose                                            |
| ------ | ----------------------- | -------------------------------------------------- |
| `POST` | `/api/share`            | Upload `photo` (PNG, required) + `video` (MP4) + `brand` as `multipart/form-data`. Returns `{ id, url, expiresAt }`. |
| `POST` | `/api/share/:id/video`  | Attach `video` (MP4) to an existing share. The app backs results up as soon as the still renders, so the photo arrives first and the slow video render follows. Never overwrites an existing video; `410` once expired. |
| `GET`  | `/s/:id`                | Branded result page. `410` once expired, `404` if unknown. |
| `GET`  | `/s/:id/photo.png`      | The framed photo. `410` once expired.              |
| `GET`  | `/s/:id/video.mp4`      | The animated strip, when present.                  |

## Expiry model

Each object is written with an `expiresAt` (now + 72h) in its custom metadata,
and the result page / asset endpoints **refuse to serve anything past that time**
(HTTP `410 Gone`). So access is cut off at exactly 72 hours regardless of
storage cleanup.

For storage GC, add an R2 **object lifecycle rule** to delete objects after ~4
days (Dashboard → R2 → `boothique-shares` → Settings → Object lifecycle rules).
This only reclaims space; the hard 72h cutoff is enforced in code.

## Deploy

```bash
cd worker
npm install
npx wrangler r2 bucket create boothique-shares
# edit wrangler.toml → set PUBLIC_BASE_URL to this Worker's URL (and ALLOWED_ORIGIN)
npx wrangler deploy
```

Then point the app at it by setting `VITE_SHARE_API_BASE` (see the root README).
