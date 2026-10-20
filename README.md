# XINEMAX — Cinematic Universe (8K)

A high-fidelity YouTube-clone built for the Arena sandbox: React + Vite + Tailwind CSS + Zustand (LocalStorage) + Framer Motion + Recharts + Lucide Icons.

**Live preview:** `npm run dev` → http://localhost:5173

## ✨ Features

- **Persistent Local Store** — Zustand + `persist` to LocalStorage (`xinemax-storage-v2`). Survives reloads, no external DB needed. 5 rich mock videos seeded (Iceland 8K, Kyoto Neon, Transformers, Patagonia, Deakins) with Big Buck Bunny CORS-safe MP4s + Unsplash thumbnails.
- **Auth** — Modular Sign In / Create Account modals. Default logged-in creator: **Elena Rostova** (`@elenarostova`, 284K subs) — creator features work immediately.
- **Home Feed** — Category tags (All, Cinematography, Technology, Nature, Drone, 8K), search, responsive 1→4 grid. View increment on `/watch/:id`.
- **PS5 Dashboard FX** — Global immersive background cross-fades 500ms to blurred thumbnail on hover/tap, card `scale-105` + neon-orange glow + z-elevation, title/meta slide-up fade 300ms, route slide+fade via Framer Motion. All animations `transform`/`opacity` only → 60 FPS.
- **Interactivity** — Like/Dislike toggle per user (mutually exclusive), Subscribe instantly updates global subscriber counts, Comments render at top with avatars + `timeAgo`.
- **Creator Studio `/studio`** — Create Video modal with **two ingest paths**: (a) file picker → `URL.createObjectURL` for instant local playback (no CORS), (b) external URL input with auto-fallback to Big Buck Bunny. Form: Title, Description, Category, Thumbnail URL. Non-intrusive session-persistence alert. Dashboard KPI cards (Views, Watch Hours, Subs, Revenue), Recharts Area + Bar, Manage Videos table with Delete/Archive.
- **Robustness** — Optional chaining (`video?.title`), null guards, image/video `onError` fallbacks, responsive (mobile drawer + bottom nav), strict TypeScript.

## 🛠 Stack
- React 18, React Router 6, Zustand 4, Framer Motion 11, Recharts 2, Lucide React, Tailwind 3, Vite 5

## ▶︎ Run
```bash
npm install
npm run dev      # http://localhost:5173 --host 0.0.0.0
npm run build
npm run preview
```

## 📦 Persistence
All mutations write to LocalStorage. Object URLs are session-only (blob:) — after a hard sandbox rebuild they expire and fallback to the sample loop. Use **Studio → Export JSON** to keep durable copies.

