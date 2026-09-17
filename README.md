# Monitoring CCTV — Frontend

SvelteKit 2 + Svelte 5 + Tailwind CSS 3 admin panel untuk CCTV monitoring platform.

## Stack

- **SvelteKit 2** (file-based routing, SSR/CSR hybrid)
- **Svelte 5** (runes API)
- **Tailwind CSS 3** (utility-first styling, custom brand tokens)
- **TypeScript** (strict mode)
- **Vite 5** (dev server + build)

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

App berjalan di `http://localhost:5173`. Vite memproxy `/api/*` ke backend di `http://localhost:8000`.

Frontend butuh backend jalan duluan (server-side load functions langsung fetch ke `API_BASE_URL`, lihat `.env.example`) — lihat repo `backend-monitoring` (sibling repo, [CLAUDE.md](CLAUDE.md)-nya juga referensi ke sana) untuk cara menjalankannya lewat Docker:

```bash
cd ../backend-monitoring
docker compose up --build
```

Frontend ini sendiri **tidak** ikut di-docker — tetap dijalankan native lewat `npm run dev` seperti di atas.

## Skrip

```bash
npm run dev        # vite dev server (port 5173)
npm run build      # production build
npm run preview    # preview production build
npm run check      # svelte-check + tsc
npm run format     # prettier write
```

## Struktur

```
src/
├── app.html           # HTML shell
├── app.css            # Tailwind directives + component classes
├── app.d.ts
├── lib/
│   ├── api/           # API client + endpoint modules
│   │   ├── client.ts
│   │   └── auth.ts
│   ├── components/    # Reusable UI components
│   │   ├── Button.svelte
│   │   ├── EmptyState.svelte
│   │   ├── Input.svelte
│   │   ├── Modal.svelte
│   │   ├── PageHeader.svelte
│   │   ├── Pagination.svelte
│   │   ├── Sidebar.svelte
│   │   ├── StatusBadge.svelte
│   │   ├── ToastContainer.svelte
│   │   └── Topbar.svelte
│   ├── stores/        # Svelte stores
│   │   ├── auth.ts
│   │   └── toast.ts
│   └── types/         # TypeScript types
│       └── api.ts
└── routes/
    ├── +layout.svelte
    ├── +page.svelte            # redirect /login or /dashboard
    ├── login/+page.svelte
    └── (app)/                  # auth-required route group
        ├── +layout.svelte
        ├── dashboard/+page.svelte
        └── edges/+page.svelte
```

## Design Tokens

Warna brand didefinisikan di `tailwind.config.ts`:

| Token | Hex | Penggunaan |
|-------|-----|------------|
| `brand-50` | `#f0f5ff` | Background hover/listrik |
| `brand-500` | `#5b7bf6` | Aksen |
| `brand-600` | `#4458e8` | Primary button, link aktif |
| `brand-700` | `#3845d1` | Hover state |

Ganti nama `brand` menjadi nama tenant Anda (mis. `pelni`, `garuda`) bila perlu.

## Catatan

- Token auth disimpan di `localStorage` dengan key `cctv.auth`. Untuk produksi, pertimbangkan httpOnly cookie (perlu backend support).
- Proxy `/api/*` di `vite.config.ts` harus disesuaikan dengan URL backend Anda.
