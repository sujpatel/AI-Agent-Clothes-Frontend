import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

const STYLES = ['No preference', 'Minimalist', 'Classic', 'Streetwear', 'Vintage', 'Y2K', 'Bohemian'];

export function StyleProfileModal({
  visible,
  value,
  onClose,
  onSave,
}: {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSave: (style: string) => void;
}) {
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const lineColor = useThemeColor({}, 'line');
  const mutedColor = useThemeColor({}, 'muted');
  const accentColor = useThemeColor({}, 'tint');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ThemedView style={[styles.sheet, { backgroundColor: cardColor }]}>
          <ThemedText type="title" style={styles.title}>
            Your style
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: mutedColor }]}>
            When a few options fit the occasion equally well, we'll lean toward this aesthetic.
          </ThemedText>

          <View style={styles.chipRow}>
            {STYLES.map((s) => {
              const active = value === s;
              return (
                <Pressable
                  key={s}
                  style={[
                    styles.chip,
                    { borderColor: lineColor },
                    active && { backgroundColor: accentColor, borderColor: accentColor },
                  ]}
                  onPress={() => onSave(s)}>
                  <ThemedText style={active ? { color: bgColor } : undefined}>{s}</ThemedText>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={[styles.button, { backgroundColor: textColor }]} onPress={onClose}>
            <ThemedText type="defaultSemiBold" style={{ color: bgColor }}>
              Done
            </ThemedText>
          </Pressable>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 6,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
  },
  button: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: 'center',
  },
});
