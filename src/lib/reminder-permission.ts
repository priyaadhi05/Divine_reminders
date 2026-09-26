import { Alert, Linking, Platform } from 'react-native';

import type { useTranslation } from '@/hooks/use-translation';
import { areRemindersEnabled, enableReminders, hasNotificationPermission } from '@/lib/notifications';

type T = ReturnType<typeof useTranslation>['t'];

// Once someone has said "Don't allow", the OS never shows its permission
// prompt again - the only way back is the phone's Settings. Without this, a
// reminder toggle would flip on and then silently never notify.
export function alertRemindersBlocked(t: T) {
  Alert.alert(t('notify.blockedTitle'), t('notify.blockedBody'), [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('notify.openSettings'), onPress: () => Linking.openSettings() },
  ]);
}

// Called before turning any reminder on. Asks for permission if needed and
// says so when it's blocked. The follow itself is still saved either way, so
// it starts working as soon as notifications are allowed.
export async function ensureRemindersAllowed(t: T): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if ((await areRemindersEnabled()) && (await hasNotificationPermission())) return true;
  const granted = await enableReminders();
  if (!granted) alertRemindersBlocked(t);
  return granted;
}
