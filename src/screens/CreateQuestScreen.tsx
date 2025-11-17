import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, X, ChevronLeft, Star, ThumbsDown, Mic, MapPin, Globe, Users, Square } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import type { GenerateQuestRequest, GenerateQuestResponse } from "@/shared/contracts";
import { Audio } from "expo-av";

type Props = NativeStackScreenProps<RootStackParamList, "CreateQuest">;

const CATEGORIES = ["SALES", "SOCIAL", "ENTREPRENEURSHIP", "DATING", "CONFIDENCE", "CAREER"];
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD", "EXPERT"];

type QuestType = "REJECTION" | "ACTION";
type LocationType = "CURRENT" | "CUSTOM" | "NONE";

export default function CreateQuestScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [showAIForm, setShowAIForm] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showSendToFriends, setShowSendToFriends] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedQuestType, setSelectedQuestType] = useState<QuestType>("REJECTION");
  const [selectedLocationType, setSelectedLocationType] = useState<LocationType>("CURRENT");
  const [customPrompt, setCustomPrompt] = useState("");
  const [customLocation, setCustomLocation] = useState("");

  // Custom quest form (simplified)
  const [questAction, setQuestAction] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const queryClient = useQueryClient();

  // Handle navigation to Friends screen when Send to Friends is selected
  React.useEffect(() => {
    if (showSendToFriends) {
      navigation.navigate("Friends");
      setShowSendToFriends(false);
    }
  }, [showSendToFriends, navigation]);

  const generateMutation = useMutation({
    mutationFn: async (data: GenerateQuestRequest) => {
      return api.post<GenerateQuestResponse>("/api/quests/generate", data);
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["quests"] });

      // Auto-start the quest if less than 2 active quests
      try {
        await api.post(`/api/quests/${data.userQuestId}/start`, {});
        queryClient.invalidateQueries({ queryKey: ["quests"] });

        // Navigate to the quest detail page
        navigation.navigate("QuestDetail", { userQuestId: data.userQuestId });
      } catch (error) {
        // If auto-start fails (e.g., already 2 active quests), just navigate to quest detail
        navigation.navigate("QuestDetail", { userQuestId: data.userQuestId });
      }
    },
    onError: (error) => {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to create quest");
    },
  });

  const handleCreateWithAI = () => {
    if (!selectedCategory || !selectedDifficulty) {
      Alert.alert("Missing Info", "Please select a category and difficulty level");
      return;
    }

    // Build the custom prompt based on location settings
    let finalPrompt = customPrompt;
    if (selectedLocationType === "CUSTOM" && customLocation) {
      finalPrompt = customPrompt
        ? `${customPrompt}. Location context: ${customLocation}`
        : `Create a quest for this location: ${customLocation}`;
    } else if (selectedLocationType === "NONE") {
      finalPrompt = customPrompt
        ? `${customPrompt}. No specific location needed - make it location-independent.`
        : "Create a location-independent quest that can be done anywhere.";
    }

    generateMutation.mutate({
      category: selectedCategory,
      difficulty: selectedDifficulty,
      customPrompt: finalPrompt || undefined,
      preferredQuestType: selectedQuestType,
    });
  };

  const handleCreateCustomQuest = async () => {
    if (!questAction.trim()) {
      Alert.alert("Missing Info", "Please describe your quest");
      return;
    }

    // Use the generate API with custom prompt to create the quest
    generateMutation.mutate({
      category: "CONFIDENCE",
      difficulty: "MEDIUM",
      customPrompt: questAction,
      preferredQuestType: "ACTION",
    });
  };

  const handleVoiceRecording = async () => {
    if (isRecording) {
      // Stop recording
      try {
        if (!recording) return;

        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);

        if (!uri) {
          Alert.alert("Error", "Failed to get recording");
          return;
        }

        // Upload and transcribe
        setIsTranscribing(true);

        // Create form data with the audio file
        const formData = new FormData();
        formData.append('audio', {
          uri,
          type: 'audio/m4a',
          name: 'recording.m4a',
        } as any);

        try {
          const response = await api.post<{ transcription: string }>('/api/audio/transcribe', formData);

          setQuestAction(response.transcription);
          setIsTranscribing(false);
        } catch (error) {
          console.error('Transcription error:', error);
          setIsTranscribing(false);
          Alert.alert("Error", "Failed to transcribe audio. Please type your quest instead.");
        }
      } catch (error) {
        console.error('Failed to stop recording:', error);
        setIsRecording(false);
        setIsTranscribing(false);
      }
    } else {
      // Start recording
      try {
        // Request permissions
        const permission = await Audio.requestPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Permission Required", "Please allow microphone access to record audio.");
          return;
        }

        // Configure audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        // Start recording
        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        setRecording(newRecording);
        setIsRecording(true);
      } catch (error) {
        console.error('Failed to start recording:', error);
        Alert.alert("Error", "Failed to start recording. Please try again.");
      }
    }
  };

  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      SALES: colors.secondary,
      SOCIAL: colors.info,
      ENTREPRENEURSHIP: colors.primary,
      DATING: "#FF4081",
      CONFIDENCE: colors.warning,
      CAREER: colors.success,
    };
    return categoryColors[category] || colors.primary;
  };

  const getDifficultyColor = (difficulty: string) => {
    const difficultyColors: Record<string, string> = {
      EASY: colors.success,
      MEDIUM: colors.warning,
      HARD: colors.secondary,
      EXPERT: "#FF4081",
    };
    return difficultyColors[difficulty] || colors.warning;
  };

  // Main selection screen - Dark 3D Glass Theme
  if (!showAIForm && !showCustomForm && !showSendToFriends) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
        <LinearGradient colors={colors.background} style={{ flex: 1 }}>
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
                Create Quest
              </Text>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Title Section */}
              <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 }}>
                <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.text, marginBottom: 8 }}>
                  Add New Quest
                </Text>
                <Text style={{ fontSize: 16, color: colors.textSecondary }}>
                  Choose how to create your challenge
                </Text>
              </View>

              {/* Generate with AI Card - Modern 3D Glass */}
              <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
                <Pressable
                  onPress={() => setShowAIForm(true)}
                  style={{
                    borderRadius: 24,
                    overflow: "hidden",
                  }}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primary + "CC"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      padding: 24,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: colors.surfaceHover,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Sparkles size={32} color={colors.text} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 22, fontWeight: "bold", color: colors.text, marginBottom: 4 }}>
                        Generate with AI
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.text }}>
                        Let AI create a personalized quest
                      </Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              </View>

              {/* Create Custom Quest Card - 3D Glassmorphism */}
              <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
                <Pressable
                  onPress={() => setShowCustomForm(true)}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 24,
                      padding: 24,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: colors.secondary + "30",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Star size={28} color={colors.secondary} fill={colors.secondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 22, fontWeight: "bold", color: colors.text, marginBottom: 4 }}>
                        Create Custom Quest
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                        Design your own challenge
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </View>

              {/* Send Quest to Friends Card - 3D Glassmorphism */}
              <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
                <Pressable
                  onPress={() => setShowSendToFriends(true)}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 24,
                      padding: 24,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: colors.info + "30",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Users size={28} color={colors.info} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 22, fontWeight: "bold", color: colors.text, marginBottom: 4 }}>
                        Send Quest to Friends
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                        Challenge your friends
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  // Custom Quest Form - Simplified with Voice Recording
  if (showCustomForm) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
        <LinearGradient colors={colors.background} style={{ flex: 1 }}>
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
                onPress={() => setShowCustomForm(false)}
                style={{ position: "absolute", left: 20 }}
              >
                <ChevronLeft size={28} color={colors.text} />
              </Pressable>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}>
                Custom Quest
              </Text>
            </View>

            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Title */}
                  <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.text, marginBottom: 8 }}>
                    Describe Your Quest
                  </Text>
                  <Text style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 32 }}>
                    Type or record what you want to do
                  </Text>

                  {/* Quest Action Input - 3D Glass Card */}
                  <View
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 20,
                      padding: 20,
                      marginBottom: 24,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 12 }}>
                      Quest Description
                    </Text>
                    <TextInput
                      value={questAction}
                      onChangeText={setQuestAction}
                      placeholder="E.g., Ask 10 strangers for directions"
                      placeholderTextColor={colors.textTertiary}
                      multiline
                      numberOfLines={4}
                      style={{
                        backgroundColor: colors.inputBackground,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        fontSize: 16,
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: colors.inputBorder,
                        textAlignVertical: "top",
                        minHeight: 120,
                      }}
                    />

                    {/* Voice Recording Button */}
                    <Pressable
                      onPress={handleVoiceRecording}
                      disabled={isTranscribing}
                      style={{
                        marginTop: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        backgroundColor: isRecording
                          ? "rgba(239, 68, 68, 0.2)"
                          : isTranscribing
                          ? "rgba(255, 215, 0, 0.2)"
                          : "rgba(126, 63, 228, 0.2)",
                        borderRadius: 12,
                        paddingVertical: 12,
                        borderWidth: 1,
                        borderColor: isRecording
                          ? "rgba(239, 68, 68, 0.3)"
                          : isTranscribing
                          ? "rgba(255, 215, 0, 0.3)"
                          : "rgba(126, 63, 228, 0.3)",
                        opacity: isTranscribing ? 0.6 : 1,
                      }}
                    >
                      {isTranscribing ? (
                        <>
                          <ActivityIndicator size="small" color="#FFD700" />
                          <Text style={{ color: "#FFD700", fontSize: 16, fontWeight: "600" }}>
                            Transcribing...
                          </Text>
                        </>
                      ) : isRecording ? (
                        <>
                          <Square size={20} color="#EF4444" fill="#EF4444" />
                          <Text style={{ color: "#EF4444", fontSize: 16, fontWeight: "600" }}>
                            Tap to Stop Recording
                          </Text>
                        </>
                      ) : (
                        <>
                          <Mic size={20} color="#A78BFA" />
                          <Text style={{ color: "#A78BFA", fontSize: 16, fontWeight: "600" }}>
                            Record Quest with Voice
                          </Text>
                        </>
                      )}
                    </Pressable>
                    <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 8, textAlign: "center" }}>
                      AI will transcribe your audio into a quest
                    </Text>
                  </View>
                </ScrollView>
              </TouchableWithoutFeedback>

              {/* Create Button - Fixed at bottom - Only show when text is entered */}
              {questAction.trim().length > 0 && (
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
                    onPress={handleCreateCustomQuest}
                    disabled={generateMutation.isPending}
                    style={{
                      paddingVertical: 16,
                      borderRadius: 16,
                      alignItems: "center",
                      overflow: "hidden",
                    }}
                  >
                    <LinearGradient
                      colors={generateMutation.isPending ? [colors.textTertiary, colors.textTertiary] : [colors.secondary, colors.secondary + "CC"]}
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
                    {generateMutation.isPending ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <ActivityIndicator size="small" color={colors.text} />
                        <Text
                          style={{
                            color: colors.text,
                            fontWeight: "bold",
                            fontSize: 18,
                            textShadowColor: colors.shadow,
                            textShadowOffset: { width: 0, height: 2 },
                            textShadowRadius: 4,
                          }}
                        >
                          Creating Your Quest...
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={{
                          color: colors.text,
                          fontWeight: "bold",
                          fontSize: 18,
                          textShadowColor: colors.shadow,
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 3,
                        }}
                      >
                        Create Quest
                      </Text>
                    )}
                  </Pressable>
                </View>
              )}
            </KeyboardAvoidingView>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  // AI Form Screen - Dark 3D Glass Theme
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.backgroundSolid }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
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
              onPress={() => setShowAIForm(false)}
              style={{ position: "absolute", left: 20 }}
            >
              <ChevronLeft size={28} color={colors.text} />
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}>
              Generate with AI
            </Text>
          </View>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 24, paddingBottom: 140 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* AI Icon */}
              <View style={{ alignItems: "center", marginVertical: 24 }}>
                <LinearGradient
                  colors={["#7E3FE4", "#9D5FE4"]}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#7E3FE4",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 15,
                    elevation: 8,
                  }}
                >
                  <Sparkles size={40} color={colors.text} />
                </LinearGradient>
                <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text, marginTop: 16 }}>
                  AI Quest Generator
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", marginTop: 8 }}>
                  Let AI create a personalized challenge for you
                </Text>
              </View>

              {/* Location Type Selection */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 12 }}>
                  Quest Location
                </Text>
                <View style={{ gap: 12 }}>
                  {/* Use Current Location */}
                  <Pressable
                    onPress={() => setSelectedLocationType("CURRENT")}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 2,
                      borderColor: selectedLocationType === "CURRENT" ? colors.info : colors.cardBorder,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: selectedLocationType === "CURRENT" ? colors.info + "30" : colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MapPin size={24} color={selectedLocationType === "CURRENT" ? "#00D9FF" : "rgba(255, 255, 255, 0.6)"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text, marginBottom: 4 }}>
                        📍 Use My Location
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                        Find quests near me (within 10 miles)
                      </Text>
                    </View>
                    {selectedLocationType === "CURRENT" && (
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: colors.info,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold" }}>✓</Text>
                      </View>
                    )}
                  </Pressable>

                  {/* Custom Location */}
                  <Pressable
                    onPress={() => setSelectedLocationType("CUSTOM")}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 2,
                      borderColor: selectedLocationType === "CUSTOM" ? colors.warning : colors.cardBorder,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: selectedLocationType === "CUSTOM" ? colors.warning + "30" : colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Globe size={24} color={selectedLocationType === "CUSTOM" ? "#FFD700" : "rgba(255, 255, 255, 0.6)"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text, marginBottom: 4 }}>
                        🌍 Custom Location
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                        Specify a place (e.g., beach, mall, airport)
                      </Text>
                    </View>
                    {selectedLocationType === "CUSTOM" && (
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: colors.warning,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold" }}>✓</Text>
                      </View>
                    )}
                  </Pressable>

                  {/* No Location */}
                  <Pressable
                    onPress={() => setSelectedLocationType("NONE")}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 2,
                      borderColor: selectedLocationType === "NONE" ? colors.primary : colors.cardBorder,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: selectedLocationType === "NONE" ? colors.primaryLight : colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Star size={24} color={selectedLocationType === "NONE" ? "#A78BFA" : "rgba(255, 255, 255, 0.6)"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text, marginBottom: 4 }}>
                        ⭐ No Specific Location
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                        Quest can be done anywhere
                      </Text>
                    </View>
                    {selectedLocationType === "NONE" && (
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
                        <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                </View>

                {/* Custom Location Input */}
                {selectedLocationType === "CUSTOM" && (
                  <View style={{ marginTop: 12 }}>
                    <TextInput
                      value={customLocation}
                      onChangeText={setCustomLocation}
                      placeholder="E.g., Santa Monica Beach, Mall of America, Airport..."
                      placeholderTextColor={colors.textTertiary}
                      style={{
                        backgroundColor: colors.inputBackground,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        fontSize: 16,
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: colors.inputBorder,
                      }}
                    />
                  </View>
                )}
              </View>

              {/* Category Selection */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 12 }}>
                  Select Category
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {CATEGORIES.map((category) => (
                    <Pressable
                      key={category}
                      onPress={() => setSelectedCategory(category)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 20,
                        backgroundColor:
                          selectedCategory === category
                            ? getCategoryColor(category)
                            : "rgba(255, 255, 255, 0.05)",
                        borderWidth: 2,
                        borderColor:
                          selectedCategory === category
                            ? getCategoryColor(category)
                            : "rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "600",
                          fontSize: 14,
                          color: selectedCategory === category ? colors.text : colors.textSecondary,
                        }}
                      >
                        {category}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Difficulty Selection */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 12 }}>
                  Select Difficulty
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {DIFFICULTIES.map((difficulty) => (
                    <Pressable
                      key={difficulty}
                      onPress={() => setSelectedDifficulty(difficulty)}
                      style={{
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                        borderRadius: 20,
                        backgroundColor:
                          selectedDifficulty === difficulty
                            ? getDifficultyColor(difficulty)
                            : "rgba(255, 255, 255, 0.05)",
                        borderWidth: 2,
                        borderColor:
                          selectedDifficulty === difficulty
                            ? getDifficultyColor(difficulty)
                            : "rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "600",
                          fontSize: 14,
                          color: selectedDifficulty === difficulty ? colors.text : colors.textSecondary,
                        }}
                      >
                        {difficulty}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Quest Type Selection */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 4 }}>
                  Quest Type
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>
                  Choose your challenge style
                </Text>

                <View style={{ gap: 12 }}>
                  {/* Rejection Challenge Option */}
                  <Pressable
                    onPress={() => setSelectedQuestType("REJECTION")}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 2,
                      borderColor: selectedQuestType === "REJECTION" ? colors.secondary : colors.cardBorder,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: selectedQuestType === "REJECTION" ? colors.secondary + "30" : colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ThumbsDown size={24} color={selectedQuestType === "REJECTION" ? "#FF6B35" : "rgba(255, 255, 255, 0.6)"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text, marginBottom: 4 }}>
                        🎯 Rejection Challenge
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                        Track YES/NO responses from asking people
                      </Text>
                    </View>
                    {selectedQuestType === "REJECTION" && (
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: colors.secondary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold" }}>✓</Text>
                      </View>
                    )}
                  </Pressable>

                  {/* Action Challenge Option */}
                  <Pressable
                    onPress={() => setSelectedQuestType("ACTION")}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 2,
                      borderColor: selectedQuestType === "ACTION" ? "#FFD700" : "rgba(255, 255, 255, 0.1)",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: selectedQuestType === "ACTION" ? "rgba(255, 215, 0, 0.2)" : "rgba(255, 255, 255, 0.05)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Star size={24} color={selectedQuestType === "ACTION" ? "#FFD700" : "rgba(255, 255, 255, 0.6)"} fill={selectedQuestType === "ACTION" ? "#FFD700" : "transparent"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text, marginBottom: 4 }}>
                        ⭐ Action Challenge
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                        Complete actions like applying or networking
                      </Text>
                    </View>
                    {selectedQuestType === "ACTION" && (
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: colors.warning,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold" }}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Add Context */}
              <View>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 4 }}>
                  Add Personal Context{" "}
                  <Text style={{ fontSize: 14, fontWeight: "normal", color: colors.textTertiary }}>
                    (Optional)
                  </Text>
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>
                  Tell AI about your goals for tailored quests
                </Text>
                <TextInput
                  value={customPrompt}
                  onChangeText={setCustomPrompt}
                  placeholder="E.g., I'm a software developer looking for a job..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={4}
                  style={{
                    backgroundColor: colors.inputBackground,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 16,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    textAlignVertical: "top",
                    minHeight: 100,
                  }}
                />
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>

          {/* Create Button - Fixed at bottom */}
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
              onPress={handleCreateWithAI}
              disabled={generateMutation.isPending || !selectedCategory || !selectedDifficulty}
              style={{
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: "center",
                overflow: "hidden",
              }}
            >
              <LinearGradient
                colors={
                  !selectedCategory || !selectedDifficulty
                    ? [colors.textTertiary, colors.textTertiary]
                    : generateMutation.isPending
                    ? [colors.textTertiary, colors.textTertiary]
                    : [colors.primary, colors.primary + "E4"]
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
              {generateMutation.isPending ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <ActivityIndicator size="small" color={colors.text} />
                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: "bold",
                      fontSize: 18,
                      textShadowColor: colors.shadow,
                      textShadowOffset: { width: 0, height: 2 },
                      textShadowRadius: 4,
                    }}
                  >
                    Generating Your Quest...
                  </Text>
                </View>
              ) : (
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: "bold",
                    fontSize: 18,
                    textShadowColor: colors.shadow,
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                  }}
                >
                  Create Quest with AI
                </Text>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
