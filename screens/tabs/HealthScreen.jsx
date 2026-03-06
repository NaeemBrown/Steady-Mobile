import { useState, useEffect, useMemo, useRef } from "react";
import {
  View, Text, ScrollView, RefreshControl, ActivityIndicator,
  TouchableOpacity, Animated, Easing,
} from "react-native";
import { useAuth } from "../../context/AuthProvider.jsx";
import { useTheme } from "../../lib/theme.js";

/**
 * NOTE: Pedometer is currently a stub.
 * To get real step data, run: npm install expo-sensors
 * Then change the import to: import { Pedometer } from 'expo-sensors';
 */
const Pedometer = null;

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionCard({ children, style, t }) {
  return (
    <View style={{
      backgroundColor: t.surface, borderRadius: 20, padding: 18,
      borderWidth: 1, borderColor: t.border, marginBottom: 14, ...style,
    }}>
      {children}
    </View>
  );
}

function SectionTitle({ label, t, style }) {
  return (
    <Text style={{ fontSize: 14, fontWeight: "700", color: t.text, marginBottom: 12, ...style }}>
      {label}
    </Text>
  );
}

// ─── Step Ring ────────────────────────────────────────────────────────────────

function StepRing({ pct, steps, stepGoal, t }) {
  const borderTopColor    = pct > 0  ? t.accent : t.border;
  const borderRightColor  = pct > 25 ? t.accent : t.border;
  const borderBottomColor = pct > 50 ? t.accent : t.border;
  const borderLeftColor   = pct > 75 ? t.accent : t.border;

  return (
    <View style={{ alignItems: "center", marginBottom: 4 }}>
      <View style={{
        width: 160, height: 160, borderRadius: 80, borderWidth: 10,
        borderColor: t.border, justifyContent: "center", alignItems: "center",
      }}>
        <View style={{
          position: "absolute", width: 160, height: 160, borderRadius: 80,
          borderWidth: 10,
          borderTopColor, borderRightColor, borderBottomColor, borderLeftColor,
          transform: [{ rotate: "-45deg" }],
        }} />
        <Text style={{ fontSize: 32, fontWeight: "800", color: t.text }}>
          {steps.toLocaleString()}
        </Text>
        <Text style={{ fontSize: 11, color: t.textSecondary }}>
          / {stepGoal.toLocaleString()} steps
        </Text>
      </View>
      <Text style={{
        fontSize: 13, fontWeight: "700", marginTop: 10,
        color: pct >= 100 ? t.success : t.accent,
      }}>
        {pct >= 100 ? "🎉 Daily goal reached!" : `${Math.round(pct)}% of daily goal`}
      </Text>
    </View>
  );
}

// ─── Stat row ─────────────────────────────────────────────────────────────────

function StatRow({ stats, t }) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {stats.map((s, i) => (
        <View key={i} style={{
          flex: 1, backgroundColor: t.bgSoft, borderRadius: 14, padding: 12,
          borderWidth: 1, borderColor: t.border, alignItems: "center",
        }}>
          <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: t.text, marginTop: 3 }}>
            {s.value}
          </Text>
          <Text style={{ fontSize: 10, color: t.textMuted, marginTop: 1 }}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Weekly bar chart ─────────────────────────────────────────────────────────

function WeekChart({ weekSteps, stepGoal, t }) {
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxStep = Math.max(...weekSteps, stepGoal);

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 5, height: 110 }}>
      {weekSteps.map((s, i) => {
        const h = Math.max((s / maxStep) * 88, 4);
        const isToday = i === 6;
        const atGoal = s >= stepGoal;
        return (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 9, color: t.textMuted, marginBottom: 3 }}>
              {(s / 1000).toFixed(1)}k
            </Text>
            <View style={{
              width: "76%", height: h, borderRadius: 5,
              backgroundColor: atGoal ? t.success : isToday ? t.accent : `${t.accent}40`,
            }} />
            <Text style={{
              fontSize: 10, marginTop: 4,
              color: isToday ? t.accent : t.textMuted,
              fontWeight: isToday ? "700" : "400",
            }}>
              {dayNames[i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Mood check-in ────────────────────────────────────────────────────────────

const MOOD_MESSAGES = {
  5: "Fantastic! Keep it up 🚀",
  4: "Great day — stay on track 💪",
  3: "Steady as you go 👍",
  2: "Hang in there — rest if needed 🌿",
  1: "Take care of yourself today 💙",
};

function MoodCard({ mood, onMood, t }) {
  const moods = [
    { label: "Rough", emoji: "😔", value: 1 },
    { label: "Meh",   emoji: "😐", value: 2 },
    { label: "OK",    emoji: "🙂", value: 3 },
    { label: "Good",  emoji: "😊", value: 4 },
    { label: "Great", emoji: "🤩", value: 5 },
  ];

  return (
    <SectionCard t={t}>
      <SectionTitle label="🧠  Today's Mood" t={t} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 6 }}>
        {moods.map((m) => {
          const selected = mood === m.value;
          return (
            <TouchableOpacity
              key={m.value}
              onPress={() => onMood(m.value)}
              style={{
                flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 14,
                borderWidth: 2,
                borderColor: selected ? t.accent : t.border,
                backgroundColor: selected ? `${t.accent}18` : t.bgSoft,
              }}
            >
              <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
              <Text style={{
                fontSize: 10, marginTop: 3,
                color: selected ? t.accent : t.textMuted,
                fontWeight: selected ? "700" : "400",
              }}>
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {mood && (
        <Text style={{ fontSize: 12, color: t.textSecondary, marginTop: 10, textAlign: "center" }}>
          {MOOD_MESSAGES[mood]}
        </Text>
      )}
    </SectionCard>
  );
}

// ─── Hydration tracker ────────────────────────────────────────────────────────

function HydrationCard({ glasses, onGlass, t }) {
  const goal = 8;
  const pct = Math.min((glasses / goal) * 100, 100);

  return (
    <SectionCard t={t}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: t.text }}>💧  Hydration</Text>
        <Text style={{ fontSize: 12, color: t.textMuted }}>{glasses}/{goal} glasses</Text>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: t.border, marginBottom: 14 }}>
        <View style={{
          height: "100%", borderRadius: 4,
          backgroundColor: pct >= 100 ? t.success : t.info,
          width: `${pct}%`,
        }} />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {Array.from({ length: goal }).map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onGlass(i + 1)}
            style={{
              width: 44, height: 44, borderRadius: 12,
              borderWidth: 2,
              borderColor: i < glasses ? t.info : t.border,
              backgroundColor: i < glasses ? `${t.info}20` : t.bgSoft,
              justifyContent: "center", alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18 }}>{i < glasses ? "💧" : "○"}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {pct >= 100 && (
        <Text style={{ fontSize: 12, color: t.success, marginTop: 10, textAlign: "center", fontWeight: "600" }}>
          🎉 Hydration goal complete!
        </Text>
      )}
    </SectionCard>
  );
}

// ─── Sleep card ───────────────────────────────────────────────────────────────

function SleepCard({ t }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const sleepHours = [6.5, 7.2, 5.8, 8.1, 7.0, 9.0, 7.5];
  const goal = 8;
  const todayHours = sleepHours[6];
  const avg = (sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length).toFixed(1);

  return (
    <SectionCard t={t}>
      <SectionTitle label="😴  Sleep" t={t} />
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Last night", value: `${todayHours}h`, color: todayHours >= goal ? t.success : t.warning },
          { label: "Weekly avg", value: `${avg}h`,        color: t.accent },
          { label: "Goal",       value: `${goal}h`,       color: t.textMuted },
        ].map((item, i) => (
          <View key={i} style={{
            flex: 1, backgroundColor: t.bgSoft, borderRadius: 12, padding: 10,
            borderWidth: 1, borderColor: t.border, alignItems: "center",
          }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: item.color }}>{item.value}</Text>
            <Text style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>{item.label}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 5, height: 80 }}>
        {sleepHours.map((h, i) => {
          const barH = Math.max((h / 10) * 64, 4);
          const isToday = i === 6;
          const atGoal = h >= goal;
          return (
            <View key={i} style={{ flex: 1, alignItems: "center" }}>
              <View style={{
                width: "76%", height: barH, borderRadius: 4,
                backgroundColor: atGoal ? t.success : isToday ? t.warning : `${t.warning}50`,
              }} />
              <Text style={{ fontSize: 9, color: isToday ? t.accent : t.textMuted, marginTop: 3 }}>
                {days[i]}
              </Text>
            </View>
          );
        })}
      </View>
    </SectionCard>
  );
}

// ─── Heart rate zones ─────────────────────────────────────────────────────────

function HeartRateCard({ t }) {
  const resting = 62;
  const zones = [
    { label: "Resting",  range: "50–70",   color: t.info,    emoji: "🫀", active: true  },
    { label: "Fat Burn", range: "70–110",  color: t.success, emoji: "🔥", active: false },
    { label: "Cardio",   range: "110–145", color: t.warning, emoji: "⚡", active: false },
    { label: "Peak",     range: "145+",    color: t.danger,  emoji: "🚀", active: false },
  ];

  return (
    <SectionCard t={t}>
      <SectionTitle label="❤️  Heart Rate" t={t} />
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{
          flex: 1, backgroundColor: `${t.danger}15`, borderRadius: 14,
          padding: 14, alignItems: "center", borderWidth: 1, borderColor: `${t.danger}40`,
          justifyContent: "center",
        }}>
          <Text style={{ fontSize: 30, fontWeight: "800", color: t.danger }}>{resting}</Text>
          <Text style={{ fontSize: 11, color: t.textSecondary, marginTop: 2 }}>BPM resting</Text>
          <Text style={{ fontSize: 10, color: t.textMuted, marginTop: 1 }}>● Normal</Text>
        </View>
        <View style={{ flex: 2, gap: 6 }}>
          {zones.map((z, i) => (
            <View key={i} style={{
              flexDirection: "row", alignItems: "center", gap: 8,
              backgroundColor: z.active ? `${z.color}18` : t.bgSoft,
              borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7,
              borderWidth: 1, borderColor: z.active ? `${z.color}40` : t.border,
            }}>
              <Text style={{ fontSize: 13 }}>{z.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: t.text }}>{z.label}</Text>
                <Text style={{ fontSize: 10, color: t.textMuted }}>{z.range} bpm</Text>
              </View>
              {z.active && (
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: z.color }} />
              )}
            </View>
          ))}
        </View>
      </View>
    </SectionCard>
  );
}

// ─── Life balance ─────────────────────────────────────────────────────────────

function LifeBalanceCard({ events, t }) {
  const healthEvents = events.filter(e => e.type === "health");
  const socialEvents = events.filter(e => e.type === "social");
  const focusEvents  = events.filter(e => e.type === "focus");
  const total = events.length || 1;

  const items = [
    { label: "Health Events", value: healthEvents.length, color: t.info,    emoji: "💪" },
    { label: "Social Events", value: socialEvents.length, color: t.warning,  emoji: "👥" },
    { label: "Focus Time",    value: focusEvents.length,  color: t.success,  emoji: "⚡" },
  ];

  return (
    <SectionCard t={t}>
      <SectionTitle label="⚖️  Life Balance" t={t} />
      {items.map((item, i) => {
        const progress = (item.value / total) * 100;
        return (
          <View key={i} style={{ marginBottom: i < items.length - 1 ? 12 : 0 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
              <Text style={{ fontSize: 12, color: t.textSecondary }}>
                {item.emoji}  {item.label}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: "700", color: t.text }}>{item.value}</Text>
            </View>
            <View style={{ height: 7, borderRadius: 4, backgroundColor: t.border }}>
              <View style={{
                height: "100%", borderRadius: 4, backgroundColor: item.color,
                width: `${Math.min(progress, 100)}%`,
              }} />
            </View>
          </View>
        );
      })}
      {events.length === 0 && (
        <Text style={{ fontSize: 12, color: t.textMuted, textAlign: "center", marginTop: 4 }}>
          Add events to see your life balance
        </Text>
      )}
    </SectionCard>
  );
}

// ─── Tip of the day ───────────────────────────────────────────────────────────

const TIPS = [
  "Take a 5-min walk every hour to reset your focus.",
  "Drinking water before meals aids digestion & reduces cravings.",
  "A consistent sleep schedule improves deep sleep quality.",
  "15 mins of morning sunlight helps regulate your circadian rhythm.",
  "Deep breathing (4-7-8 method) reduces cortisol in minutes.",
  "Stretching for 10 mins before bed can improve sleep onset.",
  "Social connection is as important as physical exercise for longevity.",
];

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HealthScreen() {
  const { getUserEvents } = useAuth();
  const { t } = useTheme();

  const [steps, setSteps] = useState(4231);
  const [isPedometerAvailable, setAvailable] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stepGoal] = useState(10000);
  const [mood, setMood] = useState(null);
  const [glasses, setGlasses] = useState(3);

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

  const onRefresh = () => { setRefreshing(true); loadData(); };

  // Step counter / pedometer
  useEffect(() => {
    if (!Pedometer) {
      const timer = setInterval(() => {
        setSteps(prev => prev + Math.floor(Math.random() * 8));
      }, 5000);
      return () => clearInterval(timer);
    }

    Pedometer.isAvailableAsync().then(setAvailable).catch(() => setAvailable(false));

    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    Pedometer.getStepCountAsync(start, end)
      .then(r => setSteps(r.steps))
      .catch(err => console.warn("Pedometer error:", err));

    const sub = Pedometer.watchStepCount(r => setSteps(prev => prev + r.steps));
    return () => sub?.remove();
  }, []);

  const pct      = Math.min((steps / stepGoal) * 100, 100);
  const distance = ((steps * 0.762) / 1000).toFixed(1);
  const calories = Math.round(steps * 0.04);
  const activeMin = Math.round(steps / 100);

  const weekSteps = useMemo(() => [4200, 6800, 8100, 5400, 9200, 11000, steps], [steps]);

  const todayTip = TIPS[new Date().getDate() % TIPS.length];

  const handleGlass = (n) => setGlasses(prev => prev === n ? n - 1 : n);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: "center" }}>
        <ActivityIndicator size="large" color={t.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header */}
      <View style={{
        paddingTop: 52, paddingHorizontal: 20, paddingBottom: 14,
        backgroundColor: t.bgSoft, borderBottomWidth: 1, borderBottomColor: t.border,
      }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: t.text }}>Health</Text>
        <Text style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
          {isPedometerAvailable ? "Step counter active" : "Tracking your wellness today"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Steps + stats */}
        <SectionCard t={t} style={{ alignItems: "center" }}>
          <StepRing pct={pct} steps={steps} stepGoal={stepGoal} t={t} />
          <View style={{ height: 16 }} />
          <StatRow t={t} stats={[
            { emoji: "🚶", label: "Distance",  value: `${distance} km` },
            { emoji: "🔥", label: "Calories",  value: `${calories} kcal` },
            { emoji: "⏱",  label: "Active",    value: `${activeMin} min` },
          ]} />
        </SectionCard>

        {/* Weekly chart */}
        <SectionCard t={t}>
          <SectionTitle label="📊  This Week" t={t} />
          <WeekChart weekSteps={weekSteps} stepGoal={stepGoal} t={t} />
        </SectionCard>

        {/* Mood */}
        <MoodCard mood={mood} onMood={setMood} t={t} />

        {/* Hydration */}
        <HydrationCard glasses={glasses} onGlass={handleGlass} t={t} />

        {/* Sleep */}
        <SleepCard t={t} />

        {/* Heart rate */}
        <HeartRateCard t={t} />

        {/* Life balance */}
        <LifeBalanceCard events={events} t={t} />

        {/* Tip of the day */}
        <View style={{
          backgroundColor: `${t.accent}12`, borderRadius: 16, padding: 16,
          borderWidth: 1, borderColor: `${t.accent}30`,
          flexDirection: "row", gap: 12, alignItems: "flex-start",
        }}>
          <Text style={{ fontSize: 22 }}>💡</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: t.accent, marginBottom: 4 }}>
              Tip of the Day
            </Text>
            <Text style={{ fontSize: 13, color: t.textSecondary, lineHeight: 19 }}>
              {todayTip}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
