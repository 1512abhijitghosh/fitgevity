import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import LottieView from "lottie-react-native";

import { api } from "@/src/lib/api";
import { useAuth } from "@/src/lib/auth";
import { theme } from "@/src/lib/theme";

type Exercise = {
  exercise_id?: string;
  name: string;
  duration: number;
  rest: number;
  lottie: string;
  instructions: string[];
};

type Plan = {
  id: string;
  name: string;
  level: string;
  duration_min: number;
  image: string;
  is_premium: boolean;
  exercises: Exercise[];
};

const haptic = (type: "light" | "heavy" | "success") => {
  if (Platform.OS === "web") return;
  if (type === "light") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  else if (type === "heavy") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

export default function WorkoutDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  // Active workout state
  const [running, setRunning] = useState(false);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [phase, setPhase] = useState<"work" | "rest" | "done">("work");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const tickRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await api<Plan>(`/plans/${id}`);
        setPlan(p);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const current = plan?.exercises[exerciseIdx];
  const phaseDuration = current ? (phase === "work" ? current.duration : current.rest) : 0;
  const progress = phaseDuration > 0 ? 1 - secondsLeft / phaseDuration : 0;

  const stopTimer = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (duration: number) => {
      stopTimer();
      setSecondsLeft(duration);
      tickRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            return 0;
          }
          return s - 1;
        });
        setTotalElapsed((t) => t + 1);
      }, 1000);
    },
    [stopTimer],
  );

  // Phase transitions
  useEffect(() => {
    if (!running || !plan || !current) return;
    if (secondsLeft === 0 && phase !== "done") {
      haptic("success");
      if (phase === "work") {
        if (current.rest > 0) {
          setPhase("rest");
          startTimer(current.rest);
        } else {
          advance();
        }
      } else {
        advance();
      }
    }
  }, [secondsLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = () => {
    if (!plan) return;
    const next = exerciseIdx + 1;
    if (next >= plan.exercises.length) {
      finishWorkout();
      return;
    }
    setExerciseIdx(next);
    setPhase("work");
    startTimer(plan.exercises[next].duration);
  };

  const startWorkout = () => {
    if (!plan) return;
    if (plan.is_premium && !user?.is_premium) {
      router.push("/premium");
      return;
    }
    haptic("heavy");
    setRunning(true);
    setExerciseIdx(0);
    setPhase("work");
    setTotalElapsed(0);
    startTimer(plan.exercises[0].duration);
  };

  const pause = () => {
    haptic("light");
    stopTimer();
    setRunning(false);
  };

  const finishWorkout = async () => {
    stopTimer();
    setPhase("done");
    setRunning(false);
    try {
      await api("/workouts/log", {
        method: "POST",
        body: {
          plan_id: plan?.id,
          duration_sec: totalElapsed,
          calories: Math.round((totalElapsed / 60) * 8),
          exercises_completed: plan?.exercises.length ?? 0,
        },
      });
      await refresh();
    } catch {}
  };

  useEffect(() => stopTimer, [stopTimer]);

  if (loading || !plan) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.surface, justifyContent: "center" }}>
        <ActivityIndicator color={theme.color.brand} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="workout-detail">
      <View style={styles.headerBar}>
        <Pressable testID="back-btn" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{plan.name}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
        <View style={styles.hero}>
          <Image source={plan.image} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={["rgba(15,15,17,0.4)", "rgba(15,15,17,0.95)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ padding: theme.space.lg }}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <View style={styles.lvlPill}><Text style={styles.lvlPillText}>{plan.level.toUpperCase()}</Text></View>
              {plan.is_premium && (
                <View style={styles.proPill}><Ionicons name="star" size={10} color="#0F0F11" /><Text style={styles.proPillText}>PRO</Text></View>
              )}
            </View>
            <Text style={styles.planTitle}>{plan.name}</Text>
            <Text style={styles.planMeta}>{plan.duration_min} min · {plan.exercises.length} exercises</Text>
          </View>
        </View>

        {running && current && (
          <View style={styles.activeCard} testID="active-workout">
            <View style={[styles.timerRing, { borderColor: phase === "work" ? theme.color.brand : theme.color.success }]}>
              <View style={styles.lottieBox}>
                <LottieView
                  source={{ uri: current.lottie }}
                  autoPlay
                  loop
                  style={{ width: 160, height: 160 }}
                />
              </View>
            </View>
            <Text style={styles.phaseLabel} testID="phase-label">
              {phase === "work" ? "TRAIN" : "REST"}
            </Text>
            <Text style={styles.exerciseName} testID="current-exercise">{current.name}</Text>
            <Text style={[styles.timerText, { color: phase === "work" ? theme.color.brand : theme.color.success }]} testID="timer-seconds">
              {String(secondsLeft).padStart(2, "0")}s
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: phase === "work" ? theme.color.brand : theme.color.success }]} />
            </View>
            <View style={{ flexDirection: "row", gap: theme.space.md, marginTop: theme.space.md }}>
              <Pressable testID="skip-btn" style={[styles.controlBtn, { backgroundColor: theme.color.surfaceTertiary }]} onPress={advance}>
                <Ionicons name="play-skip-forward" size={18} color="#fff" />
                <Text style={styles.controlBtnText}>Skip</Text>
              </Pressable>
              <Pressable testID="pause-btn" style={[styles.controlBtn, { backgroundColor: theme.color.error }]} onPress={pause}>
                <Ionicons name="pause" size={18} color="#fff" />
                <Text style={styles.controlBtnText}>Pause</Text>
              </Pressable>
            </View>
            <Text style={styles.upNext}>
              {exerciseIdx + 1}/{plan.exercises.length}
            </Text>
          </View>
        )}

        {phase === "done" && (
          <View style={styles.doneCard} testID="workout-done">
            <Ionicons name="trophy" size={48} color={theme.color.gold} />
            <Text style={styles.doneTitle}>WORKOUT COMPLETE</Text>
            <Text style={styles.doneSub}>{Math.round(totalElapsed / 60)} min · {plan.exercises.length} exercises</Text>
            <Pressable testID="done-back-btn" style={styles.primaryBtn} onPress={() => router.push("/(tabs)/progress")}>
              <Text style={styles.primaryBtnText}>VIEW PROGRESS</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.sectionTitle}>EXERCISES</Text>
        <View style={{ paddingHorizontal: theme.space.lg, gap: theme.space.sm }}>
          {plan.exercises.map((ex, i) => (
            <View
              key={`${ex.name}-${i}`}
              style={[styles.exerciseRow, running && i === exerciseIdx && styles.exerciseRowActive]}
              testID={`exercise-row-${i}`}
            >
              <View style={styles.exNumber}>
                <Text style={styles.exNumberText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.exName}>{ex.name}</Text>
                <Text style={styles.exMeta}>{ex.duration}s work · {ex.rest}s rest</Text>
              </View>
              {running && i === exerciseIdx && (
                <View style={styles.runDot} />
              )}
            </View>
          ))}
        </View>

        {current && (
          <View style={{ paddingHorizontal: theme.space.lg, marginTop: theme.space.lg }}>
            <Text style={styles.sectionTitle}>HOW TO DO IT</Text>
            {(running ? current : plan.exercises[0]).instructions.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepDot}><Text style={styles.stepDotText}>{i + 1}</Text></View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {!running && phase !== "done" && (
        <View style={styles.bottomBar}>
          <Pressable testID="start-workout-btn" style={styles.startBtn} onPress={startWorkout}>
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.startBtnText}>START WORKOUT</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.sm,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.color.surfaceSecondary,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontWeight: "700", fontSize: 15, flex: 1, textAlign: "center" },
  hero: { height: 220, justifyContent: "flex-end", marginHorizontal: theme.space.lg, borderRadius: theme.radius.lg, overflow: "hidden" },
  lvlPill: { backgroundColor: theme.color.brand, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.sm },
  lvlPillText: { color: "#fff", fontWeight: "900", fontSize: 10, letterSpacing: 1 },
  proPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: theme.color.gold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.sm },
  proPillText: { color: "#0F0F11", fontWeight: "900", fontSize: 10, letterSpacing: 1 },
  planTitle: { color: "#fff", fontSize: 26, fontWeight: "900", marginTop: 6 },
  planMeta: { color: "#fff", opacity: 0.85, fontSize: 13, marginTop: 4 },
  activeCard: {
    margin: theme.space.lg,
    padding: theme.space.lg,
    backgroundColor: theme.color.surfaceSecondary,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  timerRing: {
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 6, alignItems: "center", justifyContent: "center",
    backgroundColor: theme.color.surfaceTertiary,
  },
  lottieBox: { width: 160, height: 160, alignItems: "center", justifyContent: "center" },
  phaseLabel: { color: "#fff", fontWeight: "900", letterSpacing: 3, marginTop: theme.space.md, fontSize: 14 },
  exerciseName: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 4 },
  timerText: { fontSize: 56, fontWeight: "900", marginTop: theme.space.sm },
  progressTrack: { width: "100%", height: 4, backgroundColor: theme.color.surfaceTertiary, borderRadius: 2, marginTop: theme.space.md, overflow: "hidden" },
  progressFill: { height: "100%" },
  controlBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: theme.space.lg, paddingVertical: 12, borderRadius: theme.radius.pill },
  controlBtnText: { color: "#fff", fontWeight: "700" },
  upNext: { color: theme.color.onSurfaceTertiary, marginTop: theme.space.md, fontSize: 12, letterSpacing: 2 },
  doneCard: { margin: theme.space.lg, padding: theme.space.xl, backgroundColor: theme.color.surfaceSecondary, borderRadius: theme.radius.lg, alignItems: "center", gap: theme.space.sm, borderWidth: 1, borderColor: theme.color.gold },
  doneTitle: { color: theme.color.gold, fontSize: 22, fontWeight: "900", letterSpacing: 2 },
  doneSub: { color: theme.color.onSurfaceSecondary, fontSize: 14 },
  primaryBtn: { backgroundColor: theme.color.brand, paddingHorizontal: theme.space.xl, paddingVertical: 12, borderRadius: theme.radius.pill, marginTop: theme.space.md },
  primaryBtnText: { color: "#fff", fontWeight: "900", letterSpacing: 1 },
  sectionTitle: { color: "#fff", fontWeight: "900", letterSpacing: 2, fontSize: 13, paddingHorizontal: theme.space.lg, marginTop: theme.space.lg, marginBottom: theme.space.md },
  exerciseRow: { flexDirection: "row", alignItems: "center", gap: theme.space.md, backgroundColor: theme.color.surfaceSecondary, padding: theme.space.md, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.color.border },
  exerciseRowActive: { borderColor: theme.color.brand },
  exNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.color.brandTertiary, alignItems: "center", justifyContent: "center" },
  exNumberText: { color: theme.color.brandSecondary, fontWeight: "900" },
  exName: { color: "#fff", fontWeight: "700", fontSize: 14 },
  exMeta: { color: theme.color.onSurfaceTertiary, fontSize: 12, marginTop: 2 },
  runDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.color.brand },
  stepRow: { flexDirection: "row", gap: theme.space.md, alignItems: "flex-start", marginBottom: theme.space.sm },
  stepDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: theme.color.brand, alignItems: "center", justifyContent: "center", marginTop: 2 },
  stepDotText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  stepText: { color: theme.color.onSurfaceSecondary, flex: 1, lineHeight: 20, fontSize: 14 },
  bottomBar: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    padding: theme.space.lg,
    backgroundColor: "rgba(15,15,17,0.95)",
    borderTopWidth: 1, borderTopColor: theme.color.border,
  },
  startBtn: {
    backgroundColor: theme.color.brand,
    paddingVertical: 16,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: theme.space.sm,
  },
  startBtnText: { color: "#fff", fontWeight: "900", letterSpacing: 1, fontSize: 15 },
});
