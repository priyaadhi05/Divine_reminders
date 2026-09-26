import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTranslation } from '@/hooks/use-translation';
import { regionOptions, resolveRegionTimeZone } from '@/lib/regions';

// The event detail screen's "See in" pill: a one-off "what would this look
// like in Germany?" peek at a festival's timing in another country. Nothing
// is saved - the page always opens on the phone's own time zone.
export function RegionSelector({
  regionId,
  onChange,
  label,
  sheetTitle,
}: {
  regionId: string;
  onChange: (id: string) => void;
  label: string;
  sheetTitle: string;
}) {
  const { languageId } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = resolveRegionTimeZone(regionId, languageId);

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={({ pressed }) => [styles.triggerHost, pressed && styles.pressed]}>
        <ThemedView type="backgroundElement" style={styles.trigger}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
            {label}
          </ThemedText>
          <ThemedText type="smallBold" style={styles.value}>{current.label}</ThemedText>
        </ThemedView>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheetWrapper} onPress={(e) => e.stopPropagation()}>
            <ThemedView type="background" style={styles.sheet}>
              <SafeAreaView edges={['bottom']}>
                <ThemedText type="smallBold" style={styles.sheetTitle}>
                  {sheetTitle}
                </ThemedText>
                <FlatList
                  data={regionOptions(languageId)}
                  keyExtractor={(item) => item.id}
                  style={styles.list}
                  renderItem={({ item }) => {
                    const selected = item.id === regionId;
                    return (
                      <Pressable
                        onPress={() => {
                          onChange(item.id);
                          setOpen(false);
                        }}>
                        <ThemedView
                          type={selected ? 'backgroundSelected' : 'background'}
                          style={styles.option}>
                          <ThemedText type={selected ? 'smallBold' : 'small'}>{item.label}</ThemedText>
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
  label: {
    flexShrink: 0,
  },
  // Lets a long value wrap inside the pill instead of pushing it off-screen.
  value: {
    flexShrink: 1,
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
