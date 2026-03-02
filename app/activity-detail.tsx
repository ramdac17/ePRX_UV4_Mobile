import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import MapView, { Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "@/utils/api";
import { CYBER_THEME } from "@/constants/Colors";
import { ChevronLeft, Zap, Ruler, Clock } from "lucide-react-native";

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

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={CYBER_THEME.primary} size="large" />
      </View>
    );
  }

  if (!activity)
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: "#fff" }}>MISSION_DATA_NOT_FOUND</Text>
      </View>
    );

  // Safely map coordinates
  const mapPoints = (activity.coordinates || []).map((p: any) => ({
    latitude: parseFloat(p.latitude),
    longitude: parseFloat(p.longitude),
  }));

  const initialRegion =
    mapPoints.length > 0
      ? {
          latitude: mapPoints[0].latitude,
          longitude: mapPoints[0].longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }
      : null;

  return (
    <View style={styles.container}>
      {/* 🗺️ MAP LAYER */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={mapStyle} // Applying dark cyber theme to map
        initialRegion={initialRegion || undefined}
      >
        {mapPoints.length > 0 && (
          <Polyline
            coordinates={mapPoints}
            strokeColor={CYBER_THEME.primary}
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* ⬅️ BACK BUTTON */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ChevronLeft color={CYBER_THEME.primary} size={28} />
      </TouchableOpacity>

      {/* 📊 DATA OVERLAY */}
      <View style={styles.statsOverlay}>
        <Text style={styles.missionTitle}>
          {activity.title || "MISSION_COMPLETE"}
        </Text>
        <View style={styles.row}>
          <View style={styles.statBox}>
            <Ruler size={16} color={CYBER_THEME.primary} />
            <Text style={styles.statValue}>
              {parseFloat(activity.distance).toFixed(2)}km
            </Text>
          </View>
          <View style={styles.statBox}>
            <Clock size={16} color={CYBER_THEME.primary} />
            <Text style={styles.statValue}>
              {Math.floor(activity.duration / 60)}m
            </Text>
          </View>
          <View style={styles.statBox}>
            <Zap size={16} color={CYBER_THEME.primary} />
            <Text style={styles.statValue}>{activity.pace || "0:00"}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// Minimalist Dark Map Style
const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#383838" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { justifyContent: "center", alignItems: "center" },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 25,
    padding: 8,
    borderWidth: 1,
    borderColor: CYBER_THEME.primary,
  },
  statsOverlay: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "rgba(5, 5, 5, 0.9)",
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  missionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 15,
    letterSpacing: 1,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  statBox: { flexDirection: "row", alignItems: "center", gap: 6 },
  statValue: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
