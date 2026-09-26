import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { LanguageProvider } from '@/contexts/language-context';
import { RegionProvider } from '@/contexts/region-context';
import { getNotificationEventId, hasOnboarded, scheduleUpcomingReminders } from '@/lib/notifications';

SplashScreen.preventAutoHideAsync();

// A deep link straight to a deity or event screen still gets Home
// underneath it, so there's a back button to it.
export const unstable_settings = {
  anchor: 'index',
};

// Keeps the rolling reminder window (see scheduleUpcomingReminders) fresh and
// routes a tapped reminder notification straight to that event's detail
// screen - both a cold start (app launched by tapping it) and a tap while
// already running.
function useReminderSync() {
  useEffect(() => {
    scheduleUpcomingReminders();
    if (Platform.OS === 'web') return; // expo-notifications has no web implementation

    Notifications.getLastNotificationResponseAsync().then((response) => {
      const eventId = response && getNotificationEventId(response);
      if (eventId) router.push({ pathname: '/event/[id]', params: { id: eventId } });
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const eventId = getNotificationEventId(response);
      if (eventId) router.push({ pathname: '/event/[id]', params: { id: eventId } });
    });
    return () => subscription.remove();
  }, []);
}

// First launch (or any time onboarding hasn't been completed) goes straight
// to "Choose your deities" before the rest of the app - see
// src/app/onboarding.tsx.
function useOnboardingGate() {
  useEffect(() => {
    hasOnboarded().then((done) => {
      if (!done) router.replace('/onboarding');
    });
  }, []);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useReminderSync();
  useOnboardingGate();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <LanguageProvider>
        <RegionProvider>
          <AnimatedSplashOverlay />
          {/* No tab bar - Home is the root and every other screen is pushed
              on top of it with just a back arrow (no title, and no "Back" /
              previous-screen label next to the arrow). */}
          <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal', title: '' }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          </Stack>
        </RegionProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
