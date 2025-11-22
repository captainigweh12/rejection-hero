import React from "react";
import { Pressable, Text, ActivityIndicator, View, StyleSheet } from "react-native";
import { UserPlus, Check, MessageCircle, Users } from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import * as Haptics from "expo-haptics";
import { Alert } from "react-native";

export type FriendshipStatus = "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "FRIENDS";

interface FriendButtonProps {
  userId: string;
  friendshipStatus?: FriendshipStatus | null;
  onStatusChange?: (newStatus: FriendshipStatus) => void;
  showMessageButton?: boolean;
  onMessagePress?: () => void;
  size?: "small" | "medium" | "large";
  requestId?: string; // For accepting pending requests
}

export function FriendButton({
  userId,
  friendshipStatus = "NONE",
  onStatusChange,
  showMessageButton = true,
  onMessagePress,
  size = "medium",
  requestId,
}: FriendButtonProps) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async () => {
      return api.post("/api/friends/request", { userId });
    },
    onMutate: async () => {
      // Optimistic update
      onStatusChange?.("PENDING_SENT");
      await queryClient.cancelQueries({ queryKey: ["friendship-status", userId] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendship-status", userId] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["friend-recommendations"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error: any) => {
      // Revert optimistic update
      onStatusChange?.("NONE");
      Alert.alert("Error", error?.message || "Failed to send friend request");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  // Accept friend request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return api.post(`/api/friends/accept/${requestId}`, {});
    },
    onMutate: async () => {
      // Optimistic update
      onStatusChange?.("FRIENDS");
      await queryClient.cancelQueries({ queryKey: ["friendship-status", userId] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendship-status", userId] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["friend-recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error: any) => {
      // Revert optimistic update
      onStatusChange?.("PENDING_RECEIVED");
      Alert.alert("Error", error?.message || "Failed to accept request");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (friendshipStatus) {
      case "NONE":
        sendRequestMutation.mutate();
        break;
      case "PENDING_RECEIVED":
        if (requestId) {
          acceptRequestMutation.mutate(requestId);
        } else {
          Alert.alert("Error", "Request ID not found. Please accept from the requests list.");
        }
        break;
      case "FRIENDS":
        if (onMessagePress) {
          onMessagePress();
        }
        break;
      default:
        break;
    }
  };

  const getButtonConfig = () => {
    switch (friendshipStatus) {
      case "NONE":
        return {
          label: "Add",
          icon: UserPlus,
          backgroundColor: colors.primary + "33",
          borderColor: colors.primary,
          textColor: colors.primary,
          disabled: false,
        };
      case "PENDING_SENT":
        return {
          label: "Sent",
          icon: Check,
          backgroundColor: colors.secondary + "33",
          borderColor: colors.secondary,
          textColor: colors.secondary,
          disabled: true,
        };
      case "PENDING_RECEIVED":
        return {
          label: "Accept",
          icon: Check,
          backgroundColor: colors.success + "33",
          borderColor: colors.success,
          textColor: colors.success,
          disabled: false,
        };
      case "FRIENDS":
        return {
          label: "Friends",
          icon: Users,
          backgroundColor: colors.success + "33",
          borderColor: colors.success,
          textColor: colors.success,
          disabled: false,
        };
      default:
        return {
          label: "Add",
          icon: UserPlus,
          backgroundColor: colors.primary + "33",
          borderColor: colors.primary,
          textColor: colors.primary,
          disabled: false,
        };
    }
  };

  const config = getButtonConfig();
  const Icon = config.icon;
  const isLoading = sendRequestMutation.isPending || acceptRequestMutation.isPending;

  const sizeStyles = {
    small: { padding: 8, fontSize: 12, iconSize: 14, gap: 4 },
    medium: { padding: 12, fontSize: 15, iconSize: 18, gap: 6 },
    large: { padding: 16, fontSize: 17, iconSize: 20, gap: 8 },
  };

  const currentSize = sizeStyles[size];

  if (friendshipStatus === "FRIENDS" && showMessageButton) {
    return (
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable
          onPress={handlePress}
          disabled={config.disabled || isLoading}
          style={[
            styles.button,
            {
              backgroundColor: config.backgroundColor,
              borderColor: config.borderColor,
              padding: currentSize.padding,
              opacity: config.disabled ? 0.6 : 1,
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={config.textColor} />
          ) : (
            <>
              <Icon size={currentSize.iconSize} color={config.textColor} />
              <Text style={{ color: config.textColor, fontWeight: "600", fontSize: currentSize.fontSize }}>
                {config.label}
              </Text>
            </>
          )}
        </Pressable>
        <Pressable
          onPress={onMessagePress}
          style={[
            styles.button,
            {
              backgroundColor: colors.primary + "33",
              borderColor: colors.primary,
              padding: currentSize.padding,
            },
          ]}
        >
          <MessageCircle size={currentSize.iconSize} color={colors.primary} />
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={config.disabled || isLoading}
      style={[
        styles.button,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          padding: currentSize.padding,
          opacity: config.disabled || isLoading ? 0.6 : 1,
        },
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={config.textColor} />
      ) : (
        <>
          <Icon size={currentSize.iconSize} color={config.textColor} />
          <Text style={{ color: config.textColor, fontWeight: "600", fontSize: currentSize.fontSize }}>
            {config.label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
});

