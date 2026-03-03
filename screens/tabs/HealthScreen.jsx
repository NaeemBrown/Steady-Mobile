import { useState, useEffect, useMemo } from "react";
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { useAuth } from "../../context/AuthProvider.jsx";
import { useTheme } from "../../lib/theme.js";

/** * NOTE: Pedometer is currently a stub.
 * To get real data, run: npm install expo-sensors
 * Then change the import to: import { Pedometer } from 'expo-sensors';
 */
const Pedometer = null;

export default function HealthScreen() {
  const { getUserEvents } = useAuth();
  const { t } = useTheme();

  const [steps, setSteps] = useState(4231); // Initial mock steps
  const [isPedometerAvailable, setAvailable] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stepGoal] = useState(10000);

  // Load data helper
  const loadData = async () => {
    try {
      const e = await getUserEvents();
      setEvents(e || []);
    } catch (err) {
      console.error("Failed to load health events:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Step counter logic
  useEffect(() => {
    if (!Pedometer) {
      // If no native pedometer, mock a small increase for demo purposes
      const timer = setInterval(() => {
        setSteps(prev => prev + Math.floor(Math.random() * 10));
      }, 5000);
      return () => clearInterval(timer);
    }

    Pedometer.isAvailableAsync().then(setAvailable).catch(() => setAvailable(false));

    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    Pedometer.getStepCountAsync(start, end)
      .then(r => setSteps(r.steps))
      .catch(err => console.warn("Pedometer permissions/error:", err));

    const sub = Pedometer.watchStepCount(r => setSteps(prev => prev + r.steps));
    return () => sub?.remove();
  }, []);

  // Derived Stats
  const healthEvents = events.filter(e => e.type === "health");
  const socialEvents = events.filter(e => e.type === "social");
  const focusEvents = events.filter(e => e.type === "focus");

  const pct = Math.min((steps / stepGoal) * 100, 100);
  const distance = ((steps * 0.762) / 1000).toFixed(1);
  const calories = Math.round(steps * 0.04);

  // Dynamic Weekly Chart (Mock data + Today's live steps)
  const weekSteps = useMemo(() => [4200, 6800, 8100, 5400, 9200, 11000, steps], [steps]);
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxStep = Math.max(...weekSteps, stepGoal);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={t.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header */}
      <View style={{ paddingTop: 52, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: t.bgSoft, borderBottomWidth: 1, borderBottomColor: t.border }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: t.text }}>Health</Text>
        <Text style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
          {isPedometerAvailable ? "Step counter active" : "Tracking steps for today"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />}
      >
        {/* Step counter ring */}
        <View style={{ backgroundColor: t.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: t.border, alignItems: "center", marginBottom: 16 }}>
          <View style={{ width: 160, height: 160, borderRadius: 80, borderWidth: 10, borderColor: t.border, justifyContent: "center", alignItems: "center", position: "relative" }}>
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
        </View>

        {/* Life balance */}
        <View style={{ backgroundColor: t.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: t.border, marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: t.text, marginBottom: 12 }}>Life Balance</Text>
          {[
            { label: "Health Events", value: healthEvents.length, color: t.info, emoji: "💪" },
            { label: "Social Events", value: socialEvents.length, color: t.warning, emoji: "👥" },
            { label: "Focus Time", value: focusEvents.length, color: t.success, emoji: "⚡" },
          ].map((item, i) => {
            const total = events.length || 1;
            const progress = (item.value / total) * 100;
            return (
              <View key={i} style={{ marginBottom: 10 }}>
                <div style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: t.textSecondary }}>{item.emoji} {item.label}</Text>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: t.text }}>{item.value}</Text>
                </div>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: t.border }}>
                  <View style={{
                    height: "100%", borderRadius: 3, backgroundColor: item.color,
                    width: `${Math.min(progress, 100)}%`,
                  }} />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}