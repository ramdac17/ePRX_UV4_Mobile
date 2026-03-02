import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator, // Added for feedback
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { CYBER_THEME } from "@/constants/Colors";
import { User, Camera, LogOut, Lock, ChevronRight } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import api from "@/utils/api";

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false); // New state
  const router = useRouter();

  const API_URL = process.env.EXPO_PUBLIC_API_URL || "";
  const BASE_IMAGE_URL = API_URL.replace("/api", "");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/auth/profile");
      setUser(res.data);
    } catch (e) {
      console.error("PROFILE_SYNC_ERROR", e);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Updated to use enum
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setUploading(true);
      const uri = result.assets[0].uri;

      // Fix for some Android/iOS differences in naming
      const fileName = uri.split("/").pop() || "avatar.jpg";

      const formData = new FormData();
      formData.append("file", {
        uri,
        name: fileName,
        type: "image/jpeg",
      } as any);

      try {
        await api.post("/auth/upload-avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        await fetchProfile(); // Wait for profile refresh
        Alert.alert("SUCCESS", "IDENTITY_IMAGE_UPDATED");
      } catch (e) {
        Alert.alert("ERROR", "UPLINK_FAILED");
        console.log("UPLOAD_ERROR", e);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      console.log("INITIATING_TERMINATION_SEQUENCE...");

      // 1. SURGICAL REMOVAL (Don't use .clear() here)
      // Only remove the specific keys you created
      await AsyncStorage.removeItem("userToken");

      // 2. CLEAR API STATE
      delete api.defaults.headers.common["Authorization"];
      if (setUser) setUser(null);

      // 3. NAVIGATION OVERRIDE
      // We use a timeout of 0 to let the state settle before switching screens
      setTimeout(() => {
        router.replace("/login");
      }, 0);
    } catch (e) {
      // If removeItem fails, it's usually because it's already gone
      console.error("LOGOUT_FAILURE_RECOVERING...", e);
      router.replace("/login"); // Navigate anyway
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>OPERATIVE_PROFILE</Text>
      </View>

      {/* AVATAR SECTION */}
      <View style={styles.avatarSection}>
        <TouchableOpacity
          onPress={pickImage}
          style={styles.avatarWrapper}
          disabled={uploading} // Prevent double uploads
        >
          {user?.image ? (
            <Image
              source={{
                uri: `${BASE_IMAGE_URL}${user.image}?t=${new Date().getTime()}`,
              }} // Cache busting
              style={styles.avatar}
            />
          ) : (
            <View style={styles.placeholder}>
              <User size={40} color={CYBER_THEME.primary} />
            </View>
          )}

          <View style={styles.cameraIcon}>
            {uploading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Camera size={16} color="#000" />
            )}
          </View>
        </TouchableOpacity>

        <Text style={styles.userName}>
          {user?.firstName?.toUpperCase() || "UNKNOWN"}_
          {user?.lastName?.toUpperCase() || "OPERATIVE"}
        </Text>
        <Text style={styles.userEmail}>
          {user?.email?.toLowerCase() || "no_email_found"}
        </Text>
      </View>

      {/* ACTIONS SECTION */}
      <View style={styles.menuSection}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Alert.alert("RESET", "PASSWORD_RESET_PROTOCOL_INITIATED")
          }
        >
          <View style={styles.menuLabel}>
            <Lock size={18} color={CYBER_THEME.primary} />
            <Text style={styles.menuText}>RESET_PASSWORD</Text>
          </View>
          <ChevronRight size={16} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { borderBottomWidth: 0 }]}
          onPress={handleLogout}
        >
          <View style={styles.menuLabel}>
            <LogOut size={18} color="#ff4444" />
            <Text style={[styles.menuText, { color: "#ff4444" }]}>
              TERMINATE_SESSION
            </Text>
          </View>
          <ChevronRight size={16} color="#333" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20, paddingTop: 60 },
  header: { marginBottom: 30 },
  title: {
    color: CYBER_THEME.primary,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
  },
  avatarSection: { alignItems: "center", marginBottom: 40 },
  avatarWrapper: { position: "relative", marginBottom: 15 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: CYBER_THEME.primary,
  },
  placeholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: CYBER_THEME.primary,
    padding: 8,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  userEmail: { color: "#666", fontSize: 12, marginTop: 5 },
  menuSection: {
    backgroundColor: "#0a0a0a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#222",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  menuLabel: { flexDirection: "row", alignItems: "center", gap: 15 },
  menuText: { color: "#ccc", fontSize: 12, fontWeight: "bold" },
});
