import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Video, Bell, Globe, Sun, Moon, ChevronRight, Shield, Smartphone } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { authClient } from "@/lib/authClient";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { languages } from "@/lib/translations";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  const { theme, setTheme, colors } = useTheme();
  const { language, t } = useLanguage();
  const [questReminders, setQuestReminders] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      t("settings.signOut"),
      "Are you sure you want to sign out?",
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.signOut"),
          style: "destructive",
          onPress: async () => {
            await authClient.signOut();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const getThemeDisplay = () => {
    switch (theme) {
      case "light":
        return t("settings.themeLight");
      case "dark":
        return t("settings.themeDark");
      case "system":
        return t("settings.themeSystem");
    }
  };

  const cycleTheme = () => {
    const themes = ["system", "light", "dark"] as const;
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Header */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.text, marginBottom: 8 }}>
              {t("settings.title")}
            </Text>
            <Text style={{ fontSize: 16, color: colors.textSecondary }}>
              {t("settings.account")}
            </Text>
          </View>

          {/* Appearance */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: colors.text }}>
              {t("settings.appearance")}
            </Text>
            <Pressable
              onPress={cycleTheme}
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                  {theme === "light" ? (
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Sun size={24} color={colors.warning} />
                    </View>
                  ) : theme === "dark" ? (
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Moon size={24} color={colors.info} />
                    </View>
                  ) : (
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Smartphone size={24} color={colors.primary} />
                    </View>
                  )}
                  <View>
                    <Text style={{ fontWeight: "600", fontSize: 16, color: colors.text, marginBottom: 4 }}>
                      {t("settings.theme")}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                      {getThemeDisplay()}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </View>
            </Pressable>
          </View>

          {/* Preferences */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: colors.text }}>
              {t("settings.preferences")}
            </Text>
            <Pressable
              onPress={() => navigation.navigate("LanguageSelection")}
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Globe size={24} color={colors.info} />
                </View>
                <View>
                  <Text style={{ fontWeight: "600", fontSize: 16, color: colors.text, marginBottom: 4 }}>
                    {t("settings.language")}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                    {languages[language].flag} {languages[language].nativeName}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Live Features */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: colors.text }}>
              {t("settings.liveFeatures")}
            </Text>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Video size={24} color={colors.error} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", fontSize: 16, marginBottom: 4, color: colors.text }}>
                    {t("settings.enableLivestreaming")}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                    Stream your quest challenges live to the community
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  navigation.goBack();
                  setTimeout(() => {
                    (navigation as any).navigate("Tabs", { screen: "LiveTab" });
                  }, 100);
                }}
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Enable</Text>
              </Pressable>
            </View>
          </View>

          {/* Notifications */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: colors.text }}>
              {t("settings.notifications")}
            </Text>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16, flex: 1 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bell size={24} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", fontSize: 16, color: colors.text, marginBottom: 4 }}>
                    {t("settings.questReminders")}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                    Get notified about active quests
                  </Text>
                </View>
              </View>
              <Switch
                value={questReminders}
                onValueChange={setQuestReminders}
                trackColor={{ false: colors.border, true: colors.primary + "80" }}
                thumbColor={questReminders ? colors.primary : colors.surface}
              />
            </View>
          </View>

          {/* Legal */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: colors.text }}>
              {t("settings.legal")}
            </Text>
            <Pressable
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Shield size={24} color={colors.success} />
                </View>
                <View>
                  <Text style={{ fontWeight: "600", fontSize: 16, color: colors.text, marginBottom: 4 }}>
                    {t("settings.safetyGuidelines")}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                    Learn about safe challenges
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Account Actions */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: colors.text }}>
              {t("settings.accountActions")}
            </Text>
            <Pressable
              onPress={handleLogout}
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 20,
                borderWidth: 2,
                borderColor: colors.error,
              }}
            >
              <Text style={{ color: colors.error, fontWeight: "600", fontSize: 16, textAlign: "center" }}>
                {t("settings.signOut")}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
