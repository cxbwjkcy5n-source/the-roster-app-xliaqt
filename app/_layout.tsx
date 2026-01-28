
import "react-native-url-polyfill/auto";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { useColorScheme, Alert, Platform } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/contexts/AuthContext";
import { RosterProvider } from "@/contexts/RosterContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from "@/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  React.useEffect(() => {
    if (Platform.OS !== 'web' && !networkState.isConnected && networkState.isInternetReachable === false) {
      Alert.alert(
        "🔌 You are offline",
        "You can keep using the app! Your changes will be saved locally and synced when you are back online."
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  if (!loaded) {
    return null;
  }

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "rgb(0, 122, 255)",
      background: "rgb(242, 242, 247)",
      card: "rgb(255, 255, 255)",
      text: "rgb(0, 0, 0)",
      border: "rgb(216, 216, 220)",
      notification: "rgb(255, 59, 48)",
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "rgb(10, 132, 255)",
      background: "rgb(1, 1, 1)",
      card: "rgb(28, 28, 30)",
      text: "rgb(255, 255, 255)",
      border: "rgb(44, 44, 46)",
      notification: "rgb(255, 69, 58)",
    },
  };

  return (
    <ErrorBoundary>
      <StatusBar style="auto" animated />
      <ThemeProvider
        value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
      >
        <AuthProvider>
          <RosterProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="auth/login" />
                <Stack.Screen name="auth/signup" />
                <Stack.Screen name="auth-callback" />
                <Stack.Screen name="auth-popup" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="person/add" />
                <Stack.Screen name="person/[id]" />
                <Stack.Screen name="privacy-policy" />
                <Stack.Screen name="eula" />
                <Stack.Screen name="dating/history" />
                <Stack.Screen name="dating/plan" />
                <Stack.Screen name="dating/schedule" />
                <Stack.Screen name="dating/safety" />
                <Stack.Screen name="dating/analytics" />
                <Stack.Screen name="dating/coach" />
              </Stack>
              {Platform.OS !== 'web' && <SystemBars style="auto" />}
            </GestureHandlerRootView>
          </RosterProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
