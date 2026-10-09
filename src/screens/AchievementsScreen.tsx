import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AchievementBadge from '../AchievementBadge';
import { Screen } from '../ui';
import { ACHIEVEMENTS, Achievement, GROUP_COLORS, Group, Stats, isDone } from '../achievements';
import { shortDate } from '../stats';
import { GREEN, GREEN_DARK, TEXT_SOFT } from '../theme';

type Props = {
  active: boolean;
  stats: Stats;
  unlockedAt: Record<string, number>; // id -> waktu terbuka
};

const GROUPS: Group[] = ['Menanam', 'Waktu Fokus', 'Konsisten', 'Kebiasaan', 'Kegiatan', 'Koleksi', 'Spesial'];

function Row({ a, index, stats, at, paused }: { a: Achievement; index: number; stats: Stats; at?: number; paused: boolean }) {
  const color = GROUP_COLORS[a.group];
  const done = isDone(a, stats);
  const value = Math.min(a.value(stats), a.target);
  const pct = (value / a.target) * 100;
  const unit = a.unit ? ` ${a.unit}` : '';

  return (
    <View style={[styles.row, done && { backgroundColor: `${color}1A`, borderColor: `${color}66` }]}>
      <AchievementBadge icon={a.icon} color={color} unlocked={done} seed={index} paused={paused} />
      <View style={styles.info}>
        <Text style={[styles.name, !done && styles.nameLocked]}>{a.name}</Text>
        <Text style={styles.desc}>{a.desc}</Text>
        {done ? (
          <Text style={[styles.status, { color }]}>
            ✓ Terbuka{at ? ` · ${shortDate(new Date(at))}` : ''}
          </Text>
        ) : (
          <View style={styles.progressRow}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
            <Text style={styles.progressText}>
              {Math.floor(value)}/{a.target}
              {unit}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function AchievementsScreen({ active, stats, unlockedAt }: Props) {
  const doneCount = useMemo(() => ACHIEVEMENTS.filter((a) => isDone(a, stats)).length, [stats]);
  const total = ACHIEVEMENTS.length;

  return (
    <Screen active={active}>
      <Text style={styles.title}>Prestasi</Text>

      <View style={styles.summary}>
        <Text style={styles.summaryTop}>
          🏆 {doneCount} <Text style={styles.summaryOf}>/ {total} terbuka</Text>
        </Text>
        <View style={styles.bigTrack}>
          <View style={[styles.bigFill, { width: `${(doneCount / total) * 100}%` }]} />
        </View>
      </View>

      {GROUPS.map((g) => {
        const items = ACHIEVEMENTS.filter((a) => a.group === g);
        const groupDone = items.filter((a) => isDone(a, stats)).length;
        return (
          <View key={g} style={styles.group}>
            <View style={styles.groupHead}>
              <View style={[styles.dot, { backgroundColor: GROUP_COLORS[g] }]} />
              <Text style={styles.groupName}>{g}</Text>
              <Text style={styles.groupCount}>
                {groupDone}/{items.length}
              </Text>
            </View>
            {items.map((a) => (
              <Row key={a.id} a={a} index={ACHIEVEMENTS.indexOf(a)} stats={stats} at={unlockedAt[a.id]} paused={!active} />
            ))}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', color: GREEN },
  summary: { alignSelf: 'stretch', backgroundColor: '#fff', borderRadius: 20, padding: 16, marginTop: 12 },
  summaryTop: { fontSize: 24, fontWeight: '800', color: GREEN_DARK },
  summaryOf: { fontSize: 15, fontWeight: '600', color: TEXT_SOFT },
  bigTrack: { height: 10, borderRadius: 5, backgroundColor: '#e0e8e0', marginTop: 10, overflow: 'hidden' },
  bigFill: { height: 10, borderRadius: 5, backgroundColor: '#fbc02d' },
  group: { alignSelf: 'stretch', marginTop: 20 },
  groupHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  groupName: { flex: 1, fontSize: 16, fontWeight: '800', color: GREEN_DARK },
  groupCount: { color: TEXT_SOFT, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'transparent',
    padding: 12,
    marginBottom: 8,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '800', color: GREEN_DARK },
  nameLocked: { color: '#6f8470' },
  desc: { fontSize: 12.5, color: TEXT_SOFT, marginTop: 1 },
  status: { fontSize: 12.5, fontWeight: '800', marginTop: 6 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  track: { flex: 1, height: 7, borderRadius: 4, backgroundColor: '#e0e8e0', overflow: 'hidden' },
  fill: { height: 7, borderRadius: 4 },
  progressText: { fontSize: 11.5, fontWeight: '700', color: TEXT_SOFT },
});
