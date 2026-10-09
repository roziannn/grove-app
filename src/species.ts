export type Kind = 'round' | 'cone' | 'cactus' | 'reed' | 'flower' | 'bush' | 'fern' | 'lotus';
export type Head = 'bell' | 'trumpet' | 'star' | 'glow';

export type Species = {
  id: string;
  name: string;
  price: number; // dalam koin; 0 = gratis
  kind: Kind;
  dark: string;
  mid: string;
  light: string;
  trunk: string;
  bloom?: string; // warna bunga
  center?: string; // warna inti bunga
  head?: Head; // bentuk kepala bunga (kind 'flower')
  dots?: string[]; // buah/bunga kecil di tajuk pohon (kind 'round')
  glow?: string; // warna cahaya lembut; bawaan: warna bunga/daun
};

export const SPECIES: Species[] = [
  { id: 'oak', name: 'Pohon Hijau', price: 0, kind: 'round', dark: '#2e7d32', mid: '#43a047', light: '#66bb6a', trunk: '#8b5a2b' },
  { id: 'pine', name: 'Pinus', price: 30, kind: 'cone', dark: '#1b5e20', mid: '#2e7d32', light: '#43a047', trunk: '#6d4c41' },
  { id: 'cactus', name: 'Kaktus', price: 40, kind: 'cactus', dark: '#2e7d32', mid: '#558b2f', light: '#7cb342', trunk: '#558b2f' },
  {
    id: 'reed', name: 'Buluh', price: 50, kind: 'reed',
    dark: '#9e9d24', mid: '#c0ca33', light: '#e6c34a', trunk: '#9e9d24', bloom: '#e8c547',
  },
  { id: 'sakura', name: 'Sakura', price: 60, kind: 'round', dark: '#ec407a', mid: '#f48fb1', light: '#f8bbd0', trunk: '#6d4c41' },
  {
    id: 'geranium', name: 'Geranium', price: 60, kind: 'bush',
    dark: '#2e7d32', mid: '#43a047', light: '#f8bbd0', trunk: '#2e7d32', bloom: '#f06292',
  },
  {
    id: 'balloon', name: 'Bunga Lonceng', price: 70, kind: 'flower', head: 'star',
    dark: '#2e7d32', mid: '#43a047', light: '#a5d6a7', trunk: '#2e7d32', bloom: '#7e57c2', center: '#d1c4e9',
  },
  { id: 'maple', name: 'Maple', price: 80, kind: 'round', dark: '#e65100', mid: '#fb8c00', light: '#ffb74d', trunk: '#795548' },
  {
    id: 'snowdrop', name: 'Snowdrop', price: 90, kind: 'flower', head: 'bell', glow: '#90caf9',
    dark: '#2e7d32', mid: '#66bb6a', light: '#a5d6a7', trunk: '#2e7d32', bloom: '#ffffff', center: '#aed581',
  },
  {
    id: 'narcissus', name: 'Narsis', price: 90, kind: 'flower', head: 'trumpet',
    dark: '#388e3c', mid: '#66bb6a', light: '#fff9c4', trunk: '#388e3c', bloom: '#ffd54f', center: '#ff9800',
  },
  {
    id: 'staghorn', name: 'Pakis Tanduk', price: 100, kind: 'fern',
    dark: '#2e7d32', mid: '#43a047', light: '#81c784', trunk: '#6d4c41',
  },
  {
    id: 'tangerine', name: 'Jeruk Keprok', price: 100, kind: 'round',
    dark: '#2e7d32', mid: '#43a047', light: '#66bb6a', trunk: '#6d4c41',
    dots: ['#fb8c00', '#ff9800', '#fb8c00', '#ffa726', '#fb8c00', '#ff9800', '#fb8c00'],
  },
  {
    id: 'persimmon', name: 'Kesemek', price: 120, kind: 'round',
    dark: '#558b2f', mid: '#7cb342', light: '#9ccc65', trunk: '#5d4037',
    dots: ['#ef6c00', '#e65100', '#ef6c00', '#f57c00', '#ef6c00', '#e65100', '#ef6c00'],
  },
  {
    id: 'jacaranda', name: 'Jacaranda', price: 120, kind: 'round',
    dark: '#7e57c2', mid: '#9575cd', light: '#b39ddb', trunk: '#6d4c41',
    dots: ['#ede7f6', '#d1c4e9', '#ede7f6', '#ce93d8', '#ede7f6', '#d1c4e9', '#ede7f6'],
  },
  {
    id: 'trumpet', name: 'Tabebuya', price: 120, kind: 'round',
    dark: '#f9a825', mid: '#fbc02d', light: '#fff176', trunk: '#795548',
    dots: ['#fffde7', '#fff59d', '#fffde7', '#ffe082', '#fffde7', '#fff59d', '#fffde7'],
  },
  {
    id: 'lotus', name: 'Teratai', price: 150, kind: 'lotus',
    dark: '#2e7d32', mid: '#43a047', light: '#f8bbd0', trunk: '#2e7d32', bloom: '#f48fb1', center: '#ffd54f',
  },
  {
    id: 'wishing', name: 'Bunga Harapan', price: 200, kind: 'flower', head: 'glow',
    dark: '#26a69a', mid: '#4db6ac', light: '#b2dfdb', trunk: '#26a69a', bloom: '#80deea', center: '#fff59d',
  },
];

export const DEFAULT_SPECIES = SPECIES[0];

// Warna cahaya lembut di belakang tanaman.
export const glowColor = (sp: Species): string =>
  sp.glow ?? (['round', 'cone', 'cactus'].includes(sp.kind) ? sp.light : (sp.bloom ?? sp.light));

export const getSpecies = (id?: string): Species =>
  SPECIES.find((s) => s.id === id) ?? DEFAULT_SPECIES;

// Urutan di daftar pilihan kegiatan. Kunci "Belajar" tetap dipakai agar riwayat lama tidak rusak.
export const TAGS = ['Belajar', 'Kerja', 'Proyek', 'Membaca', 'Lainnya'];

export const TAG_ICONS: Record<string, string> = {
  Belajar: '💻',
  Kerja: '💼',
  Proyek: '🛠️',
  Membaca: '📖',
  Lainnya: '✨',
};

// Nama yang ditampilkan ke pengguna (bisa beda dari kunci yang disimpan).
export const TAG_LABELS: Record<string, string> = { Belajar: 'Belajar ngoding' };
export const tagLabel = (tag: string) => TAG_LABELS[tag] ?? tag;

// Warna tetap per label supaya konsisten di semua diagram.
export const TAG_COLORS: Record<string, string> = {
  Belajar: '#43a047',
  Membaca: '#29b6f6',
  Kerja: '#ffa726',
  Proyek: '#ab47bc',
  Lainnya: '#8d6e63',
  'Tanpa label': '#b0bec5',
};

export const tagColor = (tag: string) => TAG_COLORS[tag] ?? '#90a4ae';
