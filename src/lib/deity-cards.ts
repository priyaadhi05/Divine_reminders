import { Asset } from 'expo-asset';

// One shareable branded card per deity (see assets/deity-cards/, generated
// as plain original graphics - each deity's accent color, name, a
// well-known mantra/greeting, and a medallion with that deity's traditional
// emblem: Murugan's peacock, Vishnu's lotus, Shiva's trident, Amman's
// hibiscus, Ganesha's elephant, Ayyappan's bow and arrow). Not a photograph
// or a figure of the deity: this app has no real deity photography of its
// own and no reliable way to verify the license or accuracy of a figurative
// image found online, so a recognizable attribute-symbol in the app's own
// style is the honest, respectful alternative. Used as the default share
// image so WhatsApp/Instagram/Facebook always have something ready before
// someone attaches their own photo or video.
const DEITY_CARD_ASSETS: Record<string, number> = {
  murugan: require('@/assets/deity-cards/murugan.png'),
  vishnu: require('@/assets/deity-cards/vishnu.png'),
  shiva: require('@/assets/deity-cards/shiva.png'),
  durga: require('@/assets/deity-cards/durga.png'),
  ganesha: require('@/assets/deity-cards/ganesha.png'),
  ayyappan: require('@/assets/deity-cards/ayyappan.png'),
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
