import React from "react";
import { View, Text, Pressable, ActivityIndicator, Image, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { Edit, LogOut } from "lucide-react-native";
import type { BottomTabScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import { authClient } from "@/lib/authClient";
import type { GetProfileResponse } from "@/shared/contracts";

type Props = BottomTabScreenProps<"ProfileTab">;

export default function ProfileScreen({ navigation }: Props) {
  const { data: sessionData } = useSession();

  const { data, isLoading, error } = useQuery<GetProfileResponse>({
    queryKey: ["profile"],
    queryFn: async () => {
      return api.get<GetProfileResponse>("/api/profile");
    },
    enabled: !!sessionData?.user,
  });

  const handleLogout = async () => {
    await authClient.signOut();
  };

  if (!sessionData?.user) {
    return (
      <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white text-2xl font-bold mb-4">Not logged in</Text>
          <Text className="text-white/70 text-center mb-6">
            Please log in to view your profile
          </Text>
          <Pressable
            onPress={() => navigation.navigate("LoginModalScreen")}
            className="bg-purple-600 px-8 py-4 rounded-full"
          >
            <Text className="text-white font-bold text-lg">Log In</Text>
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
        </View>
      </LinearGradient>
    );
  }

  if (error || !data) {
    return (
      <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white text-xl font-bold mb-4">No profile found</Text>
          <Text className="text-white/70 text-center mb-6">
            Create your profile to start using the app
          </Text>
          <Pressable
            onPress={() => navigation.navigate("EditProfile")}
            className="bg-purple-600 px-8 py-4 rounded-full"
          >
            <Text className="text-white font-bold text-lg">Create Profile</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const imageUrl = data.photos[0] || "https://via.placeholder.com/200/5E1FA8/ffffff?text=No+Photo";

  return (
    <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
      <ScrollView className="flex-1" contentContainerClassName="pb-24">
        {/* Header */}
        <View className="pt-4 pb-2 px-6 flex-row justify-between items-center">
          <Text className="text-white text-3xl font-bold">Profile</Text>
          <Pressable onPress={handleLogout} className="p-2">
            <LogOut size={24} color="#fff" />
          </Pressable>
        </View>

        {/* Profile Image */}
        <View className="items-center mt-8">
          <View
            className="relative"
            style={{
              width: 160,
              height: 160,
              borderRadius: 80,
              overflow: "hidden",
              borderWidth: 4,
              borderColor: "#7E3FE4",
            }}
          >
            <Image source={{ uri: imageUrl }} style={{ width: "100%", height: "100%" }} />
          </View>
        </View>

        {/* Profile Info */}
        <View className="mt-8 px-6">
          <View className="flex-row items-center justify-center gap-2">
            <Text className="text-white text-4xl font-bold">{data.displayName}</Text>
            {data.age && <Text className="text-white/90 text-3xl">{data.age}</Text>}
          </View>

          {data.bio && (
            <Text className="text-white/90 text-lg text-center mt-4">{data.bio}</Text>
          )}

          {data.location && (
            <Text className="text-white/70 text-center mt-4">📍 {data.location}</Text>
          )}

          {/* Edit Button */}
          <Pressable
            onPress={() => navigation.navigate("EditProfile")}
            className="mt-8 mx-auto px-8 py-4 rounded-full flex-row items-center gap-3"
            style={{
              backgroundColor: "rgba(126, 63, 228, 0.2)",
              borderWidth: 2,
              borderColor: "#7E3FE4",
            }}
          >
            <Edit size={20} color="#7E3FE4" />
            <Text className="text-white font-bold text-lg">Edit Profile</Text>
          </Pressable>
        </View>

        {/* Photos Grid */}
        {data.photos.length > 1 && (
          <View className="mt-8 px-6">
            <Text className="text-white text-xl font-bold mb-4">Photos</Text>
            <View className="flex-row flex-wrap gap-2">
              {data.photos.map((photo, index) => (
                <View
                  key={index}
                  style={{
                    width: "48%",
                    aspectRatio: 3 / 4,
                    borderRadius: 16,
                    overflow: "hidden",
                  }}
                >
                  <Image source={{ uri: photo }} style={{ width: "100%", height: "100%" }} />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
