import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput, Image, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Users, Search, UserPlus, Check, X, Send, ChevronLeft, Sparkles } from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { FriendButton, type FriendshipStatus } from "@/components/FriendButton";

type Props = NativeStackScreenProps<RootStackParamList, "Friends">;

interface Friend {
  id: string;
  email: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  friendshipId: string;
  friendsSince: string;
}

interface FriendRequest {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  requestedAt: string;
}

interface SearchResult {
  id: string;
  email: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  friendshipStatus: string | null;
}

interface Recommendation {
  id: string;
  email: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  interests: string[];
  sharedInterests: string[];
  matchScore: number;
  location: string | null;
  mutualFriendsCount?: number;
  mutualFriends?: Array<{ displayName: string; avatar: string | null }>;
  reason?: string;
}

export default function FriendsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "recommendations" | "search">("friends");
  const queryClient = useQueryClient();

  // Fetch friends list
  const { data: friendsData, isLoading: friendsLoading, refetch: refetchFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const response = await api.get<{ friends: Friend[] }>("/api/friends");
      return response;
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30000,
  });

  // Fetch friend requests
  const { data: requestsData, isLoading: requestsLoading, refetch: refetchRequests } = useQuery({
    queryKey: ["friend-requests"],
    queryFn: async () => {
      const response = await api.get<{ requests: FriendRequest[] }>("/api/friends/requests");
      return response;
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30000,
  });

  // Fetch recommendations
  const { data: recommendationsData, isLoading: recommendationsLoading, refetch: refetchRecommendations } = useQuery({
    queryKey: ["friend-recommendations"],
    queryFn: async () => {
      const response = await api.get<{ recommendations: Recommendation[] }>("/api/friends/recommendations");
      return response;
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 60000, // Cache for 1 minute
  });

  // Fetch friendship status for each recommendation
  const getFriendshipStatus = (userId: string): FriendshipStatus => {
    // Check if user is in friends list
    const friend = friends.find((f) => f.id === userId);
    if (friend) return "FRIENDS";

    // Check if user is in requests list (pending received)
    const request = requests.find((r) => r.userId === userId);
    if (request) return "PENDING_RECEIVED";

    // Check search results for status
    const searchResult = searchResults.find((s) => s.id === userId);
    if (searchResult?.friendshipStatus === "PENDING") {
      // Need to determine if sent or received - for now assume sent if in search
      return "PENDING_SENT";
    }
    if (searchResult?.friendshipStatus === "ACCEPTED") {
      return "FRIENDS";
    }

    return "NONE";
  };

  // Search users
  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ["user-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) {
        return { users: [] };
      }
      const response = await api.get<{ users: SearchResult[] }>(`/api/friends/search?query=${encodeURIComponent(searchQuery)}`);
      return response;
    },
    enabled: searchQuery.length >= 2,
  });

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.post("/api/friends/request", { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-search"] });
      Alert.alert("Success", "Friend request sent!");
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to send friend request");
    },
  });

  // Accept friend request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return api.post(`/api/friends/accept/${requestId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      Alert.alert("Success", "Friend request accepted!");
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to accept request");
    },
  });

  // Decline friend request mutation
  const declineRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return api.post(`/api/friends/decline/${requestId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to decline request");
    },
  });

  const friends = friendsData?.friends || [];
  const requests = requestsData?.requests || [];
  const recommendations = recommendationsData?.recommendations || [];
  const searchResults = searchData?.users || [];

  const handleRefresh = () => {
    refetchFriends();
    refetchRequests();
    refetchRecommendations();
  };

  const renderFriend = (friend: Friend) => (
    <View
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
        {friend.avatar ? (
          <Image
            source={{ uri: friend.avatar }}
            style={{ width: 56, height: 56, borderRadius: 28 }}
          />
        ) : (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primaryLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users size={28} color={colors.primary} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 4 }}>
            {friend.displayName}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
            {friend.email}
          </Text>
          {friend.bio && (
            <Text style={{ fontSize: 13, color: colors.textTertiary, marginTop: 4 }}>
              {friend.bio}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => {
              // Navigate to send quest screen with friend pre-selected
              navigation.navigate("SendQuestToFriend", { friendId: friend.id, friendName: friend.displayName });
            }}
            style={{
              backgroundColor: colors.info + "33",
              borderRadius: 12,
              padding: 10,
              borderWidth: 1,
              borderColor: colors.info,
            }}
          >
            <Send size={20} color={colors.info} />
          </Pressable>
          <Pressable
            onPress={() => {
              // Navigate to create custom quest screen
              navigation.navigate("CreateCustomQuest", { friendId: friend.id, friendName: friend.displayName });
            }}
            style={{
              backgroundColor: colors.primaryLight,
              borderRadius: 12,
              padding: 10,
              borderWidth: 1,
              borderColor: colors.primary,
            }}
          >
            <Sparkles size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  const renderRequest = (request: FriendRequest) => (
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
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
        {request.avatar ? (
          <Image
            source={{ uri: request.avatar }}
            style={{ width: 56, height: 56, borderRadius: 28 }}
          />
        ) : (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.warning + "33",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserPlus size={28} color={colors.warning} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 4 }}>
            {request.displayName}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
            {request.email}
          </Text>
        </View>
      </View>
      <FriendButton
        userId={request.userId}
        friendshipStatus="PENDING_RECEIVED"
        requestId={request.id}
        showMessageButton={false}
        size="medium"
      />
      <Pressable
        onPress={() => declineRequestMutation.mutate(request.id)}
        disabled={declineRequestMutation.isPending}
        style={{
          marginTop: 8,
          backgroundColor: colors.secondary + "33",
          borderRadius: 12,
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderWidth: 1,
          borderColor: colors.secondary,
        }}
      >
        <X size={18} color={colors.secondary} />
        <Text style={{ color: colors.secondary, fontWeight: "600", fontSize: 15 }}>
          Decline
        </Text>
      </Pressable>
    </View>
  );

  const renderRecommendation = (user: Recommendation) => (
    <View
      key={user.id}
      style={{
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
        {user.avatar ? (
          <Image
            source={{ uri: user.avatar }}
            style={{ width: 56, height: 56, borderRadius: 28 }}
          />
        ) : (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.info + "33",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.info }}>
              {user.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 4 }}>
            {user.displayName}
          </Text>
          {user.reason && (
            <Text style={{ fontSize: 13, color: colors.info, marginBottom: 4 }}>
              {user.reason}
            </Text>
          )}
          {user.mutualFriendsCount !== undefined && user.mutualFriendsCount > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
              <Users size={14} color={colors.textSecondary} />
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {user.mutualFriendsCount} mutual friend{user.mutualFriendsCount > 1 ? "s" : ""}
              </Text>
            </View>
          )}
          {user.sharedInterests.length > 0 && !user.reason && (
            <Text style={{ fontSize: 13, color: colors.info, marginBottom: 4 }}>
              {user.sharedInterests.length} shared interest{user.sharedInterests.length > 1 ? "s" : ""}
            </Text>
          )}
          {user.location && (
            <Text style={{ fontSize: 12, color: colors.textTertiary }}>
              📍 {user.location}
            </Text>
          )}
        </View>
        <FriendButton
          userId={user.id}
          friendshipStatus={getFriendshipStatus(user.id)}
          onMessagePress={() => {
            navigation.navigate("Chat", {
              userId: user.id,
              userName: user.displayName,
              userAvatar: user.avatar || undefined,
            });
          }}
          size="small"
        />
      </View>
      {user.sharedInterests.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {user.sharedInterests.slice(0, 3).map((interest) => (
            <View
              key={interest}
              style={{
                backgroundColor: colors.info + "26",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.info,
              }}
            >
              <Text style={{ color: colors.info, fontSize: 11, fontWeight: "600" }}>
                {interest}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderSearchResult = (user: SearchResult) => {
    const isFriend = user.friendshipStatus === "ACCEPTED";
    const isPending = user.friendshipStatus === "PENDING";

    return (
      <View
        key={user.id}
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
          {user.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              style={{ width: 56, height: 56, borderRadius: 28 }}
            />
        ) : (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.info + "33",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users size={28} color={colors.info} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 4 }}>
              {user.displayName}
            </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
              {user.email}
            </Text>
            {user.bio && (
            <Text style={{ fontSize: 13, color: colors.textTertiary, marginTop: 4 }}>
                {user.bio}
              </Text>
            )}
          </View>
          {isFriend ? (
            <View
              style={{
              backgroundColor: colors.success + "33",
                borderRadius: 12,
                padding: 10,
                borderWidth: 1,
              borderColor: colors.success,
              }}
            >
            <Check size={20} color={colors.success} />
            </View>
          ) : isPending ? (
            <View
              style={{
              backgroundColor: colors.warning + "33",
                borderRadius: 12,
                padding: 10,
                borderWidth: 1,
              borderColor: colors.warning,
              }}
            >
            <Text style={{ color: colors.warning, fontSize: 12, fontWeight: "600" }}>Pending</Text>
            </View>
          ) : (
            <Pressable
              onPress={() => sendRequestMutation.mutate(user.id)}
              disabled={sendRequestMutation.isPending}
              style={{
              backgroundColor: colors.primaryLight,
                borderRadius: 12,
                padding: 10,
                borderWidth: 1,
              borderColor: colors.primary,
              }}
            >
            <UserPlus size={20} color={colors.primary} />
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
      <LinearGradient colors={colors.background as any} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              borderBottomWidth: 1,
              borderBottomColor: colors.cardBorder,
            }}
          >
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ position: "absolute", left: 20 }}
            >
              <ChevronLeft size={28} color={colors.text} />
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}>
              Friends
            </Text>
          </View>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginBottom: 16, alignItems: "center" }}
            style={{ maxHeight: 60 }}
          >
            <Pressable
              onPress={() => setActiveTab("friends")}
              style={{
                backgroundColor: activeTab === "friends" ? colors.primaryLight : colors.surface,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: activeTab === "friends" ? colors.primary : colors.cardBorder,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "600", fontSize: 14 }}>
                Friends ({friends.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("recommendations")}
              style={{
                backgroundColor: activeTab === "recommendations" ? colors.info + "33" : colors.surface,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: activeTab === "recommendations" ? colors.info : colors.cardBorder,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "600", fontSize: 14 }}>
                Suggested
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("requests")}
              style={{
                backgroundColor: activeTab === "requests" ? colors.warning + "33" : colors.surface,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: activeTab === "requests" ? colors.warning : colors.cardBorder,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "600", fontSize: 14 }}>
                Requests {requests.length > 0 && `(${requests.length})`}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("search")}
              style={{
                backgroundColor: activeTab === "search" ? colors.secondary + "33" : colors.surface,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: activeTab === "search" ? colors.secondary : colors.cardBorder,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "600", fontSize: 14 }}>
                Search
              </Text>
            </Pressable>
          </ScrollView>

          {/* Search Bar (only show in search tab) */}
          {activeTab === "search" && (
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
              <View
                style={{
                  backgroundColor: colors.inputBackground,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: colors.inputBorder,
                }}
              >
                <Search size={20} color={colors.textSecondary} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by name or email..."
                  placeholderTextColor={colors.textTertiary}
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 16,
                    color: colors.text,
                  }}
                />
              </View>
            </View>
          )}

          {/* Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            refreshControl={
              <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={colors.primary} />
            }
          >
            {activeTab === "friends" && (
              <>
                {friendsLoading ? (
                  <View style={{ paddingVertical: 40, alignItems: "center" }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                ) : friends.length === 0 ? (
                  <View style={{ paddingVertical: 60, alignItems: "center" }}>
                    <Users size={64} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 16, textAlign: "center" }}>
                      No friends yet. Search for users to add friends!
                    </Text>
                  </View>
                ) : (
                  friends.map(renderFriend)
                )}
              </>
            )}

            {activeTab === "recommendations" && (
              <>
                {recommendationsLoading ? (
                  <View style={{ paddingVertical: 40, alignItems: "center" }}>
                    <ActivityIndicator size="large" color={colors.info} />
                  </View>
                ) : recommendations.length === 0 ? (
                  <View style={{ paddingVertical: 60, alignItems: "center" }}>
                    <Users size={64} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 16, textAlign: "center" }}>
                      No recommendations available right now
                    </Text>
                    <Text style={{ color: colors.textTertiary, fontSize: 14, marginTop: 8, textAlign: "center" }}>
                      Complete your profile to get better suggestions
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text, marginBottom: 12 }}>
                      People you may know
                    </Text>
                    {recommendations.map(renderRecommendation)}
                  </>
                )}
              </>
            )}

            {activeTab === "requests" && (
              <>
                {requestsLoading ? (
                  <View style={{ paddingVertical: 40, alignItems: "center" }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                ) : requests.length === 0 ? (
                  <View style={{ paddingVertical: 60, alignItems: "center" }}>
                    <UserPlus size={64} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 16, textAlign: "center" }}>
                      No pending friend requests
                    </Text>
                  </View>
                ) : (
                  requests.map(renderRequest)
                )}
              </>
            )}

            {activeTab === "search" && (
              <>
                {searchQuery.length < 2 ? (
                  <View style={{ paddingVertical: 60, alignItems: "center" }}>
                    <Search size={64} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 16, textAlign: "center" }}>
                      Enter at least 2 characters to search
                    </Text>
                  </View>
                ) : searchLoading ? (
                  <View style={{ paddingVertical: 40, alignItems: "center" }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                ) : searchResults.length === 0 ? (
                  <View style={{ paddingVertical: 60, alignItems: "center" }}>
                    <Search size={64} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 16, textAlign: "center" }}>
                      No users found matching &quot;{searchQuery}&quot;
                    </Text>
                  </View>
                ) : (
                  searchResults.map(renderSearchResult)
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
