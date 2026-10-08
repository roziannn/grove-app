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

## Struktur

- `App.tsx` – layar utama, logika timer, dan hutan
- `src/Tree.tsx` – gambar pohon (SVG) yang tumbuh sesuai progres
- `src/storage.ts` – simpan riwayat sesi di HP (AsyncStorage)

## Pasang sebagai APK (tanpa Expo Go)

```bash
npm install -g eas-cli
eas login
eas init
eas build -p android --profile preview
```

Build jalan di server Expo (gratis untuk pemakaian dasar). Setelah selesai, buka link
unduhan di HP, pasang file `.apk`, dan izinkan "Install dari sumber tidak dikenal" bila diminta.
