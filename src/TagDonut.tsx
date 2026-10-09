import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { tagColor } from './species';
import { fmtDuration } from './stats';
import { GREEN_DARK, TEXT_SOFT } from './theme';

type Item = { tag: string; minutes: number };

const SIZE = 140;
const STROKE = 24;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const GAP = 2; // jarak antar irisan (px)

const pct = (v: number) => (v > 0 && v < 1 ? '<1%' : `${Math.round(v)}%`);

// Diagram donat pembagian waktu fokus per kegiatan, dengan legenda persentase.
export default function TagDonut({ items }: { items: Item[] }) {
  const total = items.reduce((a, t) => a + t.minutes, 0);
  if (total <= 0) return null;

  let offset = 0;
  const slices = items.map((t) => {
    const share = t.minutes / total;
    const len = Math.max(0, share * C - (items.length > 1 ? GAP : 0));
    const slice = { ...t, share, len, offset };
    offset += share * C;
    return slice;
  });

  return (
    <View style={styles.row}>
      <View style={styles.donut}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="#e0e8e0" strokeWidth={STROKE} fill="none" />
          {slices.map((s) => (
            <Circle
              key={s.tag}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke={tagColor(s.tag)}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${s.len} ${C - s.len}`}
              strokeDashoffset={-s.offset}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          ))}
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.centerTotal}>{fmtDuration(total)}</Text>
        </View>
      </View>

      <View style={styles.legend}>
        {slices.map((s) => (
          <View key={s.tag} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: tagColor(s.tag) }]} />
            <Text style={styles.name} numberOfLines={1}>
              {s.tag}
            </Text>
            <Text style={styles.pct}>{pct(s.share * 100)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  donut: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center', width: SIZE - STROKE * 2 - 8 },
  centerTotal: { fontSize: 13, fontWeight: '800', color: GREEN_DARK, textAlign: 'center' },
  legend: { flex: 1, gap: 8 },
  item: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  name: { flex: 1, color: GREEN_DARK, fontWeight: '600' },
  pct: { color: TEXT_SOFT, fontWeight: '700' },
});
