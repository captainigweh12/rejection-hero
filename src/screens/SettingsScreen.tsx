import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Switch, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Video, Bell, Globe, Sun, ChevronRight, Shield, Check } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { authClient } from "@/lib/authClient";
import { useI18n, LANGUAGES, type Language } from "@/lib/i18n";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  const { language, setLanguage, t } = useI18n();
  const [darkMode, setDarkMode] = useState(true);
  const [questReminders, setQuestReminders] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const handleLanguageSelect = async (lang: Language) => {
    await setLanguage(lang);
    setShowLanguageModal(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      t.signOut,
      "Are you sure you want to sign out?",
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.signOut,
          style: "destructive",
          onPress: async () => {
            await authClient.signOut();
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <>
      <View style={{ flex: 1, backgroundColor: "#E8E9ED" }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
            {/* Account Section */}
            <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
              <Text style={{ fontSize: 28, fontWeight: "bold", color: "#000", marginBottom: 16 }}>{t.account}</Text>
            </View>

            {/* Appearance */}
            <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#000" }}>{t.appearance}</Text>
              <View style={{ backgroundColor: "white", borderRadius: 12, padding: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Sun size={24} color="#333" />
                    <View>
                      <Text style={{ fontWeight: "600", fontSize: 16 }}>{t.theme}</Text>
                      <Text style={{ color: "#999", fontSize: 14 }}>{darkMode ? t.darkMode : t.lightMode}</Text>
                    </View>
                  </View>
                  <Switch value={darkMode} onValueChange={setDarkMode} />
                </View>
              </View>
            </View>

            {/* Live Features */}
            <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#000" }}>{t.liveFeatures}</Text>
              <View style={{ backgroundColor: "white", borderRadius: 12, padding: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                  <Video size={24} color="#333" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "600", fontSize: 16, marginBottom: 4 }}>{t.enableLive}</Text>
                    <Text style={{ color: "#999", fontSize: 14 }}>
                      {t.enableLiveDesc}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    navigation.goBack();
                    // Navigate to Live tab after going back
                    setTimeout(() => {
                      (navigation as any).navigate("Tabs", { screen: "LiveTab" });
                    }, 100);
                  }}
                  style={{
                    backgroundColor: "#FF6B35",
                    paddingVertical: 14,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Enable</Text>
                </Pressable>
              </View>
            </View>

            {/* Preferences */}
            <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#000" }}>{t.preferences}</Text>
              <Pressable
                onPress={() => setShowLanguageModal(true)}
                style={{ backgroundColor: "white", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Globe size={24} color="#333" />
                  <View>
                    <Text style={{ fontWeight: "600", fontSize: 16 }}>{t.language}</Text>
                    <Text style={{ color: "#999", fontSize: 14 }}>
                      {LANGUAGES[language].flag} {LANGUAGES[language].nativeName}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#999" />
              </Pressable>
            </View>

            {/* Notifications */}
            <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#000" }}>{t.notifications}</Text>
              <View style={{ backgroundColor: "white", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                  <Bell size={24} color="#333" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "600", fontSize: 16 }}>{t.questReminders}</Text>
                    <Text style={{ color: "#999", fontSize: 14 }}>{t.questRemindersDesc}</Text>
                  </View>
                </View>
                <Switch value={questReminders} onValueChange={setQuestReminders} />
              </View>
            </View>

            {/* Legal */}
            <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#000" }}>{t.legal}</Text>
              <Pressable style={{ backgroundColor: "white", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Shield size={24} color="#333" />
                  <View>
                    <Text style={{ fontWeight: "600", fontSize: 16 }}>{t.safetyGuidelines}</Text>
                    <Text style={{ color: "#999", fontSize: 14 }}>{t.safetyGuidelinesDesc}</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#999" />
              </Pressable>
            </View>

            {/* Account Actions */}
            <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#000" }}>{t.account}</Text>
              <Pressable
                onPress={handleLogout}
                style={{ backgroundColor: "white", borderRadius: 12, padding: 16 }}
              >
                <Text style={{ color: "#FF3B30", fontWeight: "600", fontSize: 16, textAlign: "center" }}>
                  {t.signOut}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <Pressable
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={() => setShowLanguageModal(false)}
          />
          <View style={{ backgroundColor: "white", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%" }}>
            {/* Header */}
            <View style={{ paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#E0E0E0" }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 20, fontWeight: "bold" }}>{t.language}</Text>
                <Pressable onPress={() => setShowLanguageModal(false)}>
                  <Text style={{ fontSize: 28, color: "#666" }}>×</Text>
                </Pressable>
              </View>
            </View>

            {/* Language List */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
              {(Object.keys(LANGUAGES) as Language[]).map((lang) => {
                const langInfo = LANGUAGES[lang];
                const isSelected = language === lang;

                return (
                  <Pressable
                    key={lang}
                    onPress={() => handleLanguageSelect(lang)}
                    style={{
                      paddingVertical: 16,
                      paddingHorizontal: 20,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: isSelected ? "#FFF5F2" : "white",
                      borderBottomWidth: 1,
                      borderBottomColor: "#F0F0F0",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <Text style={{ fontSize: 28 }}>{langInfo.flag}</Text>
                      <View>
                        <Text style={{ fontSize: 16, fontWeight: isSelected ? "600" : "400", color: "#000" }}>
                          {langInfo.nativeName}
                        </Text>
                        <Text style={{ fontSize: 14, color: "#999" }}>{langInfo.name}</Text>
                      </View>
                    </View>
                    {isSelected && <Check size={24} color="#FF6B35" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
