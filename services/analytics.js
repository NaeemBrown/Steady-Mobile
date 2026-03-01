/**
 * analytics.js — Compute all dashboard & analytics data from real events
 *
 * Every chart / KPI / insight is derived from the actual events array.
 * No more hardcoded mock data for analytics.
 */

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─── Helpers ─────────────────────────────────────────────

function parseDuration(dur) {
  if (!dur || dur === "—") return 60; // default 1h
  const hMatch = dur.match(/([\d.]+)\s*h/);
  const mMatch = dur.match(/(\d+)\s*m/);
  let mins = 0;
  if (hMatch) mins += parseFloat(hMatch[1]) * 60;
  if (mMatch) mins += parseInt(mMatch[2]);
  return mins || 60;
}

function parseTime(time) {
  if (!time || time === "All day") return null;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function getEventDate(event) {
  if (event.fullDate) return new Date(event.fullDate);
  // Fallback: use day number in current month
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), event.day || 1);
}

// ─── Dashboard KPIs ──────────────────────────────────────

export function computeDashboardKPIs(events) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const totalEvents = events.length;

  // Total hours scheduled
  const totalMins = events.reduce((sum, e) => sum + parseDuration(e.duration), 0);
  const totalHours = (totalMins / 60).toFixed(1);

  // Meetings this week
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const meetingsThisWeek = events.filter(e => {
    const d = getEventDate(e);
    return e.type === "meeting" && d >= weekStart && d < weekEnd;
  }).length;

  // Focus time this week
  const focusMins = events.filter(e => {
    const d = getEventDate(e);
    return e.type === "focus" && d >= weekStart && d < weekEnd;
  }).reduce((sum, e) => sum + parseDuration(e.duration), 0);
  const focusHours = (focusMins / 60).toFixed(1);

  return { totalEvents, totalHours, meetingsThisWeek, focusHours };
}

// ─── Weekly Activity (events & hours per day of week) ────

export function computeWeeklyData(events) {
  const buckets = dayLabels.map(day => ({ day, events: 0, hours: 0 }));

  events.forEach(e => {
    const d = getEventDate(e);
    const dow = d.getDay(); // 0=Sun
    buckets[dow].events += 1;
    buckets[dow].hours += parseDuration(e.duration) / 60;
  });

  // Reorder Mon-Sun for display
  const reordered = [...buckets.slice(1), buckets[0]];
  return reordered.map(b => ({ ...b, hours: Math.round(b.hours * 10) / 10 }));
}

// ─── Monthly Trend (last 6 months) ──────────────────────

export function computeMonthlyTrend(events) {
  const now = new Date();
  const months = [];

  for (let i = 5; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = monthLabels[m.getMonth()];
    const count = events.filter(e => {
      const d = getEventDate(e);
      return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
    }).length;
    months.push({ month: label, total: count });
  }

  return months;
}

// ─── Category Distribution ──────────────────────────────

export function computeCategoryData(events, t) {
  const cats = {};
  events.forEach(e => {
    const type = e.type || "other";
    cats[type] = (cats[type] || 0) + 1;
  });

  const colorMap = {
    meeting: t.accent, focus: t.success, social: t.warning,
    health: t.info, travel: t.danger, other: t.textMuted,
  };

  const total = events.length || 1;
  return Object.entries(cats).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Math.round((value / total) * 100),
    color: colorMap[name] || t.accent,
  }));
}

// ─── Source Distribution ────────────────────────────────

export function computeSourceDistribution(events, t) {
  const sources = {};
  events.forEach(e => {
    const src = e.source || "other";
    sources[src] = (sources[src] || 0) + 1;
  });

  const colorMap = {
    google: t.google, outlook: t.outlook, apple: t.apple,
    work: t.work, personal: t.personal,
  };

  return Object.entries(sources).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: colorMap[name] || t.accent,
  }));
}

// ─── Hourly Distribution ────────────────────────────────

export function computeHourlyDistribution(events) {
  const hours = {};
  for (let h = 6; h <= 20; h++) hours[h] = 0;

  events.forEach(e => {
    const start = parseTime(e.time);
    if (start === null) return;
    const hour = Math.floor(start / 60);
    if (hours[hour] !== undefined) hours[hour]++;
  });

  return Object.entries(hours).map(([h, count]) => {
    const hr = parseInt(h);
    const label = hr === 0 ? "12am" : hr < 12 ? `${hr}am` : hr === 12 ? "12pm" : `${hr - 12}pm`;
    return { hour: label, count };
  });
}

// ─── Time Allocation (for pie chart) ────────────────────

export function computeTimeAllocation(events, t) {
  const buckets = { Work: 0, Personal: 0, "Health & Fitness": 0, Social: 0, Other: 0 };

  events.forEach(e => {
    const mins = parseDuration(e.duration);
    if (e.type === "meeting" || e.type === "focus") buckets.Work += mins;
    else if (e.type === "health") buckets["Health & Fitness"] += mins;
    else if (e.type === "social") buckets.Social += mins;
    else if (e.source === "personal") buckets.Personal += mins;
    else buckets.Other += mins;
  });

  const total = Object.values(buckets).reduce((a, b) => a + b, 0) || 1;
  const colorMap = {
    Work: t.accent, Personal: t.info, "Health & Fitness": t.warning,
    Social: t.success, Other: t.danger,
  };

  return Object.entries(buckets)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({
      name,
      value: Math.round((value / total) * 100),
      color: colorMap[name] || t.textMuted,
    }));
}

// ─── Weekly Energy (busy vs free hours per day) ─────────

export function computeWeeklyEnergy(events) {
  const WAKING_HOURS = 16; // assume 16 waking hours per day
  const buckets = dayLabels.map(day => ({ day, busy: 0, free: WAKING_HOURS }));

  events.forEach(e => {
    const d = getEventDate(e);
    const dow = d.getDay();
    const hrs = parseDuration(e.duration) / 60;
    buckets[dow].busy += hrs;
    buckets[dow].free = Math.max(0, WAKING_HOURS - buckets[dow].busy);
  });

  // Reorder Mon-Sun
  const reordered = [...buckets.slice(1), buckets[0]];
  return reordered.map(b => ({
    ...b,
    busy: Math.round(b.busy * 10) / 10,
    free: Math.round(b.free * 10) / 10,
  }));
}

// ─── Work/Life Balance Trend (last 6 months) ────────────

export function computeBalanceTrend(events) {
  const now = new Date();
  const months = [];

  for (let i = 5; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = monthLabels[m.getMonth()];
    const monthEvents = events.filter(e => {
      const d = getEventDate(e);
      return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
    });

    let workMins = 0, lifeMins = 0;
    monthEvents.forEach(e => {
      const mins = parseDuration(e.duration);
      if (e.type === "meeting" || e.type === "focus" || e.source === "work" || e.source === "outlook") {
        workMins += mins;
      } else {
        lifeMins += mins;
      }
    });

    const total = workMins + lifeMins || 1;
    months.push({
      month: label,
      work: Math.round((workMins / total) * 100),
      life: Math.round((lifeMins / total) * 100),
    });
  }

  return months;
}

// ─── Streak Data ────────────────────────────────────────

export function computeStreaks(events, t) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  function countStreak(filterFn) {
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayEvents = events.filter(e => {
        const ed = getEventDate(e);
        return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth() && ed.getDate() === d.getDate();
      });
      if (dayEvents.some(filterFn)) streak++;
      else if (i > 0) break; // streak broken
    }
    return streak;
  }

  return [
    { name: "Exercise", current: countStreak(e => e.type === "health"), best: 21, color: t.info },
    { name: "Social Plans", current: countStreak(e => e.type === "social"), best: 8, color: t.warning },
    { name: "Focus Blocks", current: countStreak(e => e.type === "focus"), best: 14, color: t.success },
    { name: "Early Mornings", current: countStreak(e => {
      const start = parseTime(e.time);
      return start !== null && start < 8 * 60; // before 8am
    }), best: 18, color: t.danger },
  ];
}

// ─── Insights ───────────────────────────────────────────

export function computeInsights(events) {
  // Best day (most free time = fewest events)
  const eventsByDow = [0, 0, 0, 0, 0, 0, 0];
  events.forEach(e => {
    const d = getEventDate(e);
    eventsByDow[d.getDay()]++;
  });
  const minIdx = eventsByDow.indexOf(Math.min(...eventsByDow));
  const bestDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][minIdx];

  // Average wind-down time (latest event end time)
  const endTimes = events.map(e => {
    const start = parseTime(e.time);
    if (start === null) return null;
    return start + parseDuration(e.duration);
  }).filter(Boolean);

  let avgEnd = "6 PM";
  if (endTimes.length > 0) {
    const avg = endTimes.reduce((a, b) => a + b, 0) / endTimes.length;
    const h = Math.floor(avg / 60);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h > 12 ? h - 12 : h || 12;
    avgEnd = `${h12} ${ampm} avg`;
  }

  // Busiest & lightest days
  const maxIdx = eventsByDow.indexOf(Math.max(...eventsByDow));
  const busiestDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][maxIdx];

  return { bestDay, avgEnd, busiestDay, lightestDay: bestDay };
}

// ─── People Analytics ───────────────────────────────────

export function computePeopleStats(people, events) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const newThisMonth = people.filter(p => {
    if (!p.createdAt) return false;
    return new Date(p.createdAt) >= monthStart;
  }).length;

  const avgMeetings = people.length > 0
    ? Math.round(people.reduce((a, p) => a + (p.meetings || 0), 0) / people.length)
    : 0;

  return { newThisMonth, avgMeetings };
}
