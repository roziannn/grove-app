import type { Profile } from './storage';

// Hadiah koin per hari dalam satu siklus 7 hari. Setelah hari ke-7 kembali ke hari ke-1.
export const DAILY_REWARDS = [10, 20, 30, 40, 50, 60, 70];
const CYCLE = DAILY_REWARDS.length;

const pad = (n: number) => String(n).padStart(2, '0');

// Kunci tanggal lokal "YYYY-MM-DD" (bisa diurutkan sebagai teks).
export const dateKey = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const yesterdayKey = (d: Date) => dateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));

export type DailyView = {
  canClaim: boolean; // hadiah hari ini belum diambil
  claimedToday: boolean;
  nextDay: number; // hari ke-berapa yang berikutnya diklaim (1..7)
  claimedUpTo: number; // jumlah hari yang sudah terisi di siklus ini (untuk tampilan)
  reward: number; // koin untuk klaim berikutnya
};

// Aturan: klaim berturut-turut tiap hari menaikkan hari ke-1 sampai ke-7. Melewatkan sehari,
// atau selesai hari ke-7, mengembalikan hitungan ke hari ke-1.
export function dailyView(p: Pick<Profile, 'dailyLast' | 'dailyDay'>, now: Date = new Date()): DailyView {
  const today = dateKey(now);
  const make = (canClaim: boolean, claimedToday: boolean, nextDay: number, claimedUpTo: number): DailyView => ({
    canClaim,
    claimedToday,
    nextDay,
    claimedUpTo,
    reward: DAILY_REWARDS[nextDay - 1],
  });

  // ">=" juga menahan klaim ganda bila jam perangkat dimundurkan.
  if (p.dailyLast && p.dailyLast >= today) return make(false, true, (p.dailyDay % CYCLE) + 1, p.dailyDay);
  if (p.dailyLast === yesterdayKey(now) && p.dailyDay >= 1 && p.dailyDay < CYCLE) {
    return make(true, false, p.dailyDay + 1, p.dailyDay);
  }
  return make(true, false, 1, 0);
}

export function applyClaim(p: Profile, now: Date = new Date()): Profile {
  const v = dailyView(p, now);
  if (!v.canClaim) return p;
  return { ...p, dailyLast: dateKey(now), dailyDay: v.nextDay, dailyCoins: p.dailyCoins + v.reward };
}
