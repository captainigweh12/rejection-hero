import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import type { UpdateProfileRequest, UpdateProfileResponse } from "@/shared/contracts";

type Props = RootStackScreenProps<"EditProfile">;

export default function EditProfileScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [location, setLocation] = useState("");

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      return api.post<UpdateProfileResponse>("/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      navigation.goBack();
    },
  });

  const handleSave = () => {
    if (!displayName.trim()) {
      alert("Please enter a display name");
      return;
    }

    const ageNum = age ? parseInt(age, 10) : undefined;
    if (age && (isNaN(ageNum!) || ageNum! < 18 || ageNum! > 120)) {
      alert("Please enter a valid age (18-120)");
      return;
    }

    updateProfileMutation.mutate({
      displayName: displayName.trim(),
      bio: bio.trim() || undefined,
      age: ageNum,
      location: location.trim() || undefined,
    });
  };

  return (
    <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pt-6 pb-24">
        <Text className="text-white text-3xl font-bold mb-2">Edit Profile</Text>
        <Text className="text-white/50 text-sm mb-8">
          Fill in your information to get started
        </Text>

        {/* Display Name */}
        <Text className="text-white text-lg font-semibold mb-2">Display Name *</Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Enter your display name"
          placeholderTextColor="rgba(255,255,255,0.3)"
          className="text-white text-base mb-6 px-4 py-4 rounded-2xl"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderWidth: 1,
            borderColor: "rgba(126, 63, 228, 0.3)",
          }}
        />

        {/* Age */}
        <Text className="text-white text-lg font-semibold mb-2">Age</Text>
        <TextInput
          value={age}
          onChangeText={setAge}
          placeholder="Enter your age"
          placeholderTextColor="rgba(255,255,255,0.3)"
          keyboardType="number-pad"
          className="text-white text-base mb-6 px-4 py-4 rounded-2xl"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderWidth: 1,
            borderColor: "rgba(126, 63, 228, 0.3)",
          }}
        />

        {/* Bio */}
        <Text className="text-white text-lg font-semibold mb-2">Bio</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us about yourself..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          multiline
          numberOfLines={4}
          className="text-white text-base mb-6 px-4 py-4 rounded-2xl"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderWidth: 1,
            borderColor: "rgba(126, 63, 228, 0.3)",
            minHeight: 120,
            textAlignVertical: "top",
          }}
        />

        {/* Location */}
        <Text className="text-white text-lg font-semibold mb-2">Location</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="City, Country"
          placeholderTextColor="rgba(255,255,255,0.3)"
          className="text-white text-base mb-8 px-4 py-4 rounded-2xl"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderWidth: 1,
            borderColor: "rgba(126, 63, 228, 0.3)",
          }}
        />

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          disabled={updateProfileMutation.isPending}
          className="px-8 py-4 rounded-full flex-row items-center justify-center gap-3"
          style={{
            backgroundColor: updateProfileMutation.isPending
              ? "rgba(126, 63, 228, 0.5)"
              : "#7E3FE4",
          }}
        >
          {updateProfileMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Save size={20} color="#fff" />
              <Text className="text-white font-bold text-lg">Save Profile</Text>
            </>
          )}
        </Pressable>

        {updateProfileMutation.isError && (
          <Text className="text-red-400 text-center mt-4">
            Failed to save profile. Please try again.
          </Text>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
