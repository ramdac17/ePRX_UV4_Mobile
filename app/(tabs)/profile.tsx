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

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const BASE_URL = api.defaults.baseURL?.replace("/api", "") || "";

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!api.defaults.headers.common["Authorization"]) return;
    try {
      const res = await api.get("/auth/profile");
      setUser(res.data);
    } catch (e) {
      console.error("PROFILE_SYNC_ERROR", e);
    }
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
      quality: 0.2,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      const { uri } = result.assets[0];
      const formData = new FormData();
      // @ts-ignore
      formData.append("file", { uri, name: "avatar.jpg", type: "image/jpeg" });

      try {
        await api.post("/auth/upload-avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 30000,
        });
        await fetchProfile();
        Alert.alert("SUCCESS", "IDENTITY_IMAGE_UPDATED");
      } catch (e: any) {
        Alert.alert("ERROR", "UPLINK_FAILED: Server rejected payload.");
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
          // 🚀 Sequence: Redirect -> Wipe -> Clear
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
              source={{
                uri: `${BASE_URL}${user.image.startsWith("/") ? "" : "/"}${user.image}?t=${new Date().getTime()}`,
              }}
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
          {user?.firstName?.toUpperCase()} {user?.lastName?.toUpperCase()}
        </Text>
        <Text style={styles.userEmail}>{user?.email?.toLowerCase()}</Text>
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
