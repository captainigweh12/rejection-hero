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
    <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Header */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text style={{ fontSize: 32, fontWeight: "bold", color: "white", marginBottom: 8 }}>
              {t("settings.title")}
            </Text>
            <Text style={{ fontSize: 16, color: "rgba(255, 255, 255, 0.6)" }}>
              {t("settings.account")}
            </Text>
          </View>

          {/* Appearance */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "white" }}>
              {t("settings.appearance")}
            </Text>
            <Pressable
              onPress={cycleTheme}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(126, 63, 228, 0.3)",
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
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Sun size={24} color="#FF6B35" />
                    </View>
                  ) : theme === "dark" ? (
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Moon size={24} color="#00D9FF" />
                    </View>
                  ) : (
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Smartphone size={24} color="#7E3FE4" />
                    </View>
                  )}
                  <View>
                    <Text style={{ fontWeight: "600", fontSize: 16, color: "white", marginBottom: 4 }}>
                      {t("settings.theme")}
                    </Text>
                    <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14 }}>
                      {getThemeDisplay()}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="rgba(255, 255, 255, 0.6)" />
              </View>
            </Pressable>
          </View>

          {/* Preferences */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "white" }}>
              {t("settings.preferences")}
            </Text>
            <Pressable
              onPress={() => navigation.navigate("LanguageSelection")}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 16,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: "rgba(126, 63, 228, 0.3)",
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
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Globe size={24} color="#00D9FF" />
                </View>
                <View>
                  <Text style={{ fontWeight: "600", fontSize: 16, color: "white", marginBottom: 4 }}>
                    {t("settings.language")}
                  </Text>
                  <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14 }}>
                    {languages[language].flag} {languages[language].nativeName}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="rgba(255, 255, 255, 0.6)" />
            </Pressable>
          </View>

          {/* Live Features */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "white" }}>
              {t("settings.liveFeatures")}
            </Text>
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(126, 63, 228, 0.3)",
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
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Video size={24} color="#FF3B30" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", fontSize: 16, marginBottom: 4, color: "white" }}>
                    {t("settings.enableLivestreaming")}
                  </Text>
                  <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14 }}>
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
                  backgroundColor: "#7E3FE4",
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
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "white" }}>
              {t("settings.notifications")}
            </Text>
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 16,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: "rgba(126, 63, 228, 0.3)",
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
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bell size={24} color="#FF6B35" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", fontSize: 16, color: "white", marginBottom: 4 }}>
                    {t("settings.questReminders")}
                  </Text>
                  <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14 }}>
                    Get notified about active quests
                  </Text>
                </View>
              </View>
              <Switch
                value={questReminders}
                onValueChange={setQuestReminders}
                trackColor={{ false: colors.border, true: "#7E3FE4" + "80" }}
                thumbColor={questReminders ? "#7E3FE4" : colors.surface}
              />
            </View>
          </View>

          {/* Legal */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "white" }}>
              {t("settings.legal")}
            </Text>
            <Pressable
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 16,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: "rgba(126, 63, 228, 0.3)",
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
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Shield size={24} color="#4CAF50" />
                </View>
                <View>
                  <Text style={{ fontWeight: "600", fontSize: 16, color: "white", marginBottom: 4 }}>
                    {t("settings.safetyGuidelines")}
                  </Text>
                  <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14 }}>
                    Learn about safe challenges
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="rgba(255, 255, 255, 0.6)" />
            </Pressable>
          </View>

          {/* Account Actions */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "white" }}>
              {t("settings.accountActions")}
            </Text>
            <Pressable
              onPress={handleLogout}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 16,
                padding: 20,
                borderWidth: 2,
                borderColor: "#FF3B30",
              }}
            >
              <Text style={{ color: "#FF3B30", fontWeight: "600", fontSize: 16, textAlign: "center" }}>
                {t("settings.signOut")}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
