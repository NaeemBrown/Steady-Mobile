import { useState, useEffect, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useAuth } from "../../context/AuthProvider.jsx";
import { useTheme } from "../../lib/theme.js";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const getDIM = (y, m) => new Date(y, m + 1, 0).getDate();
const getFD = (y, m) => new Date(y, m, 1).getDay();

export default function CalendarScreen() {
  const { getUserEvents } = useAuth();
  const { t } = useTheme();

  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { getUserEvents().then(setEvents).catch(() => {}); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try { setEvents(await getUserEvents()); } catch {}
    setRefreshing(false);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const dim = getDIM(year, month);
  const fd = getFD(year, month);
  const today = new Date();
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const srcColor = { work: t.accent, personal: "#2ED47A", google: "#4285F4", outlook: "#0078D4" };

  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach(e => { if (!map[e.day]) map[e.day] = []; map[e.day].push(e); });
    return map;
  }, [events]);

  const dayEvents = (eventsByDay[selectedDay] || []).sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  const navigate = (dir) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
    setSelectedDay(1);
  };

  // Build calendar grid
  const cells = [];
  const prevDim = getDIM(year, month === 0 ? 11 : month - 1);
  for (let i = fd - 1; i >= 0; i--) cells.push({ day: prevDim - i, cur: false });
  for (let i = 1; i <= dim; i++) cells.push({ day: i, cur: true });
  while (cells.length < 42) cells.push({ day: cells.length - fd - dim + 1, cur: false });

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header */}
      <View style={{
        paddingTop: 52, paddingHorizontal: 20, paddingBottom: 12,
        backgroundColor: t.bgSoft, borderBottomWidth: 1, borderBottomColor: t.border,
      }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <TouchableOpacity onPress={() => navigate(-1)} style={{ padding: 8 }}>
            <Text style={{ fontSize: 20, color: t.accent }}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setCurrentDate(new Date()); setSelectedDay(today.getDate()); }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: t.text }}>{MONTHS[month]} {year}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigate(1)} style={{ padding: 8 }}>
            <Text style={{ fontSize: 20, color: t.accent }}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />}
      >
        {/* Day headers */}
        <View style={{ flexDirection: "row", paddingHorizontal: 8, paddingTop: 12, paddingBottom: 4 }}>
          {DAYS.map(d => (
            <View key={d} style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: t.textMuted }}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        {Array.from({ length: 6 }, (_, row) => (
          <View key={row} style={{ flexDirection: "row", paddingHorizontal: 8 }}>
            {cells.slice(row * 7, row * 7 + 7).map((cell, col) => {
              const hasEvents = cell.cur && (eventsByDay[cell.day]?.length || 0) > 0;
              const selected = cell.cur && cell.day === selectedDay;
              const todayCell = cell.cur && isToday(cell.day);
              return (
                <TouchableOpacity
                  key={col}
                  onPress={() => cell.cur && setSelectedDay(cell.day)}
                  style={{
                    flex: 1, alignItems: "center", paddingVertical: 8, marginVertical: 1, borderRadius: 10,
                    backgroundColor: selected ? t.accent : todayCell ? `${t.accent}15` : "transparent",
                  }}
                >
                  <Text style={{
                    fontSize: 14, fontWeight: selected || todayCell ? "700" : "400",
                    color: !cell.cur ? t.textMuted : selected ? "#fff" : todayCell ? t.accent : t.text,
                  }}>
                    {cell.day}
                  </Text>
                  {hasEvents && (
                    <View style={{ flexDirection: "row", gap: 2, marginTop: 3 }}>
                      {(eventsByDay[cell.day] || []).slice(0, 3).map((e, i) => (
                        <View key={i} style={{
                          width: 4, height: 4, borderRadius: 2,
                          backgroundColor: selected ? "rgba(255,255,255,0.6)" : srcColor[e.source] || t.accent,
                        }} />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Selected day events */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: t.text, marginBottom: 12 }}>
            {MONTHS[month]} {selectedDay} · {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
          </Text>

          {dayEvents.length === 0 ? (
            <View style={{
              backgroundColor: t.surface, borderRadius: 14, padding: 28, alignItems: "center",
              borderWidth: 1, borderColor: t.border,
            }}>
              <Text style={{ fontSize: 28, marginBottom: 8 }}>📭</Text>
              <Text style={{ fontSize: 13, color: t.textMuted }}>No events this day</Text>
            </View>
          ) : dayEvents.map((ev, i) => (
            <View key={ev.firestoreId || i} style={{
              backgroundColor: t.surface, borderRadius: 14, padding: 14, marginBottom: 8,
              borderWidth: 1, borderColor: t.border, borderLeftWidth: 3,
              borderLeftColor: srcColor[ev.source] || t.accent,
            }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: t.text }}>{ev.title}</Text>
              <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                <Text style={{ fontSize: 12, color: t.textSecondary }}>🕐 {ev.time || "All day"}</Text>
                <Text style={{ fontSize: 12, color: t.textSecondary }}>⏱ {ev.duration || "1h"}</Text>
                {ev.location && ev.location !== "—" && (
                  <Text style={{ fontSize: 12, color: t.textSecondary }}>📍 {ev.location}</Text>
                )}
              </View>
              {ev.attendees?.length > 0 && (
                <Text style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>
                  👥 {ev.attendees.join(", ")}
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
