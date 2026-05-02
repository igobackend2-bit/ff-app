# 🚀 How to Run QuickCart Locally

## One-Click Start (Windows)

**Double-click `RUN.bat`** in this folder — it does everything automatically.

---

## Manual Steps (any OS)

Open a terminal in this folder (`FF-APP`) and run these commands in order:

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Generate Prisma client
```bash
npx prisma generate
```

### Step 3 — Create the database
```bash
npx prisma db push
```

### Step 4 — Seed demo data (products, categories)
```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```
> **Windows CMD:** `npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/seed.ts`

### Step 5 — Start the dev server
```bash
npm run dev
```

### Open in browser
```
http://localhost:3000
```

---

## What you'll see

| Page | URL |
|------|-----|
| 🏠 Homepage | http://localhost:3000 |
| 🔍 Search | http://localhost:3000/search |
| 📦 Category | http://localhost:3000/category/snacks |
| 🛒 Cart | Click the cart icon |
| 🔐 Login | http://localhost:3000/login |
| 📋 Orders | http://localhost:3000/account/orders |

---

## Troubleshooting

### `Cannot find module '@prisma/client'`
```bash
npx prisma generate
```

### `Module not found: Can't resolve '@/...'`
Make sure you're running from the `FF-APP` folder, not a subfolder.

### Port 3000 already in use
```bash
npm run dev -- --port 3001
```

### Database errors
Delete `prisma/dev.db` and re-run Step 3.

---

## For Production

Replace `DATABASE_URL` in `.env.local` with your PostgreSQL connection string,
then switch the Prisma provider back to `postgresql` in `prisma/schema.prisma`.

```bash
npm run build
npm start
```
