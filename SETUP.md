# Setup guide (start here if you're new)

This walks you through running Boothique on your computer, then (optionally)
turning on the **72-hour share link** feature.

---

## 1. Run the app on your computer

You need **Node.js 18+** installed ([download it here](https://nodejs.org) — pick
the "LTS" version). To check what you have, open a terminal and run:

```bash
node -v
```

Then, from the project folder:

```bash
npm install      # one time — downloads everything the app needs
npm run dev      # starts the app
```

The terminal prints a line like `Local: http://localhost:5173/`. Open that in
your browser and you'll see Boothique. Leave the terminal running while you use
it; press `Ctrl + C` to stop.

> No webcam? It automatically uses a built-in "demo camera", so everything still
> works.

To make an optimized version for publishing:

```bash
npm run build    # output goes into the dist/ folder
npm run preview  # preview that production build locally
```

---

## 2. Turn on the 72-hour share link (optional)

By default, the **Share** button uses your phone/computer's built-in share sheet.
If you want the fancier version — a link anyone can open for 72 hours that shows
a branded page — you deploy a small **Cloudflare Worker** (free). Here's how,
step by step.

### 2a. Make a Cloudflare account

1. Sign up free at <https://dash.cloudflare.com/sign-up>.
2. In the dashboard, open **R2** (left sidebar) and click **Enable R2**. R2 is
   the file storage; it has a free tier (Cloudflare may ask for a card to enable
   it, but you won't be charged within the free limits).

### 2b. Deploy the Worker

In a terminal, from the project folder:

```bash
cd worker
npm install
npx wrangler login                 # opens your browser to connect your account
npx wrangler r2 bucket create boothique-shares
npx wrangler deploy
```

The last command prints your Worker's URL, e.g.
`https://boothique-share.YOURNAME.workers.dev`. **Copy it.**

> You've already set this in `worker/wrangler.toml`
> (`PUBLIC_BASE_URL = "https://boothique-share.randywardhana37.workers.dev"`). Make
> sure that value matches the URL `wrangler deploy` actually printed. If it's
> different, update it and run `npx wrangler deploy` again.

### 2c. Point the app at the Worker

In the **project root** there's a file called `.env` (copy `.env.example` if it's
missing). It should contain your Worker URL:

```bash
VITE_SHARE_API_BASE=https://boothique-share.randywardhana37.workers.dev
```

This is already set for you. Whenever you change `.env`, **stop and restart**
`npm run dev` so it picks up the new value.

### 2d. (Recommended) Auto-clean old files

Access is cut off at exactly 72 hours no matter what, but to also free the
storage: in the Cloudflare dashboard go to **R2 → boothique-shares → Settings →
Object lifecycle rules** and add a rule to **delete objects after 4 days**.

That's it — on the result screen you'll now see **"Get share link"**, which
uploads the strip and gives you a copyable 72-hour link.

---

## 3. Publishing the app for others (optional)

The app is a static site (the `dist/` folder), so any static host works. The
easiest with your Cloudflare account:

```bash
npm run build
npx wrangler pages deploy dist
```

Remember to set the `VITE_SHARE_API_BASE` environment variable in your hosting
provider's settings too, so the deployed app knows about the share Worker.

---

## Common hiccups

- **`command not found: npm`** → install Node.js (step 1) and reopen the terminal.
- **Share button still says "Share" not "Get share link"** → `.env` isn't loaded;
  confirm `VITE_SHARE_API_BASE` is set and restart `npm run dev`.
- **`wrangler login` does nothing** → run it again; it needs to open a browser tab.
- **Share link fails to create** → confirm the Worker is deployed
  (`npx wrangler deploy`) and that `PUBLIC_BASE_URL` in `wrangler.toml` matches
  the deployed URL.
