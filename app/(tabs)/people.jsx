import { useState, useEffect, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, Modal } from "react-native";
import { useAuth } from "../../context/AuthProvider.jsx";
import { useTheme } from "../../lib/theme.js";

const COLOR_KEYS = ["accent", "success", "info", "warning", "danger"];

export default function PeopleScreen() {
  const { getUserPeople, getUserEvents } = useAuth();
  const { t } = useTheme();
  const [people, setPeople] = useState([]);
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [starred, setStarred] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    Promise.all([getUserPeople(), getUserEvents()]).then(([p, e]) => { setPeople(p || []); setEvents(e || []); }).catch(() => {});
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try { const [p, e] = await Promise.all([getUserPeople(), getUserEvents()]); setPeople(p || []); setEvents(e || []); } catch {}
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    let list = [...people];
    if (starred) list = list.filter(p => p.starred);
    if (search) list = list.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.role?.toLowerCase().includes(search.toLowerCase()));
    return list.sort((a, b) => (b.meetings || 0) - (a.meetings || 0));
  }, [people, search, starred]);

  const personEvents = (name) => events.filter(e => e.attendees?.includes(name));
  const pColor = (p) => t[p.colorKey] || p.color || t.accent;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header */}
      <View style={{ paddingTop: 52, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: t.bgSoft, borderBottomWidth: 1, borderBottomColor: t.border }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: t.text }}>People</Text>
        <Text style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>{people.length} contacts</Text>

        {/* KPIs */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          {[
            { emoji: "👥", label: "Total", value: people.length, c: t.accent },
            { emoji: "⭐", label: "Starred", value: people.filter(p => p.starred).length, c: t.warning },
            { emoji: "🤝", label: "Avg Meetings", value: people.length ? Math.round(people.reduce((s, p) => s + (p.meetings || 0), 0) / people.length) : 0, c: t.info },
          ].map((kpi, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: t.surface, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: t.border }}>
              <Text style={{ fontSize: 12 }}>{kpi.emoji}</Text>
              <Text style={{ fontSize: 18, fontWeight: "800", color: kpi.c }}>{kpi.value}</Text>
              <Text style={{ fontSize: 10, color: t.textMuted }}>{kpi.label}</Text>
            </View>
          ))}
        </View>

        {/* Search + filter */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 10, paddingHorizontal: 10 }}>
            <Text style={{ fontSize: 13, marginRight: 6 }}>🔍</Text>
            <TextInput value={search} onChangeText={setSearch} placeholder="Search..." placeholderTextColor={t.textMuted} style={{ flex: 1, paddingVertical: 9, fontSize: 13, color: t.text }} />
          </View>
          <TouchableOpacity onPress={() => setStarred(!starred)} style={{ paddingHorizontal: 14, justifyContent: "center", borderRadius: 10, backgroundColor: starred ? `${t.warning}20` : t.surface, borderWidth: 1, borderColor: starred ? t.warning : t.border }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: starred ? t.warning : t.textSecondary }}>⭐</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* People list */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />}>
        {filtered.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>👥</Text>
            <Text style={{ fontSize: 14, color: t.textMuted }}>No contacts found</Text>
          </View>
        ) : filtered.map((p, i) => (
          <TouchableOpacity key={p.id || i} onPress={() => setSelected(p)} activeOpacity={0.7}
            style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: t.surface, borderRadius: 14, borderWidth: 1, borderColor: t.border, marginBottom: 8 }}>
            <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: pColor(p), justifyContent: "center", alignItems: "center" }}>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>{p.avatar || p.name?.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: t.text }}>{p.name}</Text>
                {p.starred && <Text style={{ fontSize: 10 }}>⭐</Text>}
              </View>
              <Text style={{ fontSize: 11, color: t.textSecondary }}>{p.role || "Contact"}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: t.text }}>{p.meetings || 0}</Text>
              <Text style={{ fontSize: 9, color: t.textMuted }}>meetings</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Person detail modal */}
      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: t.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: "80%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: t.text }}>Contact</Text>
              <TouchableOpacity onPress={() => setSelected(null)}><Text style={{ fontSize: 16, color: t.textMuted }}>✕</Text></TouchableOpacity>
            </View>

            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ alignItems: "center", marginBottom: 20 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: pColor(selected), justifyContent: "center", alignItems: "center", marginBottom: 10 }}>
                    <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700" }}>{selected.avatar || selected.name?.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: t.text }}>{selected.name}</Text>
                  <Text style={{ fontSize: 13, color: t.textSecondary }}>{selected.role}</Text>
                  {selected.email ? <Text style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>{selected.email}</Text> : null}
                </View>

                {/* Stats */}
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
                  {[
                    { label: "Meetings", value: selected.meetings || 0, emoji: "🤝" },
                    { label: "Shared", value: personEvents(selected.name).length, emoji: "📅" },
                    { label: "This Week", value: Math.min(3, personEvents(selected.name).length), emoji: "🕐" },
                  ].map((s, i) => (
                    <View key={i} style={{ flex: 1, backgroundColor: t.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: t.border, alignItems: "center" }}>
                      <Text style={{ fontSize: 14 }}>{s.emoji}</Text>
                      <Text style={{ fontSize: 18, fontWeight: "700", color: t.text }}>{s.value}</Text>
                      <Text style={{ fontSize: 10, color: t.textMuted }}>{s.label}</Text>
                    </View>
                  ))}
                </View>

                {/* Shared events */}
                <Text style={{ fontSize: 12, fontWeight: "700", color: t.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Shared Events</Text>
                {personEvents(selected.name).length === 0 ? (
                  <Text style={{ fontSize: 12, color: t.textMuted, textAlign: "center", padding: 20 }}>No shared events</Text>
                ) : personEvents(selected.name).slice(0, 6).map((ev, i) => (
                  <View key={i} style={{ backgroundColor: t.surface, borderRadius: 10, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: t.border }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: t.text }}>{ev.title}</Text>
                    <Text style={{ fontSize: 11, color: t.textSecondary, marginTop: 2 }}>Day {ev.day} · {ev.time} · {ev.duration}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
