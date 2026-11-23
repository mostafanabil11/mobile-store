# Apple Store — storefront + admin

A showroom website for an Apple-only reseller. Customers browse iPhone, iPad, Mac, Apple Watch, AirPods and accessories
(new, open box and pre-owned, with battery health, warranty, etc.) and enquire through **WhatsApp** with a prefilled
message. There is no cart or online checkout.

| Part      | Stack                                                         | Port |
| --------- | ------------------------------------------------------------- | ---- |
| `backend` | NestJS 12 · TypeScript (ESM) · MongoDB (Mongoose) · Zod · JWT | 4000 |
| `frontend`| Next.js 16 (App Router, Cache Components) · React 19 · Tailwind 4 | 3000 |

## Run it locally

```bash
cd backend && npm install && npm run start:dev
```

```bash
cd frontend && npm install && npm run dev
```

Open http://localhost:3000 for the store and http://localhost:3000/admin for the dashboard.

Product photos are stored in MongoDB (GridFS), not on disk. If you have photos from an older checkout in
`backend/uploads/`, load them into your local database once (with the API running):

```bash
cd backend && npm run migrate -- --media-only --to "mongodb://127.0.0.1:27099/store"
```

- **No MongoDB yet?** Leave `MONGODB_URI` empty in `backend/.env`. The API starts an embedded MongoDB for development
  and keeps its data in `backend/.mongo-data`. Paste your Atlas/hosted URI into `MONGODB_URI` when you have it.
- **First admin login:** created on first boot from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env`. Change the
  password from **Admin → Settings** after signing in.
- **Demo products:** `SEED_DEMO=true` inserts 12 sample products when the collection is empty. Delete them from the
  dashboard, or set it to `false`.

## Device catalog (demo photos & specs)

The admin can prefill products from two free, no-key sources:

| Source | Covers | Photos |
| ------ | ------ | ------ |
| [phone-specs-api](https://github.com/azharimm/phone-specs-api) (GSMArena data) | iPhone, iPad, Apple Watch + full specs | GSMArena shots (small watermark) |
| [DummyJSON](https://dummyjson.com) | MacBook Pro 14″, AirPods, AirPods Max, MagSafe Battery Pack, chargers, HomePod mini | Clean studio renders |

- **Add product → Start from a model**: search a model and it fills the name, category, specs, the model's real storage
  and colour options, and downloads its photos into `backend/uploads`.
- **Products → Fill missing photos**: adds catalog photos (and specs, if empty) to every product without photos.

This is for demos only: replace the photos with your own or licensed ones before a real launch. The phone source is set
by `CATALOG_API_URL`.

## Home page banner

The default banner (`frontend/public/hero.jpg`) is the Deep Blue iPhone 17 Pro catalog render (GSMArena, watermarked,
demo only) placed on the site's `#f5f5f7` background at 2:1. Upload your own in **Admin → Settings → Home page**.

The category images are `frontend/public/categories/{iphone,ipad,mac,watch,airpods,accessories}.webp`, 800×800 on
white. The iPhone one is the same iPhone 17 Pro render recoloured to the Silver finish; the others are DummyJSON demo
renders. Replace those six files to change them.

## Environment

`backend/.env` (see `.env.example`): `PORT`, `FRONTEND_URL`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`,
`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `SEED_DEMO`, `CATALOG_API_URL`.

`frontend/.env.local` (see `.env.example`): `API_URL` (where Next reaches the API) and `NEXT_PUBLIC_SITE_URL` (used to
link back to the product inside WhatsApp messages).

## How it fits together

- The browser only talks to Next.js. `next.config.ts` rewrites `/api/*` and `/uploads/*` to the NestJS server, so the
  admin's `httpOnly` auth cookie is first-party.
- Store pages are partially prerendered: the layout and skeletons are static, product data streams in fresh on every
  request, so admin changes show up immediately.
- `src/proxy.ts` redirects `/admin/*` to the login page when there's no session cookie; the API checks the JWT on every
  admin request.
- Products without photos show a device illustration tinted with the product's colour.

## API

Public

| Method | Path                            | Notes                                                   |
| ------ | ------------------------------- | ------------------------------------------------------- |
| GET    | `/api/products`                 | `q, category, condition, storage, minPrice, maxPrice, featured, sort, page, limit` |
| GET    | `/api/products/facets`          | Counts per category/condition, storage options, price range |
| GET    | `/api/products/:slug`           | Available or reserved products only                     |
| GET    | `/api/products/:slug/related`   |                                                         |
| GET    | `/api/settings`                 | Store name, WhatsApp number, currency, contact, hero text |

Admin (cookie or `Authorization: Bearer`)

| Method | Path                               |
| ------ | ---------------------------------- |
| POST   | `/api/auth/login`, `/api/auth/logout` |
| GET/PATCH | `/api/auth/me`                  |
| PATCH  | `/api/auth/password`               |
| GET    | `/api/admin/products`, `/api/admin/products/stats`, `/api/admin/products/:id` |
| POST   | `/api/admin/products`              |
| PATCH  | `/api/admin/products/:id`, `/api/admin/products/:id/status` |
| DELETE | `/api/admin/products/:id`          |
| POST   | `/api/admin/uploads` (multipart `files`, up to 10 images) |
| PUT    | `/api/admin/settings`              |

## Product fields

`name, category (iphone|ipad|mac|watch|airpods|accessories), condition (new|open-box|used), storage, color, colorHex,
batteryHealth, price, compareAtPrice, warranty, region (version/SIM), inTheBox, description, specs[{label,value}],
images[], status (available|reserved|sold|hidden), featured, quantity`.

Sold and hidden products never appear in the store.

## Open decisions (to discuss)

- Store name, currency and WhatsApp number (set in **Admin → Settings**).
- Product logic: variants vs. one listing per unit, which fields are required, warranty rules.
- Image hosting for production (local disk now; S3/Cloudinary later).
- Design iterations.

## Deployment

Live:

- Store: https://mobile-store.mostafa-nabil-arafa01.workers.dev (admin at `/admin`)
- API: https://mobile-store-api-t6s0.onrender.com/api (Render service `mobile-store-api`, Frankfurt, free plan)
- Database: MongoDB Atlas, database `mobile-store`

Pushing to `master` redeploys the API on Render automatically. The store is redeployed manually with the
`npm run deploy` command below.

| Part | Host | Notes |
| ---- | ---- | ----- |
| API | Render web service (Node, free plan) | Photos live in MongoDB, so Render's temporary disk doesn't matter |
| Store + admin | Cloudflare Workers via [OpenNext](https://opennext.js.org/cloudflare) | Config in `frontend/wrangler.jsonc` |
| Database | MongoDB Atlas | Set `MONGODB_URI` on Render |

**Backend (Render).** Build command `cd backend && npm ci --include=dev && npm run build`, start command
`cd backend && npm run start:prod`, health check `/api/health`. Environment: `NODE_ENV=production`, `MONGODB_URI`,
`JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`, `SEED_DEMO=false`, `CATALOG_API_URL`.

**Copy local data to Atlas** (products, settings, admin account and the photos they use):

```bash
cd backend && npm run migrate -- --from "mongodb://127.0.0.1:27099/store" --to "<atlas uri>"
```

**Frontend (Cloudflare).** `API_URL` and `NEXT_PUBLIC_SITE_URL` are needed at build time and at runtime
(`vars` in `wrangler.jsonc`):

```bash
cd frontend && API_URL=https://<api>.onrender.com NEXT_PUBLIC_SITE_URL=https://<site> npm run deploy
```

Two Next.js features are off because OpenNext on Workers doesn't support them yet: Cache Components (pages hang)
and the Node.js `proxy.ts` middleware (signed-in requests fail). Admin pages redirect to login on the client, and
the API checks the session on every request.

**Keep-alive (optional).** `deploy/keepalive` is a Cloudflare cron Worker that pings `/api/health` every 10 minutes
during store hours so the free Render service doesn't sleep. Deploy with `npx wrangler deploy` from that folder.
Render's free plan has 750 instance-hours per month shared by all free services in a workspace.

