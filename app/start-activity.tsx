import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import notifee, {
  AndroidColor,
  AndroidImportance,
} from "@notifee/react-native";
import { getDistance } from "geolib";
import api from "@/utils/api";
import { CYBER_THEME } from "@/constants/Colors";
import {
  Play,
  Pause,
  Square,
  ArrowLeft,
  Ruler,
  Clock,
  Zap,
} from "lucide-react-native";
import { useKeepAwake } from "expo-keep-awake";

const { width } = Dimensions.get("window");
const GOOGLE_MAPS_API_KEY = "AIzaSyAPJpbH9IsUJv_mJqwpTUOEPTaiePTYyYM";

// ===============================
// TELEMETRY HELPERS
// ===============================

/**
 * Downsamples coordinates to keep URL length within Google's 8192 char limit.
 * Optimized for ePRX UV1 visual cards.
 */
const downsampleCoords = (coords: any[], maxPoints: number = 50) => {
  if (coords.length <= maxPoints) return coords;
  const step = Math.ceil(coords.length / maxPoints);
  const thinned = coords.filter((_, index) => index % step === 0);
  // Ensure the final coordinate is always preserved
  const lastPoint = coords[coords.length - 1];
  if (thinned[thinned.length - 1] !== lastPoint) {
    thinned.push(lastPoint);
  }
  return thinned;
};

const buildStaticMapUrl = (coords: any[]) => {
  if (!coords?.length) return null;

  // Thin out the path for the API call
  const displayCoords = downsampleCoords(coords, 50);
  const start = displayCoords[0];
  const end = displayCoords[displayCoords.length - 1];
  const path = displayCoords
    .map((p) => `${p.latitude},${p.longitude}`)
    .join("|");

  const base = "https://maps.googleapis.com/maps/api/staticmap";
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
    path: `color:0x00fff2ff|weight:5|${path}`,
  });

  return `${base}?${params.toString()}${styles}&markers=color:0x00ff00|label:S|${start.latitude},${start.longitude}&markers=color:0x00ffff|label:F|${end.latitude},${end.longitude}`;
};

export default function StartActivity() {
  useKeepAwake();
  const router = useRouter();

  // --- STATE ---
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [distance, setDistance] = useState(0);
  const [elevation, setElevation] = useState(0);
  const [coords, setCoords] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");

  // --- REFS ---
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null,
  );
  const distanceRef = useRef(0);

  // --- UTILS ---
  const formatTime = (s: number) =>
    new Date(s * 1000).toISOString().substr(11, 8);
  const formatKM = (d: number) => (d / 1000).toFixed(2);

  const staticMapUrl = useMemo(
    () => buildStaticMapUrl(coords),
    [coords, showModal],
  );

  // --- NOTIFICATION ENGINE ---
  const syncExternalWidget = async (secs: number, dist: number) => {
    await notifee.displayNotification({
      id: "tracking",
      title: "ePRX UV1: ACTIVE_SESSION",
      body: `⏱️ ${formatTime(secs)}  |  📍 ${formatKM(dist)} KM`,
      android: {
        channelId: "tracking",
        ongoing: true,
        asForegroundService: true,
        pressAction: { id: "default" },
        color: AndroidColor.CYAN,
        importance: AndroidImportance.LOW,
      },
    });
  };

  useEffect(() => {
    let isMounted = true;
    if (isActive) {
      (async () => {
        const permission = await notifee.requestPermission();
        if (permission.authorizationStatus < 1) {
          setIsActive(false);
          return Alert.alert(
            "PERMISSION_DENIED",
            "Notification access required for tracking.",
          );
        }

        await notifee.createChannel({
          id: "tracking",
          name: "Active Session Tracking",
          importance: AndroidImportance.LOW,
        });

        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 1,
            timeInterval: 1000,
          },
          (loc) => {
            if (!isMounted) return;
            const { latitude, longitude, speed, altitude } = loc.coords;
            const newPoint = { latitude, longitude };

            setCoords((prev) => {
              if (prev.length > 0) {
                const d = getDistance(prev[prev.length - 1], newPoint);
                // Drift Filter
                if (speed !== null && speed < 0.5 && d < 5) return prev;

                distanceRef.current += d;
                setDistance(distanceRef.current);
                return [...prev, newPoint];
              }
              return [newPoint];
            });
            if (altitude) setElevation(altitude);
          },
        );

        await syncExternalWidget(seconds, distanceRef.current);
        timerRef.current = setInterval(() => {
          setSeconds((prev) => {
            const next = prev + 1;
            syncExternalWidget(next, distanceRef.current);
            return next;
          });
        }, 1000);
      })();
    } else {
      locationSubscription.current?.remove();
      notifee.stopForegroundService();
      notifee.cancelNotification("tracking");
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      isMounted = false;
      locationSubscription.current?.remove();
    };
  }, [isActive]);

  // --- ACTIONS ---
  const handleSave = async () => {
    if (!title) return Alert.alert("REQUIRED", "Enter activity title.");

    setIsSyncing(true);
    try {
      const payload = {
        title,
        distance: parseFloat((distance / 1000).toFixed(2)),
        duration: seconds,
        elevation: parseFloat(elevation.toFixed(1)),
        coordinates: coords, // Full high-fidelity data for DB
        mapImageUrl: staticMapUrl, // Downsampled URL for preview
        shareImageUrl: null,
      };

      await api.post("/activities", payload);

      Alert.alert("SUCCESS", "Mission Log Synchronized.");
      setShowModal(false);
      router.replace("/(tabs)");
    } catch (e) {
      console.error("SYNC_ERROR:", e);
      Alert.alert("SYNC_ERROR", "DATA TRANSMISSION FAILED");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <View style={localStyles.container}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={localStyles.backBtn}
      >
        <ArrowLeft color={CYBER_THEME.primary} size={20} />
        <Text style={localStyles.backText}>CANCEL SESSION</Text>
      </TouchableOpacity>

      <View style={localStyles.content}>
        <Text style={localStyles.timerText}>{formatTime(seconds)}</Text>
        <View style={localStyles.statsGrid}>
          <View style={localStyles.statBox}>
            <Text style={localStyles.statLabel}>DISTANCE KM</Text>
            <Text style={localStyles.statValue}>{formatKM(distance)}</Text>
          </View>
          <View style={localStyles.statBox}>
            <Text style={localStyles.statLabel}>ELEVATION M</Text>
            <Text style={localStyles.statValue}>{elevation.toFixed(0)}</Text>
          </View>
        </View>

        <View style={localStyles.controls}>
          <TouchableOpacity
            style={localStyles.btn}
            onPress={() => setIsActive(!isActive)}
          >
            {isActive ? (
              <Pause
                color={CYBER_THEME.primary}
                size={35}
                fill={CYBER_THEME.primary}
              />
            ) : (
              <Play
                color={CYBER_THEME.primary}
                size={35}
                fill={CYBER_THEME.primary}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[localStyles.btn, { borderColor: "#ff0000" }]}
            onPress={() => {
              setIsActive(false);
              setShowModal(true);
            }}
          >
            <Square color="#ff0000" size={30} fill="#ff0000" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <View style={localStyles.mapWrapper}>
              {staticMapUrl ? (
                <Image
                  source={{ uri: staticMapUrl }}
                  style={StyleSheet.absoluteFillObject}
                />
              ) : (
                <View style={localStyles.loaderContainer}>
                  <ActivityIndicator color={CYBER_THEME.primary} />
                  <Text style={localStyles.loaderText}>
                    GENERATING_MAP_DATA...
                  </Text>
                </View>
              )}
            </View>

            <View style={localStyles.modalStatsOverlay}>
              <TextInput
                style={localStyles.missionTitleInput}
                placeholder="ENTER ACTIVITY TITLE"
                placeholderTextColor="#555"
                value={title}
                onChangeText={setTitle}
              />
              <View style={localStyles.divider} />
              <View style={localStyles.row}>
                <StatBox
                  icon={<Ruler size={14} color={CYBER_THEME.primary} />}
                  label="DIST"
                  value={`${formatKM(distance)} KM`}
                />
                <StatBox
                  icon={<Clock size={14} color={CYBER_THEME.primary} />}
                  label="TIME"
                  value={`${Math.floor(seconds / 60)}M`}
                />
                <StatBox
                  icon={<Zap size={14} color={CYBER_THEME.primary} />}
                  label="ELEV"
                  value={`${elevation.toFixed(0)}M`}
                />
              </View>
            </View>

            <TouchableOpacity
              style={localStyles.saveBtn}
              onPress={handleSave}
              disabled={isSyncing}
            >
              <Text style={localStyles.saveBtnText}>
                {isSyncing ? "UPLOADING..." : "SAVE TO HISTORY LOG"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={localStyles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const StatBox = ({ icon, label, value }: any) => (
  <View style={localStyles.statItem}>
    {icon}
    <View>
      <Text style={localStyles.statLabelSmall}>{label}</Text>
      <Text style={localStyles.statValueSmall}>{value}</Text>
    </View>
  </View>
);

const localStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20, paddingTop: 60 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 10 },
  backText: { color: CYBER_THEME.primary, fontSize: 12, fontWeight: "900" },
  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  timerText: {
    color: CYBER_THEME.primary,
    fontSize: 58,
    fontWeight: "900",
    marginBottom: 40,
  },
  statsGrid: { flexDirection: "row", gap: 20, marginBottom: 50 },
  statBox: {
    alignItems: "center",
    padding: 20,
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 10,
    width: 140,
  },
  statLabel: { color: "#666", fontSize: 10, marginBottom: 5 },
  statValue: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  controls: { flexDirection: "row", gap: 30 },
  btn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: CYBER_THEME.primary,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "#000",
    margin: 10,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1a1a1a",
    paddingBottom: 20,
  },
  mapWrapper: {
    width: "100%",
    height: width - 40,
    backgroundColor: "#111",
    justifyContent: "center",
  },
  loaderContainer: { alignItems: "center" },
  loaderText: {
    color: "#444",
    fontSize: 10,
    marginTop: 10,
    fontWeight: "bold",
  },
  modalStatsOverlay: { padding: 20 },
  missionTitleInput: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
    borderBottomWidth: 1,
    borderColor: "#222",
    paddingBottom: 5,
  },
  divider: { height: 1, backgroundColor: "#1a1a1a", marginVertical: 15 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  statItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  statLabelSmall: { color: "#555", fontSize: 8, fontWeight: "900" },
  statValueSmall: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  saveBtn: {
    backgroundColor: CYBER_THEME.primary,
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  saveBtnText: { color: "#000", fontWeight: "900" },
  cancelText: {
    color: "#ff0000",
    textAlign: "center",
    marginTop: 15,
    fontSize: 10,
    fontWeight: "bold",
    opacity: 0.6,
  },
});
