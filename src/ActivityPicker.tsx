import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { TAGS, TAG_ICONS, tagColor, tagLabel } from './species';
import { GREEN, GREEN_DARK } from './theme';

type Props = {
  visible: boolean;
  selected: string;
  onSelect: (tag: string) => void;
  onClose: () => void;
};

// Lembar pilihan kegiatan yang muncul dari bawah.
export default function ActivityPicker({ visible, selected, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>Pilih kegiatan</Text>
          {TAGS.map((t) => {
            const on = t === selected;
            const color = tagColor(t);
            return (
              <Pressable
                key={t}
                style={[styles.row, on && { backgroundColor: `${color}1F`, borderColor: color }]}
                onPress={() => {
                  onSelect(t);
                  onClose();
                }}
              >
                <View style={[styles.icon, { backgroundColor: `${color}2E` }]}>
                  <Text style={styles.iconText}>{TAG_ICONS[t]}</Text>
                </View>
                <Text style={styles.name}>{tagLabel(t)}</Text>
                {on && <Text style={styles.check}>✓</Text>}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10, 40, 20, 0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 18, paddingBottom: 30 },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#d5ddd5', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', color: GREEN_DARK, marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginBottom: 4,
  },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 22 },
  name: { flex: 1, fontSize: 17, fontWeight: '700', color: GREEN_DARK },
  check: { fontSize: 20, fontWeight: '800', color: GREEN },
});
