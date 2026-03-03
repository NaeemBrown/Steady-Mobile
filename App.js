import "react-native-gesture-handler";
import { useEffect } from "react";
import { StatusBar, ActivityIndicator, View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./context/AuthProvider.jsx";
import { ThemeProvider, useTheme } from "./lib/theme.js";
import AuthNavigator from "./navigation/AuthNavigator";
import TabNavigator from "./navigation/TabNavigator";

const RootStack = createNativeStackNavigator();

function RootNavigator() {
  const { user, loading } = useAuth();
  const { t, changeTheme } = useTheme();

  useEffect(() => {
    if (user?.theme) changeTheme(user.theme);
  }, [user?.theme]);

  if (loading) {
    const lightThemes = ["cloud", "rose"];
    const isDark = !lightThemes.includes(t.id);
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: t.bg }}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={t.bg} />
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
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={t.bg} />
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
          {user ? (
            <RootStack.Screen name="Tabs" component={TabNavigator} />
          ) : (
            <RootStack.Screen name="Auth" component={AuthNavigator} />
          )}
        </RootStack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider>
            <RootNavigator />
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
