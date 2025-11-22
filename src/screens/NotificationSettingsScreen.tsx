import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Switch, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, CheckCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import type { RootStackScreenProps } from "@/navigation/types";

type Props = RootStackScreenProps<"NotificationSettings">;

interface NotificationPreferences {
  questCompleted: boolean;
  questShared: boolean;
  friendRequest: boolean;
  friendAccepted: boolean;
  confidenceLow: boolean;
  challengeReminder: boolean;
  dailyMotivation: boolean;
  achievementUnlocked: boolean;
  leaderboardFallBehind: boolean;
}

export default function NotificationSettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  // Default preferences
  const defaultPreferences: NotificationPreferences = {
    questCompleted: true,
    questShared: true,
    friendRequest: true,
    friendAccepted: true,
    confidenceLow: true,
    leaderboardFallBehind: true,
    challengeReminder: true,
    dailyMotivation: true,
    achievementUnlocked: true,
  };

  const { data: prefsData, isLoading, error } = useQuery<{ preferences: NotificationPreferences }>({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      return api.get<{ preferences: NotificationPreferences }>("/api/notifications/preferences");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      return api.post<{ success: boolean; preferences: NotificationPreferences }>(
        "/api/notifications/preferences",
        updates
      );
    },
    onSuccess: (data) => {
      setPreferences(data.preferences);
      queryClient.setQueryData(["notification-preferences"], { preferences: data.preferences });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to update notification preferences");
    },
  });

  React.useEffect(() => {
    if (prefsData?.preferences) {
      setPreferences(prefsData.preferences);
    } else if (!isLoading && !prefsData) {
      // If query completed but no data, use defaults
      setPreferences(defaultPreferences);
    }
  }, [prefsData, isLoading]);

  const togglePreference = (key: keyof NotificationPreferences) => {
    const currentPrefs = preferences || defaultPreferences;
    const newValue = !currentPrefs[key];
    const updates = { [key]: newValue };
    
    setPreferences({ ...currentPrefs, ...updates });
    updateMutation.mutate(updates);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const notificationTypes = [
    { key: "questCompleted" as const, label: "Quest Completed", description: "Get notified when you complete a quest" },
    { key: "questShared" as const, label: "Quest Shared", description: "Get notified when someone shares a quest with you" },
    { key: "friendRequest" as const, label: "Friend Requests", description: "Get notified when someone sends you a friend request" },
    { key: "friendAccepted" as const, label: "Friend Accepted", description: "Get notified when someone accepts your friend request" },
    { key: "confidenceLow" as const, label: "Low Confidence Alert", description: "Get notified when your confidence meter is low" },
    { key: "leaderboardFallBehind" as const, label: "Leaderboard Alerts", description: "Get notified when you're falling behind in the leaderboard" },
    { key: "challengeReminder" as const, label: "Challenge Reminders", description: "Get daily reminders for your active challenge" },
    { key: "dailyMotivation" as const, label: "Daily Motivation", description: "Receive daily motivational messages" },
    { key: "achievementUnlocked" as const, label: "Achievements", description: "Get notified when you unlock achievements" },
  ];

  // Use default preferences if loading fails or data is not available
  const currentPreferences = preferences || defaultPreferences;

  // Show loading state
  if (isLoading && !preferences) {
    return (
      <LinearGradient colors={colors.background} className="flex-1">
        <SafeAreaView edges={["top"]} className="flex-1">
          {/* Header */}
          <View
            className="flex-row items-center px-6 py-4 border-b"
            style={{ borderBottomColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 items-center justify-center rounded-full mr-3"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            >
              <ArrowLeft size={20} color={colors.text} />
            </Pressable>
            <View className="flex-1 flex-row items-center">
              <Bell size={24} color={colors.text} className="mr-3" />
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                Notification Settings
              </Text>
            </View>
          </View>
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#7E3FE4" />
            <Text style={{ color: colors.textSecondary, marginTop: 16 }}>
              Loading preferences...
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Show error state with retry option
  if (error && !preferences) {
    return (
      <LinearGradient colors={colors.background} className="flex-1">
        <SafeAreaView edges={["top"]} className="flex-1">
          {/* Header */}
          <View
            className="flex-row items-center px-6 py-4 border-b"
            style={{ borderBottomColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 items-center justify-center rounded-full mr-3"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            >
              <ArrowLeft size={20} color={colors.text} />
            </Pressable>
            <View className="flex-1 flex-row items-center">
              <Bell size={24} color={colors.text} className="mr-3" />
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                Notification Settings
              </Text>
            </View>
          </View>
          <View className="flex-1 items-center justify-center px-6">
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600", marginBottom: 8, textAlign: "center" }}>
              Failed to load notification preferences
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 24, textAlign: "center" }}>
              {error instanceof Error ? error.message : "An error occurred while loading your preferences."}
            </Text>
            <Pressable
              onPress={() => {
                queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
              }}
              style={{
                backgroundColor: "#7E3FE4",
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
                Retry
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={colors.background} className="flex-1">
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Header */}
        <View
          className="flex-row items-center px-6 py-4 border-b"
          style={{ borderBottomColor: "rgba(255, 255, 255, 0.1)" }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full mr-3"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>
          <View className="flex-1 flex-row items-center">
            <Bell size={24} color={colors.text} className="mr-3" />
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              Notification Settings
            </Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
          <Text className="text-sm mb-6" style={{ color: colors.textSecondary }}>
            Choose which notifications you want to receive. You can toggle them on or off at any time.
          </Text>

          <View className="gap-4">
            {notificationTypes.map((type) => (
              <View
                key={type.key}
                className="flex-row items-center justify-between p-4 rounded-2xl"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <View className="flex-1 mr-4">
                  <Text className="text-base font-semibold mb-1" style={{ color: colors.text }}>
                    {type.label}
                  </Text>
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>
                    {type.description}
                  </Text>
                </View>
                <Switch
                  value={currentPreferences[type.key]}
                  onValueChange={() => togglePreference(type.key)}
                  trackColor={{ false: "rgba(255, 255, 255, 0.2)", true: "#7E3FE4" }}
                  thumbColor={currentPreferences[type.key] ? "#FFFFFF" : "#f4f3f4"}
                />
              </View>
            ))}
          </View>

          <View
            className="mt-6 p-4 rounded-2xl"
            style={{ backgroundColor: "rgba(126, 63, 228, 0.1)" }}
          >
            <View className="flex-row items-start">
              <CheckCircle size={20} color="#7E3FE4" className="mr-3 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-semibold mb-1" style={{ color: colors.text }}>
                  Notification Preferences Saved
                </Text>
                <Text className="text-xs" style={{ color: colors.textSecondary }}>
                  Your notification preferences are saved automatically. You can change them anytime.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

