import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Audio } from "expo-av";
import {
  Mic,
  MicOff,
  X,
  Send,
  Sparkles,
  Gift,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import type {
  CreateCustomQuestRequest,
  CreateCustomQuestResponse,
  GetUserStatsResponse,
} from "@/shared/contracts";
import Slider from "@react-native-community/slider";

type Props = RootStackScreenProps<"CreateCustomQuest">;

export default function CreateCustomQuestScreen({ route, navigation }: Props) {
  const { friendId, friendName } = route.params;
  const queryClient = useQueryClient();

  // State
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [textDescription, setTextDescription] = useState("");
  const [audioTranscript, setAudioTranscript] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Quest customization
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [category, setCategory] = useState("SOCIAL");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD" | "EXPERT">("MEDIUM");
  const [goalType, setGoalType] = useState<"COLLECT_NOS" | "COLLECT_YES" | "TAKE_ACTION">("COLLECT_NOS");
  const [goalCount, setGoalCount] = useState(5);

  // Gifting
  const [giftXP, setGiftXP] = useState(0);
  const [giftPoints, setGiftPoints] = useState(0);
  const [message, setMessage] = useState("");

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [showGoalTypeModal, setShowGoalTypeModal] = useState(false);

  // Get user stats for balance
  const { data: statsData } = useQuery<GetUserStatsResponse>({
    queryKey: ["stats"],
    queryFn: async () => api.get<GetUserStatsResponse>("/api/stats"),
  });

  const maxGiftXP = statsData?.totalXP || 0;
  const maxGiftPoints = statsData?.totalPoints || 0;

  // Create custom quest mutation
  const createQuestMutation = useMutation({
    mutationFn: async (data: CreateCustomQuestRequest) => {
      return api.post<CreateCustomQuestResponse>("/api/shared-quests/create-custom", data);
    },
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ["stats"] });
        queryClient.invalidateQueries({ queryKey: ["friends"] });

        Alert.alert(
          "Quest Created! 🎉",
          `Your custom quest has been sent to ${friendName}!${giftXP > 0 || giftPoints > 0 ? `\n\n💎 Gifted: ${giftXP} XP + ${giftPoints} Points` : ""}`,
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else if (!response.isSafe && response.safetyWarning) {
        Alert.alert("Quest Rejected ⚠️", response.safetyWarning);
      } else {
        Alert.alert("Error", response.message || "Failed to create quest");
      }
    },
    onError: (error: any) => {
      console.error("Create quest error:", error);
      Alert.alert("Error", error.message || "Failed to create custom quest");
    },
  });

  // Voice recording
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant microphone permission to record voice quests");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (!uri) {
        Alert.alert("Error", "Failed to save recording");
        return;
      }

      setIsTranscribing(true);

      // Transcribe audio using backend
      const formData = new FormData();
      formData.append("audio", {
        uri,
        type: "audio/m4a",
        name: "quest_voice.m4a",
      } as any);

      const response = await fetch(`${process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL}/api/journal/transcribe`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const result = await response.json();

      if (result.transcript) {
        setAudioTranscript(result.transcript);
        setInputMode("voice");
      } else {
        Alert.alert("Error", "Failed to transcribe audio");
      }
    } catch (error) {
      console.error("Failed to transcribe:", error);
      Alert.alert("Error", "Failed to transcribe audio");
    } finally {
      setIsTranscribing(false);
      setRecording(null);
    }
  };

  const handleCreateQuest = () => {
    const description = inputMode === "voice" ? audioTranscript : textDescription;

    if (!description.trim()) {
      Alert.alert("Missing Description", "Please provide a quest description via voice or text");
      return;
    }

    if (giftXP > maxGiftXP || giftPoints > maxGiftPoints) {
      Alert.alert(
        "Insufficient Balance",
        `You only have ${maxGiftXP} XP and ${maxGiftPoints} Points. Complete more quests to earn rewards!`
      );
      return;
    }

    createQuestMutation.mutate({
      friendId,
      audioTranscript: inputMode === "voice" ? audioTranscript : undefined,
      textDescription: inputMode === "text" ? textDescription : undefined,
      category: showAdvanced ? category : undefined,
      difficulty: showAdvanced ? difficulty : undefined,
      goalType: showAdvanced ? goalType : undefined,
      goalCount: showAdvanced ? goalCount : undefined,
      giftXP,
      giftPoints,
      message: message.trim() || undefined,
    });
  };

  const categories = [
    { value: "SOCIAL", label: "Social", color: "#00D9FF" },
    { value: "SALES", label: "Sales", color: "#FF6B35" },
    { value: "ENTREPRENEURSHIP", label: "Entrepreneurship", color: "#7E3FE4" },
    { value: "DATING", label: "Dating", color: "#FF4081" },
    { value: "CONFIDENCE", label: "Confidence", color: "#4CAF50" },
    { value: "CAREER", label: "Career", color: "#FFD700" },
  ];

  const difficulties = [
    { value: "EASY", label: "Easy", color: "#4CAF50" },
    { value: "MEDIUM", label: "Medium", color: "#FFD700" },
    { value: "HARD", label: "Hard", color: "#FF6B35" },
    { value: "EXPERT", label: "Expert", color: "#EF4444" },
  ];

  const goalTypes = [
    { value: "COLLECT_NOS", label: "Collect NOs", desc: "Track YES/NO responses" },
    { value: "COLLECT_YES", label: "Collect YESes", desc: "Track approvals" },
    { value: "TAKE_ACTION", label: "Take Action", desc: "Complete actions" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
      <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }}>
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingVertical: 16,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 28, fontWeight: "900", color: "white" }}>
                  Create Custom Quest
                </Text>
                <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)", marginTop: 4 }}>
                  For {friendName}
                </Text>
              </View>
              <Pressable
                onPress={() => navigation.goBack()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={24} color="white" />
              </Pressable>
            </View>

            {/* Balance Display */}
            <View
              style={{
                marginHorizontal: 20,
                marginBottom: 20,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "rgba(126, 63, 228, 0.3)",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Gift size={20} color="#FFD700" />
                <Text style={{ fontSize: 16, fontWeight: "700", color: "white", marginLeft: 8 }}>
                  Your Balance
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>XP</Text>
                  <Text style={{ fontSize: 24, fontWeight: "bold", color: "#7E3FE4" }}>
                    {maxGiftXP}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>Points</Text>
                  <Text style={{ fontSize: 24, fontWeight: "bold", color: "#00D9FF" }}>
                    {maxGiftPoints}
                  </Text>
                </View>
              </View>
              {maxGiftXP === 0 && maxGiftPoints === 0 && (
                <Text style={{ fontSize: 12, color: "#FF6B35", marginTop: 8 }}>
                  Complete quests to earn XP and Points for gifting!
                </Text>
              )}
            </View>

            {/* Input Mode Tabs */}
            <View
              style={{
                flexDirection: "row",
                marginHorizontal: 20,
                marginBottom: 20,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 12,
                padding: 4,
              }}
            >
              <Pressable
                onPress={() => setInputMode("text")}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: inputMode === "text" ? "#7E3FE4" : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: inputMode === "text" ? "white" : "rgba(255, 255, 255, 0.6)",
                    fontWeight: "700",
                  }}
                >
                  Text
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setInputMode("voice")}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: inputMode === "voice" ? "#7E3FE4" : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: inputMode === "voice" ? "white" : "rgba(255, 255, 255, 0.6)",
                    fontWeight: "700",
                  }}
                >
                  Voice
                </Text>
              </Pressable>
            </View>

            {/* Text Input */}
            {inputMode === "text" && (
              <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "white", marginBottom: 12 }}>
                  Quest Description
                </Text>
                <TextInput
                  value={textDescription}
                  onChangeText={setTextDescription}
                  placeholder="Describe the quest you want your friend to complete..."
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  multiline
                  numberOfLines={6}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 16,
                    padding: 16,
                    fontSize: 16,
                    color: "white",
                    borderWidth: 1,
                    borderColor: "rgba(126, 63, 228, 0.3)",
                    textAlignVertical: "top",
                    minHeight: 150,
                  }}
                />
                <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.4)", marginTop: 8 }}>
                  {textDescription.length} / 500 characters
                </Text>
              </View>
            )}

            {/* Voice Input */}
            {inputMode === "voice" && (
              <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "white", marginBottom: 12 }}>
                  Voice Recording
                </Text>

                {!audioTranscript && !isTranscribing && (
                  <Pressable
                    onPress={isRecording ? stopRecording : startRecording}
                    style={{
                      backgroundColor: isRecording ? "#EF4444" : "rgba(126, 63, 228, 0.2)",
                      borderRadius: 16,
                      padding: 32,
                      alignItems: "center",
                      borderWidth: 2,
                      borderColor: isRecording ? "#EF4444" : "#7E3FE4",
                    }}
                  >
                    {isRecording ? <MicOff size={48} color="white" /> : <Mic size={48} color="#7E3FE4" />}
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: "white",
                        marginTop: 16,
                      }}
                    >
                      {isRecording ? "Tap to Stop Recording" : "Tap to Record"}
                    </Text>
                    <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)", marginTop: 4 }}>
                      {isRecording ? "Recording..." : "Describe your quest idea"}
                    </Text>
                  </Pressable>
                )}

                {isTranscribing && (
                  <View
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 16,
                      padding: 32,
                      alignItems: "center",
                    }}
                  >
                    <ActivityIndicator size="large" color="#7E3FE4" />
                    <Text style={{ fontSize: 16, color: "white", marginTop: 16 }}>
                      Transcribing...
                    </Text>
                  </View>
                )}

                {audioTranscript && (
                  <View
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: "rgba(126, 63, 228, 0.3)",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#4CAF50" }}>
                        ✓ Transcribed
                      </Text>
                      <Pressable
                        onPress={() => {
                          setAudioTranscript("");
                          setInputMode("text");
                        }}
                      >
                        <Text style={{ fontSize: 14, color: "#7E3FE4" }}>Re-record</Text>
                      </Pressable>
                    </View>
                    <Text style={{ fontSize: 16, color: "white", lineHeight: 24 }}>
                      {audioTranscript}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Gift XP and Points */}
            {(maxGiftXP > 0 || maxGiftPoints > 0) && (
              <View
                style={{
                  marginHorizontal: 20,
                  marginBottom: 20,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "rgba(255, 215, 0, 0.3)",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                  <Gift size={24} color="#FFD700" />
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "white", marginLeft: 8 }}>
                    Gift Rewards
                  </Text>
                </View>

                {/* Gift XP */}
                {maxGiftXP > 0 && (
                  <View style={{ marginBottom: 24 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)" }}>
                        Gift XP
                      </Text>
                      <Text style={{ fontSize: 20, fontWeight: "bold", color: "#7E3FE4" }}>
                        {giftXP}
                      </Text>
                    </View>
                    <Slider
                      style={{ width: "100%", height: 40 }}
                      minimumValue={0}
                      maximumValue={maxGiftXP}
                      step={10}
                      value={giftXP}
                      onValueChange={setGiftXP}
                      minimumTrackTintColor="#7E3FE4"
                      maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                      thumbTintColor="#7E3FE4"
                    />
                  </View>
                )}

                {/* Gift Points */}
                {maxGiftPoints > 0 && (
                  <View>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)" }}>
                        Gift Points
                      </Text>
                      <Text style={{ fontSize: 20, fontWeight: "bold", color: "#00D9FF" }}>
                        {giftPoints}
                      </Text>
                    </View>
                    <Slider
                      style={{ width: "100%", height: 40 }}
                      minimumValue={0}
                      maximumValue={maxGiftPoints}
                      step={10}
                      value={giftPoints}
                      onValueChange={setGiftPoints}
                      minimumTrackTintColor="#00D9FF"
                      maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                      thumbTintColor="#00D9FF"
                    />
                  </View>
                )}

                <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.4)", marginTop: 12 }}>
                  💡 Your XP and Points will be deducted and added to the quest reward
                </Text>
              </View>
            )}

            {/* Advanced Options */}
            <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
              <Pressable
                onPress={() => setShowAdvanced(!showAdvanced)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Sparkles size={20} color="#7E3FE4" />
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "white", marginLeft: 8 }}>
                    Advanced Options
                  </Text>
                </View>
                {showAdvanced ? (
                  <ChevronUp size={20} color="rgba(255, 255, 255, 0.6)" />
                ) : (
                  <ChevronDown size={20} color="rgba(255, 255, 255, 0.6)" />
                )}
              </Pressable>

              {showAdvanced && (
                <View style={{ marginTop: 16, gap: 12 }}>
                  {/* Category */}
                  <Pressable
                    onPress={() => setShowCategoryModal(true)}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)" }}>
                      Category
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "white" }}>
                      {category}
                    </Text>
                  </Pressable>

                  {/* Difficulty */}
                  <Pressable
                    onPress={() => setShowDifficultyModal(true)}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)" }}>
                      Difficulty
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "white" }}>
                      {difficulty}
                    </Text>
                  </Pressable>

                  {/* Goal Type */}
                  <Pressable
                    onPress={() => setShowGoalTypeModal(true)}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)" }}>
                      Goal Type
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "white" }}>
                      {goalType.replace("_", " ")}
                    </Text>
                  </Pressable>

                  {/* Goal Count */}
                  <View
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)" }}>
                        Goal Count
                      </Text>
                      <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
                        {goalCount}
                      </Text>
                    </View>
                    <Slider
                      style={{ width: "100%", height: 40 }}
                      minimumValue={1}
                      maximumValue={20}
                      step={1}
                      value={goalCount}
                      onValueChange={setGoalCount}
                      minimumTrackTintColor="#7E3FE4"
                      maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                      thumbTintColor="#7E3FE4"
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Optional Message */}
            <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "white", marginBottom: 12 }}>
                Optional Message
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Add a personal note to your friend..."
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                multiline
                numberOfLines={3}
                maxLength={500}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 16,
                  padding: 16,
                  fontSize: 14,
                  color: "white",
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.3)",
                  textAlignVertical: "top",
                  minHeight: 80,
                }}
              />
            </View>
          </ScrollView>

          {/* Bottom Action Button */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: 20,
              paddingBottom: 40,
              backgroundColor: "#0A0A0F",
              borderTopWidth: 1,
              borderTopColor: "rgba(255, 255, 255, 0.1)",
            }}
          >
            <Pressable
              onPress={handleCreateQuest}
              disabled={createQuestMutation.isPending}
              style={{
                backgroundColor: createQuestMutation.isPending ? "rgba(126, 63, 228, 0.5)" : "#7E3FE4",
                borderRadius: 16,
                paddingVertical: 18,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {createQuestMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Send size={20} color="white" />
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "white" }}>
                    Create & Send Quest
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Category Modal */}
          <Modal visible={showCategoryModal} transparent animationType="slide">
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                justifyContent: "flex-end",
              }}
            >
              <View
                style={{
                  backgroundColor: "#1A1A24",
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: 24,
                  paddingBottom: 40,
                }}
              >
                <Text style={{ fontSize: 22, fontWeight: "bold", color: "white", marginBottom: 20 }}>
                  Select Category
                </Text>
                <View style={{ gap: 12 }}>
                  {categories.map((cat) => (
                    <Pressable
                      key={cat.value}
                      onPress={() => {
                        setCategory(cat.value);
                        setShowCategoryModal(false);
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        borderRadius: 12,
                        padding: 16,
                        borderWidth: category === cat.value ? 2 : 0,
                        borderColor: cat.color,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: cat.color,
                            marginRight: 12,
                          }}
                        />
                        <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
                          {cat.label}
                        </Text>
                      </View>
                      {category === cat.value && (
                        <Text style={{ fontSize: 20, color: cat.color }}>✓</Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </Modal>

          {/* Difficulty Modal */}
          <Modal visible={showDifficultyModal} transparent animationType="slide">
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                justifyContent: "flex-end",
              }}
            >
              <View
                style={{
                  backgroundColor: "#1A1A24",
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: 24,
                  paddingBottom: 40,
                }}
              >
                <Text style={{ fontSize: 22, fontWeight: "bold", color: "white", marginBottom: 20 }}>
                  Select Difficulty
                </Text>
                <View style={{ gap: 12 }}>
                  {difficulties.map((diff) => (
                    <Pressable
                      key={diff.value}
                      onPress={() => {
                        setDifficulty(diff.value as any);
                        setShowDifficultyModal(false);
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        borderRadius: 12,
                        padding: 16,
                        borderWidth: difficulty === diff.value ? 2 : 0,
                        borderColor: diff.color,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: diff.color,
                            marginRight: 12,
                          }}
                        />
                        <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
                          {diff.label}
                        </Text>
                      </View>
                      {difficulty === diff.value && (
                        <Text style={{ fontSize: 20, color: diff.color }}>✓</Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </Modal>

          {/* Goal Type Modal */}
          <Modal visible={showGoalTypeModal} transparent animationType="slide">
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                justifyContent: "flex-end",
              }}
            >
              <View
                style={{
                  backgroundColor: "#1A1A24",
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: 24,
                  paddingBottom: 40,
                }}
              >
                <Text style={{ fontSize: 22, fontWeight: "bold", color: "white", marginBottom: 20 }}>
                  Select Goal Type
                </Text>
                <View style={{ gap: 12 }}>
                  {goalTypes.map((gt) => (
                    <Pressable
                      key={gt.value}
                      onPress={() => {
                        setGoalType(gt.value as any);
                        setShowGoalTypeModal(false);
                      }}
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        borderRadius: 12,
                        padding: 16,
                        borderWidth: goalType === gt.value ? 2 : 0,
                        borderColor: "#7E3FE4",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View>
                          <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
                            {gt.label}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: "rgba(255, 255, 255, 0.6)",
                              marginTop: 4,
                            }}
                          >
                            {gt.desc}
                          </Text>
                        </View>
                        {goalType === gt.value && (
                          <Text style={{ fontSize: 20, color: "#7E3FE4" }}>✓</Text>
                        )}
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
