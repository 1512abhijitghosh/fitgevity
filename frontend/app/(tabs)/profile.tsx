import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/src/lib/auth";
import { theme } from "@/src/lib/theme";

const PREMIUM_BG = "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="profile-screen">
      <ScrollView contentContainerStyle={{ padding: theme.space.lg, paddingBottom: 80 }}>
        <Text style={styles.title}>PROFILE</Text>

        <View style={styles.userCard}>
          <View style={styles.avatar} testID="profile-avatar">
            {user?.picture ? (
              <Image source={user.picture} style={{ flex: 1, borderRadius: 999 }} contentFit="cover" />
            ) : (
              <Ionicons name="person" size={32} color="#fff" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName} testID="profile-user-name">{user?.name || "Athlete"}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.badgeRow}>
              {user?.is_premium ? (
                <View style={styles.premiumBadge} testID="profile-premium-badge">
                  <Ionicons name="star" size={10} color="#0F0F11" />
                  <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                </View>
              ) : (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>FREE</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {!user?.is_premium && (
          <Pressable
            testID="profile-go-premium-button"
            style={styles.premiumCard}
            onPress={() => router.push("/premium")}
          >
            <Image source={PREMIUM_BG} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient
              colors={["rgba(255,215,0,0.25)", "rgba(15,15,17,0.95)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={{ padding: theme.space.lg }}>
              <View style={styles.goldPill}>
                <Ionicons name="star" size={12} color="#0F0F11" />
                <Text style={styles.goldPillText}>UNLOCK PREMIUM</Text>
              </View>
              <Text style={styles.premiumTitle}>GO LIMITLESS</Text>
              <Text style={styles.premiumDesc}>
                Unlock advanced plans, HIIT routines, and unlimited workouts.
              </Text>
              <View style={styles.premiumCta}>
                <Text style={styles.premiumCtaText}>Upgrade Now</Text>
                <Ionicons name="arrow-forward" size={16} color="#0F0F11" />
              </View>
            </View>
          </Pressable>
        )}

        <Text style={styles.section}>SETTINGS</Text>

        <Row icon="notifications-outline" label="Reminders" testID="settings-reminders" />
        <Row icon="moon-outline" label="Dark mode" sub="Always on" testID="settings-theme" />
        <Row icon="time-outline" label="Workout duration" sub="Default 20 min" testID="settings-duration" />
        <Row icon="volume-high-outline" label="Audio cues" sub="On" testID="settings-audio" />
        <Row icon="help-circle-outline" label="Help & Support" testID="settings-help" />

        <Pressable
          testID="profile-logout-button"
          style={styles.logoutBtn}
          onPress={async () => {
            await signOut();
            router.replace("/auth");
          }}
        >
          <Ionicons name="log-out-outline" size={18} color={theme.color.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, label, sub, testID }: { icon: any; label: string; sub?: string; testID?: string }) {
  return (
    <Pressable testID={testID} style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={theme.color.brandSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.color.onSurfaceTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  title: { color: "#fff", fontSize: 32, fontWeight: "900", letterSpacing: 1, marginBottom: theme.space.lg },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.md,
    backgroundColor: theme.color.surfaceSecondary,
    padding: theme.space.lg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.color.brand,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  userName: { color: "#fff", fontSize: 20, fontWeight: "900" },
  userEmail: { color: theme.color.onSurfaceTertiary, fontSize: 13, marginTop: 2 },
  badgeRow: { flexDirection: "row", marginTop: 8 },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.color.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
  },
  premiumBadgeText: { color: "#0F0F11", fontWeight: "900", fontSize: 10, letterSpacing: 1 },
  freeBadge: {
    backgroundColor: theme.color.surfaceTertiary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
  },
  freeBadgeText: { color: theme.color.onSurfaceSecondary, fontWeight: "700", fontSize: 10, letterSpacing: 1 },
  premiumCard: {
    height: 200,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    marginTop: theme.space.lg,
    justifyContent: "flex-end",
  },
  goldPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: theme.color.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    marginBottom: 8,
  },
  goldPillText: { color: "#0F0F11", fontWeight: "900", fontSize: 10, letterSpacing: 1 },
  premiumTitle: { color: theme.color.gold, fontSize: 28, fontWeight: "900", letterSpacing: 1 },
  premiumDesc: { color: "#fff", fontSize: 13, marginTop: 4, marginBottom: theme.space.md },
  premiumCta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.color.gold,
    paddingHorizontal: theme.space.md,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
  },
  premiumCtaText: { color: "#0F0F11", fontWeight: "900", letterSpacing: 0.5 },
  section: { color: "#fff", fontWeight: "900", letterSpacing: 2, fontSize: 12, marginTop: theme.space.xl, marginBottom: theme.space.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.md,
    backgroundColor: theme.color.surfaceSecondary,
    padding: theme.space.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.space.sm,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.color.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { color: "#fff", fontWeight: "700", fontSize: 14 },
  rowSub: { color: theme.color.onSurfaceTertiary, fontSize: 12, marginTop: 2 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.space.sm,
    marginTop: theme.space.xl,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.error,
  },
  logoutText: { color: theme.color.error, fontWeight: "700" },
});
