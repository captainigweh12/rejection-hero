import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView, TextInput, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Settings, Shield, Zap, Video, Bell, Globe, Sun, ChevronRight } from "lucide-react-native";
import type { BottomTabScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import { authClient } from "@/lib/authClient";
import type { GetProfileResponse, GetUserStatsResponse } from "@/shared/contracts";

type Props = BottomTabScreenProps<"ProfileTab">;

export default function ProfileScreen({ navigation }: Props) {
  const { data: sessionData } = useSession();
  const [selectedTab, setSelectedTab] = useState<"quests" | "journals" | "about">("quests");
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [questReminders, setQuestReminders] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const { data: profileData, isLoading: profileLoading } = useQuery<GetProfileResponse>({
    queryKey: ["profile"],
    queryFn: async () => {
      return api.get<GetProfileResponse>("/api/profile");
    },
    enabled: !!sessionData?.user,
  });

  const { data: statsData } = useQuery<GetUserStatsResponse>({
    queryKey: ["stats"],
    queryFn: async () => {
      return api.get<GetUserStatsResponse>("/api/stats");
    },
    enabled: !!sessionData?.user,
  });

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
          },
        },
      ]
    );
  };

  const handleConnectYouTube = () => {
    if (!youtubeUrl.trim()) {
      Alert.alert("Missing URL", "Please enter your YouTube channel URL");
      return;
    }
    Alert.alert("Success", "YouTube channel connected! You can now go live.");
    setYoutubeUrl("");
  };

  if (!sessionData?.user) {
    return (
      <View style={{ flex: 1, backgroundColor: "#E8E9ED" }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <Shield size={64} color="#FF6B35" />
            <Text style={{ fontSize: 28, fontWeight: "bold", marginTop: 24, marginBottom: 16, textAlign: "center" }}>
              Your Profile
            </Text>
            <Text style={{ color: "#666", fontSize: 16, textAlign: "center", marginBottom: 32 }}>
              Sign in to view your profile, track your progress, and manage your account.
            </Text>
            <Pressable
              onPress={() => navigation.navigate("LoginModalScreen")}
              style={{
                backgroundColor: "#FF6B35",
                paddingHorizontal: 48,
                paddingVertical: 16,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>Get Started</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (profileLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#E8E9ED" }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#FF6B35" />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const username = sessionData.user.email?.split("@")[0] || "User";
  const level = Math.floor((statsData?.totalXP || 0) / 100) + 1;

  return (
    <>
      <View style={{ flex: 1, backgroundColor: "#E8E9ED" }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* Header */}
          <View style={{ backgroundColor: "white", paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#E0E0E0" }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", textAlign: "center" }}>Profile</Text>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Profile Header */}
          <View style={{ backgroundColor: "white", paddingVertical: 32, paddingHorizontal: 20 }}>
            {/* Online Status & Settings */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#4CAF50" }} />
                <Text style={{ color: "#666", fontSize: 14 }}>Online</Text>
              </View>
              <Pressable onPress={() => {
                console.log('[ProfileScreen] Settings cog clicked');
                setShowSettings(true);
              }}>
                <Settings size={24} color="#333" />
              </Pressable>
            </View>

            {/* Avatar & Badges */}
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <View style={{ position: "relative" }}>
                {/* Admin Badge */}
                <View style={{ position: "absolute", top: 0, left: -90, backgroundColor: "#7E3FE4", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Shield size={16} color="white" />
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>Admin</Text>
                </View>

                {/* Avatar */}
                <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: "#DDD", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 48, fontWeight: "bold", color: "#333" }}>
                    {username.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Level Badge */}
                <View style={{ position: "absolute", top: 0, right: -90, backgroundColor: "#FF9500", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999 }}>
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>LV. {level}</Text>
                </View>
              </View>

              {/* Username */}
              <Text style={{ fontSize: 28, fontWeight: "bold", marginTop: 16, textTransform: "uppercase" }}>
                {username}
              </Text>
            </View>

            {/* Stats */}
            <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 16 }}>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 32, fontWeight: "bold", color: "#FF6B35" }}>
                  {statsData?.totalPoints || 0}
                </Text>
                <Text style={{ color: "#666", fontSize: 14, marginTop: 4 }}>Quests</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 32, fontWeight: "bold", color: "#FF6B35" }}>{level}</Text>
                <Text style={{ color: "#666", fontSize: 14, marginTop: 4 }}>Level</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 32, fontWeight: "bold", color: "#FF6B35" }}>
                  {statsData?.currentStreak || 0}
                </Text>
                <Text style={{ color: "#666", fontSize: 14, marginTop: 4 }}>Streak</Text>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <View style={{ flexDirection: "row", backgroundColor: "white", marginTop: 8, borderBottomWidth: 2, borderBottomColor: "#E0E0E0" }}>
            <Pressable
              onPress={() => setSelectedTab("quests")}
              style={{ flex: 1, paddingVertical: 16, borderBottomWidth: 3, borderBottomColor: selectedTab === "quests" ? "#FF6B35" : "transparent" }}
            >
              <Text style={{ textAlign: "center", fontWeight: "600", color: selectedTab === "quests" ? "#FF6B35" : "#666" }}>
                Quests
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedTab("journals")}
              style={{ flex: 1, paddingVertical: 16, borderBottomWidth: 3, borderBottomColor: selectedTab === "journals" ? "#FF6B35" : "transparent" }}
            >
              <Text style={{ textAlign: "center", fontWeight: "600", color: selectedTab === "journals" ? "#FF6B35" : "#666" }}>
                Journals
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedTab("about")}
              style={{ flex: 1, paddingVertical: 16, borderBottomWidth: 3, borderBottomColor: selectedTab === "about" ? "#FF6B35" : "transparent" }}
            >
              <Text style={{ textAlign: "center", fontWeight: "600", color: selectedTab === "about" ? "#FF6B35" : "#666" }}>
                About
              </Text>
            </Pressable>
          </View>

          {/* Tab Content */}
          {selectedTab === "quests" && (
            <View style={{ marginTop: 16, paddingHorizontal: 20 }}>
              {/* Featured Quests */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Zap size={20} color="#333" />
                <Text style={{ fontSize: 18, fontWeight: "bold" }}>Featured Quests</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                {[1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={{
                      width: 220,
                      marginRight: 12,
                      borderRadius: 16,
                      overflow: "hidden",
                      borderWidth: 2,
                      borderColor: "#FF6B35",
                    }}
                  >
                    <View style={{ height: 140, backgroundColor: "#333" }} />
                    <View style={{ padding: 12, backgroundColor: "white" }}>
                      <Text style={{ fontWeight: "bold", fontSize: 14 }}>
                        {i === 1 ? "Share Your Account" : i === 2 ? "Start Conversation" : "Speak Up in Class"}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Live Streaming Section */}
              <View style={{ backgroundColor: "white", borderRadius: 16, padding: 20, marginBottom: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Video size={24} color="#FF0000" />
                  <Text style={{ fontSize: 18, fontWeight: "bold" }}>Live Streaming</Text>
                </View>
                <Text style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
                  Stream your quest journey live and share your rejection challenges with the community in real-time!
                </Text>
                <Pressable
                  onPress={() => navigation.navigate("LiveTab")}
                  style={{
                    backgroundColor: "#FF0000",
                    paddingVertical: 14,
                    borderRadius: 8,
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Go Live Now</Text>
                </Pressable>
                <Text style={{ color: "#999", fontSize: 12, textAlign: "center" }}>
                  Powered by Daily.co • Connect quests to your streams
                </Text>
              </View>
            </View>
          )}

          {selectedTab === "journals" && (
            <View style={{ marginTop: 16, paddingHorizontal: 20 }}>
              <View style={{ backgroundColor: "white", borderRadius: 16, padding: 32, alignItems: "center" }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>No Journals Yet</Text>
                <Text style={{ color: "#666", textAlign: "center" }}>
                  Complete quests and write about your experiences to build your rejection journal.
                </Text>
              </View>
            </View>
          )}

          {selectedTab === "about" && (
            <View style={{ marginTop: 16, paddingHorizontal: 20 }}>
              <View style={{ backgroundColor: "white", borderRadius: 16, padding: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>Email</Text>
                <Text style={{ color: "#666", marginBottom: 16 }}>{sessionData.user.email}</Text>

                <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>Member Since</Text>
                <Text style={{ color: "#666", marginBottom: 16 }}>
                  {new Date(sessionData.user.createdAt || Date.now()).toLocaleDateString()}
                </Text>

                <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>Total XP</Text>
                <Text style={{ color: "#666", marginBottom: 24 }}>{statsData?.totalXP || 0}</Text>

                <Pressable
                  onPress={handleLogout}
                  style={{
                    backgroundColor: "#FF3B30",
                    paddingVertical: 14,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Sign Out</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>

    {/* Settings Modal */}
    {showSettings && (
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000 }}>
        <Pressable style={{ flex: 1 }} onPress={() => {
          console.log('[ProfileScreen] Backdrop pressed - closing settings');
          setShowSettings(false);
        }} />
        <View style={{ backgroundColor: "#E8E9ED", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20, maxHeight: "80%" }}>
          <View style={{ backgroundColor: "white", paddingVertical: 16, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>Settings</Text>
            <Pressable onPress={() => {
              console.log('[ProfileScreen] Close button pressed');
              setShowSettings(false);
            }}>
              <Text style={{ fontSize: 24 }}>×</Text>
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
                {/* Account Section */}
                <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <Text style={{ fontSize: 28, fontWeight: "bold", color: "#000" }}>Account</Text>
                    <Pressable onPress={() => setShowSettings(false)}>
                      <Text style={{ fontSize: 28 }}>×</Text>
                    </Pressable>
                  </View>
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
                <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
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
                        setShowSettings(false);
                        navigation.navigate("LiveTab");
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
          </View>
        </View>
      )}
    </>
  );
}
