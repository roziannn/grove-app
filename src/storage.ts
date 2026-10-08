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
};

export const DEFAULT_PROFILE: Profile = { unlocked: ['oak'], selected: 'oak' };

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
export const loadProfile = () => read<Profile>(PROFILE_KEY, DEFAULT_PROFILE);
export const saveProfile = (p: Profile) => write(PROFILE_KEY, p);
