import React, { useState } from "react";
import { View, Text, Pressable, TextInput, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Shield, AlertTriangle } from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import { useTheme } from "@/contexts/ThemeContext";

export default function AgeVerificationScreen() {
  const navigation = useNavigation();
  const { data: session } = useSession();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [age, setAge] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const textPrimary = { color: colors.text };
  const textSecondary = { color: colors.textSecondary };

  const handleSubmit = async () => {
    const ageNum = parseInt(age, 10);

    if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      Alert.alert("Invalid Age", "Please enter a valid age.");
      return;
    }

    if (ageNum < 13) {
      Alert.alert(
        "Age Requirement",
        "You must be at least 13 years old to use Rejection Hero. If you are under 13, please have a parent or guardian contact us.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Update profile with age and age verification
      await api.post("/api/profile", {
        age: ageNum,
        ageVerified: true,
        parentalConsent: ageNum >= 13 && ageNum < 18, // Require parental consent for 13-17
      });

      // Invalidate profile cache to trigger AuthWrapper re-check
      await queryClient.invalidateQueries({ queryKey: ["profile"] });

      // Small delay to ensure cache is updated
      await new Promise((resolve) => setTimeout(resolve, 300));

      // If user is 13-17, show parental consent notice
      if (ageNum >= 13 && ageNum < 18) {
        Alert.alert(
          "Parental Consent Required",
          "Since you are under 18, parental consent is required. You can continue with the app, but certain features may be restricted until consent is obtained.",
          [
            {
              text: "I Understand",
              onPress: () => {
                navigation.navigate("Onboarding" as never);
              },
            },
          ]
        );
      } else {
        // User is 18+, proceed to onboarding
        navigation.navigate("Onboarding" as never);
      }
    } catch (error) {
      console.error("Age verification error:", error);
      Alert.alert("Error", "Failed to verify age. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={colors.background} className="flex-1">
      <SafeAreaView edges={["top", "bottom"]} className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center py-8">
            {/* Header */}
            <View className="items-center mb-8">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: "rgba(126, 63, 228, 0.2)" }}
              >
                <Shield size={40} color="#7E3FE4" />
              </View>
              <Text
                className="text-3xl font-bold text-center mb-2"
                style={textPrimary}
              >
                Age Verification
              </Text>
              <Text
                className="text-base text-center px-4"
                style={textSecondary}
              >
                To use Rejection Hero, you must be at least 13 years old
              </Text>
            </View>

            {/* Age Requirements Info */}
            <View
              className="p-4 rounded-2xl mb-6"
              style={{ backgroundColor: "rgba(126, 63, 228, 0.1)" }}
            >
              <View className="flex-row items-start mb-3">
                <AlertTriangle size={20} color="#FF6B35" className="mr-2 mt-0.5" />
                <View className="flex-1">
                  <Text className="font-semibold mb-2" style={textPrimary}>
                    Age Requirements:
                  </Text>
                  <Text className="text-sm mb-1" style={textSecondary}>
                    • Minimum age: 13 years old
                  </Text>
                  <Text className="text-sm mb-1" style={textSecondary}>
                    • Live streaming: 18+ only
                  </Text>
                  <Text className="text-sm" style={textSecondary}>
                    • Users 13-17: Parental consent required
                  </Text>
                </View>
              </View>
            </View>

            {/* Age Input */}
            <View className="mb-6">
              <Text className="font-semibold mb-2 text-base" style={textPrimary}>
                How old are you?
              </Text>
              <TextInput
                value={age}
                onChangeText={setAge}
                placeholder="Enter your age"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                maxLength={3}
                className="w-full py-4 px-4 rounded-2xl text-base"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: colors.text,
                }}
              />
            </View>

            {/* Privacy Notice */}
            <View
              className="p-4 rounded-2xl mb-6"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
            >
              <Text className="text-xs leading-5" style={textSecondary}>
                Your age information is used to ensure compliance with age restrictions and to provide age-appropriate content. We do not share this information with third parties.
              </Text>
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting || !age}
              className="py-4 rounded-2xl items-center overflow-hidden"
              style={{ opacity: isSubmitting || !age ? 0.5 : 1 }}
            >
              <LinearGradient
                colors={["#7E3FE4", "#FF6B35"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="absolute inset-0"
              />
              <Text className="font-bold text-base" style={textPrimary}>
                {isSubmitting ? "Verifying..." : "Continue"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

