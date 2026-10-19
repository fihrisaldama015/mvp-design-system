# Design review service: backlog, keputusan, pertanyaan

Per 19 Oktober 2026 (hari demo). File ini untuk di-go-through sesudah demo. Isinya: apa yang sudah diputuskan, apa yang
masih perlu dijawab, pekerjaan berikutnya, dan temuan yang sengaja ditunda. Spec: `docs/superpowers/specs/2026-10-16-design-review-service-design.md`.
Run sheet demo: `docs/demo/review-service-demo.md` (di branch `demo/review-usage`).

## 0. Status saat ini

| Bagian | Di mana | Status |
|---|---|---|
| Service (Express + Mongoose + UI) | repo `github.com/fihrisaldama015/design-review`, live di https://design-review-jet.vercel.app | jalan di Vercel + Atlas (`design_review`). 1 commit lokal belum di-push (skrip `reset-review`, sengaja ditahan sebelum demo). |
| Halaman `/review`, scan usage, skill | worktree `mvp-design-system-review`, branch `feat/design-review-service` | selesai dan lolos review kode, belum di-merge ke `main`, belum di-deploy. |
| Data dan skrip demo | branch `demo/review-usage` (di atas branch fitur) | **hanya untuk demo, jangan di-merge.** Berisi halaman yang memakai `searchable`, `demo/review/*.sh`, `.env.development`, run sheet. |
| Verifikasi | tes unit (mvp 82, service 67), round trip lokal ke service, screenshot headless layar login | **tampilan setelah login belum pernah dilihat di browser oleh siapa pun** (ekstensi Chrome tidak terhubung). |

## 1. Keputusan yang sudah dibuat

| # | Keputusan | Alasan singkat |
|---|---|---|
| D1 | Review store jadi **service standalone** (seperti Chromatic), internal dulu, multi-tenant nanti. Project menghitung, service menyimpan. | Skill dipakai banyak project dengan setup berbeda; swt di VPS tidak bisa memakai KV. |
| D2 | Stack service sama dengan swt: React 18 + rsbuild + Tailwind, Express + Mongoose. Satu repo (`web/` + `server/`), di VPS nanti **dua container** (fe + be). | Tim bisa merawatnya seperti service lain. |
| D3 | Database MongoDB: **Atlas sekarang**, VPS nanti dengan database kosong. Tanpa fitur khusus Atlas; index dibuat oleh kode. | Pindah cukup ganti connection string. |
| D4 | Hosting sekarang **Vercel + Atlas**. Pindah ke VPS (Docker) hanya setelah ada approval, service dan databasenya sekaligus. | Belum ada akses Docker server. |
| D5 | Token project hanya untuk tool (tidak pernah di browser). Reviewer login dengan akun sendiri; nama di riwayat berasal dari sesi. Admin pertama lewat seed. | Audit yang berarti; token di browser bisa dibaca siapa saja. |
| D6 | Halaman `/review` ditulis dengan React di tiap project. Project dengan stack lain menulis halamannya sendiri terhadap API yang sama. | Service tidak butuh kode project. |
| D7 | Before/after halaman penuh hanya kalau ada kandidat yang bisa dibuka. swt (hanya stage dan produksi) tidak punya itu: halaman menampilkan halaman saat ini. | Tidak ada level di bawah stage. |
| D8 | **Draft adalah branch git, bukan folder `src/proposed/`.** Satu branch bersama `design-review`, **satu commit per komponen**, boleh branch sendiri untuk komponen yang berisiko. Service tidak peduli: tiap review menyimpan alamat preview-nya sendiri. | `proposed/` untuk komponen yang belum ada; salinan kedua akan menjauh dari yang asli. Branch = satu sumber kebenaran, dan `--done` memeriksa kode sungguhan. |
| D9 | Perbandingan komponen (perubahan tampilan) lewat **Storybook**: production vs preview branch `design-review`. | Statis, tanpa data. |
| D10 | **swt: Storybook tetap di Vercel + Preview Deployment untuk sementara.** Docker dan pipeline Bitbucket dipertimbangkan setelah ada acc. | Nol infrastruktur baru. |
| D11 | Properti dihapus: before/after halaman lewat **override saat runtime** (mis. `?embed=1&ds-off=Select.searchable`), bukan deployment kedua. Disetujui sebagai arah; **belum dibangun dan belum diuji**. | Tidak butuh container kandidat. |
| D12 | **mvp-dev mendapat remote** `git@github.com:fihrisaldama015/mvp-dev.git`. Project Vercel Storybook **diarahkan ulang** ke repo itu (bukan dihapus; domain `mvp-design-system-storybook.vercel.app` tetap). Build Storybook didefinisikan di `vercel.json` repo itu, seperti swt-fe. | Dev memegang komponen dan Storybook. Storybook mvp sekarang dibangun dari repo vibe `main`. |
| D13 | Halaman `/review` dan skill Figma sync pindah ke **app dev** (mvp-dev berperan seperti swt-fe). Scan usage lalu memindai halaman yang sudah di-slice, yaitu halaman produksi. | Alat sisi dev; bukan bagian sandbox prototipe PM. |
| D14 | **Demo hari ini memakai worktree vibe** (`mvp-design-system-review`, branch `demo/review-usage`). | Sudah disiapkan dan diuji. |
| D15 | Halaman `/review` ada di luar `Layout` (tanpa sidebar, selebar layar). Frame preview memuat halaman dengan `?embed=1` (tanpa sidebar dan top bar). App yang di-preview harus mendukungnya. | Fokus ke konten dan usage komponen. |
| D16 | **Developer melihat keputusan lewat skill (CLI) dan UI service.** CLI memanggil API service dengan token project: `reviewState` (daftar review yang belum applied, dan hook SessionStart menjalankannya sehingga Claude/dev melihatnya di awal sesi), `reviewSync --answers "<Nama>"` (jawaban, siapa, kapan, tanggal migrate-by), `--done` (gerbang). UI service (tab History) dan halaman `/review` untuk melihat riwayat. | Sudah ada; tidak ada alur terpisah. Celahnya ada di Q11. |

## 2. Pertanyaan yang masih perlu dijawab

| # | Pertanyaan | Rekomendasi / yang dibutuhkan |
|---|---|---|
| Q1 | **Branch mana yang jadi `main` di mvp-dev?** | `main` adalah leluhur langsung `demo/start` (tidak ada commit yang hanya di `main`), dan `demo/start` unggul 5 commit: slice Reservations dan NewReservation, versi check yang diperbaiki, port 5003, catatan demo. Rekomendasi: **fast-forward `main` ke `demo/start`**, tanpa kehilangan apa pun. Dua halaman itu persis yang dipakai cerita review. Catatan: ada commit "remove the earlier Reservations slice" di riwayat; boleh di-squash sebelum push kalau mau riwayat bersih. Repo di GitHub: private. |
| Q2 | Project Vercel Storybook **swt**: terhubung ke Bitbucket lewat integrasi Git? Production branch-nya apa (`feature/storybook-shared-components` atau sudah `dev`)? Deployment Protection untuk preview dimatikan? | Hanya Anda yang bisa melihat dashboard-nya. Tanpa Git integration, tidak ada Preview Deployment otomatis. |
| Q3 | Siapa yang membuat dan merawat branch `design-review` di swt-fe, dan seberapa sering di-rebase ke `dev`? | Perlu aturan: satu commit per komponen, hanya perubahan komponen (jangan token atau Foundation). |
| Q4 | **Apa arti "applied" untuk `keep-deprecated`?** Sekarang, review yang sudah applied memulai siklus baru pada sync berikutnya dan reviewer ditanya lagi. | Perlu keputusan produk: jawaban deprecated dibawa ke sync berikutnya (dan hanya burn-down usage yang dicatat) atau selalu ditanya ulang. Menyangkut `reviewLogic.mjs` di dua repo. |
| Q5 | Override runtime (D11): disetujui mengubah komponen shared di repo dev? Nama parameter dan properti mana saja yang didukung? | Spike kecil dulu di mvp-dev, lalu ukur. |
| Q6 | Siapa pemilik akun admin service, dan bagaimana kebijakan password dan sesi (sekarang: sesi 8 jam, ganti password tidak membatalkan sesi lama)? | Lihat F1. |
| Q7 | Untuk pengajuan VPS: kapan, ke siapa, dan apa saja yang diminta (dua image, database Mongo sendiri dengan user `readWrite`, subdomain, reverse proxy, header `frame-ancestors`)? | Dokumen satu halaman untuk DevOps bisa saya buatkan. |
| Q8 | swt-fe: nama build flag untuk `/review` (hanya stage), cara menanam URL service saat build (`REACT_APP_*` atau Vault), dan dukungan `?embed=1` di layout swt? | Perubahan kecil di swt-fe; perlu dipastikan polanya. |
| Q9 | Field `hasPreviewBuilds` di project tidak dipakai dan tidak bisa diedit di UI. Dipakai (untuk menentukan jenis preview) atau dihapus? | Putuskan saat membangun frame Storybook. |
| Q10 | "Now" untuk Storybook swt: Storybook Vercel production, atau perlu langkah Storybook di pipeline stage? | Selama pakai Vercel, "Now" = production Vercel; tidak perlu pipeline. |
| Q11 | **Bagaimana developer tahu ada keputusan baru?** Sekarang hanya dengan memeriksa sendiri: hook SessionStart di Claude Code, `reviewState` di CLI, atau membuka UI. Tidak ada notifikasi. Dan UI service tidak punya daftar antrean: tab History adalah log kronologis, bukan daftar review dengan status. | Usulan: tab "Reviews" di UI service (daftar review, status pending/answered/applied, filter) dan notifikasi saat keputusan masuk (webhook ke Slack atau email). Putuskan mana yang perlu. |

## 3. Pekerjaan setelah demo (urutan yang disarankan)

1. **Keamanan dan bersih-bersih.** Cabut token project yang pernah tertulis di chat dan buat yang baru (UI service, tab Tokens). Ganti password admin yang pernah tertulis di chat. Tulis ulang `.figma-dump/review-api.json` di checkout utama mvp (masih format lama `{url,key}`) menjadi `{ "url": "https://design-review-jet.vercel.app/api/v1", "project": "mvp", "token": "drp_..." }`. Hapus store KV dan env lama (`REVIEW_PASSWORD`, `REVIEW_API_KEY`, `KV_*`) dari project Vercel app mvp.
2. **Merge branch fitur ke `main`** di repo vibe (tanpa `demo/review-usage`), push, dan deploy app mvp dengan env `PUBLIC_REVIEW_SERVICE_URL` dan `PUBLIC_REVIEW_PROJECT=mvp`. Tambahkan origin app mvp ke `allowedOrigins` project `mvp` di service (sudah berisi `https://mvp-design-system.vercel.app` dan `http://localhost:5002`).
3. **mvp-dev:** putuskan Q1, tambahkan remote, push. Tambahkan build Storybook ke `vercel.json` (`npm run build-storybook`, output `storybook-static`) dan hapus rewrite `/api/review` yang sudah tidak terpakai. Arahkan ulang project Vercel Storybook (Settings → Git). Awas **bentrok port 5003**: dev app mvp-dev memakai 5003, sama dengan kandidat demo. Jalankan tidak bersamaan, atau pindahkan salah satunya.
4. **Pindahkan halaman review dan skill ke mvp-dev** (D13): `Review.js`, `PagePreview`, helper, scan usage, mode embed di `Layout`, route di luar `Layout`, skill `building-storybook-from-figma`. Pekerjaan porting dengan tes. Scan usage memindai app dev.
5. **Frame Storybook:** field `storybookPreviewUrl` di service dan di `reviewSync` (`--storybook-preview-url`), dua iframe Storybook (`iframe.html?id=<storyId>&viewMode=story`) di halaman review.
6. **Spike override runtime** (D11/Q5) di mvp-dev: apakah "setelah" untuk properti dihapus bisa tanpa deployment kedua.
7. **swt:** jawab Q2, Q3, Q8; siapkan build flag `/review`, `?embed=1`, origin stage di `allowedOrigins`; branch `design-review` dengan Preview Deployment di Vercel.
8. **VPS (hanya setelah acc):** Dockerfile untuk `design-review-fe` dan `design-review-be`, pipeline, Mongo (database dan user sendiri), subdomain, reverse proxy, header iframe. Database mulai kosong.
9. **Antrean keputusan untuk developer (Q11):** tab "Reviews" di UI service dan, kalau diputuskan, notifikasi saat keputusan masuk.
10. **Opsi demo tanpa share screen:** push branch `demo/review-usage` (sebagai "Now") dan branch fitur (sebagai kandidat) ke GitHub, lalu dua Preview Deployment Vercel dari project app mvp, dengan env `PUBLIC_REVIEW_SERVICE_URL` dan `PUBLIC_REVIEW_PROJECT`, Deployment Protection preview dimatikan, dan kedua origin preview ditambahkan ke `allowedOrigins` project `mvp`. Itu model sesungguhnya (dua deployment dari satu repo), bukan `localhost`.
11. Perbaikan dari bagian 4, mulai dari F1 dan Q4.

## 4. Temuan yang sengaja ditunda (dari review tiap task dan review akhir)

| # | Temuan | Dampak |
|---|---|---|
| F1 | Ganti password tidak membatalkan sesi lama (JWT 8 jam). | Penting, karena password sementara dikeluarkan admin. Prioritas pertama. |
| F2 | Jawaban `keep-deprecated` tidak dibawa ke siklus berikutnya (Q4). Dicatat sebagai batasan di `reference/review-service.md`. | Reviewer ditanya lagi setelah sync berikutnya. |
| F3 | CORS: origin project diizinkan juga untuk route admin, bukan hanya `/auth/*` dan `/projects/:p/reviews*`. Cache origin per proses (sampai 60 detik di tiap instance Vercel). | Kecil. |
| F4 | Halaman review: draft di kartu hilang kalau versi review berubah saat sesi kedaluwarsa. Ganti password paksa setelah login ulang melepas kartu, jadi pilihan hilang. Tidak ada state loading. `previewUrl` hanya mengambil origin (path dan query dibuang). Iframe tanpa `sandbox`. | Kecil sampai sedang. |
| F5 | Scan usage: `//` setelah spasi di dalam string atau teks JSX membuang sisa baris itu (tag setelahnya tidak terhitung). Import `{ default as X }`, tag anggota `<UI.Select>`, namespace dan barrel import tidak dikenali. Elemen parent dengan `<Outlet/>` tidak memberi file ke child-nya. Ada array `warnings` ekstra di `usage.json`. | Under-count senyap, jarang terjadi. `--done` menolak kalau scan melaporkan warning. |
| F6 | Sorotan komponen di halaman (atribut `data-ds`) belum ada. | Perlu perubahan di komponen shared. |
| F7 | Service: tanggal `migrateBy` diterima asal berpola (`2026-99-99` lolos; halaman memvalidasi tanggal asli). Token delete tidak memfilter `orgId` (aman lewat project). `isValidObjectId` menerima string 12 karakter. Seed tanpa `try/finally` untuk disconnect. Tidak ada index `projectId` di `Token`. Tes: unique token hash dan membership belum dites, tes race bersifat probabilistik (12 putaran). `createdAt`/`updatedAt` string ISO di logika tapi `Date` lewat schema. Rute di luar `/api/v1` menjawab 404, bukan 503, saat belum dikonfigurasi. | Kecil. |
| F8 | UI service: Tabs, Card, DataTable, Badge memakai kelas `slate/indigo` mentah dari komponen yang ditarik (milik repo dev). Tombol Copy gagal diam-diam tanpa izin clipboard (secret tetap terlihat). Alert error sesaat sebelum redirect 401. | Kecil; sebagian pekerjaan repo dev. |
| F9 | Skill: fallback lokal (`reviewCore`) tidak dibatasi per project dan tidak memiliki cek route (`/applied` pada review pending, validasi `items`). Tes CLI hanya menegaskan exit non-zero (bukan tepat 2) dan tidak mencakup konfigurasi parsial atau galat jaringan di `--answers`. | Kecil. |
| F10 | `hasPreviewBuilds` tidak dipakai (Q9). Perbandingan komponen via Storybook baru berupa link "Open in Storybook". | Sudah ada di langkah 5. |

## 5. Batas demo yang jujur (katakan sebelum ditanya)

- Kandidat adalah salinan lokal app (`localhost:5003`), bukan preview deployment sungguhan. `localhost` hanya jalan di mesin presenter (share screen).
- Kandidat memakai Select yang sama; yang berbeda hanya halamannya, yang tidak mengirim `searchable`. Ini bukan Select baru berbasis Figma.
- swt belum punya before/after halaman; di sana hanya halaman saat ini dan perbandingan komponen lewat Storybook.
- Service berjalan di Vercel + Atlas; pindah ke VPS menunggu approval.
- Setelah review applied, sync berikutnya membuka review baru (F2).
