import React, { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useStripe } from "@/src/lib/stripe-hook";

import { api } from "@/src/lib/api";
import { useAuth } from "@/src/lib/auth";
import { theme } from "@/src/lib/theme";

const PREMIUM_BG = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80";

const BENEFITS = [
  { icon: "infinite", text: "Unlimited access to all premium plans" },
  { icon: "flash", text: "Advanced HIIT & strength routines" },
  { icon: "star", text: "Exclusive premium-only exercises" },
  { icon: "trending-up", text: "Detailed analytics & insights" },
  { icon: "headset", text: "Ad-free experience forever" },
];

export default function PremiumScreen() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const stripe = useStripe();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const upgrade = async () => {
    setError(null);
    setLoading(true);
    try {
      const sheet = await api<any>("/stripe/create-payment-sheet", { method: "POST" });

      if (Platform.OS === "web") {
        // Stripe Payment Sheet is not supported on web in expo. Use confirm-premium mock for demo.
        setError("On mobile preview: use a real device or Expo Go. Web demo will simulate upgrade.");
        // simulate by calling confirm endpoint (will fail without payment) — leave as UI demo
        setLoading(false);
        return;
      }

      const init = await stripe.initPaymentSheet({
        merchantDisplayName: "Limitless Home Workout",
        customerId: sheet.customer,
        customerEphemeralKeySecret: sheet.ephemeralKey,
        paymentIntentClientSecret: sheet.paymentIntent,
        allowsDelayedPaymentMethods: false,
        returnURL: "frontend://stripe-redirect",
      });
      if (init.error) {
        setError(init.error.message);
        setLoading(false);
        return;
      }
      const present = await stripe.presentPaymentSheet();
      if (present.error) {
        if (present.error.code !== "Canceled") setError(present.error.message);
        setLoading(false);
        return;
      }

      // Confirm on backend
      await api("/stripe/confirm-premium", { method: "POST" });
      await refresh();
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "Upgrade failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]} testID="premium-screen">
      <View style={styles.headerBar}>
        <Pressable testID="premium-back" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>PREMIUM</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.hero}>
          <Image source={PREMIUM_BG} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={["rgba(255,215,0,0.2)", "rgba(15,15,17,0.95)"]} style={StyleSheet.absoluteFill} />
          <View style={{ padding: theme.space.xl, alignItems: "center" }}>
            <View style={styles.crownWrap}>
              <Ionicons name="star" size={36} color="#0F0F11" />
            </View>
            <Text style={styles.heroTitle}>GO LIMITLESS</Text>
            <Text style={styles.heroSub}>One-time payment. Lifetime access.</Text>
          </View>
        </View>

        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>LIFETIME PREMIUM</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text style={styles.priceMain}>$9.99</Text>
            <Text style={styles.priceUnit}> · one-time</Text>
          </View>
          <Text style={styles.priceSub}>No subscription. Pay once, train forever.</Text>
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.text} style={styles.benefitRow}>
              <View style={styles.checkIcon}>
                <Ionicons name={b.icon as any} size={16} color={theme.color.gold} />
              </View>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
        {success && (
          <View style={styles.successCard} testID="premium-success">
            <Ionicons name="checkmark-circle" size={28} color={theme.color.success} />
            <Text style={styles.successText}>You are now Premium! Enjoy all features.</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        {user?.is_premium ? (
          <View style={styles.alreadyBtn}>
            <Ionicons name="checkmark-circle" size={20} color={theme.color.success} />
            <Text style={styles.alreadyText}>You're already Premium</Text>
          </View>
        ) : (
          <Pressable testID="upgrade-btn" style={styles.upgradeBtn} onPress={upgrade} disabled={loading}>
            {loading ? <ActivityIndicator color="#0F0F11" /> : (
              <>
                <Ionicons name="lock-open" size={18} color="#0F0F11" />
                <Text style={styles.upgradeText}>UNLOCK PREMIUM · $9.99</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.space.lg, paddingVertical: theme.space.sm },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.color.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: theme.color.gold, fontWeight: "900", letterSpacing: 2, fontSize: 13 },
  hero: { height: 260, marginHorizontal: theme.space.lg, borderRadius: theme.radius.lg, overflow: "hidden", justifyContent: "center" },
  crownWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.color.gold, alignItems: "center", justifyContent: "center", marginBottom: theme.space.md },
  heroTitle: { color: theme.color.gold, fontSize: 36, fontWeight: "900", letterSpacing: 2 },
  heroSub: { color: "#fff", marginTop: 6 },
  priceCard: { margin: theme.space.lg, padding: theme.space.lg, backgroundColor: theme.color.surfaceSecondary, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.color.gold },
  priceLabel: { color: theme.color.gold, fontWeight: "900", letterSpacing: 2, fontSize: 11, marginBottom: 6 },
  priceMain: { color: "#fff", fontSize: 36, fontWeight: "900" },
  priceUnit: { color: theme.color.onSurfaceTertiary, fontSize: 14 },
  priceSub: { color: theme.color.onSurfaceTertiary, marginTop: 6, fontSize: 13 },
  benefits: { paddingHorizontal: theme.space.lg, gap: theme.space.md },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: theme.space.md },
  checkIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,215,0,0.15)", alignItems: "center", justifyContent: "center" },
  benefitText: { color: "#fff", fontSize: 14, flex: 1 },
  error: { color: theme.color.error, paddingHorizontal: theme.space.lg, marginTop: theme.space.md },
  successCard: { flexDirection: "row", gap: theme.space.md, alignItems: "center", margin: theme.space.lg, padding: theme.space.md, backgroundColor: theme.color.surfaceSecondary, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.color.success },
  successText: { color: "#fff", flex: 1 },
  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, padding: theme.space.lg, backgroundColor: "rgba(15,15,17,0.95)", borderTopWidth: 1, borderTopColor: theme.color.border },
  upgradeBtn: { backgroundColor: theme.color.gold, paddingVertical: 16, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: theme.space.sm },
  upgradeText: { color: "#0F0F11", fontWeight: "900", letterSpacing: 1, fontSize: 15 },
  alreadyBtn: { backgroundColor: theme.color.surfaceSecondary, paddingVertical: 16, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: theme.space.sm },
  alreadyText: { color: theme.color.success, fontWeight: "700" },
});
