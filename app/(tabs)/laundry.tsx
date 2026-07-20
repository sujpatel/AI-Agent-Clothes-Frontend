import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Collapsible } from '@/components/ui/collapsible';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL } from '@/config/api';
import { useWardrobe } from '@/context/wardrobe-context';

const CATEGORIES = ['top', 'bottom', 'shoes', 'outerwear', 'accessory'];

export default function LaundryScreen() {
  const { items, loading, error, fetchItems, finishLaundry } = useWardrobe();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  }, [fetchItems]);

  const toggleSelected = useCallback((itemId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const handleFinishLaundry = useCallback(async () => {
    if (selected.size === 0) return;
    const idsToFinish = Array.from(selected);
    setBusy(true);
    setSelected(new Set());
    await finishLaundry(idsToFinish);
    setBusy(false);
  }, [selected, finishLaundry]);

  const inLaundry = items.filter((item) => item.available === false);

  return (
    <ThemedView style={styles.container} lightColor="#F4EFE6" darkColor="#17150F">
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header} lightColor="#F4EFE6" darkColor="#17150F">
          <ThemedText style={styles.h1}>Laundry</ThemedText>
          <ThemedText style={styles.count} lightColor="#8B8477" darkColor="#9A9282">
            {inLaundry.length} items
          </ThemedText>
        </ThemedView>

        {loading && <ActivityIndicator size="large" style={styles.spacing} />}

        {error && !loading && (
          <ThemedView style={styles.errorRow} lightColor="#F4EFE6" darkColor="#17150F">
            <ThemedText lightColor="#8B8477" darkColor="#9A9282">
              {error}
            </ThemedText>
            <Pressable style={styles.retryButton} onPress={fetchItems}>
              <ThemedText type="defaultSemiBold" style={styles.retryText}>
                Retry
              </ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {!loading && !error && inLaundry.length === 0 && (
          <ThemedView style={styles.empty} lightColor="#F4EFE6" darkColor="#17150F">
            <ThemedText style={styles.emptyText} lightColor="#8B8477" darkColor="#9A9282">
              Nothing in the wash.{'\n'}Your wardrobe is fully stocked.
            </ThemedText>
          </ThemedView>
        )}

        {!loading && !error && inLaundry.length > 0 && (
          <>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
              {CATEGORIES.map((category) => {
                const categoryItems = inLaundry.filter((item) => item.category === category);
                if (categoryItems.length === 0) return null;
                return (
                  <Collapsible key={category} title={`${category} · ${categoryItems.length}`}>
                    <ThemedView style={styles.rowGroup}>
                      {categoryItems.map((item) => (
                        <Pressable
                          key={item.id}
                          onPress={() => toggleSelected(item.id)}
                          disabled={busy}>
                          <ThemedView style={styles.row} lightColor="#FFFFFF" darkColor="#221F17">
                            <ThemedView
                              style={[styles.checkbox, selected.has(item.id) && styles.checkboxChecked]}
                            />
                            <Image source={{ uri: `${API_BASE_URL}/photos/${item.id}` }} style={styles.thumb} />
                            <ThemedView style={styles.rowText}>
                              <ThemedText style={styles.rowMeta} lightColor="#8B8477" darkColor="#9A9282">
                                {item.color} · {item.pattern}
                              </ThemedText>
                            </ThemedView>
                          </ThemedView>
                        </Pressable>
                      ))}
                    </ThemedView>
                  </Collapsible>
                );
              })}
            </ScrollView>

            <Pressable
              style={[styles.button, selected.size === 0 && styles.buttonDisabled]}
              onPress={handleFinishLaundry}
              disabled={busy || selected.size === 0}>
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                {busy ? 'Working…' : `Finish laundry · ${selected.size} selected`}
              </ThemedText>
            </Pressable>
          </>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  count: {
    fontSize: 12,
    fontWeight: '600',
  },
  spacing: {
    marginTop: 24,
  },
  errorRow: {
    marginTop: 24,
    alignItems: 'center',
    gap: 10,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#C05A2E',
  },
  retryText: {
    color: '#F4EFE6',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  scrollContent: {
    gap: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
  rowGroup: {
    gap: 8,
    paddingTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 14,
  },
  rowText: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  rowMeta: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ccc',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#C05A2E',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#C05A2E',
  },
  button: {
    alignSelf: 'stretch',
    paddingVertical: 15,
    borderRadius: 100,
    alignItems: 'center',
    backgroundColor: '#C05A2E',
    marginTop: 4,
    marginBottom: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#F4EFE6',
  },
});
