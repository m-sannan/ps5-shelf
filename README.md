# Crate

A PS5 disc library: poster grid, loans, sale prices, a money page, and a **cloud shelf** that syncs without an account.

**Use it here: [ps5-shelf.vercel.app](https://ps5-shelf.vercel.app)**

## How access works

There is no email, password, or PlayStation Network login. A shelf stays available in three ways:

1. **Paired devices sync automatically.** The first browser that creates a shelf stores a private device key locally and saves every change to the cloud.
2. **Link a device** in Settings. That shows a temporary **six-digit code** (five minutes, one use). The new device chooses **Open existing shelf** and becomes a second trusted editor.
3. **JSON backup.** Settings → **Download shelf backup** writes `crate-shelf-backup-YYYY-MM-DD.json`. If every device is gone, create a fresh shelf and restore that file.

If every device is lost *and* no backup was exported, there is no way to prove ownership. That is the tradeoff that avoids login.

The public share link is ` /s/[public-id] `. Friends see chosen public data only and cannot edit. The private device key is never in that URL.

## First use

- **Create my shelf** — creates a cloud shelf and silently saves a device key in this browser.
- **Import the shelf already saved on this device** — if an older local Crate library is present.
- **Open existing shelf** — pair with a six-digit code.
- **Restore from backup** — replace this shelf, or create a separate copy (safer default).

The exported JSON includes a version number, profile, games, loans, prices, statuses, notes, and compressed artwork (including user-uploaded photos).

## Cloud

The Vercel app hosts the UI **and** the `/api/cloud` API. Cloud is canonical; each browser keeps a fast local copy and refreshes on open, focus, and while in use.

Storage, first available:

1. **Cloudflare D1** — `CF_ACCOUNT_ID`, `CF_D1_DATABASE_ID`, `CF_API_TOKEN`
2. **Postgres** — `DATABASE_URL` (Neon / Vercel Postgres)
3. **Local file** — `.data/crate-cloud.json` in development

Optional: deploy `worker/` with Wrangler (D1 + R2) and set `NEXT_PUBLIC_CLOUD_API` to that Worker URL.

R2 is reserved for uploaded cover/disc photos when you move large artwork out of the JSON blob.

## Run it on your machine

```bash
npm install
npm run dev
```

Then open [http://localhost:43127](http://localhost:43127). Most people should use the Vercel link above instead.
