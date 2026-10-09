import React, { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GREEN_DARK, TEXT_SOFT } from './theme';

// Pilihan durasi: urutan pertama = tes 10 detik (ikon jam), lalu 5..120 menit per 5 menit.
export const STEPS: number[] = [10 / 60, ...Array.from({ length: 24 }, (_, i) => (i + 1) * 5)];
export const DEFAULT_MINUTES = 25;

const TICK_W = 22;

export const stepLabel = (m: number) => (m < 1 ? '10 detik · tes' : `${m} menit`);

type Props = { value: number; onChange: (minutes: number) => void };

// Penggeser durasi berbentuk penggaris: geser kiri-kanan, garis di tengah adalah pilihan.
export default function DurationPicker({ value, onChange }: Props) {
  const [width, setWidth] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const placed = useRef(false);
  const index = Math.max(0, STEPS.indexOf(value));

  // Letakkan penggaris di nilai awal begitu lebarnya diketahui.
  useEffect(() => {
    if (width === 0 || placed.current) return;
    placed.current = true;
    const t = setTimeout(() => scroller.current?.scrollTo({ x: index * TICK_W, animated: false }), 0);
    return () => clearTimeout(t);
  }, [width, index]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.min(STEPS.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.x / TICK_W)));
    if (STEPS[i] !== value) onChange(STEPS[i]);
  };

  const jump = (i: number) => {
    scroller.current?.scrollTo({ x: i * TICK_W, animated: true });
    onChange(STEPS[i]);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.big}>{stepLabel(value)}</Text>
      <View style={styles.ruler} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <ScrollView
          ref={scroller}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TICK_W}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={onScroll}
          contentContainerStyle={{ paddingHorizontal: Math.max(0, (width - TICK_W) / 2) }}
        >
          {STEPS.map((v, i) => {
            const selected = i === index;
            const major = i > 0 && v % 15 === 0;
            return (
              <Pressable key={i} onPress={() => jump(i)} style={styles.box} accessibilityLabel={stepLabel(v)}>
                {i === 0 ? (
                  <Text style={[styles.clock, selected && styles.clockOn]}>⏱️</Text>
                ) : (
                  <View style={[styles.tick, major && styles.tickMajor, selected && styles.tickOn]} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', alignItems: 'center' },
  big: { fontSize: 30, fontWeight: '800', color: GREEN_DARK },
  ruler: { alignSelf: 'stretch', height: 46, marginTop: 8 },
  box: { width: TICK_W, height: 46, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6 },
  tick: { width: 2, height: 14, borderRadius: 1, backgroundColor: '#b7c7b8' },
  tickMajor: { height: 22, backgroundColor: '#8fa690' },
  tickOn: { width: 4, height: 32, borderRadius: 2, backgroundColor: GREEN_DARK },
  clock: { fontSize: 16, opacity: 0.45, color: TEXT_SOFT },
  clockOn: { opacity: 1, fontSize: 20 },
});
