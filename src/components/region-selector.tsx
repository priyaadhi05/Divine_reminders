import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRegion } from '@/contexts/region-context';
import { Spacing } from '@/constants/theme';
import { AUTO_REGION_ID, REGIONS, resolveRegionTimeZone } from '@/lib/regions';

export function RegionSelector() {
  const { regionId, setRegionId } = useRegion();
  const [open, setOpen] = useState(false);
  const current = resolveRegionTimeZone(regionId);

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={({ pressed }) => pressed && styles.pressed}>
        <ThemedView type="backgroundElement" style={styles.trigger}>
          <ThemedText type="small" themeColor="textSecondary">
            Region
          </ThemedText>
          <ThemedText type="smallBold">{current.label}</ThemedText>
        </ThemedView>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheetWrapper} onPress={(e) => e.stopPropagation()}>
            <ThemedView type="background" style={styles.sheet}>
              <SafeAreaView edges={['bottom']}>
                <ThemedText type="smallBold" style={styles.sheetTitle}>
                  Select your region
                </ThemedText>
                <FlatList
                  data={[{ id: AUTO_REGION_ID, label: resolveRegionTimeZone(AUTO_REGION_ID).label }, ...REGIONS]}
                  keyExtractor={(item) => item.id}
                  style={styles.list}
                  renderItem={({ item }) => {
                    const selected = item.id === regionId;
                    return (
                      <Pressable
                        onPress={() => {
                          setRegionId(item.id);
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
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    alignSelf: 'flex-start',
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
