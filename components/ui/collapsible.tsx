import { PropsWithChildren, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const accent = useThemeColor({}, 'tint');
  const lineColor = useThemeColor({}, 'line');

  return (
    <ThemedView>
      <TouchableOpacity
        style={[styles.heading, { borderBottomColor: lineColor }]}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.7}>
        <ThemedText style={styles.title}>{title.toUpperCase()}</ThemedText>
        <ThemedText style={[styles.chevron, { color: accent, transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }]}>
          ›
        </ThemedText>
      </TouchableOpacity>
      {isOpen && <ThemedView style={styles.content}>{children}</ThemedView>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '700',
    width: 14,
    textAlign: 'center',
  },
  title: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  content: {
    marginTop: 12,
    marginBottom: 4,
  },
});
