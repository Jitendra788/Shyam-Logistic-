# SHYAM LOGISTIC

Next.js website for **SHYAM LOGISTIC** (GSTIN: 27AXGPL2293R1ZP) — public site, enquiry form, blog, admin panel, SEO-ready for Google.

## Pages

| Route | Page |
|--------|------|
| `/` | Home |
| `/about` | About Us |
| `/services` | Services |
| `/blog` | Blog |
| `/blog/[slug]` | Blog post |
| `/contact` | Contact + locations |
| `/quote` | Get a Quote |
| `/admin` | Enquiries |
| `/admin/blog` | Manage blog |
| `/admin/settings` | Site content & locations |

## SEO & Google (marketing)

After domain/hosting go live:

1. Set in `.env.local`:
   ```
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```
2. Open Google Search Console → add property → submit:
   - `https://your-domain.com/robots.txt`
   - `https://your-domain.com/sitemap.xml`
3. Optional verification:
   - Meta tag: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=...`  
   - Or upload Google’s HTML file to `public/`

**What is already wired:**

- Dynamic `robots.txt` (`src/app/robots.ts`) — allows public pages, blocks `/admin` & `/api`
- Dynamic `sitemap.xml` (`src/app/sitemap.ts`) — home, about, services, blog posts, contact, quote
- SEO meta titles/descriptions + keywords on all pages
- Open Graph + Twitter cards (WhatsApp/Facebook share previews)
- JSON-LD: Organization / LocalBusiness + WebSite schema (rich results)
- Canonical URLs & geo tags (Sangli / Maharashtra)

Helper notes: `public/google-seo-readme.txt`

## Setup

```bash
npm install
cp .env.example .env.local   # edit secrets + domain
npm run dev
```

### Admin — Transport Billing Management System

Open **http://localhost:3000/admin** (login: `admin` / `admin123`).

Desktop-style Master Page matching transport software screenshots:

| Menu | Screens |
|------|---------|
| Registration | Party Creation (`Frm_PartyCreation`) |
| Transport | Booking, LHC (Part Challan), LHP New/Update, Bill Preparation, Money Receipt, Debit/Credit Note, Expense Voucher |
| Reports | Links to registers |
| Website | Public-site Enquiries / Blog / Settings |
| Generate Backup & Exit | Downloads JSON backup |

Data files live under `data/tbs/` locally. On **Vercel**, disk is read-only — add free Upstash Redis so booking/bills persist:

1. Create DB at [console.upstash.com](https://console.upstash.com/) (Redis)
2. Copy REST URL + TOKEN into Vercel → Project → Settings → Environment Variables:
   ```
   UPSTASH_REDIS_REST_URL=https://....upstash.io
   UPSTASH_REDIS_REST_TOKEN=...
   ```
3. Redeploy

Without Redis, the server can still **load** committed seed JSON, but new saves will fail.


## Data files

- `data/settings.json` — company, phones, locations, services (admin editable)
- `data/posts.json` — blog posts
- `data/enquiries.json` — quote form leads (not committed)
