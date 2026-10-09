import React, { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import AchievementBadge from './AchievementBadge';
import { Achievement, GROUP_COLORS } from './achievements';
import { GREEN_DARK } from './theme';

// Banner yang meluncur dari atas saat prestasi baru terbuka. Hilang sendiri setelah beberapa detik.
export default function AchievementToast({ achievement, onDone }: { achievement: Achievement; onDone: () => void }) {
  const [y] = useState(() => new Animated.Value(-160));
  const color = GROUP_COLORS[achievement.group];

  useEffect(() => {
    Animated.spring(y, { toValue: 0, friction: 6, tension: 80, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(y, { toValue: -160, duration: 250, useNativeDriver: true }).start(onDone);
    }, 3800);
    return () => clearTimeout(t);
  }, [y, onDone]);

  return (
    <Animated.View style={[styles.wrap, { transform: [{ translateY: y }] }]} pointerEvents="box-none">
      <Pressable onPress={onDone} style={[styles.card, { borderColor: color, boxShadow: `0 0 18px 2px ${color}88` }]}>
        <AchievementBadge icon={achievement.icon} color={color} unlocked size={52} seed={3} />
        <View style={styles.text}>
          <Text style={[styles.kicker, { color }]}>PRESTASI BARU!</Text>
          <Text style={styles.name}>{achievement.name}</Text>
          <Text style={styles.desc} numberOfLines={2}>
            {achievement.desc}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 44, left: 16, right: 16, zIndex: 50, elevation: 30 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 2,
    padding: 14,
  },
  text: { flex: 1 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  name: { fontSize: 18, fontWeight: '800', color: GREEN_DARK },
  desc: { fontSize: 13, color: '#5f7a61' },
});
