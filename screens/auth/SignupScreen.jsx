import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthProvider.jsx";
import { useTheme } from "../../lib/theme.js";

export default function SignupScreen() {
  const { signup, googleSignIn, error, setError } = useAuth();
  const { t } = useTheme();
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async () => {
    if (!name.trim()) { setError("Enter your name."); return; }
    if (!email || !password) { setError("Fill in all fields."); return; }
    setBusy(true); try { await signup(email.trim(), password, name.trim()); } catch {} setBusy(false);
  };

  const s = { input: { backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, padding: 14, fontSize: 15, color: t.text, marginBottom: 14 } };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center", marginBottom: 36 }}>
          <View style={{ width: 52, height: 52, borderRadius: 15, backgroundColor: t.accent, justifyContent: "center", alignItems: "center", marginBottom: 10 }}>
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>S</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: "800", color: t.text }}>Steady</Text>
        </View>

        <Text style={{ fontSize: 20, fontWeight: "700", color: t.text, marginBottom: 4 }}>Create account</Text>
        <Text style={{ fontSize: 13, color: t.textSecondary, marginBottom: 22 }}>Free to get started.</Text>

        {error ? <View style={{ backgroundColor: `${t.danger}15`, borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: `${t.danger}30` }}><Text style={{ color: t.danger, fontSize: 12, fontWeight: "500" }}>{error}</Text></View> : null}

        <TouchableOpacity onPress={googleSignIn} activeOpacity={0.8} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#4285F4" }}>G</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: t.text }}>Sign up with Google</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
          <Text style={{ color: t.textMuted, fontSize: 11, marginHorizontal: 10 }}>or email</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
        </View>

        <TextInput value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={t.textMuted} style={s.input} />
        <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={t.textMuted} keyboardType="email-address" autoCapitalize="none" style={s.input} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Password (6+ chars)" placeholderTextColor={t.textMuted} secureTextEntry style={{ ...s.input, marginBottom: 20 }} />

        <TouchableOpacity onPress={go} disabled={busy} activeOpacity={0.8} style={{ backgroundColor: t.accent, borderRadius: 12, padding: 15, alignItems: "center", opacity: busy ? 0.7 : 1 }}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Create Account</Text>}
        </TouchableOpacity>

        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 22 }}>
          <Text style={{ color: t.textSecondary, fontSize: 13 }}>Have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}><Text style={{ color: t.accent, fontSize: 13, fontWeight: "600" }}>Sign In</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
