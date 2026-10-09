import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Tree from '../Tree';
import { Screen } from '../ui';
import { BORDER, GREEN, GREEN_DARK, TEXT_SOFT } from '../theme';
import { SPECIES, glowColor } from '../species';
import type { Profile } from '../storage';

type Props = {
  active: boolean;
  profile: Profile;
  coins: number;
  onChange: (p: Profile) => void;
};

export default function CollectionScreen({ active, profile, coins, onChange }: Props) {
  const buy = (id: string, name: string, price: number) => {
    if (coins < price) {
      Alert.alert('Koin belum cukup', `Kamu butuh ${price - coins} koin lagi. Selesaikan sesi fokus untuk mendapat koin.`);
      return;
    }
    Alert.alert(`Beli ${name}?`, `${price} koin akan terpakai.`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Beli', onPress: () => onChange({ ...profile, unlocked: [...profile.unlocked, id], selected: id }) },
    ]);
  };

  return (
    <Screen active={active}>
      <Text style={styles.title}>Koleksi Pohon</Text>
      <View style={styles.coinBox}>
        <Text style={styles.coinText}>🪙 {coins} koin</Text>
      </View>
      <Text style={styles.hint}>1 menit fokus yang berhasil = 1 koin. Pohon yang layu tidak memberi koin.</Text>

      <View style={styles.grid}>
        {[...SPECIES].sort((a, b) => a.price - b.price).map((sp) => {
          const owned = profile.unlocked.includes(sp.id);
          const selected = profile.selected === sp.id;
          return (
            <View
              key={sp.id}
              style={[
                styles.item,
                { backgroundColor: `${glowColor(sp)}26`, borderColor: `${glowColor(sp)}55` },
                selected && [styles.itemOn, { borderColor: glowColor(sp), boxShadow: `0 0 16px 2px ${glowColor(sp)}99` }],
              ]}
            >
              <Tree progress={1} species={sp} size={92} glow />
              <Text style={styles.name}>{sp.name}</Text>
              {owned ? (
                <Pressable
                  style={[styles.btn, selected && styles.btnDone]}
                  disabled={selected}
                  onPress={() => onChange({ ...profile, selected: sp.id })}
                >
                  <Text style={[styles.btnText, selected && styles.btnDoneText]}>{selected ? 'Dipakai' : 'Pakai'}</Text>
                </Pressable>
              ) : (
                <Pressable style={[styles.btn, styles.btnBuy]} onPress={() => buy(sp.id, sp.name, sp.price)}>
                  <Text style={styles.btnText}>🪙 {sp.price}</Text>
                </Pressable>
              )}
            </View>
          );
        })}
        {/* penyeimbang supaya baris terakhir tetap rata kiri */}
        {Array.from({ length: (3 - (SPECIES.length % 3)) % 3 }, (_, i) => (
          <View key={`pad${i}`} style={styles.pad} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', color: GREEN },
  coinBox: { marginTop: 10, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8 },
  coinText: { color: GREEN_DARK, fontWeight: '800', fontSize: 18 },
  hint: { color: TEXT_SOFT, fontSize: 13, textAlign: 'center', marginTop: 8, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignSelf: 'stretch' },
  pad: { width: '31.5%' },
  item: {
    width: '31.5%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 6,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemOn: { borderColor: GREEN },
  name: { fontWeight: '700', color: GREEN_DARK, marginTop: 2, fontSize: 12, textAlign: 'center', minHeight: 30 },
  btn: { marginTop: 6, backgroundColor: GREEN, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, minWidth: 74, alignItems: 'center' },
  btnBuy: { backgroundColor: '#f9a825' },
  btnDone: { backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: BORDER },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  btnDoneText: { color: GREEN },
});
