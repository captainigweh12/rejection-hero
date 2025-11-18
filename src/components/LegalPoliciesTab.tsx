import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileText, Clock, AlertCircle } from "lucide-react-native";
import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import type { GetPoliciesResponse } from "@/shared/contracts";
import PolicyViewerModal from "./PolicyViewerModal";

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
    <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
      {/* Summary Card */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <View
          style={{
            backgroundColor: "rgba(0, 217, 255, 0.1)",
            borderRadius: 12,
            padding: 16,
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
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

      {/* Policies List */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        {policies.map((policy) => (
          <View
            key={policy.type}
            style={{
              backgroundColor: colors.backgroundSolid,
              borderRadius: 12,
              marginBottom: 12,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: policy.accepted ? "rgba(16, 185, 129, 0.3)" : "rgba(107, 114, 128, 0.2)",
            }}
          >
            {/* Policy Header */}
            <Pressable
              onPress={() => setExpandedPolicy(expandedPolicy === policy.type ? null : (policy.type as PolicyType))}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 16,
              }}
            >
              {/* Icon */}
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: policy.accepted ? "rgba(16, 185, 129, 0.15)" : "rgba(107, 114, 128, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {policy.accepted ? (
                  <CheckCircle2 size={24} color="#10b981" />
                ) : (
                  <FileText size={24} color={colors.textSecondary} />
                )}
              </View>

              {/* Content */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 4 }}>
                  {policy.name}
                </Text>
                {policy.acceptedAt && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Clock size={12} color={colors.textSecondary} />
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                      Accepted on {new Date(policy.acceptedAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Status Badge */}
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: policy.accepted ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                  borderRadius: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: policy.accepted ? "#10b981" : "#ef4444",
                  }}
                >
                  {policy.accepted ? "Accepted" : "Pending"}
                </Text>
              </View>
            </Pressable>

            {/* Expanded Content */}
            {expandedPolicy === policy.type && (
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingBottom: 16,
                  borderTopWidth: 1,
                  borderTopColor: "rgba(107, 114, 128, 0.2)",
                  gap: 12,
                }}
              >
                {/* Read Policy Button */}
                <Pressable
                  onPress={() => {
                    setSelectedPolicy(policy.type as PolicyType);
                    setShowPolicyViewer(true);
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: "rgba(0, 217, 255, 0.1)",
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.primary,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>
                    Read Full Policy
                  </Text>
                </Pressable>

                {/* Accept Button (if not already accepted) */}
                {!policy.accepted && (
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
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: colors.primary,
                      borderRadius: 8,
                      alignItems: "center",
                      opacity: acceptPolicyMutation.isPending ? 0.6 : 1,
                    }}
                  >
                    {acceptPolicyMutation.isPending ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                        Accept Policy
                      </Text>
                    )}
                  </Pressable>
                )}

                {/* Info Text */}
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontStyle: "italic" }}>
                  Version {policy.version}
                  {policy.acceptedAt &&
                    ` • Accepted on ${new Date(policy.acceptedAt).toLocaleString()}`}
                </Text>
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
