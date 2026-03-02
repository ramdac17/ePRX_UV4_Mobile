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
} from "react-native";
import api from "@/utils/api";
import { CYBER_THEME } from "@/constants/Colors";
import { Activity, ChevronRight, Inbox } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function ActivityHistoryScreen() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadHistory = async () => {
    try {
      const res = await api.get("/activities");
      console.log("📡 HISTORY_DATA_RECEIVED:", res.data.length, "records");
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

  const renderItem = ({ item }: { item: any }) => {
    // Helper to prevent Date crashes
    const missionDate = item.createdAt ? new Date(item.createdAt) : new Date();

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() =>
          router.push({
            pathname: "/activity-detail/[id]",
            params: { id: item.id },
          } as any)
        }
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.dateText}>
              {missionDate.toLocaleDateString()} //{" "}
              {missionDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false, // Keeping it military style for the theme
              })}
            </Text>
            <Text style={styles.titleText}>
              {item.title || "UNNAMED_MISSION"}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>DIST</Text>
            <Text style={styles.statValue}>
              {parseFloat(item.distance || "0").toFixed(2)}km
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
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Activity color={CYBER_THEME.primary} size={20} />
        <Text style={styles.headerTitle}>MISSION_LOGS</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={CYBER_THEME.primary} size="large" />
          <Text style={styles.loadingText}>FETCHING_LOGS...</Text>
        </View>
      ) : activities.length === 0 ? (
        <View style={styles.emptyState}>
          <Inbox color="#222" size={48} style={{ marginBottom: 10 }} />
          <Text style={styles.emptyText}>NO_DATA_FOUND. START_TRAINING.</Text>
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    paddingTop: 40, // More space for SafeArea
    paddingBottom: 15,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
  },
  list: { flex: 1 },
  listContent: {
    padding: 20,
    paddingBottom: 120, // Bottom padding for tab bar clearance
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
