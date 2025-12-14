# 🛍️ Digital Assets Marketplace

Platform marketplace modern untuk jual beli aset digital, template, dan tool kreatif dengan desain modern yang eye-catching. Dibangun dengan React 19, TypeScript, Vite, dan Supabase.

## ✨ Fitur

- 🎨 **Desain Modern** - UI/UX dengan tema neon dan dark mode
- 📱 **Responsive** - Optimal di semua device (mobile, tablet, desktop)
- 🚀 **Performance** - Optimized dengan Vite dan lazy loading
- 🔐 **Admin Panel** - Dashboard lengkap untuk manage konten
- 📊 **Dynamic Content** - Semua konten dikelola melalui database
- 🎯 **SEO Optimized** - Meta tags dinamis untuk SEO
- 💾 **Supabase Integration** - Database dan storage terintegrasi
- 🖼️ **Image Upload** - Upload gambar langsung ke Supabase Storage
- 🔔 **Social Proof** - Notifikasi pembelian palsu untuk meningkatkan konversi

## 🛠️ Tech Stack

- **Frontend**: React 19.2.1, TypeScript 5.8.2
- **Build Tool**: Vite 6.2.0
- **Routing**: React Router DOM 6.22.3
- **Styling**: Tailwind CSS (via CDN)
- **Animations**: Framer Motion 12.23.25
- **Icons**: Lucide React 0.556.0
- **SEO**: React Helmet Async 2.0.4
- **Backend**: Supabase (PostgreSQL + Storage)
- **Deployment**: Vercel ready

## 📋 Prerequisites

- **Node.js** 18+ (disarankan 20+)
- **npm** atau **yarn** atau **pnpm**
- **Akun Supabase** (gratis) - untuk database dan storage

## 🚀 Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd <project-folder>
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

> **Note**: Menggunakan `--legacy-peer-deps` karena `react-helmet-async` belum fully support React 19, tapi tetap berfungsi dengan baik.

### 3. Setup Environment Variables

Buat file `.env` di root project:

```bash
cp env.txt .env
```

Edit file `.env` dan isi dengan kredensial Supabase Anda:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Cara mendapatkan kredensial:**
1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda (atau buat baru)
3. Buka **Settings** → **API**
4. Copy **Project URL** → paste ke `VITE_SUPABASE_URL`
5. Copy **anon public** key → paste ke `VITE_SUPABASE_ANON_KEY`

### 4. Setup Database

1. Buka Supabase Dashboard → **SQL Editor**
2. Copy semua isi dari file `db.txt`
3. Paste dan jalankan (klik **Run**)
4. Pastikan semua tabel berhasil dibuat:
   - `site_config` - Konfigurasi website
   - `products` - Data produk
   - `freebies` - Data freebies
   - `social_links` - Link media sosial

### 5. Setup Storage

Storage bucket `images` akan otomatis dibuat saat menjalankan SQL dari `db.txt`. Jika belum ada:

1. Buka Supabase Dashboard → **Storage**
2. Buat bucket baru dengan nama `images`
3. Set bucket sebagai **Public**
4. Pastikan policies sudah diaktifkan (sudah ada di `db.txt`)

## 🏃 Running the App

### Development Mode

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

### Build for Production

```bash
npm run build
```

Output akan ada di folder `dist/`

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
<project-folder>/
├── components/          # React components
│   ├── Footer.tsx
│   ├── Freebies.tsx
│   ├── Hero.tsx
│   ├── Navbar.tsx
│   ├── Products.tsx
│   ├── PurchaseNotification.tsx
│   ├── SEO.tsx
│   └── WhatsAppChannel.tsx
├── pages/               # Page components
│   ├── Admin.tsx        # Admin dashboard
│   └── ProductDetail.tsx
├── services/            # API services
│   ├── dataService.ts   # Database operations
│   └── supabase.ts      # Supabase client
├── types.ts             # TypeScript types
├── App.tsx              # Main app component
├── index.tsx            # Entry point
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── vercel.json          # Vercel deployment config
├── db.txt               # Database schema & seed data
└── package.json         # Dependencies
```

## 🔐 Admin Panel

Akses admin panel di: `http://localhost:3000/#/adminhodewa`

**Default Password**: `Hudzganteng`

> ⚠️ **Penting**: Ganti password di production! Edit di `pages/Admin.tsx` line 49.

### Fitur Admin Panel:

- ✅ **Manage Products** - CRUD produk lengkap
- ✅ **Manage Freebies** - CRUD freebies
- ✅ **Site Configuration** - Semua pengaturan website
- ✅ **SEO Settings** - Meta tags, OG image, verification codes
- ✅ **Social Links** - Manage link media sosial di footer
- ✅ **Image Upload** - Upload gambar ke Supabase Storage

## 🌐 Deployment

### Deploy ke Vercel

1. **Push ke GitHub/GitLab**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect ke Vercel**
   - Buka [Vercel Dashboard](https://vercel.com)
   - Klik **Add New Project**
   - Import repository Anda
   - Vercel akan auto-detect Vite

3. **Set Environment Variables**
   - Di Vercel project settings → **Environment Variables**
   - Tambahkan:
     - `VITE_SUPABASE_URL` = URL Supabase Anda
     - `VITE_SUPABASE_ANON_KEY` = Anon key Supabase Anda

4. **Deploy**
   - Klik **Deploy**
   - Tunggu hingga selesai
   - Website Anda sudah live! 🎉

### Konfigurasi Vercel

File `vercel.json` sudah dikonfigurasi untuk:
- ✅ SPA routing (semua route → `index.html`)
- ✅ Security headers
- ✅ Optimized untuk React Router

## 📊 Database Schema

### Tabel `site_config`
Key-value store untuk semua konfigurasi website (35+ settings)

### Tabel `products`
- `id`, `title`, `description`, `content`
- `price`, `original_price` (untuk diskon)
- `image_url`, `link`, `button_text`
- `created_at`

### Tabel `freebies`
- `id`, `title`, `description`
- `image_url`, `link`, `button_text`
- `created_at`

### Tabel `social_links`
- `id`, `label`, `url`
- `created_at`

## 🎨 Customization

Semua konten website dapat dikustomisasi melalui Admin Panel atau langsung di database:

- **Brand Name** - Nama brand di navbar
- **Hero Section** - Judul, subtitle, tombol, gambar
- **Products Section** - Judul dan subtitle section
- **Freebies Section** - Badge, judul, subtitle
- **WhatsApp Section** - Judul, deskripsi, link, tombol
- **Footer** - Teks hak cipta
- **SEO** - Meta tags, OG image, verification codes
- **Social Proof** - Notifikasi pembelian palsu

## 🐛 Troubleshooting

### Error: "Supabase not configured"
- Pastikan file `.env` sudah dibuat
- Pastikan environment variables sudah diisi dengan benar
- Restart development server setelah edit `.env`

### Error: "Failed to fetch"
- Cek koneksi internet
- Pastikan Supabase URL dan Key sudah benar
- Pastikan RLS policies sudah diaktifkan di Supabase

### Error: "Bucket 'images' not found"
- Pastikan bucket `images` sudah dibuat di Supabase Storage
- Pastikan bucket set sebagai **Public**
- Pastikan storage policies sudah diaktifkan

### Port sudah digunakan
- Vite akan otomatis menggunakan port lain
- Atau ubah port di `vite.config.ts`

### Dependencies error
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## 📝 Notes

- Semua konten website **100% dinamis** dari database
- Tidak ada hardcoded text untuk konten
- Image upload langsung ke Supabase Storage
- SEO optimized dengan dynamic meta tags
- Admin panel password disimpan di localStorage (ganti untuk production!)

## 📄 License

Private project - All rights reserved

## 👨‍💻 Author

Built with ❤️ using React, TypeScript, and Supabase

---

**Happy Coding! 🚀**
