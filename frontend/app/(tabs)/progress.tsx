import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/lib/api";
import { theme } from "@/src/lib/theme";

type Log = { log_id: string; duration_sec: number; calories: number; exercises_completed: number; created_at: string };
type Stats = { streak: number; total_workouts: number; total_minutes: number; total_calories: number };

const DAY_MS = 86400000;

export default function ProgressScreen() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [h, s] = await Promise.all([
          api<Log[]>("/workouts/history"),
          api<Stats>("/workouts/stats"),
        ]);
        setLogs(h);
        setStats(s);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const calendar = useMemo(() => {
    // Build last 35 days grid
    const completedDays = new Set<string>();
    for (const l of logs) {
      const d = new Date(l.created_at);
      completedDays.add(d.toISOString().slice(0, 10));
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cells: { date: string; active: boolean; isToday: boolean }[] = [];
    for (let i = 34; i >= 0; i--) {
      const d = new Date(today.getTime() - i * DAY_MS);
      const key = d.toISOString().slice(0, 10);
      cells.push({ date: key, active: completedDays.has(key), isToday: i === 0 });
    }
    return cells;
  }, [logs]);

  // Weekly bar data
  const weekBars = useMemo(() => {
    const buckets = new Array(7).fill(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today.getTime() - 6 * DAY_MS);
    for (const l of logs) {
      const d = new Date(l.created_at);
      if (d >= start) {
        const idx = Math.floor((d.getTime() - start.getTime()) / DAY_MS);
        if (idx >= 0 && idx < 7) buckets[idx] += Math.round(l.duration_sec / 60);
      }
    }
    return buckets;
  }, [logs]);

  const maxBar = Math.max(...weekBars, 10);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="progress-screen">
      <ScrollView contentContainerStyle={{ padding: theme.space.lg, paddingBottom: 60 }}>
        <Text style={styles.title}>PROGRESS</Text>
        <Text style={styles.subtitle}>Your fitness journey.</Text>

        {loading ? (
          <ActivityIndicator color={theme.color.brand} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatCard icon="flame" label="Streak" value={`${stats?.streak ?? 0}`} unit="days" color={theme.color.brand} />
              <StatCard icon="barbell" label="Total" value={`${stats?.total_workouts ?? 0}`} unit="workouts" color={theme.color.success} />
              <StatCard icon="time" label="Active" value={`${stats?.total_minutes ?? 0}`} unit="min" color={theme.color.info} />
              <StatCard icon="flash" label="Burned" value={`${stats?.total_calories ?? 0}`} unit="kcal" color={theme.color.warning} />
            </View>

            <Text style={styles.section}>THIS WEEK</Text>
            <View style={styles.chartCard}>
              <View style={styles.barRow}>
                {weekBars.map((v, i) => {
                  const h = Math.max(6, (v / maxBar) * 100);
                  return (
                    <View key={i} style={styles.barCol}>
                      <View style={[styles.bar, { height: h, backgroundColor: v > 0 ? theme.color.brand : theme.color.surfaceTertiary }]} />
                      <Text style={styles.barLabel}>{["S", "M", "T", "W", "T", "F", "S"][(new Date().getDay() + 1 + i) % 7]}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <Text style={styles.section}>ACTIVITY CALENDAR</Text>
            <View style={styles.calendarCard}>
              <View style={styles.calGrid}>
                {calendar.map((c) => (
                  <View
                    key={c.date}
                    style={[
                      styles.calCell,
                      c.active && styles.calCellActive,
                      c.isToday && styles.calCellToday,
                    ]}
                  />
                ))}
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.calCell, { width: 12, height: 12 }]} />
                <Text style={styles.legendText}>Rest</Text>
                <View style={[styles.calCell, styles.calCellActive, { width: 12, height: 12, marginLeft: 12 }]} />
                <Text style={styles.legendText}>Trained</Text>
              </View>
            </View>

            <Text style={styles.section}>RECENT SESSIONS</Text>
            {logs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="trophy-outline" size={36} color={theme.color.brand} />
                <Text style={styles.emptyText}>No workouts yet. Time to start!</Text>
              </View>
            ) : (
              logs.slice(0, 10).map((l) => (
                <View key={l.log_id} style={styles.logRow} testID={`log-row-${l.log_id}`}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.color.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logTitle}>
                      {Math.round(l.duration_sec / 60)} min · {l.exercises_completed} exercises
                    </Text>
                    <Text style={styles.logDate}>{new Date(l.created_at).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.logCalories}>{l.calories} kcal</Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, unit, color }: any) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  title: { color: "#fff", fontSize: 32, fontWeight: "900", letterSpacing: 1 },
  subtitle: { color: theme.color.onSurfaceTertiary, marginTop: 4, marginBottom: theme.space.lg },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.md, marginBottom: theme.space.lg },
  statCard: {
    width: "47%",
    backgroundColor: theme.color.surfaceSecondary,
    borderRadius: theme.radius.md,
    padding: theme.space.md,
    gap: 4,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  statValue: { color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 4 },
  statLabel: { color: theme.color.onSurfaceSecondary, fontSize: 12, fontWeight: "700" },
  statUnit: { color: theme.color.onSurfaceTertiary, fontSize: 11 },
  section: { color: "#fff", fontWeight: "900", letterSpacing: 2, fontSize: 12, marginBottom: theme.space.md, marginTop: theme.space.md },
  chartCard: {
    backgroundColor: theme.color.surfaceSecondary,
    borderRadius: theme.radius.md,
    padding: theme.space.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  barRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 120 },
  barCol: { alignItems: "center", flex: 1, gap: 6 },
  bar: { width: "60%", borderRadius: 4, minHeight: 6 },
  barLabel: { color: theme.color.onSurfaceTertiary, fontSize: 11, fontWeight: "700" },
  calendarCard: {
    backgroundColor: theme.color.surfaceSecondary,
    borderRadius: theme.radius.md,
    padding: theme.space.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  calGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  calCell: {
    width: "12.5%",
    aspectRatio: 1,
    backgroundColor: theme.color.surfaceTertiary,
    borderRadius: 4,
  },
  calCellActive: { backgroundColor: theme.color.brand },
  calCellToday: { borderWidth: 2, borderColor: theme.color.success },
  legendRow: { flexDirection: "row", alignItems: "center", marginTop: theme.space.md, gap: 6 },
  legendText: { color: theme.color.onSurfaceTertiary, fontSize: 12 },
  emptyCard: {
    backgroundColor: theme.color.surfaceSecondary,
    borderRadius: theme.radius.md,
    padding: theme.space.xl,
    alignItems: "center",
    gap: theme.space.sm,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  emptyText: { color: theme.color.onSurfaceSecondary, fontSize: 14 },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.md,
    backgroundColor: theme.color.surfaceSecondary,
    borderRadius: theme.radius.md,
    padding: theme.space.md,
    marginBottom: theme.space.sm,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  logTitle: { color: "#fff", fontWeight: "700", fontSize: 14 },
  logDate: { color: theme.color.onSurfaceTertiary, fontSize: 12, marginTop: 2 },
  logCalories: { color: theme.color.warning, fontWeight: "700" },
});
