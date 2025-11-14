import React, { useState } from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Heart, Star, RotateCcw, Users } from "lucide-react-native";
import type { BottomTabScreenProps } from "@/navigation/types";
import { SwipeCard } from "@/components/SwipeCard";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import { useTheme } from "@/contexts/ThemeContext";
import type { GetDiscoverResponse, CreateSwipeRequest, CreateSwipeResponse } from "@/shared/contracts";

type Props = BottomTabScreenProps<"SwipeTab">;

export default function SwipeScreen({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const queryClient = useQueryClient();
  const { data: sessionData } = useSession();
  const { colors } = useTheme();

  // Fetch profiles
  const { data, isLoading, error, refetch } = useQuery<GetDiscoverResponse>({
    queryKey: ["discover"],
    queryFn: async () => {
      return api.get<GetDiscoverResponse>("/api/discover");
    },
    enabled: !!sessionData?.user,
  });

  // Create swipe mutation
  const swipeMutation = useMutation({
    mutationFn: async (swipeData: CreateSwipeRequest) => {
      return api.post<CreateSwipeResponse>("/api/swipe", swipeData);
    },
    onSuccess: (data) => {
      if (data.matched) {
        // Show match notification (you can enhance this with a modal)
        queryClient.invalidateQueries({ queryKey: ["matches"] });
      }
    },
  });

  const profiles = data?.profiles || [];
  const currentProfile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];

  const handleSwipe = async (direction: "left" | "right", profileId: string) => {
    try {
      await swipeMutation.mutateAsync({
        swipedId: profileId,
        direction,
      });
      setCurrentIndex((prev) => prev + 1);
    } catch (error) {
      console.error("Swipe error:", error);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    refetch();
  };

  if (!sessionData?.user) {
    return (
      <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
        <View className="flex-1 items-center justify-center px-8">
          <Users size={64} color="#FF6B35" />
          <Text className="text-white text-3xl font-bold mb-4 text-center mt-6">
            Join the Community
          </Text>
          <Text className="text-white/70 text-lg text-center mb-8">
            Log in to connect with others, swipe to find matches, and build your network.
          </Text>
          <Pressable
            onPress={() => navigation.navigate("LoginModalScreen")}
            style={{ backgroundColor: "#FF6B35" }}
            className="px-8 py-4 rounded-full"
          >
            <Text className="text-white font-bold text-xl">Get Started</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  if (isLoading) {
    return (
      <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7E3FE4" />
          <Text className="text-white/70 text-lg mt-4">Loading profiles...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white text-xl font-bold mb-4">Oops!</Text>
          <Text className="text-white/70 text-center mb-6">
            {error instanceof Error ? error.message : "Failed to load profiles"}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="bg-purple-600 px-6 py-3 rounded-full"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  if (!currentProfile) {
    return (
      <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white text-3xl font-bold mb-4">No more profiles!</Text>
          <Text className="text-white/70 text-center text-lg mb-8">
            You&apos;ve seen all available profiles. Check back later for more!
          </Text>
          <Pressable
            onPress={handleReset}
            className="bg-purple-600 px-8 py-4 rounded-full flex-row items-center gap-3"
          >
            <RotateCcw size={20} color="#fff" />
            <Text className="text-white font-bold text-lg">Refresh</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
      {/* Header */}
      <View className="pt-4 pb-2 px-6">
        <Text className="text-white text-3xl font-bold text-center">Go for No</Text>
        <Text className="text-white/50 text-sm text-center mt-1">
          Swipe LEFT for Yes • Swipe RIGHT for No
        </Text>
      </View>

      {/* Cards */}
      <View className="flex-1 items-center justify-center">
        {/* Next card (background) */}
        {nextProfile && (
          <View style={{ position: "absolute" }}>
            <SwipeCard
              profile={nextProfile}
              onSwipeLeft={() => {}}
              onSwipeRight={() => {}}
              isTop={false}
            />
          </View>
        )}

        {/* Current card (foreground) */}
        <SwipeCard
          profile={currentProfile}
          onSwipeLeft={() => handleSwipe("left", currentProfile.userId)}
          onSwipeRight={() => handleSwipe("right", currentProfile.userId)}
          isTop={true}
        />
      </View>

      {/* Action Buttons - Modern Dating App Style */}
      <View className="pb-8 px-8 flex-row justify-center items-center gap-6">
        {/* Pass Button (X) */}
        <Pressable
          onPress={() => handleSwipe("right", currentProfile.userId)}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <X size={32} color="#FF6B6B" strokeWidth={2.5} />
        </Pressable>

        {/* Super Like Button (Star) */}
        <Pressable
          onPress={() => handleSwipe("left", currentProfile.userId)}
          style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: "#00D9FF",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#00D9FF",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.5,
            shadowRadius: 12,
            elevation: 10,
          }}
        >
          <Star size={36} color="#FFFFFF" strokeWidth={2.5} fill="#FFFFFF" />
        </Pressable>

        {/* Like Button (Heart) */}
        <Pressable
          onPress={() => handleSwipe("left", currentProfile.userId)}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Heart size={32} color="#4CAF50" strokeWidth={2.5} fill="#4CAF50" />
        </Pressable>
      </View>
    </LinearGradient>
  );
}
