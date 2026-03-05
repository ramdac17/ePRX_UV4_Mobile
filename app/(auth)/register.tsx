import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  View, // Use standard View for layout stability
  Text, // Use standard Text for layout stability
} from "react-native";
import { CYBER_THEME } from "@/constants/Colors";
import { useRouter } from "expo-router";
import api from "@/utils/api";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [username, setusername] = useState("");
  const [firstName, setfirstname] = useState("");
  const [lastName, setlastName] = useState("");
  const [mobile, setmobile] = useState("");
  const [password, setPassword] = useState("");

  // Security States
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState("");
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

  const handleRegister = async () => {
    if (!email || !password || !username || !firstName || !lastName) {
      return Alert.alert("REQUIRED", "ALL_FIELDS_MUST_BE_FILLED");
    }

    setIsLoading(true);
    try {
      const registrationData = {
        email: email.toLowerCase().trim(),
        password,
        username: username.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        mobile: mobile.trim(),
      };

      await api.post("/auth/register", registrationData);
      setIsVerifying(true);
      setTimer(60);
      setOtpCode("");

      Alert.alert(
        "VERIFICATION_SENT",
        "SECURITY_CODE_ISSUED. YOU_HAVE_60_SECONDS_TO_ACTIVATE.",
      );
    } catch (error: any) {
      const msg = error.response?.data?.message || "REGISTRATION_FAILED";
      Alert.alert(
        "ERROR",
        Array.isArray(msg) ? msg[0].toUpperCase() : msg.toUpperCase(),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6)
      return Alert.alert("INVALID", "ENTER_6_DIGIT_CODE");

    setIsLoading(true);
    try {
      await api.post("/auth/verify-otp", {
        email: email.toLowerCase().trim(),
        otp: otpCode,
      });
      Alert.alert("SUCCESS", "IDENTITY_VERIFIED: ACCESS_GRANTED");
      router.replace("/(auth)/login");
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || "INVALID_OR_EXPIRED_CODE";
      Alert.alert("VERIFICATION_FAILED", errorMsg.toUpperCase());
      if (errorMsg.toLowerCase().includes("expired")) setOtpCode("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: CYBER_THEME.background }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        bounces={false}
      >
        <View style={styles.background}>
          <View style={styles.header}>
            <Text style={styles.logoText}>
              {isVerifying ? "VERIFY" : "NEW"}{" "}
              <Text style={{ color: CYBER_THEME.primary }}>
                {isVerifying ? "OTP" : "USER"}
              </Text>
            </Text>
            <Text style={styles.subtitle}>
              {isVerifying
                ? "ENTER_SECURITY_TOKEN_BEFORE_EXPIRY"
                : "CREATE NEW IDENTITY ON ePRX UV1"}
            </Text>
          </View>

          <View style={styles.glassCard}>
            {!isVerifying ? (
              <>
                <Text style={styles.label}>USERNAME</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setusername}
                  autoCapitalize="none"
                  placeholder="OPERATIVE_TAG"
                  placeholderTextColor="#333"
                />
                {/* 🟢 FIXED ROW: Explicit background for children container */}
                <View style={styles.nameRow}>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>FIRST NAME</Text>
                    <TextInput
                      style={styles.input}
                      value={firstName}
                      onChangeText={setfirstname}
                      placeholder="NAME"
                      placeholderTextColor="#333"
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>LAST NAME</Text>
                    <TextInput
                      style={styles.input}
                      value={lastName}
                      onChangeText={setlastName}
                      placeholder="SURNAME"
                      placeholderTextColor="#333"
                    />
                  </View>
                </View>

                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Text style={styles.label}>PASSWORD</Text>
                <TextInput
                  style={styles.input}
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
                    {isLoading ? "UPLOADING..." : "REGISTER"}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.timerContainer}>
                  <Text
                    style={[
                      styles.timerText,
                      timer < 10 && { color: "#ff4444" },
                    ]}
                  >
                    {timer > 0
                      ? `00:${timer < 10 ? `0${timer}` : timer}`
                      : "TOKEN_EXPIRED"}
                  </Text>
                </View>

                <Text style={styles.label}>ENTER 6-DIGIT CODE</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.otpInput,
                    timer === 0 && styles.inputDisabled,
                  ]}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="000000"
                  placeholderTextColor="#333"
                  editable={timer > 0}
                />

                <Pressable
                  onPress={handleVerifyOTP}
                  disabled={isLoading || timer === 0}
                  style={[
                    styles.button,
                    (isLoading || timer === 0) && { opacity: 0.5 },
                  ]}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? "VERIFYING..." : "ACTIVATE IDENTITY"}
                  </Text>
                </Pressable>

                <Pressable
                  disabled={timer > 0 || isLoading}
                  onPress={handleRegister}
                  style={styles.secondaryLink}
                >
                  <Text
                    style={[
                      styles.secondaryText,
                      timer === 0 && {
                        color: CYBER_THEME.primary,
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {timer > 0
                      ? `WAITING FOR SYSTEM... (${timer}S)`
                      : "RESEND NEW SECURITY CODE"}
                  </Text>
                </Pressable>
              </>
            )}

            <Pressable
              onPress={() =>
                isVerifying ? setIsVerifying(false) : router.back()
              }
              style={styles.secondaryLink}
            >
              <Text style={styles.secondaryText}>BACK</Text>
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
  header: { marginBottom: 30 },
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
    borderColor: "rgba(212, 255, 0, 0.2)",
  },
  nameRow: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "transparent", // 🟢 Forces transparency on the container
  },
  flex1: { flex: 1, backgroundColor: "transparent" },
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
  inputDisabled: { borderColor: "#441111", color: "#666" },
  otpInput: {
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: "bold",
  },
  timerContainer: { alignItems: "center", marginBottom: 20 },
  timerText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 20,
    color: CYBER_THEME.primary,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: CYBER_THEME.primary,
    padding: 18,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#000", fontWeight: "900" },
  secondaryLink: { marginTop: 20, alignItems: "center" },
  secondaryText: { color: "#666", fontSize: 11 },
});
