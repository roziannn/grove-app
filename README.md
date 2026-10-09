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

- **Fokus**: pilih kegiatan lewat daftar berikon (Belajar ngoding, Kerja, Proyek, Membaca, Lainnya), geser penggaris untuk memilih durasi (5-120 menit, atau tes 10 detik), lalu tanam pohon.
- **Statistik**: Hari / Minggu / Bulan / Tahun dengan hutan isometrik, grafik waktu fokus, rincian per kegiatan, diagram donat distribusi kegiatan, dan 3 pohon favorit.
- **Koleksi**: Mulai dengan 500 koin (`START_COINS` di `src/stats.ts`); 1 menit fokus berhasil = 1 koin. Tukar koin dengan 16 jenis pohon dan tanaman (Pinus, Kaktus, Sakura, Teratai, Jacaranda, Bunga Harapan, dll.).
- **Musim tanah hutan**: ☀️ Panas, 🌸 Semi, 🍂 Gugur, ❄️ Dingin (pilih di tab Statistik; ikut mengubah latar di layar Fokus).
- Cincin progres di sekeliling lingkaran pohon saat timer berjalan (mulai dari dasar, searah jarum jam).
- Tanaman bercahaya lembut (soft glow) yang ikut tumbuh bersama progres, dengan kilau kecil saat dewasa.
- **Hadiah harian**: tombol 🎁 di layar Fokus. Klaim tiap hari: 10, 20, 30 ... 70 koin (hari 1-7). Lewat sehari atau selesai hari ke-7, kembali ke hari 1.
- **Prestasi**: 30 pencapaian (menanam, waktu fokus, konsisten, kebiasaan, kegiatan, koleksi, spesial) dengan ikon beranimasi, bar progres, dan banner saat terbuka. Sesi "Tes 10 dtk" tidak dihitung.
- **Streak** hari berturut-turut, tombol **Cek update**, dan menu melayang di bawah.

## Struktur

- `App.tsx` – state utama (riwayat sesi, koin) dan pergantian tab
- `src/screens/` – layar Fokus, Statistik, Koleksi
- `src/Tree.tsx` – gambar pohon (SVG) yang tumbuh sesuai progres; `src/IsoForest.tsx` – hutan isometrik
- `src/TagDonut.tsx` – diagram donat distribusi kegiatan
- `src/achievements.ts` – daftar 30 prestasi dan perhitungan statistiknya; `src/AchievementBadge.tsx`, `src/AchievementToast.tsx` – ikon dan banner
- `src/stats.ts` – hitungan periode, grafik, streak, koin
- `src/species.ts` – jenis pohon dan label kegiatan; `src/seasons.ts` – tema musim
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

## Ikon aplikasi (pohon 3D dari three.js)

Ikon di `assets/` dibuat dari model pohon 3D yang dirender dengan three.js. Untuk membuatnya ulang:

```bash
cd tools/icon
npm install
npx playwright install chromium   # sekali saja, kalau belum punya Chromium
npm run generate
```

Skrip ini menulis ulang `icon.png`, `android-icon-*.png`, `splash-icon.png`, dan `favicon.png`. Bentuk pohon, warna, dan latar ada di `tools/icon/scene.html`.

Ikon launcher tertanam di APK, jadi perubahan ikon baru terlihat setelah build APK baru
(`npx eas-cli build -p android --profile preview`), bukan lewat `eas update`.

## Performa dan ukuran

- Layar selain Fokus baru dipasang saat pertama dibuka, dan animasi ikon prestasi berhenti saat layarnya tidak terlihat.
- Timer sesi panjang (> 10 menit) memperbarui tampilan sekali per detik; sesi pendek 4x per detik agar cincin progres mulus.
- Build Android: hanya arm64, R8 minify, shrink resources, dan pustaka native dikompres (`app.json`, plugin `expo-build-properties`).
- Untuk Play Store, pakai profil `production` (.aab): unduhan pengguna biasanya lebih kecil daripada APK.
