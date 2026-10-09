import AsyncStorage from '@react-native-async-storage/async-storage';

export type Session = {
  id: string;
  date: number; // epoch ms saat sesi selesai/gagal
  minutes: number; // durasi yang direncanakan
  ok: boolean; // true = pohon tumbuh, false = layu
  tag?: string; // label kegiatan, mis. "Belajar"
  species?: string; // id jenis pohon yang ditanam
};

export type Profile = {
  unlocked: string[]; // id jenis pohon yang sudah dibeli
  selected: string; // jenis pohon yang dipakai
  season: string; // musim tanah hutan
  seasonsTried: string[]; // musim yang pernah dicoba (untuk prestasi)
  achievements: Record<string, number>; // id prestasi -> waktu terbuka (0 = sudah tercapai sebelum fitur ada)
  achVersion: number; // 0 = belum pernah dievaluasi (migrasi senyap)
  dailyLast: string; // tanggal klaim hadiah harian terakhir (YYYY-MM-DD), kosong = belum pernah
  dailyDay: number; // hari ke-berapa (1..7) pada klaim terakhir
  dailyCoins: number; // total koin dari hadiah harian
};

export const DEFAULT_PROFILE: Profile = {
  unlocked: ['oak'],
  selected: 'oak',
  season: 'summer',
  seasonsTried: ['summer'],
  achievements: {},
  achVersion: 0,
  dailyLast: '',
  dailyDay: 0,
  dailyCoins: 0,
};

const SESSIONS_KEY = 'grove:sessions';
const PROFILE_KEY = 'grove:profile';

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function write(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // abaikan: app tetap jalan walau gagal menyimpan
  }
}

export const loadSessions = () => read<Session[]>(SESSIONS_KEY, []);
export const saveSessions = (list: Session[]) => write(SESSIONS_KEY, list);
// Digabung dengan nilai bawaan supaya profil lama (tanpa field baru) tetap valid.
export const loadProfile = async (): Promise<Profile> => {
  const p: Profile = { ...DEFAULT_PROFILE, ...(await read<Partial<Profile>>(PROFILE_KEY, {})) };
  return { ...p, seasonsTried: Array.from(new Set([...p.seasonsTried, p.season])) };
};
export const saveProfile = (p: Profile) => write(PROFILE_KEY, p);
