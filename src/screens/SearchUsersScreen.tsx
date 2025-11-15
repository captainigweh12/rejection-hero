import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, X, ArrowLeft } from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";

type Props = RootStackScreenProps<"SearchUsers">;

interface SearchResult {
  id: string;
  email: string;
  displayName: string;
  avatar: string | null;
}

export default function SearchUsersScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.post("/api/friends/request", { friendId: userId });
    },
    onSuccess: () => {
      Alert.alert("Success", "Friend request sent!");
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to send friend request");
    },
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    try {
      const results = await api.get<{ users: SearchResult[] }>(
        `/api/friends/search?query=${encodeURIComponent(searchQuery)}`
      );
      setSearchResults(results.users || []);
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Error", "Failed to search users");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = (userId: string) => {
    sendFriendRequestMutation.mutate(userId);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, gap: 12 }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.text }}>Search Users</Text>
        </View>

        {/* Search Bar */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: 12,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: "rgba(126, 63, 228, 0.3)",
            }}
          >
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name or email..."
              placeholderTextColor={colors.textSecondary}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              style={{
                flex: 1,
                fontSize: 16,
                color: colors.text,
                paddingVertical: 14,
                paddingHorizontal: 12,
              }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={handleSearch}
            disabled={!searchQuery.trim() || isSearching}
            style={{
              backgroundColor: "#7E3FE4",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 12,
              opacity: !searchQuery.trim() || isSearching ? 0.5 : 1,
            }}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Search</Text>
            )}
          </Pressable>
        </View>

        {/* Results */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          {isSearching ? (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <ActivityIndicator size="large" color="#7E3FE4" />
            </View>
          ) : searchResults.length === 0 && searchQuery.trim() ? (
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <Search size={48} color={colors.textSecondary} />
              <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 16, textAlign: "center" }}>
                No users found. Try searching by name or email.
              </Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <Search size={48} color={colors.textSecondary} />
              <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 16, textAlign: "center" }}>
                Search for users to add as friends
              </Text>
            </View>
          ) : (
            <View>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 16 }}>
                Search Results ({searchResults.length})
              </Text>
              {searchResults.map((user) => (
                <View
                  key={user.id}
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
                      {user.avatar ? (
                        <Image source={{ uri: user.avatar }} style={{ width: 56, height: 56, borderRadius: 28 }} />
                      ) : (
                        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#7E3FE4" }}>
                          {user.displayName.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 2 }}>
                        {user.displayName}
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.textSecondary }}>{user.email}</Text>
                    </View>
                    <Pressable
                      onPress={() => handleSendRequest(user.id)}
                      disabled={sendFriendRequestMutation.isPending}
                      style={{
                        backgroundColor: "#7E3FE4",
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 20,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        opacity: sendFriendRequestMutation.isPending ? 0.5 : 1,
                      }}
                    >
                      {sendFriendRequestMutation.isPending ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <UserPlus size={16} color="white" />
                          <Text style={{ color: "white", fontSize: 14, fontWeight: "700" }}>Add</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
