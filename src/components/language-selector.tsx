import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { LANGUAGES, getLanguageById } from '@/lib/i18n/languages';
import { useTranslation } from '@/hooks/use-translation';

// Mirrors RegionSelector's trigger+modal shape - a small pill that opens a
// full-screen list of the five supported languages, shown in each
// language's own script. Persists via LanguageContext, same as region.
export function LanguageSelector({ fullWidth = false }: { fullWidth?: boolean }) {
  const { languageId, setLanguageId } = useLanguage();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = getLanguageById(languageId);

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={({ pressed }) => [styles.triggerHost, fullWidth && styles.triggerHostFull, pressed && styles.pressed]}>
        <ThemedView type="backgroundElement" style={[styles.trigger, fullWidth && styles.triggerFull]}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
            {t('home.language')}
          </ThemedText>
          <ThemedText type="smallBold" style={[styles.value, fullWidth && styles.valueFull]}>{current.nativeLabel}</ThemedText>
        </ThemedView>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheetWrapper} onPress={(e) => e.stopPropagation()}>
            <ThemedView type="background" style={styles.sheet}>
              <SafeAreaView edges={['bottom']}>
                <ThemedText type="smallBold" style={styles.sheetTitle}>
                  {t('onboarding.languageHeading')}
                </ThemedText>
                <FlatList
                  data={LANGUAGES}
                  keyExtractor={(item) => item.id}
                  style={styles.list}
                  renderItem={({ item }) => {
                    const selected = item.id === languageId;
                    return (
                      <Pressable
                        onPress={() => {
                          setLanguageId(item.id);
                          setOpen(false);
                        }}>
                        <ThemedView type={selected ? 'backgroundSelected' : 'background'} style={styles.option}>
                          <ThemedText type={selected ? 'smallBold' : 'small'}>{item.nativeLabel}</ThemedText>
                        </ThemedView>
                      </Pressable>
                    );
                  }}
                />
              </SafeAreaView>
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  triggerHost: {
    maxWidth: '100%',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  // Home's version: a full-width row, label on the left and the value on the
  // right.
  triggerHostFull: {
    alignSelf: 'stretch',
  },
  triggerFull: {
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  label: {
    flexShrink: 0,
  },
  // Lets a long value wrap inside the pill instead of pushing it off-screen.
  value: {
    flexShrink: 1,
  },
  valueFull: {
    textAlign: 'right',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetWrapper: {
    maxHeight: '70%',
  },
  sheet: {
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    paddingTop: Spacing.three,
  },
  sheetTitle: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  list: {
    paddingHorizontal: Spacing.three,
  },
  option: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
});
