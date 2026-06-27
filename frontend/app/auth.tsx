import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/src/lib/auth";
import { theme } from "@/src/lib/theme";

const HERO = "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=900&q=80";

export default function AuthScreen() {
  const { signIn, signUp, signInWithGoogleSession } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email || !password || (mode === "signup" && !name)) {
      setError("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email.trim(), password, name.trim());
      } else {
        await signIn(email.trim(), password);
      }
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      let redirectUrl: string;
      if (Platform.OS === "web") {
        redirectUrl = window.location.origin + "/";
      } else {
        redirectUrl = Linking.createURL("auth");
      }
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;

      if (Platform.OS === "web") {
        window.location.href = authUrl;
        return;
      }
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      if (result.type !== "success" || !result.url) {
        setLoading(false);
        return;
      }
      const url = result.url;
      const sessionMatch = url.match(/[#?&]session_id=([^&]+)/);
      if (!sessionMatch) {
        setError("Google auth: no session id returned");
        setLoading(false);
        return;
      }
      await signInWithGoogleSession(decodeURIComponent(sessionMatch[1]));
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.color.surface }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" testID="auth-screen">
        <View style={styles.heroWrap}>
          <Image source={HERO} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={["rgba(15,15,17,0)", "rgba(15,15,17,0.7)", theme.color.surface]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
            <Text style={styles.brandTag}>LIMITLESS</Text>
            <Text style={styles.title}>HOME WORKOUT</Text>
            <Text style={styles.subtitle}>Train anywhere. Push every limit.</Text>
          </View>
        </View>

        <View style={styles.formWrap}>
          <View style={styles.tabs}>
            <Pressable
              testID="auth-mode-login"
              style={[styles.tab, mode === "login" && styles.tabActive]}
              onPress={() => setMode("login")}
            >
              <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>Sign In</Text>
            </Pressable>
            <Pressable
              testID="auth-mode-signup"
              style={[styles.tab, mode === "signup" && styles.tabActive]}
              onPress={() => setMode("signup")}
            >
              <Text style={[styles.tabText, mode === "signup" && styles.tabTextActive]}>Sign Up</Text>
            </Pressable>
          </View>

          {mode === "signup" && (
            <TextInput
              testID="auth-name-input"
              placeholder="Your name"
              placeholderTextColor={theme.color.onSurfaceTertiary}
              value={name}
              onChangeText={setName}
              style={styles.input}
              autoCapitalize="words"
            />
          )}
          <TextInput
            testID="auth-email-input"
            placeholder="Email"
            placeholderTextColor={theme.color.onSurfaceTertiary}
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            testID="auth-password-input"
            placeholder="Password"
            placeholderTextColor={theme.color.onSurfaceTertiary}
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />

          {error && <Text style={styles.error} testID="auth-error">{error}</Text>}

          <Pressable
            testID="auth-submit-button"
            style={styles.primaryBtn}
            onPress={submit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
              </Text>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <Pressable
            testID="auth-google-button"
            style={styles.googleBtn}
            onPress={handleGoogle}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={18} color="#0F0F11" />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: theme.space.xxl },
  heroWrap: { height: 320, justifyContent: "flex-end" },
  heroContent: { padding: theme.space.xl },
  brandTag: {
    color: theme.color.brand,
    fontSize: 12,
    letterSpacing: 4,
    fontWeight: "700",
    marginBottom: theme.space.sm,
  },
  title: { color: "#fff", fontSize: 38, fontWeight: "900", letterSpacing: 1 },
  subtitle: { color: theme.color.onSurfaceSecondary, marginTop: theme.space.sm, fontSize: 14 },
  formWrap: { paddingHorizontal: theme.space.xl, gap: theme.space.md },
  tabs: {
    flexDirection: "row",
    backgroundColor: theme.color.surfaceSecondary,
    borderRadius: theme.radius.pill,
    padding: 4,
    marginBottom: theme.space.md,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: theme.radius.pill },
  tabActive: { backgroundColor: theme.color.brand },
  tabText: { color: theme.color.onSurfaceTertiary, fontWeight: "700", letterSpacing: 0.5 },
  tabTextActive: { color: "#fff" },
  input: {
    backgroundColor: theme.color.surfaceSecondary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space.lg,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.color.border,
  },
  error: { color: theme.color.error, fontSize: 13 },
  primaryBtn: {
    backgroundColor: theme.color.brand,
    paddingVertical: 16,
    borderRadius: theme.radius.md,
    alignItems: "center",
    marginTop: theme.space.sm,
  },
  primaryBtnText: { color: "#fff", fontWeight: "900", letterSpacing: 1, fontSize: 15 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: theme.space.md, gap: theme.space.md },
  divider: { flex: 1, height: 1, backgroundColor: theme.color.border },
  dividerText: { color: theme.color.onSurfaceTertiary, fontSize: 12, letterSpacing: 2 },
  googleBtn: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: theme.space.sm,
  },
  googleBtnText: { color: "#0F0F11", fontWeight: "700", fontSize: 15 },
});
