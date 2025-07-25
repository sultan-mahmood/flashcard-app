import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
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
          const parsed = JSON.parse(data);
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
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        {/* The add set modal is removed as per the edit hint */}
        <StatusBar style="auto" />
      </ThemeProvider>
    </ActionSheetProvider>
  );
}

const modalStyles = StyleSheet.create({
  input: {
    width: '100%',
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 18,
  },
});
