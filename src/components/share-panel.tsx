import { useEffect, useState } from 'react';
import { Alert, Image, Linking, Platform, Pressable, Share, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getDeityCardUri, hasDeityCard } from '@/lib/deity-cards';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { getShareMedia, setShareMedia, type ShareMedia } from '@/lib/share-media';

// Quick-share row for a single event, shown once someone taps "Share with
// family" (see src/app/event/[id].tsx). Three tiers:
//  - WhatsApp: opens directly with the message pre-filled via its own URL
//    scheme - the one platform of the three that actually supports this.
//  - Instagram / Facebook: neither accepts pre-filled text through a URL
//    scheme, so these route through the OS share sheet instead, with
//    whatever image/video is active below (the bundled card by default, or
//    a photo/video someone attached) - Instagram in particular needs an
//    image to have anything to share at all.
//  - "More": the plain OS share sheet, same as this button did before.
// Below that: this app has no real deity photography of its own (see
// lib/deity-cards.ts for why), so it defaults to a plain branded card and
// lets someone swap in their own photo or video instead if they'd rather.
interface SharePanelProps {
  deityId: string;
  message: string;
}

export function SharePanel({ deityId, message }: SharePanelProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [customMedia, setCustomMedia] = useState<ShareMedia | null>(null);
  const [cardUri, setCardUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getShareMedia(deityId).then(setCustomMedia);
    if (hasDeityCard(deityId)) getDeityCardUri(deityId).then(setCardUri);
    else setCardUri(null);
  }, [deityId]);

  const media: ShareMedia | null = customMedia ?? (cardUri ? { uri: cardUri, type: 'image' } : null);
  const isDefaultCard = !customMedia && !!cardUri;

  // Neither expo-sharing nor Linking can force-open one specific app with an
  // attachment - only the OS share sheet can attach a file, and only the
  // person can pick which app receives it there. dialogTitle at least hints
  // at that (shown on Android/web; iOS has no equivalent).
  const shareViaSheet = async (dialogTitle?: string) => {
    try {
      if (media) {
        if (!(await Sharing.isAvailableAsync())) {
          Alert.alert(
            'Sharing a photo isn’t supported here',
            'This browser/device can’t attach a photo or video to a share. Open the app on your phone to share the image, or continue with text only.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Share text only', onPress: () => Share.share({ message }) },
            ]
          );
          return;
        }
        await Sharing.shareAsync(media.uri, {
          mimeType: media.type === 'video' ? 'video/*' : 'image/*',
          UTI: media.type === 'video' ? 'public.movie' : 'public.image',
          dialogTitle,
        });
      } else {
        await Share.share({ message });
      }
    } catch {
      // user dismissed the share sheet - nothing to do
    }
  };

  const shareToWhatsApp = async () => {
    // A photo/video can't ride along on WhatsApp's URL scheme - fall back to
    // the share sheet (with the media attached) and let WhatsApp be picked there.
    if (media) return shareViaSheet('Choose WhatsApp to share');
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // fall through to the share sheet below
    }
    await shareViaSheet();
  };

  const shareToInstagram = async () => {
    if (!media) {
      Alert.alert('Add a photo or video first', 'Instagram needs an image or video to share - add one below, then try again.');
      return;
    }
    await shareViaSheet('Choose Instagram to share');
  };

  const shareToFacebook = () => shareViaSheet('Choose Facebook to share');

  const pickMedia = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Allow photo library access to add a photo or video to share.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        videoMaxDuration: 60,
        quality: 0.8,
      });
      const asset = result.canceled ? undefined : result.assets[0];
      if (!asset) return;
      const next: ShareMedia = { uri: asset.uri, type: asset.type === 'video' ? 'video' : 'image' };
      await setShareMedia(deityId, next);
      setCustomMedia(next);
    } finally {
      setBusy(false);
    }
  };

  // Reverts to the bundled card (if this deity has one) rather than to
  // nothing - there's always something reasonable to share.
  const removeMedia = async () => {
    await setShareMedia(deityId, null);
    setCustomMedia(null);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.platformRow}>
        <PlatformButton label={t('share.whatsapp')} icon="💬" onPress={shareToWhatsApp} />
        <PlatformButton label={t('share.instagram')} icon="📸" onPress={shareToInstagram} />
        <PlatformButton label={t('share.facebook')} icon="📘" onPress={shareToFacebook} />
        <PlatformButton label={t('share.more')} icon="↗️" onPress={() => shareViaSheet()} />
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.mediaCard}>
        {media ? (
          <ThemedView type="backgroundElement" style={styles.mediaRow}>
            <Image source={{ uri: media.uri }} style={styles.thumbnail} />
            <ThemedView type="backgroundElement" style={styles.mediaInfo}>
              <ThemedText type="small" themeColor="textSecondary">
                {isDefaultCard ? t('share.cardReady') : media.type === 'video' ? t('share.videoReady') : t('share.photoReady')}
              </ThemedText>
              <ThemedView type="backgroundElement" style={styles.mediaActions}>
                <Pressable onPress={pickMedia} disabled={busy}>
                  <ThemedText type="linkPrimary">{isDefaultCard ? t('share.useOwnInstead') : t('common.change')}</ThemedText>
                </Pressable>
                {!isDefaultCard && (
                  <Pressable onPress={removeMedia} disabled={busy}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {t('common.remove')}
                    </ThemedText>
                  </Pressable>
                )}
              </ThemedView>
            </ThemedView>
          </ThemedView>
        ) : (
          <Pressable onPress={pickMedia} disabled={busy} accessibilityRole="button">
            <ThemedText type="small" style={{ color: theme.primary }}>
              📷 {t('share.addMedia')}
              {Platform.OS === 'web' ? t('mascot.mobileOnly') : ''}
            </ThemedText>
          </Pressable>
        )}
      </ThemedView>
    </ThemedView>
  );
}

function PlatformButton({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.platformButtonFlex} accessibilityRole="button">
      <ThemedView type="backgroundElement" style={[styles.platformButton, { borderColor: theme.primary }]}>
        <ThemedText style={styles.platformIcon}>{icon}</ThemedText>
        <ThemedText type="small">{label}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  platformRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  platformButtonFlex: {
    flex: 1,
  },
  platformButton: {
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
  },
  platformIcon: {
    fontSize: 18,
  },
  mediaCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: Spacing.two,
  },
  mediaInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.one,
  },
  mediaActions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
});
