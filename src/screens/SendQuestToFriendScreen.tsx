import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Send } from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";

type Props = NativeStackScreenProps<RootStackParamList, "SendQuestToFriend">;

interface UserQuest {
  id: string;
  questId: string;
  status: string;
  quest: {
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    xpReward: number;
    pointReward: number;
  };
}

export default function SendQuestToFriendScreen({ navigation, route }: Props) {
  const { friendId, friendName } = route.params;
  const { colors } = useTheme();
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  // Fetch user's completed quests
  const { data: questsData, isLoading } = useQuery({
    queryKey: ["quests"],
    queryFn: async () => {
      const response = await api.get<{
        activeQuests: UserQuest[];
        queuedQuests: UserQuest[];
        completedQuests: UserQuest[];
      }>("/api/quests");
      return response;
    },
  });

  // Share quest mutation
  const shareQuestMutation = useMutation({
    mutationFn: async () => {
      if (!selectedQuestId) {
        throw new Error("Please select a quest");
      }
      return api.post("/api/shared-quests/share", {
        friendId,
        questId: selectedQuestId,
        message: message.trim() || undefined,
      });
    },
    onSuccess: () => {
      Alert.alert("Success", `Quest sent to ${friendName}!`, [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to send quest");
    },
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      SALES: "#FF6B35",
      SOCIAL: "#00D9FF",
      ENTREPRENEURSHIP: "#7E3FE4",
      DATING: "#FF4081",
      CONFIDENCE: "#FFD700",
      CAREER: "#4CAF50",
    };
    return colors[category] || "#7E3FE4";
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      EASY: "#4CAF50",
      MEDIUM: "#FFD700",
      HARD: "#FF6B35",
      EXPERT: "#FF4081",
    };
    return colors[difficulty] || "#FFD700";
  };

  // Combine all quests (active, queued, and recently completed)
  const allQuests = [
    ...(questsData?.activeQuests || []),
    ...(questsData?.queuedQuests || []),
    ...(questsData?.completedQuests?.slice(0, 10) || []), // Last 10 completed quests
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
      <LinearGradient colors={colors.background as any} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ position: "absolute", left: 20 }}
            >
              <ChevronLeft size={28} color={colors.text} />
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}>
              Send Quest to {friendName}
            </Text>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
          >
            {/* Instructions */}
            <View
              style={{
                backgroundColor: "rgba(0, 217, 255, 0.1)",
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: "rgba(0, 217, 255, 0.3)",
              }}
            >
              <Text style={{ color: colors.info, fontSize: 16, fontWeight: "600", marginBottom: 8 }}>
                Challenge Your Friend!
              </Text>
              <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>
                Select a quest from your list to send to {friendName}. They can accept and compete with you!
              </Text>
            </View>

            {/* Optional Message */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text, marginBottom: 12 }}>
                Add a Message (Optional)
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="E.g., I bet you can't do this! 😎"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: colors.inputBackground,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.inputBorder,
                  textAlignVertical: "top",
                  minHeight: 80,
                }}
                maxLength={500}
              />
              <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 6, textAlign: "right" }}>
                {message.length}/500
              </Text>
            </View>

            {/* Quest Selection */}
            <View>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text, marginBottom: 12 }}>
                Select a Quest
              </Text>

              {isLoading ? (
                <View style={{ paddingVertical: 40, alignItems: "center" }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : allQuests.length === 0 ? (
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    padding: 32,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: "center" }}>
                    No quests available. Create or complete a quest first!
                  </Text>
                </View>
              ) : (
                allQuests.map((userQuest) => {
                  const quest = userQuest.quest;
                  const isSelected = selectedQuestId === quest.id;

                  return (
                    <Pressable
                      key={userQuest.id}
                      onPress={() => setSelectedQuestId(quest.id)}
                      style={{
                        backgroundColor: isSelected
                          ? colors.info + "20"
                          : colors.card,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 2,
                        borderColor: isSelected
                          ? colors.info + "50"
                          : colors.cardBorder,
                      }}
                    >
                      {/* Quest Title */}
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "bold",
                          color: colors.text,
                          marginBottom: 8,
                        }}
                      >
                        {quest.title}
                      </Text>

                      {/* Quest Description */}
                      <Text
                        style={{
                          fontSize: 14,
                          color: colors.textSecondary,
                          marginBottom: 12,
                          lineHeight: 20,
                        }}
                        numberOfLines={2}
                      >
                        {quest.description}
                      </Text>

                      {/* Category and Difficulty */}
                      <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                        <View
                          style={{
                            backgroundColor: getCategoryColor(quest.category),
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 8,
                          }}
                        >
                          <Text style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}>
                            {quest.category}
                          </Text>
                        </View>
                        <View
                          style={{
                            backgroundColor: getDifficultyColor(quest.difficulty),
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 8,
                          }}
                        >
                          <Text style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}>
                            {quest.difficulty}
                          </Text>
                        </View>
                      </View>

                      {/* Rewards */}
                      <View style={{ flexDirection: "row", gap: 12 }}>
                        <Text style={{ color: "#FFD700", fontSize: 13, fontWeight: "600" }}>
                          ⭐ {quest.xpReward} XP
                        </Text>
                        <Text style={{ color: "#00D9FF", fontSize: 13, fontWeight: "600" }}>
                          💎 {quest.pointReward} pts
                        </Text>
                      </View>

                      {/* Status Badge */}
                      {userQuest.status === "COMPLETED" && (
                        <View
                          style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            backgroundColor: "rgba(76, 175, 80, 0.3)",
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: "rgba(76, 175, 80, 0.5)",
                          }}
                        >
                          <Text style={{ color: "#4CAF50", fontSize: 11, fontWeight: "700" }}>
                            ✓ COMPLETED
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })
              )}
            </View>
          </ScrollView>

          {/* Send Button - Fixed at bottom */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: 32,
              backgroundColor: colors.backgroundSolid,
              borderTopWidth: 1,
              borderTopColor: colors.cardBorder,
            }}
          >
            <Pressable
              onPress={() => shareQuestMutation.mutate()}
              disabled={!selectedQuestId || shareQuestMutation.isPending}
              style={{
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: "center",
                overflow: "hidden",
                flexDirection: "row",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <LinearGradient
                colors={
                  !selectedQuestId
                    ? [colors.textTertiary, colors.textTertiary]
                    : shareQuestMutation.isPending
                    ? [colors.textTertiary, colors.textTertiary]
                    : [colors.info, colors.info + "CC"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              {shareQuestMutation.isPending ? (
                <>
                  <ActivityIndicator size="small" color={colors.text} />
                  <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 18 }}>
                    Sending...
                  </Text>
                </>
              ) : (
                <>
                  <Send size={22} color={colors.text} />
                  <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 18 }}>
                    Send Quest to {friendName}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
