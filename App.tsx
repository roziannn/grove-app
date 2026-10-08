import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import TabBar, { TabKey } from './src/TabBar';
import FocusScreen from './src/screens/FocusScreen';
import StatsScreen from './src/screens/StatsScreen';
import CollectionScreen from './src/screens/CollectionScreen';
import { BG } from './src/theme';
import { SPECIES } from './src/species';
import { coinsFor, currentStreak } from './src/stats';
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
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);

  useEffect(() => {
    loadSessions().then(setSessions);
    loadProfile().then(setProfile);
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

  // Koin = hasil fokus dikurangi harga pohon yang sudah dibeli.
  const coins = useMemo(() => {
    const earned = sessions.reduce((a, s) => a + coinsFor(s), 0);
    const spent = SPECIES.filter((sp) => profile.unlocked.includes(sp.id)).reduce((a, sp) => a + sp.price, 0);
    return earned - spent;
  }, [sessions, profile.unlocked]);

  const streak = useMemo(() => currentStreak(sessions), [sessions]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <FocusScreen
        active={tab === 'focus'}
        profile={profile}
        coins={coins}
        streak={streak}
        onFinished={addSession}
        onRunningChange={setRunning}
      />
      <StatsScreen active={tab === 'stats'} sessions={sessions} />
      <CollectionScreen active={tab === 'collection'} profile={profile} coins={coins} onChange={changeProfile} />
      {!running && <TabBar active={tab} onChange={setTab} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
});
