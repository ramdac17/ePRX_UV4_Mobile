import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "@/utils/api";
import { CYBER_THEME } from "@/constants/Colors";
import {
  ChevronLeft,
  Zap,
  Ruler,
  Clock,
  Share2,
  Facebook,
} from "lucide-react-native";

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
// 🚀 FIXED: Replaced raw Linking with native Share
import Share from "react-native-share";
import { Linking } from "react-native";

const { width } = Dimensions.get("window");

const BACKEND_ROOT = "https://eprxuv1-monorepo-production.up.railway.app/api";
const GOOGLE_MAPS_API_KEY = "AIzaSyAPJpbH9IsUJv_mJqwpTUOEPTaiePTYyYM";

// ===============================
// SAFE HELPERS
// ===============================
const formatDistance = (d: any) => Number(d || 0).toFixed(2);
const formatTime = (d: any) => `${Math.floor((d || 0) / 60)}M`;

const buildStaticMapUrl = (coords: any[]) => {
  if (!coords?.length) return null;
  const start = coords[0];
  const end = coords[coords.length - 1];
  const path = coords.map((p) => `${p.latitude},${p.longitude}`).join("|");
  const base = "https://maps.googleapis.com/maps/api/staticmap";

  // Cyber/Dark Theme Styles
  const styles = [
    "element:geometry|color:0x212121",
    "element:labels.icon|visibility:off",
    "element:labels.text.fill|color:0x757575",
    "element:labels.text.stroke|color:0x212121",
    "feature:administrative|element:geometry|color:0x757575",
    "feature:water|element:geometry|color:0x000000",
    "feature:road|element:geometry.fill|color:0x2c2c2c",
  ]
    .map((s) => `&style=${s}`)
    .join("");

  const params = new URLSearchParams({
    size: "600x600",
    scale: "2",
    maptype: "roadmap",
    key: GOOGLE_MAPS_API_KEY,
    path: `color:0x00fff2ff|weight:5|${path}`, // Neon Cyan path
  });

  // Combine base, params, and the encoded styles
  return `${base}?${params.toString()}${styles}&markers=color:0x00ff00|label:S|${start.latitude},${start.longitude}&markers=color:0x00ffff|label:F|${end.latitude},${end.longitude}`;
};

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/activities/${id}`);
        setActivity(res.data);
      } catch (err) {
        console.error("DETAIL_FETCH_ERROR:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  const staticMapUrl = useMemo(
    () => buildStaticMapUrl(activity?.coordinates),
    [activity],
  );

  // ===============================
  // SHARE IMAGE (Native Share Sheet)
  // ===============================
  const onShareImage = useCallback(async () => {
    try {
      if (!activity?.shareImageUrl) {
        Alert.alert("Standby", "The mission card is still being encrypted.");
        return;
      }

      setSharing(true);
      const fileUri = `${FileSystem.cacheDirectory}share-${activity.id}.png`;
      const downloaded = await FileSystem.downloadAsync(
        activity.shareImageUrl,
        fileUri,
      );

      if (downloaded.status !== 200) throw new Error("Download failed");

      await Sharing.shareAsync(downloaded.uri, { mimeType: "image/png" });
    } catch (err) {
      console.error("SHARE_IMAGE_ERROR:", err);
      Alert.alert("Error", "Failed to retrieve the mission card.");
    } finally {
      setSharing(false);
    }
  }, [activity]);

  // ===============================
  // SHARE LINK (Facebook Native Intent)
  // ===============================
  const onShareLink = useCallback(async () => {
    if (!activity?.id) return;

    const shareUrl = `https://e-prx-uv-4-website.vercel.app/activity/${activity.id}`;

    // Facebook's specific URL scheme for sharing a link
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

    try {
      const supported = await Linking.canOpenURL(fbUrl);

      if (supported) {
        // This will open the FB app directly to the "Create Post" screen
        await Linking.openURL(fbUrl);
      } else {
        // Fallback if they don't have the FB app
        await Linking.openURL(fbUrl); // Will open in mobile browser
      }
    } catch (err) {
      console.error("FB_DIRECT_SHARE_FAILED", err);
      Alert.alert("Connection Error", "Could not reach the Facebook uplink.");
    }
  }, [activity?.id]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={CYBER_THEME.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper}>
        {staticMapUrl && (
          <Image
            source={{ uri: staticMapUrl }}
            style={StyleSheet.absoluteFillObject}
            onError={(e) => console.log("MAP_ERROR:", e.nativeEvent.error)}
          />
        )}
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ChevronLeft color={CYBER_THEME.primary} size={28} />
      </TouchableOpacity>

      <View style={styles.statsOverlay}>
        <View style={styles.headerRow}>
          <Text style={styles.missionTitle}>
            {activity?.title?.toUpperCase() || "MISSION_LOG"}
          </Text>

          <View style={styles.shareRow}>
            <TouchableOpacity
              onPress={onShareImage}
              disabled={sharing}
              style={styles.shareIcon}
            >
              {sharing ? (
                <ActivityIndicator size="small" color={CYBER_THEME.primary} />
              ) : (
                <Share2 color={CYBER_THEME.primary} size={22} />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={onShareLink} style={styles.shareIcon}>
              <Facebook color="#1877F2" size={22} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <StatBox
            icon={<Ruler size={14} color={CYBER_THEME.primary} />}
            label="DIST"
            value={`${formatDistance(activity?.distance)} KM`}
          />
          <StatBox
            icon={<Clock size={14} color={CYBER_THEME.primary} />}
            label="TIME"
            value={formatTime(activity?.duration)}
          />
          <StatBox
            icon={<Zap size={14} color={CYBER_THEME.primary} />}
            label="PACE"
            value={activity?.pace || "0:00"}
          />
        </View>
      </View>
    </View>
  );
}

const StatBox = ({ icon, label, value }: any) => (
  <View style={styles.statItem}>
    {icon}
    <View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { justifyContent: "center", alignItems: "center" },
  mapWrapper: {
    width,
    height: width,
    backgroundColor: "#111",
    marginTop: 60,
  },
  backButton: { position: "absolute", top: 50, left: 20 },
  statsOverlay: { padding: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shareRow: { flexDirection: "row", gap: 20 },
  shareIcon: { padding: 5, minWidth: 32, alignItems: "center" },
  missionTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },
  divider: { height: 1, backgroundColor: "#1a1a1a", marginVertical: 15 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  statItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  statLabel: { color: "#555", fontSize: 8, fontWeight: "900" },
  statValue: { color: "#fff", fontSize: 14, fontWeight: "bold" },
});
