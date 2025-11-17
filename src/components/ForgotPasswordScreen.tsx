import React, { useState } from "react";
import { Alert, Pressable, Text, TextInput, View, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

import { api } from "@/lib/api";

interface ForgotPasswordProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function ForgotPasswordScreen({ onBack, onSuccess }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestReset = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log("🔐 [ForgotPassword] Requesting password reset for:", email);

      const response = await api.post("/api/auth/forgot-password", { email });

      console.log("🔐 [ForgotPassword] Response:", response);

      console.log("✅ [ForgotPassword] Email sent successfully");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Show success message with details
      Alert.alert(
        "Email Sent",
        "Check your email for password reset instructions. The link will expire in 24 hours.",
        [
          {
            text: "Done",
            onPress: () => {
              setEmail("");
              onSuccess();
            },
          },
        ]
      );
    } catch (error) {
      console.error("🔐 [ForgotPassword] Error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      let errorMessage = "An unexpected error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
        <Pressable onPress={onBack} disabled={isLoading} className="p-2">
          <Ionicons name="chevron-back" size={24} color="white" />
        </Pressable>
        <Text className="text-xl font-bold text-white flex-1 text-center">Reset Password</Text>
        <View className="w-8" />
      </View>

      {/* Content */}
      <View className="flex-1 px-6">
        <View className="mb-8">
          <Text className="text-2xl font-bold text-white mb-3">Forgot Password?</Text>
          <Text className="text-base text-white/70">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </Text>
        </View>

        {/* Email Input */}
        <View className="mb-6">
          <Text className="text-sm font-medium mb-2 text-white/80">Email Address</Text>
          <View
            className="rounded-xl p-4"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderWidth: 1,
              borderColor: "rgba(126, 63, 228, 0.2)",
            }}
          >
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              className="text-white text-base"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Info Box */}
        <View
          className="rounded-lg p-4 mb-8"
          style={{
            backgroundColor: "rgba(0, 217, 255, 0.1)",
            borderLeftWidth: 4,
            borderLeftColor: "#00D9FF",
          }}
        >
          <Text className="text-sm text-cyan-300 font-medium">📧 What happens next?</Text>
          <Text className="text-xs text-white/70 mt-2">
            We&apos;ll send a secure link to your email. Click the link to set a new password. The link
            expires in 24 hours.
          </Text>
        </View>

        {/* Send Button */}
        <Pressable
          onPress={handleRequestReset}
          disabled={isLoading}
          className="rounded-2xl overflow-hidden mb-4"
        >
          <LinearGradient
            colors={["#7E3FE4", "#FF6B35"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-4 items-center justify-center"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg text-center">Send Reset Link</Text>
            )}
          </LinearGradient>
        </Pressable>

        {/* Back Button */}
        <Pressable
          onPress={onBack}
          disabled={isLoading}
          className="py-3 rounded-lg border border-white/20"
        >
          <Text className="text-white text-center font-medium">Back to Login</Text>
        </Pressable>
      </View>

      {/* Security Notice */}
      <View className="px-6 pb-8">
        <Text className="text-xs text-white/50 text-center">
          We take your security seriously. Never share your password reset link with anyone.
        </Text>
      </View>
    </View>
  );
}
