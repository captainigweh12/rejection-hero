import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileText, Clock, AlertCircle, ChevronRight, ArrowLeft } from "lucide-react-native";
import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import type { GetPoliciesResponse } from "@/shared/contracts";
import PolicyViewerModal from "@/components/PolicyViewerModal";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "LegalPolicies">;

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

export default function LegalPoliciesScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
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
      <View style={{ flex: 1, backgroundColor: colors.backgroundSolid, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const policies = policiesData?.policies || [];
  const acceptedCount = policies.filter((p) => p.accepted).length;
  const totalCount = policies.length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
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
            Legal Disclaimers
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={true}
        >
          {/* Summary Card */}
          <View style={{ marginTop: 20, paddingHorizontal: 20, marginBottom: 24 }}>
            <View
              style={{
                backgroundColor: "rgba(126, 63, 228, 0.15)",
                borderRadius: 16,
                padding: 20,
                borderLeftWidth: 4,
                borderLeftColor: "#7E3FE4",
              }}
            >
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 4 }}>
                Legal Policies Status
              </Text>
              <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.text, marginBottom: 8 }}>
                {acceptedCount} of {totalCount} Policies Accepted
              </Text>
              <View style={{ flexDirection: "row", marginTop: 12, alignItems: "center", gap: 8 }}>
                {acceptedCount === totalCount ? (
                  <>
                    <CheckCircle2 size={18} color="#10b981" />
                    <Text style={{ fontSize: 14, color: "#10b981", fontWeight: "600" }}>
                      All policies accepted
                    </Text>
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} color={colors.warning || "#f59e0b"} />
                    <Text style={{ fontSize: 14, color: colors.warning || "#f59e0b", fontWeight: "600" }}>
                      {totalCount - acceptedCount} policies pending
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Vertical Policies List */}
          <View style={{ paddingHorizontal: 20 }}>
            {policies.map((policy, index) => (
              <View
                key={policy.type}
                style={{
                  marginBottom: index < policies.length - 1 ? 16 : 0,
                }}
              >
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: policy.accepted ? "rgba(16, 185, 129, 0.4)" : "rgba(107, 114, 128, 0.3)",
                    overflow: "hidden",
                    shadowColor: policy.accepted ? "#10b981" : colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  {/* Policy Card Content */}
                  <Pressable
                    onPress={() => {
                      setSelectedPolicy(policy.type as PolicyType);
                      setShowPolicyViewer(true);
                    }}
                    style={{ padding: 20 }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 16 }}>
                      {/* Icon */}
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 28,
                          backgroundColor: policy.accepted ? "rgba(16, 185, 129, 0.2)" : "rgba(126, 63, 228, 0.2)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {policy.accepted ? (
                          <CheckCircle2 size={28} color="#10b981" />
                        ) : (
                          <FileText size={28} color={colors.primary} />
                        )}
                      </View>

                      {/* Policy Info */}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, flex: 1 }}>
                            {policy.name}
                          </Text>
                          <View
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              backgroundColor: policy.accepted ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                              borderRadius: 12,
                              marginLeft: 8,
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

                        {/* Accepted Date */}
                        {policy.acceptedAt && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                            <Clock size={14} color={colors.textSecondary} />
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                              Accepted on {new Date(policy.acceptedAt).toLocaleDateString()}
                            </Text>
                          </View>
                        )}

                        {/* Version Info */}
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                            Version {policy.version}
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>
                              Read Full Policy
                            </Text>
                            <ChevronRight size={16} color={colors.primary} />
                          </View>
                        </View>
                      </View>
                    </View>
                  </Pressable>

                  {/* Accept Button (if not accepted) */}
                  {!policy.accepted && (
                    <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
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
                          paddingVertical: 14,
                          backgroundColor: "#7E3FE4",
                          borderRadius: 12,
                          alignItems: "center",
                          opacity: acceptPolicyMutation.isPending ? 0.6 : 1,
                        }}
                      >
                        {acceptPolicyMutation.isPending ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Text style={{ fontSize: 16, fontWeight: "700", color: "white" }}>
                            Accept Policy
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
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
      </SafeAreaView>
    </View>
  );
}

