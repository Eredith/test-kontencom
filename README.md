# Kasbondulu

Kasbondulu adalah aplikasi untuk mencatat utang dan piutang pribadi. Pengguna dapat mencatat siapa yang berutang kepadanya, kepada siapa ia berutang, jumlahnya, tanggal jatuh tempo, dan status pelunasannya. Setiap akun hanya dapat mengakses catatannya sendiri.

Project ini dibuat dengan Next.js 16 (App Router), React 19, TypeScript, dan Supabase untuk autentikasi serta database PostgreSQL.

## Fitur

- Daftar akun dan masuk menggunakan email serta kata sandi melalui Supabase Auth.
- Membuat, melihat, mengubah, menghapus, dan menandai lunas catatan utang atau piutang.
- Melihat total piutang, total utang, dan saldo bersih dari seluruh catatan yang belum lunas.
- Mencari catatan berdasarkan nama, memfilter berdasarkan status atau jenis, dan mengurutkan berdasarkan tanggal atau jumlah.
- Mengelompokkan catatan berdasarkan nama pihak terkait.
- Keluar dari akun melalui dashboard.

Filter dan pencarian hanya mengubah daftar yang tampil. Angka ringkasan tetap dihitung dari seluruh catatan yang belum lunas agar tetap menunjukkan posisi utang dan piutang secara keseluruhan.

Tanggal yang diisi pada formulir disimpan sebagai `due_date`. Pengelompokan nama dipakai untuk tampilan, bukan untuk memverifikasi bahwa dua nama merujuk pada orang yang sama.

## Teknologi

- Next.js 16 dan React 19
- TypeScript
- Supabase Auth
- Supabase PostgreSQL dengan Row Level Security (RLS)
- Tailwind CSS
- Base UI

## Menjalankan secara lokal

Siapkan Node.js yang kompatibel dengan Next.js 16, npm, dan sebuah project Supabase.

1. Instal dependensi:

   ```
   npm ci
   ```

2. Buat file `.env.local` di root project:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
   ```

   Ambil URL dan publishable key dari dashboard project Supabase. Variabel dengan awalan `NEXT_PUBLIC_` tersedia di browser, sehingga jangan pernah mengisinya dengan secret key atau `service_role` key.

3. Untuk database baru, jalankan SQL berikut secara berurutan melalui SQL Editor Supabase:
   - `migrations/001_debts.sql` untuk membuat tipe, tabel, constraint, trigger, dan policy awal.
   - `migrations/002_harden_debts_rls.sql` untuk memperkuat policy kepemilikan data.

   Migrasi kedua menghapus seluruh policy lama pada tabel `public.debts` sebelum membuat policy baru. Jika tabel tersebut sudah dipakai aplikasi lain, periksa dampaknya terlebih dahulu. Jangan jalankan migrasi pertama lagi pada database yang tabelnya sudah ada tanpa memeriksa skema saat ini.

4. Jalankan aplikasi:

   ```
   npm run dev
   ```

5. Buka `http://localhost:3000/login`, lalu buat akun atau masuk. Dashboard tersedia di `/` setelah pengguna terautentikasi.

Perintah lain:

```
npm run lint
npm run build
npm run start
```

## Alur autentikasi

Pendaftaran, login, logout, dan session dikelola oleh Supabase Auth. Aplikasi menggunakan `@supabase/ssr` agar session pengguna dapat dibaca melalui cookie di browser dan server. `proxy.ts` membantu memperbarui session pada route yang sesuai.

Halaman dashboard (`/`) memeriksa pengguna dengan `supabase.auth.getUser()` di server. Jika tidak ada pengguna yang valid, pengunjung diarahkan ke `/login`.

Setiap handler `/api/debts` juga memanggil `supabase.auth.getUser()`. Request tanpa session yang valid mendapat respons `401 Unauthorized`.

Jika konfirmasi email diaktifkan pada project Supabase, pengguna perlu mengonfirmasi alamat emailnya sebelum dapat masuk.

## API catatan

Seluruh endpoint di bawah memerlukan session login yang valid. Respons sukses berbentuk `{ "data": ... }`, sedangkan respons gagal berbentuk `{ "error": "..." }`.

| Method   | Endpoint         | Fungsi                                               |
| -------- | ---------------- | ---------------------------------------------------- |
| `GET`    | `/api/debts`     | Mengambil catatan milik pengguna, terbaru lebih dulu |
| `POST`   | `/api/debts`     | Membuat catatan baru                                 |
| `PATCH`  | `/api/debts/:id` | Mengubah catatan atau status pelunasannya            |
| `DELETE` | `/api/debts/:id` | Menghapus catatan                                    |

`GET /api/debts` menerima filter opsional:

- `status`: `all`, `settled`, atau `unsettled`
- `type`: `all`, `owed_to_me`, atau `i_owe`

Contoh body untuk `POST /api/debts`:

```
{
  "type": "owed_to_me",
  "counterpart_name": "Budi",
  "amount": 150000,
  "note": "Pinjaman makan siang",
  "due_date": "2026-10-20"
}
```

`owed_to_me` berarti orang lain berutang kepada pengguna. `i_owe` berarti pengguna berutang kepada orang lain. `amount` harus berupa bilangan Rupiah utuh, lebih dari nol, dan maksimal 1 triliun. `note` dan `due_date` boleh bernilai `null`; tanggal menggunakan format `YYYY-MM-DD`.

`PATCH` menerima sebagian dari field `type`, `counterpart_name`, `amount`, `note`, `due_date`, dan `settled`. Contoh untuk menandai catatan lunas:

```
{
  "settled": true
}
```

Mengirim `{ "settled": false }` mengembalikan statusnya menjadi belum lunas.

Status respons yang umum:

- `400`: input, ID, atau filter tidak valid.
- `401`: session tidak ada atau tidak valid.
- `403`: akses ditolak oleh database.
- `404`: catatan tidak ditemukan dalam cakupan pengguna.
- `503`: tabel belum tersedia atau koneksi bermasalah.

## Keamanan Auth, API, dan database

Keamanan data diterapkan pada beberapa bagian:

1. **Pemeriksaan session di server.** Dashboard dan seluruh endpoint catatan memverifikasi pengguna melalui Supabase Auth.
2. **Pembatasan kepemilikan di API.** Saat membuat catatan, `user_id` diambil dari pengguna yang terautentikasi, bukan dari body request. Query untuk membaca, mengubah, dan menghapus catatan juga dibatasi dengan `user_id` pengguna tersebut.
3. **Row Level Security di database.** RLS diaktifkan dan dipaksa pada `public.debts`. Policy untuk `SELECT`, `INSERT`, `UPDATE`, dan `DELETE` membatasi akses berdasarkan `auth.uid() = user_id`. Policy `INSERT` dan `UPDATE` juga memeriksa nilai baru agar kepemilikan catatan tidak dapat dipindahkan ke akun lain.
4. **Pembatasan role database.** Akses tabel untuk role `anon` dicabut. API memakai publishable key bersama session pengguna, bukan `service_role` key.
5. **Validasi input.** API memeriksa jenis catatan, panjang nama dan catatan, jumlah uang, tanggal, field yang boleh diubah, serta format UUID. Database juga memiliki constraint untuk beberapa aturan tersebut.
6. **Respons pribadi.** Respons API memakai `Cache-Control: private, no-store`.

Form login cadangan tanpa JavaScript di `/auth/submit` memeriksa header `Origin` sebelum memproses kredensial. Pemeriksaan ini khusus untuk route form tersebut; project ini tidak mengklaim semua endpoint memiliki pemeriksaan CSRF tersendiri.

**Batasan saat ini:** route Next.js `/api/debts` membaca session dari cookie. Route tersebut belum memproses header `Authorization: Bearer <token>` secara langsung. Publishable key Supabase saja tidak mengautentikasi pengguna. Jangan membagikan cookie session, access token, atau refresh token.

Pengaturan seperti konfirmasi email, masa berlaku token, dan rate limit mengikuti konfigurasi project Supabase.

## Menguji API melalui Postman

Karena API aplikasi memakai cookie session, lakukan langkah berikut:

1. Masuk ke aplikasi melalui browser pada host yang sama dengan request Postman, misalnya `localhost`.
2. Buka Developer Tools browser dan temukan cookie session untuk `http://localhost:3000`.
3. Salin **nama dan nilai** cookie tersebut ke Postman. Format header yang benar adalah `Cookie: nama=value`, bukan hanya `value`.
4. Jika session menggunakan beberapa cookie bernomor seperti `.0` dan `.1`, sertakan semuanya, dipisahkan dengan `; `.
5. Kirim `GET http://localhost:3000/api/debts`.

Jangan menyimpan cookie session di collection Postman yang akan dibagikan atau dipublikasikan. Cookie dapat berubah ketika session diperbarui, sehingga salin ulang jika request yang sebelumnya berhasil kemudian mendapat `401`.

## Struktur project

| Lokasi                                       | Peran                                      |
| -------------------------------------------- | ------------------------------------------ |
| `app/page.tsx`                               | Halaman dashboard yang memerlukan login    |
| `app/login/page.tsx`                         | Halaman login dan pendaftaran              |
| `components/dashboard.tsx`                   | Antarmuka serta interaksi catatan          |
| `components/login.tsx`                       | Form login dan pendaftaran                 |
| `app/api/debts/`                             | Handler API JSON untuk CRUD catatan        |
| `lib/debt-api.ts`                            | Pemeriksaan session dan format respons API |
| `lib/debts.ts`                               | Tipe data dan validasi catatan             |
| `lib/client.ts`, `lib/server.ts`, `proxy.ts` | Supabase client dan pembaruan session      |
| `migrations/`                                | Skema database dan policy RLS              |

## Verifikasi

Jalankan `npm run lint` dan `npm run build` untuk memeriksa kode. Test pengelompokan nama tersedia di `tests/debt-groups.test.mjs`.

Untuk menguji isolasi data, gunakan dua akun:

1. Buat catatan dengan akun A dan pastikan catatan muncul untuk akun A.
2. Pastikan akun B tidak dapat membaca, mengubah, atau menghapus catatan akun A.
3. Pastikan kedua akun tetap dapat menjalankan CRUD pada catatan miliknya sendiri.
4. Pastikan request tanpa login ke API aplikasi mendapat `401`.

Test pengelompokan nama tidak menggantikan pengujian Auth dan RLS pada database. Migrasi perlu benar-benar dijalankan pada project Supabase yang digunakan. Pengujian lintas akun terhadap database live belum didokumentasikan sebagai selesai di repo ini.
