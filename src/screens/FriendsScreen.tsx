import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput, Image, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Users, Search, UserPlus, Check, X, Send, ChevronLeft } from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { api } from "@/lib/api";

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
}

export default function FriendsScreen({ navigation }: Props) {
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
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
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
              backgroundColor: "rgba(126, 63, 228, 0.3)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users size={28} color="#A78BFA" />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", marginBottom: 4 }}>
            {friend.displayName}
          </Text>
          <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)" }}>
            {friend.email}
          </Text>
          {friend.bio && (
            <Text style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.5)", marginTop: 4 }}>
              {friend.bio}
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => {
            // Navigate to send quest screen with friend pre-selected
            navigation.navigate("SendQuestToFriend", { friendId: friend.id, friendName: friend.displayName });
          }}
          style={{
            backgroundColor: "rgba(0, 217, 255, 0.2)",
            borderRadius: 12,
            padding: 10,
            borderWidth: 1,
            borderColor: "rgba(0, 217, 255, 0.3)",
          }}
        >
          <Send size={20} color="#00D9FF" />
        </Pressable>
      </View>
    </View>
  );

  const renderRequest = (request: FriendRequest) => (
    <View
      key={request.id}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(255, 215, 0, 0.3)",
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
              backgroundColor: "rgba(255, 215, 0, 0.3)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserPlus size={28} color="#FFD700" />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", marginBottom: 4 }}>
            {request.displayName}
          </Text>
          <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)" }}>
            {request.email}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable
          onPress={() => acceptRequestMutation.mutate(request.id)}
          disabled={acceptRequestMutation.isPending}
          style={{
            flex: 1,
            backgroundColor: "rgba(76, 175, 80, 0.2)",
            borderRadius: 12,
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderWidth: 1,
            borderColor: "rgba(76, 175, 80, 0.3)",
          }}
        >
          <Check size={18} color="#4CAF50" />
          <Text style={{ color: "#4CAF50", fontWeight: "600", fontSize: 15 }}>
            Accept
          </Text>
        </Pressable>
        <Pressable
          onPress={() => declineRequestMutation.mutate(request.id)}
          disabled={declineRequestMutation.isPending}
          style={{
            flex: 1,
            backgroundColor: "rgba(255, 107, 53, 0.2)",
            borderRadius: 12,
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderWidth: 1,
            borderColor: "rgba(255, 107, 53, 0.3)",
          }}
        >
          <X size={18} color="#FF6B35" />
          <Text style={{ color: "#FF6B35", fontWeight: "600", fontSize: 15 }}>
            Decline
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderRecommendation = (user: Recommendation) => (
    <View
      key={user.id}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(0, 217, 255, 0.3)",
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
              backgroundColor: "rgba(0, 217, 255, 0.3)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "#00D9FF" }}>
              {user.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", marginBottom: 4 }}>
            {user.displayName}
          </Text>
          {user.sharedInterests.length > 0 && (
            <Text style={{ fontSize: 13, color: "#00D9FF", marginBottom: 4 }}>
              {user.sharedInterests.length} shared interest{user.sharedInterests.length > 1 ? "s" : ""}
            </Text>
          )}
          {user.location && (
            <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.5)" }}>
              📍 {user.location}
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => sendRequestMutation.mutate(user.id)}
          disabled={sendRequestMutation.isPending}
          style={{
            backgroundColor: "rgba(0, 217, 255, 0.2)",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: "rgba(0, 217, 255, 0.4)",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          {sendRequestMutation.isPending ? (
            <ActivityIndicator size="small" color="#00D9FF" />
          ) : (
            <>
              <UserPlus size={18} color="#00D9FF" />
              <Text style={{ color: "#00D9FF", fontSize: 14, fontWeight: "600" }}>Add</Text>
            </>
          )}
        </Pressable>
      </View>
      {user.sharedInterests.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {user.sharedInterests.slice(0, 3).map((interest) => (
            <View
              key={interest}
              style={{
                backgroundColor: "rgba(0, 217, 255, 0.15)",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(0, 217, 255, 0.3)",
              }}
            >
              <Text style={{ color: "#00D9FF", fontSize: 11, fontWeight: "600" }}>
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
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.1)",
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
                backgroundColor: "rgba(0, 217, 255, 0.3)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={28} color="#00D9FF" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", marginBottom: 4 }}>
              {user.displayName}
            </Text>
            <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)" }}>
              {user.email}
            </Text>
            {user.bio && (
              <Text style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.5)", marginTop: 4 }}>
                {user.bio}
              </Text>
            )}
          </View>
          {isFriend ? (
            <View
              style={{
                backgroundColor: "rgba(76, 175, 80, 0.2)",
                borderRadius: 12,
                padding: 10,
                borderWidth: 1,
                borderColor: "rgba(76, 175, 80, 0.3)",
              }}
            >
              <Check size={20} color="#4CAF50" />
            </View>
          ) : isPending ? (
            <View
              style={{
                backgroundColor: "rgba(255, 215, 0, 0.2)",
                borderRadius: 12,
                padding: 10,
                borderWidth: 1,
                borderColor: "rgba(255, 215, 0, 0.3)",
              }}
            >
              <Text style={{ color: "#FFD700", fontSize: 12, fontWeight: "600" }}>Pending</Text>
            </View>
          ) : (
            <Pressable
              onPress={() => sendRequestMutation.mutate(user.id)}
              disabled={sendRequestMutation.isPending}
              style={{
                backgroundColor: "rgba(126, 63, 228, 0.2)",
                borderRadius: 12,
                padding: 10,
                borderWidth: 1,
                borderColor: "rgba(126, 63, 228, 0.3)",
              }}
            >
              <UserPlus size={20} color="#A78BFA" />
            </Pressable>
          )}
        </View>
      </View>
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
              justifyContent: "center",
            }}
          >
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ position: "absolute", left: 20 }}
            >
              <ChevronLeft size={28} color="white" />
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>
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
                backgroundColor: activeTab === "friends" ? "rgba(126, 63, 228, 0.3)" : "rgba(255, 255, 255, 0.05)",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: activeTab === "friends" ? "rgba(126, 63, 228, 0.5)" : "rgba(255, 255, 255, 0.1)",
              }}
            >
              <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
                Friends ({friends.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("recommendations")}
              style={{
                backgroundColor: activeTab === "recommendations" ? "rgba(0, 217, 255, 0.3)" : "rgba(255, 255, 255, 0.05)",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: activeTab === "recommendations" ? "rgba(0, 217, 255, 0.5)" : "rgba(255, 255, 255, 0.1)",
              }}
            >
              <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
                Suggested
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("requests")}
              style={{
                backgroundColor: activeTab === "requests" ? "rgba(255, 215, 0, 0.3)" : "rgba(255, 255, 255, 0.05)",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: activeTab === "requests" ? "rgba(255, 215, 0, 0.5)" : "rgba(255, 255, 255, 0.1)",
              }}
            >
              <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
                Requests {requests.length > 0 && `(${requests.length})`}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("search")}
              style={{
                backgroundColor: activeTab === "search" ? "rgba(255, 107, 53, 0.3)" : "rgba(255, 255, 255, 0.05)",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: activeTab === "search" ? "rgba(255, 107, 53, 0.5)" : "rgba(255, 255, 255, 0.1)",
              }}
            >
              <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
                Search
              </Text>
            </Pressable>
          </ScrollView>

          {/* Search Bar (only show in search tab) */}
          {activeTab === "search" && (
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
              >
                <Search size={20} color="rgba(255, 255, 255, 0.5)" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by name or email..."
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 16,
                    color: "white",
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
              <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor="#A78BFA" />
            }
          >
            {activeTab === "friends" && (
              <>
                {friendsLoading ? (
                  <View style={{ paddingVertical: 40, alignItems: "center" }}>
                    <ActivityIndicator size="large" color="#A78BFA" />
                  </View>
                ) : friends.length === 0 ? (
                  <View style={{ paddingVertical: 60, alignItems: "center" }}>
                    <Users size={64} color="rgba(255, 255, 255, 0.3)" />
                    <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 16, marginTop: 16, textAlign: "center" }}>
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
                    <ActivityIndicator size="large" color="#00D9FF" />
                  </View>
                ) : recommendations.length === 0 ? (
                  <View style={{ paddingVertical: 60, alignItems: "center" }}>
                    <Users size={64} color="rgba(255, 255, 255, 0.3)" />
                    <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 16, marginTop: 16, textAlign: "center" }}>
                      No recommendations available right now
                    </Text>
                    <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 14, marginTop: 8, textAlign: "center" }}>
                      Complete your profile to get better suggestions
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: "white", marginBottom: 12 }}>
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
                    <ActivityIndicator size="large" color="#A78BFA" />
                  </View>
                ) : requests.length === 0 ? (
                  <View style={{ paddingVertical: 60, alignItems: "center" }}>
                    <UserPlus size={64} color="rgba(255, 255, 255, 0.3)" />
                    <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 16, marginTop: 16, textAlign: "center" }}>
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
                    <Search size={64} color="rgba(255, 255, 255, 0.3)" />
                    <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 16, marginTop: 16, textAlign: "center" }}>
                      Enter at least 2 characters to search
                    </Text>
                  </View>
                ) : searchLoading ? (
                  <View style={{ paddingVertical: 40, alignItems: "center" }}>
                    <ActivityIndicator size="large" color="#A78BFA" />
                  </View>
                ) : searchResults.length === 0 ? (
                  <View style={{ paddingVertical: 60, alignItems: "center" }}>
                    <Search size={64} color="rgba(255, 255, 255, 0.3)" />
                    <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 16, marginTop: 16, textAlign: "center" }}>
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
