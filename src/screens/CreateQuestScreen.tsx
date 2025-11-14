import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, X, ChevronLeft } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { api } from "@/lib/api";
import type { GenerateQuestRequest, GenerateQuestResponse } from "@/shared/contracts";

type Props = NativeStackScreenProps<RootStackParamList, "CreateQuest">;

const CATEGORIES = ["SALES", "SOCIAL", "ENTREPRENEURSHIP", "DATING", "CONFIDENCE", "CAREER"];
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD", "EXPERT"];

export default function CreateQuestScreen({ navigation }: Props) {
  const [showAIForm, setShowAIForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");

  // Custom quest form
  const [questAction, setQuestAction] = useState("");
  const [questDescription, setQuestDescription] = useState("");
  const [minNOs, setMinNOs] = useState("3");

  const queryClient = useQueryClient();

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

    generateMutation.mutate({
      category: selectedCategory,
      difficulty: selectedDifficulty,
      customPrompt: customPrompt || undefined,
    });
  };

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

  // Main selection screen
  if (!showAIForm) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* Header */}
          <View
            style={{
              backgroundColor: "white",
              paddingHorizontal: 20,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              borderBottomLeftRadius: 20,
              borderBottomRightRadius: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ position: "absolute", left: 20 }}
            >
              <ChevronLeft size={28} color="#1C1C1E" />
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#1C1C1E" }}>
              Create Quest
            </Text>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Title Section */}
            <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 32, fontWeight: "bold", color: "#1C1C1E" }}>
                  Add New Quest
                </Text>
                <Pressable onPress={() => navigation.goBack()}>
                  <X size={28} color="#666" />
                </Pressable>
              </View>
              <Text style={{ fontSize: 16, color: "#666", marginTop: 8 }}>
                Choose how to create your quest
              </Text>
            </View>

            {/* Generate with AI Card */}
            <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
              <Pressable
                onPress={() => setShowAIForm(true)}
                style={{
                  borderRadius: 20,
                  padding: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <LinearGradient
                  colors={["#FF6B35", "#C45FD4", "#5B8DEF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 20,
                  }}
                />
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Sparkles size={32} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 24, fontWeight: "bold", color: "white", marginBottom: 4 }}>
                    Generate with AI
                  </Text>
                  <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.9)" }}>
                    Let Ben create an action quest for you
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Create Custom Quest Card */}
            <View style={{ paddingHorizontal: 24 }}>
              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 20,
                  padding: 24,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1C1C1E", marginBottom: 8 }}>
                  Create Custom Quest
                </Text>
                <Text style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>
                  Design your own challenge
                </Text>

                {/* Quest Action */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#1C1C1E", marginBottom: 8 }}>
                    Quest Action <Text style={{ color: "#FF3B30" }}>*</Text>
                  </Text>
                  <TextInput
                    value={questAction}
                    onChangeText={setQuestAction}
                    placeholder="Ask 10 strangers for directions"
                    placeholderTextColor="#999"
                    style={{
                      backgroundColor: "#F5F5F7",
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 16,
                      color: "#1C1C1E",
                      borderWidth: 1,
                      borderColor: "#E5E5EA",
                    }}
                  />
                  <Text style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
                    Make it a simple action statement
                  </Text>
                </View>

                {/* Description */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#1C1C1E", marginBottom: 8 }}>
                    Description (optional)
                  </Text>
                  <TextInput
                    value={questDescription}
                    onChangeText={setQuestDescription}
                    placeholder="Additional details about the quest..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    style={{
                      backgroundColor: "#F5F5F7",
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 16,
                      color: "#1C1C1E",
                      borderWidth: 1,
                      borderColor: "#E5E5EA",
                      textAlignVertical: "top",
                      minHeight: 100,
                    }}
                  />
                </View>

                {/* Minimum NOs Required */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#1C1C1E", marginBottom: 8 }}>
                    Minimum NOs Required
                  </Text>
                  <TextInput
                    value={minNOs}
                    onChangeText={setMinNOs}
                    placeholder="3"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    style={{
                      backgroundColor: "#F5F5F7",
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 16,
                      color: "#1C1C1E",
                      borderWidth: 1,
                      borderColor: "#E5E5EA",
                    }}
                  />
                </View>

                {/* Create Button */}
                <Pressable
                  onPress={() => {
                    Alert.alert("Coming Soon", "Custom quest creation will be available soon!");
                  }}
                  style={{
                    backgroundColor: "#007AFF",
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                    Create Quest
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // AI Form Screen
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F5F5F7" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View
          style={{
            backgroundColor: "white",
            paddingHorizontal: 20,
            paddingVertical: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Pressable
            onPress={() => setShowAIForm(false)}
            style={{ position: "absolute", left: 20 }}
          >
            <ChevronLeft size={28} color="#1C1C1E" />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#1C1C1E" }}>
            Generate with AI
          </Text>
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
          >
          {/* AI Icon */}
          <View style={{ alignItems: "center", marginVertical: 24 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LinearGradient
                colors={["#FF6B35", "#C45FD4", "#5B8DEF"]}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={40} color="white" />
              </LinearGradient>
            </View>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1C1C1E", marginTop: 16 }}>
              AI Quest Generator
            </Text>
            <Text style={{ fontSize: 14, color: "#666", textAlign: "center", marginTop: 8 }}>
              Let AI create a personalized rejection challenge for you
            </Text>
          </View>

          {/* Category Selection */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1C1C1E", marginBottom: 12 }}>
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
                      selectedCategory === category ? getCategoryColor(category) : "white",
                    borderWidth: 2,
                    borderColor:
                      selectedCategory === category ? getCategoryColor(category) : "#E5E5EA",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "600",
                      fontSize: 14,
                      color: selectedCategory === category ? "white" : "#666",
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
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1C1C1E", marginBottom: 12 }}>
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
                        : "white",
                    borderWidth: 2,
                    borderColor:
                      selectedDifficulty === difficulty
                        ? getDifficultyColor(difficulty)
                        : "#E5E5EA",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "600",
                      fontSize: 14,
                      color: selectedDifficulty === difficulty ? "white" : "#666",
                    }}
                  >
                    {difficulty}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Custom Prompt */}
          <View>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1C1C1E", marginBottom: 4 }}>
              Custom Prompt{" "}
              <Text style={{ fontSize: 14, fontWeight: "normal", color: "#999" }}>
                (Optional)
              </Text>
            </Text>
            <TextInput
              value={customPrompt}
              onChangeText={setCustomPrompt}
              placeholder="Describe your ideal rejection challenge..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: "white",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: "#1C1C1E",
                borderWidth: 1,
                borderColor: "#E5E5EA",
                textAlignVertical: "top",
                minHeight: 100,
                marginTop: 12,
              }}
            />
            <Text style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
              Example: &quot;Ask local business owners for advice on starting a company&quot;
            </Text>
          </View>
        </ScrollView>
        </TouchableWithoutFeedback>

        {/* Create Button */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 24,
            paddingVertical: 20,
            backgroundColor: "#F5F5F7",
          }}
        >
          <Pressable
            onPress={handleCreateWithAI}
            disabled={generateMutation.isPending || !selectedCategory || !selectedDifficulty}
            style={{
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              backgroundColor:
                !selectedCategory || !selectedDifficulty
                  ? "#999"
                  : generateMutation.isPending
                  ? "#999"
                  : "#FF6B35",
            }}
          >
            {generateMutation.isPending ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ActivityIndicator size="small" color="white" />
                <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>
                  Generating...
                </Text>
              </View>
            ) : (
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>
                Create Quest with AI
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
