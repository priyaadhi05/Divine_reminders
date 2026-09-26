import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Linking, Platform, Pressable, Share, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

import { GreetingCard } from '@/components/greeting-card';
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
//     lib/deity-cards.ts) as a grid - tap one to pick it (tapping it again
//     unpicks it, for a text-only share). Only one picture goes out per
//     share: most apps drop the message when several pictures are sent
//     together, so the app link would get lost. Someone's own photo or
//     video can be added and shows first.
//  2. WhatsApp / Instagram / Facebook / More, which act on the selection.
// What each button can actually do is limited by the OS: nothing here can
// open a specific app *with* an attachment, so every picture share goes
// through the OS share sheet for the person to pick the app. So:
//  - WhatsApp with nothing selected opens WhatsApp (app or Web) directly via
//    the universal wa.me link with the message text pre-filled.
//  - Every button with a picture picked writes the greeting (and the app
//    link) underneath the whole, uncropped picture first (see GreetingCard /
//    composeCaption below), then opens the share sheet with that picture
//    *and* the message, so the link also travels as tappable text
//    (react-native-share - see shareWithMessage). That's a native module, so
//    in Expo Go it isn't there and the picture goes out on its own via
//    expo-sharing, with the link only on the picture. On web, the real Web
//    Share API is used instead when available (see shareViaWebShare) - it
//    carries the message and the picture together, no compositing needed.
interface SharePanelProps {
  deityId: string;
  // The full share message (lib/share-greeting.ts's greeting plus the app's
  // own name/install line) - used as the text-only WhatsApp/More message,
  // and written onto each selected picture before it's shared (see
  // composeCaption below), so the app link travels with a picture too and
  // not just a bare text share.
  message: string;
}

function isDismissal(error: unknown): boolean {
  const e = error as { name?: string; message?: string };
  const text = `${e?.name ?? ''} ${e?.message ?? ''}`.toLowerCase();
  return text.includes('abort') || text.includes('cancel') || text.includes('dismiss');
}

// react-native-share looks its native module up as soon as it's imported,
// which throws in Expo Go (no custom native code there) - so it's loaded
// lazily, and null means "fall back to expo-sharing, picture only".
type NativeShare = typeof import('react-native-share').default;
let nativeShare: NativeShare | null | undefined;
function loadNativeShare(): NativeShare | null {
  if (nativeShare === undefined) {
    try {
      nativeShare = require('react-native-share').default as NativeShare;
    } catch {
      nativeShare = null;
    }
  }
  return nativeShare;
}

export function SharePanel({ deityId, message }: SharePanelProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [customMedia, setCustomMedia] = useState<ShareMedia | null>(null);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [cardUri, setCardUri] = useState<string | null>(null);
  // undefined = untouched, which means "the first picture"; null = none
  // picked (text-only share)
  const [pickedUri, setPickedUri] = useState<string | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  // Off-screen rig that writes `caption` onto one picture at a time before
  // it's shared (see GreetingCard) - a share sheet/WhatsApp only carries one
  // attachment and no separate caption field, so the message has to be part
  // of the picture itself. `captureJob` holds the in-flight request; its
  // `resolve` is called once the composited file is ready.
  const cardRef = useRef<View>(null);
  const [captureJob, setCaptureJob] = useState<{
    uri: string;
    aspectRatio: number;
    resolve: (out: string) => void;
  } | null>(null);

  // The card is laid out in the photo's own shape, so its size is needed up
  // front; a square is the fallback if it can't be read.
  const composeCaption = async (uri: string): Promise<string> => {
    const aspectRatio = await Image.getSize(uri)
      .then(({ width, height }) => (width > 0 && height > 0 ? width / height : 1))
      .catch(() => 1);
    return new Promise((resolve) => setCaptureJob({ uri, aspectRatio, resolve }));
  };

  const handleCardReady = async () => {
    if (!captureJob) return;
    const { uri, resolve } = captureJob;
    try {
      // Let the freshly-loaded image actually paint before grabbing pixels.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      resolve(await captureRef(cardRef, { format: 'jpg', quality: 0.92 }));
    } catch {
      resolve(uri); // couldn't composite - share the plain picture rather than nothing
    } finally {
      setCaptureJob(null);
    }
  };

  // Videos can't be captioned this way, so they're shared as-is. Web has no
  // expo-sharing implementation at all (shareViaSheet below already shows
  // its own "not supported here" message for that) and react-native-view-shot
  // doesn't reliably capture there either, so compositing is skipped on web
  // rather than hanging in front of that existing message.
  const withCaption = async (item: ShareMedia): Promise<ShareMedia> =>
    Platform.OS === 'web' || item.type === 'video' ? item : { uri: await composeCaption(item.uri), type: 'image' };

  useEffect(() => {
    let cancelled = false;
    setPickedUri(undefined);
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
  const selectedUri = pickedUri === undefined ? (options[0]?.uri ?? null) : pickedUri;
  const chosen = options.find((o) => o.uri === selectedUri) ?? null;

  const toggle = (uri: string) => setPickedUri(uri === selectedUri ? null : uri);

  const shareTextViaSheet = async () => {
    try {
      await Share.share({ message });
    } catch {
      // user dismissed the share sheet - nothing to do
    }
  };

  // The picture and the message in one share sheet.
  const shareWithMessage = async (share: NativeShare, item: ShareMedia, dialogTitle?: string) => {
    try {
      await share.open({
        url: item.uri,
        type: item.type === 'video' ? 'video/*' : 'image/*',
        message,
        title: dialogTitle,
        failOnCancel: false,
      });
    } catch (error) {
      if (!isDismissal(error)) {
        console.warn('Share.open failed', error);
        Alert.alert(t('share.sheetFailed'), t('share.tryAgain'));
      }
    }
  };

  const shareViaSheet = async (item: ShareMedia, dialogTitle?: string) => {
    const share = loadNativeShare();
    if (share) return shareWithMessage(share, item, dialogTitle);
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert(t('share.photoUnsupportedTitle'), t('share.photoUnsupportedBody'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('share.textOnly'), onPress: shareTextViaSheet },
      ]);
      return;
    }
    try {
      await Sharing.shareAsync(item.uri, {
        mimeType: item.type === 'video' ? 'video/*' : 'image/*',
        UTI: item.type === 'video' ? 'public.movie' : 'public.image',
        dialogTitle,
      });
    } catch (error) {
      if (!isDismissal(error)) {
        console.warn('shareAsync failed', error);
        Alert.alert(t('share.sheetFailed'), t('share.tryAgain'));
      }
    }
  };

  // Web has no expo-sharing implementation, but the real Web Share API
  // (Safari/Chrome on phones, some desktop browsers) can share files *and*
  // text together in one call - unlike the native OS share sheet, so no
  // on-picture compositing is needed here at all.
  const canWebShare =
    Platform.OS === 'web' && typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const shareViaWebShare = async (item: ShareMedia) => {
    try {
      const blob = await (await fetch(item.uri)).blob();
      const ext = item.type === 'video' ? 'mp4' : 'jpg';
      const files = [
        new File([blob], `deiva-dinam.${ext}`, {
          type: blob.type || (item.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        }),
      ];
      const shareData = { text: message, files };
      await navigator.share(navigator.canShare && !navigator.canShare(shareData) ? { files } : shareData);
    } catch (error) {
      if (!isDismissal(error)) {
        Alert.alert(t('share.failedTitle'), t('share.webFailedBody'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('share.textOnly'), onPress: shareTextViaSheet },
        ]);
      }
    }
  };

  const shareSelected = async (item: ShareMedia, dialogTitle?: string) =>
    canWebShare ? shareViaWebShare(item) : shareViaSheet(await withCaption(item), dialogTitle);

  const shareToWhatsApp = async () => {
    if (chosen) return shareSelected(chosen, t('share.chooseApp', { app: t('share.whatsapp') }));
    // No picture selected: the universal wa.me link opens the WhatsApp app
    // (native) or WhatsApp Web (browser) directly with the message
    // pre-filled - the one direct route there is, either way.
    try {
      await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
    } catch {
      await shareTextViaSheet();
    }
  };

  const needPicture = (app: string) =>
    Alert.alert(t('share.needPictureTitle'), t('share.needPictureBody', { app }));

  const shareToInstagram = async () => {
    if (!chosen) return needPicture(t('share.instagram'));
    await shareSelected(chosen, t('share.chooseApp', { app: t('share.instagram') }));
  };

  const shareToFacebook = async () =>
    chosen ? shareSelected(chosen, t('share.chooseApp', { app: t('share.facebook') })) : shareTextViaSheet();

  const shareMore = async () => (chosen ? shareSelected(chosen) : shareTextViaSheet());

  const pickMedia = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('share.permissionTitle'), t('share.permissionBody'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        videoMaxDuration: 60,
        quality: 0.8,
      });
      const asset = result.canceled ? undefined : result.assets[0];
      if (!asset) return;
      const picked: ShareMedia = { uri: asset.uri, type: asset.type === 'video' ? 'video' : 'image' };
      // Falls back to the picker's own copy if keeping it fails - it still
      // works for now, it just won't be remembered.
      const next = (await setShareMedia(deityId, picked).catch(() => null)) ?? picked;
      setCustomMedia(next);
      setPickedUri(next.uri);
    } finally {
      setBusy(false);
    }
  };

  // Falls back to this deity's own pictures (or the card) rather than to
  // nothing - there's always something reasonable to share.
  const removeMedia = async () => {
    await setShareMedia(deityId, null);
    if (selectedUri === customMedia?.uri) setPickedUri(undefined);
    setCustomMedia(null);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView type="backgroundElement" style={styles.mediaCard}>
        {options.length > 0 ? (
          <ThemedView type="backgroundElement" style={styles.mediaCardBody}>
            <ThemedView type="backgroundElement" style={styles.grid}>
              {options.map((option) => {
                const selected = option.uri === selectedUri;
                return (
                  <Pressable
                    key={option.uri}
                    onPress={() => toggle(option.uri)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}>
                    {/* "contain", not the default "cover" - the whole picture, as
                        it'll actually be sent, rather than a cropped square. */}
                    <Image
                      source={{ uri: option.uri }}
                      resizeMode="contain"
                      style={[
                        styles.thumbnail,
                        { borderColor: selected ? theme.primary : 'transparent', backgroundColor: theme.backgroundSelected },
                      ]}
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
              {chosen ? t('share.pickOne') : t('share.noneSelected')}
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
        <PlatformButton label={t('share.whatsapp')} icon="💬" onPress={shareToWhatsApp} disabled={!!captureJob} />
        <PlatformButton label={t('share.instagram')} icon="📸" onPress={shareToInstagram} disabled={!!captureJob} />
        <PlatformButton label={t('share.facebook')} icon="📘" onPress={shareToFacebook} disabled={!!captureJob} />
        <PlatformButton label={t('share.more')} icon="↗️" onPress={shareMore} disabled={!!captureJob} />
      </ThemedView>

      {captureJob && (
        <View style={styles.captureHost} pointerEvents="none">
          <GreetingCard
            photoUri={captureJob.uri}
            aspectRatio={captureJob.aspectRatio}
            caption={message}
            ref={cardRef}
            onImageLoad={handleCardReady}
          />
        </View>
      )}
    </ThemedView>
  );
}

function PlatformButton({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled} style={styles.platformButtonFlex} accessibilityRole="button">
      <ThemedView
        type="backgroundElement"
        style={[styles.platformButton, { borderColor: theme.primary, opacity: disabled ? 0.5 : 1 }]}>
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
  captureHost: {
    position: 'absolute',
    top: -10000,
    left: 0,
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
