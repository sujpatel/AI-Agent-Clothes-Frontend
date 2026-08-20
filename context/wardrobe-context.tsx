import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { API_BASE_URL } from '@/config/api';
import { friendlyErrorMessage } from '@/config/api-error';
import { apiFetch } from '@/config/api-fetch';
import { useToast } from '@/context/toast-context';

export type WardrobeItem = {
  id: string;
  category: string;
  color: string;
  pattern: string;
  formality: number;
  warmth: number;
  description: string;
  available?: boolean;
  // Set only while a freshly-taken photo is still being tagged and saved.
  // `localUri` lets the grid show the photo straight off the device instead
  // of waiting on the server round-trip.
  pending?: boolean;
  localUri?: string;
};

export type EditableFields = Partial<Pick<WardrobeItem, 'category' | 'color' | 'pattern' | 'formality' | 'warmth'>>;

type WardrobeContextValue = {
  items: WardrobeItem[];
  loading: boolean;
  error: string | null;
  fetchItems: (options?: { silent?: boolean }) => Promise<void>;
  addPendingItem: (localId: string, localUri: string) => void;
  resolvePendingItem: (localId: string, saved: WardrobeItem | null) => void;
  addToLaundry: (itemId: string) => Promise<void>;
  finishLaundry: (itemIds: string[]) => Promise<void>;
  updateItem: (itemId: string, fields: EditableFields) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
};

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // `silent` skips the loading/error UI — used for background refreshes
  // (e.g. right after a photo uploads) so the grid updates in place instead
  // of flashing a spinner over content that's already on screen.
  const fetchItems = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const response = await apiFetch(`${API_BASE_URL}/items`);
      if (!response.ok) throw new Error(await friendlyErrorMessage(response));
      const data: WardrobeItem[] = await response.json();
      setItems(data);
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Shows a just-taken photo in the grid immediately, before the server has
  // finished tagging and storing it. The placeholder renders from the local
  // file, so there's no wait for the round-trip.
  const addPendingItem = useCallback((localId: string, localUri: string) => {
    setItems((prev) => [
      {
        id: localId,
        localUri,
        pending: true,
        category: '',
        color: '',
        pattern: '',
        formality: 0,
        warmth: 0,
        description: '',
        available: true,
      },
      ...prev,
    ]);
  }, []);

  // Swaps the placeholder for the real saved item once the upload finishes,
  // or drops it if the upload failed.
  const resolvePendingItem = useCallback((localId: string, saved: WardrobeItem | null) => {
    setItems((prev) => {
      if (!saved) return prev.filter((item) => item.id !== localId);
      return prev.map((item) => (item.id === localId ? saved : item));
    });
  }, []);

  const addToLaundry = useCallback(
    async (itemId: string) => {
      // Update shared state immediately — every screen using this context
      // re-renders with the new value right away, no refetch race.
      setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, available: false } : item)));
      try {
        const response = await apiFetch(`${API_BASE_URL}/laundry/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_ids: [itemId] }),
        });
        if (!response.ok) throw new Error(await friendlyErrorMessage(response));
        showToast('Added to laundry');
      } catch {
        setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, available: true } : item)));
        showToast('Could not add to laundry — try again');
      }
    },
    [showToast]
  );

  const finishLaundry = useCallback(
    async (itemIds: string[]) => {
      setItems((prev) => prev.map((item) => (itemIds.includes(item.id) ? { ...item, available: true } : item)));
      try {
        const response = await apiFetch(`${API_BASE_URL}/laundry/finish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_ids: itemIds }),
        });
        if (!response.ok) throw new Error(await friendlyErrorMessage(response));
        showToast(itemIds.length === 1 ? 'Finished laundry' : `Finished laundry (${itemIds.length} items)`);
      } catch {
        setItems((prev) => prev.map((item) => (itemIds.includes(item.id) ? { ...item, available: false } : item)));
        showToast('Could not finish laundry — try again');
      }
    },
    [showToast]
  );

  const updateItem = useCallback(
    async (itemId: string, fields: EditableFields) => {
      let previous: WardrobeItem | undefined;
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          previous = item;
          return { ...item, ...fields };
        })
      );
      try {
        const response = await apiFetch(`${API_BASE_URL}/items/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fields),
        });
        if (!response.ok) throw new Error(await friendlyErrorMessage(response));
        showToast('Item updated');
      } catch {
        if (previous) {
          const restored = previous;
          setItems((prev) => prev.map((item) => (item.id === itemId ? restored : item)));
        }
        showToast('Could not save changes — try again');
      }
    },
    [showToast]
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      let removed: WardrobeItem | undefined;
      let removedIndex = -1;
      setItems((prev) => {
        removedIndex = prev.findIndex((item) => item.id === itemId);
        removed = prev[removedIndex];
        return prev.filter((item) => item.id !== itemId);
      });
      try {
        const response = await apiFetch(`${API_BASE_URL}/items/${itemId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(await friendlyErrorMessage(response));
        showToast('Item deleted');
      } catch {
        if (removed) {
          const restoredItem = removed;
          const insertAt = removedIndex;
          setItems((prev) => {
            const next = [...prev];
            next.splice(insertAt, 0, restoredItem);
            return next;
          });
        }
        showToast('Could not delete item — try again');
      }
    },
    [showToast]
  );

  // Fetch once, when the app first loads. After this, mutations update the
  // shared state directly — screens don't each re-fetch on focus, which was
  // racing against Pinecone's write consistency and clobbering correct optimistic
  // updates with stale reads.
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <WardrobeContext.Provider
      value={{
        items,
        loading,
        error,
        fetchItems,
        addPendingItem,
        resolvePendingItem,
        addToLaundry,
        finishLaundry,
        updateItem,
        deleteItem,
      }}>
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe() {
  const ctx = useContext(WardrobeContext);
  if (!ctx) {
    throw new Error('useWardrobe must be used within a WardrobeProvider');
  }
  return ctx;
}
