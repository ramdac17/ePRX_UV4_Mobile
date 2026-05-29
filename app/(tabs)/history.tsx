import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import api from "@/utils/api";
import { CYBER_THEME } from "@/constants/Colors";
import {
  Activity,
  ChevronRight,
  Inbox,
  Map as MapIcon,
  ArrowLeft,
} from "lucide-react-native";
import { useRouter } from "expo-router";

// Target Production Infrastructure Server Routing
const MAIN_PRX_WEBSITE_URL =
  "https://eprxuv1-monorepo-production.up.railway.app";
const GOOGLE_MAPS_API_KEY = "AIzaSyAPJpbH9IsUJv_mJqwpTUOEPTaiePTYyYM";

interface ActivityItem {
  id: string | number;
  title?: string;
  coordinates?: any;
  mapImage?: string;
  mapImageUrl?: string;
  shareImageUrl?: string;
  distance?: string | number;
  pace?: string;
  duration?: number;
  createdAt?: string;
}

/**
 * Strips down path segments to guarantee small URL footprints inside list cards
 */
const downsampleCoordinates = (coords: any[], maxPoints = 20) => {
  if (!coords || coords.length <= maxPoints) return coords;

  const downsampled = [coords[0]];
  const step = (coords.length - 2) / (maxPoints - 2);

  for (let i = 1; i < maxPoints - 1; i++) {
    const index = Math.round(i * step);
    if (coords[index]) downsampled.push(coords[index]);
  }

  downsampled.push(coords[coords.length - 1]);
  return downsampled;
};

const buildStaticThumbnailUrl = (coords: any) => {
  if (!coords) return null;

  let parsed = coords;
  if (typeof coords === "string") {
    try {
      parsed = JSON.parse(coords);
    } catch {
      return null;
    }
  }

  if (!Array.isArray(parsed) || parsed.length === 0) return null;
  const valid = parsed.filter((p) => p && p.latitude && p.longitude);
  if (valid.length === 0) return null;

  // Use tighter constraints for miniature rows (15 steps maximum)
  const optimized = downsampleCoordinates(valid, 15);
  const pathString = optimized
    .map((p) => `${p.latitude},${p.longitude}`)
    .join("|");

  const base = "https://maps.googleapis.com/maps/api/staticmap";
  const styles = [
    "element:geometry|color:0x212121",
    "element:labels|visibility:off",
    "feature:water|color:0x000000",
    "feature:road|element:geometry.fill|color:0x2c2c2c",
  ]
    .map((s) => `&style=${encodeURIComponent(s)}`)
    .join("");

  const pathParam = encodeURIComponent(
    `color:0x00fff2ff|weight:4|${pathString}`,
  );
  return `${base}?size=300x150&scale=2&maptype=roadmap&key=${GOOGLE_MAPS_API_KEY}&path=${pathParam}${styles}`;
};

export default function ActivityHistoryScreen() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadHistory = async () => {
    try {
      const res = await api.get("/activities");
      setActivities(res.data);
    } catch (error) {
      console.error("🔴 HISTORY_FETCH_ERROR", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistory();
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ActivityItem }) => {
      const missionDate = item.createdAt
        ? new Date(item.createdAt)
        : new Date();

      const handlePress = () => {
        if (!item.id) return;
        router.push(`/activity-detail/${item.id}`);
      };

      const mapImageUri = (() => {
        const dynamicStaticMap = buildStaticThumbnailUrl(item.coordinates);
        if (dynamicStaticMap) return dynamicStaticMap;

        const rawFallback =
          item.mapImage || item.mapImageUrl || item.shareImageUrl;
        if (rawFallback) {
          if (rawFallback.startsWith("http")) return rawFallback;
          const cleanPath = rawFallback.startsWith("/")
            ? rawFallback
            : `/${rawFallback}`;
          return `${MAIN_PRX_WEBSITE_URL}${cleanPath}`;
        }
        return null;
      })();

      return (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={handlePress}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.dateText}>
                {missionDate.toLocaleDateString()} at{" "}
                {missionDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </Text>
              <Text style={styles.titleText}>
                {item.title || "UNNAMED_MISSION"}
              </Text>
            </View>
          </View>

          <View style={styles.mapContainer}>
            {mapImageUri ? (
              <Image
                source={{ uri: mapImageUri }}
                style={styles.mapThumbnail}
                resizeMode="cover"
                onError={(e) =>
                  console.log("🔴 MINI_MAP_RENDER_FAIL:", e.nativeEvent.error)
                }
              />
            ) : (
              <View style={styles.mapFallback}>
                <MapIcon color="#222" size={24} />
                <Text style={styles.fallbackText}>NO STATIC MAP AVAILABLE</Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>DIST</Text>
              <Text style={styles.statValue}>
                {parseFloat(String(item.distance || "0")).toFixed(2)}km
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>PACE</Text>
              <Text style={styles.statValue}>{item.pace || "0:00"}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>TIME</Text>
              <Text style={styles.statValue}>
                {item.duration ? Math.floor(item.duration / 60) : 0}m
              </Text>
            </View>
            <ChevronRight color={CYBER_THEME.primary} size={18} />
          </View>
        </TouchableOpacity>
      );
    },
    [router],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft color={CYBER_THEME.primary} size={20} />
        </TouchableOpacity>
        <Activity color={CYBER_THEME.primary} size={20} />
        <Text style={styles.headerTitle}>HISTORY LOGS</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={CYBER_THEME.primary} size="large" />
          <Text style={styles.loadingText}>FETCHING LOGS...</Text>
        </View>
      ) : activities.length === 0 ? (
        <View style={styles.emptyState}>
          <Inbox color="#222" size={48} style={{ marginBottom: 10 }} />
          <Text style={styles.emptyText}>NO DATA FOUND. START TRAINING.</Text>
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={7}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={CYBER_THEME.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  backButton: {
    marginRight: 15,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
    marginLeft: 10,
  },
  list: { flex: 1 },
  listContent: {
    padding: 20,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dateText: { color: "#444", fontSize: 10, fontWeight: "bold" },
  titleText: {
    color: CYBER_THEME.primary,
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 2,
    textTransform: "uppercase",
  },
  mapContainer: {
    width: "100%",
    height: 120,
    backgroundColor: "#050505",
    borderRadius: 6,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#151515",
  },
  mapThumbnail: {
    width: "100%",
    height: "100%",
  },
  mapFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  fallbackText: {
    color: "#222",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stat: { alignItems: "flex-start" },
  statLabel: {
    color: "#666",
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 2,
  },
  statValue: { color: "#fff", fontSize: 15, fontWeight: "900" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    color: CYBER_THEME.primary,
    marginTop: 10,
    fontSize: 11,
    fontWeight: "bold",
  },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#333", fontWeight: "bold", fontSize: 12 },
});
