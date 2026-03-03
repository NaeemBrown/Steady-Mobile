import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthProvider.jsx";
import { useTheme } from "../../lib/theme.js";

export default function LoginScreen() {
  const { login, googleSignIn, resetPassword, error, setError } = useAuth();
  const { t } = useTheme();
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const go = async () => {
    if (!email || !password) { setError("Fill in all fields."); return; }
    setBusy(true); try { await login(email.trim(), password); } catch {} setBusy(false);
  };
  const doReset = async () => {
    if (!email) { setError("Enter your email first."); return; }
    try { await resetPassword(email.trim()); setResetSent(true); } catch {}
  };

  const s = { input: { backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, padding: 14, fontSize: 15, color: t.text, marginBottom: 14 } };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 36 }}>
          <View style={{ width: 52, height: 52, borderRadius: 15, backgroundColor: t.accent, justifyContent: "center", alignItems: "center", marginBottom: 10 }}>
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>S</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: "800", color: t.text }}>Steady</Text>
          <Text style={{ fontSize: 12, color: t.textMuted, marginTop: 2, letterSpacing: 1, textTransform: "uppercase" }}>Stay On Beat</Text>
        </View>

        <Text style={{ fontSize: 20, fontWeight: "700", color: t.text, marginBottom: 4 }}>Welcome back</Text>
        <Text style={{ fontSize: 13, color: t.textSecondary, marginBottom: 22 }}>Sign in to continue.</Text>

        {error ? <View style={{ backgroundColor: `${t.danger}15`, borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: `${t.danger}30` }}><Text style={{ color: t.danger, fontSize: 12, fontWeight: "500" }}>{error}</Text></View> : null}
        {resetSent ? <View style={{ backgroundColor: `${t.success}15`, borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: `${t.success}30` }}><Text style={{ color: t.success, fontSize: 12, fontWeight: "500" }}>Reset link sent! Check your inbox.</Text></View> : null}

        {/* Google */}
        <TouchableOpacity onPress={googleSignIn} activeOpacity={0.8} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#4285F4" }}>G</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: t.text }}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
          <Text style={{ color: t.textMuted, fontSize: 11, marginHorizontal: 10 }}>or email</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
        </View>

        <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={t.textMuted} keyboardType="email-address" autoCapitalize="none" style={s.input} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={t.textMuted} secureTextEntry style={s.input} />

        <TouchableOpacity onPress={doReset} style={{ alignSelf: "flex-end", marginBottom: 18, marginTop: -6 }}>
          <Text style={{ color: t.accent, fontSize: 12, fontWeight: "500" }}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={go} disabled={busy} activeOpacity={0.8} style={{ backgroundColor: t.accent, borderRadius: 12, padding: 15, alignItems: "center", opacity: busy ? 0.7 : 1 }}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Sign In</Text>}
        </TouchableOpacity>

        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 22 }}>
          <Text style={{ color: t.textSecondary, fontSize: 13 }}>No account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}><Text style={{ color: t.accent, fontSize: 13, fontWeight: "600" }}>Sign Up</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
