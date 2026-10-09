import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import TabBar, { TabKey } from './src/TabBar';
import FocusScreen from './src/screens/FocusScreen';
import StatsScreen from './src/screens/StatsScreen';
import CollectionScreen from './src/screens/CollectionScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import AchievementToast from './src/AchievementToast';
import { ACHIEVEMENTS, computeStats, getAchievement, isDone } from './src/achievements';
import { BG } from './src/theme';
import { applyClaim, dailyView, dateKey } from './src/daily';
import { SPECIES } from './src/species';
import { START_COINS, coinsFor, currentStreak } from './src/stats';
import {
  DEFAULT_PROFILE,
  Profile,
  Session,
  loadProfile,
  loadSessions,
  saveProfile,
  saveSessions,
} from './src/storage';

export default function App() {
  const [tab, setTab] = useState<TabKey>('focus');
  // Layar selain Fokus baru dipasang saat pertama kali dibuka: startup lebih cepat dan memori lebih hemat.
  const [visited, setVisited] = useState<Set<TabKey>>(() => new Set<TabKey>(['focus']));
  const goTab = useCallback((k: TabKey) => {
    setTab(k);
    setVisited((v) => (v.has(k) ? v : new Set(v).add(k)));
  }, []);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);

  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([loadSessions(), loadProfile()]).then(([s, p]) => {
      setSessions(s);
      setProfile(p);
      setReady(true);
    });
  }, []);

  const addSession = useCallback((s: Session) => {
    setSessions((prev) => {
      const next = [s, ...prev];
      saveSessions(next);
      return next;
    });
  }, []);

  const changeProfile = useCallback((p: Profile) => {
    setProfile(p);
    saveProfile(p);
  }, []);

  // Koin = saldo awal + hasil fokus - harga pohon yang sudah dibeli.
  const coins = useMemo(() => {
    const earned = sessions.reduce((a, s) => a + coinsFor(s), 0);
    const spent = SPECIES.filter((sp) => profile.unlocked.includes(sp.id)).reduce((a, sp) => a + sp.price, 0);
    return START_COINS + earned + profile.dailyCoins - spent;
  }, [sessions, profile.unlocked, profile.dailyCoins]);

  const streak = useMemo(() => currentStreak(sessions), [sessions]);

  // Tanggal hari ini; diperbarui saat app dibuka lagi atau lewat tengah malam.
  const [today, setToday] = useState(dateKey());
  useEffect(() => {
    const check = () => setToday(dateKey());
    const sub = AppState.addEventListener('change', (st) => st === 'active' && check());
    const id = setInterval(check, 60_000);
    return () => {
      sub.remove();
      clearInterval(id);
    };
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const daily = useMemo(() => dailyView(profile), [profile.dailyLast, profile.dailyDay, today]);
  const claimDaily = useCallback(() => {
    setProfile((prev) => {
      const next = applyClaim(prev);
      if (next !== prev) saveProfile(next);
      return next;
    });
  }, []);
  const stats = useMemo(
    () => computeStats(sessions, profile),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions, profile.unlocked, profile.seasonsTried],
  );

  // Buka prestasi yang baru tercapai. Evaluasi pertama setelah fitur ini ada berjalan senyap
  // (tanpa banner) supaya pengguna lama tidak kebanjiran notifikasi.
  useEffect(() => {
    if (!ready) return;
    const fresh = ACHIEVEMENTS.filter((a) => isDone(a, stats) && !(a.id in profile.achievements));
    if (fresh.length === 0 && profile.achVersion >= 1) return;
    const silent = profile.achVersion < 1;
    const at = silent ? 0 : Date.now();
    const next: Profile = {
      ...profile,
      achVersion: 1,
      achievements: { ...profile.achievements, ...Object.fromEntries(fresh.map((a) => [a.id, at])) },
    };
    // Sengaja: prestasi diturunkan dari data yang baru dimuat/berubah, bukan dari satu event tertentu.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(next);
    saveProfile(next);
    if (!silent) setToasts((q) => [...q, ...fresh.map((a) => a.id)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, stats]);

  const dismissToast = useCallback(() => setToasts((q) => q.slice(1)), []);
  const toast = toasts.length > 0 ? getAchievement(toasts[0]) : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <FocusScreen
        active={tab === 'focus'}
        profile={profile}
        coins={coins}
        streak={streak}
        daily={daily}
        onClaimDaily={claimDaily}
        onFinished={addSession}
        onRunningChange={setRunning}
      />
      {visited.has('stats') && (
        <StatsScreen
          active={tab === 'stats'}
          sessions={sessions}
          season={profile.season}
          onSeasonChange={(season) =>
            changeProfile({ ...profile, season, seasonsTried: Array.from(new Set([...profile.seasonsTried, season])) })
          }
        />
      )}
      {visited.has('collection') && (
        <CollectionScreen active={tab === 'collection'} profile={profile} coins={coins} onChange={changeProfile} />
      )}
      {visited.has('achievements') && (
        <AchievementsScreen active={tab === 'achievements'} stats={stats} unlockedAt={profile.achievements} />
      )}
      {toast && <AchievementToast key={toast.id} achievement={toast} onDone={dismissToast} />}
      {!running && <TabBar active={tab} onChange={goTab} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
});
