import { useState, useEffect, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal,
  RefreshControl, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useAuth } from "../../context/AuthProvider.jsx";
import { useTheme } from "../../lib/theme.js";

const TYPES = ["meeting", "social", "health", "focus", "travel"];
const SOURCES = ["work", "personal", "google", "outlook"];
const TYPE_EMOJI = { meeting: "🤝", social: "👥", health: "💪", focus: "⚡", travel: "✈️" };

export default function EventsScreen() {
  const { getUserEvents, createEvent, removeEvent } = useAuth();
  const { t } = useTheme();

  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // New event form
  const [form, setForm] = useState({ title: "", time: "09:00", duration: "1h", source: "work", type: "meeting", location: "", day: new Date().getDate() });

  useEffect(() => { getUserEvents().then(setEvents).catch(() => {}); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try { setEvents(await getUserEvents()); } catch {}
    setRefreshing(false);
  };

  const srcColor = { work: t.accent, personal: "#2ED47A", google: "#4285F4", outlook: "#0078D4" };

  const filtered = useMemo(() => {
    let list = [...events];
    if (typeFilter !== "all") list = list.filter(e => e.type === typeFilter);
    if (sourceFilter !== "all") list = list.filter(e => e.source === sourceFilter);
    if (search) list = list.filter(e =>
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase())
    );
    return list.sort((a, b) => a.day - b.day || (a.time || "").localeCompare(b.time || ""));
  }, [events, typeFilter, sourceFilter, search]);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    const ev = { ...form, id: Date.now() + Math.random(), attendees: [] };
    setEvents(prev => [...prev, ev]);
    setShowCreate(false);
    setForm({ title: "", time: "09:00", duration: "1h", source: "work", type: "meeting", location: "", day: new Date().getDate() });
    try {
      const firestoreId = await createEvent(ev);
      setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, firestoreId } : e));
    } catch (err) { console.error(err); }
  };

  const handleDelete = (ev) => {
    Alert.alert("Delete Event", `Remove "${ev.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: () => {
          setEvents(prev => prev.filter(e => e.id !== ev.id));
          if (ev.firestoreId) removeEvent(ev.firestoreId).catch(console.error);
        },
      },
    ]);
  };

  const Pill = ({ label, active, onPress }) => (
    <TouchableOpacity onPress={onPress} style={{
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
      backgroundColor: active ? `${t.accent}20` : t.surface,
      borderWidth: 1, borderColor: active ? t.accent : t.border,
    }}>
      <Text style={{ fontSize: 11, fontWeight: "600", color: active ? t.accent : t.textSecondary }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header */}
      <View style={{
        paddingTop: 52, paddingHorizontal: 20, paddingBottom: 12,
        backgroundColor: t.bgSoft, borderBottomWidth: 1, borderBottomColor: t.border,
      }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "800", color: t.text }}>Events</Text>
            <Text style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>{events.length} total</Text>
          </View>
          <TouchableOpacity onPress={() => setShowCreate(true)} style={{
            backgroundColor: t.accent, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
          }}>
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>+ New</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={{
          flexDirection: "row", alignItems: "center", backgroundColor: t.surface,
          borderWidth: 1, borderColor: t.border, borderRadius: 10, paddingHorizontal: 12, marginTop: 12,
        }}>
          <Text style={{ fontSize: 14, marginRight: 6 }}>🔍</Text>
          <TextInput value={search} onChangeText={setSearch} placeholder="Search events..."
            placeholderTextColor={t.textMuted}
            style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: t.text }}
          />
        </View>
      </View>

      {/* Filters */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <Pill label="All" active={typeFilter === "all"} onPress={() => setTypeFilter("all")} />
            {TYPES.map(tp => (
              <Pill key={tp} label={`${TYPE_EMOJI[tp]} ${tp}`} active={typeFilter === tp} onPress={() => setTypeFilter(tp)} />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Event List */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />}
      >
        {filtered.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>🔍</Text>
            <Text style={{ fontSize: 14, fontWeight: "600", color: t.text }}>No events found</Text>
            <Text style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>Try adjusting your filters</Text>
          </View>
        ) : filtered.map((ev, i) => (
          <TouchableOpacity key={ev.firestoreId || ev.id || i} onLongPress={() => handleDelete(ev)}
            activeOpacity={0.8}
            style={{
              backgroundColor: t.surface, borderRadius: 14, padding: 14, marginBottom: 8,
              borderWidth: 1, borderColor: t.border, flexDirection: "row", alignItems: "center", gap: 12,
            }}>
            <View style={{
              width: 40, height: 40, borderRadius: 12, backgroundColor: `${srcColor[ev.source] || t.accent}15`,
              justifyContent: "center", alignItems: "center",
            }}>
              <Text style={{ fontSize: 18 }}>{TYPE_EMOJI[ev.type] || "📅"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: t.text }}>{ev.title}</Text>
              <Text style={{ fontSize: 11, color: t.textSecondary, marginTop: 2 }}>
                Day {ev.day} · {ev.time || "All day"} · {ev.duration || "1h"}
              </Text>
            </View>
            <View style={{
              width: 8, height: 8, borderRadius: 4, backgroundColor: srcColor[ev.source] || t.accent,
            }} />
          </TouchableOpacity>
        ))}
        <Text style={{ textAlign: "center", color: t.textMuted, fontSize: 11, marginTop: 8 }}>
          Long press to delete
        </Text>
      </ScrollView>

      {/* Create Event Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={{
              backgroundColor: t.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: 24, paddingBottom: 40,
            }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: "800", color: t.text }}>New Event</Text>
                <TouchableOpacity onPress={() => setShowCreate(false)}>
                  <Text style={{ fontSize: 16, color: t.textMuted }}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 12, fontWeight: "600", color: t.textSecondary, marginBottom: 4 }}>Title</Text>
              <TextInput value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))}
                placeholder="Event name" placeholderTextColor={t.textMuted}
                style={{
                  backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
                  borderRadius: 10, padding: 12, color: t.text, fontSize: 14, marginBottom: 12,
                }}
              />

              <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: t.textSecondary, marginBottom: 4 }}>Time</Text>
                  <TextInput value={form.time} onChangeText={v => setForm(f => ({ ...f, time: v }))}
                    placeholder="09:00" placeholderTextColor={t.textMuted}
                    style={{
                      backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
                      borderRadius: 10, padding: 12, color: t.text, fontSize: 14,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: t.textSecondary, marginBottom: 4 }}>Day</Text>
                  <TextInput value={String(form.day)} onChangeText={v => setForm(f => ({ ...f, day: parseInt(v) || 1 }))}
                    keyboardType="number-pad" placeholderTextColor={t.textMuted}
                    style={{
                      backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
                      borderRadius: 10, padding: 12, color: t.text, fontSize: 14,
                    }}
                  />
                </View>
              </View>

              <Text style={{ fontSize: 12, fontWeight: "600", color: t.textSecondary, marginBottom: 4 }}>Location</Text>
              <TextInput value={form.location} onChangeText={v => setForm(f => ({ ...f, location: v }))}
                placeholder="Optional" placeholderTextColor={t.textMuted}
                style={{
                  backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
                  borderRadius: 10, padding: 12, color: t.text, fontSize: 14, marginBottom: 12,
                }}
              />

              <Text style={{ fontSize: 12, fontWeight: "600", color: t.textSecondary, marginBottom: 6 }}>Type</Text>
              <View style={{ flexDirection: "row", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                {TYPES.map(tp => (
                  <TouchableOpacity key={tp} onPress={() => setForm(f => ({ ...f, type: tp }))} style={{
                    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
                    backgroundColor: form.type === tp ? `${t.accent}20` : t.surface,
                    borderWidth: 1, borderColor: form.type === tp ? t.accent : t.border,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: form.type === tp ? t.accent : t.textSecondary }}>
                      {TYPE_EMOJI[tp]} {tp}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ fontSize: 12, fontWeight: "600", color: t.textSecondary, marginBottom: 6 }}>Source</Text>
              <View style={{ flexDirection: "row", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                {SOURCES.map(src => (
                  <TouchableOpacity key={src} onPress={() => setForm(f => ({ ...f, source: src }))} style={{
                    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
                    backgroundColor: form.source === src ? `${srcColor[src]}20` : t.surface,
                    borderWidth: 1, borderColor: form.source === src ? srcColor[src] : t.border,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: form.source === src ? srcColor[src] : t.textSecondary }}>
                      {src}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity onPress={handleCreate} style={{
                backgroundColor: t.accent, borderRadius: 12, padding: 16, alignItems: "center",
              }}>
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Create Event</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
