import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Audio } from "expo-av";
import * as Location from "expo-location";
import {
  Mic,
  MicOff,
  X,
  Send,
  Sparkles,
  Gift,
  ChevronDown,
  ChevronUp,
  MapPin,
  Navigation2,
  Users,
  Check,
} from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import type {
  CreateCustomQuestRequest,
  CreateCustomQuestResponse,
  GetUserStatsResponse,
} from "@/shared/contracts";
import Slider from "@react-native-community/slider";

type Props = RootStackScreenProps<"CreateCustomQuest">;

export default function CreateCustomQuestScreen({ route, navigation }: Props) {
  const { friendId, friendName } = route.params || {};
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  // State
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [textDescription, setTextDescription] = useState("");
  const [audioTranscript, setAudioTranscript] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Quest customization
  const [category, setCategory] = useState("SOCIAL");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD" | "EXPERT">("MEDIUM");
  const [goalType, setGoalType] = useState<"COLLECT_NOS" | "COLLECT_YES" | "TAKE_ACTION">("COLLECT_NOS");
  const [goalCount, setGoalCount] = useState(5);
  
  // Location options
  const [locationType, setLocationType] = useState<"CURRENT" | "CUSTOM" | "NONE">("NONE");
  const [customLocation, setCustomLocation] = useState("");
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Gifting
  const [giftXP, setGiftXP] = useState(0);
  const [giftPoints, setGiftPoints] = useState(0);
  const [message, setMessage] = useState("");

  // Friend selection
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>(friendId ? [friendId] : []);
  const [showFriendSelection, setShowFriendSelection] = useState(!friendId); // Show if no friendId from route

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [showGoalTypeModal, setShowGoalTypeModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  // Get user stats for balance
  const { data: statsData } = useQuery<GetUserStatsResponse>({
    queryKey: ["stats"],
    queryFn: async () => api.get<GetUserStatsResponse>("/api/stats"),
  });

  // Get friends list
  const { data: friendsData } = useQuery<{ friends: Array<{ id: string; displayName: string; avatar: string | null }> }>({
    queryKey: ["friends"],
    queryFn: async () => api.get<{ friends: Array<{ id: string; displayName: string; avatar: string | null }> }>("/api/friends"),
  });

  const maxGiftXP = statsData?.totalXP || 0;
  const maxGiftPoints = statsData?.totalPoints || 0;
  const friends = friendsData?.friends || [];

  // Create custom quest mutation
  const createQuestMutation = useMutation({
    mutationFn: async (data: CreateCustomQuestRequest) => {
      return api.post<CreateCustomQuestResponse>("/api/shared-quests/create-custom", data);
    },
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["stats"] });
        queryClient.invalidateQueries({ queryKey: ["friends"] });
        queryClient.invalidateQueries({ queryKey: ["quests"] }); // Refresh active quests list

        const isPersonalQuest = selectedFriendIds.length === 0;

        if (isPersonalQuest) {
          // Personal quest created - navigate to quest detail
          Alert.alert(
            "Quest Created! 🎉",
            `Your custom quest has been created and is now active!`,
            [
              {
                text: "Start Quest",
                onPress: async () => {
                  // Wait for the quests query to be refetched
                  await new Promise((resolve) => setTimeout(resolve, 500));

                  // Navigate to quest detail screen
                  if (response.userQuestId) {
                    navigation.navigate("QuestDetail", { userQuestId: response.userQuestId });
                  } else {
                    navigation.goBack();
                  }
                },
              },
            ]
          );
        } else {
          // Shared quest - show success message
          const friendCount = selectedFriendIds.length;
          const friendNames = selectedFriendIds
            .map((id) => friends.find((f) => f.id === id)?.displayName || friendName || "Friend")
            .join(", ");

          Alert.alert(
            "Quest Created! 🎉",
            `Your custom quest has been sent to ${friendCount} friend${friendCount > 1 ? 's' : ''}${friendCount <= 3 ? `: ${friendNames}` : ''}!${giftXP > 0 || giftPoints > 0 ? `\n\n💎 Gifted: ${giftXP} XP + ${giftPoints} Points` : ""}`,
            [
              {
                text: "OK",
                onPress: () => navigation.goBack(),
              },
            ]
          );
        }
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

  // Get current location when locationType is CURRENT
  useEffect(() => {
    if (locationType === "CURRENT") {
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permission Required", "Location permission is needed to use your current location.");
            setLocationType("NONE");
            return;
          }

          const location = await Location.getCurrentPositionAsync({});
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        } catch (error) {
          console.error("Error getting location:", error);
          Alert.alert("Error", "Failed to get your location. Please try again or use a custom location.");
          setLocationType("NONE");
        }
      })();
    }
  }, [locationType]);

  const handleCreateQuest = () => {
    const description = inputMode === "voice" ? audioTranscript : textDescription;

    if (!description.trim()) {
      Alert.alert("Missing Description", "Please provide a quest description via voice or text");
      return;
    }

    if (locationType === "CUSTOM" && !customLocation.trim()) {
      Alert.alert("Missing Location", "Please enter a location name or select 'No Specific Location'");
      return;
    }

    if (giftXP > maxGiftXP || giftPoints > maxGiftPoints) {
      Alert.alert(
        "Insufficient Balance",
        `You only have ${maxGiftXP} XP and ${maxGiftPoints} Points. Complete more quests to earn rewards!`
      );
      return;
    }

    const mutationData: any = {
      friendIds: selectedFriendIds.length > 1 ? selectedFriendIds : undefined,
      audioTranscript: inputMode === "voice" ? audioTranscript : undefined,
      textDescription: inputMode === "text" ? textDescription : undefined,
      category,
      difficulty,
      goalType,
      goalCount,
      locationType,
      customLocation: locationType === "CUSTOM" ? customLocation : undefined,
      latitude: locationType === "CURRENT" && currentLocation ? currentLocation.latitude : undefined,
      longitude: locationType === "CURRENT" && currentLocation ? currentLocation.longitude : undefined,
      giftXP,
      giftPoints,
      message: message.trim() || undefined,
    };

    // Add friendId or friendIds based on selection (optional)
    if (selectedFriendIds.length === 1) {
      mutationData.friendId = selectedFriendIds[0];
    } else if (selectedFriendIds.length > 1) {
      mutationData.friendIds = selectedFriendIds;
    }

    createQuestMutation.mutate(mutationData);
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
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
    <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
      <LinearGradient colors={colors.background as any} style={{ flex: 1 }}>
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
                <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>
                  Create Custom Quest
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                  {selectedFriendIds.length > 0
                    ? `For ${selectedFriendIds.length} friend${selectedFriendIds.length > 1 ? 's' : ''}`
                    : "Select friends to share with"}
                </Text>
              </View>
              <Pressable
                onPress={() => navigation.goBack()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* Balance Display */}
            <View
              style={{
                marginHorizontal: 20,
                marginBottom: 20,
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Gift size={20} color={colors.warning} />
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginLeft: 8 }}>
                  Your Balance
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>XP</Text>
                  <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.primary }}>
                    {maxGiftXP}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>Points</Text>
                  <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.info }}>
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

            {/* Friend Selection */}
            <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
              <Pressable
                onPress={() => setShowFriendsModal(true)}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Users size={24} color={colors.primary} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
                      Select Friends
                    </Text>
                    {selectedFriendIds.length > 0 ? (
                      <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                        {selectedFriendIds.length} friend{selectedFriendIds.length > 1 ? 's' : ''} selected
                      </Text>
                    ) : (
                      <Text style={{ fontSize: 14, color: colors.textTertiary }}>
                        Tap to select friends
                      </Text>
                    )}
                  </View>
                </View>
                <ChevronDown size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Input Mode Tabs */}
            <View
              style={{
                flexDirection: "row",
                marginHorizontal: 20,
                marginBottom: 20,
                backgroundColor: colors.surface,
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
                  backgroundColor: inputMode === "text" ? colors.primary : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: inputMode === "text" ? colors.text : colors.textSecondary,
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
                  backgroundColor: inputMode === "voice" ? colors.primary : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: inputMode === "voice" ? colors.text : colors.textSecondary,
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
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
                  Quest Description
                </Text>
                <TextInput
                  value={textDescription}
                  onChangeText={setTextDescription}
                  placeholder="Describe the quest you want your friend to complete..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={6}
                  style={{
                    backgroundColor: colors.inputBackground,
                    borderRadius: 16,
                    padding: 16,
                    fontSize: 16,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    textAlignVertical: "top",
                    minHeight: 150,
                  }}
                />
                <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 8 }}>
                  {textDescription.length} / 500 characters
                </Text>
              </View>
            )}

            {/* Voice Input */}
            {inputMode === "voice" && (
              <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
                  Voice Recording
                </Text>

                {!audioTranscript && !isTranscribing && (
                  <Pressable
                    onPress={isRecording ? stopRecording : startRecording}
                    style={{
                      backgroundColor: isRecording ? colors.error : colors.primaryLight,
                      borderRadius: 16,
                      padding: 32,
                      alignItems: "center",
                      borderWidth: 2,
                      borderColor: isRecording ? colors.error : colors.primary,
                    }}
                  >
                    {isRecording ? <MicOff size={48} color={colors.text} /> : <Mic size={48} color={colors.primary} />}
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: colors.text,
                        marginTop: 16,
                      }}
                    >
                      {isRecording ? "Tap to Stop Recording" : "Tap to Record"}
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                      {isRecording ? "Recording..." : "Describe your quest idea"}
                    </Text>
                  </Pressable>
                )}

                {isTranscribing && (
                  <View
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      padding: 32,
                      alignItems: "center",
                    }}
                  >
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ fontSize: 16, color: colors.text, marginTop: 16 }}>
                      Transcribing...
                    </Text>
                  </View>
                )}

                {audioTranscript && (
                  <View
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
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
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.success }}>
                        ✓ Transcribed
                      </Text>
                      <Pressable
                        onPress={() => {
                          setAudioTranscript("");
                          setInputMode("text");
                        }}
                      >
                        <Text style={{ fontSize: 14, color: colors.primary }}>Re-record</Text>
                      </Pressable>
                    </View>
                    <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24 }}>
                      {audioTranscript}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Quest Customization - Always Visible - Moved before Gift section for prominence */}
            <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <Sparkles size={20} color={colors.primary} />
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginLeft: 8 }}>
                  Quest Settings
                </Text>
              </View>

              <View style={{ gap: 12 }}>
                  {/* Category */}
                  <Pressable
                    onPress={() => setShowCategoryModal(true)}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: colors.inputBackground,
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                      Category
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                      {categories.find((c) => c.value === category)?.label || category}
                    </Text>
                  </Pressable>

                  {/* Difficulty */}
                  <Pressable
                    onPress={() => setShowDifficultyModal(true)}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: colors.inputBackground,
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                      Difficulty
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                      {difficulties.find((d) => d.value === difficulty)?.label || difficulty}
                    </Text>
                  </Pressable>

                  {/* Goal Type */}
                  <Pressable
                    onPress={() => setShowGoalTypeModal(true)}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: colors.inputBackground,
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                      Goal Type
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                      {goalTypes.find((gt) => gt.value === goalType)?.label || goalType.replace("_", " ")}
                    </Text>
                  </Pressable>

                  {/* Goal Count */}
                  <View
                    style={{
                      backgroundColor: colors.inputBackground,
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
                      <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                        Goal Count
                      </Text>
                      <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text }}>
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
                      minimumTrackTintColor={colors.primary}
                      maximumTrackTintColor={colors.surface}
                      thumbTintColor={colors.primary}
                    />
                  </View>

                  {/* Location Options */}
                  <View
                    style={{
                      backgroundColor: colors.inputBackground,
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>
                      Location
                    </Text>
                    <View style={{ gap: 8 }}>
                      <Pressable
                        onPress={() => setLocationType("CURRENT")}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 12,
                          borderRadius: 8,
                          backgroundColor: locationType === "CURRENT" ? colors.primary + "20" : "transparent",
                          borderWidth: 1,
                          borderColor: locationType === "CURRENT" ? colors.primary : colors.inputBorder,
                        }}
                      >
                        <Navigation2 size={20} color={locationType === "CURRENT" ? colors.primary : colors.textSecondary} />
                        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginLeft: 12 }}>
                          Use My Current Location
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setLocationType("CUSTOM")}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 12,
                          borderRadius: 8,
                          backgroundColor: locationType === "CUSTOM" ? colors.primary + "20" : "transparent",
                          borderWidth: 1,
                          borderColor: locationType === "CUSTOM" ? colors.primary : colors.inputBorder,
                        }}
                      >
                        <MapPin size={20} color={locationType === "CUSTOM" ? colors.primary : colors.textSecondary} />
                        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginLeft: 12 }}>
                          Specify Location
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setLocationType("NONE")}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 12,
                          borderRadius: 8,
                          backgroundColor: locationType === "NONE" ? colors.primary + "20" : "transparent",
                          borderWidth: 1,
                          borderColor: locationType === "NONE" ? colors.primary : colors.inputBorder,
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                          No Specific Location
                        </Text>
                      </Pressable>
                    </View>
                    {locationType === "CUSTOM" && (
                      <TextInput
                        value={customLocation}
                        onChangeText={setCustomLocation}
                        placeholder="Enter location (e.g., Central Park, Times Square, Airport)"
                        placeholderTextColor={colors.textTertiary}
                        style={{
                          marginTop: 12,
                          backgroundColor: colors.surface,
                          borderRadius: 8,
                          padding: 12,
                          fontSize: 14,
                          color: colors.text,
                          borderWidth: 1,
                          borderColor: colors.inputBorder,
                        }}
                      />
                    )}
                    {locationType === "CURRENT" && currentLocation && (
                      <Text style={{ fontSize: 12, color: colors.success, marginTop: 8 }}>
                        ✓ Location captured
                      </Text>
                    )}
                  </View>
                </View>
            </View>

            {/* Gift XP and Points */}
            {(maxGiftXP > 0 || maxGiftPoints > 0) && (
              <View
                style={{
                  marginHorizontal: 20,
                  marginBottom: 20,
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                  <Gift size={24} color={colors.warning} />
                  <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginLeft: 8 }}>
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
                      <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                        Gift XP
                      </Text>
                      <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.primary }}>
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
                      minimumTrackTintColor={colors.primary}
                      maximumTrackTintColor={colors.surface}
                      thumbTintColor={colors.primary}
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
                      <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                        Gift Points
                      </Text>
                      <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.info }}>
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
                      minimumTrackTintColor={colors.info}
                      maximumTrackTintColor={colors.surface}
                      thumbTintColor={colors.info}
                    />
                  </View>
                )}

                <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 12 }}>
                  💡 Your XP and Points will be deducted and added to the quest reward
                </Text>
              </View>
            )}

            {/* Optional Message */}
            <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
                Optional Message
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Add a personal note to your friend..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                maxLength={500}
                style={{
                  backgroundColor: colors.inputBackground,
                  borderRadius: 16,
                  padding: 16,
                  fontSize: 14,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.inputBorder,
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
              backgroundColor: colors.backgroundSolid,
              borderTopWidth: 1,
              borderTopColor: colors.cardBorder,
            }}
          >
            <Pressable
              onPress={handleCreateQuest}
              disabled={createQuestMutation.isPending}
              style={{
                backgroundColor: createQuestMutation.isPending ? colors.primary + "50" : colors.primary,
                borderRadius: 16,
                paddingVertical: 18,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {createQuestMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <Send size={20} color={colors.text} />
                  <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
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
                backgroundColor: colors.modalOverlay,
                justifyContent: "flex-end",
              }}
            >
              <View
                style={{
                  backgroundColor: colors.card,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: 24,
                  paddingBottom: 40,
                }}
              >
                <Text style={{ fontSize: 22, fontWeight: "bold", color: colors.text, marginBottom: 20 }}>
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
                        backgroundColor: colors.surface,
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
                        <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
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
                backgroundColor: colors.modalOverlay,
                justifyContent: "flex-end",
              }}
            >
              <View
                style={{
                  backgroundColor: colors.card,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: 24,
                  paddingBottom: 40,
                }}
              >
                <Text style={{ fontSize: 22, fontWeight: "bold", color: colors.text, marginBottom: 20 }}>
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
                        backgroundColor: colors.surface,
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
                        <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
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

          {/* Friends Selection Modal */}
          <Modal visible={showFriendsModal} transparent animationType="slide">
            <View
              style={{
                flex: 1,
                backgroundColor: colors.modalOverlay,
                justifyContent: "flex-end",
              }}
            >
              <View
                style={{
                  backgroundColor: colors.card,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: 24,
                  paddingBottom: 40,
                  maxHeight: "80%",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <Text style={{ fontSize: 22, fontWeight: "bold", color: colors.text }}>
                    Select Friends
                  </Text>
                  <Pressable onPress={() => setShowFriendsModal(false)}>
                    <X size={28} color={colors.text} />
                  </Pressable>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {friends.length === 0 ? (
                    <View style={{ alignItems: "center", paddingVertical: 40 }}>
                      <Users size={48} color={colors.textTertiary} />
                      <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 16, textAlign: "center" }}>
                        No friends yet
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.textTertiary, marginTop: 8, textAlign: "center" }}>
                        Add friends to share quests with them
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: 12 }}>
                      {friends.map((friend) => {
                        const isSelected = selectedFriendIds.includes(friend.id);
                        return (
                          <Pressable
                            key={friend.id}
                            onPress={() => toggleFriendSelection(friend.id)}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              backgroundColor: isSelected ? colors.primary + "20" : colors.surface,
                              borderRadius: 12,
                              padding: 16,
                              borderWidth: isSelected ? 2 : 1,
                              borderColor: isSelected ? colors.primary : colors.inputBorder,
                            }}
                          >
                            {friend.avatar ? (
                              <Image
                                source={{ uri: friend.avatar }}
                                style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
                              />
                            ) : (
                              <View
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 24,
                                  backgroundColor: colors.primary + "30",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  marginRight: 12,
                                }}
                              >
                                <Users size={24} color={colors.primary} />
                              </View>
                            )}
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
                                {friend.displayName}
                              </Text>
                            </View>
                            {isSelected && (
                              <View
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 12,
                                  backgroundColor: colors.primary,
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Check size={16} color="white" />
                              </View>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </ScrollView>
                {selectedFriendIds.length > 0 && (
                  <Pressable
                    onPress={() => {
                      setShowFriendsModal(false);
                    }}
                    style={{
                      marginTop: 20,
                      backgroundColor: colors.primary,
                      borderRadius: 12,
                      paddingVertical: 16,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
                      Done ({selectedFriendIds.length} selected)
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </Modal>

          {/* Goal Type Modal */}
          <Modal visible={showGoalTypeModal} transparent animationType="slide">
            <View
              style={{
                flex: 1,
                backgroundColor: colors.modalOverlay,
                justifyContent: "flex-end",
              }}
            >
              <View
                style={{
                  backgroundColor: colors.card,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: 24,
                  paddingBottom: 40,
                }}
              >
                <Text style={{ fontSize: 22, fontWeight: "bold", color: colors.text, marginBottom: 20 }}>
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
                        backgroundColor: colors.surface,
                        borderRadius: 12,
                        padding: 16,
                        borderWidth: goalType === gt.value ? 2 : 0,
                        borderColor: colors.primary,
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
                          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
                            {gt.label}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: colors.textSecondary,
                              marginTop: 4,
                            }}
                          >
                            {gt.desc}
                          </Text>
                        </View>
                        {goalType === gt.value && (
                          <Text style={{ fontSize: 20, color: colors.primary }}>✓</Text>
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
