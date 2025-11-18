import React from "react";
import { View, Text, Pressable } from "react-native";
import { Zap, TrendingUp, Award } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/contexts/ThemeContext";

interface UpgradeCardProps {
  onViewTokens: () => void;
}

export function UpgradeCard({ onViewTokens }: UpgradeCardProps) {
  const { colors } = useTheme();

  return (
    <LinearGradient
      colors={["rgba(0, 217, 255, 0.15)", "rgba(0, 217, 255, 0.05)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(0, 217, 255, 0.3)",
        marginBottom: 20,
      }}
    >
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Zap size={20} color="#00d9ff" />
          <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text }}>Tokens & Premium</Text>
        </View>
        <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
          Buy tokens to send quests to friends or unlock premium features for unlimited AI quests.
        </Text>
      </View>

      <View style={{ gap: 12, marginBottom: 16 }}>
        {/* Feature 1 */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "rgba(0, 217, 255, 0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={16} color="#00d9ff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text, marginBottom: 2 }}>Send Tokens</Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>Send quests to friends as challenges</Text>
          </View>
        </View>

        {/* Feature 2 */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "rgba(16, 185, 129, 0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TrendingUp size={16} color="#10b981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text, marginBottom: 2 }}>Premium Access</Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>Unlimited AI quest generation</Text>
          </View>
        </View>

        {/* Feature 3 */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "rgba(168, 85, 247, 0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Award size={16} color="#a855f7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text, marginBottom: 2 }}>Exclusive Quests</Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>Access premium quest types</Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={onViewTokens}
        style={{
          backgroundColor: colors.primary,
          paddingVertical: 12,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.text }}>View Token Packages</Text>
      </Pressable>
    </LinearGradient>
  );
}
