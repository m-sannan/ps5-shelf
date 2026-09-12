# Crate

A physical PS5 library that looks like a vinyl crate. Track each disc you own, log money from people who borrowed it, mark whether you finished the game (including **completed, still playing**), and share a seller-facing shelf with real cover and disc photos.

This is a local-first demo. The sample collection lives in your browser. Edit it, add photos, and use the share page as the view you send to buyers.

## What you can do

- Browse copies as spinning discs on wooden shelves
- Open a disc for purchase price, loan history, condition, and play status
- Log a loan with the person, date, and what they paid you
- List a copy for sale or mark it sold
- Upload cover art and a photo of the actual disc
- See spend, loan income, sales, and what the shelf still cost you
- Copy a share link to the public crate (same browser until you host it)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43127](http://localhost:43127).

## Notes

- Data is stored in `localStorage` under `vinyl-ps5-library-v1`
- The Share page is a presentation of that same library. Hosting the app (for example on Vercel) lets someone else open the URL, but they will see *their* browser storage unless you add a backend later
- Cover art in the demo is a colored label, not licensed box art — upload your own photos of the copies you actually have
