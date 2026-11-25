# RepoHub 2.2 (Next.js, serverless, Vercel)

Dashboard GitHub bergaya GitHub + upload folder/ZIP + kontrol Vercel. Full-stack di Next.js 15 (App Router), tanpa database, siap deploy ke Vercel.

## Deploy
1. Push folder ini ke GitHub, lalu import di Vercel.
2. Tambahkan Environment Variable `SESSION_SECRET` (min 32 karakter, `openssl rand -base64 48`).
3. Deploy. Login dengan GitHub Personal Access Token (link pembuatan token ada di halaman login).

Lokal: `cp .env.example .env.local`, isi `SESSION_SECRET`, lalu `npm install && npm run dev`.

## Keamanan
- Token GitHub/Vercel dienkripsi AES-256-GCM, disimpan di cookie `httpOnly; Secure; SameSite=Lax` (prefix `__Host-` di production). JavaScript browser tidak pernah melihat token.
- Semua panggilan API lewat proxy server dengan allowlist endpoint, validasi path, batas body, dan proteksi CSRF (cek Origin + header `x-requested-with`).
- Markdown disanitasi (`rehype-sanitize`); file SVG/PDF dari repo disajikan dengan CSP `sandbox`.
- Header keamanan: CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy. Rate limit login bersifat best-effort per instance.

## Fitur
Beranda + feed, profil/daftar repo (filter, sort), buat repo, file browser (commit terakhir lazy per file), viewer kode + syntax highlight + README, edit/buat/hapus/rename file, upload folder/ZIP satu commit atomik (deteksi file baru/berubah/sama via git SHA), commits + diff, branches, releases, issues, pull request (merge, compare, files), Actions (rerun/cancel), Insights, pengaturan repo (umum, kolaborator, webhook, transfer, hapus), notifikasi, pencarian, gists, SSH keys, Vercel (import repo, redeploy, hapus), tema gelap/terang.

## Pintasan keyboard
`Ctrl/Cmd + K` palet perintah (repo + navigasi + ganti tema), `/` fokus pencarian, `t` cari file di repo (fuzzy), `Shift + klik` nomor baris untuk rentang `#L10-L20`.

## Fitur v2.1
Profil ala GitHub (README profil, pinned, grafik kontribusi, ikuti, organisasi), blame, permalink + salin file, riwayat per file, unduh ZIP repo (streaming), pantau repo, daftar stargazers/forks, pencarian kode dalam satu repo, labels dan milestones, alert markdown (`> [!NOTE]`) dan highlight kode di README.

## Perubahan v2.2 (tampilan dan konsistensi)
Semua ikon kini lucide-react (logo, panah pager/compare/diff, bintang/fork di profil, ikon per jenis aktivitas dan notifikasi, ikon di tombol, tab, menu, dan judul halaman). Tidak ada emoji atau glyph. Tampilan diperhalus: header translucent, kartu dan tombol lebih lembut, ring fokus teal, empty state berikon, halaman login baru. Komponen bersama baru: `PageTitle`, `SectionTitle`, `StateTabs`, `SearchField`, `BtnIcon`. Tema memakai satu helper (`lib/theme.js`). Perbaikan: tombol ikon-saja punya nama aksesibel, matcher middleware tidak lagi melewatkan user GitHub berawalan `login`, tombol "Buat baru" di header tidak lagi meluber.

## Aturan UI (diverifikasi otomatis: `npm run check:ui`)
- Ikon hanya dari `lucide-react`. Dilarang emoji, glyph panah/bintang (misalnya tanda panah atau bintang Unicode), `<svg>` inline (kecuali `components/Heatmap.jsx` untuk grafik data), dan pustaka ikon lain.
- Ukuran ikon: 14 di dalam tombol, 16 di menu, tab, baris, dan kv, 20 hingga 24 untuk judul, 32 untuk empty state. CSS menyeragamkan ketebalan garis.
- Tombol aksi memakai `BtnIcon` (spinner saat sibuk). Tombol ikon-saja wajib punya `title` atau `aria-label`.
- Teks UI berbahasa Indonesia memakai "kamu". Istilah GitHub tetap: Repository, Issue, Pull request, Commit, Branch, Tag, Fork, Gist, Actions, Webhook, Private, Public, Draft, Merged. Judul halaman memakai bentuk tunggal.
- Warna dan jarak lewat token CSS di `app/globals.css`, jangan menulis warna heksadesimal di komponen.

## Batasan yang perlu diketahui
- Upload per file maks ~3MB (batas body serverless Vercel 4.5MB). File besar: pakai git CLI / LFS.
- Belum ada: GitHub OAuth, wiki, projects, review inline di PR, deploy langsung dari file (hanya via repo yang terhubung).
