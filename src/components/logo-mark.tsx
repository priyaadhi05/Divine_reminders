import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

// The app's crest: a lit diya on a lotus in a gold-ringed green seal (see
// assets/images/logo-mark.png - drawn by scripts/logo/generate-logo.py along
// with every app icon size), ringed in whichever color it's sitting on - the Home hero banner, the
// onboarding header's page background, etc. - so it reads as a badge rather
// than a flat square image dropped on top.
export function LogoMark({ size = 64, ringColor }: { size?: number; ringColor?: string }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2, borderColor: ringColor ?? theme.background, backgroundColor: ringColor ?? theme.background },
      ]}>
      <Image
        source={require('@/assets/images/logo-mark.png')}
        style={{ width: size - 6, height: size - 6, borderRadius: (size - 6) / 2 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
