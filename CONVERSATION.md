# Crate — conversation handoff

Use this file to move the project into another chat, repo, or Grok Project. It is the working record of what was asked, what shipped, and what to do next.

**Live:** [https://ps5-shelf.vercel.app](https://ps5-shelf.vercel.app)  
**Repo:** [https://github.com/m-sannan/ps5-shelf](https://github.com/m-sannan/ps5-shelf)  
**Production SHA (this handoff):** `5e73b8b` — *Make Share a public Crate, with takes and a shareable card.*

Crate is a **PS5 disc library**, not a marketplace first. The USP is a Letterboxd-style public shelf: four favourites, a memorable handle, a shareable Crate card, and short takes. Selling is still there, but it is a footnote on the public page.

There is **no account login**. Cloud sync is device pairing + JSON backup.

---

## Product in one page

### What the owner sees

| Screen | Role |
| --- | --- |
| **Library** | Private shelf. Artwork / Discs. Playing / Done / For sale / Sold. Add game (FAB on mobile). Open a copy to rate, pin as a favourite, write a public take, keep private notes. |
| **Share** | Builder for the public Crate: handle (`/s/yourname`), pin four, live preview, **Share Crate** (image + link), hide whole shelf or single games, seller card. Listings sit under the collection. |
| **Money** | Paid, asking, sold, loans. Demo reset lives here. |
| **Settings** | Pair another device (6-digit code), JSON backup / restore, copy share link, name / city / contact / currency. |

Mobile: bottom dock + floating add. Nav stays on screen while scrolling.

### What a visitor sees (`/s/handle` or `/s/<hex>`)

- Name, handle, city, diary line (“Playing X · Finished Y ★★★★★”)
- **Four on the shelf** (pinned favourites, or auto if none pinned)
- **Takes** — Letterboxd-style review cards (name, title, stars, logged date, poster, text)
- **Collection** — rest of the shelf
- **A few copies available** — only listed discs, Discord-style photos + listing text
- **Share Crate** / Save image
- **You both own N** if the visitor already has a Crate in that browser
- Open a game → **Add to my shelf** (title + box art only; rating, take, price, notes stay with the owner)
- **Share this take** — review card image + link

Old hex links keep working forever. Handle is extra, not a replacement.

### What is deliberately not in the product

- Email / password / PSN login
- Social graph, likes, follows
- Carrying someone else’s rating onto your shelf
- Digital copies listed for sale
- PIN lock (dropped — it confused people)

---

## Conversation, in order

### 1. Start from GitHub

Asked to pick **m-sannan/ps5-shelf** and work in the existing Next.js app (not a greenfield rewrite).

### 2. Cloud without login

Product spec: no accounts. First browser creates a shelf and stores a **device secret**. Cloud is canonical. Pair a second device with a **one-use 6-digit code** (5 minutes). JSON backup as the recovery path. Public share id is separate from the device key.

Where data lives (production): **Vercel Blob** (`crate-cloud.json`), last-write-wins merge. Local `localStorage` is the fast copy. Pairing is not a hard device cap — each successful code adds another trusted editor.

### 3. Copy and photos

Discord-style **condition photos** of *this copy*, not stock art. Artwork / disc / condition are separate. Lightbox so listed photos actually expand. Listing text on the copy (PS5 vs PS4, CIB, pickup city). Seller card on the public link.

Digital copies: no sell / sold / condition. Disc-only **borrowed from**. Purchase date optional. Gift = paid `0`.

### 4. Share as a listing page (first pass)

Asked for a page you actually send people: Discord-marketplace listings, photos of this copy, listing text, copy-for-Discord, hide the whole shelf or individual games, first-run **How this works**, mobile dock + FAB.

That pass shipped, then felt too much like a stall.

### 5. “Selling is not the USP”

Asked to **plan only**, then to **build**:

> People want to share their library like Letterboxd. What is a viral loop that is easy to share and remember?

Adopted:

1. **Handle** — `/s/sannan` instead of a hex id  
2. **Favourite four** — the cases people see first  
3. **Crate card** — 1080×1350 image of the four + name + stats (the screenshot people post)  
4. **Diary line** — currently playing / last finished  
5. **Collection-first public page** — listings demoted  
6. **Shelf twin** — “You both own N” with no social graph  
7. **Takes** — public reviews you can send as a card (Letterboxd diary screenshot as the reference)  
8. **Share Crate**, not only download — share sheet on phones; copy link + save image as fallback  
9. **Add to my shelf** — visitor copies title + cover into their own Crate  

Selling stayed. It is no longer the landing story.

### 6. Production

Pushed to GitHub `main` and promoted on Vercel. Production alias: **ps5-shelf.vercel.app**.

Later asks in this thread: sticky mobile nav (shipped), “is this live?”, “move to production”, then the Letterboxd work, then reviews / share / add-to-shelf, then this handoff file.

---

## Data model (what to keep)

```ts
Game {
  id, title, platform: "PS5"
  copyKind?: "disc" | "digital"
  status: on_shelf | in_progress | completed | completed_still_playing | lent_out | for_sale | sold
  condition: mint | near_mint | good | fair   // physical only
  rating?: number | null                      // half stars, 0.5–5
  review?: string                             // PUBLIC take
  loggedAt?: string                           // YYYY-MM-DD when the take was first written
  notes: string                               // PRIVATE
  listingNote?: string                        // public listing copy
  hidden?: boolean                            // omit from public Crate
  coverImage, discPhoto, casePhoto, photos[]
  purchasePrice, purchaseDate, askingPrice, soldPrice
  borrowedFrom?: string                       // PRIVATE, disc only
  loans[]
}

Profile {
  name, contact, city, note, currency
  handle?: string                             // public slug, unique on cloud
  favoriteIds?: string[]                      // max 4
  sharePublic?: boolean                       // hide entire Crate
  shareCollection?: boolean                   // hide collection, keep listings
  sharePaidPrice?: boolean                    // unused on public (paid is stripped)
}
```

Public sanitizer (`lib/public-view.ts`): strips notes, loans, paid price, purchase date, borrowed-from. **Keeps** rating, review, loggedAt, listingNote, covers, asking price on listed discs.

Handle rules (`lib/handle.ts`): lowercase, uniqueness claimed in `lib/cloud/engine.ts`. Lookup is **publicId first, then handle**, so old hex URLs never break. 409 if the handle is taken; client reverts.

---

## Important files

| Path | Why it exists |
| --- | --- |
| `components/crate-view.tsx` | Shared public Crate (preview + `/s/…`) |
| `components/share-library.tsx` | Owner controls: handle, four, hide, live preview |
| `components/public-shelf.tsx` | Visitor page; shelf twin; owner check |
| `components/crate-card.tsx` | Canvas Crate card + Share / Save |
| `components/review-card.tsx` | Letterboxd-style take UI + shareable image |
| `components/game-panel.tsx` | Owner editor + public overlay + Add to my shelf |
| `lib/crate.ts` | favourite four, diary line, partition, stats, overlap |
| `lib/handle.ts` | normalize / reserved words |
| `lib/share-blob.ts` | Web Share API + copy + download fallback |
| `lib/cloud/engine.ts` | Blob store, handle claim, public lookup |
| `app/s/[publicId]/page.tsx` | Public route + metadata |
| `app/s/[publicId]/opengraph-image.tsx` | OG image for Discord / iMessage previews |
| `lib/seed.ts` | Demo library; TLOU Part I has a sample take |

---

## Sync, in plain language

1. Creating a shelf writes a **device secret** in the browser and a **shelf** in Blob.  
2. Edits save locally immediately and push to cloud (~debounce). Cloud last write wins.  
3. Opening / focusing the app pulls cloud.  
4. **Link a device** (Settings) → 6-digit code → other browser becomes another editor of the same shelf. No advertised max.  
5. **Download shelf backup** is the escape hatch if every device is gone.  
6. Public `/s/…` reads the public projection only. Friends cannot edit.

Do not add `user_id` / Better Auth unless the owner explicitly asks for accounts.

---

## How to continue in a new project

Paste this file (or the repo) and say what to change. Useful prompts:

- “Open [m-sannan/ps5-shelf](https://github.com/m-sannan/ps5-shelf), don’t rewrite, ship on [ps5-shelf.vercel.app](https://ps5-shelf.vercel.app).”
- “Don’t push until tested.”
- “Selling is not the USP. Collection / Letterboxd loop first.”
- “Additive: old `/s/<hex>` links must keep working.”

Stack: **Next.js App Router**, React client components, Tailwind, Vercel, Vercel Blob. Not TanStack Start.

---

## Suggested next work (not started)

These came up in conversation but were not built:

1. **Handle onboarding** — first-run “pick a name people can remember” before Share feels empty.  
2. **Logged date editor** — takes use `loggedAt` on first write; no UI yet to change it.  
3. **Year on the take card** — Letterboxd shows “The Holiday 2006”; games have no release year field.  
4. **Discord copy for a take** — we share an image; a one-tap text block for Discord is still useful.  
5. **Visitor add-to-shelf when they have no Crate** — today it sends them home to create one; a one-step “start a Crate with this disc” would convert better.  
6. **OG image with the four covers** — `opengraph-image.tsx` exists; Wikimedia covers can fail CORS.  
7. **PS4 vs PS5 as a field** — people put it in listing text; a real platform flag would help filters.  
8. **Guidance density** — How this works exists (`crate-guide-v2`); it may need a pass now that Share is a Crate, not a stall.

---

## Don’t break

- Device-secret cloud + pairing + JSON backup  
- Public sanitizer (private notes / paid / borrowed never leak)  
- Digital cannot be listed  
- Photo lightbox on listed copies  
- Mobile dock + sticky nav + FAB  
- Hex public URLs  
- Handle uniqueness (409 + revert, don’t loop-push)  
- Add-to-shelf must not copy rating, review, price, or notes  

---

## Raw request log (short)

1. Pick this GitHub repo and change the code.  
2. Cloud shelf, no account, pairing, JSON backup.  
3. Verify public page / pairing / backup; clipboard blocked in preview.  
4. Disc photos like Discord; collapse loans; hide lent/paid on public; don’t push until tested.  
5. Cover / open / case / disc confusing; simplify add; restore artwork, disc, condition, sold stamp, rating.  
6. For sale filter; drop PIN/lock; half-stars; split box art / disc / condition; notes helper.  
7. Push to GitHub + Vercel production. Favicon = cream PS5 + DualSense.  
8. Disc grid alignment; Playing / Done / Sold.  
9. Digital no sell; borrowed-from; optional purchase date; gift = 0; share link repair; seller card.  
10. Can’t expand condition photos — lightbox.  
11. Share should be a custom page with listing text; hide shelf or games; library is private landing; guidance; mobile bottom nav + FAB.  
12. How does sync work, where is data, how many devices? Sticky nav on mobile. Is this live? Move to production.  
13. Selling is not the USP — Letterboxd loop, **planning only**. Then: build it, don’t break the codebase.  
14. Takes like a Letterboxd review; Share Crate not only download; visitors add the disc to their collection.  
15. Changes live on prod? (yes, after this SHA).  
16. **Create an MD of this conversation to move to projects.**
