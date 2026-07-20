import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL } from '@/config/api';
import { useWardrobe } from '@/context/wardrobe-context';
import { useThemeColor } from '@/hooks/use-theme-color';

type Outfit = {
  top_id: string | null;
  bottom_id: string | null;
  shoes_id: string | null;
  outerwear_id: string | null;
  reasoning: string;
};

type TaggedItem = {
  item_id: string;
  category: string;
  color: string;
  formality: number;
  warmth: number;
  pattern: string;
  description: string;
};

const OCCASION_STORAGE_KEY = 'last-occasion';

const TODAY = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

export default function GenerateScreen() {
  const router = useRouter();
  const { fetchItems } = useWardrobe();
  const textColor = useThemeColor({}, 'text');
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [taggedItem, setTaggedItem] = useState<TaggedItem | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const [occasion, setOccasion] = useState('casual');
  const [location, setLocation] = useState('');
  const [locatingUser, setLocatingUser] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(OCCASION_STORAGE_KEY).then((saved) => {
      if (saved) setOccasion(saved);
    });
  }, []);

  const handleOccasionChange = useCallback((value: string) => {
    setOccasion(value);
    AsyncStorage.setItem(OCCASION_STORAGE_KEY, value);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) return;

        const position = await Location.getCurrentPositionAsync({});
        const [place] = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        if (place?.city) setLocation(place.city);
      } catch {
        // Location detection failed — user can type it in manually instead.
      } finally {
        setLocatingUser(false);
      }
    })();
  }, []);

  const fetchOutfit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ occasion, location: location || 'Chicago' });
      const response = await fetch(`${API_BASE_URL}/outfit/today?${params}`);
      if (!response.ok) throw new Error(`Server responded ${response.status}`);
      const data: Outfit = await response.json();
      setOutfit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [occasion, location]);

  const showAnother = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/outfit/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correction: 'show me another option' }),
      });
      if (!response.ok) throw new Error(`Server responded ${response.status}`);
      const data: Outfit = await response.json();
      setOutfit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

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
      // Keep the preview photo so the user can retry without retaking it.
      setUploadError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setUploading(false);
    }
  }, [previewPhoto, fetchItems]);

  const cancelPreview = useCallback(() => {
    setPreviewPhoto(null);
    setUploadError(null);
  }, []);

  return (
    <ThemedView style={styles.container} lightColor="#F4EFE6" darkColor="#17150F">
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header} lightColor="#F4EFE6" darkColor="#17150F">
          <ThemedView style={styles.headerLeft} lightColor="#F4EFE6" darkColor="#17150F">
            <ThemedText style={styles.eyebrow} lightColor="#C05A2E" darkColor="#D97E51">
              {TODAY.toUpperCase()}
            </ThemedText>
            <ThemedText style={styles.h1}>Today</ThemedText>
          </ThemedView>
          <ThemedText style={styles.locpin} lightColor="#C05A2E" darkColor="#D97E51">
            {locatingUser ? 'Locating…' : location ? `📍 ${location}` : '📍 Chicago'}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.field} lightColor="#FFFFFF" darkColor="#221F17">
          <IconSymbol name="magnifyingglass" size={15} color={textColor} />
          <TextInput
            style={[styles.fieldInput, { color: textColor }]}
            value={occasion}
            onChangeText={handleOccasionChange}
            placeholder="Occasion — casual, dinner, work…"
            placeholderTextColor="#8B8477"
          />
        </ThemedView>

        {!outfit && !loading && (
          <Pressable style={styles.button} onPress={fetchOutfit}>
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>
              Get today&apos;s outfit
            </ThemedText>
          </Pressable>
        )}

        {loading && <ActivityIndicator size="large" style={styles.spacing} />}

        {error && !loading && (
          <ThemedView style={styles.errorRow} lightColor="#F4EFE6" darkColor="#17150F">
            <ThemedText lightColor="#8B8477" darkColor="#9A9282">
              {error}
            </ThemedText>
            <Pressable style={styles.retryButton} onPress={fetchOutfit}>
              <ThemedText type="defaultSemiBold" style={styles.retryText}>
                Retry
              </ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {outfit && !loading && (
          <ThemedView style={styles.card} lightColor="#FFFFFF" darkColor="#221F17">
            <ThemedView style={styles.photoGrid} lightColor="#FFFFFF" darkColor="#221F17">
              <ItemPhoto label="Top" itemId={outfit.top_id} />
              <ItemPhoto label="Bottom" itemId={outfit.bottom_id} />
              <ItemPhoto label="Shoes" itemId={outfit.shoes_id} />
              {outfit.outerwear_id && <ItemPhoto label="Outerwear" itemId={outfit.outerwear_id} />}
            </ThemedView>

            <ThemedText style={styles.reasoning} lightColor="#8B8477" darkColor="#9A9282">
              &ldquo;{outfit.reasoning}&rdquo;
            </ThemedText>

            <ThemedView style={styles.btnRow} lightColor="#FFFFFF" darkColor="#221F17">
              <Pressable style={[styles.button, styles.outlineButton, styles.flexButton]} onPress={showAnother}>
                <ThemedText type="defaultSemiBold">Show another</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.button, styles.flexButton]}
                onPress={() => router.push('/explore')}>
                <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                  View wardrobe
                </ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>
        )}

        {previewPhoto && (
          <ThemedView style={styles.card} lightColor="#FFFFFF" darkColor="#221F17">
            <Image source={{ uri: previewPhoto.uri }} style={styles.previewImage} contentFit="cover" />

            {uploading && <ActivityIndicator size="large" style={styles.spacing} />}

            {uploadError && !uploading && (
              <ThemedText lightColor="#8B8477" darkColor="#9A9282">
                {uploadError}
              </ThemedText>
            )}

            {!uploading && (
              <ThemedView style={styles.previewActions} lightColor="#FFFFFF" darkColor="#221F17">
                <Pressable
                  style={[styles.button, styles.outlineButton, styles.previewButtonFlex]}
                  onPress={cancelPreview}>
                  <ThemedText type="defaultSemiBold">Cancel</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.outlineButton, styles.previewButtonFlex]}
                  onPress={capturePhoto}>
                  <ThemedText type="defaultSemiBold">Retake</ThemedText>
                </Pressable>
                <Pressable style={[styles.button, styles.previewButtonFlex]} onPress={confirmUpload}>
                  <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                    {uploadError ? 'Retry' : 'Use photo'}
                  </ThemedText>
                </Pressable>
              </ThemedView>
            )}
          </ThemedView>
        )}

        {taggedItem && !uploading && (
          <ThemedView style={styles.card} lightColor="#FFFFFF" darkColor="#221F17">
            <ItemPhoto label={taggedItem.category} itemId={taggedItem.item_id} />
            <OutfitRow label="Color" itemId={taggedItem.color} />
            <OutfitRow label="Pattern" itemId={taggedItem.pattern} />
            <ThemedText style={styles.reasoning} lightColor="#8B8477" darkColor="#9A9282">
              {taggedItem.description}
            </ThemedText>
          </ThemedView>
        )}

        {!previewPhoto && (
          <Pressable style={styles.fab} onPress={capturePhoto}>
            <IconSymbol name="camera.fill" size={22} color="#F4EFE6" />
          </Pressable>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function OutfitRow({ label, itemId }: { label: string; itemId: string | null }) {
  if (!itemId) return null;
  return (
    <ThemedView style={styles.row}>
      <ThemedText lightColor="#8B8477" darkColor="#9A9282">
        {label}
      </ThemedText>
      <ThemedText lightColor="#3D5A99" darkColor="#7C97D6">
        {itemId}
      </ThemedText>
    </ThemedView>
  );
}

function ItemPhoto({ label, itemId }: { label: string; itemId: string | null }) {
  if (!itemId) return null;
  return (
    <ThemedView style={styles.photoSlot} lightColor="#FFFFFF" darkColor="#221F17">
      <Image source={{ uri: `${API_BASE_URL}/photos/${itemId}` }} style={styles.photo} contentFit="cover" />
      <ThemedText style={styles.photoLabel} lightColor="#C05A2E" darkColor="#D97E51">
        {label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    gap: 2,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  h1: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  locpin: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fieldInput: {
    flex: 1,
    fontSize: 13,
  },
  spacing: {
    marginTop: 24,
  },
  errorRow: {
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
  previewImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#ccc',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  previewButtonFlex: {
    flex: 1,
    marginTop: 0,
  },
  flexButton: {
    flex: 1,
    marginTop: 0,
  },
  card: {
    width: '100%',
    borderRadius: 26,
    padding: 18,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  photoSlot: {
    width: '47%',
    alignItems: 'center',
    gap: 4,
  },
  photo: {
    width: '100%',
    aspectRatio: 1.15,
    borderRadius: 16,
    backgroundColor: '#ccc',
  },
  photoLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  reasoning: {
    fontStyle: 'italic',
    fontSize: 13,
    marginTop: 10,
    marginBottom: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    alignSelf: 'stretch',
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: 'center',
    backgroundColor: '#C05A2E',
    marginTop: 8,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#C05A2E',
  },
  buttonText: {
    color: '#F4EFE6',
  },
  fab: {
    position: 'absolute',
    right: 4,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#C05A2E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
