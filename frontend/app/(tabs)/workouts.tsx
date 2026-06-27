import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/lib/api";
import { theme } from "@/src/lib/theme";

type Category = { id: string; name: string; image: string };
type Plan = { id: string; name: string; level: string; duration_min: number; image: string; exercise_count: number; is_premium: boolean };

export default function WorkoutsScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [c, p] = await Promise.all([api<Category[]>("/categories"), api<Plan[]>("/plans")]);
        setCategories(c);
        setPlans(p);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = filter === "all" ? plans : plans.filter((p) => p.level.toLowerCase() === filter);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="workouts-screen">
      <View style={styles.header}>
        <Text style={styles.title}>WORKOUTS</Text>
        <Text style={styles.subtitle}>Pick your fight.</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsContainer}
      >
        {["all", "beginner", "intermediate", "advanced"].map((f) => (
          <Pressable
            key={f}
            testID={`level-chip-${f}`}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator color={theme.color.brand} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: theme.space.lg, paddingTop: theme.space.md, paddingBottom: 60, gap: theme.space.md }}>
          <Text style={styles.sectionTitle}>CATEGORIES</Text>
          <View style={styles.catGrid}>
            {categories.map((c) => (
              <Pressable
                key={c.id}
                testID={`workouts-category-${c.id}`}
                style={styles.catCard}
                onPress={() => router.push(`/category/${c.id}` as any)}
              >
                <Image source={c.image} style={StyleSheet.absoluteFill} contentFit="cover" />
                <LinearGradient
                  colors={["rgba(15,15,17,0.1)", "rgba(15,15,17,0.9)"]}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.catName}>{c.name.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: theme.space.lg }]}>PLANS</Text>
          {filtered.map((p) => (
            <Pressable
              key={p.id}
              testID={`workouts-plan-${p.id}`}
              style={styles.planCard}
              onPress={() => router.push(`/workout/${p.id}` as any)}
            >
              <Image source={p.image} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient colors={["rgba(15,15,17,0.1)", "rgba(15,15,17,0.95)"]} style={StyleSheet.absoluteFill} />
              <View style={{ padding: theme.space.lg, gap: 4 }}>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <View style={styles.lvlPill}><Text style={styles.lvlPillText}>{p.level.toUpperCase()}</Text></View>
                  {p.is_premium && <View style={styles.proPill}><Ionicons name="star" size={10} color="#0F0F11" /><Text style={styles.proPillText}>PRO</Text></View>}
                </View>
                <Text style={styles.planTitle}>{p.name}</Text>
                <Text style={styles.planMeta}>{p.duration_min} min · {p.exercise_count} exercises</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  header: { paddingHorizontal: theme.space.lg, paddingTop: theme.space.md, paddingBottom: theme.space.md },
  title: { color: "#fff", fontSize: 32, fontWeight: "900", letterSpacing: 1 },
  subtitle: { color: theme.color.onSurfaceTertiary, marginTop: 4 },
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
  sectionTitle: { color: "#fff", fontWeight: "900", fontSize: 13, letterSpacing: 2 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.md },
  catCard: {
    width: "48%",
    aspectRatio: 1.2,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: theme.space.md,
  },
  catName: { color: "#fff", fontWeight: "900", fontSize: 15, letterSpacing: 0.5 },
  planCard: { height: 170, borderRadius: theme.radius.lg, overflow: "hidden", justifyContent: "flex-end" },
  lvlPill: { backgroundColor: theme.color.brand, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.sm },
  lvlPillText: { color: "#fff", fontWeight: "900", fontSize: 10, letterSpacing: 1 },
  proPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: theme.color.gold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.sm },
  proPillText: { color: "#0F0F11", fontWeight: "900", fontSize: 10, letterSpacing: 1 },
  planTitle: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 4 },
  planMeta: { color: "#fff", fontSize: 12, opacity: 0.85 },
});
