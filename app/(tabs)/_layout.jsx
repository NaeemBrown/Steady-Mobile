import { Tabs } from "expo-router";
import { View, Text } from "react-native";
import { useTheme } from "../../lib/theme.js";

const ICONS = {
  Dashboard: "📊", Calendar: "📅", Events: "📋",
  Health: "❤️", People: "👥", Settings: "⚙️",
};

function TabIcon({ label, focused, color }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 2 }}>
      <Text style={{ fontSize: focused ? 22 : 20 }}>{ICONS[label] || "•"}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { t } = useTheme();

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: t.accent,
      tabBarInactiveTintColor: t.textMuted,
      tabBarStyle: {
        backgroundColor: t.bg,
        borderTopColor: t.border,
        borderTopWidth: 1,
        height: 64,
        paddingBottom: 10,
        paddingTop: 6,
      },
      tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
    }}>
      <Tabs.Screen name="index" options={{
        title: "Dashboard",
        tabBarIcon: ({ focused, color }) => <TabIcon label="Dashboard" focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="calendar" options={{
        title: "Calendar",
        tabBarIcon: ({ focused, color }) => <TabIcon label="Calendar" focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="events" options={{
        title: "Events",
        tabBarIcon: ({ focused, color }) => <TabIcon label="Events" focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="health" options={{
        title: "Health",
        tabBarIcon: ({ focused, color }) => <TabIcon label="Health" focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="people" options={{
        title: "People",
        tabBarIcon: ({ focused, color }) => <TabIcon label="People" focused={focused} color={color} />,
      }} />
      <Tabs.Screen name="settings" options={{
        title: "Settings",
        tabBarIcon: ({ focused, color }) => <TabIcon label="Settings" focused={focused} color={color} />,
      }} />
    </Tabs>
  );
}
