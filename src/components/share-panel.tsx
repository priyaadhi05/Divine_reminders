import { useEffect, useState } from 'react';
import { Alert, Image, Linking, Platform, Pressable, Share, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getDeityCardUri, hasDeityCard } from '@/lib/deity-cards';
import { getDeityPhotoUris } from '@/lib/deity-photos';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { getShareMedia, setShareMedia, type ShareMedia } from '@/lib/share-media';

// Quick-share section for a single event, shown once someone taps "Share with
// family" (see src/app/event/[id].tsx). Top to bottom:
//  1. This deity's pictures (lib/deity-photos.ts, plus the branded card from
//     lib/deity-cards.ts) as a grid - tap any number of them to select /
//     deselect. Someone's own photo or video can be added and shows first.
//  2. WhatsApp / Instagram / Facebook / More, which act on the selection.
// What each button can actually do is limited by the OS: neither Linking nor
// expo-sharing can open a specific app *with* an attachment, and expo-sharing
// only attaches one file per share sheet. So:
//  - WhatsApp with nothing selected opens WhatsApp directly with the message
//    text pre-filled (its own URL scheme - the only direct route there is).
//  - Every button with pictures selected opens the OS share sheet, once per
//    picture (asking before each next one), and the person picks the app.
interface SharePanelProps {
  deityId: string;
  message: string;
}

function isDismissal(error: unknown): boolean {
  const e = error as { name?: string; message?: string };
  const text = `${e?.name ?? ''} ${e?.message ?? ''}`.toLowerCase();
  return text.includes('abort') || text.includes('cancel') || text.includes('dismiss');
}

const askNext = (done: number, total: number) =>
  new Promise<boolean>((resolve) =>
    Alert.alert(
      `Picture ${done} of ${total} shared`,
      'Send the next one now?',
      [
        { text: 'Stop', style: 'cancel', onPress: () => resolve(false) },
        { text: `Next (${done + 1} of ${total})`, onPress: () => resolve(true) },
      ],
      { cancelable: false, onDismiss: () => resolve(false) }
    )
  );

export function SharePanel({ deityId, message }: SharePanelProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [customMedia, setCustomMedia] = useState<ShareMedia | null>(null);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [cardUri, setCardUri] = useState<string | null>(null);
  // null = untouched, which means "just the first picture"
  const [selectedUris, setSelectedUris] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSelectedUris(null);
    getShareMedia(deityId).then((m) => !cancelled && setCustomMedia(m));
    getDeityPhotoUris(deityId)
      .then((uris) => !cancelled && setPhotoUris(uris))
      .catch(() => !cancelled && setPhotoUris([]));
    if (hasDeityCard(deityId)) getDeityCardUri(deityId).then((uri) => !cancelled && setCardUri(uri));
    else setCardUri(null);
    return () => {
      cancelled = true;
    };
  }, [deityId]);

  // Everything that can be shared, in the order it's shown: their own
  // photo/video first, then this deity's pictures, then the branded card.
  const options: ShareMedia[] = [
    ...(customMedia ? [customMedia] : []),
    ...photoUris.map((uri): ShareMedia => ({ uri, type: 'image' })),
    ...(cardUri ? [{ uri: cardUri, type: 'image' } as ShareMedia] : []),
  ];
  const selection = selectedUris ?? (options[0] ? [options[0].uri] : []);
  const chosen = options.filter((o) => selection.includes(o.uri));

  const toggle = (uri: string) =>
    setSelectedUris(selection.includes(uri) ? selection.filter((u) => u !== uri) : [...selection, uri]);

  const shareTextViaSheet = async () => {
    try {
      await Share.share({ message });
    } catch {
      // user dismissed the share sheet - nothing to do
    }
  };

  // The OS share sheet takes one file at a time, so several pictures go out
  // one after another, asking before each next one.
  const shareViaSheet = async (items: ShareMedia[], dialogTitle?: string) => {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert(
        'Sharing a photo isn’t supported here',
        'This browser/device can’t attach a photo or video to a share. Open the app on your phone to share the image, or continue with text only.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Share text only', onPress: shareTextViaSheet },
        ]
      );
      return;
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        await Sharing.shareAsync(item.uri, {
          mimeType: item.type === 'video' ? 'video/*' : 'image/*',
          UTI: item.type === 'video' ? 'public.movie' : 'public.image',
          dialogTitle,
        });
      } catch (error) {
        if (!isDismissal(error)) {
          Alert.alert('Couldn’t open the share sheet', error instanceof Error ? error.message : String(error));
        }
        return;
      }
      if (i < items.length - 1 && !(await askNext(i + 1, items.length))) return;
    }
  };

  const shareToWhatsApp = async () => {
    if (chosen.length > 0) return shareViaSheet(chosen, 'Choose WhatsApp to share');
    // No picture selected: WhatsApp's own URL scheme opens it directly with
    // the message pre-filled (no canOpenURL - that needs the scheme declared
    // in the native config; openURL just fails if WhatsApp isn't installed).
    try {
      await Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
    } catch {
      await shareTextViaSheet();
    }
  };

  const needPicture = (app: string) =>
    Alert.alert('Select a picture first', `${app} needs a picture or video to share - tap one above, then try again.`);

  const shareToInstagram = async () => {
    if (chosen.length === 0) return needPicture('Instagram');
    await shareViaSheet(chosen, 'Choose Instagram to share');
  };

  const shareToFacebook = async () =>
    chosen.length > 0 ? shareViaSheet(chosen, 'Choose Facebook to share') : shareTextViaSheet();

  const shareMore = async () => (chosen.length > 0 ? shareViaSheet(chosen) : shareTextViaSheet());

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
      setSelectedUris([...selection.filter((u) => u !== customMedia?.uri), next.uri]);
    } finally {
      setBusy(false);
    }
  };

  // Falls back to this deity's own pictures (or the card) rather than to
  // nothing - there's always something reasonable to share.
  const removeMedia = async () => {
    await setShareMedia(deityId, null);
    setSelectedUris(selection.filter((u) => u !== customMedia?.uri));
    setCustomMedia(null);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView type="backgroundElement" style={styles.mediaCard}>
        {options.length > 0 ? (
          <ThemedView type="backgroundElement" style={styles.mediaCardBody}>
            <ThemedView type="backgroundElement" style={styles.grid}>
              {options.map((option) => {
                const selected = selection.includes(option.uri);
                return (
                  <Pressable
                    key={option.uri}
                    onPress={() => toggle(option.uri)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}>
                    <Image
                      source={{ uri: option.uri }}
                      style={[styles.thumbnail, { borderColor: selected ? theme.primary : 'transparent' }]}
                    />
                    {selected && (
                      <ThemedView style={[styles.check, { backgroundColor: theme.primary }]}>
                        <ThemedText style={[styles.checkMark, { color: theme.primaryText }]}>✓</ThemedText>
                      </ThemedView>
                    )}
                    {option.type === 'video' && <ThemedText style={styles.playBadge}>▶</ThemedText>}
                  </Pressable>
                );
              })}
            </ThemedView>
            <ThemedText type="small" themeColor="textSecondary">
              {chosen.length > 0 ? t('share.selectedCount', { count: chosen.length }) : t('share.noneSelected')}
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.mediaActions}>
              <Pressable onPress={pickMedia} disabled={busy}>
                <ThemedText type="linkPrimary">{customMedia ? t('common.change') : t('share.useOwnInstead')}</ThemedText>
              </Pressable>
              {customMedia && (
                <Pressable onPress={removeMedia} disabled={busy}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('common.remove')}
                  </ThemedText>
                </Pressable>
              )}
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

      <ThemedView style={styles.platformRow}>
        <PlatformButton label={t('share.whatsapp')} icon="💬" onPress={shareToWhatsApp} />
        <PlatformButton label={t('share.instagram')} icon="📸" onPress={shareToInstagram} />
        <PlatformButton label={t('share.facebook')} icon="📘" onPress={shareToFacebook} />
        <PlatformButton label={t('share.more')} icon="↗️" onPress={shareMore} />
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
  mediaCardBody: {
    gap: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  thumbnail: {
    width: 76,
    height: 76,
    borderRadius: Spacing.two,
    borderWidth: 2.5,
  },
  check: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },
  playBadge: {
    position: 'absolute',
    right: Spacing.two,
    bottom: Spacing.one,
    color: '#FFFFFF',
    fontSize: 14,
  },
  mediaActions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
});
