import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Text, View } from "@/components/Themed";
import { CYBER_THEME } from "@/constants/Colors";
import { useRouter } from "expo-router";
// ✅ Removed AsyncStorage in favor of our secure helper
import { storeToken } from "@/utils/authStorage";
import api from "@/utils/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("REQUIRED", "CREDENTIAL_ID_OR_ACCESS_CODE_MISSING");
      return;
    }

    setIsLoading(true);
    try {
      // ✅ Using 'api' instance for consistent baseURL/interceptors
      const response = await api.post("/auth/login", {
        email: email.toLowerCase().trim(),
        password,
      });

      const token = response.data.access_token;

      if (token && typeof token === "string") {
        // ✅ SECURE UPLINK: Use the helper to store in SecureStore
        await storeToken(token);

        // ✅ Immediate Header Injection
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        console.log("📡 ePRX_UV4_SESSION_ESTABLISHED");

        // Navigation now only happens after the token is confirmed in the vault
        router.replace("/(tabs)");
      } else {
        throw new Error("INVALID_TOKEN_FORMAT");
      }
    } catch (error: any) {
      console.error("🔴 AUTH_ERROR:", error.response?.data || error.message);
      const msg = error.response?.data?.message || "UPLINK_ERROR";
      Alert.alert("ACCESS_DENIED", msg.toUpperCase());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.background}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        <View style={styles.header}>
          <Text style={styles.logoText}>
            ePRX <Text style={{ color: CYBER_THEME.primary }}>UV4</Text>
          </Text>
          <Text style={styles.subtitle}>
            {isLoading ? "VERIFYING_CREDENTIALS..." : "AUTHENTICATION_REQUIRED"}
          </Text>
        </View>

        <View style={styles.glassCard}>
          <Text style={styles.label}>CREDENTIAL_ID</Text>
          <TextInput
            style={[styles.input, isLoading && { opacity: 0.5 }]}
            placeholder="USER@SYSTEM.IO"
            placeholderTextColor="#444"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            editable={!isLoading}
            keyboardType="email-address"
          />

          <Text style={styles.label}>ACCESS_CODE</Text>
          <TextInput
            style={[styles.input, isLoading && { opacity: 0.5 }]}
            placeholder="••••••••"
            placeholderTextColor="#444"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
          />

          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.button,
              (pressed || isLoading) && { opacity: 0.7 },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>INITIALIZE_LOGIN</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.secondaryLink}
            onPress={() => router.push("/(auth)/register")}
            disabled={isLoading}
          >
            <Text style={styles.secondaryText}>NEW_USER? [REGISTER_ENTRY]</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  background: {
    flex: 1,
    padding: 25,
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  glowTop: {
    position: "absolute",
    top: -100,
    left: -50,
    width: 300,
    height: 300,
    backgroundColor: CYBER_THEME.primary,
    borderRadius: 150,
    opacity: 0.1,
  },
  glowBottom: {
    position: "absolute",
    bottom: -120,
    right: -80,
    width: 300,
    height: 300,
    backgroundColor: "#FF00FF",
    borderRadius: 150,
    opacity: 0.1,
  },
  header: { backgroundColor: "transparent", marginBottom: 40 },
  logoText: {
    fontSize: 42,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
  },
  subtitle: {
    color: CYBER_THEME.primary,
    fontSize: 12,
    letterSpacing: 2,
    marginTop: 5,
  },
  glassCard: {
    backgroundColor: "#0a0a0a",
    padding: 25,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  label: {
    color: "#666",
    fontSize: 10,
    marginBottom: 8,
    letterSpacing: 1,
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "#000",
    color: CYBER_THEME.primary,
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#222",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  button: {
    backgroundColor: CYBER_THEME.primary,
    padding: 18,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#000", fontWeight: "900", letterSpacing: 1 },
  secondaryLink: {
    marginTop: 20,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  secondaryText: { color: "#444", fontSize: 11 },
});
