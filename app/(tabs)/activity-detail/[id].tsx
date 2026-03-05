import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Share,
  Linking, // 🚀 Added for direct app opening
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

const { width } = Dimensions.get("window");
const GOOGLE_MAPS_API_KEY = "AIzaSyAPJpbH9IsUJv_mJqwpTUOEPTaiePTYyYM";

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/activities/${id}`);
        setActivity(res.data);
      } catch (error) {
        console.error("🔴 DETAIL_FETCH_ERROR:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  const staticMapUrl = useMemo(() => {
    if (!activity?.coordinates || activity.coordinates.length === 0)
      return null;
    const coords = activity.coordinates;
    const pathString = coords
      .map((p: any) => `${p.latitude},${p.longitude}`)
      .join("|");
    const baseUrl = "https://maps.googleapis.com/maps/api/staticmap";
    const styles = [
      "element:geometry|color:0x212121",
      "feature:road|element:geometry|color:0x3c3c3c",
    ]
      .map((s) => `style=${s}`)
      .join("&");

    return `${baseUrl}?size=600x600&scale=2&maptype=roadmap&markers=color:green|label:S|${coords[0].latitude},${coords[0].longitude}&markers=color:red|label:F|${coords[coords.length - 1].latitude},${coords[coords.length - 1].longitude}&path=color:0x00fff2ff|weight:5|${pathString}&key=${GOOGLE_MAPS_API_KEY}&${styles}`;
  }, [activity]);

  // 🌍 OPTION 1: Standard General Share (WhatsApp, Instagram, etc.)
  const onGeneralShare = async () => {
    try {
      await Share.share({
        message: `Mission Log: ${parseFloat(activity?.distance || "0").toFixed(2)} KM via ePRX UV1\n${staticMapUrl}`,
      });
    } catch (e) {
      Alert.alert("SHARE_ERROR");
    }
  };

  // 🔵 OPTION 2: Direct Facebook Uplink (Guaranteed to work if FB is installed)
  const onFacebookShare = () => {
    if (!staticMapUrl) {
      Alert.alert("COMM_ERROR", "Map URL not available.");
      return;
    }
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(staticMapUrl)}`;
    Linking.openURL(fbUrl).catch(() => {
      Alert.alert("COMM_ERROR", "Facebook is not responding or not installed.");
    });
  };

  if (loading)
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={CYBER_THEME.primary} />
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper}>
        {staticMapUrl && (
          <Image
            source={{ uri: staticMapUrl }}
            style={StyleSheet.absoluteFillObject}
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
            {/* Standard Share */}
            <TouchableOpacity onPress={onGeneralShare} style={styles.shareIcon}>
              <Share2 color={CYBER_THEME.primary} size={22} />
            </TouchableOpacity>
            {/* Direct Facebook Share */}
            <TouchableOpacity
              onPress={onFacebookShare}
              style={styles.shareIcon}
            >
              <Facebook color="#1877F2" size={22} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <StatBox
            icon={<Ruler size={14} color={CYBER_THEME.primary} />}
            label="DIST"
            value={`${parseFloat(activity?.distance || "0").toFixed(2)} KM`}
          />
          <StatBox
            icon={<Clock size={14} color={CYBER_THEME.primary} />}
            label="TIME"
            value={`${Math.floor((activity?.duration || 0) / 60)}M`}
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
    width: width,
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
  shareIcon: { padding: 5 },
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
