import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text } from "react-native";
import { useTheme } from "../lib/theme.js";

import DashboardScreen from "../screens/tabs/DashboardScreen";
import CalendarScreen from "../screens/tabs/CalendarScreen";
import EventsScreen from "../screens/tabs/EventsScreen";
import HealthScreen from "../screens/tabs/HealthScreen";
import PeopleScreen from "../screens/tabs/PeopleScreen";
import SettingsScreen from "../screens/tabs/SettingsScreen";

const Tab = createBottomTabNavigator();

const ICONS = {
  Dashboard: "📊",
  Calendar: "📅",
  Events: "📋",
  Health: "❤️",
  People: "👥",
  Settings: "⚙️",
};

function TabIcon({ label, focused }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 2 }}>
      <Text style={{ fontSize: focused ? 22 : 20 }}>{ICONS[label] || "•"}</Text>
    </View>
  );
}

export default function TabNavigator() {
  const { t } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
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
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Dashboard" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Calendar" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Events" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Health"
        component={HealthScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Health" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="People"
        component={PeopleScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="People" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Settings" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
