import { useAuth } from '@/context/auth-context';

/** Builds an expo-image `source` object with the current user's auth token
 * attached — every photo comes from the authenticated /photos/{item_id}
 * route, so every place an <Image> loads one needs this same header. */
export function useAuthedPhotoSource(uri: string) {
  return useAuthedPhotoSourceBuilder()(uri);
}

/** Same as useAuthedPhotoSource, but returns a builder function instead of a
 * single source — needed anywhere the URI varies per item (e.g. inside a
 * .map()), where calling a hook per-iteration isn't allowed. */
export function useAuthedPhotoSourceBuilder() {
  const { session } = useAuth();
  return (uri: string) => ({ uri, headers: { Authorization: `Bearer ${session?.access_token}` } });
}
