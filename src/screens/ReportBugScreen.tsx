import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Bug, Send, CheckCircle } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useMutation } from "@tanstack/react-query";

type Props = NativeStackScreenProps<RootStackParamList, "ReportBug">;

const BUG_CATEGORIES = [
  { id: "BUG", label: "Bug Report", icon: "🐛" },
  { id: "FEATURE_REQUEST", label: "Feature Request", icon: "💡" },
  { id: "UI_ISSUE", label: "UI Issue", icon: "🎨" },
  { id: "PERFORMANCE", label: "Performance", icon: "⚡" },
  { id: "OTHER", label: "Other", icon: "📝" },
];

export default function ReportBugScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<"BUG" | "FEATURE_REQUEST" | "UI_ISSUE" | "PERFORMANCE" | "OTHER">("BUG");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const bugReportMutation = useMutation({
    mutationFn: async (data: {
      subject: string;
      description: string;
      category: string;
      stepsToReproduce?: string;
      deviceInfo?: string;
    }) => {
      return api.post("/api/bug-reports", data);
    },
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => {
        Alert.alert(
          "Bug Report Submitted",
          "Thank you for your report! Our team has been notified and will review it shortly.",
          [
            {
              text: "OK",
              onPress: () => {
                setSubject("");
                setCategory("BUG");
                setDescription("");
                setSteps("");
                setSubmitted(false);
                navigation.goBack();
              },
            },
          ]
        );
      }, 1500);
    },
    onError: (error: any) => {
      Alert.alert(
        "Failed to Submit Report",
        error?.message || "Could not submit your bug report. Please try again."
      );
    },
  });

  const handleSubmit = () => {
    if (!subject.trim() || subject.length < 5) {
      Alert.alert("Invalid Subject", "Please enter a subject with at least 5 characters");
      return;
    }
    if (!description.trim() || description.length < 10) {
      Alert.alert("Invalid Description", "Please enter a description with at least 10 characters");
      return;
    }

    bugReportMutation.mutate({
      subject: subject.trim(),
      description: description.trim(),
      category,
      stepsToReproduce: steps.trim() || undefined,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
      <LinearGradient colors={colors.background as any} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.cardBorder,
            }}
          >
            <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
              <ArrowLeft size={24} color={colors.text} />
            </Pressable>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.text, flex: 1 }}>
              Report a Bug
            </Text>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Hero Section */}
            <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 20,
                  padding: 24,
                  borderWidth: 2,
                  borderColor: colors.cardBorder,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                  alignItems: "center",
                }}
              >
                <LinearGradient
                  colors={["#7E3FE4", "#00D9FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <View
                    style={{
                      width: 74,
                      height: 74,
                      borderRadius: 37,
                      backgroundColor: colors.card,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Bug size={36} color={colors.primary} />
                  </View>
                </LinearGradient>

                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "bold",
                    color: colors.text,
                    textAlign: "center",
                    marginBottom: 8,
                  }}
                >
                  Help Us Improve
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    color: colors.textSecondary,
                    textAlign: "center",
                    lineHeight: 22,
                  }}
                >
                  Found an issue? Let us know and our admin team will be notified immediately.
                </Text>
              </View>
            </View>

            {/* Form */}
            <View style={{ paddingHorizontal: 20, paddingTop: 32 }}>
              {/* Category Selection */}
              <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text, marginBottom: 12 }}>
                Category
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                {BUG_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategory(cat.id as any)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      backgroundColor: category === cat.id ? colors.primary : colors.surface,
                      borderWidth: 2,
                      borderColor: category === cat.id ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: category === cat.id ? "white" : colors.text,
                      }}
                    >
                      {cat.icon} {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Subject */}
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
                Subject *
              </Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="Brief description of the issue (min 5 characters)"
                placeholderTextColor={colors.textTertiary}
                style={{
                  backgroundColor: colors.inputBackground,
                  borderRadius: 12,
                  padding: 16,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.inputBorder,
                  marginBottom: 20,
                  fontSize: 16,
                }}
              />

              {/* Description */}
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
                Description *
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the issue in detail (min 10 characters)..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={{
                  backgroundColor: colors.inputBackground,
                  borderRadius: 12,
                  padding: 16,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.inputBorder,
                  minHeight: 140,
                  marginBottom: 20,
                  fontSize: 16,
                }}
              />

              {/* Steps to Reproduce */}
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
                Steps to Reproduce (Optional)
              </Text>
              <TextInput
                value={steps}
                onChangeText={setSteps}
                placeholder="1. First step...&#10;2. Second step...&#10;3. Third step..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{
                  backgroundColor: colors.inputBackground,
                  borderRadius: 12,
                  padding: 16,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.inputBorder,
                  minHeight: 100,
                  marginBottom: 24,
                  fontSize: 16,
                }}
              />

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={bugReportMutation.isPending || submitted}
                style={{
                  borderRadius: 16,
                  padding: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: submitted ? colors.success : colors.primary,
                  shadowColor: submitted ? colors.success : colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 6,
                  opacity: bugReportMutation.isPending ? 0.7 : 1,
                }}
              >
                {bugReportMutation.isPending ? (
                  <ActivityIndicator color="white" />
                ) : submitted ? (
                  <>
                    <CheckCircle size={24} color="white" />
                    <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", marginLeft: 12 }}>
                      Report Submitted!
                    </Text>
                  </>
                ) : (
                  <>
                    <Send size={24} color="white" />
                    <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", marginLeft: 12 }}>
                      Submit Report
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Info Section */}
            <View style={{ paddingHorizontal: 20, paddingTop: 32 }}>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
                  What Happens Next?
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
                  Your bug report will be sent directly to our admin team. They will review it and investigate the issue. You&apos;ll receive
                  updates via email.
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
