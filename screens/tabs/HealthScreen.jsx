import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useAuth } from "../../context/AuthProvider.jsx";
import { useTheme } from "../../lib/theme.js";

// Pedometer: expo-sensors removed. Add a native pedometer library if needed.
// e.g. react-native-pedometer or @react-native-community/pedometer
let Pedometer = null;

export default function HealthScreen() {
  const { getUserEvents } = useAuth();
  const { t } = useTheme();

  const [steps, setSteps] = useState(0);
  const [isPedometerAvailable, setAvailable] = useState(false);
  const [events, setEvents] = useState([]);
  const [stepGoal] = useState(10000);
  const [weekSteps] = useState([4200, 6800, 8100, 5400, 9200, 11000, steps]); // mock week + today

  useEffect(() => { getUserEvents().then(e => setEvents(e || [])).catch(() => {}); }, []);

  // Step counter
  useEffect(() => {
    if (!Pedometer) return;
    Pedometer.isAvailableAsync().then(setAvailable).catch(() => {});

    // Get today's steps
    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    Pedometer.getStepCountAsync(start, end).then(r => setSteps(r.steps)).catch(() => {});

    // Live updates
    const sub = Pedometer.watchStepCount(r => setSteps(prev => prev + r.steps));
    return () => sub?.remove();
  }, []);

  const healthEvents = events.filter(e => e.type === "health");
  const socialEvents = events.filter(e => e.type === "social");
  const focusEvents = events.filter(e => e.type === "focus");
  const pct = Math.min((steps / stepGoal) * 100, 100);
  const distance = ((steps * 0.762) / 1000).toFixed(1); // avg stride 0.762m
  const calories = Math.round(steps * 0.04);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxStep = Math.max(...weekSteps, stepGoal);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingTop: 52, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: t.bgSoft, borderBottomWidth: 1, borderBottomColor: t.border }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: t.text }}>Health</Text>
        <Text style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
          {isPedometerAvailable ? "Step counter active" : "Step data from today"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Step counter ring */}
        <View style={{ backgroundColor: t.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: t.border, alignItems: "center", marginBottom: 16 }}>
          <View style={{ width: 160, height: 160, borderRadius: 80, borderWidth: 10, borderColor: t.border, justifyContent: "center", alignItems: "center", position: "relative" }}>
            {/* Progress arc (simplified as colored border) */}
            <View style={{
              position: "absolute", width: 160, height: 160, borderRadius: 80,
              borderWidth: 10, borderColor: "transparent",
              borderTopColor: pct > 0 ? t.accent : "transparent",
              borderRightColor: pct > 25 ? t.accent : "transparent",
              borderBottomColor: pct > 50 ? t.accent : "transparent",
              borderLeftColor: pct > 75 ? t.accent : "transparent",
              transform: [{ rotate: "-45deg" }],
            }} />
            <Text style={{ fontSize: 32, fontWeight: "800", color: t.text }}>{steps.toLocaleString()}</Text>
            <Text style={{ fontSize: 12, color: t.textSecondary }}>/ {stepGoal.toLocaleString()}</Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: "700", color: pct >= 100 ? t.success : t.accent, marginTop: 12 }}>
            {pct >= 100 ? "🎉 Goal reached!" : `${Math.round(pct)}% of daily goal`}
          </Text>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          {[
            { emoji: "🚶", label: "Distance", value: `${distance} km` },
            { emoji: "🔥", label: "Calories", value: `${calories}` },
            { emoji: "⏱", label: "Active", value: `${Math.round(steps / 100)}m` },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: t.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: t.border, alignItems: "center" }}>
              <Text style={{ fontSize: 16 }}>{s.emoji}</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: t.text, marginTop: 4 }}>{s.value}</Text>
              <Text style={{ fontSize: 10, color: t.textMuted }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Weekly chart */}
        <View style={{ backgroundColor: t.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: t.border, marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: t.text, marginBottom: 12 }}>This Week</Text>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: 100 }}>
            {weekSteps.map((s, i) => {
              const h = Math.max((s / maxStep) * 80, 4);
              const isToday = i === 6;
              const atGoal = s >= stepGoal;
              return (
                <View key={i} style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ fontSize: 9, color: t.textMuted, marginBottom: 4 }}>{(s / 1000).toFixed(1)}k</Text>
                  <View style={{
                    width: "80%", height: h, borderRadius: 4,
                    backgroundColor: atGoal ? t.success : isToday ? t.accent : `${t.accent}40`,
                  }} />
                  <Text style={{ fontSize: 10, color: isToday ? t.accent : t.textMuted, marginTop: 4, fontWeight: isToday ? "700" : "400" }}>
                    {dayNames[i]}
                  </Text>
                </View>
              );
            })}
          </View>
          {/* Goal line */}
          <View style={{ position: "absolute", right: 16, top: 16 }}>
            <Text style={{ fontSize: 10, color: t.textMuted }}>Goal: {(stepGoal / 1000).toFixed(0)}k</Text>
          </View>
        </View>

        {/* Life balance */}
        <View style={{ backgroundColor: t.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: t.border, marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: t.text, marginBottom: 12 }}>Life Balance</Text>
          {[
            { label: "Health Events", value: healthEvents.length, color: t.info, emoji: "💪" },
            { label: "Social Events", value: socialEvents.length, color: t.warning, emoji: "👥" },
            { label: "Focus Time", value: focusEvents.length, color: t.success, emoji: "⚡" },
          ].map((item, i) => (
            <View key={i} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: t.textSecondary }}>{item.emoji} {item.label}</Text>
                <Text style={{ fontSize: 12, fontWeight: "700", color: t.text }}>{item.value}</Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: t.border }}>
                <View style={{
                  height: "100%", borderRadius: 3, backgroundColor: item.color,
                  width: `${Math.min((item.value / Math.max(events.length, 1)) * 100, 100)}%`,
                }} />
              </View>
            </View>
          ))}
        </View>

        {/* Streaks */}
        <View style={{ backgroundColor: t.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: t.border }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: t.text, marginBottom: 12 }}>Streaks</Text>
          {[
            { name: "Exercise", current: 12, best: 21, color: t.info },
            { name: "Social Plans", current: 5, best: 8, color: t.warning },
            { name: "Free Evenings", current: 3, best: 14, color: t.success },
            { name: "Early Mornings", current: 7, best: 18, color: t.danger },
          ].map((s, i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: t.text }}>{s.name}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: s.color }}>🔥 {s.current}</Text>
                  <Text style={{ fontSize: 10, color: t.textMuted }}>/ {s.best}</Text>
                </View>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: `${s.color}18` }}>
                <View style={{ height: "100%", borderRadius: 3, backgroundColor: s.color, width: `${(s.current / s.best) * 100}%` }} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}