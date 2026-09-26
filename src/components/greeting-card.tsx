import { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

// Renders a deity picture with the share greeting (lib/share-greeting.ts)
// written underneath it as a caption band, so the message survives however
// the picture is shared - WhatsApp and most apps drop a separate caption
// when several pictures go out at once, so the words have to be part of the
// picture's own pixels (see components/share-panel.tsx). Mounted off-screen
// and captured with react-native-view-shot; never shown directly.
//
// The card takes the photo's own shape (`aspectRatio`, width / height) and
// the caption sits below it rather than on top, so nothing of the deity is
// cropped or covered - most deity photos are tall portraits.
export const CARD_WIDTH = 360;

interface GreetingCardProps {
  photoUri: string;
  aspectRatio: number;
  caption: string;
  onImageLoad?: () => void;
}

export const GreetingCard = forwardRef<View, GreetingCardProps>(function GreetingCard(
  { photoUri, aspectRatio, caption, onImageLoad },
  ref
) {
  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <Image source={{ uri: photoUri }} style={[styles.photo, { aspectRatio }]} resizeMode="contain" onLoad={onImageLoad} />
      <View style={styles.captionBand}>
        <Text style={styles.captionText}>{caption}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#000',
  },
  photo: {
    width: CARD_WIDTH,
  },
  captionBand: {
    backgroundColor: '#1B1B1B',
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
