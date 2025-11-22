import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Camera, Image as ImageIcon, Video as VideoIcon, Send } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Video as ExpoVideo, ResizeMode } from "expo-av";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { RootStackScreenProps } from "@/navigation/types";
import { api, BACKEND_URL, uploadImage } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useSession } from "@/lib/useSession";

type Props = RootStackScreenProps<"CreateStory">;

export default function CreateStoryScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { data: sessionData } = useSession();
  const queryClient = useQueryClient();
  const [selectedMedia, setSelectedMedia] = useState<{ uri: string; type: "image" | "video" } | null>(null);
  const [storyText, setStoryText] = useState(route.params?.initialCaption || "");
  const [isUploading, setIsUploading] = useState(false);

  // Request camera permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Camera permission is required to take photos/videos for your story."
        );
      }
    })();
  }, []);

  const handlePickFromGallery = async (mediaType: "image" | "video") => {
    try {
      // 1. Ask for permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "We need access to your photos to let you upload a story."
        );
        return;
      }

      // 2. Use MediaType API with defensive checks
      // Ensure MediaType exists before accessing properties
      if (!ImagePicker.MediaType) {
        console.error("ImagePicker.MediaType is undefined. Check expo-image-picker version.");
        Alert.alert(
          "Error",
          "Media picker is not available. Please update the app."
        );
        return;
      }

      const mediaTypes =
        mediaType === "image"
          ? ImagePicker.MediaType.Images
          : ImagePicker.MediaType.Videos;

      // 3. Launch picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsEditing: true,
        quality: 0.8,
        aspect: [9, 16], // Story aspect ratio
      });

      // 4. User cancelled or no assets
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      // 5. Use first asset with validation
      const asset = result.assets[0];
      if (asset && asset.uri) {
        setSelectedMedia({
          uri: asset.uri,
          type: mediaType,
        });
      } else {
        Alert.alert(
          "Error",
          "Could not load the selected media. Please try again."
        );
      }
    } catch (err: any) {
      console.error("handlePickFromGallery error", err);
      const errorMessage = err?.message || "Unknown error";
      Alert.alert(
        "Upload error",
        `Something went wrong while picking media: ${errorMessage}. Please try again.`
      );
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Camera permission is required to take photos.");
        return;
      }

      // Defensive check for MediaType
      if (!ImagePicker.MediaType || !ImagePicker.MediaType.Images) {
        Alert.alert("Error", "Camera is not available. Please update the app.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [9, 16],
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      if (asset) {
        setSelectedMedia({ uri: asset.uri, type: "image" });
      }
    } catch (err) {
      console.error("handleTakePhoto error", err);
      Alert.alert(
        "Camera error",
        "Something went wrong while taking a photo. Please try again."
      );
    }
  };

  const handleRecordVideo = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Camera permission is required to record videos.");
        return;
      }

      // Defensive check for MediaType
      if (!ImagePicker.MediaType || !ImagePicker.MediaType.Videos) {
        Alert.alert("Error", "Camera is not available. Please update the app.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaType.Videos,
        quality: 0.8,
        allowsEditing: true,
        aspect: [9, 16],
        videoMaxDuration: 15, // 15 seconds max for stories
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      if (asset) {
        setSelectedMedia({ uri: asset.uri, type: "video" });
      }
    } catch (err) {
      console.error("handleRecordVideo error", err);
      Alert.alert(
        "Video recording error",
        "Something went wrong while recording video. Please try again."
      );
    }
  };

  const createStoryMutation = useMutation({
    mutationFn: async (data: { imageUrl?: string; videoUrl?: string; content?: string }) => {
      return api.post("/api/moments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moments"] });
      Alert.alert("Success", "Your story has been created! It will expire in 24 hours.", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to create story. Please try again.");
      setIsUploading(false);
    },
  });

  const handleShareStory = async () => {
    if (!selectedMedia) {
      Alert.alert("Error", "Please select or capture a photo/video first");
      return;
    }

    setIsUploading(true);

    try {
      // Determine filename based on media type
      const fileExtension = selectedMedia.type === "video" ? "mp4" : "jpg";
      const filename = `story-${Date.now()}.${fileExtension}`;
      
      // Upload media to server
      const serverMediaUrl = await uploadImage(selectedMedia.uri, filename);

      // Create story with server URL
      if (selectedMedia.type === "image") {
        createStoryMutation.mutate({
          imageUrl: serverMediaUrl,
          content: storyText.trim() || undefined,
        });
      } else {
        createStoryMutation.mutate({
          videoUrl: serverMediaUrl,
          content: storyText.trim() || undefined,
        });
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      console.error("Upload error details:", {
        endpoint: `${BACKEND_URL}/api/upload/image`,
        mediaType: selectedMedia.type,
        errorMessage: error?.message,
        errorStatus: error?.status,
        errorResponse: error?.response,
      });
      Alert.alert(
        "Upload Error",
        error?.message || "Failed to upload media. Please try again."
      );
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (selectedMedia || storyText.trim()) {
      Alert.alert(
        "Discard Story?",
        "Are you sure you want to discard this story?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              setSelectedMedia(null);
              setStoryText("");
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView 
      style={{ flex: 1, backgroundColor: colors.backgroundSolid }} 
      edges={["top", "bottom", "left", "right"]}
    >
      <StatusBar barStyle="light-content" />
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.cardBorder,
          }}
        >
          <TouchableOpacity onPress={handleClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>Create Story</Text>
          <TouchableOpacity
            testID="share-story-button"
            onPress={handleShareStory}
            disabled={!selectedMedia || isUploading || createStoryMutation.isPending}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor:
                !selectedMedia || isUploading || createStoryMutation.isPending
                  ? colors.primaryLight
                  : colors.primary,
              opacity: !selectedMedia || isUploading || createStoryMutation.isPending ? 0.5 : 1,
            }}
          >
            {isUploading || createStoryMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Send size={18} color={colors.text} />
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          {selectedMedia ? (
            <View style={{ flex: 1 }}>
              {/* Media Preview */}
              <View style={{ flex: 1, backgroundColor: "black", position: "relative" }}>
                {selectedMedia.type === "image" ? (
                  <Image
                    source={{ uri: selectedMedia.uri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="contain"
                  />
                ) : (
                  <ExpoVideo
                    source={{ uri: selectedMedia.uri }}
                    style={{ width: "100%", height: "100%" }}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping
                  />
                )}

                {/* Text Overlay Input */}
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    padding: 16,
                  }}
                >
                  <TextInput
                    value={storyText}
                    onChangeText={setStoryText}
                    testID="story-caption-input"
                    placeholder="Add text to your story..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    multiline
                    maxLength={200}
                    style={{
                      color: "white",
                      fontSize: 16,
                      minHeight: 60,
                      textAlignVertical: "top",
                      padding: 12,
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.2)",
                    }}
                  />
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.5)",
                      fontSize: 12,
                      textAlign: "right",
                      marginTop: 4,
                    }}
                  >
                    {storyText.length}/200
                  </Text>
                </View>
              </View>

              {/* Change Media Button */}
              <View style={{ padding: 16, backgroundColor: colors.backgroundSolid }}>
                <TouchableOpacity
                  onPress={() => setSelectedMedia(null)}
                  style={{
                    backgroundColor: colors.card,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>
                    Change Media
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Media Selection Options */
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                padding: 20,
                gap: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  color: colors.text,
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Create Your Story
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginBottom: 32,
                }}
              >
                Share a moment that will disappear in 24 hours
              </Text>

              {/* Image from Gallery */}
              <TouchableOpacity
                testID="select-image-button"
                onPress={() => handlePickFromGallery("image")}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  borderWidth: 2,
                  borderColor: colors.primary,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.primary + "20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ImageIcon size={28} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
                    Choose Photo
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                    Select a photo from your gallery
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Video from Gallery */}
              <TouchableOpacity
                onPress={() => handlePickFromGallery("video")}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  borderWidth: 2,
                  borderColor: colors.info,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.info + "20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <VideoIcon size={28} color={colors.info} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
                    Choose Video
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                    Select a video from your gallery
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Take Photo */}
              <TouchableOpacity
                onPress={handleTakePhoto}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  borderWidth: 2,
                  borderColor: colors.secondary,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.secondary + "20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Camera size={28} color={colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
                    Take Photo
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                    Use your camera to take a photo
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Record Video */}
              <TouchableOpacity
                onPress={handleRecordVideo}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  borderWidth: 2,
                  borderColor: "#FFD700",
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: "#FFD700" + "20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <VideoIcon size={28} color="#FFD700" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
                    Record Video
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                    Record a video (max 15 seconds)
                  </Text>
                </View>
              </TouchableOpacity>

              <Text
                style={{
                  fontSize: 12,
                  color: colors.textTertiary,
                  textAlign: "center",
                  marginTop: 16,
                }}
              >
                Stories expire after 24 hours
              </Text>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

