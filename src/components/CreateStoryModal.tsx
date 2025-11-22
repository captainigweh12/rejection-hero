import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { X, Camera, Image as ImageIcon, Video, VideoIcon } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Video as ExpoVideo, ResizeMode } from "expo-av";

interface CreateStoryModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateStory: (imageUrl?: string, videoUrl?: string, text?: string) => Promise<void>;
  isLoading?: boolean;
}

export default function CreateStoryModal({
  visible,
  onClose,
  onCreateStory,
  isLoading = false,
}: CreateStoryModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [storyText, setStoryText] = useState("");

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setSelectedVideo(null); // Clear video if image is selected
    }
  };

  const handlePickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
      allowsEditing: true,
      videoMaxDuration: 60, // 60 seconds max
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedVideo(result.assets[0].uri);
      setSelectedImage(null); // Clear image if video is selected
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Camera permission is required to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setSelectedVideo(null); // Clear video if image is selected
    }
  };

  const handleRecordVideo = async () => {
    // Request camera permissions
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus.status !== "granted") {
      Alert.alert("Permission Required", "Camera permission is required to record videos.");
      return;
    }

    // Note: Camera permission typically includes microphone access for video recording
    // If separate microphone permission is needed, use expo-av Audio.requestPermissionsAsync()
    // For now, camera permission is sufficient for video recording

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
      allowsEditing: true,
      videoMaxDuration: 60, // 60 seconds max
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedVideo(result.assets[0].uri);
      setSelectedImage(null); // Clear image if video is selected
    }
  };

  const handleShare = async () => {
    if (!selectedImage && !selectedVideo) {
      Alert.alert("Error", "Please select or capture a photo or video first");
      return;
    }

    try {
      await onCreateStory(selectedImage || undefined, selectedVideo || undefined, storyText.trim() || undefined);
      // Reset state
      setSelectedImage(null);
      setSelectedVideo(null);
      setStoryText("");
      onClose();
    } catch (error) {
      console.error("Error creating story:", error);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setSelectedVideo(null);
    setStoryText("");
    onClose();
  };

  const hasMedia = selectedImage || selectedVideo;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "90%",
              maxHeight: "85%",
              backgroundColor: "#0A0A0F",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "rgba(126, 63, 228, 0.3)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: "rgba(126, 63, 228, 0.2)",
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>Create Story</Text>
              <TouchableOpacity onPress={handleClose}>
                <X size={24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Media Preview or Upload Options */}
              {hasMedia ? (
                <View>
                  {/* Image Preview */}
                  {selectedImage && (
                    <View
                      style={{
                        width: "100%",
                        height: 300,
                        borderRadius: 16,
                        overflow: "hidden",
                        marginBottom: 16,
                        backgroundColor: "#000",
                      }}
                    >
                      <Image
                        source={{ uri: selectedImage }}
                        style={{
                          width: "100%",
                          height: "100%",
                          resizeMode: "cover",
                        }}
                      />
                    </View>
                  )}

                  {/* Video Preview */}
                  {selectedVideo && (
                    <View
                      style={{
                        width: "100%",
                        height: 300,
                        borderRadius: 16,
                        overflow: "hidden",
                        marginBottom: 16,
                        backgroundColor: "#000",
                      }}
                    >
                      <ExpoVideo
                        source={{ uri: selectedVideo }}
                        style={{
                          width: "100%",
                          height: "100%",
                        }}
                        useNativeControls
                        resizeMode={ResizeMode.CONTAIN}
                        isLooping
                      />
                    </View>
                  )}

                  {/* Text Input for Caption */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "rgba(255, 255, 255, 0.8)", marginBottom: 8 }}>
                      Add text to your story (optional)
                    </Text>
                    <TextInput
                      value={storyText}
                      onChangeText={setStoryText}
                      placeholder="Write something..."
                      placeholderTextColor="rgba(255, 255, 255, 0.3)"
                      multiline
                      numberOfLines={3}
                      maxLength={200}
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        borderWidth: 1,
                        borderColor: "rgba(126, 63, 228, 0.3)",
                        borderRadius: 12,
                        padding: 12,
                        color: "white",
                        fontSize: 14,
                        minHeight: 80,
                        textAlignVertical: "top",
                      }}
                    />
                    <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.5)", marginTop: 4, textAlign: "right" }}>
                      {storyText.length}/200
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedImage(null);
                        setSelectedVideo(null);
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        borderWidth: 1,
                        borderColor: "rgba(126, 63, 228, 0.3)",
                        borderRadius: 12,
                        padding: 14,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "white", fontWeight: "600" }}>Change Media</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleShare}
                      disabled={isLoading}
                      style={{
                        flex: 1,
                        backgroundColor: "#7E3FE4",
                        borderRadius: 12,
                        padding: 14,
                        alignItems: "center",
                        opacity: isLoading ? 0.5 : 1,
                      }}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text style={{ color: "white", fontWeight: "600" }}>Share Story</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* Upload Options */
                <View style={{ gap: 12 }}>
                  <Text style={{ fontSize: 16, textAlign: "center", color: "rgba(255, 255, 255, 0.8)", marginBottom: 16 }}>
                    Choose media to share as your story
                  </Text>

                  {/* Gallery Image Button */}
                  <TouchableOpacity
                    onPress={handlePickImage}
                    style={{
                      backgroundColor: "rgba(126, 63, 228, 0.2)",
                      borderWidth: 2,
                      borderColor: "#7E3FE4",
                      borderRadius: 16,
                      padding: 20,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: "rgba(126, 63, 228, 0.3)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ImageIcon size={24} color="#7E3FE4" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Choose from Gallery</Text>
                      <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14 }}>Pick a photo from your device</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Gallery Video Button */}
                  <TouchableOpacity
                    onPress={handlePickVideo}
                    style={{
                      backgroundColor: "rgba(0, 217, 255, 0.2)",
                      borderWidth: 2,
                      borderColor: "#00D9FF",
                      borderRadius: 16,
                      padding: 20,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: "rgba(0, 217, 255, 0.3)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Video size={24} color="#00D9FF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Upload Video</Text>
                      <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14 }}>Pick a video from your device</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Camera Photo Button */}
                  <TouchableOpacity
                    onPress={handleTakePhoto}
                    style={{
                      backgroundColor: "rgba(255, 107, 53, 0.2)",
                      borderWidth: 2,
                      borderColor: "#FF6B35",
                      borderRadius: 16,
                      padding: 20,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: "rgba(255, 107, 53, 0.3)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Camera size={24} color="#FF6B35" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Take Photo</Text>
                      <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14 }}>Use your camera to take a photo</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Record Video Button */}
                  <TouchableOpacity
                    onPress={handleRecordVideo}
                    style={{
                      backgroundColor: "rgba(255, 59, 48, 0.2)",
                      borderWidth: 2,
                      borderColor: "#FF3B30",
                      borderRadius: 16,
                      padding: 20,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: "rgba(255, 59, 48, 0.3)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <VideoIcon size={24} color="#FF3B30" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Record Video</Text>
                      <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14 }}>Record a video with your camera (max 60s)</Text>
                    </View>
                  </TouchableOpacity>

                  <Text style={{ fontSize: 12, textAlign: "center", color: "rgba(255, 255, 255, 0.5)", marginTop: 16 }}>
                    Stories expire after 24 hours
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
