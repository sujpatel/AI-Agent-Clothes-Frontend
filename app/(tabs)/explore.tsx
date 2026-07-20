import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EditItemModal } from '@/components/edit-item-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Collapsible } from '@/components/ui/collapsible';
import { API_BASE_URL } from '@/config/api';
import { useWardrobe, WardrobeItem } from '@/context/wardrobe-context';

const CATEGORIES = ['top', 'bottom', 'shoes', 'outerwear', 'accessory'];

export default function GalleryScreen() {
  const { items, loading, error, fetchItems, addToLaundry, updateItem, deleteItem } = useWardrobe();
  const [refreshing, setRefreshing] = useState(false);
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);

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
    <ThemedView style={styles.container} lightColor="#F4EFE6" darkColor="#17150F">
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header} lightColor="#F4EFE6" darkColor="#17150F">
          <ThemedText style={styles.h1}>Wardrobe</ThemedText>
          <ThemedText style={styles.count} lightColor="#8B8477" darkColor="#9A9282">
            {items.length} items
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

        {!loading && !error && (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
            {CATEGORIES.map((category) => {
              const categoryItems = items.filter((item) => item.category === category);
              return (
                <Collapsible key={category} title={`${category} · ${categoryItems.length}`}>
                  {categoryItems.length === 0 ? (
                    <ThemedText lightColor="#8B8477" darkColor="#9A9282">
                      No items yet.
                    </ThemedText>
                  ) : (
                    <View style={styles.grid}>
                      {categoryItems.map((item) => {
                        const inLaundry = item.available === false;
                        return (
                          <ThemedView key={item.id} style={styles.card} lightColor="#FFFFFF" darkColor="#221F17">
                            <Pressable
                              onPress={() => !inLaundry && addToLaundry(item.id)}
                              disabled={inLaundry}>
                              <ThemedView style={styles.swatch} lightColor="#F4EFE6" darkColor="#17150F">
                                <Image
                                  source={{ uri: `${API_BASE_URL}/photos/${item.id}` }}
                                  style={styles.photo}
                                  contentFit="cover"
                                />
                                <Pressable style={[styles.iconBtn, styles.editBtn]} onPress={() => setEditingItem(item)}>
                                  <IconSymbol name="pencil" size={13} color="#fff" />
                                </Pressable>
                                <Pressable style={[styles.iconBtn, styles.delBtn]} onPress={() => confirmDelete(item)}>
                                  <IconSymbol name="trash" size={13} color="#fff" />
                                </Pressable>
                              </ThemedView>
                            </Pressable>
                            <ThemedText style={styles.meta}>
                              {item.color} · {item.pattern}
                            </ThemedText>
                            {inLaundry ? (
                              <ThemedText style={styles.laundryTag} lightColor="#C05A2E" darkColor="#D97E51">
                                In laundry
                              </ThemedText>
                            ) : (
                              <ThemedText style={styles.addHint} lightColor="#8B8477" darkColor="#9A9282">
                                Tap to send to laundry
                              </ThemedText>
                            )}
                          </ThemedView>
                        );
                      })}
                    </View>
                  )}
                </Collapsible>
              );
            })}
          </ScrollView>
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
  scrollContent: {
    gap: 14,
    paddingBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 4,
  },
  card: {
    width: '47%',
    borderRadius: 18,
    padding: 10,
    gap: 4,
  },
  swatch: {
    position: 'relative',
    borderRadius: 13,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    aspectRatio: 1.1,
  },
  meta: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 6,
  },
  laundryTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  addHint: {
    fontSize: 10,
  },
  iconBtn: {
    position: 'absolute',
    top: 7,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    left: 7,
    backgroundColor: 'rgba(23,21,15,0.55)',
  },
  delBtn: {
    right: 7,
    backgroundColor: '#C05A2E',
  },
});
