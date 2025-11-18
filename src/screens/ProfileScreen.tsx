import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView, Alert, TextInput, Image, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import {
  Settings,
  Shield,
  Zap,
  Video,
  Camera,
  Sparkles,
  Edit3,
  Save,
  X,
  Trophy,
  Flame,
  Star,
  Target,
  Award,
  TrendingUp,
  Upload,
  Users,
  Sun,
  Moon,
} from "lucide-react-native";
import type { BottomTabScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import { authClient } from "@/lib/authClient";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { GetProfileResponse, GetUserStatsResponse } from "@/shared/contracts";

type Props = BottomTabScreenProps<"ProfileTab">;

export default function ProfileScreen({ navigation }: Props) {
  const { data: sessionData } = useSession();
  const { colors, theme, setTheme, isDayMode } = useTheme();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<"quests" | "stats" | "about">("quests");
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userContext, setUserContext] = useState("");
  const [goals, setGoals] = useState("");
  const [interests, setInterests] = useState("");

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

  // Initialize state from profile data when it loads
  useEffect(() => {
    if (profileData) {
      setUserContext(profileData.userContext || "");
      setGoals(profileData.userGoals || "");
      // Convert interests array to comma-separated string for display
      setInterests(profileData.interests?.join(", ") || "");
    }
  }, [profileData]);

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (data: { userContext?: string; userGoals?: string; interests?: string[] }) => {
      return api.post("/api/profile", {
        displayName: profileData?.displayName || sessionData?.user?.email?.split("@")[0] || "Warrior",
        userContext: data.userContext,
        userGoals: data.userGoals,
        interests: data.interests,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setIsEditingAbout(false);
      Alert.alert("Success", "Your profile information has been saved!");
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to save profile. Please try again.");
    },
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

  const handleSaveContext = () => {
    // Convert interests string to array (split by comma and trim)
    const interestsArray = interests
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    saveProfileMutation.mutate({
      userContext: userContext.trim() || undefined,
      userGoals: goals.trim() || undefined,
      interests: interestsArray.length > 0 ? interestsArray : undefined,
    });
  };

  const handleUploadPhoto = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant camera roll permissions to upload photos.");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const imageUri = result.assets[0].uri;
      setShowAvatarModal(false);

      // Upload image to server
      const formData = new FormData();
      const filename = imageUri.split("/").pop() || "avatar.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("image", {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const uploadResponse = await fetch(`${process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL}/api/upload/image`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      const uploadData = await uploadResponse.json();
      const serverImageUrl = `${process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL}${uploadData.url}`;

      // Save the avatar URL to the profile
      await api.post("/api/profile", {
        displayName: profileData?.displayName || sessionData?.user?.email?.split("@")[0] || "Warrior",
        avatar: serverImageUrl,
      });

      // Refetch profile to show new avatar
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      Alert.alert("Success!", "Your profile picture has been uploaded and saved!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      Alert.alert("Error", "Failed to upload photo. Please try again.");
    }
  };

  const handleGenerateAvatar = async (style: string) => {
    setShowStyleModal(false);
    setShowAvatarModal(false);
    setIsGenerating(true);

    try {
      const response = await api.post<{ success: boolean; avatarUrl: string; message?: string }>(
        "/api/profile/generate-avatar",
        { style }
      );

      if (response.success && response.avatarUrl) {
        // The avatar URL is already a server URL, so we can use it directly
        const avatarUrl = response.avatarUrl.startsWith("http")
          ? response.avatarUrl
          : `${process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL}${response.avatarUrl}`;

        // Save the avatar to the profile
        await api.post("/api/profile", {
          displayName: profileData?.displayName || sessionData?.user?.email?.split("@")[0] || "Warrior",
          avatar: avatarUrl,
        });

        // Refetch profile to show new avatar
        queryClient.invalidateQueries({ queryKey: ["profile"] });

        Alert.alert("Success!", "Your AI avatar has been generated and saved!");
      } else {
        Alert.alert("Error", response.message || "Failed to generate avatar. Please try again.");
      }
    } catch (error) {
      console.error("Error generating avatar:", error);
      Alert.alert("Error", "Failed to generate avatar. Please check your OpenAI API key in the ENV tab.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!sessionData?.user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <Shield size={64} color={colors.primary} />
            <Text style={{ fontSize: 28, fontWeight: "bold", marginTop: 24, marginBottom: 16, textAlign: "center", color: colors.text }}>
              Your Profile
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 16, textAlign: "center", marginBottom: 32 }}>
              Sign in to view your profile, track your progress, and manage your account.
            </Text>
            <Pressable
              onPress={() => navigation.navigate("LoginModalScreen")}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 48,
                paddingVertical: 16,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 18 }}>Get Started</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (profileLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const username = profileData?.displayName || sessionData.user.email?.split("@")[0] || "Warrior";
  const level = Math.floor((statsData?.totalXP || 0) / 100) + 1;
  const xpProgress = ((statsData?.totalXP || 0) % 100) / 100;

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
      <LinearGradient colors={colors.background as any} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Hero Header with Gradient */}
            <View style={{ paddingBottom: 80, paddingTop: 20, paddingHorizontal: 20 }}>
              {/* Settings and Friends Buttons */}
            <View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <Pressable
                onPress={() => navigation.navigate("Friends")}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(0, 217, 255, 0.3)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(0, 217, 255, 0.5)",
                }}
              >
                <Users size={20} color="#00D9FF" />
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate("Settings")}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Settings size={20} color={colors.text} />
              </Pressable>
            </View>

            {/* Avatar & Level */}
            <View style={{ alignItems: "center" }}>
              <View style={{ position: "relative" }}>
                {/* Avatar with Glow */}
                <View
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: 70,
                    backgroundColor: colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 4,
                    borderColor: colors.text,
                    shadowColor: "#FFD700",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 20,
                    elevation: 10,
                    overflow: "hidden",
                  }}
                >
                  {profileData?.avatar ? (
                    <Image
                      source={{ uri: profileData.avatar }}
                      style={{ width: "100%", height: "100%", borderRadius: 70 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ fontSize: 64, fontWeight: "bold", color: colors.text }}>
                      {username.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>

                {/* Camera Button */}
                <Pressable
                  onPress={() => setShowAvatarModal(true)}
                  style={{
                    position: "absolute",
                    bottom: 5,
                    right: 5,
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 3,
                    borderColor: colors.text,
                  }}
                >
                  <Camera size={20} color={colors.text} />
                </Pressable>

                {/* Level Badge */}
                <View
                  style={{
                    position: "absolute",
                    top: -10,
                    right: -10,
                    backgroundColor: colors.warning,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 3,
                    borderColor: colors.text,
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  <Text style={{ color: colors.backgroundSolid, fontWeight: "900", fontSize: 16 }}>LV {level}</Text>
                </View>
              </View>

              {/* Username */}
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "900",
                  marginTop: 20,
                  color: colors.text,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  textShadowColor: colors.shadow,
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 4,
                }}
              >
                {username}
              </Text>

              {/* XP Progress Bar */}
              <View style={{ width: "80%", marginTop: 16 }}>
                <View
                  style={{
                    height: 8,
                    backgroundColor: colors.surface,
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: `${xpProgress * 100}%`,
                      height: "100%",
                      backgroundColor: colors.warning,
                    }}
                  />
                </View>
                <Text style={{ color: colors.text, fontSize: 12, textAlign: "center", marginTop: 6, fontWeight: "600" }}>
                  {(statsData?.totalXP || 0) % 100} / 100 XP to Level {level + 1}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={{ marginTop: -60, paddingHorizontal: 20 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {/* Streak Card */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 20,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.secondary + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Flame size={24} color={colors.secondary} />
                </View>
                <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.text }}>
                  {statsData?.currentStreak || 0}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "600" }}>Day Streak</Text>
              </View>

              {/* Quests Card */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 20,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.primary + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Target size={24} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.text }}>
                  {Math.floor((statsData?.totalPoints || 0) / 100)}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "600" }}>Quests Done</Text>
              </View>

              {/* Trophies Card */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 20,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.secondary + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Trophy size={24} color={colors.secondary} />
                </View>
                <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.text }}>
                  {statsData?.trophies || 0}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "600" }}>Trophies</Text>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colors.card,
              marginTop: 20,
              marginHorizontal: 20,
              borderRadius: 16,
              padding: 4,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Pressable
              onPress={() => setSelectedTab("quests")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: selectedTab === "quests" ? colors.primary : "transparent",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "700",
                  color: selectedTab === "quests" ? colors.text : colors.textSecondary,
                  fontSize: 14,
                }}
              >
                Quests
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedTab("stats")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: selectedTab === "stats" ? colors.primary : "transparent",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "700",
                  color: selectedTab === "stats" ? colors.text : colors.textSecondary,
                  fontSize: 14,
                }}
              >
                Stats
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedTab("about")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: selectedTab === "about" ? colors.primary : "transparent",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "700",
                  color: selectedTab === "about" ? colors.text : colors.textSecondary,
                  fontSize: 14,
                }}
              >
                About
              </Text>
            </Pressable>
          </View>

          {/* Tab Content */}
          {selectedTab === "quests" && (
            <View style={{ marginTop: 20, paddingHorizontal: 20, gap: 16 }}>
              {/* Live Streaming Card */}
              <LinearGradient
                colors={["#FF0000", "#FF4081"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, padding: 20 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Video size={24} color={colors.text} />
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text, flex: 1 }}>
                    Go Live
                  </Text>
                  <View
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: "700" }}>BETA</Text>
                  </View>
                </View>
                <Text style={{ color: colors.text, fontSize: 14, marginBottom: 16, lineHeight: 20 }}>
                  Stream your quest challenges live and connect with the rejection therapy community!
                </Text>
                <Pressable
                  onPress={() => navigation.navigate("LiveTab")}
                  style={{
                    backgroundColor: colors.text,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: colors.error, fontWeight: "bold", fontSize: 16 }}>Start Streaming</Text>
                </Pressable>
              </LinearGradient>

              {/* Quick Actions */}
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 16 }}>
                  Quick Actions
                </Text>
                <View style={{ gap: 12 }}>
                  <Pressable
                    onPress={() => navigation.navigate("Tabs", { screen: "HomeTab" })}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                      padding: 16,
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.primary + "20",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Zap size={20} color={colors.primary} />
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, flex: 1 }}>
                      View Active Quests
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => Alert.alert("Coming Soon", "Achievements feature is being developed!")}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                      padding: 16,
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.secondary + "20",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Award size={20} color={colors.secondary} />
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, flex: 1 }}>
                      View Achievements
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {selectedTab === "stats" && (
            <View style={{ marginTop: 20, paddingHorizontal: 20, gap: 16 }}>
              {/* Detailed Stats */}
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 20 }}>
                  Your Progress
                </Text>

                <View style={{ gap: 20 }}>
                  <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: "600" }}>Total XP</Text>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.primary }}>
                        {statsData?.totalXP || 0}
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 8,
                        backgroundColor: colors.surface,
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: `${Math.min(((statsData?.totalXP || 0) / 10000) * 100, 100)}%`,
                          height: "100%",
                          backgroundColor: colors.primary,
                        }}
                      />
                    </View>
                  </View>

                  <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: "600" }}>
                        Total Points
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: "#00D9FF" }}>
                        {statsData?.totalPoints || 0}
                      </Text>
                    </View>
                  </View>

                  <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: "600" }}>
                        Longest Streak
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.secondary }}>
                        {statsData?.longestStreak || 0} days
                      </Text>
                    </View>
                  </View>

                  <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: "600" }}>Diamonds</Text>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: "#00D9FF" }}>
                        {statsData?.diamonds || 0}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Rank Card */}
              <LinearGradient
                colors={["#FFD700", "#FFA500"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 20 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TrendingUp size={32} color={colors.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 24, fontWeight: "900", color: colors.text, marginBottom: 4 }}>
                      #{Math.floor(Math.random() * 1000) + 1}
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.text, fontWeight: "600" }}>
                      Global Ranking
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Growth Zone Progress */}
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 16 }}>
                  Growth Zone Progress
                </Text>

                {/* Confidence Meter */}
                <View style={{ marginBottom: 24 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: "600" }}>
                      Confidence Meter
                    </Text>
                      <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.warning }}>
                        {statsData?.confidenceLevel || 50}%
                      </Text>
                  </View>
                  <View
                    style={{
                      height: 12,
                      backgroundColor: colors.surface,
                      borderRadius: 6,
                      overflow: "hidden",
                    }}
                  >
                    <LinearGradient
                      colors={["#FF6B35", "#FFD700", "#4CAF50"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        width: `${statsData?.confidenceLevel || 50}%`,
                        height: "100%",
                      }}
                    />
                  </View>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6, opacity: 0.7 }}>
                    Keep pushing your limits to increase confidence
                  </Text>
                </View>

                {/* Zone Distribution */}
                <View style={{ gap: 16 }}>
                  {/* Easy Zone */}
                  <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: "rgba(76, 175, 80, 0.2)",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ fontSize: 16 }}>😊</Text>
                        </View>
                        <Text style={{ fontSize: 14, color: colors.text, fontWeight: "600", opacity: 0.8 }}>
                          Easy Zone
                        </Text>
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.success }}>
                        {statsData?.easyZoneCount || 0}
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 6,
                        backgroundColor: colors.surface,
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: `${Math.min(((statsData?.easyZoneCount || 0) / 10) * 100, 100)}%`,
                          height: "100%",
                          backgroundColor: colors.success,
                        }}
                      />
                    </View>
                  </View>

                  {/* Growth Zone */}
                  <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: "rgba(255, 215, 0, 0.2)",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ fontSize: 16 }}>💪</Text>
                        </View>
                        <Text style={{ fontSize: 14, color: colors.text, fontWeight: "600", opacity: 0.8 }}>
                          Growth Zone
                        </Text>
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.warning }}>
                        {statsData?.growthZoneCount || 0}
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 6,
                        backgroundColor: colors.surface,
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: `${Math.min(((statsData?.growthZoneCount || 0) / 10) * 100, 100)}%`,
                          height: "100%",
                          backgroundColor: colors.warning,
                        }}
                      />
                    </View>
                  </View>

                  {/* Fear Zone */}
                  <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: "rgba(255, 107, 53, 0.2)",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ fontSize: 16 }}>🔥</Text>
                        </View>
                        <Text style={{ fontSize: 14, color: colors.text, fontWeight: "600", opacity: 0.8 }}>
                          Fear Zone
                        </Text>
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.secondary }}>
                        {statsData?.fearZoneCount || 0}
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 6,
                        backgroundColor: colors.surface,
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: `${Math.min(((statsData?.fearZoneCount || 0) / 10) * 100, 100)}%`,
                          height: "100%",
                          backgroundColor: colors.secondary,
                        }}
                      />
                    </View>
                  </View>
                </View>

                {/* Motivational Message */}
                <View
                  style={{
                    marginTop: 20,
                    padding: 16,
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20, textAlign: "center" }}>
                    {(statsData?.fearZoneCount || 0) > (statsData?.easyZoneCount || 0)
                      ? "🚀 Amazing! You're crushing your fears and growing every day!"
                      : "💡 Challenge yourself more! The Fear Zone is where real growth happens."}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {selectedTab === "about" && (
            <View style={{ marginTop: 20, paddingHorizontal: 20, gap: 16 }}>
              {/* Theme Toggle Card */}
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.primary + "20",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isDayMode ? <Sun size={20} color={colors.primary} /> : <Moon size={20} color={colors.primary} />}
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text }}>
                      App Theme
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 }}>
                  Switch between Day and Night mode to customize your experience
                </Text>

                {/* Theme Toggle Buttons */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Pressable
                    onPress={() => setTheme("day")}
                    style={{
                      flex: 1,
                      backgroundColor: theme === "day" ? colors.primary : colors.surface,
                      paddingVertical: 16,
                      borderRadius: 12,
                      alignItems: "center",
                      borderWidth: 2,
                      borderColor: theme === "day" ? colors.primary : colors.cardBorder,
                    }}
                  >
                    <Sun size={24} color={theme === "day" ? colors.text : colors.textSecondary} />
                    <Text
                      style={{
                        color: theme === "day" ? colors.text : colors.textSecondary,
                        fontSize: 14,
                        fontWeight: "700",
                        marginTop: 8,
                      }}
                    >
                      Day
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setTheme("night")}
                    style={{
                      flex: 1,
                      backgroundColor: theme === "night" ? colors.primary : colors.surface,
                      paddingVertical: 16,
                      borderRadius: 12,
                      alignItems: "center",
                      borderWidth: 2,
                      borderColor: theme === "night" ? colors.primary : colors.cardBorder,
                    }}
                  >
                    <Moon size={24} color={theme === "night" ? colors.text : colors.textSecondary} />
                    <Text
                      style={{
                        color: theme === "night" ? colors.text : colors.textSecondary,
                        fontSize: 14,
                        fontWeight: "700",
                        marginTop: 8,
                      }}
                    >
                      Night
                    </Text>
                  </Pressable>
                </View>

                {/* Current Theme Indicator */}
                <View
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: colors.cardBorder,
                  }}
                >
                  <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: "center" }}>
                    Current theme: <Text style={{ fontWeight: "700", color: colors.primary }}>
                      {theme === "day" ? "Day Mode" : "Night Mode"}
                    </Text>
                  </Text>
                </View>
              </View>

              {/* User Context Card */}
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.primary + "20",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Sparkles size={20} color={colors.primary} />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text }}>
                      AI Quest Context
                    </Text>
                  </View>
                  <Pressable onPress={() => setIsEditingAbout(!isEditingAbout)}>
                    {isEditingAbout ? (
                      <X size={24} color={colors.textSecondary} />
                    ) : (
                      <Edit3 size={20} color={colors.primary} />
                    )}
                  </Pressable>
                </View>

                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 }}>
                  Tell Ben about yourself to get personalized quests tailored to your goals and interests!
                </Text>

                {isEditingAbout ? (
                  <View style={{ gap: 16 }}>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
                        About You
                      </Text>
                      <TextInput
                        value={userContext}
                        onChangeText={setUserContext}
                        placeholder="e.g., I'm a software developer looking to network..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        numberOfLines={3}
                        style={{
                          backgroundColor: colors.surface,
                          borderRadius: 12,
                          padding: 16,
                          fontSize: 16,
                          color: colors.text,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                          textAlignVertical: "top",
                          minHeight: 100,
                        }}
                      />
                    </View>

                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
                        Your Goals
                      </Text>
                      <TextInput
                        value={goals}
                        onChangeText={setGoals}
                        placeholder="e.g., Get more confident in public speaking..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        numberOfLines={3}
                        style={{
                          backgroundColor: colors.surface,
                          borderRadius: 12,
                          padding: 16,
                          fontSize: 16,
                          color: colors.text,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                          textAlignVertical: "top",
                          minHeight: 100,
                        }}
                      />
                    </View>

                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
                        Interests & Hobbies
                      </Text>
                      <TextInput
                        value={interests}
                        onChangeText={setInterests}
                        placeholder="e.g., Fitness, startups, travel, music..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        numberOfLines={2}
                        style={{
                          backgroundColor: colors.surface,
                          borderRadius: 12,
                          padding: 16,
                          fontSize: 16,
                          color: colors.text,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                          textAlignVertical: "top",
                          minHeight: 80,
                        }}
                      />
                    </View>

                    <Pressable
                      onPress={handleSaveContext}
                      disabled={saveProfileMutation.isPending}
                      style={{
                        backgroundColor: saveProfileMutation.isPending ? colors.surface : colors.primary,
                        paddingVertical: 16,
                        borderRadius: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        opacity: saveProfileMutation.isPending ? 0.6 : 1,
                      }}
                    >
                      {saveProfileMutation.isPending ? (
                        <ActivityIndicator size="small" color={colors.text} />
                      ) : (
                        <Save size={20} color={colors.text} />
                      )}
                      <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 16 }}>
                        {saveProfileMutation.isPending ? "Saving..." : "Save Context"}
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 4 }}>
                        About You
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
                        {userContext || "No information added yet"}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 4 }}>
                        Your Goals
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
                        {goals || "No goals added yet"}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 4 }}>
                        Interests
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
                        {interests || "No interests added yet"}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Account Info */}
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 16 }}>
                  Account Info
                </Text>
                <View style={{ gap: 12 }}>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginBottom: 4 }}>
                      Email
                    </Text>
                    <Text style={{ fontSize: 16, color: colors.text }}>{sessionData.user.email}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginBottom: 4 }}>
                      Member Since
                    </Text>
                    <Text style={{ fontSize: 16, color: colors.text }}>
                      {new Date(sessionData.user.createdAt || Date.now()).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Sign Out */}
              <Pressable
                onPress={handleLogout}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 2,
                  borderColor: "#FF3B30",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#FF3B30", fontWeight: "bold", fontSize: 16 }}>Sign Out</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      </LinearGradient>

      {/* Avatar Modal */}
      <Modal visible={showAvatarModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: colors.modalOverlay, justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: 40,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <Text style={{ fontSize: 22, fontWeight: "bold", color: colors.text }}>Choose Avatar</Text>
              <Pressable onPress={() => setShowAvatarModal(false)}>
                <X size={28} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={{ gap: 16 }}>
              <Pressable
                onPress={handleUploadPhoto}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  padding: 20,
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.primary + "20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Upload size={28} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
                    Upload Photo
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                    Choose from gallery or take a photo
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowAvatarModal(false);
                  setShowStyleModal(true);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  padding: 20,
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: colors.primary,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.primary + "20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Sparkles size={28} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
                      Generate AI Avatar
                    </Text>
                    <View
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: "900", color: colors.text }}>NEW</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                    Create a gaming-style avatar with AI
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Style Selection Modal */}
      <Modal visible={showStyleModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: colors.modalOverlay, justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: 40,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <Text style={{ fontSize: 22, fontWeight: "bold", color: colors.text }}>Choose Avatar Style</Text>
              <Pressable onPress={() => setShowStyleModal(false)}>
                <X size={28} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 500 }}>
              <View style={{ gap: 12 }}>
                {[
                  { style: "gaming", icon: "🎮", title: "Gaming Warrior", desc: "Epic futuristic warrior with neon glow" },
                  { style: "anime", icon: "⚡", title: "Anime Hero", desc: "Bold anime character with determined look" },
                  { style: "warrior", icon: "⚔️", title: "Fantasy Warrior", desc: "Powerful warrior with glowing armor" },
                  { style: "ninja", icon: "🥷", title: "Stealth Ninja", desc: "Mysterious ninja in action pose" },
                  { style: "mage", icon: "🔮", title: "Mystical Mage", desc: "Wizard casting magical spells" },
                  { style: "cyborg", icon: "🤖", title: "Cyberpunk Cyborg", desc: "Half human, half machine with neon lights" },
                  { style: "fantasy", icon: "✨", title: "Fantasy Hero", desc: "Magical character with glowing aura" },
                  { style: "realistic", icon: "👤", title: "Realistic Photo", desc: "Professional photorealistic portrait" },
                ].map((item) => (
                  <Pressable
                    key={item.style}
                    onPress={() => handleGenerateAvatar(item.style)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                      padding: 16,
                      backgroundColor: colors.surface,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: colors.primary + "20",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 2 }}>
                        {item.title}
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.textSecondary }}>{item.desc}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Loading Modal */}
      {isGenerating && (
        <Modal visible transparent>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.modalOverlay,
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
            }}
          >
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 24,
                padding: 32,
                alignItems: "center",
                width: "100%",
                maxWidth: 300,
              }}
            >
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginTop: 24, textAlign: "center" }}>
                Generating Your Avatar
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: "center" }}>
                This may take 10-20 seconds...
              </Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
