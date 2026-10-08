import AsyncStorage from '@react-native-async-storage/async-storage';

export type Session = {
  id: string;
  date: number; // epoch ms saat sesi selesai/gagal
  minutes: number; // durasi yang direncanakan
  ok: boolean; // true = pohon tumbuh, false = layu
};

const KEY = 'focus-forest:sessions';

export async function loadSessions(): Promise<Session[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session[]) : [];
  } catch {
    return [];
  }
}

export async function saveSessions(list: Session[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // abaikan: app tetap jalan walau gagal menyimpan
  }
}
