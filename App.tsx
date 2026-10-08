import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  AppState,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import Tree from './src/Tree';
import { Session, loadSessions, saveSessions } from './src/storage';

type Phase = 'idle' | 'running' | 'success' | 'failed';

// Durasi dalam menit. 0.17 menit (~10 detik) hanya untuk mencoba animasi.
const DURATIONS = [
  { label: 'Tes 10 dtk', minutes: 10 / 60 },
  { label: '15 mnt', minutes: 15 },
  { label: '25 mnt', minutes: 25 },
  { label: '45 mnt', minutes: 45 },
  { label: '60 mnt', minutes: 60 },
];

// Boleh keluar app sebentar (mis. lihat notifikasi) sebelum pohon layu.
const GRACE_MS = 10_000;

const fmt = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

function RunningKeepAwake() {
  useKeepAwake();
  return null;
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [minutes, setMinutes] = useState(25);
  const [now, setNow] = useState(Date.now());
  const [sessions, setSessions] = useState<Session[]>([]);
  const startedAt = useRef(0);
  const leftAt = useRef<number | null>(null);
  const pop = useRef(new Animated.Value(1)).current;

  const durationMs = minutes * 60_000;

  useEffect(() => {
    loadSessions().then(setSessions);
  }, []);

  const finish = useCallback(
    (ok: boolean) => {
      setPhase(ok ? 'success' : 'failed');
      setSessions((prev) => {
        const next = [{ id: String(Date.now()), date: Date.now(), minutes, ok }, ...prev];
        saveSessions(next);
        return next;
      });
      if (ok) {
        pop.setValue(0.85);
        Animated.spring(pop, { toValue: 1, friction: 3, useNativeDriver: true }).start();
      }
    },
    [minutes, pop],
  );

  // Ticker: hitung dari timestamp supaya tetap akurat walau app sempat di-background.
  useEffect(() => {
    if (phase !== 'running') return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t - startedAt.current >= durationMs) finish(true);
    }, 200);
    return () => clearInterval(id);
  }, [phase, durationMs, finish]);

  // Keluar dari app terlalu lama = pohon layu.
  useEffect(() => {
    if (phase !== 'running') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        leftAt.current = Date.now();
      } else if (leftAt.current !== null) {
        const away = Date.now() - leftAt.current;
        leftAt.current = null;
        if (Date.now() - startedAt.current >= durationMs) finish(true);
        else if (away > GRACE_MS) finish(false);
      }
    });
    return () => sub.remove();
  }, [phase, durationMs, finish]);

  const start = () => {
    startedAt.current = Date.now();
    leftAt.current = null;
    setNow(Date.now());
    setPhase('running');
  };

  const giveUp = () => {
    Alert.alert('Menyerah?', 'Pohonmu akan layu.', [
      { text: 'Lanjut fokus', style: 'cancel' },
      { text: 'Menyerah', style: 'destructive', onPress: () => finish(false) },
    ]);
  };

  const elapsed = phase === 'running' ? now - startedAt.current : 0;
  const progress =
    phase === 'success' ? 1 : phase === 'running' ? Math.min(1, elapsed / durationMs) : 0;
  const grown = sessions.filter((s) => s.ok);
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const todayMinutes = Math.round(
    grown.filter((s) => s.date >= todayStart).reduce((a, s) => a + s.minutes, 0),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      {phase === 'running' && <RunningKeepAwake />}
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🌱 Focus Forest</Text>
        <Text style={styles.subtitle}>
          {phase === 'running'
            ? 'Tetap di app ini, pohonmu sedang tumbuh'
            : phase === 'success'
              ? 'Hebat! Pohonmu tumbuh 🎉'
              : phase === 'failed'
                ? 'Yah, pohonmu layu 🥀'
                : 'Pilih durasi, lalu tanam pohon'}
        </Text>

        <Animated.View style={[styles.stage, { transform: [{ scale: pop }] }]}>
          <Tree progress={progress} withered={phase === 'failed'} />
        </Animated.View>

        {phase === 'running' && (
          <>
            <Text style={styles.timer}>{fmt(durationMs - elapsed)}</Text>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={giveUp}>
              <Text style={[styles.btnText, styles.btnGhostText]}>Menyerah</Text>
            </Pressable>
          </>
        )}

        {phase === 'idle' && (
          <>
            <View style={styles.chips}>
              {DURATIONS.map((d) => (
                <Pressable
                  key={d.label}
                  onPress={() => setMinutes(d.minutes)}
                  style={[styles.chip, minutes === d.minutes && styles.chipOn]}
                >
                  <Text style={[styles.chipText, minutes === d.minutes && styles.chipTextOn]}>
                    {d.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.btn} onPress={start}>
              <Text style={styles.btnText}>Tanam pohon</Text>
            </Pressable>
          </>
        )}

        {(phase === 'success' || phase === 'failed') && (
          <Pressable style={styles.btn} onPress={() => setPhase('idle')}>
            <Text style={styles.btnText}>Tanam lagi</Text>
          </Pressable>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hutanmu</Text>
          <Text style={styles.stats}>
            {grown.length} pohon tumbuh · hari ini {todayMinutes} menit fokus
          </Text>
          {sessions.length === 0 ? (
            <Text style={styles.empty}>Belum ada pohon. Mulai sesi pertamamu!</Text>
          ) : (
            <View style={styles.forest}>
              {sessions.slice(0, 40).map((s) => (
                <View key={s.id} style={styles.mini}>
                  <Tree progress={1} withered={!s.ok} size={56} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const GREEN = '#2e7d32';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#e8f5e9' },
  container: { alignItems: 'center', padding: 20, paddingTop: 48, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: GREEN },
  subtitle: { fontSize: 15, color: '#4e6b50', marginTop: 4, textAlign: 'center' },
  stage: {
    marginVertical: 16,
    backgroundColor: '#f1f8e9',
    borderRadius: 140,
    padding: 8,
  },
  timer: { fontSize: 52, fontWeight: '700', color: '#1b5e20', marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#a5d6a7',
  },
  chipOn: { backgroundColor: GREEN, borderColor: GREEN },
  chipText: { color: GREEN, fontWeight: '600' },
  chipTextOn: { color: '#fff' },
  btn: {
    marginTop: 18,
    backgroundColor: GREEN,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 28,
  },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#c62828' },
  btnGhostText: { color: '#c62828' },
  card: {
    alignSelf: 'stretch',
    marginTop: 28,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: GREEN },
  stats: { color: '#4e6b50', marginTop: 2, marginBottom: 10 },
  empty: { color: '#8a9a8b', fontStyle: 'italic' },
  forest: { flexDirection: 'row', flexWrap: 'wrap' },
  mini: { width: '20%', alignItems: 'center' },
});
