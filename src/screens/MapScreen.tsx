import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MapPin, Navigation } from "lucide-react-native";
import type { BottomTabScreenProps } from "@/navigation/types";

type Props = BottomTabScreenProps<"MapTab">;

export default function MapScreen({ navigation }: Props) {
  return (
    <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
      {/* Header */}
      <View className="pt-4 pb-2 px-6">
        <Text className="text-white text-3xl font-bold">Map</Text>
        <Text className="text-white/50 text-sm mt-1">Discover users near you</Text>
      </View>

      {/* Coming Soon */}
      <View className="flex-1 items-center justify-center px-8">
        <View
          className="w-24 h-24 rounded-full items-center justify-center mb-6"
          style={{
            backgroundColor: "rgba(0, 217, 255, 0.1)",
            borderWidth: 2,
            borderColor: "#00D9FF",
          }}
        >
          <MapPin size={40} color="#00D9FF" />
        </View>
        <Text className="text-white text-3xl font-bold mb-4">Coming Soon</Text>
        <Text className="text-white/70 text-center text-lg">
          Map view will show nearby users and their locations. Explore and connect with people
          around you!
        </Text>
        <View className="mt-8 flex-row items-center gap-2">
          <Navigation size={20} color="#fff" />
          <Text className="text-white/50 text-sm">Powered by Google Maps</Text>
        </View>
      </View>
    </LinearGradient>
  );
}
