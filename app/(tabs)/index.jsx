import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { useAuth } from "../../context/AuthProvider.jsx";
import { useTheme } from "../../lib/theme.js";

function KPICard({ label, value, sub, color, emoji, t }) {
  return (
    <View style={{
      flex: 1, backgroundColor: t.surface, borderRadius: 16, padding: 14,
      borderWidth: 1, borderColor: t.border,
    }}>
      <Text style={{ fontSize: 14, marginBottom: 6 }}>{emoji}</Text>
      <Text style={{ fontSize: 24, fontWeight: "800", color: color || t.accent }}>{value}</Text>
      <Text style={{ fontSize: 11, color: t.textSecondary, marginTop: 2 }}>{label}</Text>
      {sub ? <Text style={{ fontSize: 10, color: t.textMuted, marginTop: 1 }}>{sub}</Text> : null}
    </View>
  );
}

function EventRow({ ev, t }) {
  const srcColor = { work: t.accent, personal: "#2ED47A", google: "#4285F4", outlook: "#0078D4" };
  return (
    <View style={{
      backgroundColor: t.surface, borderRadius: 14, padding: 14, marginBottom: 8,
      borderWidth: 1, borderColor: t.border, flexDirection: "row", alignItems: "center", gap: 12,
    }}>
      <View style={{ width: 4, height: 40, borderRadius: 2, backgroundColor: srcColor[ev.source] || t.accent }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: t.text }}>{ev.title}</Text>
        <Text style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>
          {ev.time || "All day"} · {ev.duration || "1h"}
          {ev.location && ev.location !== "—" ? `  📍 ${ev.location}` : ""}
        </Text>
      </View>
      {ev.attendees?.length > 0 && (
        <View style={{
          backgroundColor: `${t.accent}15`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
        }}>
          <Text style={{ fontSize: 10, fontWeight: "600", color: t.accent }}>👥 {ev.attendees.length}</Text>
        </View>
      )}
    </View>
  );
}

export default function DashboardScreen() {
  const { user, getUserEvents, getUserPeople, getCalendarSources } = useAuth();
  const { t } = useTheme();

  const [events, setEvents] = useState([]);
  const [people, setPeople] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [evs, ppl, srcs] = await Promise.all([getUserEvents(), getUserPeople(), getCalendarSources()]);
      setEvents(evs || []);
      setPeople(ppl || []);
      setSources(srcs || []);
    } catch (err) { console.warn("Load error:", err); }
    setLoading(false);
  }, [getUserEvents, getUserPeople, getCalendarSources]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const now = new Date();
  const todayEvents = events.filter(e => e.day === now.getDate()).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const meetingCount = events.filter(e => e.type === "meeting").length;
  const totalHours = events.reduce((sum, e) => {
    const m = e.duration?.match(/([\d.]+)h|(\d+)m/);
    return sum + (m ? (m[1] ? parseFloat(m[1]) : parseInt(m[2]) / 60) : 1);
  }, 0);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header */}
      <View style={{
        paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16,
        backgroundColor: t.bgSoft, borderBottomWidth: 1, borderBottomColor: t.border,
      }}>
        <Text style={{ fontSize: 11, color: t.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 }}>
          {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </Text>
        <Text style={{ fontSize: 24, fontWeight: "800", color: t.text, marginTop: 2 }}>
          Hey, {user?.displayName?.split(" ")[0] || "there"} 👋
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />}
      >
        {/* KPIs */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
          <KPICard emoji="📅" label="Total Events" value={events.length} t={t} color={t.accent} />
          <KPICard emoji="📌" label="Today" value={todayEvents.length} t={t} color={t.success} />
        </View>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
          <KPICard emoji="🤝" label="Meetings" value={meetingCount} t={t} color={t.info} />
          <KPICard emoji="⏱️" label="Hours" value={totalHours.toFixed(0)} sub="scheduled" t={t} color={t.warning} />
        </View>

        {/* Calendar Sources */}
        {sources.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: t.text, marginBottom: 10 }}>Calendars</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
              {sources.map(src => (
                <View key={src.id} style={{
                  backgroundColor: t.surface, borderRadius: 12, padding: 12, marginHorizontal: 4,
                  borderWidth: 1, borderColor: t.border, width: 120,
                }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: src.color || t.accent, marginBottom: 6 }} />
                  <Text style={{ fontSize: 12, fontWeight: "600", color: t.text }} numberOfLines={1}>{src.name}</Text>
                  <Text style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>
                    {events.filter(e => e.source === src.id).length} events
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Today's Agenda */}
        <Text style={{ fontSize: 14, fontWeight: "700", color: t.text, marginBottom: 10 }}>Today's Agenda</Text>

        {todayEvents.length === 0 ? (
          <View style={{
            backgroundColor: t.surface, borderRadius: 16, padding: 32,
            alignItems: "center", borderWidth: 1, borderColor: t.border,
          }}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🎉</Text>
            <Text style={{ fontSize: 14, fontWeight: "600", color: t.text }}>No events today</Text>
            <Text style={{ fontSize: 12, color: t.textSecondary, marginTop: 4 }}>Enjoy the free time!</Text>
          </View>
        ) : (
          todayEvents.map((ev, i) => <EventRow key={ev.firestoreId || i} ev={ev} t={t} />)
        )}

        {/* Upcoming */}
        {events.filter(e => e.day > now.getDate()).length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: t.text, marginBottom: 10 }}>Upcoming</Text>
            {events.filter(e => e.day > now.getDate()).sort((a, b) => a.day - b.day).slice(0, 5).map((ev, i) => (
              <View key={ev.firestoreId || i} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Text style={{ fontSize: 11, color: t.textMuted, fontWeight: "600", width: 36 }}>
                  {ev.day}th
                </Text>
                <EventRow ev={ev} t={t} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
