# SHYAM LOGISTICS

Next.js website for **SHYAM LOGISTICS** (GSTIN: 27AXGPL2293R1ZP) with public pages, enquiry form, and admin panel.

## Pages

- `/` — Home
- `/about` — About Us
- `/services` — Services
- `/contact` — Contact Us + locations map
- `/quote` — Get a Quote / Enquiry form
- `/admin` — Admin panel (enquiries)
- `/admin/settings` — Edit company info, locations, services

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Admin login

Configured in `.env.local`:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_SESSION_SECRET=change-this-in-production
```

Default: **admin** / **admin123**

## Data

- `data/settings.json` — company name, GSTIN, phone, locations, services (editable from admin)
- `data/enquiries.json` — quote form submissions

All location and content fields can be changed from **Admin → Site Settings**.
