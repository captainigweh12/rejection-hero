import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, TextInput, ScrollView, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, X } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { api } from "@/lib/api";
import type { GenerateQuestRequest, GenerateQuestResponse } from "@/shared/contracts";

type Props = NativeStackScreenProps<RootStackParamList, "CreateQuest">;

const CATEGORIES = ["SALES", "SOCIAL", "ENTREPRENEURSHIP", "DATING", "CONFIDENCE", "CAREER"];
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD", "EXPERT"];

export default function CreateQuestScreen({ navigation }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async (data: GenerateQuestRequest) => {
      return api.post<GenerateQuestResponse>("/api/quests/generate", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quests"] });
      Alert.alert("Success", "Quest created! Start it from the Home screen.", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    },
    onError: (error) => {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to create quest");
    },
  });

  const handleCreate = () => {
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

  return (
    <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        {/* Header */}
        <View className="pt-4 pb-2 px-6 flex-row justify-between items-center">
          <Text className="text-white text-2xl font-bold">Create Quest</Text>
          <Pressable onPress={() => navigation.goBack()}>
            <X size={28} color="#fff" />
          </Pressable>
        </View>

        {/* AI Icon */}
        <View className="items-center my-6">
          <View
            className="w-20 h-20 rounded-full items-center justify-center"
            style={{
              backgroundColor: "rgba(255, 107, 53, 0.2)",
              borderWidth: 3,
              borderColor: "#FF6B35",
            }}
          >
            <Sparkles size={40} color="#FF6B35" />
          </View>
          <Text className="text-white text-lg font-bold mt-4">AI Quest Generator</Text>
          <Text className="text-white/60 text-sm text-center mt-2 px-8">
            Let AI create a personalized rejection challenge for you
          </Text>
        </View>

        {/* Category Selection */}
        <View className="px-6 mb-6">
          <Text className="text-white text-lg font-bold mb-3">Select Category</Text>
          <View className="flex-row flex-wrap gap-3">
            {CATEGORIES.map((category) => (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                className="px-4 py-3 rounded-full"
                style={{
                  backgroundColor:
                    selectedCategory === category
                      ? getCategoryColor(category)
                      : "rgba(255, 255, 255, 0.1)",
                  borderWidth: 2,
                  borderColor:
                    selectedCategory === category ? getCategoryColor(category) : "transparent",
                }}
              >
                <Text
                  className="font-bold text-sm"
                  style={{
                    color: selectedCategory === category ? "#fff" : "#999",
                  }}
                >
                  {category}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Difficulty Selection */}
        <View className="px-6 mb-6">
          <Text className="text-white text-lg font-bold mb-3">Select Difficulty</Text>
          <View className="flex-row flex-wrap gap-3">
            {DIFFICULTIES.map((difficulty) => (
              <Pressable
                key={difficulty}
                onPress={() => setSelectedDifficulty(difficulty)}
                className="px-6 py-3 rounded-full"
                style={{
                  backgroundColor:
                    selectedDifficulty === difficulty
                      ? getDifficultyColor(difficulty)
                      : "rgba(255, 255, 255, 0.1)",
                  borderWidth: 2,
                  borderColor:
                    selectedDifficulty === difficulty
                      ? getDifficultyColor(difficulty)
                      : "transparent",
                }}
              >
                <Text
                  className="font-bold text-sm"
                  style={{
                    color: selectedDifficulty === difficulty ? "#fff" : "#999",
                  }}
                >
                  {difficulty}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Custom Prompt (Optional) */}
        <View className="px-6 mb-8">
          <Text className="text-white text-lg font-bold mb-3">
            Custom Prompt <Text className="text-white/50 text-sm">(Optional)</Text>
          </Text>
          <TextInput
            value={customPrompt}
            onChangeText={setCustomPrompt}
            placeholder="Describe your ideal rejection challenge..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
            className="p-4 rounded-2xl text-white"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.2)",
              textAlignVertical: "top",
              minHeight: 100,
            }}
          />
          <Text className="text-white/40 text-xs mt-2">
            Example: &ldquo;Ask local business owners for advice on starting a company&rdquo;
          </Text>
        </View>
      </ScrollView>

      {/* Create Button */}
      <View className="px-6 pb-8">
        <Pressable
          onPress={handleCreate}
          disabled={generateMutation.isPending || !selectedCategory || !selectedDifficulty}
          className="py-4 rounded-full items-center"
          style={{
            backgroundColor:
              !selectedCategory || !selectedDifficulty
                ? "#666"
                : generateMutation.isPending
                ? "#999"
                : "#FF6B35",
          }}
        >
          {generateMutation.isPending ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color="#fff" />
              <Text className="text-white font-bold text-lg">Generating...</Text>
            </View>
          ) : (
            <Text className="text-white font-bold text-lg">Create Quest with AI</Text>
          )}
        </Pressable>
      </View>
    </LinearGradient>
  );
}
