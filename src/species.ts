export type Species = {
  id: string;
  name: string;
  price: number; // dalam koin; 0 = gratis
  kind: 'round' | 'cone' | 'cactus';
  dark: string;
  mid: string;
  light: string;
  trunk: string;
};

export const SPECIES: Species[] = [
  { id: 'oak', name: 'Pohon Hijau', price: 0, kind: 'round', dark: '#2e7d32', mid: '#43a047', light: '#66bb6a', trunk: '#8b5a2b' },
  { id: 'pine', name: 'Pinus', price: 30, kind: 'cone', dark: '#1b5e20', mid: '#2e7d32', light: '#43a047', trunk: '#6d4c41' },
  { id: 'cactus', name: 'Kaktus', price: 40, kind: 'cactus', dark: '#2e7d32', mid: '#558b2f', light: '#7cb342', trunk: '#558b2f' },
  { id: 'sakura', name: 'Sakura', price: 60, kind: 'round', dark: '#ec407a', mid: '#f48fb1', light: '#f8bbd0', trunk: '#6d4c41' },
  { id: 'maple', name: 'Maple', price: 80, kind: 'round', dark: '#e65100', mid: '#fb8c00', light: '#ffb74d', trunk: '#795548' },
];

export const DEFAULT_SPECIES = SPECIES[0];

export const getSpecies = (id?: string): Species =>
  SPECIES.find((s) => s.id === id) ?? DEFAULT_SPECIES;

export const TAGS = ['Belajar', 'Membaca', 'Kerja', 'Proyek', 'Lainnya'];
