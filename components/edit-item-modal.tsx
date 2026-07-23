import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EditableFields, WardrobeItem } from '@/context/wardrobe-context';
import { useThemeColor } from '@/hooks/use-theme-color';

const CATEGORIES = ['top', 'bottom', 'shoes', 'outerwear', 'accessory'];
const SCALE = [1, 2, 3, 4, 5];

export function EditItemModal({
  item,
  visible,
  onClose,
  onSave,
}: {
  item: WardrobeItem | null;
  visible: boolean;
  onClose: () => void;
  onSave: (itemId: string, fields: EditableFields) => void;
}) {
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const lineColor = useThemeColor({}, 'line');
  const mutedColor = useThemeColor({}, 'muted');
  const accentColor = useThemeColor({}, 'tint');
  const [category, setCategory] = useState('top');
  const [color, setColor] = useState('');
  const [pattern, setPattern] = useState('');
  const [formality, setFormality] = useState(1);
  const [warmth, setWarmth] = useState(1);

  useEffect(() => {
    if (item) {
      setCategory(item.category);
      setColor(item.color);
      setPattern(item.pattern);
      setFormality(item.formality);
      setWarmth(item.warmth);
    }
  }, [item]);

  if (!item) return null;

  const handleSave = () => {
    onSave(item.id, { category: category as WardrobeItem['category'], color, pattern, formality, warmth });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ThemedView style={[styles.sheet, { backgroundColor: cardColor }]}>
          <ThemedText type="title" style={styles.title}>
            Edit item
          </ThemedText>

          <ThemedText style={[styles.label, { color: mutedColor }]}>Category</ThemedText>
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c}
                style={[
                  styles.chip,
                  { borderColor: lineColor },
                  category === c && { backgroundColor: accentColor, borderColor: accentColor },
                ]}
                onPress={() => setCategory(c)}>
                <ThemedText style={category === c ? { color: bgColor } : undefined}>{c}</ThemedText>
              </Pressable>
            ))}
          </View>

          <ThemedText style={[styles.label, { color: mutedColor }]}>Color</ThemedText>
          <TextInput
            style={[styles.input, { color: textColor, borderColor: lineColor }]}
            value={color}
            onChangeText={setColor}
            placeholder="e.g. navy blue"
            placeholderTextColor={mutedColor}
          />

          <ThemedText style={[styles.label, { color: mutedColor }]}>Pattern</ThemedText>
          <TextInput
            style={[styles.input, { color: textColor, borderColor: lineColor }]}
            value={pattern}
            onChangeText={setPattern}
            placeholder="e.g. solid, striped, plaid"
            placeholderTextColor={mutedColor}
          />

          <ThemedText style={[styles.label, { color: mutedColor }]}>Formality (1 casual – 5 formal)</ThemedText>
          <View style={styles.chipRow}>
            {SCALE.map((n) => (
              <Pressable
                key={n}
                style={[
                  styles.numChip,
                  { borderColor: lineColor },
                  formality === n && { backgroundColor: accentColor, borderColor: accentColor },
                ]}
                onPress={() => setFormality(n)}>
                <ThemedText style={formality === n ? { color: bgColor } : undefined}>{n}</ThemedText>
              </Pressable>
            ))}
          </View>

          <ThemedText style={[styles.label, { color: mutedColor }]}>Warmth (1 light – 5 warm)</ThemedText>
          <View style={styles.chipRow}>
            {SCALE.map((n) => (
              <Pressable
                key={n}
                style={[
                  styles.numChip,
                  { borderColor: lineColor },
                  warmth === n && { backgroundColor: accentColor, borderColor: accentColor },
                ]}
                onPress={() => setWarmth(n)}>
                <ThemedText style={warmth === n ? { color: bgColor } : undefined}>{n}</ThemedText>
              </Pressable>
            ))}
          </View>

          <View style={styles.actionRow}>
            <Pressable style={[styles.button, styles.cancelButton, { borderColor: textColor }]} onPress={onClose}>
              <ThemedText type="defaultSemiBold">Cancel</ThemedText>
            </Pressable>
            <Pressable style={[styles.button, { backgroundColor: textColor }]} onPress={handleSave}>
              <ThemedText type="defaultSemiBold" style={{ color: bgColor }}>
                Save
              </ThemedText>
            </Pressable>
          </View>
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
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
  },
  numChip: {
    width: 40,
    height: 40,
    borderRadius: 100,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
});
