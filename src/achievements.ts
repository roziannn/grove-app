import type { Profile, Session } from './storage';
import { SPECIES, TAGS } from './species';

export type Stats = {
  trees: number; // pohon tumbuh (sesi sungguhan, bukan "Tes 10 dtk")
  minutes: number; // total menit fokus
  longest: number; // sesi tuntas terlama (menit)
  bestStreak: number; // hari berturut-turut terpanjang
  maxTreesDay: number; // pohon terbanyak dalam satu hari
  maxMinutesDay: number; // menit fokus terbanyak dalam satu hari
  early: number; // sesi yang dimulai sebelum jam 7 pagi
  night: number; // sesi yang dimulai setelah jam 10 malam
  weekend: number; // pohon di Sabtu/Minggu
  tagsUsed: number; // jumlah label kegiatan berbeda
  belajar: number; // pohon berlabel Belajar
  bought: number; // tanaman yang dibeli (selain yang gratis)
  owned: number; // jumlah jenis yang dimiliki
  wishing: number; // 1 bila punya Bunga Harapan
  comebacks: number; // pohon tumbuh tepat setelah pohon layu
  seasons: number; // jumlah musim yang pernah dicoba
};

const DAY_MS = 86_400_000;
// Nomor hari (bilangan bulat) berdasarkan tanggal lokal, aman dari pergantian jam musim.
const dayNo = (t: number) => {
  const d = new Date(t);
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
};

export function computeStats(
  sessions: Session[],
  profile: Pick<Profile, 'unlocked' | 'seasonsTried'>,
): Stats {
  // Sesi "Tes 10 dtk" (< 1 menit) tidak dihitung sebagai prestasi.
  const real = sessions.filter((s) => s.minutes >= 1);
  const ok = real.filter((s) => s.ok);

  const perDay = new Map<number, { n: number; min: number }>();
  for (const s of ok) {
    const k = dayNo(s.date);
    const cur = perDay.get(k) ?? { n: 0, min: 0 };
    perDay.set(k, { n: cur.n + 1, min: cur.min + s.minutes });
  }

  const days = [...perDay.keys()].sort((a, b) => a - b);
  let bestStreak = 0;
  let run = 0;
  days.forEach((d, i) => {
    run = i > 0 && d === days[i - 1] + 1 ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
  });

  const startHour = (s: Session) => new Date(s.date - s.minutes * 60_000).getHours();
  const chrono = [...real].sort((a, b) => a.date - b.date);
  const comebacks = chrono.filter((s, i) => s.ok && i > 0 && !chrono[i - 1].ok).length;

  return {
    trees: ok.length,
    minutes: ok.reduce((a, s) => a + s.minutes, 0),
    longest: ok.reduce((a, s) => Math.max(a, s.minutes), 0),
    bestStreak,
    maxTreesDay: Math.max(0, ...[...perDay.values()].map((v) => v.n)),
    maxMinutesDay: Math.max(0, ...[...perDay.values()].map((v) => v.min)),
    early: ok.filter((s) => startHour(s) < 7).length,
    night: ok.filter((s) => startHour(s) >= 22).length,
    weekend: ok.filter((s) => [0, 6].includes(new Date(s.date).getDay())).length,
    tagsUsed: new Set(ok.map((s) => s.tag).filter(Boolean)).size,
    belajar: ok.filter((s) => s.tag === 'Belajar').length,
    bought: Math.max(0, profile.unlocked.length - 1),
    owned: profile.unlocked.length,
    wishing: profile.unlocked.includes('wishing') ? 1 : 0,
    comebacks,
    seasons: new Set(profile.seasonsTried).size,
  };
}

export type Group =
  | 'Menanam'
  | 'Waktu Fokus'
  | 'Konsisten'
  | 'Kebiasaan'
  | 'Kegiatan'
  | 'Koleksi'
  | 'Spesial';

export type Achievement = {
  id: string;
  group: Group;
  icon: string;
  name: string;
  desc: string;
  target: number;
  value: (s: Stats) => number;
  unit?: string; // satuan untuk teks progres, mis. "mnt"
};

export const GROUP_COLORS: Record<Group, string> = {
  Menanam: '#43a047',
  'Waktu Fokus': '#29b6f6',
  Konsisten: '#ff7043',
  Kebiasaan: '#ab47bc',
  Kegiatan: '#26a69a',
  Koleksi: '#ec407a',
  Spesial: '#fbc02d',
};

export const ACHIEVEMENTS: Achievement[] = [
  // Menanam
  { id: 'trees_1', group: 'Menanam', icon: '🌱', name: 'Biji Pertama', desc: 'Tanam pohon pertamamu', target: 1, value: (s) => s.trees },
  { id: 'trees_5', group: 'Menanam', icon: '🌿', name: 'Tunas Muda', desc: 'Tanam 5 pohon', target: 5, value: (s) => s.trees },
  { id: 'trees_20', group: 'Menanam', icon: '🌳', name: 'Penanam Tekun', desc: 'Tanam 20 pohon', target: 20, value: (s) => s.trees },
  { id: 'trees_50', group: 'Menanam', icon: '🌲', name: 'Penjaga Hutan', desc: 'Tanam 50 pohon', target: 50, value: (s) => s.trees },
  { id: 'trees_100', group: 'Menanam', icon: '🏞️', name: 'Hutan Lebat', desc: 'Tanam 100 pohon', target: 100, value: (s) => s.trees },
  { id: 'trees_250', group: 'Menanam', icon: '🌍', name: 'Penghijau Bumi', desc: 'Tanam 250 pohon', target: 250, value: (s) => s.trees },

  // Waktu Fokus
  { id: 'min_60', group: 'Waktu Fokus', icon: '⏱️', name: 'Satu Jam Pertama', desc: 'Kumpulkan 1 jam fokus', target: 60, unit: 'mnt', value: (s) => s.minutes },
  { id: 'min_300', group: 'Waktu Fokus', icon: '⌛', name: 'Lima Jam Fokus', desc: 'Kumpulkan 5 jam fokus', target: 300, unit: 'mnt', value: (s) => s.minutes },
  { id: 'min_1500', group: 'Waktu Fokus', icon: '📚', name: 'Maraton Belajar', desc: 'Kumpulkan 25 jam fokus', target: 1500, unit: 'mnt', value: (s) => s.minutes },
  { id: 'min_6000', group: 'Waktu Fokus', icon: '🧠', name: 'Master Fokus', desc: 'Kumpulkan 100 jam fokus', target: 6000, unit: 'mnt', value: (s) => s.minutes },
  { id: 'long_45', group: 'Waktu Fokus', icon: '💪', name: 'Tahan Banting', desc: 'Tuntaskan satu sesi 45 menit', target: 45, unit: 'mnt', value: (s) => s.longest },
  { id: 'long_60', group: 'Waktu Fokus', icon: '🏔️', name: 'Satu Jam Penuh', desc: 'Tuntaskan satu sesi 60 menit', target: 60, unit: 'mnt', value: (s) => s.longest },

  // Konsisten
  { id: 'streak_3', group: 'Konsisten', icon: '🔥', name: 'Mulai Panas', desc: 'Fokus 3 hari berturut-turut', target: 3, unit: 'hari', value: (s) => s.bestStreak },
  { id: 'streak_7', group: 'Konsisten', icon: '☄️', name: 'Seminggu Konsisten', desc: 'Fokus 7 hari berturut-turut', target: 7, unit: 'hari', value: (s) => s.bestStreak },
  { id: 'streak_30', group: 'Konsisten', icon: '🌋', name: 'Sebulan Tanpa Putus', desc: 'Fokus 30 hari berturut-turut', target: 30, unit: 'hari', value: (s) => s.bestStreak },
  { id: 'day_3', group: 'Konsisten', icon: '🌤️', name: 'Hari Produktif', desc: 'Tanam 3 pohon dalam sehari', target: 3, value: (s) => s.maxTreesDay },
  { id: 'day_6', group: 'Konsisten', icon: '🚀', name: 'Hari Super', desc: 'Tanam 6 pohon dalam sehari', target: 6, value: (s) => s.maxTreesDay },
  { id: 'day_240', group: 'Konsisten', icon: '⚡', name: 'Empat Jam Sehari', desc: 'Fokus 4 jam dalam satu hari', target: 240, unit: 'mnt', value: (s) => s.maxMinutesDay },

  // Kebiasaan
  { id: 'early', group: 'Kebiasaan', icon: '🐦', name: 'Burung Pagi', desc: 'Mulai fokus sebelum jam 7 pagi', target: 1, value: (s) => s.early },
  { id: 'night', group: 'Kebiasaan', icon: '🦉', name: 'Burung Hantu', desc: 'Mulai fokus setelah jam 10 malam', target: 1, value: (s) => s.night },
  { id: 'weekend', group: 'Kebiasaan', icon: '🎒', name: 'Pejuang Akhir Pekan', desc: 'Tanam 5 pohon di Sabtu atau Minggu', target: 5, value: (s) => s.weekend },

  // Kegiatan
  { id: 'tags_3', group: 'Kegiatan', icon: '🏷️', name: 'Serba Bisa', desc: 'Pakai 3 label kegiatan berbeda', target: 3, value: (s) => s.tagsUsed },
  { id: 'belajar_10', group: 'Kegiatan', icon: '📖', name: 'Rajin Belajar', desc: 'Tanam 10 pohon berlabel Belajar ngoding', target: 10, value: (s) => s.belajar },
  { id: 'tags_all', group: 'Kegiatan', icon: '🎯', name: 'Semua Kegiatan', desc: 'Pakai semua label kegiatan', target: TAGS.length, value: (s) => s.tagsUsed },

  // Koleksi
  { id: 'buy_1', group: 'Koleksi', icon: '🛍️', name: 'Pembeli Pertama', desc: 'Beli satu tanaman baru', target: 1, value: (s) => s.bought },
  { id: 'own_5', group: 'Koleksi', icon: '🧺', name: 'Kolektor Kecil', desc: 'Miliki 5 jenis tanaman', target: 5, value: (s) => s.owned },
  { id: 'own_all', group: 'Koleksi', icon: '👑', name: 'Kolektor Sejati', desc: 'Miliki semua jenis tanaman', target: SPECIES.length, value: (s) => s.owned },
  { id: 'wishing', group: 'Koleksi', icon: '✨', name: 'Penjaga Harapan', desc: 'Miliki Bunga Harapan', target: 1, value: (s) => s.wishing },

  // Spesial
  { id: 'comeback', group: 'Spesial', icon: '💚', name: 'Bangkit Lagi', desc: 'Tanam pohon yang tumbuh tepat setelah pohon layu', target: 1, value: (s) => s.comebacks },
  { id: 'seasons', group: 'Spesial', icon: '🍂', name: 'Ahli Musim', desc: 'Coba keempat musim tanah hutan', target: 4, value: (s) => s.seasons },
];

export const isDone = (a: Achievement, s: Stats) => a.value(s) >= a.target;
export const getAchievement = (id: string) => ACHIEVEMENTS.find((a) => a.id === id);
