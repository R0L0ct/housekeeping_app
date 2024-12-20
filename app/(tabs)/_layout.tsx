import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Rooms",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="no-meeting-room" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="out"
        options={{
          title: "Out",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="meeting-room" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ready"
        options={{
          title: "Ready",
          tabBarIcon: ({ color }) => (
            // <IconSymbol size={28} name="house.circle" color={color} />
            <AntDesign name="checkcircle" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          title: "Register",
          tabBarIcon: ({ color }) => (
            // <IconSymbol size={28} name="house.circle" color={color} />
            <MaterialCommunityIcons name="database" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
