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
import { X, Camera, Image as ImageIcon } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

interface CreateStoryModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateStory: (imageUrl: string, text?: string) => Promise<void>;
  isLoading?: boolean;
}

export default function CreateStoryModal({
  visible,
  onClose,
  onCreateStory,
  isLoading = false,
}: CreateStoryModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [storyText, setStoryText] = useState("");

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
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
    }
  };

  const handleShare = async () => {
    if (!selectedImage) {
      Alert.alert("Error", "Please select or take a photo first");
      return;
    }

    try {
      await onCreateStory(selectedImage, storyText.trim() || undefined);
      // Reset state
      setSelectedImage(null);
      setStoryText("");
      onClose();
    } catch (error) {
      console.error("Error creating story:", error);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setStoryText("");
    onClose();
  };

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
              <Text className="text-xl font-bold text-white">Create Story</Text>
              <TouchableOpacity onPress={handleClose}>
                <X size={24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Image Preview or Upload Options */}
              {selectedImage ? (
                <View>
                  {/* Image Preview */}
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

                  {/* Text Input for Caption */}
                  <View style={{ marginBottom: 16 }}>
                    <Text className="text-sm font-semibold text-white/80 mb-2">
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
                    <Text className="text-xs text-white/50 mt-1 text-right">
                      {storyText.length}/200
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => setSelectedImage(null)}
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
                      <Text className="text-white font-semibold">Change Photo</Text>
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
                      }}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text className="text-white font-semibold">Share Story</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* Upload Options */
                <View style={{ gap: 12 }}>
                  <Text className="text-center text-white/80 mb-4">
                    Choose a photo to share as your story
                  </Text>

                  {/* Gallery Button */}
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
                      <Text className="text-white font-bold text-base">Choose from Gallery</Text>
                      <Text className="text-white/60 text-sm">Pick a photo from your device</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Camera Button */}
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
                      <Text className="text-white font-bold text-base">Take Photo</Text>
                      <Text className="text-white/60 text-sm">Use your camera to take a photo</Text>
                    </View>
                  </TouchableOpacity>

                  <Text className="text-center text-white/50 text-xs mt-4">
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
