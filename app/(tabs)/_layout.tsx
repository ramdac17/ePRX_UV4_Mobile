import { Tabs } from "expo-router";
import { Home, User, Cog, History } from "lucide-react-native";
import { CYBER_THEME } from "@/constants/Colors";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: CYBER_THEME.primary,
        tabBarInactiveTintColor: "#444",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#000",
          borderTopColor: "#1a1a1a",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 65,
          paddingBottom: Platform.OS === "ios" ? 30 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "900",
          letterSpacing: 1,
        },
      }}
    >
      {/* 🏠 CORE DASHBOARD */}
      <Tabs.Screen
        name="index"
        options={{
          title: "DASHBOARD",
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />

      {/* 📜 MISSION LOGS */}
      <Tabs.Screen
        name="history"
        options={{
          title: "HISTORY",
          tabBarIcon: ({ color }) => <History size={22} color={color} />,
        }}
      />

      {/* 🕵️ INVISIBLE DETAIL SCREEN (Ghost Route) */}
      {/* Name MUST match the filename in your directory exactly */}
      <Tabs.Screen
        name="activity-detail/[id]"
        options={{
          href: null, // This hides it from the bottom bar
        }}
      />

      {/* 👤 OPERATIVE IDENTITY */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "IDENTITY",
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />

      {/* ⚙️ SYSTEM CONFIG */}
      <Tabs.Screen
        name="settings"
        options={{
          title: "CONFIG",
          tabBarIcon: ({ color }) => <Cog size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
