import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Deity } from '@/data/events';

// Each deity's emblem - their weapon or vahana (Murugan's Vel, Durga's
// lion...) - as a round, gold-ringed picture. Cropped from one generated
// sheet; replacing a deity's file in assets/deity-logos/ is all it takes to
// change its logo. Text-only places (notifications, shared messages) keep
// the deity's emoji `symbol` instead.
const DEITY_LOGOS: Record<string, number> = {
  murugan: require('@/assets/deity-logos/murugan.jpg'),
  vishnu: require('@/assets/deity-logos/vishnu.jpg'),
  shiva: require('@/assets/deity-logos/shiva.jpg'),
  durga: require('@/assets/deity-logos/durga.jpg'),
  ganesha: require('@/assets/deity-logos/ganesha.jpg'),
  ayyappan: require('@/assets/deity-logos/ayyappan.jpg'),
  hanuman: require('@/assets/deity-logos/hanuman.jpg'),
  lakshmi: require('@/assets/deity-logos/lakshmi.jpg'),
};

const GOLD = '#C9A227';

export function DeityLogo({ deity, size }: { deity: Deity; size: number }) {
  const source = DEITY_LOGOS[deity.id];
  const ring = Math.max(2, Math.round(size / 24));
  const shape = { width: size, height: size, borderRadius: size / 2, borderWidth: ring };

  if (!source) {
    return <ThemedText style={{ fontSize: size / 2, lineHeight: size * 0.6 }}>{deity.symbol}</ThemedText>;
  }
  return (
    <Image
      source={source}
      style={[styles.logo, shape]}
      contentFit="cover"
      accessibilityIgnoresInvertColors
      accessible={false}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    borderColor: GOLD,
  },
});
