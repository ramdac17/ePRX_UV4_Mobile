import React, { useState, useEffect } from "react";
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
import api from "@/utils/api";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & Reset
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const router = useRouter();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleRequestOTP = async () => {
    if (!email) return Alert.alert("REQUIRED", "EMAIL_IS_MANDATORY");

    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password", {
        email: email.toLowerCase().trim(),
      });
      setStep(2);
      setTimer(60);
      Alert.alert("RECOVERY_SENT", "CHECK_YOUR_UPLINK_FOR_THE_SECURITY_CODE");
    } catch (error: any) {
      Alert.alert("RECOVERY_FAILED", "IDENTITY_NOT_FOUND_IN_CORE_SYSTEM");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (otp.length !== 6 || !newPassword) {
      return Alert.alert("REQUIRED", "ENTER_6_DIGIT_CODE_AND_NEW_PASSWORD");
    }

    setIsLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: email.toLowerCase().trim(),
        otp,
        newPassword,
      });
      Alert.alert("SUCCESS", "PASSWORD_REGENERATED_SUCCESSFULLY");
      router.replace("/(auth)/login");
    } catch (error: any) {
      Alert.alert("RECOVERY_FAILED", "TOKEN_EXPIRED_OR_INVALID");
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
              IDENTITY <Text style={{ color: "#FF0055" }}>RECOVERY</Text>
            </Text>
            <Text style={styles.subtitle}>
              INITIATING CREDENTIAL REGENERATION
            </Text>
          </View>

          <View
            style={[styles.glassCard, { borderColor: "rgba(255, 0, 85, 0.3)" }]}
          >
            {step === 1 ? (
              <>
                <Text style={styles.label}>REGISTERED EMAIL</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="USER@SERVICE.COM"
                  placeholderTextColor="#333"
                />
                <Pressable
                  onPress={handleRequestOTP}
                  disabled={isLoading}
                  style={[styles.button, { backgroundColor: "#FF0055" }]}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? "TRANSMITTING..." : "SEND_RECOVERY_CODE"}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.timerContainer}>
                  <Text style={[styles.timerText, { color: "#FF0055" }]}>
                    {timer > 0
                      ? `00:${timer < 10 ? `0${timer}` : timer}`
                      : "TOKEN_EXPIRED"}
                  </Text>
                </View>

                <Text style={styles.label}>6-DIGIT SECURITY TOKEN</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="000000"
                />

                <Text style={styles.label}>
                  NEW ACCESS CREDENTIAL (PASSWORD)
                </Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor="#333"
                />

                <Pressable
                  onPress={handleResetPassword}
                  disabled={isLoading || timer === 0}
                  style={[styles.button, { backgroundColor: "#FF0055" }]}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? "SYNCING..." : "REGENERATE_PASSWORD"}
                  </Text>
                </Pressable>

                <Pressable
                  disabled={timer > 0}
                  onPress={handleRequestOTP}
                  style={styles.secondaryLink}
                >
                  <Text
                    style={[
                      styles.secondaryText,
                      timer === 0 && { color: "#FF0055" },
                    ]}
                  >
                    {timer > 0
                      ? `RESEND AVAILABLE IN ${timer}S`
                      : "REQUEST NEW TOKEN"}
                  </Text>
                </Pressable>
              </>
            )}

            <Pressable
              onPress={() => router.back()}
              style={styles.secondaryLink}
            >
              <Text style={styles.secondaryText}>ABORT RECOVERY</Text>
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
    paddingTop: 80,
  },
  header: { marginBottom: 30 },
  logoText: { fontSize: 32, fontWeight: "900", color: "#fff" },
  subtitle: { color: "#666", fontSize: 10, letterSpacing: 1 },
  glassCard: {
    backgroundColor: CYBER_THEME.card,
    padding: 25,
    borderRadius: 15,
    borderWidth: 1,
  },
  label: { color: "#666", fontSize: 9, marginBottom: 8, letterSpacing: 1 },
  input: {
    backgroundColor: "#000",
    color: "#fff",
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#222",
  },
  otpInput: {
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: "bold",
    color: "#FF0055",
  },
  timerContainer: { alignItems: "center", marginBottom: 15 },
  timerText: { fontSize: 18, fontWeight: "bold" },
  button: { padding: 18, borderRadius: 5, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontWeight: "900", letterSpacing: 1 },
  secondaryLink: { marginTop: 20, alignItems: "center" },
  secondaryText: { color: "#444", fontSize: 11 },
});
