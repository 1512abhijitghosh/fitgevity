import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/src/lib/api";
import { theme } from "@/src/lib/theme";
import { ExerciseAnimation } from "@/src/components/exercise-animation";

type Cat = { id: string; name: string; image: string };
type Ex = { exercise_id: string; name: string; duration: number; rest: number; frames: string[] };

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [cat, setCat] = useState<Cat | null>(null);
  const [exercises, setExercises] = useState<Ex[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [cats, exs] = await Promise.all([
          api<Cat[]>("/categories"),
          api<Ex[]>(`/categories/${id}/exercises`),
        ]);
        setCat(cats.find((c) => c.id === id) || null);
        setExercises(exs);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Build an ad-hoc plan from this category and navigate
  const startCategoryWorkout = async () => {
    // Use the first plan that matches this category; or fallback to leg_day/beginner_full
    router.push("/workout/beginner_full");
  };

  if (loading || !cat) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.surface, justifyContent: "center" }}><ActivityIndicator color={theme.color.brand} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="category-screen">
      <View style={styles.headerBar}>
        <Pressable testID="cat-back" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>{cat.name}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.hero}>
          <Image source={cat.image} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={["rgba(15,15,17,0.3)", "rgba(15,15,17,0.95)"]} style={StyleSheet.absoluteFill} />
          <View style={{ padding: theme.space.lg }}>
            <Text style={styles.heroTitle}>{cat.name.toUpperCase()}</Text>
            <Text style={styles.heroSub}>{exercises.length} exercises available</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>EXERCISES</Text>
        <View style={{ paddingHorizontal: theme.space.lg, gap: theme.space.sm }}>
          {exercises.map((ex, i) => (
            <View key={ex.exercise_id || i} style={styles.row} testID={`cat-ex-${i}`}>
              <ExerciseAnimation frames={ex.frames} size={48} intervalMs={1200} active />
              <View style={{ flex: 1 }}>
                <Text style={styles.exName}>{ex.name}</Text>
                <Text style={styles.exMeta}>{ex.duration}s work · {ex.rest}s rest</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable testID="cat-start-btn" style={styles.startBtn} onPress={startCategoryWorkout}>
          <Ionicons name="play" size={20} color="#fff" />
          <Text style={styles.startBtnText}>START WORKOUT</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.space.lg, paddingVertical: theme.space.sm },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.color.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontWeight: "700", fontSize: 16 },
  hero: { height: 200, marginHorizontal: theme.space.lg, borderRadius: theme.radius.lg, overflow: "hidden", justifyContent: "flex-end" },
  heroTitle: { color: "#fff", fontSize: 30, fontWeight: "900", letterSpacing: 1 },
  heroSub: { color: "#fff", opacity: 0.85, marginTop: 4 },
  sectionTitle: { color: "#fff", fontWeight: "900", letterSpacing: 2, fontSize: 13, paddingHorizontal: theme.space.lg, marginTop: theme.space.lg, marginBottom: theme.space.md },
  row: { flexDirection: "row", alignItems: "center", gap: theme.space.md, backgroundColor: theme.color.surfaceSecondary, padding: theme.space.md, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.color.border },
  thumb: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.color.brandTertiary, alignItems: "center", justifyContent: "center" },
  exName: { color: "#fff", fontWeight: "700", fontSize: 14 },
  exMeta: { color: theme.color.onSurfaceTertiary, fontSize: 12, marginTop: 2 },
  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, padding: theme.space.lg, backgroundColor: "rgba(15,15,17,0.95)", borderTopWidth: 1, borderTopColor: theme.color.border },
  startBtn: { backgroundColor: theme.color.brand, paddingVertical: 16, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: theme.space.sm },
  startBtnText: { color: "#fff", fontWeight: "900", letterSpacing: 1, fontSize: 15 },
});
