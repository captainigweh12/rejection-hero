import React, { useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";

type OnboardingStep = 1 | 2 | 3;

const CATEGORIES = [
  { id: "sales", label: "Sales", emoji: "💼", description: "Pitch, cold call, negotiate" },
  { id: "social", label: "Social", emoji: "👥", description: "Meet people, make friends" },
  { id: "entrepreneurship", label: "Entrepreneurship", emoji: "🚀", description: "Start ventures, take risks" },
  { id: "dating", label: "Dating", emoji: "❤️", description: "Ask someone out, flirt" },
  { id: "confidence", label: "Confidence", emoji: "💪", description: "Build self-esteem, speak up" },
  { id: "career", label: "Career", emoji: "📈", description: "Job search, promotions, networking" },
];

const GOALS = [
  { id: "overcome-fear", label: "Overcome Fear of Rejection", emoji: "🔥" },
  { id: "build-confidence", label: "Build Confidence", emoji: "💎" },
  { id: "improve-sales", label: "Improve Sales Skills", emoji: "💰" },
  { id: "make-friends", label: "Make New Friends", emoji: "🤝" },
  { id: "find-love", label: "Find Love/Dating", emoji: "💕" },
  { id: "advance-career", label: "Advance My Career", emoji: "🎯" },
  { id: "start-business", label: "Start a Business", emoji: "🚀" },
  { id: "public-speaking", label: "Public Speaking", emoji: "🎤" },
];

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: About You & Username
  const [username, setUsername] = useState("");
  const [aboutYou, setAboutYou] = useState("");

  // Step 2: Select Categories (interests)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Step 3: Goals
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState("");

  const toggleCategory = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const toggleGoal = (goalId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter((id) => id !== goalId));
    } else {
      setSelectedGoals([...selectedGoals, goalId]);
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentStep === 1) {
      if (!username.trim() || username.trim().length < 3) {
        Alert.alert("Username Required", "Please enter a username (at least 3 characters).");
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
        Alert.alert("Invalid Username", "Username can only contain letters, numbers, and underscores.");
        return;
      }
      if (aboutYou.trim().length < 10) {
        Alert.alert("Tell us about yourself", "Please write at least 10 characters about yourself.");
        return;
      }
    }
    if (currentStep === 2 && selectedCategories.length === 0) {
      Alert.alert("Select Categories", "Please select at least one category you're interested in.");
      return;
    }
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as OnboardingStep);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as OnboardingStep);
    }
  };

  const handleComplete = async () => {
    if (selectedGoals.length === 0 && !customGoal.trim()) {
      Alert.alert("Set Your Goals", "Please select at least one goal or write your own.");
      return;
    }

    setIsLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Combine selected goals with custom goal
      const allGoals = [...selectedGoals];
      if (customGoal.trim()) {
        allGoals.push(customGoal.trim());
      }

      const goalsText = allGoals
        .map((goalId) => {
          const goal = GOALS.find((g) => g.id === goalId);
          return goal ? goal.label : goalId;
        })
        .join(", ");

      // Update profile with onboarding data
      await api.post("/api/profile", {
        username: username.trim().toLowerCase(),
        displayName: session?.user?.name || username.trim(),
        interests: selectedCategories,
        userContext: aboutYou.trim(),
        userGoals: goalsText,
        onboardingCompleted: true,
      });

      // Navigate to home (main menu)
      Alert.alert("Welcome to Go for No! 🎉", "Your profile is set up. Let's start your rejection journey!", [
        {
          text: "Let's Go!",
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: "MainTabs" as never }],
            });
          },
        },
      ]);
    } catch (error) {
      console.error("Onboarding error:", error);
      Alert.alert("Error", "Failed to save your onboarding data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View className="flex-row gap-2 mb-8">
      {[1, 2, 3].map((step) => (
        <View
          key={step}
          className="flex-1 h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
        >
          {currentStep >= step && (
            <LinearGradient
              colors={["#7E3FE4", "#FF6B35"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-full"
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="items-center mb-6">
        <Text className="text-6xl mb-4">👋</Text>
        <Text className="text-3xl font-bold text-white text-center mb-2">Welcome to Go for No!</Text>
        <Text className="text-base text-white/70 text-center px-4">
          Let&apos;s personalize your rejection journey
        </Text>
      </View>

      <View className="mt-6">
        <Text className="text-lg font-semibold text-white mb-3">Create your username</Text>
        <Text className="text-sm text-white/60 mb-3">
          Choose a unique username that others will see. Use only letters, numbers, and underscores.
        </Text>
        <View
          className="rounded-2xl p-4"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderWidth: 1,
            borderColor: "rgba(126, 63, 228, 0.3)",
          }}
        >
          <View className="flex-row items-center">
            <Text className="text-white/60 text-lg mr-1">@</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="warrior_123"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              className="text-white text-base flex-1"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>
        <Text className="text-xs text-white/40 mt-2">
          {username.length > 0 ? `@${username}` : "Your unique tag"}
        </Text>
      </View>

      <View className="mt-6">
        <Text className="text-lg font-semibold text-white mb-3">Tell us about yourself</Text>
        <Text className="text-sm text-white/60 mb-3">
          Share your background, current situation, or what brings you here. This helps our AI create better quests
          for you.
        </Text>
        <View
          className="rounded-2xl p-4 min-h-[150px]"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderWidth: 1,
            borderColor: "rgba(126, 63, 228, 0.3)",
          }}
        >
          <TextInput
            value={aboutYou}
            onChangeText={setAboutYou}
            placeholder="e.g., I'm a software developer looking to improve my networking skills and overcome fear of cold calling..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            multiline
            className="text-white text-base"
            style={{ minHeight: 120 }}
            textAlignVertical="top"
          />
        </View>
        <Text className="text-xs text-white/40 mt-2">{aboutYou.length} characters</Text>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="items-center mb-6">
        <Text className="text-6xl mb-4">🎯</Text>
        <Text className="text-3xl font-bold text-white text-center mb-2">Pick Your Focus Areas</Text>
        <Text className="text-base text-white/70 text-center px-4">
          Select categories you want to work on (choose at least one)
        </Text>
      </View>

      <View className="gap-3 mt-6">
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          return (
            <Pressable
              key={category.id}
              onPress={() => toggleCategory(category.id)}
              className="rounded-2xl p-5"
              style={{
                backgroundColor: isSelected ? "rgba(126, 63, 228, 0.2)" : "rgba(255, 255, 255, 0.05)",
                borderWidth: 2,
                borderColor: isSelected ? "#7E3FE4" : "rgba(255, 255, 255, 0.1)",
              }}
            >
              <View className="flex-row items-center">
                <Text className="text-4xl mr-4">{category.emoji}</Text>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-white mb-1">{category.label}</Text>
                  <Text className="text-sm text-white/60">{category.description}</Text>
                </View>
                {isSelected && <Text className="text-2xl">✓</Text>}
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="items-center mb-6">
        <Text className="text-6xl mb-4">🚀</Text>
        <Text className="text-3xl font-bold text-white text-center mb-2">What Are Your Goals?</Text>
        <Text className="text-base text-white/70 text-center px-4">
          Select what you want to achieve (optional but recommended)
        </Text>
      </View>

      <View className="gap-2.5 mt-6">
        {GOALS.map((goal) => {
          const isSelected = selectedGoals.includes(goal.id);
          return (
            <Pressable
              key={goal.id}
              onPress={() => toggleGoal(goal.id)}
              className="rounded-xl px-5 py-4 flex-row items-center"
              style={{
                backgroundColor: isSelected ? "rgba(126, 63, 228, 0.2)" : "rgba(255, 255, 255, 0.05)",
                borderWidth: 1.5,
                borderColor: isSelected ? "#7E3FE4" : "rgba(255, 255, 255, 0.1)",
              }}
            >
              <Text className="text-2xl mr-3">{goal.emoji}</Text>
              <Text className={`flex-1 text-base ${isSelected ? "text-white font-semibold" : "text-white/80"}`}>
                {goal.label}
              </Text>
              {isSelected && <Text className="text-xl">✓</Text>}
            </Pressable>
          );
        })}
      </View>

      <View className="mt-6">
        <Text className="text-sm font-semibold text-white/80 mb-3">Or write your own goal:</Text>
        <View
          className="rounded-xl p-4"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderWidth: 1,
            borderColor: "rgba(126, 63, 228, 0.3)",
          }}
        >
          <TextInput
            value={customGoal}
            onChangeText={setCustomGoal}
            placeholder="e.g., Get 10 coffee meetings with industry leaders"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            className="text-white text-base"
            multiline
            style={{ minHeight: 60 }}
            textAlignVertical="top"
          />
        </View>
      </View>
    </ScrollView>
  );

  return (
    <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
      <SafeAreaView edges={["top"]} className="flex-1">
        <View className="flex-1 px-6 pt-6">
          {renderProgressBar()}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Navigation Buttons */}
          <View className="pb-4 pt-6">
            <View className="flex-row gap-3">
              {currentStep > 1 && (
                <Pressable
                  onPress={handleBack}
                  disabled={isLoading}
                  className="flex-1 py-4 rounded-2xl items-center"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <Text className="text-white font-semibold text-base">Back</Text>
                </Pressable>
              )}

              <Pressable
                onPress={handleNext}
                disabled={isLoading}
                className="flex-1 py-4 rounded-2xl items-center overflow-hidden"
              >
                <LinearGradient
                  colors={["#7E3FE4", "#FF6B35"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="absolute inset-0"
                />
                <Text className="text-white font-bold text-base">
                  {isLoading ? "Saving..." : currentStep === 3 ? "Complete" : "Next"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
