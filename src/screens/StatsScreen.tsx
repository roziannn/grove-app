import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import IsoForest, { FOREST_CAPACITY } from '../IsoForest';
import TagDonut from '../TagDonut';
import { Screen } from '../ui';
import { BORDER, GREEN, GREEN_DARK, TEXT_SOFT } from '../theme';
import { SEASONS, getSeason } from '../seasons';
import { getSpecies, tagLabel } from '../species';
import Tree from '../Tree';
import { Range, bucketMinutes, fmtDuration, getPeriod, inPeriod, speciesRanking, tagTotals } from '../stats';
import type { Session } from '../storage';

const RANGES: { key: Range; label: string }[] = [
  { key: 'day', label: 'Hari' },
  { key: 'week', label: 'Minggu' },
  { key: 'month', label: 'Bulan' },
  { key: 'year', label: 'Tahun' },
];

const CHART_H = 120;

type Props = {
  active: boolean;
  sessions: Session[];
  season: string;
  onSeasonChange: (id: string) => void;
};

export default function StatsScreen({ active, sessions, season, onSeasonChange }: Props) {
  const [range, setRange] = useState<Range>('day');
  const [offset, setOffset] = useState(0);

  const period = useMemo(() => getPeriod(range, offset), [range, offset]);
  const inRange = useMemo(() => inPeriod(sessions, period), [sessions, period]);
  const grown = useMemo(() => inRange.filter((s) => s.ok), [inRange]);
  const withered = inRange.length - grown.length;
  const totalMinutes = grown.reduce((a, s) => a + s.minutes, 0);
  const buckets = useMemo(() => bucketMinutes(grown, range, period), [grown, range, period]);
  const tags = useMemo(() => tagTotals(grown), [grown]);
  const favorites = useMemo(() => speciesRanking(grown).slice(0, 3), [grown]);
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

      <IsoForest sessions={inRange} season={getSeason(season)} />

      <View style={styles.seasons}>
        {SEASONS.map((sn) => (
          <Pressable
            key={sn.id}
            onPress={() => onSeasonChange(sn.id)}
            style={[styles.season, season === sn.id && styles.seasonOn]}
            accessibilityLabel={`Musim ${sn.name}`}
          >
            <Text style={styles.seasonIcon}>{sn.icon}</Text>
            <Text style={[styles.seasonText, season === sn.id && styles.seasonTextOn]}>{sn.name}</Text>
          </Pressable>
        ))}
      </View>
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
                <Text style={styles.tagName}>{tagLabel(t.tag)}</Text>
                <Text style={styles.tagMin}>{fmtDuration(t.minutes)}</Text>
              </View>
              <View style={styles.tagTrack}>
                <View style={[styles.tagFill, { width: `${(t.minutes / totalMinutes) * 100}%` }]} />
              </View>
            </View>
          ))}
        </View>
      )}

      {tags.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Distribusi</Text>
          <TagDonut items={tags} />
        </View>
      )}

      {favorites.length > 0 && (
        <View style={styles.card}>
          <View style={styles.favHead}>
            <View style={styles.crown}>
              <Text style={styles.crownText}>👑</Text>
            </View>
            <Text style={[styles.cardTitle, styles.favTitle]}>Pohon favorit</Text>
          </View>
          <View style={styles.divider} />
          {favorites.map((f, i) => {
            const sp = getSpecies(f.id);
            return (
              <View key={f.id} style={styles.favRow}>
                <Text style={styles.favRank}>{i + 1}.</Text>
                <Tree progress={1} species={sp} size={60} />
                <View style={styles.favMid}>
                  <Text style={styles.favName} numberOfLines={1}>
                    {sp.name}
                  </Text>
                  <View style={styles.favTrack}>
                    <View
                      style={[styles.favFill, { width: `${(f.count / favorites[0].count) * 100}%`, backgroundColor: sp.mid }]}
                    />
                  </View>
                </View>
                <Text style={styles.favCount}>{f.count} kali</Text>
              </View>
            );
          })}
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
  seasons: { flexDirection: 'row', gap: 8, marginTop: 6 },
  season: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
  },
  seasonOn: { backgroundColor: GREEN, borderColor: GREEN },
  seasonIcon: { fontSize: 18 },
  seasonText: { fontSize: 11, fontWeight: '600', color: GREEN },
  seasonTextOn: { color: '#fff' },
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
  favHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  favTitle: { marginBottom: 0 },
  crown: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff4d6', alignItems: 'center', justifyContent: 'center' },
  crownText: { fontSize: 14 },
  divider: { height: 1, backgroundColor: '#eef2ee', marginVertical: 12 },
  favRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  favRank: { width: 22, fontSize: 17, fontWeight: '800', color: '#9db09e' },
  favMid: { flex: 1 },
  favName: { color: TEXT_SOFT, fontWeight: '600', marginBottom: 6 },
  favTrack: { height: 12, borderRadius: 6, backgroundColor: '#eef2ee', overflow: 'hidden' },
  favFill: { height: 12, borderRadius: 6 },
  favCount: { width: 52, textAlign: 'right', color: TEXT_SOFT, fontWeight: '700', fontSize: 13 },
  life: { color: TEXT_SOFT },
});
