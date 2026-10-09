import React, { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { DAILY_REWARDS, DailyView } from './daily';
import { BORDER, GREEN, GREEN_DARK, TEXT_SOFT } from './theme';

type Props = {
  visible: boolean;
  view: DailyView;
  onClose: () => void;
  onClaim: () => void;
};

const GOLD = '#f9a825';

function Tile({ day, view, pulse }: { day: number; view: DailyView; pulse: Animated.Value }) {
  const claimed = day <= view.claimedUpTo;
  const today = view.canClaim && day === view.nextDay;
  const bonus = day === DAILY_REWARDS.length;

  return (
    <Animated.View
      style={[
        styles.tile,
        bonus && styles.tileWide,
        claimed && styles.tileClaimed,
        today && styles.tileToday,
        today && { transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }] },
      ]}
    >
      <Text style={[styles.dayLabel, today && { color: '#8a5a00' }]}>Hari {day}</Text>
      <Text style={styles.icon}>{claimed ? '✅' : bonus ? '🎁' : '🪙'}</Text>
      <Text style={[styles.amount, claimed && { color: GREEN }, today && { color: '#8a5a00' }]}>
        +{DAILY_REWARDS[day - 1]}
      </Text>
    </Animated.View>
  );
}

// Kalender hadiah koin 7 hari. Klaim berturut-turut; lewat sehari atau selesai hari ke-7 mengulang dari hari ke-1.
export default function DailyRewardModal({ visible, view, onClose, onClaim }: Props) {
  const [pulse] = useState(() => new Animated.Value(0));
  const [float] = useState(() => new Animated.Value(0));
  const [gain, setGain] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, pulse]);

  const claim = () => {
    if (!view.canClaim) return;
    setGain(view.reward);
    float.setValue(0);
    Animated.timing(float, { toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    onClaim();
  };

  const days = DAILY_REWARDS.map((_, i) => i + 1);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>🎁 Hadiah Harian</Text>
          <Text style={styles.sub}>
            Klaim setiap hari agar hadiahnya naik. Kalau terlewat sehari, hitungan kembali ke Hari 1.
          </Text>

          <View style={styles.grid}>
            <View style={styles.row}>
              {days.slice(0, 4).map((d) => (
                <Tile key={d} day={d} view={view} pulse={pulse} />
              ))}
            </View>
            <View style={styles.row}>
              {days.slice(4).map((d) => (
                <Tile key={d} day={d} view={view} pulse={pulse} />
              ))}
            </View>
          </View>

          <View style={styles.claimWrap}>
            <Pressable style={[styles.claimBtn, !view.canClaim && styles.claimOff]} onPress={claim} disabled={!view.canClaim}>
              <Text style={[styles.claimText, !view.canClaim && styles.claimTextOff]}>
                {view.canClaim ? `Klaim +${view.reward} koin` : 'Sudah diklaim hari ini ✓'}
              </Text>
            </Pressable>
            {/* tinggi baris ini selalu dipesan supaya kotak tidak bergeser setelah klaim */}
            <Text style={[styles.next, view.canClaim && styles.nextHidden]}>
              Besok: Hari {view.nextDay}, +{view.reward} koin
            </Text>
            <Animated.Text
              pointerEvents="none"
              style={[
                styles.floatCoin,
                {
                  opacity: float.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] }),
                  transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -70] }) }],
                },
              ]}
            >
              +{gain} 🪙
            </Animated.Text>
          </View>

          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.close}>Tutup</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10, 40, 20, 0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  sheet: { alignSelf: 'stretch', backgroundColor: '#fff', borderRadius: 26, padding: 18, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: GREEN_DARK },
  sub: { fontSize: 13, color: TEXT_SOFT, textAlign: 'center', marginTop: 4, marginBottom: 14 },
  grid: { alignSelf: 'stretch', gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#f1f5f1',
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  tileWide: { flex: 2.4 },
  tileClaimed: { backgroundColor: '#e3f4e3', borderColor: '#81c784' },
  tileToday: { backgroundColor: '#fff4d6', borderColor: GOLD, borderWidth: 2.5, boxShadow: `0 0 14px 2px ${GOLD}88` },
  dayLabel: { fontSize: 11, fontWeight: '700', color: TEXT_SOFT },
  icon: { fontSize: 24, marginVertical: 4 },
  amount: { fontSize: 15, fontWeight: '800', color: GREEN_DARK },
  claimWrap: { alignItems: 'center', marginTop: 18 },
  claimBtn: { backgroundColor: GOLD, paddingHorizontal: 34, paddingVertical: 13, borderRadius: 26 },
  claimOff: { backgroundColor: '#e3e9e3' },
  claimText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  claimTextOff: { color: '#6f8470' },
  next: { marginTop: 8, color: TEXT_SOFT, fontSize: 12.5 },
  nextHidden: { opacity: 0 },
  floatCoin: { position: 'absolute', top: 6, fontSize: 24, fontWeight: '800', color: '#e65100' },
  close: { marginTop: 14, color: TEXT_SOFT, fontWeight: '700' },
});
