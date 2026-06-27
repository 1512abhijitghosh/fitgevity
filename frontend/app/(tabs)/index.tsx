import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "@/src/lib/api";
import { useAuth } from "@/src/lib/auth";
import { theme } from "@/src/lib/theme";

type Category = { id: string; name: string; image: string; color: string };
type Plan = {
  id: string;
  name: string;
  level: string;
  duration_min: number;
  image: string;
  exercise_count: number;
  is_premium: boolean;
};
type Stats = { streak: number; total_workouts: number; total_minutes: number; total_calories: number };

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [cats, pls, st] = await Promise.all([
          api<Category[]>("/categories"),
          api<Plan[]>("/plans"),
          api<Stats>("/workouts/stats").catch(() => ({ streak: 0, total_workouts: 0, total_minutes: 0, total_calories: 0 })),
        ]);
        setCategories(cats);
        setPlans(pls);
        setStats(st);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.surface, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.color.brand} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="home-screen">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.name} testID="home-user-name">{user?.name || "Athlete"}</Text>
          </View>
          <Pressable testID="home-streak-chip" style={styles.streakChip}>
            <Ionicons name="flame" size={14} color={theme.color.brand} />
            <Text style={styles.streakText}>{stats?.streak ?? 0} day streak</Text>
          </Pressable>
        </View>

        <View style={styles.metricsRow}>
          <Metric label="Workouts" value={String(stats?.total_workouts ?? 0)} />
          <Metric label="Minutes" value={String(stats?.total_minutes ?? 0)} />
          <Metric label="Calories" value={String(stats?.total_calories ?? 0)} />
        </View>

        <Text style={styles.sectionTitle}>BODY PARTS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={styles.chipsContainer}
        >
          <Chip label="All" active={activeCat === "all"} onPress={() => setActiveCat("all")} />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              active={activeCat === c.id}
              onPress={() => setActiveCat(c.id)}
            />
          ))}
        </ScrollView>

        <View style={styles.categoryGrid}>
          {(activeCat === "all" ? categories : categories.filter((c) => c.id === activeCat)).map((c) => (
            <Pressable
              key={c.id}
              testID={`category-card-${c.id}`}
              style={styles.categoryCard}
              onPress={() => router.push(`/category/${c.id}` as any)}
            >
              <Image source={c.image} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient
                colors={["rgba(15,15,17,0)", "rgba(15,15,17,0.85)"]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.categoryName}>{c.name.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>WORKOUT PLANS</Text>
        <View style={{ paddingHorizontal: theme.space.lg, gap: theme.space.md }}>
          {plans.map((p) => (
            <Pressable
              key={p.id}
              testID={`plan-card-${p.id}`}
              style={styles.planCard}
              onPress={() => router.push(`/workout/${p.id}` as any)}
            >
              <Image source={p.image} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient
                colors={["rgba(15,15,17,0.1)", "rgba(15,15,17,0.95)"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.planContent}>
                <View style={styles.planTopRow}>
                  <View style={styles.levelPill}>
                    <Text style={styles.levelPillText}>{p.level.toUpperCase()}</Text>
                  </View>
                  {p.is_premium && (
                    <View style={styles.premiumPill}>
                      <Ionicons name="star" size={10} color="#0F0F11" />
                      <Text style={styles.premiumPillText}>PRO</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.planTitle}>{p.name}</Text>
                <View style={styles.planMeta}>
                  <Ionicons name="time-outline" size={14} color="#fff" />
                  <Text style={styles.planMetaText}>{p.duration_min} min</Text>
                  <Ionicons name="barbell-outline" size={14} color="#fff" style={{ marginLeft: 12 }} />
                  <Text style={styles.planMetaText}>{p.exercise_count} exercises</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      testID={`chip-${label.toLowerCase().replace(/\s+/g, "-")}`}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  header: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.md,
    paddingBottom: theme.space.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: { color: theme.color.onSurfaceTertiary, fontSize: 13 },
  name: { color: "#fff", fontSize: 24, fontWeight: "900", marginTop: 2 },
  streakChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.color.brandTertiary,
    paddingHorizontal: theme.space.md,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
  },
  streakText: { color: theme.color.brandSecondary, fontWeight: "700", fontSize: 12 },
  metricsRow: {
    flexDirection: "row",
    gap: theme.space.md,
    paddingHorizontal: theme.space.lg,
    marginBottom: theme.space.lg,
  },
  metric: {
    flex: 1,
    backgroundColor: theme.color.surfaceSecondary,
    padding: theme.space.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  metricValue: { color: "#fff", fontSize: 26, fontWeight: "900" },
  metricLabel: { color: theme.color.onSurfaceTertiary, fontSize: 11, marginTop: 2, letterSpacing: 0.5 },
  sectionTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
    paddingHorizontal: theme.space.lg,
    marginTop: theme.space.md,
    marginBottom: theme.space.md,
  },
  chipsContainer: { maxHeight: 56 },
  chipsRow: { paddingHorizontal: theme.space.lg, gap: theme.space.sm, alignItems: "center" },
  chip: {
    flexShrink: 0,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.color.border,
    justifyContent: "center",
  },
  chipActive: { borderColor: theme.color.brand, backgroundColor: theme.color.brandTertiary },
  chipText: { color: theme.color.onSurfaceTertiary, fontWeight: "700", fontSize: 13 },
  chipTextActive: { color: theme.color.brandSecondary },
  categoryGrid: {
    paddingHorizontal: theme.space.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.space.md,
    marginTop: theme.space.md,
  },
  categoryCard: {
    width: "47%",
    aspectRatio: 1.1,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: theme.space.md,
  },
  categoryName: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 0.5 },
  planCard: {
    height: 180,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  planContent: { padding: theme.space.lg, gap: 6 },
  planTopRow: { flexDirection: "row", gap: theme.space.sm },
  levelPill: {
    backgroundColor: theme.color.brand,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  levelPillText: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  premiumPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.color.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  premiumPillText: { color: "#0F0F11", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  planTitle: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 4 },
  planMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  planMetaText: { color: "#fff", fontSize: 12, marginLeft: 4 },
});
