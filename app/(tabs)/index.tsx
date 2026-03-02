import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  View,
  Text,
  Dimensions,
  Animated,
  PanResponder,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import api from "@/utils/api";
import { CYBER_THEME } from "@/constants/Colors";
import { useRouter } from "expo-router";
import { User, Activity, Play } from "lucide-react-native";
import { useFocusEffect } from "expo-router";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

export default function TabOneScreen() {
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<string>("SCANNING...");
  const router = useRouter();
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: any[];
  }>({
    labels: ["Log_0", "Log_1", "Log_2", "Log_3", "Log_4", "Log_5", "Log_6"],
    datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
  });
  const [summary, setSummary] = useState({
    totalDistance: "0",
    totalHours: "0",
    activityCount: 0,
  });

  const pan = useRef(new Animated.ValueXY()).current;
  const isDragging = useRef(false);

  // ✅ CONSTANTS FOR ASSETS
  const API_URL = process.env.EXPO_PUBLIC_API_URL || "";
  const BASE_URL = API_URL.replace(/\/api$/, "");

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
        pan.extractOffset();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (e, gestureState) => {
        isDragging.current = false;
        pan.flattenOffset();

        const iconSize = 60;
        const topBoundary = -screenHeight + 250;
        const bottomBoundary = 20;

        let targetY = (pan.y as any)._value || 0;
        if (targetY < topBoundary) targetY = topBoundary;
        if (targetY > bottomBoundary) targetY = bottomBoundary;

        const isLeftSide = gestureState.moveX < screenWidth / 2;
        const targetX = isLeftSide ? -(screenWidth - iconSize - 40) : 0;

        Animated.parallel([
          Animated.spring(pan.y, {
            toValue: targetY,
            useNativeDriver: false,
            friction: 8,
          }),
          Animated.spring(pan.x, {
            toValue: targetX,
            useNativeDriver: false,
            friction: 6,
          }),
        ]).start();
      },
    }),
  ).current;

  useEffect(() => {
    const initializeCore = async () => {
      await fetchProfile();
      await fetchStats();
      try {
        const res = await api.get(`/status`);
        setStatus(`CORE_ONLINE_V${res.data?.version || "1.0.0"}`);
      } catch {
        setStatus("CORE_OFFLINE");
      }
    };
    initializeCore();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
      fetchStats();
    }, []),
  );

  const fetchStats = async () => {
    try {
      const response = await api.get("/activities/stats");
      const { recent, summary } = response.data;
      setSummary(summary);

      if (recent.length > 0) {
        const rawData = [...recent].reverse();
        setChartData({
          labels: rawData.map((a: any) =>
            new Date(a.createdAt).toLocaleDateString("en-US", {
              weekday: "short",
            }),
          ),
          datasets: [
            {
              data: rawData.map((a: any) => parseFloat(a.distance)),
              color: (opacity = 1) => `rgba(0, 255, 242, ${opacity})`,
              strokeWidth: 2,
            },
          ],
        });
      }
    } catch (error) {
      console.error("DASHBOARD_STATS_ERROR", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get("/auth/profile");
      setUser(res.data);
      // Clean debug log
      if (res.data.image) {
        console.log(
          "📡 DASHBOARD_IMAGE_PATH:",
          `${BASE_URL}/${res.data.image}`.replace(/([^:]\/)\/+/g, "$1"),
        );
      }
    } catch (e) {
      console.error("DASHBOARD_PROFILE_ERROR", e);
    }
  };

  const handleStartActivity = () => {
    if (!isDragging.current) {
      router.push("/start-activity");
    }
  };

  // ✅ HELPER FOR IMAGE RENDERING
  const renderAvatar = () => {
    if (user?.image) {
      const uri = user.image.startsWith("http")
        ? user.image
        : `${BASE_URL}/${user.image}`.replace(/([^:]\/)\/+/g, "$1");

      return (
        <Image
          source={{ uri }}
          style={styles.avatarCircle}
          onError={() => {
            console.warn("IMAGE_LOAD_FAILED: Reverting to placeholder");
            setUser({ ...user, image: null });
          }}
        />
      );
    }

    return (
      <View style={styles.avatarPlaceholder}>
        <User color={CYBER_THEME.primary} size={20} />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.glitchText}>Welcome back,</Text>
              <Text style={[styles.glitchTextOpearative, { fontSize: 24 }]}>
                {user?.firstName?.toUpperCase() || "OPERATIVE"}
              </Text>
              <Text style={styles.subTitle}>ePRX_UV1 // DASHBOARD_ACCESS</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              style={styles.avatarContainer}
            >
              {renderAvatar()}
              <View
                style={[
                  styles.statusBadgeOverlay,
                  {
                    backgroundColor: status.includes("ONLINE")
                      ? "#00ff00"
                      : "#ff0000",
                  },
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* METRICS_SUMMARY */}
          <View style={styles.summaryGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>TOTAL_KM</Text>
              <Text style={styles.metricValue}>{summary.totalDistance}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>CORE_HOURS</Text>
              <Text style={styles.metricValue}>{summary.totalHours}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>SESSIONS</Text>
              <Text style={styles.metricValue}>{summary.activityCount}</Text>
            </View>
          </View>

          {/* Chart Section */}
          <View style={styles.chartCard}>
            <View style={styles.cardHeader}>
              <Activity size={14} color={CYBER_THEME.primary} />
              <Text style={styles.label}>NETWORK_ACTIVITY_LOAD (KM)</Text>
            </View>
            <LineChart
              data={chartData}
              width={screenWidth - 70}
              height={220}
              chartConfig={{
                backgroundColor: "#000",
                backgroundGradientFrom: "#0a0a0a",
                backgroundGradientTo: "#000",
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(0, 255, 242, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: CYBER_THEME.primary,
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 10,
                alignSelf: "center",
              }}
            />
          </View>
        </View>
      </ScrollView>

      {/* --- FLOATING CYBERPLAY ICON --- */}
      <Animated.View
        style={[
          styles.floatingIcon,
          { transform: [{ translateX: pan.x }, { translateY: pan.y }] },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.playCircle}
          activeOpacity={0.8}
          onPress={handleStartActivity}
        >
          <Play size={28} color="#000" fill="#000" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { padding: 20, paddingTop: 60 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 30 },
  glitchText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  glitchTextOpearative: {
    color: CYBER_THEME.primary,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  subTitle: { color: "#444", fontSize: 10, fontWeight: "bold", marginTop: 4 },
  avatarContainer: {
    borderWidth: 1,
    borderColor: CYBER_THEME.primary,
    padding: 2,
    borderRadius: 100,
    position: "relative",
  },
  avatarCircle: { width: 50, height: 50, borderRadius: 100 },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 100,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadgeOverlay: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#000",
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
    gap: 10,
  },
  metricBox: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    alignItems: "center",
  },
  metricLabel: {
    color: "#444",
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 5,
  },
  metricValue: {
    color: CYBER_THEME.primary,
    fontSize: 18,
    fontWeight: "900",
  },
  chartCard: {
    backgroundColor: "#0a0a0a",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    marginBottom: 20,
    alignItems: "center",
  },
  cardHeader: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  label: { color: CYBER_THEME.primary, fontSize: 10, fontWeight: "bold" },
  floatingIcon: {
    position: "absolute",
    bottom: 40,
    right: 20,
    zIndex: 9999,
  },
  playCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: CYBER_THEME.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: CYBER_THEME.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 4,
    borderColor: "#000",
  },
});
