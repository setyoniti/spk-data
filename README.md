# Production Data Finder
**Production Record & SPK Search System** — aplikasi web internal untuk mencatat data produksi dan mencari kembali berdasarkan nomor SPK. Database: **Google Spreadsheet**. Hosting: **Vercel**. Tanpa login.

## Fitur
- **Home**: dua menu besar — INPUT DATA dan SEARCH DATA.
- **Input Data**: 10 field (Tanggal, Shift, SPK, QC, Operator, QYT, Type, Event, Mesin, Color), validasi, loading, anti double-submit, konfirmasi reset.
- **Export Excel (di menu Input)**: mengunduh **seluruh data** dalam satu file `.xlsx` berisi:
  - sheet **Rekap Bulanan** (jumlah record, jumlah SPK, total QYT per bulan),
  - sheet **Semua Data** dengan **kolom Bulan**,
  - **satu sheet per bulan** (mis. `Okt 2026`, `Nov 2026`).
- **Search Data**: exact match SPK (string, leading zero aman), Enter/Search, ringkasan (total record, total QYT, jumlah shift), tabel, **Export CSV** (UTF-8 BOM, aman formula injection).
- Data tersentral di Google Sheets; komputer lain langsung bisa mencari setelah data tersimpan (tanpa cache).

Urutan hasil pencarian: **terbaru di atas** (berdasarkan timestamp; jika sama, baris yang lebih bawah di sheet dianggap lebih baru). Pencarian SPK tidak peka huruf besar/kecil, tetapi `00123456` ≠ `123456` dan `123456` ≠ `1234567`.

## Teknologi
React + Vite + Tailwind CSS 3 + Lucide React · Vercel Serverless Functions · Google Sheets API (Service Account) · SheetJS (`xlsx`) untuk Excel.

## Struktur
```
api/            records.js (POST simpan) · search.js (GET cari) · export.js (GET semua data) · health.js
api/_lib/       sheets.js (integrasi Google Sheets) · validate.js · http.js
src/            pages/ components/ services/api.js utils/ config.js
tests/          pengujian otomatis (npm test)
vercel.json     rewrite SPA (/input & /search tidak 404) + no-store untuk /api
```

## Setup Google (sekali saja)
1. Buka https://console.cloud.google.com → **New Project**.
2. **APIs & Services → Library** → aktifkan **Google Sheets API**.
3. **IAM & Admin → Service Accounts → Create** (nama bebas). Tidak perlu role khusus.
4. Buka service account → **Keys → Add key → Create new key → JSON**. Simpan file JSON (jangan di-commit!).
5. Buat Google Spreadsheet baru. Salin **ID** dari URL: `https://docs.google.com/spreadsheets/d/<ID>/edit`.
6. Klik **Share** → masukkan email service account (`client_email` di JSON) sebagai **Editor**.
7. Sheet `DATABASE` **dibuat otomatis** saat data pertama disimpan/dicari (lengkap dengan header, warna, freeze, filter, kolom SPK/ID/Tanggal format teks). Jika sudah ada dan headernya kosong, header diisi. Data yang ada tidak pernah dihapus/ditimpa.

Kolom: A ID · B Timestamp (WIB) · C Tanggal (YYYY-MM-DD) · D Shift · E SPK · F QC · G Operator · H QYT · I Type · J Event · K Mesin · L Color.

## Environment Variables
| Nama | Isi |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` dari JSON |
| `GOOGLE_PRIVATE_KEY` | `private_key` dari JSON (boleh dengan `\n` ter-escape) |
| `GOOGLE_SHEET_ID` | ID spreadsheet |
| `GOOGLE_SHEET_NAME` | `DATABASE` (default) |

Jangan memakai prefix `VITE_`. Lihat `.env.example`.

## Development lokal
```bash
npm install
cp .env.example .env.local     # isi nilai asli
npm i -g vercel
vercel dev                     # frontend + API di http://localhost:3000
npm test                       # tes otomatis (tanpa Google, memakai fake client)
npm run build                  # build produksi
```

## Alternatif gratis tanpa service-account key (Google Apps Script)
Aplikasi dapat memakai Google Apps Script sebagai backend, sehingga tidak perlu menyimpan private key dan tidak membutuhkan langganan Vercel Pro.

1. Buka Google Sheets yang akan dipakai, pilih **Extensions → Apps Script**.
2. Salin isi `apps-script/Code.gs` ke editor Apps Script.
3. Simpan proyek, pilih **Deploy → New deployment**.
4. Pilih tipe **Web app**.
5. Isi **Execute as: Me**, **Who has access: Anyone**, lalu deploy.
6. Salin URL deployment yang berakhiran `/exec`.
7. Tambahkan URL ke `.env.local`:
   ```text
   VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/PROJECT_ID/exec
   ```
8. Jalankan ulang `npm run dev` atau `npm run build`.

Apps Script berjalan di kuota gratis Google. Spreadsheet digunakan sebagai database dan sheet `DATABASE` dibuat otomatis. URL Web App bersifat publik, sehingga batasi URL aplikasi bila data bersifat internal.

## Deploy ke Vercel
1. Buat repository GitHub, lalu `git init && git add . && git commit -m "init" && git push`.
2. Vercel → **Add New Project** → import repo (preset **Vite** terdeteksi otomatis).
3. **Settings → Environment Variables**: isi 4 variabel di atas (Production, Preview, Development).
4. **Deploy**, lalu buka `https://<nama-project>.vercel.app/api/health` → harus `"configured": true`.
5. **Komputer 1**: buka URL → INPUT DATA → simpan. **Komputer 2**: buka URL yang sama → SEARCH DATA → cari SPK.

Setelah mengubah Environment Variables, lakukan **Redeploy**.

## Troubleshooting
| Gejala | Penyebab / solusi |
|---|---|
| "Konfigurasi server belum lengkap" | Env var belum diisi / belum redeploy. Cek `/api/health`. |
| "Data gagal disimpan" / "Pencarian gagal" | Spreadsheet belum di-share ke email service account sebagai Editor; Sheets API belum aktif; ID salah. Lihat Vercel → Logs. |
| Error `DECODER routines` / `invalid key` | Format private key salah. Salin utuh dari JSON termasuk `-----BEGIN/END PRIVATE KEY-----`. |
| `/input` 404 | Pastikan `vercel.json` ikut ter-deploy. |
| Export Excel kosong | Belum ada data di sheet. |

## Mengubah konfigurasi
- **Nama sheet**: ubah `GOOGLE_SHEET_NAME` (dan sheet akan dibuat otomatis bila belum ada).
- **Pilihan Shift**: `src/config.js` **dan** `SHIFTS` di `api/_lib/validate.js`.
- **Menambah field**: tambah kolom di `HEADERS`/`rowToRecord`/`appendRecord` (`api/_lib/sheets.js`, ubah `LAST_COL` dan range `A:L`), validasi di `api/_lib/validate.js`, form (`InputPage.jsx`), `validation.js`, tabel (`DataTable.jsx`), serta `exportCsv.js` / `exportExcel.js`.
- **Pencarian lebih cepat untuk data besar**: saat ini hanya kolom SPK (E) yang dibaca lalu baris cocok diambil. Untuk puluhan ribu baris, bisa ditambah sheet indeks.

## Keamanan (aplikasi tanpa login)
**Siapa pun yang memiliki URL dapat menginput, mencari, dan mengekspor semua data.** Bagikan URL hanya ke orang internal. Jika perlu pembatasan, aktifkan *Vercel Password Protection* / *Deployment Protection* atau tambahkan login pada tahap terpisah.
Perlindungan yang ada: credentials hanya di server; frontend tidak mengakses Sheets langsung; validasi & batas panjang di server; batas ukuran body; error internal tidak dikirim ke pengguna; data ditulis mode `RAW` (tidak ada formula injection di spreadsheet); CSV/Excel diberi apostrof pada nilai berawalan `= + - @`; React meng-escape HTML.
