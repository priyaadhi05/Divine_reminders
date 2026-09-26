import { Asset } from 'expo-asset';

// One shareable branded card per deity (assets/deity-cards/, made by
// scripts/cards/generate-cards.py from the deity's logo in
// assets/deity-logos/): the deity's emblem in a gold medallion, its name and
// a well-known mantra, and the app's name. Used as the default share
// image so WhatsApp/Instagram/Facebook always have something ready before
// someone attaches their own photo or video.
const DEITY_CARD_ASSETS: Record<string, number> = {
  murugan: require('@/assets/deity-cards/murugan.jpg'),
  vishnu: require('@/assets/deity-cards/vishnu.jpg'),
  shiva: require('@/assets/deity-cards/shiva.jpg'),
  durga: require('@/assets/deity-cards/durga.jpg'),
  ganesha: require('@/assets/deity-cards/ganesha.jpg'),
  ayyappan: require('@/assets/deity-cards/ayyappan.jpg'),
  hanuman: require('@/assets/deity-cards/hanuman.jpg'),
  lakshmi: require('@/assets/deity-cards/lakshmi.jpg'),
};

export function hasDeityCard(deityId: string): boolean {
  return deityId in DEITY_CARD_ASSETS;
}

// Bundled assets need resolving to an on-disk file before the native share
// sheet can attach them - downloadAsync is a no-op once already cached.
export async function getDeityCardUri(deityId: string): Promise<string | null> {
  const asset = DEITY_CARD_ASSETS[deityId];
  if (!asset) return null;
  const resolved = Asset.fromModule(asset);
  await resolved.downloadAsync();
  return resolved.localUri ?? resolved.uri ?? null;
}
