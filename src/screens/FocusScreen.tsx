import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import * as Updates from 'expo-updates';
import Tree from '../Tree';
import DailyRewardModal from '../DailyRewardModal';
import type { DailyView } from '../daily';
import { Screen } from '../ui';
import { BORDER, GREEN, GREEN_DARK, TEXT_SOFT } from '../theme';
import { TAGS, TAG_ICONS, getSpecies } from '../species';
import { getSeason } from '../seasons';
import type { Profile, Session } from '../storage';

type Phase = 'idle' | 'running' | 'success' | 'failed';

// Durasi dalam menit. 10 detik hanya untuk mencoba animasi (tidak memberi koin/prestasi).
const DURATIONS = [
  { short: '10 dtk', long: 'Tes 10 detik', minutes: 10 / 60 },
  { short: '15', long: '15 menit', minutes: 15 },
  { short: '25', long: '25 menit', minutes: 25 },
  { short: '45', long: '45 menit', minutes: 45 },
  { short: '60', long: '60 menit', minutes: 60 },
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
  daily: DailyView;
  onClaimDaily: () => void;
  onFinished: (s: Session) => void;
  onRunningChange: (running: boolean) => void;
};

export default function FocusScreen({
  active,
  profile,
  coins,
  streak,
  daily,
  onClaimDaily,
  onFinished,
  onRunningChange,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [minutes, setMinutes] = useState(25);
  const [tag, setTag] = useState(TAGS[0]);
  const [now, setNow] = useState(() => Date.now());
  const [startedAt, setStartedAt] = useState(0);
  const [earned, setEarned] = useState(0);
  const [updateMsg, setUpdateMsg] = useState('');
  const [checking, setChecking] = useState(false);
  const [showDaily, setShowDaily] = useState(false);
  const leftAt = useRef<number | null>(null);
  const finished = useRef(false);
  const [pop] = useState(() => new Animated.Value(1));

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
      if (t - startedAt >= durationMs) finish(true);
    }, 200);
    return () => clearInterval(id);
  }, [phase, durationMs, startedAt, finish]);

  // Keluar dari app terlalu lama = pohon layu.
  useEffect(() => {
    if (phase !== 'running') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        leftAt.current = Date.now();
      } else if (leftAt.current !== null) {
        const away = Date.now() - leftAt.current;
        leftAt.current = null;
        if (Date.now() - startedAt >= durationMs) finish(true);
        else if (away > GRACE_MS) finish(false);
      }
    });
    return () => sub.remove();
  }, [phase, durationMs, startedAt, finish]);

  const start = () => {
    const t = Date.now();
    leftAt.current = null;
    finished.current = false;
    setStartedAt(t);
    setNow(t);
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

  const elapsed = phase === 'running' ? now - startedAt : 0;
  const progress = phase === 'success' ? 1 : phase === 'running' ? Math.min(1, elapsed / durationMs) : 0;

  return (
    <Screen active={active}>
      {phase === 'running' && <RunningKeepAwake />}

      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🔥 {streak} hari</Text>
        </View>
        <Pressable
          style={[styles.badge, styles.badgeGift]}
          onPress={() => setShowDaily(true)}
          disabled={phase === 'running'}
          accessibilityLabel="Hadiah harian"
        >
          <Text style={[styles.badgeText, styles.badgeGiftText]}>🎁 Hadiah</Text>
          {daily.canClaim && <View style={styles.giftDot} />}
        </Pressable>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🪙 {coins}</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        {phase === 'running'
          ? `${TAG_ICONS[tag] ?? ''} ${tag} · tetap di app ini, pohonmu sedang tumbuh`
          : phase === 'success'
            ? `Hebat! Pohonmu tumbuh 🎉${earned > 0 ? `  +${earned} koin` : ''}`
            : phase === 'failed'
              ? 'Yah, pohonmu layu 🥀'
              : 'Siap fokus? Pilih kegiatan dan durasinya'}
      </Text>

      <Animated.View style={[styles.stage, { backgroundColor: season.stageBg, transform: [{ scale: pop }] }]}>
        <Tree progress={progress} withered={phase === 'failed'} species={species} season={season} size={220} glow />
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
        <View style={styles.card}>
          <Text style={styles.label}>Kegiatan</Text>
          <View style={styles.tagRow}>
            {TAGS.map((t) => (
              <Pressable key={t} onPress={() => setTag(t)} style={[styles.tag, tag === t && styles.tagOn]}>
                <Text style={styles.tagIcon}>{TAG_ICONS[t]}</Text>
                <Text style={[styles.tagText, tag === t && styles.tagTextOn]} numberOfLines={1}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.labelRow}>
            <Text style={styles.label}>Durasi</Text>
            <Text style={styles.labelValue}>{DURATIONS.find((d) => d.minutes === minutes)?.long}</Text>
          </View>
          <View style={styles.segment}>
            {DURATIONS.map((d, i) => {
              const on = minutes === d.minutes;
              return (
                <Pressable
                  key={d.short}
                  onPress={() => setMinutes(d.minutes)}
                  style={[styles.seg, i > 0 && styles.segDivider, on && styles.segOn]}
                >
                  <Text style={[styles.segText, on && styles.segTextOn]}>{d.short}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={[styles.btn, styles.btnFull]} onPress={start}>
            <Text style={styles.btnText}>🌱 Tanam {species.name}</Text>
          </Pressable>
        </View>
      )}

      {(phase === 'success' || phase === 'failed') && (
        <Pressable style={[styles.btn, styles.btnFull]} onPress={() => setPhase('idle')}>
          <Text style={styles.btnText}>Tanam lagi</Text>
        </Pressable>
      )}

      {phase !== 'running' && (
        <View style={styles.updateBox}>
          <Pressable onPress={checkUpdate} disabled={checking} hitSlop={10}>
            <Text style={[styles.updateText, checking && styles.updateOff]}>🔄 Cek update</Text>
          </Pressable>
          {updateMsg !== '' && <Text style={styles.updateMsg}>{updateMsg}</Text>}
        </View>
      )}
      <DailyRewardModal visible={showDaily} view={daily} onClose={() => setShowDaily(false)} onClaim={onClaimDaily} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  badge: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  badgeText: { color: GREEN_DARK, fontWeight: '800', fontSize: 14 },
  badgeGift: { backgroundColor: '#fff4d6', borderWidth: 1.5, borderColor: '#f9a825' },
  badgeGiftText: { color: '#8a5a00' },
  giftDot: {
    position: 'absolute',
    top: 4,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e53935',
    borderWidth: 1.5,
    borderColor: '#fff4d6',
  },
  subtitle: { fontSize: 14, color: TEXT_SOFT, marginTop: 12, textAlign: 'center' },
  stage: { marginVertical: 14, backgroundColor: '#f1f8e9', borderRadius: 140, padding: 6 },
  timer: { fontSize: 52, fontWeight: '700', color: GREEN_DARK },
  card: { alignSelf: 'stretch', backgroundColor: '#fff', borderRadius: 24, padding: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16 },
  label: { color: TEXT_SOFT, fontWeight: '700', fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 },
  labelValue: { color: GREEN, fontWeight: '800', fontSize: 13, marginBottom: 8 },
  tagRow: { flexDirection: 'row', gap: 6 },
  tag: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#f1f8f1',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  tagOn: { backgroundColor: '#e3f4e3', borderColor: GREEN },
  tagIcon: { fontSize: 20 },
  tagText: { color: TEXT_SOFT, fontWeight: '700', fontSize: 11, marginTop: 3 },
  tagTextOn: { color: GREEN_DARK },
  segment: {
    flexDirection: 'row',
    height: 42,
    borderRadius: 14,
    backgroundColor: '#f1f8f1',
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  seg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  segDivider: { borderLeftWidth: 1, borderLeftColor: BORDER },
  segOn: { backgroundColor: GREEN },
  segText: { color: GREEN, fontWeight: '700', fontSize: 14 },
  segTextOn: { color: '#fff' },
  btn: { marginTop: 18, backgroundColor: GREEN, paddingHorizontal: 36, paddingVertical: 14, borderRadius: 28 },
  btnFull: { alignSelf: 'stretch', alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#c62828' },
  btnGhostText: { color: '#c62828' },
  updateBox: { alignItems: 'center', marginTop: 18 },
  updateText: { color: TEXT_SOFT, fontWeight: '600', fontSize: 13 },
  updateOff: { opacity: 0.5 },
  updateMsg: { marginTop: 6, color: TEXT_SOFT, fontSize: 12.5, textAlign: 'center' },
});
