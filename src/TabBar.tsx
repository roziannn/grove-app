import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GREEN_DARK } from './theme';

export type TabKey = 'focus' | 'stats' | 'collection';

const TABS: { key: TabKey; icon: string; label: string }[] = [
  { key: 'focus', icon: '🌱', label: 'Fokus' },
  { key: 'stats', icon: '📊', label: 'Statistik' },
  { key: 'collection', icon: '🌳', label: 'Koleksi' },
];

// Menu melayang di bawah layar.
export default function TabBar({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.bar}>
        {TABS.map((t) => {
          const on = t.key === active;
          return (
            <Pressable
              key={t.key}
              onPress={() => onChange(t.key)}
              style={[styles.tab, on && styles.tabOn]}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
            >
              <Text style={styles.icon}>{t.icon}</Text>
              <Text style={[styles.label, on && styles.labelOn]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 24, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    backgroundColor: GREEN_DARK,
    borderRadius: 34,
    padding: 6,
    gap: 4,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 28,
    minWidth: 84,
  },
  tabOn: { backgroundColor: '#43a047' },
  icon: { fontSize: 20 },
  label: { fontSize: 11, color: '#a5d6a7', marginTop: 2, fontWeight: '600' },
  labelOn: { color: '#fff' },
});
