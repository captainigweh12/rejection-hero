import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert, StyleSheet, Modal, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { MapPin, Crosshair, Plus, Sparkles, X, Trophy, Zap } from "lucide-react-native";
import type { BottomTabScreenProps } from "@/navigation/types";
import { useSession } from "@/lib/useSession";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { GenerateMapQuestsResponse } from "@/shared/contracts";

type Props = BottomTabScreenProps<"MapTab">;

interface QuestMarker {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  goalType: string;
  goalCount: number;
  xpReward: number;
  pointReward: number;
  location: string;
  latitude: number;
  longitude: number;
}

export default function MapScreen({ navigation }: Props) {
  const { data: sessionData } = useSession();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [questMarkers, setQuestMarkers] = useState<QuestMarker[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<QuestMarker | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    getLocationPermission();
  }, []);

  const getLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      setLoading(false);
    } catch (error) {
      console.error("Error getting location:", error);
      setErrorMsg("Failed to get your location");
      setLoading(false);
    }
  };

  const generateQuestsMutation = useMutation({
    mutationFn: async () => {
      if (!location) throw new Error("No location available");

      return api.post<GenerateMapQuestsResponse>("/api/quests/generate-map-quests", {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        count: 5,
      });
    },
    onSuccess: (data) => {
      if (data.success && data.quests.length > 0) {
        setQuestMarkers(data.quests);
        Alert.alert(
          "Quests Generated!",
          `${data.quests.length} quests have been added to the map. Tap on any marker to view details.`
        );
      } else {
        Alert.alert("No Quests Found", "No nearby locations found within 5 miles. Try moving to a different area.");
      }
    },
    onError: (error: any) => {
      console.error("Error generating map quests:", error);
      Alert.alert("Error", "Failed to generate quests. Please try again.");
    },
  });

  const handleGenerateQuests = () => {
    if (!sessionData?.user) {
      Alert.alert("Sign In Required", "Please sign in to generate quests");
      navigation.navigate("LoginModalScreen");
      return;
    }

    if (!location) {
      Alert.alert("Location Required", "Please enable location services to generate quests");
      return;
    }

    Alert.alert(
      "Generate Quests",
      "Generate 5 AI-powered quests within 5 miles of your location?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Generate",
          onPress: () => generateQuestsMutation.mutate(),
        },
      ]
    );
  };

  const handleCreateQuestHere = () => {
    if (!sessionData?.user) {
      Alert.alert("Sign In Required", "Please sign in to create quests");
      navigation.navigate("LoginModalScreen");
      return;
    }

    // Navigate to CreateQuest screen
    navigation.navigate("CreateQuest");
  };

  const handleRecenterMap = async () => {
    setLoading(true);
    try {
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      // Animate to new location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to get your current location");
    }
    setLoading(false);
  };

  const handleMarkerPress = (quest: QuestMarker) => {
    setSelectedQuest(quest);
  };

  const handleAcceptQuest = () => {
    if (!selectedQuest) return;

    // Navigate to CreateQuest with pre-filled data
    setSelectedQuest(null);
    navigation.navigate("CreateQuest");

    Alert.alert(
      "Quest Accepted!",
      `"${selectedQuest.title}" has been added to your quest creation. Customize it or create it as-is!`
    );
  };

  if (!sessionData?.user) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
                backgroundColor: "rgba(0, 217, 255, 0.1)",
                borderWidth: 2,
                borderColor: "#00D9FF",
              }}
            >
              <MapPin size={48} color="#00D9FF" />
            </View>
            <Text style={{ color: "white", fontSize: 28, fontWeight: "bold", marginBottom: 16, textAlign: "center" }}>
              Explore Quest Locations
            </Text>
            <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 16, textAlign: "center", marginBottom: 32 }}>
              Sign in to discover rejection challenges near you and create location-based quests.
            </Text>
            <Pressable
              onPress={() => navigation.navigate("LoginModalScreen")}
              style={{
                backgroundColor: "#FF6B35",
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

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={{ color: "rgba(255, 255, 255, 0.7)", marginTop: 16 }}>
              Getting your location...
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (errorMsg || !location) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <MapPin size={64} color="#FF6B35" />
            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold", marginTop: 24, marginBottom: 16 }}>
              Location Access Needed
            </Text>
            <Text style={{ color: "rgba(255, 255, 255, 0.7)", textAlign: "center", marginBottom: 32 }}>
              {errorMsg || "We need your location to show nearby quest opportunities"}
            </Text>
            <Pressable
              onPress={getLocationPermission}
              style={{
                backgroundColor: "#FF6B35",
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>Enable Location</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      SALES: "#FF6B35",
      SOCIAL: "#00D9FF",
      ENTREPRENEURSHIP: "#7E3FE4",
      DATING: "#FF4081",
      CONFIDENCE: "#FFD700",
      CAREER: "#4CAF50",
    };
    return colors[category] || "#7E3FE4";
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      EASY: "#4CAF50",
      MEDIUM: "#FFD700",
      HARD: "#FF6B35",
      EXPERT: "#FF4081",
    };
    return colors[difficulty] || "#7E3FE4";
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* User's current location marker */}
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          title="You are here"
        />

        {/* Quest location markers */}
        {questMarkers.map((quest) => (
          <Marker
            key={quest.id}
            coordinate={{
              latitude: quest.latitude,
              longitude: quest.longitude,
            }}
            title={quest.title}
            description={`${quest.category} - ${quest.difficulty}`}
            pinColor={getCategoryColor(quest.category)}
            onPress={() => handleMarkerPress(quest)}
          />
        ))}
      </MapView>

      {/* Header */}
      <SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 8,
            padding: 16,
            backgroundColor: "rgba(10, 10, 15, 0.95)",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(255, 107, 53, 0.3)",
          }}
        >
          <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>Quest Map</Text>
          <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14, marginTop: 4 }}>
            {questMarkers.length > 0
              ? `${questMarkers.length} quests nearby`
              : "Tap Generate to find quests"}
          </Text>
        </View>
      </SafeAreaView>

      {/* Action Buttons */}
      <View style={{ position: "absolute", bottom: 100, right: 16, gap: 12 }}>
        {/* Generate Quests Button */}
        <Pressable
          onPress={handleGenerateQuests}
          disabled={generateQuestsMutation.isPending}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: generateQuestsMutation.isPending ? "#555" : "#7E3FE4",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#7E3FE4",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {generateQuestsMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Sparkles size={28} color="#fff" strokeWidth={2.5} />
          )}
        </Pressable>

        {/* Recenter Button */}
        <Pressable
          onPress={handleRecenterMap}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: "rgba(10, 10, 15, 0.95)",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.2)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Crosshair size={24} color="#fff" />
        </Pressable>

        {/* Create Quest Button */}
        <Pressable
          onPress={handleCreateQuestHere}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: "#FF6B35",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#FF6B35",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Plus size={28} color="#fff" strokeWidth={3} />
        </Pressable>
      </View>

      {/* Quest Detail Modal */}
      <Modal
        visible={selectedQuest !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedQuest(null)}
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
            onPress={() => setSelectedQuest(null)}
          />

          {selectedQuest && (
            <View
              style={{
                backgroundColor: "#0A0A0F",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 40,
                borderTopWidth: 2,
                borderColor: getCategoryColor(selectedQuest.category),
              }}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Close Button */}
                <Pressable
                  onPress={() => setSelectedQuest(null)}
                  style={{
                    position: "absolute",
                    top: 20,
                    right: 20,
                    zIndex: 10,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: 20,
                    padding: 8,
                  }}
                >
                  <X size={20} color="#fff" />
                </Pressable>

                {/* Quest Title */}
                <Text
                  style={{
                    color: "white",
                    fontSize: 24,
                    fontWeight: "bold",
                    marginBottom: 12,
                    paddingRight: 40,
                  }}
                >
                  {selectedQuest.title}
                </Text>

                {/* Category and Difficulty Badges */}
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                  <View
                    style={{
                      backgroundColor: `${getCategoryColor(selectedQuest.category)}20`,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: getCategoryColor(selectedQuest.category),
                    }}
                  >
                    <Text
                      style={{
                        color: getCategoryColor(selectedQuest.category),
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {selectedQuest.category}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: `${getDifficultyColor(selectedQuest.difficulty)}20`,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: getDifficultyColor(selectedQuest.difficulty),
                    }}
                  >
                    <Text
                      style={{
                        color: getDifficultyColor(selectedQuest.difficulty),
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {selectedQuest.difficulty}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                <Text
                  style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: 16,
                    lineHeight: 24,
                    marginBottom: 16,
                  }}
                >
                  {selectedQuest.description}
                </Text>

                {/* Location */}
                <View
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    marginBottom: 16,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <MapPin size={16} color="#00D9FF" />
                    <Text style={{ color: "#00D9FF", fontSize: 14, fontWeight: "600" }}>
                      Location
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.8)",
                      fontSize: 14,
                      marginTop: 4,
                    }}
                  >
                    {selectedQuest.location}
                  </Text>
                </View>

                {/* Rewards */}
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "rgba(255, 215, 0, 0.1)",
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "rgba(255, 215, 0, 0.3)",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Zap size={16} color="#FFD700" />
                      <Text style={{ color: "#FFD700", fontSize: 12, fontWeight: "600" }}>
                        XP Reward
                      </Text>
                    </View>
                    <Text style={{ color: "white", fontSize: 20, fontWeight: "bold", marginTop: 4 }}>
                      {selectedQuest.xpReward}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "rgba(255, 107, 53, 0.1)",
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "rgba(255, 107, 53, 0.3)",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Trophy size={16} color="#FF6B35" />
                      <Text style={{ color: "#FF6B35", fontSize: 12, fontWeight: "600" }}>
                        Points
                      </Text>
                    </View>
                    <Text style={{ color: "white", fontSize: 20, fontWeight: "bold", marginTop: 4 }}>
                      {selectedQuest.pointReward}
                    </Text>
                  </View>
                </View>

                {/* Accept Button */}
                <Pressable
                  onPress={handleAcceptQuest}
                  style={{
                    backgroundColor: getCategoryColor(selectedQuest.category),
                    paddingVertical: 16,
                    borderRadius: 16,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
                    Accept Quest
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
