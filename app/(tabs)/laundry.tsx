import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadablePhoto } from '@/components/loadable-photo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL } from '@/config/api';
import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useWardrobe } from '@/context/wardrobe-context';

const CATEGORIES = ['top', 'bottom', 'shoes', 'outerwear', 'accessory'];
const FILTERS = ['all', ...CATEGORIES];

export default function LaundryScreen() {
  const { items, loading, error, fetchItems, finishLaundry } = useWardrobe();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const lineColor = useThemeColor({}, 'line');
  const mutedColor = useThemeColor({}, 'muted');
  const accentColor = useThemeColor({}, 'tint');

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
  const filteredItems =
    selectedFilter === 'all' ? inLaundry : inLaundry.filter((item) => item.category === selectedFilter);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.masthead}>
          <ThemedText style={[styles.eyebrow, { color: mutedColor }]}>{inLaundry.length} IN THE WASH</ThemedText>
          <ThemedText style={styles.h1}>Laundry</ThemedText>
          <ThemedView style={[styles.rule, { backgroundColor: lineColor }]} />
        </ThemedView>

        {loading && <ActivityIndicator size="large" style={styles.spacing} />}

        {error && !loading && (
          <ThemedView style={styles.errorRow}>
            <ThemedText style={{ color: mutedColor }}>{error}</ThemedText>
            <Pressable
              style={[styles.button, styles.errorButton, { backgroundColor: textColor }]}
              onPress={() => fetchItems()}>
              <ThemedText style={[styles.buttonText, { color: bgColor }]}>RETRY</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {!loading && !error && inLaundry.length === 0 && (
          <ThemedView style={styles.empty}>
            <ThemedText style={styles.emptyText}>
              Nothing in the wash.{'\n'}Your wardrobe is fully stocked.
            </ThemedText>
          </ThemedView>
        )}

        {!loading && !error && inLaundry.length > 0 && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterRow}>
              {FILTERS.map((filter) => {
                const count =
                  filter === 'all' ? inLaundry.length : inLaundry.filter((item) => item.category === filter).length;
                if (filter !== 'all' && count === 0) return null;
                const active = selectedFilter === filter;
                return (
                  <Pressable
                    key={filter}
                    style={[styles.tab, active && { borderBottomColor: accentColor }]}
                    onPress={() => setSelectedFilter(filter)}>
                    <ThemedText style={[styles.tabText, { color: active ? textColor : mutedColor }]}>
                      {filter.toUpperCase()}
                    </ThemedText>
                    <ThemedText style={[styles.tabCount, { color: active ? accentColor : mutedColor }]}>
                      {count}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>

            <ScrollView
              style={styles.listScroll}
              contentContainerStyle={styles.scrollContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
              <ThemedView style={styles.rowGroup}>
                {filteredItems.map((item) => {
                  const isSelected = selected.has(item.id);
                  return (
                    <Pressable key={item.id} onPress={() => toggleSelected(item.id)} disabled={busy}>
                      <ThemedView style={[styles.row, { backgroundColor: cardColor }]}>
                        <ThemedView
                          style={[
                            styles.checkbox,
                            { borderColor: isSelected ? accentColor : lineColor },
                            isSelected && { backgroundColor: accentColor },
                          ]}
                        />
                        <LoadablePhoto
                          uri={`${API_BASE_URL}/photos/${item.id}`}
                          style={[styles.thumb, { backgroundColor: lineColor }]}
                        />
                        <ThemedView style={styles.rowText}>
                          <ThemedText style={styles.rowTitle}>{item.color}</ThemedText>
                          <ThemedText style={[styles.rowMeta, { color: mutedColor }]}>
                            {item.pattern.toUpperCase()}
                          </ThemedText>
                        </ThemedView>
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </ThemedView>
            </ScrollView>

            <Pressable
              style={[styles.button, { backgroundColor: textColor }, selected.size === 0 && styles.buttonDisabled]}
              onPress={handleFinishLaundry}
              disabled={busy || selected.size === 0}>
              <ThemedText style={[styles.buttonText, { color: bgColor }]}>
                {busy ? 'WORKING…' : `FINISH LAUNDRY · ${selected.size}`}
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
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  masthead: {
    gap: 8,
    marginBottom: 18,
  },
  eyebrow: {
    fontFamily: Fonts.mono,
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  h1: {
    fontFamily: Fonts.serif,
    fontSize: 46,
    lineHeight: 50,
    fontWeight: '600',
    letterSpacing: -1,
  },
  rule: {
    height: 1,
    width: '100%',
  },
  spacing: {
    marginTop: 24,
  },
  errorRow: {
    marginTop: 24,
    alignItems: 'center',
    gap: 12,
  },
  errorButton: {
    alignSelf: 'center',
    paddingHorizontal: 32,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyText: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26,
  },
  filterScroll: {
    flexGrow: 0,
    marginBottom: 18,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 22,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 3,
    paddingBottom: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tabCount: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    marginTop: -2,
  },
  listScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  rowGroup: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 10,
    borderRadius: 14,
  },
  rowText: {
    flex: 1,
    backgroundColor: 'transparent',
    gap: 1,
  },
  rowTitle: {
    fontFamily: Fonts.serif,
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  rowMeta: {
    fontFamily: Fonts.mono,
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 1,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  button: {
    alignSelf: 'stretch',
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
