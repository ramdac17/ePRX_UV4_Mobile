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
  ArrowLeft,
  Zap,
  Ruler,
  Clock,
  Share2,
  Facebook,
  Map as MapIcon,
} from "lucide-react-native";

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Linking } from "react-native";

const { width } = Dimensions.get("window");

const MAIN_PRX_WEBSITE_URL =
  "https://eprxuv1-monorepo-production.up.railway.app";
const GOOGLE_MAPS_API_KEY = "AIzaSyAPJpbH9IsUJv_mJqwpTUOEPTaiePTYyYM";

const formatDistance = (d: any) => Number(d || 0).toFixed(2);
const formatTime = (d: any) => `${Math.floor((d || 0) / 60)}M`;

/**
 * Downsamples an array of coordinates to protect Google Static Map URL character length caps (8k limit).
 * Keeps the absolute start and end nodes intact while skipping internal indexes uniformly.
 */
const downsampleCoordinates = (coords: any[], maxPoints = 35) => {
  if (!coords || coords.length <= maxPoints) return coords;

  const downsampled = [coords[0]]; // Always retain exact start
  const step = (coords.length - 2) / (maxPoints - 2);

  for (let i = 1; i < maxPoints - 1; i++) {
    const index = Math.round(i * step);
    if (coords[index]) {
      downsampled.push(coords[index]);
    }
  }

  downsampled.push(coords[coords.length - 1]); // Always retain exact finish
  return downsampled;
};

const buildStaticMapUrl = (coords: any[]) => {
  if (!coords || !Array.isArray(coords) || coords.length === 0) return null;

  // Filter out any garbage or corrupt elements before processing layout geometry
  const validCoords = coords.filter((p) => p && p.latitude && p.longitude);
  if (validCoords.length === 0) return null;

  const start = validCoords[0];
  const end = validCoords[validCoords.length - 1];

  // Downsample internal coordinates to prevent "stream reset: CANCEL" payload caps
  const optimizedCoords = downsampleCoordinates(validCoords, 30);

  // Build coordinate paths safely
  const pathCoordinates = optimizedCoords
    .map((p) => `${p.latitude},${p.longitude}`)
    .join("|");
  const base = "https://maps.googleapis.com/maps/api/staticmap";

  // Cyber Dark Theme Map Styles
  const styles = [
    "element:geometry|color:0x212121",
    "element:labels.icon|visibility:off",
    "element:labels.text.fill|color:0x757575",
    "element:labels.text.stroke|color:0x212121",
    "feature:administrative|element:geometry|color:0x757575",
    "feature:water|element:geometry|color:0x000000",
    "feature:road|element:geometry.fill|color:0x2c2c2c",
  ]
    .map((s) => `&style=${encodeURIComponent(s)}`)
    .join("");

  const pathParam = encodeURIComponent(
    `color:0x00fff2ff|weight:5|${pathCoordinates}`,
  );
  const startMarker = encodeURIComponent(
    `color:0x00ff00|label:S|${start.latitude},${start.longitude}`,
  );
  const endMarker = encodeURIComponent(
    `color:0x00ffff|label:F|${end.latitude},${end.longitude}`,
  );

  const finalUrl = `${base}?size=600x600&scale=2&maptype=roadmap&key=${GOOGLE_MAPS_API_KEY}&path=${pathParam}&markers=${startMarker}&markers=${endMarker}${styles}`;

  return finalUrl;
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
        console.error("🔴 DETAIL FETCH ERROR:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  const parsedCoordinates = useMemo(() => {
    if (!activity) return null;
    if (activity.coordinates) {
      if (typeof activity.coordinates === "string") {
        try {
          return JSON.parse(activity.coordinates);
        } catch {
          return null;
        }
      }
      return activity.coordinates;
    }
    return null;
  }, [activity]);

  const mapImageUri = useMemo(() => {
    if (!activity) return null;

    // 1. Try tracking via coordinates array
    const generatedStaticUrl = buildStaticMapUrl(parsedCoordinates);
    if (generatedStaticUrl) return generatedStaticUrl;

    // 2. Direct schema image asset matching fallbacks
    const rawFallbackUrl =
      activity.shareImageUrl || activity.mapImageUrl || activity.mapImage;

    if (rawFallbackUrl) {
      if (rawFallbackUrl.startsWith("http")) {
        return rawFallbackUrl;
      }
      // Sanitize paths with clean separator validation splits
      const cleanPath = rawFallbackUrl.startsWith("/")
        ? rawFallbackUrl
        : `/${rawFallbackUrl}`;
      return `${MAIN_PRX_WEBSITE_URL}${cleanPath}`;
    }

    return null;
  }, [activity, parsedCoordinates]);

  const onShareImage = useCallback(async () => {
    try {
      if (!mapImageUri) {
        Alert.alert("Standby", "The mission card is still being encrypted.");
        return;
      }

      setSharing(true);
      const fileUri = `${FileSystem.cacheDirectory}share-${activity.id}.png`;
      const downloaded = await FileSystem.downloadAsync(mapImageUri, fileUri);

      if (downloaded.status !== 200) throw new Error("Download failed");

      await Sharing.shareAsync(downloaded.uri, { mimeType: "image/png" });
    } catch (err) {
      console.error("🔴 SHARE IMAGE ERROR:", err);
      Alert.alert("Error", "Failed to retrieve the mission card.");
    } finally {
      setSharing(false);
    }
  }, [activity, mapImageUri]);

  const onShareLink = useCallback(async () => {
    if (!activity?.id) return;

    const shareUrl = `https://e-prx-uv-4-website.vercel.app/activity/${activity.id}`;
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

    try {
      await Linking.openURL(fbUrl);
    } catch (err) {
      console.error("🔴 FB_DIRECT_SHARE_FAILED", err);
      Alert.alert("Connection Error", "Could not reach the Facebook uplink.");
    }
  }, [activity?.id]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={CYBER_THEME.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper}>
        {mapImageUri ? (
          <Image
            source={{ uri: mapImageUri }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            onError={(e) =>
              console.log("🔴 ACTIVE_MAP_RENDER_FAIL:", e.nativeEvent.error)
            }
          />
        ) : (
          <View style={[styles.container, styles.center, { gap: 8 }]}>
            <MapIcon color="#222" size={32} />
            <Text
              style={{
                color: "#333",
                fontSize: 10,
                fontWeight: "bold",
                letterSpacing: 1,
              }}
            >
              MAP_DATA_UNAVAILABLE
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace("/(tabs)/history")}
        activeOpacity={0.7}
      >
        <ArrowLeft color={CYBER_THEME.primary} size={24} />
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
    backgroundColor: "#050505",
    marginTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
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
