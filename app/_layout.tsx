import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useUserStore } from '@/stores/userStore';
import { useSessionStore } from '@/stores/sessionStore';
import { colors } from '@/utils/theme';

export default function RootLayout() {
  const loadProfile = useUserStore((s) => s.loadProfile);
  const loadSessions = useSessionStore((s) => s.loadSessions);

  useEffect(() => {
    loadProfile();
    loadSessions();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding/index" options={{ animation: 'fade' }} />
          <Stack.Screen name="exercise/[id]" />
          <Stack.Screen name="workout/create" />
          <Stack.Screen name="workout/[id]" />
          <Stack.Screen name="session/[id]" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="program/[id]" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
