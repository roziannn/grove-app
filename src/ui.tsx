import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

// Satu layar dengan scroll. Layar yang tidak aktif disembunyikan (bukan dibongkar)
// supaya timer dan posisi scroll tetap hidup saat pindah tab.
export function Screen({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <View style={[styles.fill, !active && styles.hidden]}>
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hidden: { display: 'none' },
  content: { alignItems: 'center', padding: 20, paddingTop: 48, paddingBottom: 120 },
});
