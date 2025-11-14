import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Video, Bell, Globe, Sun, ChevronRight, Shield } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { authClient } from "@/lib/authClient";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  const [darkMode, setDarkMode] = useState(true);
  const [questReminders, setQuestReminders] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
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
    <View style={{ flex: 1, backgroundColor: "#E8E9ED" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Account Section */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text style={{ fontSize: 28, fontWeight: "bold", color: "#000", marginBottom: 16 }}>Account</Text>
          </View>

          {/* Appearance */}
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#000" }}>Appearance</Text>
            <View style={{ backgroundColor: "white", borderRadius: 12, padding: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Sun size={24} color="#333" />
                  <View>
                    <Text style={{ fontWeight: "600", fontSize: 16 }}>Theme</Text>
                    <Text style={{ color: "#999", fontSize: 14 }}>Light Mode</Text>
                  </View>
                </View>
                <Switch value={darkMode} onValueChange={setDarkMode} />
              </View>
            </View>
          </View>

          {/* Live Features */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#000" }}>Live Features</Text>
            <View style={{ backgroundColor: "white", borderRadius: 12, padding: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                <Video size={24} color="#333" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", fontSize: 16, marginBottom: 4 }}>Enable Live</Text>
                  <Text style={{ color: "#999", fontSize: 14 }}>
                    Configure backend and unlock livestreaming features
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
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#000" }}>Preferences</Text>
            <Pressable style={{ backgroundColor: "white", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Globe size={24} color="#333" />
                <View>
                  <Text style={{ fontWeight: "600", fontSize: 16 }}>Language</Text>
                  <Text style={{ color: "#999", fontSize: 14 }}>English</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#999" />
            </Pressable>
          </View>

          {/* Notifications */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#000" }}>Notifications</Text>
            <View style={{ backgroundColor: "white", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                <Bell size={24} color="#333" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", fontSize: 16 }}>Quest Reminders</Text>
                  <Text style={{ color: "#999", fontSize: 14 }}>Get notified to complete daily quests</Text>
                </View>
              </View>
              <Switch value={questReminders} onValueChange={setQuestReminders} />
            </View>
          </View>

          {/* Legal */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#000" }}>Legal</Text>
            <Pressable style={{ backgroundColor: "white", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Shield size={24} color="#333" />
                <View>
                  <Text style={{ fontWeight: "600", fontSize: 16 }}>Safety Guidelines</Text>
                  <Text style={{ color: "#999", fontSize: 14 }}>Read important safety information</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#999" />
            </Pressable>
          </View>

          {/* Account Actions */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#000" }}>Account</Text>
            <Pressable
              onPress={handleLogout}
              style={{ backgroundColor: "white", borderRadius: 12, padding: 16 }}
            >
              <Text style={{ color: "#FF3B30", fontWeight: "600", fontSize: 16, textAlign: "center" }}>
                Sign Out
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
