import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { getToken } from "@/utils/authStorage";
import { CYBER_THEME } from "@/constants/Colors";

export default function EntryPoint() {
  const router = useRouter();

  useEffect(() => {
    const initializeApp = async () => {
      // 🛡️ AUTH_STRATEGY: Check for existing session
      const token = await getToken();

      if (token) {
        // Operative Validated -> Redirect to Dashboard
        router.replace("/(tabs)");
      } else {
        // No Session -> Redirect to Login
        router.replace("/login");
      }
    };

    initializeApp();
  }, []);

  // Simple, themed loader while the redirect logic processes
  return (
    <View style={styles.container}>
      <ActivityIndicator color={CYBER_THEME.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
});
