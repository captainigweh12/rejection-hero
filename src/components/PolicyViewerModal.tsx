import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { X, Check, FileText } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useMutation } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";

type PolicyType =
  | "terms-of-service"
  | "privacy-policy"
  | "content-guidelines"
  | "dmca"
  | "recording-consent"
  | "liability-waiver"
  | "age-policy"
  | "safety-policy"
  | "payment-policy";

interface PolicyViewerModalProps {
  visible: boolean;
  policyType: PolicyType;
  onClose: () => void;
  onAccept?: () => void;
  requireAcceptance?: boolean;
  showAcceptButton?: boolean;
}

const POLICY_NAMES: Record<PolicyType, string> = {
  "terms-of-service": "Terms of Service",
  "privacy-policy": "Privacy Policy",
  "content-guidelines": "Content & Community Guidelines",
  "dmca": "DMCA Policy & Copyright Notice",
  "recording-consent": "Recording Consent & Release",
  "liability-waiver": "Liability Waiver & Risk Disclosure",
  "age-policy": "Age Verification Policy",
  "safety-policy": "Safety & Misconduct Reporting Policy",
  "payment-policy": "Payment Policy",
};

export default function PolicyViewerModal({
  visible,
  policyType,
  onClose,
  onAccept,
  requireAcceptance = false,
  showAcceptButton = false,
}: PolicyViewerModalProps) {
  const { colors } = useTheme();
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);

  const textPrimary = { color: colors.text };
  const textSecondary = { color: colors.textSecondary };

  // Fetch policy content
  useEffect(() => {
    if (visible) {
      fetchPolicyContent();
    }
  }, [visible, policyType]);

  const fetchPolicyContent = async () => {
    setIsLoading(true);
    setContent(""); // Clear previous content
    try {
      const response = await api.get(`/api/policies/${policyType}`) as { content?: string; policyType?: string };
      console.log("Policy response:", { hasContent: !!response.content, contentLength: response.content?.length });
      if (response.content) {
        setContent(response.content);
      } else {
        console.error("No content in response:", response);
        Alert.alert("Error", "Policy content is empty. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching policy:", error);
      Alert.alert("Error", "Failed to load policy content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const acceptMutation = useMutation({
    mutationFn: async () => {
      return await api.post(`/api/policies/${policyType}/accept`);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (onAccept) {
        onAccept();
      }
      onClose();
    },
    onError: (error: any) => {
      console.error("Error accepting policy:", error);
      Alert.alert("Error", "Failed to accept policy. Please try again.");
    },
  });

  const handleAccept = () => {
    if (requireAcceptance && !hasScrolled) {
      Alert.alert(
        "Please Read",
        "Please scroll through the entire policy before accepting."
      );
      return;
    }
    acceptMutation.mutate();
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isScrolledToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    if (isScrolledToBottom) {
      setHasScrolled(true);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.backgroundSolid || "#0A0A0F" }}>
        <SafeAreaView edges={["top"]} className="flex-1">
          {/* Header */}
          <View
            className="flex-row items-center justify-between px-6 py-4 border-b"
            style={{ borderBottomColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <View className="flex-row items-center flex-1">
              <FileText size={24} color={colors.text} className="mr-3" />
              <Text className="text-xl font-bold flex-1" style={textPrimary}>
                {POLICY_NAMES[policyType]}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="w-10 h-10 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            >
              <X size={20} color={colors.text} />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView
            className="flex-1 px-6 py-4"
            onScroll={handleScroll}
            scrollEventThrottle={400}
            showsVerticalScrollIndicator={true}
          >
            {isLoading ? (
              <View className="flex-1 items-center justify-center py-20">
                <ActivityIndicator size="large" color="#7E3FE4" />
                <Text className="mt-4" style={textSecondary}>
                  Loading policy...
                </Text>
              </View>
            ) : content ? (
              <View>
                <Text
                  className="text-base leading-6 mb-4"
                  style={[textPrimary, { color: colors.text || "#FFFFFF" }]}
                  selectable
                >
                  {content}
                </Text>
                {requireAcceptance && !hasScrolled && (
                  <View
                    className="p-4 rounded-2xl mb-4"
                    style={{ backgroundColor: "rgba(255, 107, 53, 0.1)" }}
                  >
                    <Text className="text-sm text-center" style={textPrimary}>
                      ⚠️ Please scroll to the bottom to read the entire policy
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View className="flex-1 items-center justify-center py-20">
                <Text style={[textSecondary, { color: colors.textSecondary || "#999999" }]}>
                  No content available
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer with Accept Button */}
          {(showAcceptButton || requireAcceptance) && (
            <View
              className="px-6 py-4 border-t"
              style={{ borderTopColor: "rgba(255, 255, 255, 0.1)" }}
            >
              <Pressable
                onPress={handleAccept}
                disabled={acceptMutation.isPending || (requireAcceptance && !hasScrolled)}
                className="py-4 rounded-2xl items-center overflow-hidden flex-row justify-center"
                style={{
                  opacity: acceptMutation.isPending || (requireAcceptance && !hasScrolled) ? 0.5 : 1,
                }}
              >
                <LinearGradient
                  colors={["#7E3FE4", "#FF6B35"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="absolute inset-0"
                />
                {acceptMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Check size={20} color="white" className="mr-2" />
                    <Text className="font-bold text-base text-white">
                      I Accept
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

