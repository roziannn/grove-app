# Grove

Timer belajar ala Forest: pilih durasi, tanam pohon, dan pohon tumbuh selama kamu fokus.
Kalau menyerah atau meninggalkan app lebih dari 10 detik, pohon layu.

## Menjalankan di HP Android

1. Pasang **Expo Go** dari Play Store.
2. Di laptop:
   ```bash
   cd grove
   npm install
   npx expo start
   ```
3. Scan QR code di terminal dengan Expo Go (HP dan laptop satu Wi-Fi).
   Kalau tidak tersambung: `npx expo start --tunnel`.

Pilih **Tes 10 dtk** untuk melihat animasi pohon tumbuh dengan cepat.

## Fitur

- **Fokus**: pilih kegiatan (Belajar, Membaca, Kerja, ...) dan durasi, lalu tanam pohon.
- **Statistik**: Hari / Minggu / Bulan / Tahun dengan hutan isometrik, grafik waktu fokus, dan rincian per kegiatan.
- **Koleksi**: 1 menit fokus berhasil = 1 koin. Tukar koin dengan jenis pohon baru (Pinus, Kaktus, Sakura, Maple).
- **Streak** hari berturut-turut, tombol **Cek update**, dan menu melayang di bawah.

## Struktur

- `App.tsx` – state utama (riwayat sesi, koin) dan pergantian tab
- `src/screens/` – layar Fokus, Statistik, Koleksi
- `src/Tree.tsx` – gambar pohon (SVG) yang tumbuh sesuai progres; `src/IsoForest.tsx` – hutan isometrik
- `src/stats.ts` – hitungan periode, grafik, streak, koin
- `src/species.ts` – jenis pohon dan label kegiatan
- `src/storage.ts` – simpan riwayat sesi dan profil di HP (AsyncStorage)

## Pasang sebagai APK (tanpa Expo Go)

```bash
npm install -g eas-cli
eas login
eas init
eas build -p android --profile preview
```

Build jalan di server Expo (gratis untuk pemakaian dasar). Setelah selesai, buka link
unduhan di HP, pasang file `.apk`, dan izinkan "Install dari sumber tidak dikenal" bila diminta.

## Update tanpa pasang APK baru (EAS Update)

Perubahan JavaScript (tampilan, teks, logika timer, bentuk pohon) bisa dikirim lewat udara.
Setup sekali saja:

```bash
npx eas-cli update:configure
npx eas-cli build -p android --profile preview   # pasang APK ini satu kali
```

Setiap ada perubahan berikutnya:

```bash
git pull
npx eas-cli update --channel preview --message "deskripsi singkat"
```

Tutup lalu buka app dua kali di HP: yang pertama mengunduh, yang kedua memakai versi baru.
Perubahan yang menambah paket native atau izin tetap butuh build APK baru.
