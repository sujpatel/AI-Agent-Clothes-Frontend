import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, Layout, ZoomOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EditItemModal } from '@/components/edit-item-modal';
import { LoadablePhoto } from '@/components/loadable-photo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_BASE_URL } from '@/config/api';
import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useWardrobe, WardrobeItem } from '@/context/wardrobe-context';

const CATEGORIES = ['top', 'bottom', 'shoes', 'outerwear', 'accessory'];
const FILTERS = ['all', ...CATEGORIES];

export default function GalleryScreen() {
  const { items, loading, error, fetchItems, addToLaundry, updateItem, deleteItem } = useWardrobe();
  const [refreshing, setRefreshing] = useState(false);
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const lineColor = useThemeColor({}, 'line');
  const mutedColor = useThemeColor({}, 'muted');
  const accentColor = useThemeColor({}, 'tint');

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  }, [fetchItems]);

  const confirmDelete = useCallback(
    (item: WardrobeItem) => {
      Alert.alert('Delete this item?', 'This removes it from your wardrobe permanently.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteItem(item.id) },
      ]);
    },
    [deleteItem]
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.masthead}>
          <ThemedText style={[styles.eyebrow, { color: mutedColor }]}>{items.length} PIECES</ThemedText>
          <ThemedText style={styles.h1}>Wardrobe</ThemedText>
          <ThemedView style={[styles.rule, { backgroundColor: lineColor }]} />
        </ThemedView>

        {loading && <ActivityIndicator size="large" style={styles.spacing} />}

        {error && !loading && (
          <ThemedView style={styles.errorRow}>
            <ThemedText style={{ color: mutedColor }}>{error}</ThemedText>
            <Pressable style={[styles.button, styles.errorButton, { backgroundColor: textColor }]} onPress={fetchItems}>
              <ThemedText style={[styles.buttonText, { color: bgColor }]}>RETRY</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {!loading && !error && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterRow}>
              {FILTERS.map((filter) => {
                const count = filter === 'all' ? items.length : items.filter((item) => item.category === filter).length;
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
              style={styles.gridScroll}
              contentContainerStyle={styles.scrollContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
              {(() => {
                const filteredItems =
                  selectedFilter === 'all' ? items : items.filter((item) => item.category === selectedFilter);

                if (filteredItems.length === 0) {
                  return (
                    <ThemedText style={[styles.emptyNote, { color: mutedColor }]}>
                      Nothing here yet.
                    </ThemedText>
                  );
                }

                return (
                  <View style={styles.grid}>
                    {filteredItems.map((item) => {
                      const inLaundry = item.available === false;
                      return (
                        <ThemedView key={item.id} style={styles.card}>
                          <Pressable onPress={() => !inLaundry && addToLaundry(item.id)} disabled={inLaundry}>
                            <ThemedView style={[styles.swatch, { backgroundColor: bgColor, borderColor: lineColor }]}>
                              <LoadablePhoto uri={`${API_BASE_URL}/photos/${item.id}`} style={styles.photo} />
                              <Pressable style={[styles.iconBtn, styles.editBtn]} onPress={() => setEditingItem(item)}>
                                <IconSymbol name="pencil" size={13} color="#fff" />
                              </Pressable>
                              <Pressable style={[styles.iconBtn, styles.delBtn]} onPress={() => confirmDelete(item)}>
                                <IconSymbol name="trash" size={13} color="#fff" />
                              </Pressable>
                            </ThemedView>
                          </Pressable>
                          {inLaundry && (
                            <ThemedText style={[styles.statusTag, { color: accentColor }]}>IN LAUNDRY</ThemedText>
                          )}
                        </ThemedView>
                      );
                    })}
                  </View>
                );
              })()}
            </ScrollView>
          </>
        )}

        <EditItemModal
          item={editingItem}
          visible={editingItem !== null}
          onClose={() => setEditingItem(null)}
          onSave={updateItem}
        />
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
  filterScroll: {
    flexGrow: 0,
    marginBottom: 18,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 22,
  },
  gridScroll: {
    flex: 1,
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
  scrollContent: {
    gap: 18,
    paddingBottom: 32,
  },
  emptyNote: {
    fontFamily: Fonts.serif,
    fontStyle: 'italic',
    fontSize: 16,
    paddingTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingTop: 4,
  },
  card: {
    width: '47%',
    gap: 6,
    backgroundColor: 'transparent',
  },
  swatch: {
    position: 'relative',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
  },
  statusTag: {
    fontFamily: Fonts.mono,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  iconBtn: {
    position: 'absolute',
    top: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    left: 8,
    backgroundColor: 'rgba(23,20,15,0.55)',
  },
  delBtn: {
    right: 8,
    backgroundColor: 'rgba(23,20,15,0.55)',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
