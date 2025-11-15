import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Image, Alert } from "react-native";
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
  Home
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

  const handleMessageFriend = (friendId: string) => {
    // TODO: Navigate to chat screen when created
    Alert.alert("Coming Soon", "Chat screen is being developed!");
  };

  const handleShareQuest = (friendId: string) => {
    // TODO: Navigate to quest sharing screen when created
    Alert.alert("Coming Soon", "Quest sharing is being developed!");
  };

  const handleOpenConversation = (userId: string) => {
    // TODO: Navigate to chat screen when created
    Alert.alert("Coming Soon", "Chat screen is being developed!");
  };

  const handleOpenGroup = (groupId: string) => {
    // TODO: Navigate to group detail screen when created
    Alert.alert("Coming Soon", "Group detail screen is being developed!");
  };

  if (!sessionData?.user) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <Users size={64} color="#7E3FE4" />
            <Text style={{ fontSize: 28, fontWeight: "bold", marginTop: 24, marginBottom: 16, textAlign: "center", color: "white" }}>
              Join the Community
            </Text>
            <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 16, textAlign: "center", marginBottom: 32 }}>
              Connect with friends, chat, join groups, and share quests together!
            </Text>
            <Pressable
              onPress={() => navigation.navigate("LoginModalScreen")}
              style={{
                backgroundColor: "#7E3FE4",
                paddingHorizontal: 48,
                paddingVertical: 16,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>Get Started</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const friends = friendsData?.friends || [];
  const requests = requestsData?.requests || [];
  const conversations = conversationsData?.conversations || [];
  const myGroups = groupsData?.myGroups || [];
  const discoverGroups = groupsData?.discoverGroups || [];

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ fontSize: 32, fontWeight: "bold", color: "white" }}>Community</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => {
                  // Scroll to friend requests section if there are any
                  if (requests.length > 0) {
                    setActiveTab("friends");
                  } else {
                    Alert.alert("No Notifications", "You don't have any friend requests at the moment.");
                  }
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <Bell size={20} color="white" />
                {requests.length > 0 && (
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
                    <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>{requests.length}</Text>
                  </View>
                )}
              </Pressable>
              <Pressable
                onPress={() => {
                  navigation.navigate("SearchUsers");
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Search size={20} color="white" />
              </Pressable>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "rgba(126, 63, 228, 0.3)",
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#7E3FE4" + "20",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <Users size={20} color="#7E3FE4" />
              </View>
              <Text style={{ fontSize: 24, fontWeight: "bold", color: "white", marginBottom: 4 }}>
                {friends.length}
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>Friends</Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "rgba(126, 63, 228, 0.3)",
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#00D9FF" + "20",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <MessageCircle size={20} color="#00D9FF" />
              </View>
              <Text style={{ fontSize: 24, fontWeight: "bold", color: "white", marginBottom: 4 }}>
                {conversations.length}
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>Chats</Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "rgba(126, 63, 228, 0.3)",
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#4CAF50" + "20",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <UsersRound size={20} color="#4CAF50" />
              </View>
              <Text style={{ fontSize: 24, fontWeight: "bold", color: "white", marginBottom: 4 }}>
                {myGroups.length}
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>Groups</Text>
            </View>
          </View>

          {/* Tab Switcher */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              borderRadius: 12,
              padding: 4,
            }}
          >
            {[
              { key: "feed" as const, label: "Feed", icon: Home },
              { key: "friends" as const, label: "Friends", icon: Users },
              { key: "messages" as const, label: "Messages", icon: MessageCircle },
              { key: "groups" as const, label: "Groups", icon: Group },
            ].map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  paddingVertical: 8,
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  backgroundColor: activeTab === tab.key ? "#7E3FE4" : "transparent",
                }}
              >
                <tab.icon
                  size={16}
                  color={activeTab === tab.key ? "white" : colors.textSecondary}
                  strokeWidth={2.5}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: activeTab === tab.key ? "700" : "600",
                    color: activeTab === tab.key ? "white" : colors.textSecondary,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Content */}
        {activeTab === "feed" ? (
          <FeedScreen />
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Friends Tab */}
            {activeTab === "friends" && (
            <View style={{ paddingHorizontal: 20 }}>
              {/* Friend Requests */}
              {requests.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", marginBottom: 12 }}>
                    Friend Requests ({requests.length})
                  </Text>
                  {requests.map((request) => (
                    <View
                      key={request.id}
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: "rgba(126, 63, 228, 0.3)",
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: "#7E3FE4" + "20",
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
                            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#7E3FE4" }}>
                              {request.displayName.charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: "700", color: "white" }}>
                            {request.displayName}
                          </Text>
                          <Text style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>
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
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <UserPlus size={18} color="white" />
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
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", marginBottom: 12 }}>
                My Friends ({friends.length})
              </Text>
              {friendsLoading ? (
                <ActivityIndicator size="large" color="#7E3FE4" style={{ marginTop: 40 }} />
              ) : friends.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 60 }}>
                  <Users size={48} color="rgba(255, 255, 255, 0.6)" />
                  <Text style={{ fontSize: 16, color: "rgba(255, 255, 255, 0.6)", marginTop: 16, textAlign: "center" }}>
                    No friends yet. Search for users to connect!
                  </Text>
                </View>
              ) : (
                friends.map((friend) => (
                  <Pressable
                    key={friend.id}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: "rgba(126, 63, 228, 0.3)",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 28,
                          backgroundColor: "#7E3FE4" + "20",
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
                          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#7E3FE4" }}>
                            {friend.displayName.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 17, fontWeight: "700", color: "white", marginBottom: 2 }}>
                          {friend.displayName}
                        </Text>
                        <Text style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>
                          Friends since {new Date(friend.friendsSince).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <Pressable
                          onPress={() => handleMessageFriend(friend.id)}
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
                          onPress={() => handleShareQuest(friend.id)}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: "#7E3FE4" + "20",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Share2 size={18} color="#7E3FE4" />
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          )}

          {/* Messages Tab */}
          {activeTab === "messages" && (
            <View style={{ paddingHorizontal: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", marginBottom: 12 }}>
                Messages
              </Text>
              {conversationsLoading ? (
                <ActivityIndicator size="large" color="#7E3FE4" style={{ marginTop: 40 }} />
              ) : conversations.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 60 }}>
                  <MessageCircle size={48} color="rgba(255, 255, 255, 0.6)" />
                  <Text style={{ fontSize: 16, color: "rgba(255, 255, 255, 0.6)", marginTop: 16, textAlign: "center" }}>
                    No messages yet. Start a conversation!
                  </Text>
                </View>
              ) : (
                conversations.map((conv) => (
                  <Pressable
                    key={conv.userId}
                    onPress={() => handleOpenConversation(conv.userId)}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: "rgba(126, 63, 228, 0.3)",
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
                            <Text style={{ color: "white", fontSize: 11, fontWeight: "bold" }}>
                              {conv.unreadCount}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                          <Text style={{ fontSize: 17, fontWeight: "700", color: "white" }}>
                            {conv.displayName}
                          </Text>
                          <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>
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
            <View style={{ paddingHorizontal: 20 }}>
              {/* My Groups */}
              {myGroups.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", marginBottom: 12 }}>
                    My Groups ({myGroups.length})
                  </Text>
                  {myGroups.map((group) => (
                    <Pressable
                      key={group.id}
                      onPress={() => handleOpenGroup(group.id)}
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        borderRadius: 16,
                        overflow: "hidden",
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: "rgba(126, 63, 228, 0.3)",
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
                            <Text style={{ fontSize: 18, fontWeight: "700", color: "white", marginBottom: 4 }}>
                              {group.name}
                            </Text>
                            {group.description && (
                              <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)", marginBottom: 8 }} numberOfLines={2}>
                                {group.description}
                              </Text>
                            )}
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <UsersRound size={14} color="rgba(255, 255, 255, 0.6)" />
                              <Text style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>
                                {group.memberCount} members
                              </Text>
                              {group.role && (
                                <>
                                  <Text style={{ color: "rgba(255, 255, 255, 0.6)" }}>•</Text>
                                  <Text style={{ fontSize: 13, color: "#7E3FE4", fontWeight: "600" }}>
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
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", marginBottom: 12 }}>
                Discover Groups
              </Text>
              {groupsLoading ? (
                <ActivityIndicator size="large" color="#7E3FE4" style={{ marginTop: 40 }} />
              ) : discoverGroups.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 60 }}>
                  <Group size={48} color="rgba(255, 255, 255, 0.6)" />
                  <Text style={{ fontSize: 16, color: "rgba(255, 255, 255, 0.6)", marginTop: 16, textAlign: "center" }}>
                    No groups to discover. Create your own!
                  </Text>
                </View>
              ) : (
                discoverGroups.map((group) => (
                  <Pressable
                    key={group.id}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 16,
                      overflow: "hidden",
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: "rgba(126, 63, 228, 0.3)",
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
                          <Text style={{ fontSize: 18, fontWeight: "700", color: "white", marginBottom: 4 }}>
                            {group.name}
                          </Text>
                          {group.description && (
                            <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)", marginBottom: 8 }} numberOfLines={2}>
                              {group.description}
                            </Text>
                          )}
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <UsersRound size={14} color="rgba(255, 255, 255, 0.6)" />
                            <Text style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>
                              {group.memberCount} members
                            </Text>
                          </View>
                        </View>
                        <Pressable
                          onPress={() => handleJoinGroup(group.id)}
                          disabled={joinGroupMutation.isPending}
                          style={{
                            backgroundColor: "#7E3FE4",
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                            borderRadius: 20,
                            opacity: joinGroupMutation.isPending ? 0.5 : 1,
                          }}
                        >
                          {joinGroupMutation.isPending ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <Text style={{ color: "white", fontSize: 14, fontWeight: "700" }}>Join</Text>
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
    </View>
  );
}
