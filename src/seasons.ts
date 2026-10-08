export type Decor = 'tufts' | 'flowers' | 'leaves' | 'snow';

export type Season = {
  id: string;
  name: string;
  icon: string;
  top: string; // warna permukaan tanah
  topAlt: string; // warna petak selang-seling
  lip: string; // warna tepi atas sisi tanah (rumput/salju)
  lipH: number; // tebal tepi
  sideL: string; // sisi kiri tanah
  sideR: string; // sisi kanan tanah
  mound: string; // gundukan di bawah pohon besar (layar Fokus)
  stageBg: string; // latar lingkaran di layar Fokus
  decor: Decor;
  decorColors: string[];
};

export const SEASONS: Season[] = [
  {
    id: 'summer', name: 'Panas', icon: '☀️',
    top: '#8bc34a', topAlt: '#9ccc65', lip: '#689f38', lipH: 4,
    sideL: '#6d4c2f', sideR: '#5a3d25', mound: '#8a6a3f', stageBg: '#f1f8e9',
    decor: 'tufts', decorColors: ['#689f38'],
  },
  {
    id: 'spring', name: 'Semi', icon: '🌸',
    top: '#a5d66a', topAlt: '#b6e07e', lip: '#7cb342', lipH: 4,
    sideL: '#6d4c2f', sideR: '#5a3d25', mound: '#a5d66a', stageBg: '#fdf2f8',
    decor: 'flowers', decorColors: ['#f48fb1', '#ffffff', '#ffd54f', '#ce93d8'],
  },
  {
    id: 'autumn', name: 'Gugur', icon: '🍂',
    top: '#f0d9a8', topAlt: '#e8cc94', lip: '#2e7d32', lipH: 5,
    sideL: '#7a5232', sideR: '#63411f', mound: '#e8cc94', stageBg: '#fff3e0',
    decor: 'leaves', decorColors: ['#e65100', '#fb8c00', '#ffb74d', '#8d6e63'],
  },
  {
    id: 'winter', name: 'Dingin', icon: '❄️',
    top: '#f4f8fb', topAlt: '#e3edf5', lip: '#ffffff', lipH: 7,
    sideL: '#8d6e63', sideR: '#6d4c41', mound: '#f4f8fb', stageBg: '#e8f1f8',
    decor: 'snow', decorColors: ['#b9d6ec', '#9ec5e3'],
  },
];

export const DEFAULT_SEASON = SEASONS[0];

export const getSeason = (id?: string): Season =>
  SEASONS.find((s) => s.id === id) ?? DEFAULT_SEASON;
