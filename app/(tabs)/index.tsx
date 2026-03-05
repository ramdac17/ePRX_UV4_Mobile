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

  // 🔄 REFRESH HANDLER
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchProfile(), fetchStats()]);
    } catch (err) {
      console.error("DASHBOARD_REFRESH_FAIL", err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const initializeDashboard = async () => {
    setIsLoading(true);
    try {
      let token = api.defaults.headers.common["Authorization"];
      if (!token) {
        const storedToken = await getToken();
        if (storedToken) {
          api.defaults.headers.common["Authorization"] =
            `Bearer ${storedToken}`;
        } else {
          router.replace("/login");
          return;
        }
      }
      await Promise.all([fetchProfile(), fetchStats()]);
    } catch (err) {
      console.error("DASHBOARD_INIT_FAIL", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/activities/stats");
      const { recent, summary: statsSummary } = response.data;
      setSummary(statsSummary);

      if (recent?.length > 0) {
        const rawData = [...recent].reverse();
        setChartData({
          labels: rawData.map((a: any) =>
            new Date(a.createdAt).toLocaleDateString("en-US", {
              weekday: "short",
            }),
          ),
          datasets: [{ data: rawData.map((a: any) => parseFloat(a.distance)) }],
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

  useFocusEffect(
    useCallback(() => {
      setImgError(false);
      initializeDashboard();
    }, []),
  );

  // 🕹️ BUMP LOGIC PAN RESPONDER
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dx) > 10 || Math.abs(gesture.dy) > 10;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();

        // --- 💥 BUMP DETECTION ---
        const finalX = (pan.x as any)._value;
        const finalY = (pan.y as any)._value;

        // Calculate boundaries relative to the absolute position "bottom: 40, right: 25"
        // These values represent how far the button is allowed to travel
        const minX = -(screenWidth - BUTTON_SIZE - MARGIN);
        const maxX = MARGIN;
        const minY = -(screenHeight - BUTTON_SIZE - 100); // 100 padding for top status bar
        const maxY = MARGIN;

        let destX = finalX;
        let destY = finalY;

        if (finalX < minX) destX = minX;
        if (finalX > maxX) destX = maxX;
        if (finalY < minY) destY = minY;
        if (finalY > maxY) destY = maxY;

        // Trigger the "Bump" Spring Animation
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={CYBER_THEME.primary}
            colors={[CYBER_THEME.primary]}
            progressBackgroundColor="#0a0a0a"
          />
        }
      >
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.glitchText}>Welcome Back,</Text>
              <Text style={styles.glitchTextOpearative}>
                {user?.firstName?.toUpperCase() || "OPERATIVE"}
              </Text>
              <Text style={styles.subTitle}>ePRX_UV1 DASHBOARD</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              style={styles.avatarContainer}
            >
              {user?.image && !imgError ? (
                <Image
                  source={{
                    uri: `${BASE_URL}${user.image.startsWith("/") ? "" : "/"}${user.image}?t=${new Date().getTime()}`,
                  }}
                  style={styles.avatarCircle}
                  onError={() => setImgError(true)}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User color={CYBER_THEME.primary} size={24} />
                </View>
              )}
              {user && <View style={styles.statusBadgeOverlay} />}
            </TouchableOpacity>
          </View>

          {/* GRID */}
          <View style={styles.summaryGrid}>
            {[
              { label: "TOTAL KM", value: summary.totalDistance },
              { label: "CORE HOURS", value: summary.totalHours },
              { label: "SESSIONS", value: summary.activityCount },
            ].map((item, i) => (
              <View key={i} style={styles.metricBox}>
                <Text style={styles.metricLabel}>{item.label}</Text>
                <Text style={styles.metricValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          {/* CHART */}
          <View style={styles.chartCard}>
            <View style={styles.cardHeader}>
              <Activity size={14} color={CYBER_THEME.primary} />
              <Text style={styles.label}>SESSION ACTIVITY CHART (KM)</Text>
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

      {/* 🚀 BUMPING PLAY BUTTON */}
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
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 1,
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
  statusBadgeOverlay: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#000",
    backgroundColor: "#00ff00",
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
  metricValue: { color: CYBER_THEME.primary, fontSize: 18, fontWeight: "900" },
  chartCard: {
    backgroundColor: "#0a0a0a",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  cardHeader: { flexDirection: "row", gap: 8, marginBottom: 10 },
  label: { color: CYBER_THEME.primary, fontSize: 10, fontWeight: "bold" },
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
