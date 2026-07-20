import { PropsWithChildren, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useColorScheme() ?? 'light';
  const rust = theme === 'light' ? '#C05A2E' : '#D97E51';

  return (
    <ThemedView>
      <TouchableOpacity
        style={styles.heading}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}>
        <ThemedText style={[styles.chevron, { color: rust, transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }]}>
          ›
        </ThemedText>

        <ThemedText type="defaultSemiBold" style={styles.title}>
          {title}
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
    gap: 8,
    paddingVertical: 4,
  },
  chevron: {
    fontSize: 18,
    fontWeight: '700',
    width: 14,
    textAlign: 'center',
  },
  title: {
    textTransform: 'capitalize',
    fontSize: 15,
  },
  content: {
    marginTop: 8,
    marginLeft: 6,
  },
});
