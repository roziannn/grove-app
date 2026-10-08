import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import IsoForest, { FOREST_CAPACITY } from '../IsoForest';
import { Screen } from '../ui';
import { BORDER, GREEN, GREEN_DARK, TEXT_SOFT } from '../theme';
import { Range, bucketMinutes, fmtDuration, getPeriod, inPeriod, tagTotals } from '../stats';
import type { Session } from '../storage';

const RANGES: { key: Range; label: string }[] = [
  { key: 'day', label: 'Hari' },
  { key: 'week', label: 'Minggu' },
  { key: 'month', label: 'Bulan' },
  { key: 'year', label: 'Tahun' },
];

const CHART_H = 120;

export default function StatsScreen({ active, sessions }: { active: boolean; sessions: Session[] }) {
  const [range, setRange] = useState<Range>('day');
  const [offset, setOffset] = useState(0);

  const period = useMemo(() => getPeriod(range, offset), [range, offset]);
  const inRange = useMemo(() => inPeriod(sessions, period), [sessions, period]);
  const grown = useMemo(() => inRange.filter((s) => s.ok), [inRange]);
  const withered = inRange.length - grown.length;
  const totalMinutes = grown.reduce((a, s) => a + s.minutes, 0);
  const buckets = useMemo(() => bucketMinutes(grown, range, period), [grown, range, period]);
  const tags = useMemo(() => tagTotals(grown), [grown]);
  const max = Math.max(1, ...buckets.values);

  const lifetimeMinutes = sessions.filter((s) => s.ok).reduce((a, s) => a + s.minutes, 0);
  const lifetimeTrees = sessions.filter((s) => s.ok).length;

  const pick = (r: Range) => {
    setRange(r);
    setOffset(0);
  };

  return (
    <Screen active={active}>
      <View style={styles.segment}>
        {RANGES.map((r) => (
          <Pressable key={r.key} onPress={() => pick(r.key)} style={[styles.seg, range === r.key && styles.segOn]}>
            <Text style={[styles.segText, range === r.key && styles.segTextOn]}>{r.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.nav}>
        <Pressable onPress={() => setOffset(offset - 1)} hitSlop={12}>
          <Text style={styles.arrow}>‹</Text>
        </Pressable>
        <Text style={styles.navLabel}>{period.label}</Text>
        <Pressable onPress={() => setOffset(offset + 1)} disabled={offset >= 0} hitSlop={12}>
          <Text style={[styles.arrow, offset >= 0 && styles.arrowOff]}>›</Text>
        </Pressable>
      </View>

      <IsoForest sessions={inRange} />
      {inRange.length > FOREST_CAPACITY && (
        <Text style={styles.more}>+{inRange.length - FOREST_CAPACITY} pohon lagi tidak muat di petak</Text>
      )}

      <View style={styles.summary}>
        <Text style={styles.total}>{fmtDuration(totalMinutes)}</Text>
        <View style={styles.counts}>
          <Text style={styles.count}>🌳 {grown.length}</Text>
          <Text style={styles.count}>🥀 {withered}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Waktu fokus</Text>
        {totalMinutes === 0 ? (
          <Text style={styles.empty}>Belum ada fokus di periode ini.</Text>
        ) : (
          <>
            <Text style={styles.axis}>{fmtDuration(max)}</Text>
            <View style={styles.chart}>
              {buckets.values.map((v, i) => (
                <View key={i} style={styles.col}>
                  <View style={[styles.bar, { height: v > 0 ? Math.max(4, (v / max) * CHART_H) : 2 }, v === 0 && styles.barEmpty]} />
                </View>
              ))}
            </View>
            <View style={styles.xRow}>
              {buckets.labels.map((l, i) => (
                <Text key={i} style={styles.xLabel} numberOfLines={1}>
                  {l}
                </Text>
              ))}
            </View>
          </>
        )}
      </View>

      {tags.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Per kegiatan</Text>
          {tags.map((t) => (
            <View key={t.tag} style={styles.tagRow}>
              <View style={styles.tagHead}>
                <Text style={styles.tagName}>{t.tag}</Text>
                <Text style={styles.tagMin}>{fmtDuration(t.minutes)}</Text>
              </View>
              <View style={styles.tagTrack}>
                <View style={[styles.tagFill, { width: `${(t.minutes / totalMinutes) * 100}%` }]} />
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sepanjang waktu</Text>
        <Text style={styles.life}>
          {lifetimeTrees} pohon tumbuh · {fmtDuration(lifetimeMinutes)} fokus
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  seg: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segOn: { backgroundColor: GREEN },
  segText: { color: GREEN, fontWeight: '600' },
  segTextOn: { color: '#fff' },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', marginVertical: 14 },
  navLabel: { fontSize: 17, fontWeight: '700', color: GREEN_DARK },
  arrow: { fontSize: 32, color: GREEN, paddingHorizontal: 8, lineHeight: 34 },
  arrowOff: { opacity: 0.25 },
  more: { color: TEXT_SOFT, fontSize: 12, marginTop: 4 },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', marginTop: 12 },
  total: { fontSize: 22, fontWeight: '800', color: GREEN_DARK },
  counts: { flexDirection: 'row', gap: 14 },
  count: { fontSize: 18, fontWeight: '700', color: GREEN_DARK },
  card: { alignSelf: 'stretch', marginTop: 16, backgroundColor: '#fff', borderRadius: 20, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: GREEN, marginBottom: 8 },
  empty: { color: '#8a9a8b', fontStyle: 'italic' },
  axis: { fontSize: 11, color: TEXT_SOFT, marginBottom: 4 },
  chart: { height: CHART_H, flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  col: { flex: 1, justifyContent: 'flex-end' },
  bar: { backgroundColor: '#66bb6a', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  barEmpty: { backgroundColor: '#e0e8e0' },
  xRow: { flexDirection: 'row', marginTop: 4 },
  xLabel: { flex: 1, fontSize: 10, color: TEXT_SOFT, textAlign: 'center' },
  tagRow: { marginTop: 8 },
  tagHead: { flexDirection: 'row', justifyContent: 'space-between' },
  tagName: { color: GREEN_DARK, fontWeight: '600' },
  tagMin: { color: TEXT_SOFT },
  tagTrack: { height: 8, borderRadius: 4, backgroundColor: '#e0e8e0', marginTop: 4, overflow: 'hidden' },
  tagFill: { height: 8, borderRadius: 4, backgroundColor: '#66bb6a' },
  life: { color: TEXT_SOFT },
});
