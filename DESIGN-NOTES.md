# kasbondulu.com

## Preview desain

- `/login`: login dan signup email + password melalui Supabase Auth.
- `/preview`: dashboard dengan data contoh, tidak mengakses database. Perubahan hanya di memori dan hilang setelah reload.
- `/`: dashboard pribadi, hanya setelah login. Membaca dan mengubah data lewat `/api/debts`.

Jalankan `npm run dev` dan buka http://localhost:3000/login atau http://localhost:3000/preview.

Summary menghitung catatan belum lunas, terlepas dari filter daftar. Tanggal relatif memakai `created_at`. Field Tanggal pada form disimpan sebagai `due_date`, sesuai schema yang diminta. Warna hijau menunjukkan piutang dan net positif; oranye menunjukkan utang; merah menunjukkan net negatif.

## Database dan verifikasi yang masih diperlukan

SQL tersedia di `migrations/001_debts.sql`, belum diterapkan ke project Supabase. Jalankan sekali pada database yang belum memiliki tabel tersebut. Client menggunakan publishable key, tanpa service role.

Setelah migrasi, lakukan pengujian berikut pada dua akun uji A dan B:

1. Akun A membuat catatan. GET API aplikasi A harus menampilkan catatan tersebut.
2. Supabase REST `GET /rest/v1/debts?id=eq.ID_CATATAN_A` dengan publishable key saja harus ditolak; tidak boleh mengembalikan data.
3. Request yang sama dengan publishable key dan `Authorization: Bearer TOKEN_B` harus mengembalikan array kosong.
4. REST PATCH dan DELETE dengan token B terhadap ID A harus mengubah nol baris. Verifikasi dari akun A bahwa catatan tetap utuh.
5. REST INSERT dengan token B dan `user_id` A harus ditolak RLS.
6. REST PATCH dengan token A untuk mengubah `user_id` menjadi B harus ditolak oleh WITH CHECK.
7. CRUD milik masing-masing akun harus berhasil; tanpa login, semua API aplikasi harus mengembalikan 401.

Jangan memakai secret/service-role key untuk test ini karena key tersebut memang melewati RLS. Pengujian lintas akun belum dijalankan pada database live.

Nama kasbondulu.com sudah digunakan pada identitas aplikasi. Domain belum dibeli, dikonfigurasi, atau dipublikasikan.
