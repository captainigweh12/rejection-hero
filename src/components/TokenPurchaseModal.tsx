import React, { useState } from "react";
import { View, Text, Pressable, Modal, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Zap, X, Check } from "lucide-react-native";
import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import type { GetTokensResponse, CreateTokenPurchaseResponse } from "@/shared/contracts";
import * as WebBrowser from "expo-web-browser";

interface TokenPurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const TOKEN_PACKAGES = [
  { tokens: 10, price: 0.99, priceInCents: 99, label: "Starter", savings: null },
  { tokens: 50, price: 4.99, priceInCents: 499, label: "Popular", savings: "20% off" },
  { tokens: 100, price: 8.99, priceInCents: 899, label: "Value", savings: "35% off" },
  { tokens: 250, price: 19.99, priceInCents: 1999, label: "Pro", savings: "50% off" },
];

export function TokenPurchaseModal({ visible, onClose, onSuccess }: TokenPurchaseModalProps) {
  const { colors } = useTheme();
  const [selectedPackage, setSelectedPackage] = useState(TOKEN_PACKAGES[1]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get current token balance
  const { data: tokenData } = useQuery<GetTokensResponse>({
    queryKey: ["tokens"],
    queryFn: async () => api.get<GetTokensResponse>("/api/payments/tokens"),
    enabled: visible,
  });

  // Create token purchase checkout
  const purchaseMutation = useMutation({
    mutationFn: async (amount: number) => {
      return api.post<CreateTokenPurchaseResponse>("/api/payments/create-token-purchase", {
        amount,
      });
    },
    onSuccess: async (data) => {
      // Open Stripe checkout in web browser
      if (data.url) {
        await WebBrowser.openBrowserAsync(data.url);
        onSuccess?.();
        onClose();
      }
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to initiate purchase");
    },
  });

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      purchaseMutation.mutate(selectedPackage.tokens);
    } catch (error) {
      console.error("Purchase error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: colors.modalOverlay, justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: 40,
            maxHeight: "90%",
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Zap size={28} color={colors.primary} />
              <Text style={{ fontSize: 22, fontWeight: "bold", color: colors.text }}>Buy Tokens</Text>
            </View>
            <Pressable onPress={onClose}>
              <X size={28} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Current Balance */}
          <View
            style={{
              backgroundColor: "rgba(0, 217, 255, 0.1)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              borderLeftWidth: 4,
              borderLeftColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Current Balance</Text>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.text }}>
              {tokenData?.tokens || 0} tokens
            </Text>
          </View>

          {/* Token Packages */}
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 12 }}>
            Choose a Package
          </Text>

          <ScrollView style={{ marginBottom: 24 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 12 }}>
              {TOKEN_PACKAGES.map((pkg) => (
                <Pressable
                  key={pkg.tokens}
                  onPress={() => setSelectedPackage(pkg)}
                  style={{
                    backgroundColor: selectedPackage.tokens === pkg.tokens ? colors.primary : colors.backgroundSolid,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 2,
                    borderColor:
                      selectedPackage.tokens === pkg.tokens ? colors.primary : "rgba(107, 114, 128, 0.2)",
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <View>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "700",
                          color: selectedPackage.tokens === pkg.tokens ? colors.text : colors.text,
                          marginBottom: 4,
                        }}
                      >
                        {pkg.tokens} Tokens
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: selectedPackage.tokens === pkg.tokens ? "rgba(255,255,255,0.7)" : colors.textSecondary,
                        }}
                      >
                        {pkg.label}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "bold",
                          color: selectedPackage.tokens === pkg.tokens ? colors.text : colors.text,
                          marginBottom: 4,
                        }}
                      >
                        ${pkg.price.toFixed(2)}
                      </Text>
                      {pkg.savings && (
                        <View
                          style={{
                            backgroundColor: "#10b981",
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: "600", color: "white" }}>{pkg.savings}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {selectedPackage.tokens === pkg.tokens && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Check size={16} color={colors.text} />
                      <Text style={{ fontSize: 12, color: colors.text, fontWeight: "600" }}>Selected</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Info Text */}
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 20, textAlign: "center" }}>
            Tokens are used to send quests to friends and unlock premium features.
          </Text>

          {/* Purchase Button */}
          <Pressable
            onPress={handlePurchase}
            disabled={isProcessing || purchaseMutation.isPending}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              opacity: isProcessing || purchaseMutation.isPending ? 0.6 : 1,
            }}
          >
            {isProcessing || purchaseMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text }}>
                Purchase {selectedPackage.tokens} Tokens
              </Text>
            )}
          </Pressable>

          {/* Cancel Button */}
          <Pressable
            onPress={onClose}
            style={{
              paddingVertical: 12,
              alignItems: "center",
              marginTop: 12,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: "600" }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
