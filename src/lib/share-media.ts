import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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
  return `deiva-dinam:share-media:${deityId}`;
}

// The picker hands back a file in the OS cache, which the OS is free to
// clear at any time - so a remembered pick is copied into the app's own
// documents folder, where it stays until replaced or removed.
async function keepFile(deityId: string, media: ShareMedia): Promise<ShareMedia> {
  if (Platform.OS === 'web') return media;
  const { Directory, File, Paths } = await import('expo-file-system');
  const dir = new Directory(Paths.document, 'share-media');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  const source = new File(media.uri);
  const extension = source.extension || (media.type === 'video' ? '.mp4' : '.jpg');
  const dest = new File(dir, `${deityId}-${Date.now()}${extension}`);
  await source.copy(dest);
  return { ...media, uri: dest.uri };
}

async function fileExists(uri: string): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const { File } = await import('expo-file-system');
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

async function deleteFile(uri: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const { File } = await import('expo-file-system');
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // best-effort - a leftover file is harmless
  }
}

export async function getShareMedia(deityId: string): Promise<ShareMedia | null> {
  const raw = await AsyncStorage.getItem(storageKey(deityId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.uri !== 'string') return null;
    return (await fileExists(parsed.uri)) ? parsed : null;
  } catch {
    return null;
  }
}

// Saves (or, with null, forgets) the remembered pick and returns what was
// stored - the kept copy's location, not the picker's.
export async function setShareMedia(deityId: string, media: ShareMedia | null): Promise<ShareMedia | null> {
  const previous = await getShareMedia(deityId);
  if (media) {
    const kept = await keepFile(deityId, media);
    await AsyncStorage.setItem(storageKey(deityId), JSON.stringify(kept));
    if (previous && previous.uri !== kept.uri) await deleteFile(previous.uri);
    return kept;
  }
  await AsyncStorage.removeItem(storageKey(deityId));
  if (previous) await deleteFile(previous.uri);
  return null;
}
