import React, { useEffect, useState, useRef, useCallback } from "react";
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
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import api from "@/utils/api";
import { CYBER_THEME } from "@/constants/Colors";
import { useRouter, useFocusEffect } from "expo-router";
import { User, Activity, Play } from "lucide-react-native";
import { getToken } from "@/utils/authStorage";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const BUTTON_SIZE = 68;
const MARGIN = 20;

export default function TabOneScreen() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imgError, setImgError] = useState(false);
  const router = useRouter();

  const [chartData, setChartData] = useState({
    labels: ["-", "-", "-", "-", "-", "-", "-"],
    datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
  });

  const [summary, setSummary] = useState({
    totalDistance: "0",
    totalHours: "0",
    activityCount: 0,
  });

  const pan = useRef(new Animated.ValueXY()).current;
  const BASE_URL = api.defaults.baseURL?.replace("/api", "") || "";

  const getAvatarSource = () => {
    if (!user?.image || imgError) return null;
    if (user.image.startsWith("http")) return { uri: user.image };
    const cleanPath = user.image.startsWith("/")
      ? user.image
      : `/${user.image}`;
    return { uri: `${BASE_URL}${cleanPath}?t=${new Date().getTime()}` };
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchProfile(), fetchStats()]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get("/activities/stats");
      const { recent, summary: statsSummary } = response.data;
      setSummary(statsSummary);

      if (recent?.length > 0) {
        const rawData = [...recent].reverse().slice(-7);
        setChartData({
          labels: rawData.map((a: any) =>
            new Date(a.createdAt)
              .toLocaleDateString("en-US", { weekday: "short" })
              .toUpperCase(),
          ),
          datasets: [
            {
              data: rawData.map((a: any) => parseFloat(a.distance)),
            },
          ],
        });
      }
    } catch (error: any) {
      if (error.response?.status === 401) router.replace("/login");
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get("/auth/profile");
      setUser(res.data);
    } catch (e: any) {
      if (e.response?.status === 401) router.replace("/login");
    }
  };

  const initializeDashboard = async () => {
    setIsLoading(true);
    try {
      let token = api.defaults.headers.common["Authorization"];
      if (!token) {
        const storedToken = await getToken();
        if (storedToken)
          api.defaults.headers.common["Authorization"] =
            `Bearer ${storedToken}`;
        else {
          router.replace("/login");
          return;
        }
      }
      await Promise.all([fetchProfile(), fetchStats()]);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      initializeDashboard();
    }, []),
  );

  // 🕹️ BUMP LOGIC PAN RESPONDER
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 10 || Math.abs(gesture.dy) > 10,
      onPanResponderGrant: () => {
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        const finalX = (pan.x as any)._value;
        const finalY = (pan.y as any)._value;
        const minX = -(screenWidth - BUTTON_SIZE - MARGIN);
        const maxX = MARGIN;
        const minY = -(screenHeight - BUTTON_SIZE - 100);
        const maxY = MARGIN;

        let destX = Math.max(minX, Math.min(finalX, maxX));
        let destY = Math.max(minY, Math.min(finalY, maxY));

        Animated.spring(pan, {
          toValue: { x: destX, y: destY },
          friction: 5,
          tension: 40,
          useNativeDriver: false,
        }).start();
      },
    }),
  ).current;

  if (isLoading && !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={CYBER_THEME.primary} size="large" />
        <Text style={styles.loadingText}>ESTABLISHING_UPLINK...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={CYBER_THEME.primary}
          />
        }
      >
        <View style={styles.container}>
          {/* 1. HEADER */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.glitchText}>Welcome, back</Text>
              <Text style={styles.glitchTextOpearative}>
                {user?.firstName?.toUpperCase() || "OPERATIVE"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              style={styles.avatarContainer}
            >
              {getAvatarSource() ? (
                <Image
                  source={getAvatarSource()!}
                  style={styles.avatarCircle}
                  onError={() => setImgError(true)}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User color={CYBER_THEME.primary} size={24} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* 2. TACTICAL RECHART MIMIC (The "Data Container") */}
          <View style={styles.dataContainer}>
            <View style={styles.dataHeader}>
              <Text style={styles.dataTitle}>SESSION ACTIVITY LOGS (KM)</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.pulseDot} />
                <Text style={styles.dataStatus}>LIVE_FEED</Text>
              </View>
            </View>

            <View style={styles.chartBox}>
              <LineChart
                data={chartData}
                width={screenWidth - 60}
                height={180}
                withInnerLines={true}
                withOuterLines={false}
                withVerticalLines={false}
                chartConfig={{
                  backgroundColor: "#000",
                  backgroundGradientFrom: "#0a0a0a",
                  backgroundGradientTo: "#0a0a0a",
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(212, 255, 0, ${opacity})`,
                  labelColor: (opacity = 1) =>
                    `rgba(102, 102, 102, ${opacity})`,
                  propsForBackgroundLines: {
                    strokeDasharray: "3 3",
                    stroke: "#222",
                  },
                  propsForDots: { r: "3", strokeWidth: "1", stroke: "#000" },
                }}
                bezier
                style={styles.chart}
              />
            </View>

            {/* INTEGRATED METRIC ROW */}
            <View style={styles.metricRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>TOTAL_KM</Text>
                <Text style={styles.metricValue}>{summary.totalDistance}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>CORE_HRS</Text>
                <Text style={styles.metricValue}>{summary.totalHours}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>SESSIONS</Text>
                <Text style={styles.metricValue}>{summary.activityCount}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 🚀 BUMPING PLAY BUTTON (Maintained) */}
      <Animated.View
        style={[
          styles.floatingIcon,
          { transform: [{ translateX: pan.x }, { translateY: pan.y }] },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.playCircle}
          onPress={() => router.push("/start-activity")}
        >
          <Play size={30} color="#000" fill="#000" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: CYBER_THEME.primary,
    marginTop: 15,
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  scrollContainer: { paddingBottom: 100 },
  container: { padding: 20, paddingTop: 60 },

  header: { flexDirection: "row", alignItems: "center", marginBottom: 30 },
  glitchText: { color: "#666", fontSize: 12, letterSpacing: 1 },
  glitchTextOpearative: {
    color: "#d4ff00",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
  },
  subTitle: { color: "#444", fontSize: 10, fontWeight: "bold", marginTop: 4 },

  avatarContainer: {
    borderWidth: 1,
    borderColor: CYBER_THEME.primary,
    padding: 2,
    borderRadius: 100,
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

  /* 🛡️ RECHART MIMIC STYLES */
  dataContainer: {
    backgroundColor: "rgba(10, 10, 10, 0.8)",
    borderWidth: 1,
    borderColor: "#1a1a1a",
    padding: 20,
    borderRadius: 2,
  },
  dataHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 10,
  },
  dataTitle: {
    fontSize: 9,
    letterSpacing: 2,
    color: "#d4ff00",
    fontWeight: "bold",
  },
  liveIndicator: { flexDirection: "row", alignItems: "center" },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: CYBER_THEME.primary,
    marginRight: 6,
  },
  dataStatus: { fontSize: 8, color: CYBER_THEME.primary, fontWeight: "bold" },

  chartBox: { marginLeft: -20 },
  chart: { marginVertical: 8 },

  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
  },
  metricItem: { flex: 1 },
  metricLabel: {
    fontSize: 8,
    color: "#d4ff00",
    letterSpacing: 1,
    marginBottom: 4,
  },
  metricValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Bebas Neue" : "sans-serif-condensed",
  },

  /* 🚀 FLOATING UI */
  floatingIcon: { position: "absolute", bottom: 40, right: 25, zIndex: 999 },
  playCircle: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: CYBER_THEME.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    borderWidth: 3,
    borderColor: "#000",
  },
});
