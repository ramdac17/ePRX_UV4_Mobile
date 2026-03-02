// 1. ABSOLUTE TOP - This handles all the polyfilling we proved in UV3
import "../globals";

import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useEffect, useState, useCallback } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { LogBox } from "react-native";
// ✅ Now using the centralized secure helper
import { getToken } from "@/utils/authStorage";

LogBox.ignoreLogs(["Require cycle:", "Non-serializable values"]);

const MyCyberTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#050505",
    card: "#050505",
    text: "#FFFFFF",
    primary: "#00F0FF",
    border: "rgba(0, 240, 255, 0.3)",
  },
};

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  // ✅ Unified Auth Check - Corrected to use SecureStore via authStorage helper
  const checkAuthStatus = useCallback(async () => {
    try {
      // ✅ No longer checking AsyncStorage manually; using the secure 'eprx_auth_token' key
      const token = await getToken();
      const exists = !!token;

      // Only update state if it actually changed to prevent render loops
      setHasToken(exists);
    } catch (e) {
      console.error("📡 AUTH_INIT_FAILURE:", e);
      setHasToken(false);
    } finally {
      setIsAuthLoaded(true);
    }
  }, []);

  // ✅ Effect 1: Run check on Mount AND every time segments change
  // This ensures that when you move from /login to /dashboard,
  // the layout re-reads the fresh token from SecureStore.
  useEffect(() => {
    checkAuthStatus();
  }, [segments, checkAuthStatus]);

  // ✅ Effect 2: Guard Logic
  useEffect(() => {
    // Wait for the initial secure storage read to complete
    if (!isAuthLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    console.log(
      `📡 SYSTEM_GUARD: [Loaded: ${isAuthLoaded}] [Token: ${hasToken}] [InAuth: ${inAuthGroup}]`,
    );

    if (!hasToken && !inAuthGroup) {
      // No key detected in SecureStore -> Redirect to Gate
      router.replace("/(auth)/login");
    } else if (hasToken && inAuthGroup) {
      // Key verified -> Grant Access to System
      router.replace("/(tabs)");
    }
  }, [hasToken, isAuthLoaded, segments]);

  // Prevent flickering while checking storage on boot
  if (!isAuthLoaded) return null;

  return (
    <ThemeProvider value={MyCyberTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
