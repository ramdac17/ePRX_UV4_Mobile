import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Text, View } from "@/components/Themed";
import { CYBER_THEME } from "@/constants/Colors";
import { useRouter } from "expo-router";
import api from "@/utils/api"; // ✅ Use the custom instance

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [username, setusername] = useState("");
  const [firstName, setfirstname] = useState("");
  const [lastName, setlastName] = useState("");
  const [mobile, setmobile] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !username || !firstName || !lastName) {
      return Alert.alert("REQUIRED", "ALL_FIELDS_MUST_BE_FILLED");
    }

    setIsLoading(true);

    try {
      const registrationData = {
        email: email.toLowerCase().trim(),
        password: password,
        username: username.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        mobile: mobile.trim(),
      };

      console.log("📡 SENDING_RECRUIT_DATA:", registrationData);

      // ✅ baseURL is handled by the 'api' instance automatically
      await api.post("/auth/register", registrationData);

      Alert.alert("SUCCESS", "REGISTRATION_COMPLETE: PROCEED_TO_LOGIN");
      router.replace("/(auth)/login");
    } catch (error: any) {
      console.error("🔴 REG_ERROR:", error.response?.data || error.message);
      const serverMessage = error.response?.data?.message || "NETWORK_ERROR";

      Alert.alert(
        "REGISTRATION_FAILED",
        Array.isArray(serverMessage)
          ? serverMessage[0].toUpperCase()
          : serverMessage.toUpperCase(),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        bounces={false}
      >
        <View style={styles.background}>
          <View style={styles.header}>
            <Text style={styles.logoText}>
              NEW <Text style={{ color: CYBER_THEME.primary }}>USER</Text>
            </Text>
            <Text style={styles.subtitle}>CREATE_NEW_IDENTITY_ON_ePRX_UV4</Text>
          </View>

          <View style={styles.glassCard}>
            <Text style={styles.label}>USERNAME</Text>
            <TextInput
              style={styles.input}
              placeholder="CYBER_PUNK_01"
              placeholderTextColor="#444"
              value={username}
              onChangeText={setusername}
              autoCapitalize="none"
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>FIRST_NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="JOHN"
                  placeholderTextColor="#444"
                  value={firstName}
                  onChangeText={setfirstname}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>LAST_NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DOE"
                  placeholderTextColor="#444"
                  value={lastName}
                  onChangeText={setlastName}
                />
              </View>
            </View>

            <Text style={styles.label}>EMAIL_ADDRESS</Text>
            <TextInput
              style={styles.input}
              placeholder="USER@SYSTEM.IO"
              placeholderTextColor="#444"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>MOBILE_NODE</Text>
            <TextInput
              style={styles.input}
              placeholder="+63 9XX XXX XXXX"
              placeholderTextColor="#444"
              value={mobile}
              onChangeText={setmobile}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>ENCRYPTION_KEY</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#444"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Pressable
              onPress={handleRegister}
              disabled={isLoading}
              style={[styles.button, isLoading && { opacity: 0.5 }]}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "UPLOADING..." : "EXECUTE_REGISTRATION"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              style={styles.secondaryLink}
            >
              <Text style={styles.secondaryText}>
                [BACK_TO_LOGIN_INTERFACE]
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  background: {
    flex: 1,
    backgroundColor: CYBER_THEME.background,
    padding: 25,
    paddingTop: 60,
  },
  header: { backgroundColor: "transparent", marginBottom: 30 },
  logoText: { fontSize: 36, fontWeight: "900", color: "#fff" },
  subtitle: {
    color: CYBER_THEME.primary,
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 5,
  },
  glassCard: {
    backgroundColor: CYBER_THEME.card,
    padding: 25,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 0, 255, 0.2)",
  },
  label: { color: "#666", fontSize: 10, marginBottom: 8 },
  input: {
    backgroundColor: "#000",
    color: CYBER_THEME.primary,
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#222",
  },
  button: {
    backgroundColor: CYBER_THEME.primary,
    padding: 18,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#000", fontWeight: "900" },
  secondaryLink: {
    marginTop: 20,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  secondaryText: { color: "#666", fontSize: 11 },
});
