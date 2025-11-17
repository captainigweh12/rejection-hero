import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Image, Alert, Modal, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Users,
  MessageCircle,
  UserPlus,
  UsersRound,
  Bell,
  Send,
  Group,
  Share2,
  TrendingUp,
  X,
  Home,
  Plus,
  Globe,
  Lock
} from "lucide-react-native";
import type { BottomTabScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import FeedScreen from "./FeedScreen";

type Props = BottomTabScreenProps<"SwipeTab">;

interface Friend {
  id: string;
  email: string;
  displayName: string;
  avatar: string | null;
  friendsSince: string;
}

interface FriendRequest {
  id: string;
  userId: string;
  displayName: string;
  avatar: string | null;
  requestedAt: string;
}

interface Conversation {
  userId: string;
  displayName: string;
  avatar: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface GroupType {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  memberCount: number;
  role?: string;
}

export default function CommunityScreen({ navigation }: Props) {
  const { data: sessionData } = useSession();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"feed" | "friends" | "messages" | "groups">("feed");

  // Ref to store FeedScreen's setShowCreatePost function
  const [feedCreatePostHandler, setFeedCreatePostHandler] = useState<(() => void) | null>(null);

  // Create Group modal state
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupPrivacy, setGroupPrivacy] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");

  // Fetch friends
  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      return api.get<{ friends: Friend[] }>("/api/friends");
    },
    enabled: !!sessionData?.user,
  });

  // Fetch friend requests
  const { data: requestsData } = useQuery({
    queryKey: ["friend-requests"],
    queryFn: async () => {
      return api.get<{ requests: FriendRequest[] }>("/api/friends/requests");
    },
    enabled: !!sessionData?.user,
  });

  // Fetch unread notification count
  const { data: notificationsCount } = useQuery({
    queryKey: ["notifications-count"],
    queryFn: async () => {
      return api.get<{ count: number }>("/api/notifications/unread-count");
    },
    enabled: !!sessionData?.user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch conversations
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      return api.get<{ conversations: Conversation[] }>("/api/messages/conversations");
    },
    enabled: !!sessionData?.user,
  });

  // Fetch groups
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      return api.get<{ myGroups: GroupType[]; discoverGroups: GroupType[] }>("/api/groups");
    },
    enabled: !!sessionData?.user,
  });

  // Accept friend request mutation
  const acceptFriendMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return api.post(`/api/friends/accept/${requestId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to accept friend request");
    },
  });

  // Decline friend request mutation
  const declineFriendMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return api.post(`/api/friends/decline/${requestId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to decline friend request");
    },
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return api.post(`/api/groups/${groupId}/join`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to join group");
    },
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; isPublic: boolean }) => {
      return api.post("/api/groups/create", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setShowCreateGroupModal(false);
      setGroupName("");
      setGroupDescription("");
      setGroupPrivacy("PUBLIC");
      Alert.alert("Success", "Group created successfully!");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to create group");
    },
  });

  // Handler functions
  const handleAcceptFriend = (requestId: string) => {
    acceptFriendMutation.mutate(requestId);
  };

  const handleDeclineFriend = (requestId: string) => {
    declineFriendMutation.mutate(requestId);
  };

  const handleJoinGroup = (groupId: string) => {
    joinGroupMutation.mutate(groupId);
  };

  const handleMessageFriend = (friendId: string, friendName: string, friendAvatar: string | null) => {
    navigation.navigate("Chat", {
      userId: friendId,
      userName: friendName,
      userAvatar: friendAvatar
    });
  };

  const handleShareQuest = (friendId: string, friendName: string) => {
    navigation.navigate("SendQuestToFriend", { friendId, friendName });
  };

  const handleOpenConversation = (userId: string, userName: string, userAvatar: string | null) => {
    navigation.navigate("Chat", {
      userId,
      userName,
      userAvatar,
    });
  };

  const handleOpenGroup = (groupId: string) => {
    navigation.navigate("GroupDetail", { groupId });
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    createGroupMutation.mutate({
      name: groupName.trim(),
      description: groupDescription.trim(),
      isPublic: groupPrivacy === "PUBLIC",
    });
  };

  if (!sessionData?.user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <Users size={64} color={colors.primary} />
            <Text style={{ fontSize: 28, fontWeight: "bold", marginTop: 24, marginBottom: 16, textAlign: "center", color: colors.text }}>
              Join the Community
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 16, textAlign: "center", marginBottom: 32 }}>
              Connect with friends, chat, join groups, and share quests together!
            </Text>
            <Pressable
              onPress={() => navigation.navigate("LoginModalScreen")}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 48,
                paddingVertical: 16,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 18 }}>Get Started</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const friends = friendsData?.friends || [];
  const requests = requestsData?.requests || [];
  const unreadCount = notificationsCount?.count || 0;
  const conversations = conversationsData?.conversations || [];
  const myGroups = groupsData?.myGroups || [];
  const discoverGroups = groupsData?.discoverGroups || [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.text }}>Community</Text>

            <View style={{ flexDirection: "row", gap: 12 }}>
              {/* Notifications Bell */}
              <Pressable
                onPress={() => {
                  navigation.navigate("Notifications" as any);
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.card,
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <Bell size={20} color={colors.text} />
                {unreadCount > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: "#FF3B30",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: colors.text, fontSize: 10, fontWeight: "bold" }}>{unreadCount}</Text>
                  </View>
                )}
              </Pressable>

              {/* Search Button */}
              <Pressable
                onPress={() => {
                  navigation.navigate("SearchUsers");
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.card,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Search size={20} color={colors.text} />
              </Pressable>
            </View>
          </View>

          {/* Tab Switcher Buttons */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {/* Feed Tab */}
            <Pressable
              onPress={() => setActiveTab("feed")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: activeTab === "feed" ? colors.primary : colors.card,
                gap: 6,
              }}
            >
              <Home size={18} color={activeTab === "feed" ? colors.text : colors.textSecondary} strokeWidth={2.5} />
              <Text style={{ color: activeTab === "feed" ? colors.text : colors.textSecondary, fontSize: 13, fontWeight: "600" }}>
                Feed
              </Text>
            </Pressable>

            {/* Friends Tab */}
            <Pressable
              onPress={() => setActiveTab("friends")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: activeTab === "friends" ? colors.primary : colors.card,
                gap: 6,
              }}
            >
              <Users size={18} color={activeTab === "friends" ? colors.text : colors.textSecondary} strokeWidth={2.5} />
              <Text style={{ color: activeTab === "friends" ? colors.text : colors.textSecondary, fontSize: 13, fontWeight: "600" }}>
                Friends
              </Text>
            </Pressable>

            {/* Messages Tab */}
            <Pressable
              onPress={() => setActiveTab("messages")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: activeTab === "messages" ? colors.primary : colors.card,
                gap: 6,
              }}
            >
              <MessageCircle size={18} color={activeTab === "messages" ? colors.text : colors.textSecondary} strokeWidth={2.5} />
              <Text style={{ color: activeTab === "messages" ? colors.text : colors.textSecondary, fontSize: 13, fontWeight: "600" }}>
                Messages
              </Text>
            </Pressable>

            {/* Groups Tab */}
            <Pressable
              onPress={() => setActiveTab("groups")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: activeTab === "groups" ? colors.primary : colors.card,
                gap: 6,
              }}
            >
              <UsersRound size={18} color={activeTab === "groups" ? colors.text : colors.textSecondary} strokeWidth={2.5} />
              <Text style={{ color: activeTab === "groups" ? colors.text : colors.textSecondary, fontSize: 13, fontWeight: "600" }}>
                Groups
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Content */}
        {activeTab === "feed" ? (
          <FeedScreen
            onCreatePostPress={() => {
              // Store the handler for the + button to use
              setFeedCreatePostHandler(() => () => {
                // This function will be called by FeedScreen's internal handler
              });
            }}
          />
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Friends Tab */}
            {activeTab === "friends" && (
            <View>
              {/* Stories/Moments Bar */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: colors.cardBorder,
                  marginBottom: 20,
                }}
                contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12, gap: 10, paddingBottom: 16 }}
              >
                {/* Stories will be populated from FeedScreen data */}
                <Text style={{ color: colors.textSecondary, fontSize: 14, padding: 20 }}>
                  Stories coming soon...
                </Text>
              </ScrollView>

              <View style={{ paddingHorizontal: 20 }}>
              {/* Friend Requests */}
              {requests.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 12 }}>
                    Friend Requests ({requests.length})
                  </Text>
                  {requests.map((request) => (
                    <View
                      key={request.id}
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: colors.primary + "20",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {request.avatar ? (
                            <Image
                              source={{ uri: request.avatar }}
                              style={{ width: 48, height: 48, borderRadius: 24 }}
                            />
                          ) : (
                            <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.primary }}>
                              {request.displayName.charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
                            {request.displayName}
                          </Text>
                          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <Pressable
                            onPress={() => handleAcceptFriend(request.id)}
                            disabled={acceptFriendMutation.isPending}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              backgroundColor: "#4CAF50",
                              alignItems: "center",
                              justifyContent: "center",
                              opacity: acceptFriendMutation.isPending ? 0.5 : 1,
                            }}
                          >
                            {acceptFriendMutation.isPending ? (
                              <ActivityIndicator size="small" color={colors.text} />
                            ) : (
                              <UserPlus size={18} color={colors.text} />
                            )}
                          </Pressable>
                          <Pressable
                            onPress={() => handleDeclineFriend(request.id)}
                            disabled={declineFriendMutation.isPending}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              backgroundColor: "#FF3B30" + "20",
                              alignItems: "center",
                              justifyContent: "center",
                              opacity: declineFriendMutation.isPending ? 0.5 : 1,
                            }}
                          >
                            {declineFriendMutation.isPending ? (
                              <ActivityIndicator size="small" color="#FF3B30" />
                            ) : (
                              <X size={18} color="#FF3B30" />
                            )}
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Friends List */}
              <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 12 }}>
                My Friends ({friends.length})
              </Text>
              {friendsLoading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
              ) : friends.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 60 }}>
                  <Users size={48} color={colors.textSecondary} />
                  <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 16, textAlign: "center" }}>
                    No friends yet. Search for users to connect!
                  </Text>
                </View>
              ) : (
                friends.map((friend) => (
                  <Pressable
                    key={friend.id}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 28,
                          backgroundColor: colors.primary + "20",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {friend.avatar ? (
                          <Image
                            source={{ uri: friend.avatar }}
                            style={{ width: 56, height: 56, borderRadius: 28 }}
                          />
                        ) : (
                          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.primary }}>
                            {friend.displayName.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 2 }}>
                          {friend.displayName}
                        </Text>
                        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                          Friends since {new Date(friend.friendsSince).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <Pressable
                          onPress={() => handleMessageFriend(friend.id, friend.displayName, friend.avatar)}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: "#00D9FF" + "20",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <MessageCircle size={18} color="#00D9FF" />
                        </Pressable>
                        <Pressable
                          onPress={() => handleShareQuest(friend.id, friend.displayName)}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: colors.primary + "20",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Share2 size={18} color={colors.primary} />
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
            </View>
          )}

          {/* Messages Tab */}
          {activeTab === "messages" && (
            <View style={{ paddingHorizontal: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 12 }}>
                Messages
              </Text>
              {conversationsLoading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
              ) : conversations.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 60 }}>
                  <MessageCircle size={48} color={colors.textSecondary} />
                  <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 16, textAlign: "center" }}>
                    No messages yet. Start a conversation!
                  </Text>
                </View>
              ) : (
                conversations.map((conv) => (
                  <Pressable
                    key={conv.userId}
                    onPress={() => handleOpenConversation(conv.userId, conv.displayName, conv.avatar)}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View style={{ position: "relative" }}>
                        <View
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            backgroundColor: "#00D9FF" + "20",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {conv.avatar ? (
                            <Image
                              source={{ uri: conv.avatar }}
                              style={{ width: 56, height: 56, borderRadius: 28 }}
                            />
                          ) : (
                            <Text style={{ fontSize: 24, fontWeight: "bold", color: "#00D9FF" }}>
                              {conv.displayName.charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>
                        {conv.unreadCount > 0 && (
                          <View
                            style={{
                              position: "absolute",
                              top: 0,
                              right: 0,
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              backgroundColor: "#FF3B30",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text style={{ color: colors.text, fontSize: 11, fontWeight: "bold" }}>
                              {conv.unreadCount}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                          <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
                            {conv.displayName}
                          </Text>
                          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                            {new Date(conv.lastMessageAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 14,
                            color: conv.unreadCount > 0 ? colors.text : colors.textSecondary,
                            fontWeight: conv.unreadCount > 0 ? "600" : "400",
                          }}
                          numberOfLines={1}
                        >
                          {conv.lastMessage}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          )}

          {/* Groups Tab */}
          {activeTab === "groups" && (
            <View style={{ paddingHorizontal: 20, position: "relative" }}>
              {/* My Groups */}
              {myGroups.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text }}>
                      My Groups ({myGroups.length})
                    </Text>
                    <Pressable
                      onPress={() => setShowCreateGroupModal(true)}
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Plus size={16} color={colors.text} />
                      <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>New</Text>
                    </Pressable>
                  </View>
                  {myGroups.map((group) => (
                    <Pressable
                      key={group.id}
                      onPress={() => handleOpenGroup(group.id)}
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 16,
                        overflow: "hidden",
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                      }}
                    >
                      {group.coverImage && (
                        <Image
                          source={{ uri: group.coverImage }}
                          style={{ width: "100%", height: 120 }}
                          resizeMode="cover"
                        />
                      )}
                      <View style={{ padding: 16 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
                              {group.name}
                            </Text>
                            {group.description && (
                              <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }} numberOfLines={2}>
                                {group.description}
                              </Text>
                            )}
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <UsersRound size={14} color={colors.textSecondary} />
                              <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                                {group.memberCount} members
                              </Text>
                              {group.role && (
                                <>
                                  <Text style={{ color: colors.textSecondary }}>•</Text>
                                  <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "600" }}>
                                    {group.role}
                                  </Text>
                                </>
                              )}
                            </View>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Discover Groups */}
              <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 12 }}>
                Discover Groups
              </Text>
              {groupsLoading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
              ) : discoverGroups.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 60 }}>
                  <Group size={48} color={colors.textSecondary} />
                  <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 16, textAlign: "center" }}>
                    No groups to discover. Create your own!
                  </Text>
                  {/* Create Group Button */}
                  <Pressable
                    onPress={() => setShowCreateGroupModal(true)}
                    style={{
                      marginTop: 20,
                      backgroundColor: colors.primary,
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      borderRadius: 24,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 5,
                    }}
                  >
                    <Plus size={20} color={colors.text} />
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>Create Group</Text>
                  </Pressable>
                </View>
              ) : (
                discoverGroups.map((group) => (
                  <Pressable
                    key={group.id}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      overflow: "hidden",
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    {group.coverImage && (
                      <Image
                        source={{ uri: group.coverImage }}
                        style={{ width: "100%", height: 120 }}
                        resizeMode="cover"
                      />
                    )}
                    <View style={{ padding: 16 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
                            {group.name}
                          </Text>
                          {group.description && (
                            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }} numberOfLines={2}>
                              {group.description}
                            </Text>
                          )}
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <UsersRound size={14} color={colors.textSecondary} />
                            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                              {group.memberCount} members
                            </Text>
                          </View>
                        </View>
                        <Pressable
                          onPress={() => handleJoinGroup(group.id)}
                          disabled={joinGroupMutation.isPending}
                          style={{
                            backgroundColor: colors.primary,
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                            borderRadius: 20,
                            opacity: joinGroupMutation.isPending ? 0.5 : 1,
                          }}
                        >
                          {joinGroupMutation.isPending ? (
                            <ActivityIndicator size="small" color={colors.text} />
                          ) : (
                            <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>Join</Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          )}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateGroupModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateGroupModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              justifyContent: "flex-end",
            }}
          >
            <Pressable
              style={{ flex: 1 }}
              onPress={() => setShowCreateGroupModal(false)}
            />
            <View
              style={{
                backgroundColor: "#1A1A24",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingTop: 20,
                paddingBottom: 40,
                paddingHorizontal: 20,
                maxHeight: "80%",
              }}
            >
              {/* Header */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>Create Group</Text>
                <Pressable
                  onPress={() => setShowCreateGroupModal(false)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={20} color="white" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Group Name Input */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "rgba(255, 255, 255, 0.8)", marginBottom: 8 }}>
                    Group Name *
                  </Text>
                  <TextInput
                    value={groupName}
                    onChangeText={setGroupName}
                    placeholder="Enter group name"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 12,
                      padding: 16,
                      color: "white",
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: "rgba(126, 63, 228, 0.3)",
                    }}
                    maxLength={50}
                  />
                </View>

                {/* Group Description Input */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "rgba(255, 255, 255, 0.8)", marginBottom: 8 }}>
                    Description
                  </Text>
                  <TextInput
                    value={groupDescription}
                    onChangeText={setGroupDescription}
                    placeholder="What's your group about?"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 12,
                      padding: 16,
                      color: "white",
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: "rgba(126, 63, 228, 0.3)",
                      minHeight: 100,
                    }}
                    maxLength={200}
                  />
                </View>

                {/* Privacy Selection */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "rgba(255, 255, 255, 0.8)", marginBottom: 12 }}>
                    Privacy
                  </Text>
                  <View style={{ gap: 12 }}>
                    {/* Public Option */}
                    <Pressable
                      onPress={() => setGroupPrivacy("PUBLIC")}
                      style={{
                        backgroundColor: groupPrivacy === "PUBLIC" ? "rgba(126, 63, 228, 0.2)" : "rgba(255, 255, 255, 0.05)",
                        borderRadius: 12,
                        padding: 16,
                        borderWidth: 2,
                        borderColor: groupPrivacy === "PUBLIC" ? "#7E3FE4" : "rgba(126, 63, 228, 0.3)",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: "rgba(0, 217, 255, 0.2)",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                        }}
                      >
                        <Globe size={24} color="#00D9FF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: "white", marginBottom: 4 }}>
                          Public
                        </Text>
                        <Text style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>
                          Anyone can find and join
                        </Text>
                      </View>
                    </Pressable>

                    {/* Private Option */}
                    <Pressable
                      onPress={() => setGroupPrivacy("PRIVATE")}
                      style={{
                        backgroundColor: groupPrivacy === "PRIVATE" ? "rgba(126, 63, 228, 0.2)" : "rgba(255, 255, 255, 0.05)",
                        borderRadius: 12,
                        padding: 16,
                        borderWidth: 2,
                        borderColor: groupPrivacy === "PRIVATE" ? "#7E3FE4" : "rgba(126, 63, 228, 0.3)",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: "rgba(255, 107, 53, 0.2)",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                        }}
                      >
                        <Lock size={24} color="#FF6B35" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: "white", marginBottom: 4 }}>
                          Private
                        </Text>
                        <Text style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>
                          Only members can see group
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                </View>

                {/* Create Button */}
                <Pressable
                  onPress={handleCreateGroup}
                  disabled={createGroupMutation.isPending || !groupName.trim()}
                  style={{
                    backgroundColor: !groupName.trim() ? "rgba(126, 63, 228, 0.3)" : "#7E3FE4",
                    paddingVertical: 16,
                    borderRadius: 24,
                    alignItems: "center",
                    opacity: createGroupMutation.isPending ? 0.7 : 1,
                    shadowColor: "#7E3FE4",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                >
                  {createGroupMutation.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>Create Group</Text>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
