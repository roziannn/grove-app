import React, { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  icon: string;
  color: string;
  unlocked: boolean;
  size?: number;
  seed?: number; // menentukan gaya animasi supaya tiap ikon tidak seragam
};

// Ikon prestasi. Yang sudah terbuka bergerak pelan dan bercahaya; yang terkunci diam dan pudar.
// Ketuk untuk memantulkan ikon.
export default function AchievementBadge({ icon, color, unlocked, size = 56, seed = 0 }: Props) {
  const [loop] = useState(() => new Animated.Value(0));
  const [bounce] = useState(() => new Animated.Value(1));
  const variant = seed % 4;

  useEffect(() => {
    if (!unlocked) return;
    const dur = 1300 + (seed % 5) * 170;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(loop, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(loop, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [unlocked, seed, loop]);

  const pop = () => {
    bounce.setValue(0.7);
    Animated.spring(bounce, { toValue: 1, friction: 3, tension: 120, useNativeDriver: true }).start();
  };

  const iconMotion = {
    transform: [
      { scale: bounce },
      variant === 0 ? { translateY: loop.interpolate({ inputRange: [0, 1], outputRange: [2, -3] }) } : { translateY: 0 },
      variant === 1 || variant === 3
        ? { scale: loop.interpolate({ inputRange: [0, 1], outputRange: [1, variant === 1 ? 1.14 : 1.07] }) }
        : { scale: 1 },
      variant === 2
        ? { rotate: loop.interpolate({ inputRange: [0, 1], outputRange: ['-9deg', '9deg'] }) }
        : { rotate: '0deg' },
    ],
  };

  const d = size;
  return (
    <Pressable onPress={pop} hitSlop={6} style={{ width: d, height: d }}>
      {unlocked && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              width: d * 1.3,
              height: d * 1.3,
              borderRadius: d,
              left: -d * 0.15,
              top: -d * 0.15,
              backgroundColor: color,
              opacity: loop.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.34] }),
              transform: [{ scale: loop.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.08] }) }],
            },
          ]}
        />
      )}
      <View
        style={[
          styles.circle,
          { width: d, height: d, borderRadius: d / 2 },
          unlocked ? { backgroundColor: `${color}26`, borderColor: color } : styles.locked,
        ]}
      >
        <Animated.Text style={[{ fontSize: d * 0.5, opacity: unlocked ? 1 : 0.3 }, unlocked && iconMotion]}>{icon}</Animated.Text>
      </View>
      {unlocked ? (
        <Animated.Text
          pointerEvents="none"
          style={[styles.spark, { color, right: -2, top: -4, opacity: loop, transform: [{ scale: loop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.15] }) }] }]}
        >
          ✦
        </Animated.Text>
      ) : (
        <Text style={styles.lock}>🔒</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute' },
  circle: { alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  locked: { backgroundColor: '#e3e9e3', borderColor: '#cfd8cf' },
  spark: { position: 'absolute', fontSize: 16, fontWeight: '800' },
  lock: { position: 'absolute', right: -4, bottom: -4, fontSize: 14 },
});
