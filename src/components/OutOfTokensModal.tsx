import React from "react";
import { View, Text, Pressable, Modal, Alert } from "react-native";
import { Zap, AlertCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/contexts/ThemeContext";

interface OutOfTokensModalProps {
  visible: boolean;
  onClose: () => void;
  onBuyTokens: () => void;
  onEarnTokens: () => void;
}

export function OutOfTokensModal({
  visible,
  onClose,
  onBuyTokens,
  onEarnTokens,
}: OutOfTokensModalProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <LinearGradient
          colors={["rgba(0, 217, 255, 0.1)", "rgba(0, 217, 255, 0.05)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 32,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "rgba(0, 217, 255, 0.3)",
            maxWidth: 320,
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "rgba(239, 68, 68, 0.2)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <AlertCircle size={40} color="#ef4444" />
          </View>

          {/* Title */}
          <Text style={{ fontSize: 22, fontWeight: "bold", color: colors.text, marginBottom: 12, textAlign: "center" }}>
            Out of Tokens
          </Text>

          {/* Description */}
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 20,
            }}
          >
            You need tokens to send quests to friends. Get more tokens to continue!
          </Text>

          {/* Buy Tokens Button */}
          <Pressable
            onPress={onBuyTokens}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 14,
              paddingHorizontal: 24,
              borderRadius: 12,
              alignItems: "center",
              width: "100%",
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Zap size={18} color={colors.text} />
              <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text }}>Buy Tokens</Text>
            </View>
          </Pressable>

          {/* Earn Tokens Button */}
          <Pressable
            onPress={onEarnTokens}
            style={{
              backgroundColor: "rgba(0, 217, 255, 0.2)",
              paddingVertical: 14,
              paddingHorizontal: 24,
              borderRadius: 12,
              alignItems: "center",
              width: "100%",
              borderWidth: 1,
              borderColor: colors.primary,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.primary }}>Earn Tokens with Quests</Text>
          </Pressable>

          {/* Close Button */}
          <Pressable
            onPress={onClose}
            style={{
              paddingVertical: 12,
              alignItems: "center",
              width: "100%",
            }}
          >
            <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: "600" }}>Cancel</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </Modal>
  );
}
