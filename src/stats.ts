import type { Session } from './storage';

export type Range = 'day' | 'week' | 'month' | 'year';

export type Period = { start: number; end: number; label: string };
export type Buckets = { values: number[]; labels: string[] };

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const DAYS_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const shortDate = (d: Date) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;

// offset 0 = periode sekarang, -1 = periode sebelumnya, dst.
export function getPeriod(range: Range, offset: number, now: Date = new Date()): Period {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  if (range === 'day') {
    const s = new Date(y, m, d + offset);
    const e = new Date(y, m, d + offset + 1);
    const label =
      offset === 0 ? 'Hari ini' : offset === -1 ? 'Kemarin' : `${shortDate(s)} ${s.getFullYear()}`;
    return { start: s.getTime(), end: e.getTime(), label };
  }
  if (range === 'week') {
    const dow = (now.getDay() + 6) % 7; // Senin = 0
    const s = new Date(y, m, d - dow + offset * 7);
    const e = new Date(y, m, d - dow + offset * 7 + 7);
    const last = new Date(y, m, d - dow + offset * 7 + 6);
    const label = offset === 0 ? 'Minggu ini' : `${shortDate(s)} – ${shortDate(last)}`;
    return { start: s.getTime(), end: e.getTime(), label };
  }
  if (range === 'month') {
    const s = new Date(y, m + offset, 1);
    const e = new Date(y, m + offset + 1, 1);
    return { start: s.getTime(), end: e.getTime(), label: `${MONTHS[s.getMonth()]} ${s.getFullYear()}` };
  }
  const s = new Date(y + offset, 0, 1);
  const e = new Date(y + offset + 1, 0, 1);
  return { start: s.getTime(), end: e.getTime(), label: String(s.getFullYear()) };
}

export const inPeriod = (sessions: Session[], p: Period) =>
  sessions.filter((s) => s.date >= p.start && s.date < p.end);

// Menit fokus per kolom grafik (jam / hari / tanggal / bulan).
export function bucketMinutes(grown: Session[], range: Range, period: Period): Buckets {
  let count: number;
  let labels: string[];
  let index: (d: Date) => number;

  if (range === 'day') {
    count = 24;
    labels = Array.from({ length: 24 }, (_, i) => (i % 6 === 0 || i === 23 ? String(i) : ''));
    index = (d) => d.getHours();
  } else if (range === 'week') {
    count = 7;
    labels = DAYS_SHORT;
    index = (d) => (d.getDay() + 6) % 7;
  } else if (range === 'month') {
    const s = new Date(period.start);
    count = new Date(s.getFullYear(), s.getMonth() + 1, 0).getDate();
    labels = Array.from({ length: count }, (_, i) => (i === 0 || (i + 1) % 5 === 0 ? String(i + 1) : ''));
    index = (d) => d.getDate() - 1;
  } else {
    count = 12;
    labels = MONTHS_SHORT;
    index = (d) => d.getMonth();
  }

  const values = new Array<number>(count).fill(0);
  for (const s of grown) values[index(new Date(s.date))] += s.minutes;
  return { values, labels };
}

export function tagTotals(grown: Session[]): { tag: string; minutes: number }[] {
  const map = new Map<string, number>();
  for (const s of grown) {
    const tag = s.tag ?? 'Tanpa label';
    map.set(tag, (map.get(tag) ?? 0) + s.minutes);
  }
  return [...map.entries()]
    .map(([tag, minutes]) => ({ tag, minutes }))
    .sort((a, b) => b.minutes - a.minutes);
}

// Jumlah hari berturut-turut yang punya minimal satu pohon tumbuh.
export function currentStreak(sessions: Session[], now: Date = new Date()): number {
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const days = new Set(sessions.filter((s) => s.ok).map((s) => key(new Date(s.date))));
  let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(key(cursor))) cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  let n = 0;
  while (days.has(key(cursor))) {
    n++;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }
  return n;
}

export function fmtDuration(minutes: number): string {
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} mnt`;
  return m === 0 ? `${h} jam` : `${h} jam ${m} mnt`;
}

// 1 menit fokus = 1 koin (sesi tes 10 detik tidak menghasilkan koin).
export const coinsFor = (s: Session) => (s.ok ? Math.floor(s.minutes) : 0);
