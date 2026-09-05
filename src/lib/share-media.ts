import AsyncStorage from '@react-native-async-storage/async-storage';

// Remembers one photo or short video per deity that the person has already
// picked from their own device to share (e.g. a photo of their home altar,
// or a clip from a temple visit) - so sharing again later is a single tap
// instead of re-picking from the gallery every time. Stored locally only,
// same as every other preference in this app; never uploaded anywhere.
export interface ShareMedia {
  uri: string;
  type: 'image' | 'video';
}

function storageKey(deityId: string): string {
  return `divine-calendar:share-media:${deityId}`;
}

export async function getShareMedia(deityId: string): Promise<ShareMedia | null> {
  const raw = await AsyncStorage.getItem(storageKey(deityId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.uri === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export async function setShareMedia(deityId: string, media: ShareMedia | null): Promise<void> {
  if (media) await AsyncStorage.setItem(storageKey(deityId), JSON.stringify(media));
  else await AsyncStorage.removeItem(storageKey(deityId));
}
