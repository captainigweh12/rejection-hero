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
import { ArrowLeft, HelpCircle, Mail, MessageSquare, Send, CheckCircle } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import { useTheme } from "@/contexts/ThemeContext";

type Props = NativeStackScreenProps<RootStackParamList, "Support">;

const ISSUE_CATEGORIES = [
  { id: "bug", label: "Bug Report", icon: "🐛" },
  { id: "feature", label: "Feature Request", icon: "💡" },
  { id: "account", label: "Account Issue", icon: "👤" },
  { id: "payment", label: "Payment/Billing", icon: "💳" },
  { id: "technical", label: "Technical Support", icon: "⚙️" },
  { id: "other", label: "Other", icon: "📝" },
];

export default function SupportScreen({ navigation }: Props) {
  const { data: sessionData } = useSession();
  const { colors } = useTheme();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmitTicket = async () => {
    if (!subject.trim()) {
      Alert.alert("Error", "Please enter a subject for your ticket");
      return;
    }

    if (!category) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Error", "Please describe your issue");
      return;
    }

    setSending(true);
    try {
      const response = await api.post("/api/support/create-ticket", {
        subject: subject.trim(),
        category,
        description: description.trim(),
        userEmail: sessionData?.user?.email || "",
        userName: sessionData?.user?.name || "User",
      });

      setSent(true);

      // Show success message and clear form after delay
      setTimeout(() => {
        Alert.alert(
          "Ticket Submitted",
          "Your support ticket has been submitted successfully. You'll receive a confirmation email shortly. We'll get back to you as soon as possible!",
          [
            {
              text: "OK",
              onPress: () => {
                setSubject("");
                setCategory("");
                setDescription("");
                setSent(false);
                navigation.goBack();
              },
            },
          ]
        );
      }, 1500);
    } catch (error: any) {
      console.error("Failed to submit ticket:", error);
      Alert.alert(
        "Failed to Submit Ticket",
        error?.message || "Could not submit your support ticket. Please try again."
      );
      setSent(false);
    } finally {
      setSending(false);
    }
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
              Support
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
                    <HelpCircle size={36} color={colors.primary} />
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
                  How Can We Help?
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    color: colors.textSecondary,
                    textAlign: "center",
                    lineHeight: 22,
                  }}
                >
                  Submit a support ticket and our team will get back to you as soon as possible.
                </Text>
              </View>
            </View>

            {/* Support Form */}
            <View style={{ paddingHorizontal: 20, paddingTop: 32 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: colors.text,
                  marginBottom: 16,
                }}
              >
                Submit a Ticket
              </Text>

              {/* Subject Input */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.text,
                    marginBottom: 8,
                  }}
                >
                  Subject
                </Text>
                <View
                  style={{
                    backgroundColor: colors.inputBackground,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                  }}
                >
                  <Mail size={20} color={colors.textSecondary} />
                  <TextInput
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="Brief summary of your issue"
                    placeholderTextColor={colors.textTertiary}
                    style={{
                      flex: 1,
                      color: colors.text,
                      fontSize: 16,
                      paddingVertical: 16,
                      paddingHorizontal: 12,
                    }}
                  />
                </View>
              </View>

              {/* Category Selection */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.text,
                    marginBottom: 8,
                  }}
                >
                  Category
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {ISSUE_CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat.id}
                      onPress={() => setCategory(cat.id)}
                      style={{
                        backgroundColor:
                          category === cat.id
                            ? colors.primaryLight
                            : colors.surface,
                        borderRadius: 12,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderWidth: 2,
                        borderColor:
                          category === cat.id
                            ? colors.primary
                            : colors.cardBorder,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: category === cat.id ? colors.primary : colors.text,
                        }}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Description Input */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: colors.text,
                    marginBottom: 8,
                  }}
                >
                  Description
                </Text>
                <View
                  style={{
                    backgroundColor: colors.inputBackground,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    paddingHorizontal: 16,
                    paddingTop: 16,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 8 }}>
                    <MessageSquare size={20} color={colors.textSecondary} />
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        marginLeft: 8,
                      }}
                    >
                      Please describe your issue in detail
                    </Text>
                  </View>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="What seems to be the problem? Include any steps to reproduce the issue, error messages, or screenshots you may have..."
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={8}
                    style={{
                      color: colors.text,
                      fontSize: 16,
                      paddingVertical: 8,
                      textAlignVertical: "top",
                      minHeight: 150,
                    }}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmitTicket}
                disabled={sending || sent}
                style={{
                  borderRadius: 16,
                  padding: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: sent ? colors.success : colors.primary,
                  shadowColor: sent ? colors.success : colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 6,
                  opacity: sending ? 0.7 : 1,
                }}
              >
                {sending ? (
                  <ActivityIndicator color={colors.text} />
                ) : sent ? (
                  <>
                    <CheckCircle size={24} color={colors.text} />
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: colors.text,
                        marginLeft: 12,
                      }}
                    >
                      Ticket Submitted!
                    </Text>
                  </>
                ) : (
                  <>
                    <Send size={24} color={colors.text} />
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: colors.text,
                        marginLeft: 12,
                      }}
                    >
                      Submit Ticket
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Help Text */}
            <View style={{ paddingHorizontal: 20, paddingTop: 32 }}>
              <View
                style={{
                  backgroundColor: colors.info + "20",
                  borderRadius: 16,
                  padding: 16,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.info,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.text,
                    lineHeight: 20,
                  }}
                >
                  <Text style={{ fontWeight: "bold", color: colors.info }}>💡 Tip:</Text> You&apos;ll
                  receive a confirmation email once your ticket is submitted. Our support team
                  typically responds within 24 hours.
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
