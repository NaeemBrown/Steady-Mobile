import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "../../context/AuthProvider.jsx";
import { useTheme } from "../../lib/theme.js";

export default function SettingsScreen() {
  const { user, logout, patchProfile } = useAuth();
  const { t, themeId, changeTheme, themes, themeOrder } = useTheme();

  const handleTheme = async (id) => {
    changeTheme(id);
    try { await patchProfile({ theme: id }); } catch {}
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const isDark = (theme) => {
    const bg = theme.bg;
    return bg !== "#FFF5F7" && bg !== "#F5F0FF" && bg !== "transparent";
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: 52, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: t.bgSoft, borderBottomWidth: 1, borderBottomColor: t.border }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: t.text }}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Profile */}
        <View style={{ backgroundColor: t.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: t.border, marginBottom: 16, alignItems: "center" }}>
          <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: t.accent, justifyContent: "center", alignItems: "center", marginBottom: 10 }}>
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>
              {user?.displayName?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "U"}
            </Text>
          </View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: t.text }}>{user?.displayName || "User"}</Text>
          <Text style={{ fontSize: 13, color: t.textSecondary, marginTop: 2 }}>{user?.email}</Text>
        </View>

        {/* Theme Picker */}
        <View style={{ backgroundColor: t.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: t.border, marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: t.text, marginBottom: 12 }}>Theme</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {themeOrder.map(id => {
              const th = themes[id];
              const active = id === themeId;
              return (
                <TouchableOpacity key={id} onPress={() => handleTheme(id)} activeOpacity={0.7}
                  style={{
                    width: "47%", flexDirection: "row", alignItems: "center", gap: 10,
                    padding: 12, borderRadius: 12,
                    backgroundColor: active ? `${th.accent}18` : t.bgSoft,
                    borderWidth: 2, borderColor: active ? th.accent : t.border,
                  }}>
                  {/* Color swatch */}
                  <View style={{ flexDirection: "row", gap: 2 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: th.bg === "transparent" ? "#F5F0FF" : th.bg }} />
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: th.accent }} />
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: th.success }} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: active ? th.accent : t.text }}>
                      {th.emoji} {th.name}
                    </Text>
                  </View>
                  {active && <Text style={{ fontSize: 12, color: th.accent }}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* App info */}
        <View style={{ backgroundColor: t.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: t.border, marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: t.text, marginBottom: 8 }}>About</Text>
          {[
            { label: "Version", value: "1.0.0" },
            { label: "SDK", value: "Expo 52" },
            { label: "Backend", value: "Firebase" },
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: t.border }}>
              <Text style={{ fontSize: 13, color: t.textSecondary }}>{item.label}</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: t.text }}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.8}
          style={{
            backgroundColor: `${t.danger}12`, borderRadius: 14, padding: 16,
            alignItems: "center", borderWidth: 1, borderColor: `${t.danger}30`,
          }}>
          <Text style={{ color: t.danger, fontSize: 15, fontWeight: "700" }}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
