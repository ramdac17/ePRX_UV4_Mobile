import { Tabs } from "expo-router";
import { Home, User, Cog, Activity } from "lucide-react-native";
import { CYBER_THEME } from "@/constants/Colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: CYBER_THEME.primary,
        tabBarInactiveTintColor: "#444",
        tabBarStyle: {
          backgroundColor: "#000",
          borderTopColor: "#222",
          height: 60,
          paddingBottom: 10,
        },
        headerShown: false,
      }}
    >
      {/* Maps to index.tsx */}
      <Tabs.Screen
        name="index"
        options={{
          title: "HOME",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />

      {/* Maps to profile.tsx (Previously two.tsx) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "IDENTITY",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />

      {/* Maps to settings.tsx */}
      <Tabs.Screen
        name="settings"
        options={{
          title: "CONFIG",
          tabBarIcon: ({ color }) => <Cog size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <Activity color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
