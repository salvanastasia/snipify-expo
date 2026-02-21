import { useEffect } from "react";
import { View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider, useTheme } from "@/lib/theme-context";

SplashScreen.preventAutoHideAsync();

const DOTO_FONT = require("@/assets/fonts/Doto-VariableFont_ROND,wght.ttf");
const MD_NICHROME_REGULAR = require("@/assets/fonts/MDNichromeTest-Regular.otf");
const MD_NICHROME_BOLD = require("@/assets/fonts/MDNichromeTest-Bold.otf");

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(app)");
    }
  }, [user, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

function StatusBarThemed() {
  const { colors } = useTheme();
  return <StatusBar style={colors.statusBar} />;
}

function ThemeRoot() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBarThemed />
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Doto: DOTO_FONT,
    MDNichrome: MD_NICHROME_REGULAR,
    MDNichromeBold: MD_NICHROME_BOLD,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeRoot />
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
