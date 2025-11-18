import React, { useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import { useTheme } from "@/contexts/ThemeContext";
import PolicyViewerModal from "@/components/PolicyViewerModal";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FileText, CheckCircle } from "lucide-react-native";

type OnboardingStep = 0 | 1 | 2 | 3 | 4 | 5; // 0 = Policy Acceptance, 1 = Challenge Duration, 2 = Quest Mode, 3 = About You, 4 = Categories, 5 = Goals

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
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(0); // Start with policy acceptance
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  
  // Challenge Duration Selection (Step 1)
  const [challengeDuration, setChallengeDuration] = useState<14 | 30 | 100 | null>(null);
  
  // Quest Mode Selection (Step 2)
  const [questMode, setQuestMode] = useState<"QUEST_BY_QUEST" | "AI_SERIES" | null>(null);

  // Required policies for onboarding
  const REQUIRED_POLICIES: Array<{ type: string; name: string }> = [
    { type: "terms-of-service", name: "Terms of Service" },
    { type: "privacy-policy", name: "Privacy Policy" },
    { type: "content-guidelines", name: "Content Guidelines" },
    { type: "recording-consent", name: "Recording Consent" },
    { type: "liability-waiver", name: "Liability Waiver" },
  ];

  // Check which policies user has accepted
  const { data: policiesData } = useQuery({
    queryKey: ["policies"],
    queryFn: async () => {
      const response = await api.get("/api/policies");
      return response as { policies: Array<{ type: string; accepted: boolean }> };
    },
  });

  const acceptedPolicies = new Set(
    policiesData?.policies?.filter((p) => p.accepted).map((p) => p.type) || []
  );

  // Step 1: About You & Username
  const [username, setUsername] = useState("");
  const [aboutYou, setAboutYou] = useState("");

  // Step 2: Select Categories (interests)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Step 3: Goals
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState("");

  const textPrimary = { color: colors.text };
  const textSecondary = { color: colors.textSecondary };
  const textTertiary = { color: colors.textTertiary };

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
    
    // Step 0: Policy acceptance
    if (currentStep === 0) {
      const allAccepted = REQUIRED_POLICIES.every((policy) =>
        acceptedPolicies.has(policy.type)
      );
      if (!allAccepted) {
        Alert.alert(
          "Accept All Policies",
          "Please read and accept all required policies to continue."
        );
        return;
      }
    }
    
    // Step 1: Challenge Duration Selection
    if (currentStep === 1) {
      if (!challengeDuration) {
        Alert.alert("Select Challenge Duration", "Please select a challenge duration to continue.");
        return;
      }
    }
    
    // Step 2: Quest Mode Selection
    if (currentStep === 2) {
      if (!questMode) {
        Alert.alert("Select Quest Mode", "Please select a quest mode to continue.");
        return;
      }
    }
    
    // Step 3: About You & Username
    if (currentStep === 3) {
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
    
    // Step 4: Categories
    if (currentStep === 4 && selectedCategories.length === 0) {
      Alert.alert("Select Categories", "Please select at least one category you're interested in.");
      return;
    }
    
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as OnboardingStep);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 0) {
      setCurrentStep((currentStep - 1) as OnboardingStep);
    }
  };
  
  // Render Step 1: Challenge Duration Selection
  const renderChallengeDurationStep = () => (
    <View className="flex-1 px-6 py-8">
      <Text className="text-3xl font-bold mb-2" style={textPrimary}>
        Choose Your Challenge Duration 🎯
      </Text>
      <Text className="text-base mb-8" style={textSecondary}>
        Select how long you want to commit to your growth journey
      </Text>
      
      <View className="gap-4">
        {[
          { days: 14, label: "14 Day Challenge", description: "Perfect for a quick start", emoji: "⚡" },
          { days: 30, label: "30 Day Challenge", description: "Build a solid habit", emoji: "🔥" },
          { days: 100, label: "100 Day Challenge", description: "Transform your life", emoji: "🚀" },
        ].map((option) => (
          <Pressable
            key={option.days}
            onPress={() => {
              setChallengeDuration(option.days as 14 | 30 | 100);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            className="p-6 rounded-2xl"
            style={{
              backgroundColor: challengeDuration === option.days ? "rgba(126, 63, 228, 0.2)" : colors.card,
              borderWidth: 2,
              borderColor: challengeDuration === option.days ? "#7E3FE4" : colors.cardBorder,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex-row items-center gap-3 mb-2">
                  <Text className="text-2xl">{option.emoji}</Text>
                  <Text className="text-xl font-bold" style={textPrimary}>
                    {option.label}
                  </Text>
                </View>
                <Text className="text-sm" style={textSecondary}>
                  {option.description}
                </Text>
              </View>
              {challengeDuration === option.days && (
                <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: "#7E3FE4" }}>
                  <CheckCircle size={16} color="white" />
                </View>
              )}
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
  
  // Render Step 2: Quest Mode Selection
  const renderQuestModeStep = () => (
    <View className="flex-1 px-6 py-8">
      <Text className="text-3xl font-bold mb-2" style={textPrimary}>
        Choose Your Quest Mode 🎮
      </Text>
      <Text className="text-base mb-8" style={textSecondary}>
        How would you like to receive your quests?
      </Text>
      
      <View className="gap-4">
        {[
          {
            mode: "QUEST_BY_QUEST" as const,
            label: "Quest by Quest",
            description: "Generate one quest at a time. You control the pace.",
            emoji: "🎯",
          },
          {
            mode: "AI_SERIES" as const,
            label: "AI Quest Series",
            description: "AI creates 3-8 quests at once. Complete one to unlock the next.",
            emoji: "🤖",
          },
        ].map((option) => (
          <Pressable
            key={option.mode}
            onPress={() => {
              setQuestMode(option.mode);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            className="p-6 rounded-2xl"
            style={{
              backgroundColor: questMode === option.mode ? "rgba(126, 63, 228, 0.2)" : colors.card,
              borderWidth: 2,
              borderColor: questMode === option.mode ? "#7E3FE4" : colors.cardBorder,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex-row items-center gap-3 mb-2">
                  <Text className="text-2xl">{option.emoji}</Text>
                  <Text className="text-xl font-bold" style={textPrimary}>
                    {option.label}
                  </Text>
                </View>
                <Text className="text-sm" style={textSecondary}>
                  {option.description}
                </Text>
              </View>
              {questMode === option.mode && (
                <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: "#7E3FE4" }}>
                  <CheckCircle size={16} color="white" />
                </View>
              )}
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );

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
      console.log("🎯 [Onboarding] Saving profile with onboarding data...");
      await api.post("/api/profile", {
        username: username.trim().toLowerCase(),
        displayName: session?.user?.name || username.trim(),
        interests: selectedCategories,
        userContext: aboutYou.trim(),
        userGoals: goalsText,
        onboardingCompleted: true,
      });

      console.log("✅ [Onboarding] Profile saved successfully, invalidating cache...");
      
      // Invalidate profile query cache so AuthWrapper re-checks onboarding status
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      
      // Small delay to ensure cache is updated
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Navigate to home (main menu)
      console.log("🎯 [Onboarding] Navigating to main app...");
      Alert.alert("Welcome to Go for No! 🎉", "Your profile is set up. Let's start your rejection journey!", [
        {
          text: "Let's Go!",
          onPress: () => {
            // Use replace to ensure onboarding can't be navigated back to
            navigation.reset({
              index: 0,
              routes: [{ name: "Tabs" as never }],
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
      {[0, 1, 2, 3].map((step) => (
        <View
          key={step}
          className="flex-1 h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: colors.surface }}
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

  const renderStep0 = () => {
    const allAccepted = REQUIRED_POLICIES.every((policy) =>
      acceptedPolicies.has(policy.type)
    );

    return (
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-2xl font-bold mb-2" style={textPrimary}>
            Legal Agreements
          </Text>
          <Text className="text-base" style={textSecondary}>
            Please read and accept the following policies to continue:
          </Text>
        </View>

        <View className="gap-3 mb-6">
          {REQUIRED_POLICIES.map((policy) => {
            const isAccepted = acceptedPolicies.has(policy.type);
            return (
              <Pressable
                key={policy.type}
                onPress={() => setSelectedPolicy(policy.type)}
                className="flex-row items-center p-4 rounded-2xl"
                style={{
                  backgroundColor: isAccepted
                    ? "rgba(126, 63, 228, 0.2)"
                    : "rgba(255, 255, 255, 0.05)",
                  borderWidth: 1,
                  borderColor: isAccepted
                    ? "rgba(126, 63, 228, 0.5)"
                    : "rgba(255, 255, 255, 0.1)",
                }}
              >
                <View className="flex-1 flex-row items-center">
                  <FileText
                    size={20}
                    color={isAccepted ? "#7E3FE4" : colors.textSecondary}
                    className="mr-3"
                  />
                  <Text
                    className="flex-1 font-semibold"
                    style={isAccepted ? { color: "#7E3FE4" } : textPrimary}
                  >
                    {policy.name}
                  </Text>
                </View>
                {isAccepted && (
                  <CheckCircle size={24} color="#7E3FE4" className="ml-2" />
                )}
              </Pressable>
            );
          })}
        </View>

        {!allAccepted && (
          <View
            className="p-4 rounded-2xl mb-4"
            style={{ backgroundColor: "rgba(255, 107, 53, 0.1)" }}
          >
            <Text className="text-sm text-center" style={textPrimary}>
              ⚠️ You must accept all policies to continue
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderStep1 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="items-center mb-6">
        <Text className="text-6xl mb-4">👋</Text>
        <Text className="text-3xl font-bold text-center mb-2" style={textPrimary}>
          Welcome to Go for No!
        </Text>
        <Text className="text-base text-center px-4" style={textSecondary}>
          Let&apos;s personalize your rejection journey
        </Text>
      </View>

      <View className="mt-6">
        <Text className="text-lg font-semibold mb-3" style={textPrimary}>
          Create your username
        </Text>
        <Text className="text-sm mb-3" style={textSecondary}>
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
            <Text className="text-lg mr-1" style={textSecondary}>
              @
            </Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="warrior_123"
              placeholderTextColor={colors.textTertiary}
              className="text-base flex-1"
              style={textPrimary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>
        <Text className="text-xs mt-2" style={textTertiary}>
          {username.length > 0 ? `@${username}` : "Your unique tag"}
        </Text>
      </View>

      <View className="mt-6">
        <Text className="text-lg font-semibold mb-3" style={textPrimary}>
          Tell us about yourself
        </Text>
        <Text className="text-sm mb-3" style={textSecondary}>
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
            placeholderTextColor={colors.textTertiary}
            multiline
            className="text-base"
            style={[textPrimary, { minHeight: 120 }]}
            textAlignVertical="top"
          />
        </View>
        <Text className="text-xs mt-2" style={textTertiary}>
          {aboutYou.length} characters
        </Text>
      </View>
    </ScrollView>
  );

  const renderStep4 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="items-center mb-6">
        <Text className="text-6xl mb-4">🎯</Text>
        <Text className="text-3xl font-bold text-center mb-2" style={textPrimary}>
          Pick Your Focus Areas
        </Text>
        <Text className="text-base text-center px-4" style={textSecondary}>
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
                  <Text className="text-lg font-bold mb-1" style={textPrimary}>
                    {category.label}
                  </Text>
                  <Text className="text-sm" style={textSecondary}>
                    {category.description}
                  </Text>
                </View>
                {isSelected && (
                  <Text className="text-2xl" style={textPrimary}>
                    ✓
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderStep5 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="items-center mb-6">
        <Text className="text-6xl mb-4">🚀</Text>
        <Text className="text-3xl font-bold text-center mb-2" style={textPrimary}>
          What Are Your Goals?
        </Text>
        <Text className="text-base text-center px-4" style={textSecondary}>
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
              <Text
                className="flex-1 text-base"
                style={isSelected ? [textPrimary, { fontWeight: "600" }] : textSecondary}
              >
                {goal.label}
              </Text>
              {isSelected && (
                <Text className="text-xl" style={textPrimary}>
                  ✓
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <View className="mt-6">
        <Text className="text-sm font-semibold mb-3" style={textSecondary}>
          Or write your own goal:
        </Text>
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
            placeholderTextColor={colors.textTertiary}
            className="text-base"
            multiline
            style={[textPrimary, { minHeight: 60 }]}
            textAlignVertical="top"
          />
        </View>
      </View>
    </ScrollView>
  );

  return (
    <LinearGradient colors={colors.background} className="flex-1">
      <SafeAreaView edges={["top"]} className="flex-1">
        <View className="flex-1 px-6 pt-6">
          {renderProgressBar()}

          {currentStep === 0 && renderStep0()}
          {currentStep === 1 && renderChallengeDurationStep()}
          {currentStep === 2 && renderQuestModeStep()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}

          {/* Navigation Buttons */}
          <View className="pb-4 pt-6">
            <View className="flex-row gap-3">
              {currentStep > 0 && (
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
                  <Text className="font-semibold text-base" style={textPrimary}>
                    Back
                  </Text>
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
                <Text className="font-bold text-base" style={textPrimary}>
                  {isLoading
                    ? "Saving..."
                    : currentStep === 0
                    ? "Continue"
                    : currentStep === 3
                    ? "Complete"
                    : "Next"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Policy Viewer Modal */}
      <PolicyViewerModal
        visible={selectedPolicy !== null}
        policyType={selectedPolicy as any}
        onClose={() => {
          setSelectedPolicy(null);
          // Refetch policies after acceptance
          queryClient.invalidateQueries({ queryKey: ["policies"] });
        }}
        onAccept={() => {
          queryClient.invalidateQueries({ queryKey: ["policies"] });
        }}
        requireAcceptance={true}
        showAcceptButton={true}
      />
    </LinearGradient>
  );
}
