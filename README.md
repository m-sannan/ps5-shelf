# Crate

A physical PS5 library that looks like a console dashboard: a row of game cases, a glossy floor reflection, and an opening box that shows the disc.

## How to look at it

Run the app and open the preview. On first launch you pick a **local user** (like a console profile). Tap **Rohan Mehta** for the sample Mumbai shelf, or create your own.

- Arrow keys or Prev/Next to move along the cases
- Click the centre case, or **Open case**, to lift the cover and see the disc
- Upload box art and a disc photo, or paste an image link
- **Money** tracks spend, loans, and sales in the currency you choose (Indian rupees by default)

## Login

There is no PlayStation Network sign-in. Users live in this browser:

- Pick a profile to open that person's library
- Optional PIN on a profile
- **Switch user** goes back to the profile screen

That keeps the first version simple. Sharing one library across phones would need a real account later.

## Host it (Vercel)

This is a Next.js app, so Vercel is the right host. GitHub Pages is a worse fit: it wants a static export, and this project lives on Cursor’s git remote rather than GitHub.

From Cursor, use **Reconnect to Vercel** / **Publish** in this chat. After Vercel is connected, a public `*.vercel.app` URL is created.

Or from a terminal in this repo:

```bash
npx vercel
```

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43127](http://localhost:43127).
