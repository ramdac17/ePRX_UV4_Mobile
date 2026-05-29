import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image, // ✅ Added Image component
} from "react-native";
import { Text, View } from "@/components/Themed";
import { CYBER_THEME } from "@/constants/Colors";
import { useRouter } from "expo-router";
import { storeToken } from "@/utils/authStorage";
import api from "@/utils/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("REQUIRED", "USER_EMAIL AND PASSWORD REQUIRED");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email: email.toLowerCase().trim(),
        password,
      });

      const token = response.data.access_token || response.data.accessToken;

      if (token && typeof token === "string" && token.length > 20) {
        await storeToken(token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        setTimeout(() => {
          router.replace("/(tabs)");
        }, 100);
      } else {
        throw new Error("INVALID_TOKEN_FORMAT");
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "UPLINK_FAILURE: CHECK_COORDS";
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
        <View style={styles.header}>
          {/* ✅ BRAND_UPLINK: Logo and Text Container */}
          <View style={styles.logoRow}>
            <Image
              source={require("@/assets/images/eprx-circle.jpg")} // Make sure this path is correct
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>
              ePRX <Text style={{ color: CYBER_THEME.primary }}> OTG</Text>
            </Text>
          </View>

          <Text style={styles.subtitle}>
            {isLoading ? "VERIFYING CREDENTIALS..." : "AUTHENTICATION REQUIRED"}
          </Text>
        </View>

        <View style={styles.glassCard}>
          <Text style={styles.label}>USER EMAIL ADDRESS</Text>
          <TextInput
            style={[styles.input, isLoading && { opacity: 0.5 }]}
            placeholder="user@service.com"
            placeholderTextColor="#444"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            editable={!isLoading}
            keyboardType="email-address"
          />

          <Text style={styles.label}>PASSWORD</Text>
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
              <Text style={styles.buttonText}>LOGIN</Text>
            )}
          </Pressable>

          <View style={styles.linkContainer}>
            <Pressable
              onPress={() => router.push("/(auth)/register")}
              disabled={isLoading}
              style={styles.secondaryLink}
            >
              <Text style={{ color: CYBER_THEME.primary, fontSize: 11 }}>
                NEW USER? REGISTER
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(auth)/ForgotPassword")}
              disabled={isLoading}
              style={styles.secondaryLink}
            >
              <Text style={{ color: "#FF0055", fontSize: 11 }}>
                FORGOT PASSWORD?
              </Text>
            </Pressable>
          </View>
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

  header: { backgroundColor: "transparent", marginBottom: 40 },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    gap: 10,
  },
  brandLogo: { width: 100, height: 100 }, // Slightly larger for better pulse visibility
  logoText: {
    fontSize: 40,
    fontWeight: "900",
    color: CYBER_THEME.primary,
    letterSpacing: -1,
  },
  subtitle: {
    color: CYBER_THEME.primary,
    fontSize: 12,
    letterSpacing: 2,
    marginTop: 1,
    marginBottom: -25,
    marginLeft: 5,
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
  linkContainer: {
    marginTop: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  secondaryLink: { paddingVertical: 5, backgroundColor: "transparent" },
});
