import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View, Text } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthProvider.jsx";
import { ThemeProvider, useTheme } from "../lib/theme.js";

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const { t, changeTheme } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  // Sync theme from Firestore profile
  useEffect(() => {
    if (user?.theme) changeTheme(user.theme);
  }, [user?.theme]);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "(auth)";
    if (!user && !inAuth) router.replace("/(auth)/login");
    else if (user && inAuth) router.replace("/(tabs)");
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: t.bg }}>
        <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: t.accent, justifyContent: "center", alignItems: "center", marginBottom: 14 }}>
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>S</Text>
        </View>
        <ActivityIndicator size="large" color={t.accent} />
        <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 10 }}>Loading Steady...</Text>
      </View>
    );
  }

  const lightThemes = ["cloud", "rose"];
  const isDark = !lightThemes.includes(t.id);

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </AuthProvider>
  );
}
