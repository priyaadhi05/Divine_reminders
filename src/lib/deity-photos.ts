import { Asset } from 'expo-asset';

// Real deity images for each deity's "Share with family" section (see
// components/share-panel.tsx) - bundled JPEGs sized for messaging apps
// (1080px or less on the long side). A deity with no entry here would just
// share the generated card from lib/deity-cards.ts.
const DEITY_PHOTO_ASSETS: Record<string, number[]> = {
  murugan: [
    require('@/assets/deity-photos/murugan-2.jpg'),
    require('@/assets/deity-photos/murugan-3.jpg'),
    require('@/assets/deity-photos/murugan-4.jpg'),
  ],
  ganesha: [
    require('@/assets/deity-photos/ganesha-2.jpg'),
    require('@/assets/deity-photos/ganesha-3.jpg'),
  ],
  durga: [
    require('@/assets/deity-photos/durga-1.jpg'),
    require('@/assets/deity-photos/durga-2.jpg'),
    require('@/assets/deity-photos/durga-3.jpg'),
  ],
  vishnu: [
    require('@/assets/deity-photos/vishnu-2.jpg'),
    require('@/assets/deity-photos/vishnu-3.jpg'),
    require('@/assets/deity-photos/vishnu-4.jpg'),
  ],
  shiva: [
    require('@/assets/deity-photos/shiva-1.jpg'),
    require('@/assets/deity-photos/shiva-2.jpg'),
    require('@/assets/deity-photos/shiva-3.jpg'),
    require('@/assets/deity-photos/shiva-4.jpg'),
  ],
  ayyappan: [
    require('@/assets/deity-photos/ayyappan-1.jpg'),
    require('@/assets/deity-photos/ayyappan-2.jpg'),
    require('@/assets/deity-photos/ayyappan-3.jpg'),
  ],
  hanuman: [
    require('@/assets/deity-photos/hanuman-1.jpg'),
    require('@/assets/deity-photos/hanuman-2.jpg'),
  ],
};

// Bundled assets need resolving to an on-disk file before the native share
// sheet can attach them - loadAsync downloads each one (a no-op once cached).
export async function getDeityPhotoUris(deityId: string): Promise<string[]> {
  const modules = DEITY_PHOTO_ASSETS[deityId];
  if (!modules) return [];
  const assets = await Asset.loadAsync(modules);
  return assets.map((asset) => asset.localUri ?? asset.uri);
}
