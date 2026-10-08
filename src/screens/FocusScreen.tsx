import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import * as Updates from 'expo-updates';
import Tree from '../Tree';
import { Screen } from '../ui';
import { BORDER, GREEN, GREEN_DARK, TEXT_SOFT } from '../theme';
import { TAGS, getSpecies } from '../species';
import { getSeason } from '../seasons';
import type { Profile, Session } from '../storage';

type Phase = 'idle' | 'running' | 'success' | 'failed';

// Durasi dalam menit. 10/60 menit (10 detik) hanya untuk mencoba animasi.
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

type Props = {
  active: boolean;
  profile: Profile;
  coins: number;
  streak: number;
  onFinished: (s: Session) => void;
  onRunningChange: (running: boolean) => void;
};

export default function FocusScreen({ active, profile, coins, streak, onFinished, onRunningChange }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [minutes, setMinutes] = useState(25);
  const [tag, setTag] = useState(TAGS[0]);
  const [now, setNow] = useState(Date.now());
  const [earned, setEarned] = useState(0);
  const [updateMsg, setUpdateMsg] = useState('');
  const [checking, setChecking] = useState(false);
  const startedAt = useRef(0);
  const leftAt = useRef<number | null>(null);
  const finished = useRef(false);
  const pop = useRef(new Animated.Value(1)).current;

  const species = getSpecies(profile.selected);
  const season = getSeason(profile.season);
  const durationMs = minutes * 60_000;

  useEffect(() => {
    onRunningChange(phase === 'running');
  }, [phase, onRunningChange]);

  const finish = useCallback(
    (ok: boolean) => {
      if (finished.current) return; // cegah tercatat dua kali (timer + AppState)
      finished.current = true;
      setPhase(ok ? 'success' : 'failed');
      setEarned(ok ? Math.floor(minutes) : 0);
      onFinished({ id: String(Date.now()), date: Date.now(), minutes, ok, tag, species: species.id });
      if (ok) {
        pop.setValue(0.85);
        Animated.spring(pop, { toValue: 1, friction: 3, useNativeDriver: true }).start();
      }
    },
    [minutes, tag, species.id, onFinished, pop],
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
    finished.current = false;
    setNow(Date.now());
    setPhase('running');
  };

  const giveUp = () => {
    Alert.alert('Menyerah?', 'Pohonmu akan layu.', [
      { text: 'Lanjut fokus', style: 'cancel' },
      { text: 'Menyerah', style: 'destructive', onPress: () => finish(false) },
    ]);
  };

  const checkUpdate = async () => {
    if (!Updates.isEnabled) {
      setUpdateMsg('Update hanya jalan di app hasil build (APK), bukan saat development.');
      return;
    }
    setChecking(true);
    setUpdateMsg('Memeriksa update...');
    try {
      const res = await Updates.checkForUpdateAsync();
      if (!res.isAvailable) {
        setUpdateMsg('Sudah versi terbaru ✅');
        return;
      }
      setUpdateMsg('Mengunduh update...');
      await Updates.fetchUpdateAsync();
      setUpdateMsg('Update siap, memuat ulang...');
      await Updates.reloadAsync();
    } catch {
      setUpdateMsg('Gagal memeriksa update. Cek koneksi internetmu.');
    } finally {
      setChecking(false);
    }
  };

  const elapsed = phase === 'running' ? now - startedAt.current : 0;
  const progress = phase === 'success' ? 1 : phase === 'running' ? Math.min(1, elapsed / durationMs) : 0;

  return (
    <Screen active={active}>
      {phase === 'running' && <RunningKeepAwake />}

      <View style={styles.topRow}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>🔥 {streak} hari</Text>
        </View>
        <Text style={styles.title}>Grove</Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>🪙 {coins}</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        {phase === 'running'
          ? `${tag} · tetap di app ini, pohonmu sedang tumbuh`
          : phase === 'success'
            ? `Hebat! Pohonmu tumbuh 🎉${earned > 0 ? `  +${earned} koin` : ''}`
            : phase === 'failed'
              ? 'Yah, pohonmu layu 🥀'
              : 'Pilih kegiatan dan durasi, lalu tanam pohon'}
      </Text>

      <Animated.View style={[styles.stage, { backgroundColor: season.stageBg, transform: [{ scale: pop }] }]}>
        <Tree progress={progress} withered={phase === 'failed'} species={species} season={season} />
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
          <Text style={styles.label}>Kegiatan</Text>
          <View style={styles.chips}>
            {TAGS.map((t) => (
              <Pressable key={t} onPress={() => setTag(t)} style={[styles.chip, tag === t && styles.chipOn]}>
                <Text style={[styles.chipText, tag === t && styles.chipTextOn]}>{t}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>Durasi</Text>
          <View style={styles.chips}>
            {DURATIONS.map((d) => (
              <Pressable
                key={d.label}
                onPress={() => setMinutes(d.minutes)}
                style={[styles.chip, minutes === d.minutes && styles.chipOn]}
              >
                <Text style={[styles.chipText, minutes === d.minutes && styles.chipTextOn]}>{d.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.btn} onPress={start}>
            <Text style={styles.btnText}>Tanam {species.name}</Text>
          </Pressable>
        </>
      )}

      {(phase === 'success' || phase === 'failed') && (
        <Pressable style={styles.btn} onPress={() => setPhase('idle')}>
          <Text style={styles.btnText}>Tanam lagi</Text>
        </Pressable>
      )}

      {phase !== 'running' && (
        <View style={styles.updateBox}>
          <Pressable
            style={[styles.updateBtn, checking && styles.updateBtnOff]}
            onPress={checkUpdate}
            disabled={checking}
          >
            <Text style={styles.updateText}>🔄 Cek update</Text>
          </Pressable>
          {updateMsg !== '' && <Text style={styles.updateMsg}>{updateMsg}</Text>}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch' },
  title: { fontSize: 28, fontWeight: '800', color: GREEN },
  pill: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 84,
    alignItems: 'center',
  },
  pillText: { color: GREEN_DARK, fontWeight: '700' },
  subtitle: { fontSize: 15, color: TEXT_SOFT, marginTop: 8, textAlign: 'center' },
  stage: { marginVertical: 16, backgroundColor: '#f1f8e9', borderRadius: 140, padding: 8 },
  timer: { fontSize: 52, fontWeight: '700', color: GREEN_DARK, marginBottom: 12 },
  label: { alignSelf: 'flex-start', marginTop: 8, marginBottom: 6, color: TEXT_SOFT, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignSelf: 'stretch' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipOn: { backgroundColor: GREEN, borderColor: GREEN },
  chipText: { color: GREEN, fontWeight: '600' },
  chipTextOn: { color: '#fff' },
  btn: { marginTop: 20, backgroundColor: GREEN, paddingHorizontal: 36, paddingVertical: 14, borderRadius: 28 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#c62828' },
  btnGhostText: { color: '#c62828' },
  updateBox: { alignItems: 'center', marginTop: 24 },
  updateBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#fff',
  },
  updateBtnOff: { opacity: 0.5 },
  updateText: { color: GREEN, fontWeight: '600' },
  updateMsg: { marginTop: 6, color: TEXT_SOFT, fontSize: 13, textAlign: 'center' },
});
