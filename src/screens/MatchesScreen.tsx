import React from "react";
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Video, Users } from "lucide-react-native";
import type { BottomTabScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import type { GetMatchesResponse } from "@/shared/contracts";

type Props = BottomTabScreenProps<"MatchesTab">;

export default function MatchesScreen({ navigation }: Props) {
  const { data, isLoading, error } = useQuery<GetMatchesResponse>({
    queryKey: ["matches"],
    queryFn: async () => {
      return api.get<GetMatchesResponse>("/api/matches");
    },
  });

  const matches = data?.matches || [];

  if (isLoading) {
    return (
      <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7E3FE4" />
          <Text className="text-white/70 text-lg mt-4">Loading matches...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white text-xl font-bold mb-4">Oops!</Text>
          <Text className="text-white/70 text-center">
            {error instanceof Error ? error.message : "Failed to load matches"}
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
      {/* Header */}
      <View className="pt-4 pb-2 px-6">
        <Text className="text-white text-3xl font-bold">Matches</Text>
        <Text className="text-white/50 text-sm mt-1">
          {matches.length} {matches.length === 1 ? "match" : "matches"}
        </Text>
      </View>

      {matches.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white text-2xl font-bold mb-4">No matches yet</Text>
          <Text className="text-white/70 text-center text-lg">
            Keep swiping to find your connections!
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="pb-24 px-6">
          {matches.map((match) => {
            const imageUrl =
              match.profile.photos[0] || "https://via.placeholder.com/100/5E1FA8/ffffff?text=No+Photo";

            return (
              <Pressable
                key={match.id}
                className="mb-4 rounded-3xl overflow-hidden"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.3)",
                }}
              >
                <View className="flex-row items-center p-4">
                  {/* Profile Image */}
                  <View
                    className="relative"
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 20,
                      overflow: "hidden",
                      borderWidth: 2,
                      borderColor: "#7E3FE4",
                    }}
                  >
                    <Image source={{ uri: imageUrl }} style={{ width: "100%", height: "100%" }} />
                    {match.profile.isLive && (
                      <View className="absolute top-1 right-1 bg-red-500 px-1.5 py-0.5 rounded-full flex-row items-center gap-1">
                        <Video size={10} color="#fff" />
                        <Text className="text-white text-xs font-bold">LIVE</Text>
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View className="flex-1 ml-4">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-white text-xl font-bold">{match.profile.displayName}</Text>
                      {match.profile.age && (
                        <Text className="text-white/70 text-lg">{match.profile.age}</Text>
                      )}
                    </View>
                    {match.profile.bio && (
                      <Text className="text-white/70 text-sm mt-1" numberOfLines={2}>
                        {match.profile.bio}
                      </Text>
                    )}
                  </View>

                  {/* Message Button */}
                  <Pressable
                    className="ml-2 w-12 h-12 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: "rgba(0, 217, 255, 0.2)",
                      borderWidth: 2,
                      borderColor: "#00D9FF",
                    }}
                  >
                    <MessageCircle size={24} color="#00D9FF" />
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </LinearGradient>
  );
}
