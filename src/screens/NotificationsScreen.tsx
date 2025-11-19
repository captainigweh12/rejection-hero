import React from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Bell, Check, UserPlus, Users, X, TrendingUp, Trophy, Target } from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { api } from "@/lib/api";
import * as Haptics from "expo-haptics";
import { playSound } from "@/services/soundService";

type Props = NativeStackScreenProps<RootStackParamList, "Notifications">;

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data: any;
  createdAt: string;
  sender: {
    id: string;
    displayName: string;
    avatar: string | null;
  } | null;
}

export default function NotificationsScreen({ navigation }: Props) {
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notificationsData, isLoading, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await api.get<{ notifications: Notification[] }>("/api/notifications");
      return response;
    },
  });

  // Play sound when new notifications arrive
  React.useEffect(() => {
    if (notificationsData?.notifications) {
      const unreadCount = notificationsData.notifications.filter((n) => !n.read).length;
      if (unreadCount > 0) {
        playSound("notificationReceived").catch(console.error);
      }
    }
  }, [notificationsData?.notifications]);

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return api.post(`/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return api.post("/api/notifications/mark-all-read", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return api.delete(`/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
    },
  });

  // Accept friend request from notification
  const acceptFriendMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      return api.post(`/api/friends/accept/${friendshipId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  // Decline friend request from notification
  const declineFriendMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      return api.post(`/api/friends/decline/${friendshipId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Handle navigation based on notification type
    if (notification.type === "FRIEND_ACCEPTED") {
      navigation.navigate("Friends");
    } else if (notification.type === "CONFIDENCE_LOW") {
      // Navigate to home to see quests
      navigation.navigate("Tabs", { screen: "HomeTab" });
    } else if (notification.type === "LEADERBOARD_FALL_BEHIND") {
      // Navigate to leaderboard
      navigation.navigate("Leaderboard");
    } else if (notification.type === "QUEST_STARTED" && notification.data?.userQuestId && notification.data?.userId) {
      // Navigate to friend quest view
      navigation.navigate("FriendQuestView", {
        userQuestId: notification.data.userQuestId,
        userId: notification.data.userId,
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "FRIEND_REQUEST":
        return <UserPlus size={24} color="#00D9FF" />;
      case "FRIEND_ACCEPTED":
        return <Users size={24} color="#4CAF50" />;
      case "CONFIDENCE_LOW":
        return <TrendingUp size={24} color="#FF6B35" />;
      case "LEADERBOARD_FALL_BEHIND":
        return <Trophy size={24} color="#FFD700" />;
      case "QUEST_STARTED":
        return <Target size={24} color="#7E3FE4" />;
      default:
        return <Bell size={24} color="#A78BFA" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotification = (notification: Notification) => {
    const isFriendRequest = notification.type === "FRIEND_REQUEST";

    return (
      <Pressable
        key={notification.id}
        onPress={() => handleNotificationPress(notification)}
        style={{
          backgroundColor: notification.read ? "rgba(255, 255, 255, 0.03)" : "rgba(126, 63, 228, 0.1)",
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: notification.read ? "rgba(255, 255, 255, 0.05)" : "rgba(126, 63, 228, 0.3)",
        }}
      >
        <View style={{ flexDirection: "row", gap: 12 }}>
          {/* Avatar or Icon */}
          {notification.sender?.avatar ? (
            <Image
              source={{ uri: notification.sender.avatar }}
              style={{ width: 48, height: 48, borderRadius: 24 }}
            />
          ) : (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "rgba(126, 63, 228, 0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {getNotificationIcon(notification.type)}
            </View>
          )}

          {/* Content */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "white", marginBottom: 4 }}>
              {notification.title}
            </Text>
            <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.7)", marginBottom: 6 }}>
              {notification.message}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.4)" }}>
              {formatTime(notification.createdAt)}
            </Text>

            {/* Friend Request Actions */}
            {isFriendRequest && notification.data?.friendshipId && (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                <Pressable
                  onPress={() => {
                    acceptFriendMutation.mutate(notification.data.friendshipId);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(0, 217, 255, 0.2)",
                    borderRadius: 12,
                    paddingVertical: 10,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "rgba(0, 217, 255, 0.3)",
                  }}
                >
                  <Text style={{ color: "#00D9FF", fontWeight: "600", fontSize: 14 }}>Accept</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    declineFriendMutation.mutate(notification.data.friendshipId);
                    deleteNotificationMutation.mutate(notification.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255, 107, 53, 0.2)",
                    borderRadius: 12,
                    paddingVertical: 10,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "rgba(255, 107, 53, 0.3)",
                  }}
                >
                  <Text style={{ color: "#FF6B35", fontWeight: "600", fontSize: 14 }}>Decline</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Delete button */}
          <Pressable
            onPress={() => {
              deleteNotificationMutation.mutate(notification.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} color="rgba(255, 255, 255, 0.5)" />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
      <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Pressable onPress={() => navigation.goBack()}>
                <ChevronLeft size={28} color="white" />
              </Pressable>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </Text>
            </View>

            {unreadCount > 0 && (
              <Pressable
                onPress={() => markAllAsReadMutation.mutate()}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  backgroundColor: "rgba(126, 63, 228, 0.2)",
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.3)",
                }}
              >
                <Text style={{ color: "#A78BFA", fontSize: 12, fontWeight: "600" }}>Mark all read</Text>
              </Pressable>
            )}
          </View>

          {/* Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#A78BFA" />}
          >
            {isLoading ? (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#A78BFA" />
              </View>
            ) : notifications.length === 0 ? (
              <View style={{ paddingVertical: 60, alignItems: "center" }}>
                <Bell size={64} color="rgba(255, 255, 255, 0.3)" />
                <Text
                  style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 16, marginTop: 16, textAlign: "center" }}
                >
                  No notifications yet
                </Text>
                <Text
                  style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 14, marginTop: 8, textAlign: "center" }}
                >
                  You&apos;ll see notifications here when you get friend requests or other updates
                </Text>
              </View>
            ) : (
              notifications.map(renderNotification)
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
