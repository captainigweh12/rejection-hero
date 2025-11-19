import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight, Shield, AlertCircle, Lock, Eye, MessageSquare } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { GetProfileResponse } from "@/shared/contracts";

type Props = NativeStackScreenProps<RootStackParamList, "ParentalGuidanceSettings">;

interface ParentalGuidancePreferences {
  contentRestrictions: boolean;
  liveStreamingDisabled: boolean;
  purchaseRestrictions: boolean;
  socialFeatureRestrictions: boolean;
  screenTimeAlerts: boolean;
  reportingEnabled: boolean;
}

export default function ParentalGuidanceSettingsScreen({ navigation }: Props) {
  const { theme, colors } = useTheme();
  const { t } = useLanguage();
  const [preferences, setPreferences] = useState<ParentalGuidancePreferences>({
    contentRestrictions: false,
    liveStreamingDisabled: false,
    purchaseRestrictions: false,
    socialFeatureRestrictions: false,
    screenTimeAlerts: false,
    reportingEnabled: false,
  });
  const [hasChanges, setHasChanges] = useState(false);

  const { data: profileData, isLoading } = useQuery<GetProfileResponse>({
    queryKey: ["profile"],
    queryFn: async () => {
      return api.get<GetProfileResponse>("/api/profile");
    },
  });

  // Load existing preferences from localStorage or profile
  useEffect(() => {
    const savedPrefs = localStorage.getItem("parentalGuidancePrefs");
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch (e) {
        console.log("Could not parse saved preferences");
      }
    }
    setHasChanges(false);
  }, []);

  const isMinor = profileData?.age && profileData.age < 18;

  const updateMutation = useMutation({
    mutationFn: async (updatedPrefs: ParentalGuidancePreferences) => {
      return api.put<{ success: boolean }>("/api/profile/parental-guidance", {
        parentalGuidance: updatedPrefs,
      });
    },
    onSuccess: () => {
      setHasChanges(false);
      Alert.alert("Success", "Parental guidance settings updated successfully");
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to update parental guidance settings");
      console.error(error);
    },
  });

  const handlePreferenceChange = (key: keyof ParentalGuidancePreferences, value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate(preferences);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundSolid, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Header */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.text, marginBottom: 8 }}>
              Parental Guidance
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
              {isMinor
                ? "Manage guidance settings for your account (under 18)"
                : "Configure parental guidance features if managing a minor account"}
            </Text>
          </View>

          {/* Age Status Badge */}
          {isMinor && (
            <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
              <View
                style={{
                  backgroundColor: colors.primary + "20",
                  borderRadius: 12,
                  padding: 16,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.primary,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <AlertCircle size={20} color={colors.primary} />
                <Text style={{ color: colors.text, fontSize: 14, flex: 1, fontWeight: "500" }}>
                  Enhanced safety features are available for your account
                </Text>
              </View>
            </View>
          )}

          {/* Content Restrictions */}
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text, marginBottom: 12 }}>
              Content Safety
            </Text>

            {/* Content Restrictions Toggle */}
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Shield size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", fontSize: 15, color: colors.text, marginBottom: 2 }}>
                    Content Restrictions
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    Filter mature content from quests
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.contentRestrictions}
                onValueChange={(value) => handlePreferenceChange("contentRestrictions", value)}
                trackColor={{ false: colors.border, true: colors.primary + "80" }}
                thumbColor={preferences.contentRestrictions ? colors.primary : colors.surface}
              />
            </View>

            {/* Live Streaming Disabled Toggle */}
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Eye size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", fontSize: 15, color: colors.text, marginBottom: 2 }}>
                    Disable Live Streaming
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    Prevent streaming to public audience
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.liveStreamingDisabled}
                onValueChange={(value) => handlePreferenceChange("liveStreamingDisabled", value)}
                trackColor={{ false: colors.border, true: colors.primary + "80" }}
                thumbColor={preferences.liveStreamingDisabled ? colors.primary : colors.surface}
              />
            </View>
          </View>

          {/* Financial & Social Controls */}
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text, marginBottom: 12 }}>
              Financial & Social Controls
            </Text>

            {/* Purchase Restrictions Toggle */}
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Lock size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", fontSize: 15, color: colors.text, marginBottom: 2 }}>
                    Purchase Restrictions
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    Require approval for in-app purchases
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.purchaseRestrictions}
                onValueChange={(value) => handlePreferenceChange("purchaseRestrictions", value)}
                trackColor={{ false: colors.border, true: colors.primary + "80" }}
                thumbColor={preferences.purchaseRestrictions ? colors.primary : colors.surface}
              />
            </View>

            {/* Social Feature Restrictions Toggle */}
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MessageSquare size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", fontSize: 15, color: colors.text, marginBottom: 2 }}>
                    Limit Social Features
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    Restrict direct messaging and social interaction
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.socialFeatureRestrictions}
                onValueChange={(value) => handlePreferenceChange("socialFeatureRestrictions", value)}
                trackColor={{ false: colors.border, true: colors.primary + "80" }}
                thumbColor={preferences.socialFeatureRestrictions ? colors.primary : colors.surface}
              />
            </View>
          </View>

          {/* Monitoring & Reporting */}
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text, marginBottom: 12 }}>
              Monitoring & Safety
            </Text>

            {/* Screen Time Alerts Toggle */}
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertCircle size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", fontSize: 15, color: colors.text, marginBottom: 2 }}>
                    Screen Time Alerts
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    Get notified of excessive app usage
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.screenTimeAlerts}
                onValueChange={(value) => handlePreferenceChange("screenTimeAlerts", value)}
                trackColor={{ false: colors.border, true: colors.primary + "80" }}
                thumbColor={preferences.screenTimeAlerts ? colors.primary : colors.surface}
              />
            </View>

            {/* Reporting Enabled Toggle */}
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Shield size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", fontSize: 15, color: colors.text, marginBottom: 2 }}>
                    Safety Reporting
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    Enable reports on safety and moderation issues
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.reportingEnabled}
                onValueChange={(value) => handlePreferenceChange("reportingEnabled", value)}
                trackColor={{ false: colors.border, true: colors.primary + "80" }}
                thumbColor={preferences.reportingEnabled ? colors.primary : colors.surface}
              />
            </View>
          </View>

          {/* Save Button */}
          {hasChanges && (
            <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
              <Pressable
                onPress={handleSave}
                disabled={updateMutation.isPending}
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: "center",
                  opacity: updateMutation.isPending ? 0.5 : 1,
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Info Section */}
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
                About These Settings
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
                These parental guidance features help create a safer, more appropriate experience for younger users. Enable features that align with your family&apos;s values and your child&apos;s age and maturity level.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
