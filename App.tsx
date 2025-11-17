import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { queryClient } from "@/lib/queryClient";
import RootStackNavigator from "@/navigation/RootNavigator";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";

/*
IMPORTANT NOTICE: DO NOT REMOVE
There are already environment keys in the project.
Before telling the user to add them, check if you already have access to the required keys through bash.
Directly access them with process.env.${key}

Correct usage:
process.env.EXPO_PUBLIC_VIBECODE_{key}
//directly access the key

Incorrect usage:
import { OPENAI_API_KEY } from '@env';
//don't use @env, its depreicated

Incorrect usage:
import Constants from 'expo-constants';
const openai_api_key = Constants.expoConfig.extra.apikey;
//don't use expo-constants, its depreicated

*/

// Create a wrapper component that has access to theme
function AppContent() {
  const { isDayMode, colors } = useTheme();

  // Clear any stale navigation state on mount to prevent navigation errors
  useEffect(() => {
    const clearStaleNavigationState = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const navigationKeys = keys.filter(key =>
          key.includes('navigation') ||
          key.includes('NAVIGATION_STATE')
        );
        if (navigationKeys.length > 0) {
          await AsyncStorage.multiRemove(navigationKeys);
          console.log('Cleared stale navigation state');
        }
      } catch (error) {
        console.log('Could not clear navigation state:', error);
      }
    };
    clearStaleNavigationState();
  }, []);

  // Create custom navigation theme based on current app theme
  const navigationTheme = isDayMode
    ? {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: colors.primary,
          background: colors.backgroundSolid,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
      }
    : {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: colors.primary,
          background: colors.backgroundSolid,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
      };

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStackNavigator />
      <StatusBar style={isDayMode ? "dark" : "light"} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <KeyboardProvider>
            <GestureHandlerRootView>
              <SafeAreaProvider>
                <AppContent />
              </SafeAreaProvider>
            </GestureHandlerRootView>
          </KeyboardProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
