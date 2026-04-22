import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { CYBER_THEME } from "@/constants/Colors";
import { User, Camera, LogOut, Lock, ChevronRight } from "lucide-react-native";
import { removeToken } from "@/utils/authStorage";
import { useRouter } from "expo-router";
import api from "@/utils/api";
import { getToken } from "@/utils/authStorage"; // Make sure to import this for direct token access in the upload function

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  // 🛰️ ePRX_UV1_UPLINK_CONFIG
  const BASE_URL = api.defaults.baseURL?.replace("/api", "") || "";

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/auth/profile");
      setUser(res.data);
    } catch (e) {
      console.error("🔴 PROFILE_SYNC_ERROR:", e);
    }
  };

  /**
   * 🖼️ HYBRID_IMAGE_RESOLVER
   * Handles Cloudinary (HTTPS) vs Local Legacy Uploads
   */
  const getAvatarSource = () => {
    if (!user?.image) return null;

    // If it's a Cloudinary URL, use it directly
    if (user.image.startsWith("http")) {
      return { uri: user.image };
    }

    // Fallback for legacy local files
    const cleanPath = user.image.startsWith("/")
      ? user.image
      : `/${user.image}`;
    return { uri: `${BASE_URL}${cleanPath}?t=${new Date().getTime()}` };
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("PERMISSION_DENIED", "Access to gallery required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      const asset = result.assets[0];

      // 🔍 DEBUG_LOGS: Let's see what the hardware is giving us

      console.log("📂 RAW_ASSET_URI:", asset.uri);
      console.log("📂 ASSET_MIME_TYPE:", asset.type || "unknown");
      console.log("📂 ASSET_FILE_NAME:", asset.fileName || "unknown");

      const uri = asset.uri;
      const fileExtension = uri.split(".").pop() || "jpeg";
      const fileName = `avatar_${Date.now()}.${fileExtension}`;
      const fileType = `image/${fileExtension === "jpg" ? "jpeg" : fileExtension}`;

      const formData = new FormData();

      // 🛠️ THE REACT NATIVE ANDROID FIX
      // We wrap this in an object that React Native's fetch/axios
      // recognizes as a "File" to be converted into a multi-part stream.

      const filePayload = {
        uri: uri, // Keep the file:/// for Android
        name: fileName,
        type: fileType,
      };

      console.log("🛰️ FINAL_UPLINK_URI:", filePayload);
      formData.append("file", filePayload as any);

      try {
        console.log("📡 TESTING_CONNECTION_TO:", api.defaults.baseURL);
        await api.get("/auth/test-cloudinary");
        console.log("✅ SERVER_REACHABLE");
      } catch (connError: any) {
        console.error("❌ SERVER_UNREACHABLE:", connError.message);
        Alert.alert("OFFLINE", "The app cannot communicate with the server.");
        setUploading(false);
        return;
      }

      try {
        // 1. Get the token directly from your storage utility
        // (Don't rely on the axios defaults, it's safer to pull fresh)

        const token = await getToken();

        if (!token) {
          Alert.alert("SESSION_EXPIRED", "Please log in again.");
          return;
        }

        // 2. Use Native Fetch with clean headers
        const response = await fetch(
          `${api.defaults.baseURL}/auth/upload-avatar`,
          {
            method: "POST",
            body: formData,
            headers: {
              Accept: "application/json",
              // Ensure 'Bearer ' is prefixed correctly
              Authorization: `Bearer ${token.trim()}`,
            },
          },
        );

        const result = await response.json();

        if (response.status === 401) {
          throw new Error("SESSION_INVALID_OR_EXPIRED");
        }

        if (!response.ok) {
          throw new Error(result.message || "UPLINK_FAILED");
        }

        await fetchProfile();
        Alert.alert("SUCCESS", "IDENTITY_IMAGE_SYNCED_TO_CLOUD");
      } catch (uploadError: any) {
        console.error("🔴 UPLOAD_ERROR:", uploadError.message);
        Alert.alert("UPLOAD_FAILED", uploadError.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert("TERMINATE_SESSION", "Confirm logout protocol?", [
      { text: "CANCEL", style: "cancel" },
      {
        text: "CONFIRM",
        style: "destructive",
        onPress: async () => {
          router.replace("/login");
          await removeToken();
          delete api.defaults.headers.common["Authorization"];
          setUser(null);
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>ELITE PROFILE</Text>
      </View>

      <View style={styles.avatarSection}>
        <TouchableOpacity
          onPress={pickImage}
          style={styles.avatarWrapper}
          disabled={uploading}
        >
          {user?.image ? (
            <Image
              source={getAvatarSource() || { uri: "" }}
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
          {user
            ? `${user.firstName || ""} ${user.lastName || ""}`.toUpperCase()
            : "SYNCING..."}
        </Text>
        <Text style={styles.userEmail}>
          {user?.email?.toLowerCase() || "STATION_AGENT"}
        </Text>
      </View>

      <View style={styles.menuSection}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            Alert.alert("RESET", "PASSWORD_RESET_PROTOCOL_INITIATED")
          }
        >
          <View style={styles.menuLabel}>
            <Lock size={18} color={CYBER_THEME.primary} />
            <Text style={styles.menuText}>RESET PASSWORD</Text>
          </View>
          <ChevronRight size={16} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { borderBottomWidth: 0 }]}
          onPress={handleLogout}
        >
          <View style={styles.menuLabel}>
            <LogOut size={18} color="#ff4444" />
            <Text style={[styles.menuText, { color: "#ff4444" }]}>LOGOUT</Text>
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
