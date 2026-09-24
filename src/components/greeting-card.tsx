import { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

// Renders a deity picture with the share greeting (lib/share-greeting.ts)
// written onto it as a caption band, so the message survives however the
// picture is shared - the OS share sheet / WhatsApp only carry one
// attachment, with no separate caption field, so the words have to be part
// of the picture's own pixels (see components/share-panel.tsx). Mounted
// off-screen and captured with react-native-view-shot; never shown directly.
export const CARD_SIZE = 360;

interface GreetingCardProps {
  photoUri: string;
  caption: string;
  onImageLoad?: () => void;
}

export const GreetingCard = forwardRef<View, GreetingCardProps>(function GreetingCard(
  { photoUri, caption, onImageLoad },
  ref
) {
  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" onLoad={onImageLoad} />
      <View style={styles.captionBand}>
        <Text style={styles.captionText}>{caption}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  photo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  captionBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
    textAlign: 'center',
  },
});
