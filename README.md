# ShodhSutra — Next.js + Supabase

A multidisciplinary research journal platform. Same orange-and-white editorial design as the static version, now backed by Supabase with a full admin panel.

## 1. Set up Supabase (5 minutes)

1. Create a project at https://supabase.com.
2. Open **SQL Editor** and run, in this order:
   1. `supabase/schema.sql` — tables, row-level security, and the public `covers` storage bucket
   2. `supabase/seed.sql` — every record currently on the website (15 categories, 19 authors, 27 papers, 8 news articles)
3. Open **Project Settings → API** and copy the Project URL, the `anon` key and the `service_role` key into `.env`.
4. In `.env` also set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` (`openssl rand -hex 32`).

## 2. Run

```bash
npm install
npm run dev        # http://localhost:3000
```

Production: `npm run build && npm start` (or deploy to Vercel and add the same variables under Project → Settings → Environment Variables).

## What changed from the static site

| | |
|---|---|
| Brand | **ShodhSutra** |
| Data | Supabase tables instead of `data.js` |
| Submit page | Manuscript upload is replaced by **Paper link** (paste a URL). Optional **cover image** is compressed in the browser to under 10 KB before upload. |
| Routes | `/journals/[slug]`, `/news/[slug]`, `/authors/[slug]`, `/categories/[slug]` (real Next.js routes) |
| Admin | `/admin` — password protected, full CRUD |

## Admin panel (`/admin`)

Log in with `ADMIN_PASSWORD`. Tabs:

- **Papers** — create / edit / delete, pick authors, add the paper link, upload a cover, set DOI / peer-review flags (only tick these when verified), feature one paper on the home page.
- **Categories** — create / edit / delete categories (name, icon, description, order). New categories appear on the home page, Categories page, filters and the submit form immediately.
- **Authors** — create / edit / delete.
- **News** — create / edit / delete editorial articles.
- **Submissions** — papers sent through the public form. **Approve & publish** creates the author(s) and a live paper from the submitted link and cover; or reject / delete.
- **Messages** — contact-form messages.

A category that still has papers cannot be deleted (move the papers first).

## Cover compression (5–10 KB)

`lib/compress.js` runs in the browser: the image is centre-cropped to 3:4, resized (480×640 down to 90×120 if needed) and encoded as WebP (JPEG fallback) using a binary search for the highest quality that stays **≤ 10 KB**. Photos land in the 5–10 KB range; very simple graphics can come out smaller. The upload API (`/api/upload`) rejects anything over 12 KB, and the storage bucket has a hard 20 KB cap.

## Security notes

- The `service_role` key is only used in server code (`lib/supabase.js → supabaseAdmin`, server actions, `/api/upload`). It is never sent to the browser.
- Row Level Security: published tables are public-read; `submissions` and `messages` have no public policies. All writes go through the server.
- Admin sessions are an HMAC-signed, httpOnly cookie (7 days). Change `ADMIN_PASSWORD` to a strong value.
- The public forms include a honeypot field. For heavier traffic add rate limiting (e.g. Vercel Firewall or Upstash).

## Project layout

```
app/                 routes (App Router), server actions, /api/upload
components/          UI + client components (filters, admin, forms)
lib/                 supabase clients, data loading, helpers, compression, admin auth
supabase/            schema.sql, seed.sql
```

Pages read all rows per request (fine for hundreds of papers). If the collection grows into the thousands, move filtering/pagination into Supabase queries.

All sample authors, institutions, papers and news are fictional and flagged `is_demo`. No DOIs, peer-review claims or PDFs are invented.
