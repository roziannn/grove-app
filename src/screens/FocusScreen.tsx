import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import * as Updates from 'expo-updates';
import Tree from '../Tree';
import DailyRewardModal from '../DailyRewardModal';
import ActivityPicker from '../ActivityPicker';
import DurationPicker, { DEFAULT_MINUTES } from '../DurationPicker';
import ProgressRing from '../ProgressRing';
import type { DailyView } from '../daily';
import { Screen } from '../ui';
import { GREEN, GREEN_DARK, TEXT_SOFT } from '../theme';
import { TAGS, TAG_ICONS, getSpecies, ringColor, tagLabel } from '../species';
import { getSeason } from '../seasons';
import { shortDate } from '../stats';
import type { Profile, Session } from '../storage';

type Phase = 'idle' | 'running' | 'success' | 'failed';

// Sesi sampai batas ini diperbarui lebih sering (4x/detik) supaya cincin progres tetap mulus.
// Ringkasan "app ini jalan dari mana", supaya jelas apakah tombol update bisa dipakai.
function buildStatus(): string {
  if (__DEV__) return 'Mode development (Expo Go / server dev)';
  if (!Updates.isEnabled) return 'Build ini tidak mendukung update';
  if (Updates.isEmbeddedLaunch || !Updates.createdAt) return `Versi bawaan APK · channel ${Updates.channel ?? '-'}`;
  const d = Updates.createdAt;
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `Update ${shortDate(d)} ${hm} · channel ${Updates.channel ?? '-'}`;
}

const SHORT_SESSION_MS = 10 * 60_000;

// Ukuran pohon di dalam lingkaran (lingkaran = ini + padding 6 di tiap sisi).
const STAGE_TREE = 220;

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
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);
  const [tag, setTag] = useState(TAGS[0]);
  const [now, setNow] = useState(() => Date.now());
  const [startedAt, setStartedAt] = useState(0);
  const [earned, setEarned] = useState(0);
  const [updateMsg, setUpdateMsg] = useState('');
  const [checking, setChecking] = useState(false);
  const [showDaily, setShowDaily] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
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
  // Sesi pendek diperbarui 4x/detik agar cincin mulus; sesi panjang cukup sekali per detik
  // (selaras dengan pergantian angka timer), jadi render ulang 4x lebih sedikit.
  useEffect(() => {
    if (phase !== 'running') return;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      const t = Date.now();
      setNow(t);
      if (t - startedAt >= durationMs) {
        finish(true);
        return;
      }
      timer = setTimeout(step, durationMs <= SHORT_SESSION_MS ? 250 : 1000 - ((t - startedAt) % 1000) + 10);
    };
    timer = setTimeout(step, 250);
    return () => clearTimeout(timer);
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
      // Penjelasan panjang lewat dialog supaya tidak menumpuk ke tombol tanam; di layar cukup satu baris.
      setUpdateMsg('Update tidak tersedia di mode ini');
      Alert.alert(
        'Update tidak tersedia',
        __DEV__
          ? 'Kamu sedang membuka app lewat Expo Go atau server development, jadi tombol update tidak bisa dipakai di sini.\n\nPasang APK hasil build, lalu buka dari ikon Grove.'
          : 'APK ini dibuat tanpa pengaturan update (alamat update belum terisi).\n\nJalankan "npx eas-cli update:configure", lalu build APK baru.',
      );
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
    <Screen active={active} grow>
      {phase === 'running' && <RunningKeepAwake />}

      <View style={styles.top}>
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

        {phase === 'idle' && (
          <Pressable style={styles.activity} onPress={() => setShowActivity(true)} accessibilityLabel="Pilih kegiatan">
            <View style={styles.activityIcon}>
              <Text style={styles.activityIconText}>{TAG_ICONS[tag]}</Text>
            </View>
            <View style={styles.activityText}>
              <Text style={styles.activityCaption}>Pilih kegiatan</Text>
              <Text style={styles.activityName}>{tagLabel(tag)}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      </View>

      {/* Pohon, timer, dan tombol tanam dipusatkan di ruang antara bagian atas dan menu bawah. */}
      <View style={styles.center}>
        <Text style={styles.subtitle}>
          {phase === 'running'
            ? `${TAG_ICONS[tag] ?? ''} ${tagLabel(tag)} · tetap di app ini, pohonmu sedang tumbuh`
            : phase === 'success'
              ? `Hebat! Pohonmu tumbuh 🎉${earned > 0 ? `  +${earned} koin` : ''}`
              : phase === 'failed'
                ? 'Yah, pohonmu layu 🥀'
                : 'Geser untuk memilih durasi'}
        </Text>

        <Animated.View style={[styles.stage, { backgroundColor: season.stageBg, transform: [{ scale: pop }] }]}>
          <Tree progress={progress} withered={phase === 'failed'} species={species} season={season} size={STAGE_TREE} glow />
          {(phase === 'running' || phase === 'success') && (
            <ProgressRing
              diameter={STAGE_TREE + 12}
              progress={progress}
              color={ringColor(species)}
              showHead={phase === 'running'}
            />
          )}
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
            <DurationPicker value={minutes} onChange={setMinutes} />
            <Pressable style={styles.btn} onPress={start}>
              <Text style={styles.btnText}>🌱 Tanam {species.name}</Text>
            </Pressable>
          </>
        )}

        {(phase === 'success' || phase === 'failed') && (
          <Pressable style={styles.btn} onPress={() => setPhase('idle')}>
            <Text style={styles.btnText}>Tanam lagi</Text>
          </Pressable>
        )}
      </View>

      {phase !== 'running' && (
        <View style={styles.updateBox}>
          <Pressable onPress={checkUpdate} disabled={checking} hitSlop={10}>
            <Text style={[styles.updateText, checking && styles.updateOff]}>🔄 Cek update</Text>
          </Pressable>
          <Text style={styles.updateInfo}>{buildStatus()}</Text>
          {updateMsg !== '' && <Text style={styles.updateMsg}>{updateMsg}</Text>}
        </View>
      )}

      <ActivityPicker visible={showActivity} selected={tag} onSelect={setTag} onClose={() => setShowActivity(false)} />
      <DailyRewardModal visible={showDaily} view={daily} onClose={() => setShowDaily(false)} onClaim={onClaimDaily} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { alignSelf: 'stretch', gap: 12 },
  topRow: { flexDirection: 'row', gap: 10 },
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
  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  activityIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e3f4e3', alignItems: 'center', justifyContent: 'center' },
  activityIconText: { fontSize: 20 },
  activityText: { flex: 1 },
  activityCaption: { fontSize: 11, fontWeight: '700', color: TEXT_SOFT, textTransform: 'uppercase', letterSpacing: 0.6 },
  activityName: { fontSize: 16, fontWeight: '800', color: GREEN_DARK },
  chevron: { fontSize: 30, color: TEXT_SOFT, lineHeight: 32, paddingHorizontal: 6 },
  center: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  subtitle: { fontSize: 14, color: TEXT_SOFT, textAlign: 'center', minHeight: 20 },
  stage: { marginVertical: 20, backgroundColor: '#f1f8e9', borderRadius: 140, padding: 6 },
  timer: { fontSize: 52, fontWeight: '700', color: GREEN_DARK },
  btn: { marginTop: 18, backgroundColor: GREEN, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 28 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#c62828' },
  btnGhostText: { color: '#c62828' },
  // Di tepi bawah (di atas menu) agar tidak ikut menghitung ruang saat memusatkan pohon dan tombol.
  updateBox: { position: 'absolute', left: 0, right: 0, bottom: 104, alignItems: 'center' },
  updateText: { color: TEXT_SOFT, fontWeight: '600', fontSize: 13 },
  updateOff: { opacity: 0.5 },
  updateInfo: { marginTop: 3, color: '#8a9a8b', fontSize: 11 },
  updateMsg: { marginTop: 6, color: TEXT_SOFT, fontSize: 12.5, textAlign: 'center' },
});
