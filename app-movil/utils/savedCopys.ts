import AsyncStorage from '@react-native-async-storage/async-storage';

export type SavedCopy = {
  id: string;
  image: string;       // base64 data URI
  copyText: string;
  company: string;
  createdAt: string;    // ISO date
};

const STORAGE_KEY_PREFIX = 'snapcopy_saved_';

function getKey(userEmail: string) {
  return `${STORAGE_KEY_PREFIX}${userEmail}`;
}

async function getUserEmail(): Promise<string | null> {
  try {
    const session = await AsyncStorage.getItem('snapcopy_session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.email || null;
    }
  } catch {}
  return null;
}

export async function getSavedCopys(): Promise<SavedCopy[]> {
  const email = await getUserEmail();
  if (!email) return [];
  try {
    const raw = await AsyncStorage.getItem(getKey(email));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCopy(item: Omit<SavedCopy, 'id' | 'createdAt'>): Promise<SavedCopy> {
  const email = await getUserEmail();
  if (!email) throw new Error('No user session');

  const existing = await getSavedCopys();
  const newItem: SavedCopy = {
    ...item,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };

  const updated = [newItem, ...existing];
  await AsyncStorage.setItem(getKey(email), JSON.stringify(updated));
  return newItem;
}

export async function deleteSavedCopy(id: string): Promise<void> {
  const email = await getUserEmail();
  if (!email) return;
  const existing = await getSavedCopys();
  const filtered = existing.filter(c => c.id !== id);
  await AsyncStorage.setItem(getKey(email), JSON.stringify(filtered));
}
