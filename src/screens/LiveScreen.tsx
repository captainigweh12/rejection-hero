import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Video, Users } from "lucide-react-native";
import type { BottomTabScreenProps } from "@/navigation/types";

type Props = BottomTabScreenProps<"LiveTab">;

export default function LiveScreen({ navigation }: Props) {
  return (
    <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
      {/* Header */}
      <View className="pt-4 pb-2 px-6">
        <Text className="text-white text-3xl font-bold">Live</Text>
        <Text className="text-white/50 text-sm mt-1">Watch live streams from verified users</Text>
      </View>

      {/* Coming Soon */}
      <View className="flex-1 items-center justify-center px-8">
        <View
          className="w-24 h-24 rounded-full items-center justify-center mb-6"
          style={{
            backgroundColor: "rgba(255, 0, 0, 0.1)",
            borderWidth: 2,
            borderColor: "#FF0000",
          }}
        >
          <Video size={40} color="#FF0000" />
        </View>
        <Text className="text-white text-3xl font-bold mb-4">Coming Soon</Text>
        <Text className="text-white/70 text-center text-lg">
          Live video streaming will be available soon. Users will be able to verify their
          authenticity in real-time!
        </Text>
        <View className="mt-8 flex-row items-center gap-2">
          <Users size={20} color="#fff" />
          <Text className="text-white/50 text-sm">Powered by VideoSDK/Agora</Text>
        </View>
      </View>
    </LinearGradient>
  );
}
