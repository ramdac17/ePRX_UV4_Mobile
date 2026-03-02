import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { CYBER_THEME } from "@/constants/Colors";
import { Cog, Shield, Bell, Cpu, ChevronRight } from "lucide-react-native";

export default function SettingsScreen() {
  const settingsOptions = [
    {
      id: "1",
      label: "SECURITY_PROTOCOLS",
      icon: <Shield size={18} color={CYBER_THEME.primary} />,
    },
    {
      id: "2",
      label: "SIGNAL_NOTIFICATIONS",
      icon: <Bell size={18} color={CYBER_THEME.primary} />,
    },
    {
      id: "3",
      label: "CORE_SYSTEM_UPDATE",
      icon: <Cpu size={18} color={CYBER_THEME.primary} />,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Cog color={CYBER_THEME.primary} size={32} />
        <Text style={styles.title}>SYSTEM_CONFIGURATION</Text>
      </View>

      <View style={styles.section}>
        {settingsOptions.map((item) => (
          <TouchableOpacity key={item.id} style={styles.optionRow}>
            <View style={styles.optionLabel}>
              {item.icon}
              <Text style={styles.labelText}>{item.label}</Text>
            </View>
            <ChevronRight size={16} color="#444" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>ePRX_UV1 // TERMINAL_V1.0.4</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20, paddingTop: 60 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 40,
  },
  title: {
    color: CYBER_THEME.primary,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
  section: {
    backgroundColor: "#0a0a0a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#222",
    overflow: "hidden",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  optionLabel: { flexDirection: "row", alignItems: "center", gap: 15 },
  labelText: {
    color: "#ccc",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  footer: { marginTop: 40, alignItems: "center", opacity: 0.5 },
  footerText: {
    color: "#444",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
});
