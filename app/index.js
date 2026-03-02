// ePRX_UV1_Mobile/app/index.js
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
// Ensure this path matches your updated api.ts
import api from "../src/api/client";

export default function ConnectionTest() {
  const [status, setStatus] = useState("Checking Environment...");
  const [apiStatus, setApiStatus] = useState("Waiting for ping...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 🔍 Test 1: Polyfill Check (TextEncoder/URL)
    try {
      const url = new URL("https://eprx.test?status=ok");
      if (url.searchParams.get("status") === "ok") {
        setStatus("✅ Native Polyfills: Active");
      }
    } catch (e) {
      setStatus(
        "❌ Native Polyfills: Missing (Install 'react-native-url-polyfill')",
      );
    }
  }, []);

  const pingRailway = async () => {
    setLoading(true);
    setApiStatus("📡 Pinging Railway Base...");
    try {
      /**
       * ⚠️ PATH ALERT:
       * If your baseURL is '.../api', calling '.get("/health")'
       * results in '.../api/health'.
       * If you get a 404, try '.get("/")' to hit the root of the /api prefix.
       */
      const response = await api.get("/health");
      setApiStatus(`✅ API Success: ${response.status} (Uplink Stable)`);
    } catch (error) {
      // Detailed error reporting for mobile data debugging
      const errorMsg = error.response
        ? `Error ${error.response.status}: ${error.response.data?.message || "Unauthorized"}`
        : `Network Error: ${error.message}`;

      setApiStatus(`❌ ${errorMsg}`);
      console.log(
        "📡 DEBUG_UPLINK_FAIL:",
        error.response?.data || error.message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>ePRX UV1 SYSTEM_CHECK</Text>

      <View style={styles.card}>
        <Text style={styles.label}>NATIVE_RUNTIME:</Text>
        <Text style={styles.statusText}>{status}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>BACKEND_UPLINK:</Text>
        <Text style={styles.statusText}>{apiStatus}</Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={pingRailway}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#00fff2" />
          ) : (
            <Text style={styles.buttonText}>INITIATE_PING</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Ensure Mobile Data / WiFi is active</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000", // Cyber dark background
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 30,
    color: "#00fff2", // Cyan Primary
    letterSpacing: 2,
  },
  card: {
    backgroundColor: "#111",
    padding: 25,
    borderRadius: 2, // Sharp industrial edges
    width: "100%",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#222",
  },
  label: { fontSize: 12, color: "#666", marginBottom: 8, letterSpacing: 1 },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "transparent",
    padding: 15,
    borderRadius: 0,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00fff2",
  },
  buttonDisabled: { borderColor: "#333" },
  buttonText: {
    color: "#00fff2",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 1,
  },
  footer: { color: "#444", marginTop: 20, fontSize: 12 },
});
