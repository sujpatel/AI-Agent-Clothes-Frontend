import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL } from '@/config/api';
import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useWardrobe } from '@/context/wardrobe-context';

type TaggedItem = {
  item_id: string;
  category: string;
  color: string;
  formality: number;
  warmth: number;
  pattern: string;
  description: string;
};

type PendingItem = TaggedItem & { keep: boolean };

export default function ScanScreen() {
  const { fetchItems } = useWardrobe();
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const lineColor = useThemeColor({}, 'line');
  const mutedColor = useThemeColor({}, 'muted');
  const accentColor = useThemeColor({}, 'tint');

  // Single-item flow
  const [uploading, setUploading] = useState(false);
  const [taggedItem, setTaggedItem] = useState<TaggedItem | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);

  // Batch (multi-item) flow
  const [batchPreviewPhoto, setBatchPreviewPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [pendingItems, setPendingItems] = useState<PendingItem[] | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [batchAddedCount, setBatchAddedCount] = useState<number | null>(null);

  const capturePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setUploadError('Camera permission is required to add an item.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploadError(null);
    setTaggedItem(null);
    setPreviewPhoto(result.assets[0]);
  }, []);

  const confirmUpload = useCallback(async () => {
    if (!previewPhoto) return;

    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: previewPhoto.uri,
        name: previewPhoto.fileName ?? 'photo.jpg',
        type: previewPhoto.mimeType ?? 'image/jpeg',
      } as unknown as Blob);

      const response = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!response.ok) throw new Error(`Server responded ${response.status}`);
      const data: TaggedItem = await response.json();
      setTaggedItem(data);
      setPreviewPhoto(null);
      await fetchItems();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setUploading(false);
    }
  }, [previewPhoto, fetchItems]);

  const cancelPreview = useCallback(() => {
    setPreviewPhoto(null);
    setUploadError(null);
  }, []);

  const captureBatchPhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setDetectError('Camera permission is required to add items.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setDetectError(null);
    setBatchAddedCount(null);
    setBatchPreviewPhoto(result.assets[0]);
  }, []);

  const cancelBatchPreview = useCallback(() => {
    setBatchPreviewPhoto(null);
    setDetectError(null);
  }, []);

  const detectBatch = useCallback(async () => {
    if (!batchPreviewPhoto) return;

    setDetecting(true);
    setDetectError(null);
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: batchPreviewPhoto.uri,
        name: batchPreviewPhoto.fileName ?? 'photo.jpg',
        type: batchPreviewPhoto.mimeType ?? 'image/jpeg',
      } as unknown as Blob);

      const response = await fetch(`${API_BASE_URL}/items/batch/detect`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!response.ok) throw new Error(`Server responded ${response.status}`);
      const data: { items: TaggedItem[] } = await response.json();

      if (data.items.length === 0) {
        setDetectError('No clothing items were detected in that photo.');
        return;
      }

      setPendingItems(data.items.map((item) => ({ ...item, keep: true })));
      setBatchPreviewPhoto(null);
    } catch (err) {
      setDetectError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setDetecting(false);
    }
  }, [batchPreviewPhoto]);

  const toggleKeep = useCallback((itemId: string) => {
    setPendingItems((prev) =>
      prev ? prev.map((item) => (item.item_id === itemId ? { ...item, keep: !item.keep } : item)) : prev
    );
  }, []);

  const cancelBatchReview = useCallback(async () => {
    if (!pendingItems) return;
    await Promise.all(
      pendingItems.map((item) => fetch(`${API_BASE_URL}/items/pending/${item.item_id}`, { method: 'DELETE' }))
    );
    setPendingItems(null);
  }, [pendingItems]);

  const confirmBatch = useCallback(async () => {
    if (!pendingItems) return;
    const kept = pendingItems.filter((item) => item.keep);
    const discarded = pendingItems.filter((item) => !item.keep);

    setConfirming(true);
    try {
      await Promise.all(
        discarded.map((item) => fetch(`${API_BASE_URL}/items/pending/${item.item_id}`, { method: 'DELETE' }))
      );

      if (kept.length > 0) {
        const response = await fetch(`${API_BASE_URL}/items/batch/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: kept.map(({ keep, ...item }) => item),
          }),
        });
        if (!response.ok) throw new Error(`Server responded ${response.status}`);
        await fetchItems();
      }

      setPendingItems(null);
      setBatchAddedCount(kept.length);
    } catch (err) {
      setDetectError(err instanceof Error ? err.message : 'Something went wrong saving your items');
    } finally {
      setConfirming(false);
    }
  }, [pendingItems, fetchItems]);

  const showEmptyState = !previewPhoto && !taggedItem && !batchPreviewPhoto && !pendingItems && !detecting;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.masthead}>
          <ThemedText style={[styles.eyebrow, { color: mutedColor }]}>ADD TO WARDROBE</ThemedText>
          <ThemedText style={styles.h1}>Scan</ThemedText>
          <ThemedView style={[styles.rule, { backgroundColor: lineColor }]} />
        </ThemedView>

        <ThemedView style={styles.centerGroup}>
          {showEmptyState && (
            <ThemedView style={styles.plate}>
              <ThemedView style={[styles.iconCircle, { borderColor: lineColor }]}>
                <IconSymbol name="camera.fill" size={30} color={mutedColor} />
              </ThemedView>
              <ThemedText style={styles.instruction}>
                Photograph a piece, or lay out several with space between them to add many at once.
              </ThemedText>
              {batchAddedCount !== null && (
                <ThemedText style={[styles.confirmedText, { color: accentColor }]}>
                  Added {batchAddedCount} {batchAddedCount === 1 ? 'item' : 'items'} to your wardrobe.
                </ThemedText>
              )}
              {detectError && <ThemedText style={[styles.errorText, { color: mutedColor }]}>{detectError}</ThemedText>}
              <Pressable style={[styles.button, { backgroundColor: textColor }]} onPress={capturePhoto}>
                <ThemedText style={[styles.buttonText, { color: bgColor }]}>TAKE PHOTO</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.button, styles.outlineButton, { borderColor: textColor }]}
                onPress={captureBatchPhoto}>
                <ThemedText style={[styles.buttonText, { color: textColor }]}>ADD MULTIPLE ITEMS</ThemedText>
              </Pressable>
            </ThemedView>
          )}

          {previewPhoto && (
            <ThemedView style={styles.plate}>
              <ThemedText style={[styles.plateTag, { color: accentColor }]}>NEW ITEM</ThemedText>
              <Image source={{ uri: previewPhoto.uri }} style={styles.previewImage} contentFit="cover" />

              {uploading && <ActivityIndicator size="large" style={styles.spacing} />}

              {uploadError && !uploading && (
                <ThemedText style={[styles.errorText, { color: mutedColor }]}>{uploadError}</ThemedText>
              )}

              {!uploading && (
                <ThemedView style={styles.previewActions}>
                  <Pressable
                    style={[styles.button, styles.outlineButton, styles.previewButtonFlex, { borderColor: textColor }]}
                    onPress={cancelPreview}>
                    <ThemedText style={[styles.buttonText, { color: textColor }]}>CANCEL</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.button, styles.outlineButton, styles.previewButtonFlex, { borderColor: textColor }]}
                    onPress={capturePhoto}>
                    <ThemedText style={[styles.buttonText, { color: textColor }]}>RETAKE</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.button, styles.previewButtonFlex, { backgroundColor: textColor }]}
                    onPress={confirmUpload}>
                    <ThemedText style={[styles.buttonText, { color: bgColor }]}>
                      {uploadError ? 'RETRY' : 'USE'}
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              )}
            </ThemedView>
          )}

          {taggedItem && !uploading && (
            <ThemedView style={styles.plate}>
              <ThemedText style={[styles.plateTag, { color: accentColor }]}>ADDED TO WARDROBE</ThemedText>
              <ThemedView style={[styles.taggedPhotoWrap, { backgroundColor: lineColor }]}>
                <Image
                  source={{ uri: `${API_BASE_URL}/photos/${taggedItem.item_id}` }}
                  style={styles.photo}
                  contentFit="cover"
                />
              </ThemedView>
              <ThemedText style={styles.category}>{taggedItem.category}</ThemedText>

              <ThemedView style={[styles.rule, { backgroundColor: lineColor }]} />
              <ThemedView style={styles.specRow}>
                <ThemedText style={[styles.specLabel, { color: mutedColor }]}>COLOR</ThemedText>
                <ThemedText style={styles.specValue}>{taggedItem.color}</ThemedText>
              </ThemedView>
              <ThemedView style={styles.specRow}>
                <ThemedText style={[styles.specLabel, { color: mutedColor }]}>PATTERN</ThemedText>
                <ThemedText style={styles.specValue}>{taggedItem.pattern}</ThemedText>
              </ThemedView>

              <ThemedText style={styles.description}>{taggedItem.description}</ThemedText>
              <Pressable style={[styles.button, { backgroundColor: textColor }]} onPress={() => setTaggedItem(null)}>
                <ThemedText style={[styles.buttonText, { color: bgColor }]}>ADD ANOTHER</ThemedText>
              </Pressable>
            </ThemedView>
          )}

          {batchPreviewPhoto && (
            <ThemedView style={styles.plate}>
              <ThemedText style={[styles.plateTag, { color: accentColor }]}>MULTIPLE ITEMS</ThemedText>
              <Image source={{ uri: batchPreviewPhoto.uri }} style={styles.previewImage} contentFit="cover" />

              {detecting && (
                <>
                  <ActivityIndicator size="large" style={styles.spacing} />
                  <ThemedText style={[styles.errorText, { color: mutedColor }]}>
                    Finding each item — this can take a moment.
                  </ThemedText>
                </>
              )}

              {detectError && !detecting && (
                <ThemedText style={[styles.errorText, { color: mutedColor }]}>{detectError}</ThemedText>
              )}

              {!detecting && (
                <ThemedView style={styles.previewActions}>
                  <Pressable
                    style={[styles.button, styles.outlineButton, styles.previewButtonFlex, { borderColor: textColor }]}
                    onPress={cancelBatchPreview}>
                    <ThemedText style={[styles.buttonText, { color: textColor }]}>CANCEL</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.button, styles.outlineButton, styles.previewButtonFlex, { borderColor: textColor }]}
                    onPress={captureBatchPhoto}>
                    <ThemedText style={[styles.buttonText, { color: textColor }]}>RETAKE</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.button, styles.previewButtonFlex, { backgroundColor: textColor }]}
                    onPress={detectBatch}>
                    <ThemedText style={[styles.buttonText, { color: bgColor }]}>
                      {detectError ? 'RETRY' : 'DETECT ITEMS'}
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              )}
            </ThemedView>
          )}
        </ThemedView>

        {pendingItems && (
          <ThemedView style={styles.reviewOverlay}>
            <ThemedView style={styles.reviewHeader}>
              <ThemedText style={[styles.eyebrow, { color: mutedColor }]}>REVIEW</ThemedText>
              <ThemedText style={styles.reviewTitle}>
                {pendingItems.length} {pendingItems.length === 1 ? 'item' : 'items'} found
              </ThemedText>
              <ThemedText style={[styles.reviewHint, { color: mutedColor }]}>
                Tap any item that looks wrong to leave it out.
              </ThemedText>
            </ThemedView>

            <ScrollView contentContainerStyle={styles.reviewGrid}>
              {pendingItems.map((item) => (
                <Pressable
                  key={item.item_id}
                  style={[styles.reviewCard, { backgroundColor: cardColor }, !item.keep && styles.reviewCardDiscarded]}
                  onPress={() => toggleKeep(item.item_id)}>
                  <View style={styles.reviewPhotoWrap}>
                    <Image
                      source={{ uri: `${API_BASE_URL}/photos/${item.item_id}` }}
                      style={[styles.reviewPhoto, { opacity: item.keep ? 1 : 0.35 }]}
                      contentFit="cover"
                    />
                    {!item.keep && (
                      <ThemedView style={[styles.discardBadge, { backgroundColor: textColor }]}>
                        <ThemedText style={[styles.discardBadgeText, { color: bgColor }]}>OUT</ThemedText>
                      </ThemedView>
                    )}
                  </View>
                  <ThemedText style={[styles.reviewCategory, !item.keep && { color: mutedColor }]}>
                    {item.category}
                  </ThemedText>
                  <ThemedText style={[styles.reviewMeta, { color: mutedColor }]}>
                    {item.color} · {item.pattern}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>

            {confirming && <ActivityIndicator size="large" style={styles.spacing} />}

            {!confirming && (
              <ThemedView style={styles.reviewActions}>
                <Pressable
                  style={[styles.button, styles.outlineButton, styles.previewButtonFlex, { borderColor: textColor }]}
                  onPress={cancelBatchReview}>
                  <ThemedText style={[styles.buttonText, { color: textColor }]}>DISCARD ALL</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.previewButtonFlex, { backgroundColor: textColor }]}
                  onPress={confirmBatch}>
                  <ThemedText style={[styles.buttonText, { color: bgColor }]}>
                    ADD {pendingItems.filter((item) => item.keep).length}
                  </ThemedText>
                </Pressable>
              </ThemedView>
            )}
          </ThemedView>
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
  centerGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  plate: {
    gap: 16,
    alignItems: 'center',
  },
  plateTag: {
    fontFamily: Fonts.mono,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 2,
    alignSelf: 'center',
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instruction: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    lineHeight: 25,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  confirmedText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  spacing: {
    marginTop: 24,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#ccc',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
  },
  previewButtonFlex: {
    flex: 1,
  },
  taggedPhotoWrap: {
    width: '55%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
  },
  category: {
    fontFamily: Fonts.serif,
    fontSize: 24,
    fontWeight: '600',
    textTransform: 'capitalize',
    letterSpacing: -0.3,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  specLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  specValue: {
    fontSize: 15,
    textTransform: 'capitalize',
  },
  description: {
    fontFamily: Fonts.serif,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 8,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  buttonText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  reviewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  reviewHeader: {
    gap: 4,
    marginBottom: 16,
  },
  reviewTitle: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  reviewHint: {
    fontSize: 13,
  },
  reviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingBottom: 16,
  },
  reviewCard: {
    width: '47%',
    borderRadius: 16,
    padding: 10,
    gap: 4,
  },
  reviewCardDiscarded: {
    opacity: 0.7,
  },
  reviewPhotoWrap: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  reviewPhoto: {
    width: '100%',
    aspectRatio: 1,
  },
  discardBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  discardBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  reviewCategory: {
    fontFamily: Fonts.serif,
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginTop: 6,
  },
  reviewMeta: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 10,
  },
});
