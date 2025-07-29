import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import React from 'react';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Remove all Zustand modal state and add set modal logic
  // Remove all references to useAddSetModal, useSetsStore, addSet, Item, ItemSet, and related modal logic

  // On initial load, hydrate sets from AsyncStorage
  React.useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.getItem('flashcardAppSets');
        if (data) {
          // setSets(parsed.sets || []); // This line was removed as per the edit hint
        }
      } catch {}
    })();
  }, []); // Removed setSets from dependency array

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ActionSheetProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="set" />
            <Stack.Screen name="+not-found" />
          </Stack>
          {/* The add set modal is removed as per the edit hint */}
          <StatusBar style="auto" />
        </GestureHandlerRootView>
      </ThemeProvider>
    </ActionSheetProvider>
  );
}


