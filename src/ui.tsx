import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

// Satu layar dengan scroll. Layar yang tidak aktif disembunyikan (bukan dibongkar)
// supaya timer dan posisi scroll tetap hidup saat pindah tab.
export function Screen({
  active,
  grow = false,
  children,
}: {
  active: boolean;
  grow?: boolean; // true: isi memenuhi tinggi layar sehingga bisa dipusatkan dengan flex
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.fill, !active && styles.hidden]}>
      <ScrollView contentContainerStyle={[styles.content, grow && styles.grow]}>{children}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hidden: { display: 'none' },
  grow: { flexGrow: 1 },
  content: { alignItems: 'center', padding: 20, paddingTop: 48, paddingBottom: 120 },
});
