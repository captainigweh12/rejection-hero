import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert, Dimensions } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileText, Clock, AlertCircle, ChevronRight } from "lucide-react-native";
import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import type { GetPoliciesResponse } from "@/shared/contracts";
import PolicyViewerModal from "./PolicyViewerModal";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.75; // 75% of screen width

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

interface LegalPolicy {
  type: PolicyType;
  name: string;
  accepted: boolean;
  acceptedAt: string | null;
  version: string;
}

export function LegalPoliciesTab() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [expandedPolicy, setExpandedPolicy] = useState<PolicyType | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyType | null>(null);
  const [showPolicyViewer, setShowPolicyViewer] = useState(false);

  const { data: policiesData, isLoading: policiesLoading } = useQuery<GetPoliciesResponse>({
    queryKey: ["policies"],
    queryFn: async () => {
      return api.get<GetPoliciesResponse>("/api/policies");
    },
  });

  const acceptPolicyMutation = useMutation({
    mutationFn: async (policyType: string) => {
      return api.post(`/api/policies/${policyType}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      Alert.alert("Success", "Policy accepted successfully!");
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to accept policy. Please try again.");
    },
  });

  if (policiesLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const policies = policiesData?.policies || [];
  const acceptedCount = policies.filter((p) => p.accepted).length;
  const totalCount = policies.length;

  return (
    <View style={{ marginTop: 20, paddingBottom: 40 }}>
      {/* Summary Card */}
      <View style={{ marginBottom: 16, paddingHorizontal: 20 }}>
        <View
          style={{
            backgroundColor: "rgba(126, 63, 228, 0.15)",
            borderRadius: 12,
            padding: 16,
            borderLeftWidth: 4,
            borderLeftColor: "#7E3FE4",
          }}
        >
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 4 }}>
            Legal Policies Status
          </Text>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}>
            {acceptedCount} of {totalCount} Policies Accepted
          </Text>
          <View style={{ flexDirection: "row", marginTop: 12, alignItems: "center", gap: 8 }}>
            {acceptedCount === totalCount ? (
              <>
                <CheckCircle2 size={16} color="#10b981" />
                <Text style={{ fontSize: 12, color: "#10b981", fontWeight: "600" }}>
                  All policies accepted
                </Text>
              </>
            ) : (
              <>
                <AlertCircle size={16} color={colors.warning || "#f59e0b"} />
                <Text
                  style={{ fontSize: 12, color: colors.warning || "#f59e0b", fontWeight: "600" }}
                >
                  {totalCount - acceptedCount} policies pending
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Horizontal Scrollable Policies List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        pagingEnabled={false}
      >
        {policies.map((policy) => (
          <View
            key={policy.type}
            style={{
              width: CARD_WIDTH,
              backgroundColor: colors.card,
              borderRadius: 16,
              overflow: "hidden",
              borderWidth: 2,
              borderColor: policy.accepted ? "rgba(16, 185, 129, 0.4)" : "rgba(107, 114, 128, 0.3)",
              shadowColor: policy.accepted ? "#10b981" : colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {/* Policy Card Content */}
            <Pressable
              onPress={() => {
                setSelectedPolicy(policy.type as PolicyType);
                setShowPolicyViewer(true);
              }}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={
                  policy.accepted
                    ? ["rgba(16, 185, 129, 0.1)", "transparent"]
                    : ["rgba(126, 63, 228, 0.1)", "transparent"]
                }
                style={{ flex: 1, padding: 16 }}
              >
                {/* Icon and Status */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: policy.accepted ? "rgba(16, 185, 129, 0.2)" : "rgba(126, 63, 228, 0.2)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {policy.accepted ? (
                      <CheckCircle2 size={24} color="#10b981" />
                    ) : (
                      <FileText size={24} color={colors.primary} />
                    )}
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      backgroundColor: policy.accepted ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: policy.accepted ? "#10b981" : "#ef4444",
                        textTransform: "uppercase",
                      }}
                    >
                      {policy.accepted ? "✓ Accepted" : "Pending"}
                    </Text>
                  </View>
                </View>

                {/* Policy Name */}
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 8, lineHeight: 24 }}>
                  {policy.name}
                </Text>

                {/* Accepted Date */}
                {policy.acceptedAt && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                    <Clock size={12} color={colors.textSecondary} />
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                      {new Date(policy.acceptedAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                {/* Version Info */}
                <View style={{ marginTop: "auto", paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.cardBorder }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                      Version {policy.version}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>
                        Read More
                      </Text>
                      <ChevronRight size={14} color={colors.primary} />
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>

            {/* Accept Button (if not accepted) */}
            {!policy.accepted && (
              <View style={{ padding: 16, paddingTop: 0 }}>
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      "Accept Policy",
                      `Do you accept the ${policy.name}?`,
                      [
                        { text: "Cancel", onPress: () => {}, style: "cancel" },
                        {
                          text: "Accept",
                          onPress: () => acceptPolicyMutation.mutate(policy.type),
                          style: "default",
                        },
                      ]
                    );
                  }}
                  disabled={acceptPolicyMutation.isPending}
                  style={{
                    paddingVertical: 12,
                    backgroundColor: "#7E3FE4",
                    borderRadius: 10,
                    alignItems: "center",
                    opacity: acceptPolicyMutation.isPending ? 0.6 : 1,
                  }}
                >
                  {acceptPolicyMutation.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "white" }}>
                      Accept Policy
                    </Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Policy Viewer Modal */}
      {selectedPolicy && (
        <PolicyViewerModal
          visible={showPolicyViewer}
          policyType={selectedPolicy}
          onClose={() => {
            setShowPolicyViewer(false);
            setSelectedPolicy(null);
          }}
        />
      )}
    </View>
  );
}
