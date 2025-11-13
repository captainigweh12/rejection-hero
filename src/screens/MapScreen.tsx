import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { MapPin, Crosshair, Plus } from "lucide-react-native";
import type { BottomTabScreenProps } from "@/navigation/types";
import { useSession } from "@/lib/useSession";

type Props = BottomTabScreenProps<"MapTab">;

interface QuestLocation {
  id: string;
  title: string;
  category: string;
  latitude: number;
  longitude: number;
  difficulty: string;
}

export default function MapScreen({ navigation }: Props) {
  const { data: sessionData } = useSession();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [questLocations] = useState<QuestLocation[]>([
    // Sample quest locations - you can replace with real data from your backend
  ]);

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
    } catch (error) {
      Alert.alert("Error", "Failed to get your current location");
    }
    setLoading(false);
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

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
      <MapView
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
        {questLocations.map((quest) => (
          <Marker
            key={quest.id}
            coordinate={{
              latitude: quest.latitude,
              longitude: quest.longitude,
            }}
            title={quest.title}
            description={`${quest.category} - ${quest.difficulty}`}
            pinColor={getCategoryColor(quest.category)}
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
            Discover challenges near you
          </Text>
        </View>
      </SafeAreaView>

      {/* Action Buttons */}
      <View style={{ position: "absolute", bottom: 100, right: 16, gap: 12 }}>
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
    </View>
  );
}
