import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { getDistance } from "geolib";
import api from "@/utils/api";
import { CYBER_THEME } from "@/constants/Colors";
import { Play, Pause, Square, ArrowLeft } from "lucide-react-native";
// import MapView, { Polyline, PROVIDER_GOOGLE } from "react-native-maps";

export default function StartActivity() {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false); // Correctly placed inside component

  // Tracking State
  const [distance, setDistance] = useState(0);
  const [elevation, setElevation] = useState(0);
  const [coords, setCoords] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null,
  );

  // 1. Permissions and Setup
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("PERMISSION_DENIED", "GPS_UPLINK_REQUIRED");
      }
    })();
    return () => stopTracking();
  }, []);

  // 2. Timer & Location Toggle
  useEffect(() => {
    if (isActive) {
      startTracking();
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      stopTracking();
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const startTracking = async () => {
    locationSubscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 5 },
      (location) => {
        const { latitude, longitude, altitude } = location.coords;
        const newPoint = { latitude, longitude };

        setCoords((prev) => {
          if (prev.length > 0) {
            const lastPoint = prev[prev.length - 1];
            const dist = getDistance(lastPoint, newPoint);
            setDistance((d) => d + dist);
          }
          return [...prev, newPoint];
        });
        if (altitude) setElevation(altitude);
      },
    );
  };

  const stopTracking = () => {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
  };

  const triggerStopSequence = () => {
    setIsActive(false);
    setTimeout(() => setShowModal(true), 150);
  };

  const handleSave = async () => {
    if (!title)
      return Alert.alert("INPUT_REQUIRED", "Please name this sequence.");

    setIsSyncing(true);
    const payload = {
      title,
      distance: (distance / 1000).toFixed(2),
      duration: seconds,
      pace:
        seconds > 0 && distance > 0
          ? (seconds / 60 / (distance / 1000)).toFixed(2)
          : "0",
      elevation: elevation.toFixed(1),
      coordinates: JSON.stringify(coords),
    };

    try {
      // Cyber-aesthetic delay
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await api.post("/activities", payload);
      setShowModal(false);
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("SYNC_ERROR", "DATA_TRANSMISSION_FAILED");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <ArrowLeft size={20} color={CYBER_THEME.primary} />
        <Text style={styles.backText}>ABORT_MISSION</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.timerText}>
          {new Date(seconds * 1000).toISOString().substr(11, 8)}
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>DISTANCE (KM)</Text>
            <Text style={styles.statValue}>{(distance / 1000).toFixed(2)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ELEVATION (M)</Text>
            <Text style={styles.statValue}>{elevation.toFixed(0)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => setIsActive(!isActive)}
          >
            {isActive ? (
              <Pause color="#ffaa00" size={40} />
            ) : (
              <Play color={CYBER_THEME.primary} size={40} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, { borderColor: "#ff0000" }]}
            onPress={triggerStopSequence}
          >
            <Square color="#ff0000" size={30} fill="#ff0000" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => !isSyncing && setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>SAVE_ACTIVITY_LOG</Text>
            {/*  
            <View style={styles.mapContainer}>
              {coords.length > 0 ? (
                <MapView
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  customMapStyle={mapStyle}
                  initialRegion={{
                    latitude: coords[0].latitude,
                    longitude: coords[0].longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Polyline
                    coordinates={coords}
                    strokeColor={CYBER_THEME.primary}
                    strokeWidth={3}
                  />
                </MapView>
              ) : (
                <View style={styles.mapPlaceholder}>
                  <Text style={styles.mapPlaceholderText}>NO_GPS_DATA</Text>
                </View>
              )}
              <View style={styles.mapOverlayFrame} />
            </View> */}

            <TextInput
              style={styles.input}
              placeholder="SEQUENCE_TITLE"
              placeholderTextColor="#444"
              value={title}
              onChangeText={setTitle}
              editable={!isSyncing}
            />

            <View style={styles.statsSummary}>
              <View style={styles.miniStat}>
                <Text style={styles.miniLabel}>KM</Text>
                <Text style={styles.miniValue}>
                  {(distance / 1000).toFixed(2)}
                </Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={styles.miniLabel}>PACE</Text>
                <Text style={styles.miniValue}>
                  {seconds > 0 && distance > 0
                    ? (seconds / 60 / (distance / 1000)).toFixed(2)
                    : "0"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, isSyncing && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={isSyncing}
            >
              <Text style={styles.saveBtnText}>
                {isSyncing ? "SYNCING_WITH_CORE..." : "UPLOAD_TO_CORE"}
              </Text>
            </TouchableOpacity>

            {!isSyncing && (
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>CANCEL_DISCARD</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ... (mapStyle and styles objects remain the same as your previous snippet)

const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#303030" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20, paddingTop: 60 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 10 },
  backText: { color: CYBER_THEME.primary, fontSize: 12, fontWeight: "900" },
  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  timerText: {
    color: CYBER_THEME.primary,
    fontSize: 64,
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

  // Modal Styles

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: CYBER_THEME.primary,
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
  },
  modalTitle: {
    color: CYBER_THEME.primary,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 25,
  },
  input: {
    width: "100%",
    borderBottomWidth: 1,
    borderColor: CYBER_THEME.primary,
    color: "#fff",
    padding: 10,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  summaryLabel: { color: "#666" },
  summaryValue: { color: CYBER_THEME.primary, fontWeight: "bold" },
  saveBtn: {
    backgroundColor: CYBER_THEME.primary,
    width: "100%",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnText: { color: "#000", fontWeight: "900" },

  mapContainer: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 20,
    position: "relative",
  },
  map: { width: "100%", height: "100%" },
  mapOverlayFrame: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 10,
    borderColor: "rgba(0,0,0,0.2)", // Creates a vignette effect
    pointerEvents: "none",
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#050505",
    justifyContent: "center",
    alignItems: "center",
  },
  mapPlaceholderText: { color: "#333", fontSize: 10, fontWeight: "bold" },
  statsSummary: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 15,
  },
  miniStat: { alignItems: "center" },
  miniLabel: { color: "#444", fontSize: 8, fontWeight: "900" },
  miniValue: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  cancelText: {
    color: "#ff0000",
    marginTop: 20,
    fontSize: 10,
    fontWeight: "bold",
    opacity: 0.6,
  },
});
