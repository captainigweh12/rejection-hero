import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, X, Image as ImageIcon, Globe, Users, Lock, Camera } from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { api } from "@/lib/api";
import PostCard from "@/components/PostCard";
import { useSession } from "@/lib/useSession";

interface Post {
  id: string;
  content: string;
  privacy: string;
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
  group: {
    id: string;
    name: string;
  } | null;
  images: Array<{
    id: string;
    imageUrl: string;
    order: number;
  }>;
  likes: Array<{
    id: string;
    userId: string;
    createdAt: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      avatar: string | null;
    };
  }>;
  likeCount: number;
  commentCount: number;
  isLikedByCurrentUser: boolean;
}

interface GetPostsFeedResponse {
  posts: Post[];
}

interface MomentsUser {
  userId: string;
  userName: string | null;
  userAvatar: string | null;
  moments: Array<{
    id: string;
    imageUrl: string | null;
    videoUrl: string | null;
    content: string | null;
    expiresAt: string;
    createdAt: string;
  }>;
}

interface GetMomentsResponse {
  moments: MomentsUser[];
}

interface FeedScreenProps {
  onCreatePostPress?: () => void;
}

export default function FeedScreen({ onCreatePostPress }: FeedScreenProps = {}) {
  const queryClient = useQueryClient();
  const { data: sessionData } = useSession();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateMoment, setShowCreateMoment] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState<MomentsUser | null>(null);
  const [momentIndex, setMomentIndex] = useState(0);

  // Create post state
  const [postContent, setPostContent] = useState("");
  const [postPrivacy, setPostPrivacy] = useState<"PUBLIC" | "FRIENDS" | "GROUPS">("PUBLIC");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // Create moment state
  const [momentImage, setMomentImage] = useState<string | null>(null);

  // Fetch posts feed
  const {
    data: feedData,
    isLoading: feedLoading,
    refetch: refetchFeed,
  } = useQuery({
    queryKey: ["posts-feed"],
    queryFn: () => api.get<GetPostsFeedResponse>("/api/posts/feed"),
  });

  // Fetch moments
  const { data: momentsData, refetch: refetchMoments } = useQuery({
    queryKey: ["moments"],
    queryFn: () => api.get<GetMomentsResponse>("/api/moments"),
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (data: {
      content: string;
      privacy: string;
      groupId?: string;
      imageUrls?: string[];
    }) => api.post("/api/posts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts-feed"] });
      setShowCreatePost(false);
      setPostContent("");
      setSelectedImages([]);
      Alert.alert("Success", "Post created successfully!");
    },
    onError: () => {
      Alert.alert("Error", "Failed to create post. Please try again.");
    },
  });

  // Create moment mutation
  const createMomentMutation = useMutation({
    mutationFn: (data: { imageUrl?: string; content?: string }) =>
      api.post("/api/moments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moments"] });
      setShowCreateMoment(false);
      setMomentImage(null);
      Alert.alert("Success", "Moment created! It will expire in 24 hours.");
    },
    onError: () => {
      Alert.alert("Error", "Failed to create moment. Please try again.");
    },
  });

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const urls = result.assets.map((asset) => asset.uri);
      setSelectedImages([...selectedImages, ...urls]);
    }
  };

  const handleTakePhoto = async () => {
    // Request camera permissions
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
      setSelectedImages([...selectedImages, result.assets[0].uri]);
    }
  };

  const handlePickMomentImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setMomentImage(result.assets[0].uri);
    }
  };

  const handleTakeMomentPhoto = async () => {
    // Request camera permissions
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
      setMomentImage(result.assets[0].uri);
    }
  };

  const handleCreatePost = () => {
    if (!postContent.trim()) {
      Alert.alert("Error", "Please write something");
      return;
    }

    createPostMutation.mutate({
      content: postContent,
      privacy: postPrivacy,
      imageUrls: selectedImages.length > 0 ? selectedImages : undefined,
    });
  };

  const handleCreateMoment = async () => {
    if (!momentImage) {
      Alert.alert("Error", "Please select an image");
      return;
    }

    try {
      // Upload image to server first
      const formData = new FormData();
      const filename = momentImage.split("/").pop() || "moment.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("image", {
        uri: momentImage,
        name: filename,
        type,
      } as any);

      const uploadResponse = await fetch(`${process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL}/api/upload/image`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      const uploadData = await uploadResponse.json();
      const serverImageUrl = `${process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL}${uploadData.url}`;

      // Now create moment with server URL
      createMomentMutation.mutate({
        imageUrl: serverImageUrl,
      });
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    }
  };

  const privacyIcon = (privacy: string) => {
    switch (privacy) {
      case "PUBLIC":
        return <Globe size={16} color="#888" />;
      case "FRIENDS":
        return <Users size={16} color="#888" />;
      case "GROUPS":
        return <Lock size={16} color="#888" />;
      default:
        return <Globe size={16} color="#888" />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
      {/* What's on your mind - Facebook Style */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <TouchableOpacity
          onPress={() => {
            if (onCreatePostPress) {
              onCreatePostPress();
            }
            setShowCreatePost(true);
          }}
          activeOpacity={0.7}
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderRadius: 16,
            padding: 12,
            borderWidth: 1,
            borderColor: "rgba(126, 63, 228, 0.2)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {/* User Avatar */}
            {sessionData?.user?.image ? (
              <Image
                source={{ uri: sessionData.user.image }}
                style={{ width: 44, height: 44, borderRadius: 22 }}
              />
            ) : (
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#7E3FE4",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
                  {sessionData?.user?.name?.charAt(0).toUpperCase() || "?"}
                </Text>
              </View>
            )}
            {/* Input Placeholder */}
            <Text style={{ flex: 1, color: "#888", fontSize: 16 }}>
              What&apos;s on your mind?
            </Text>
            {/* Photo Icon */}
            <ImageIcon size={24} color="#4CAF50" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Stories/Moments Bar - Facebook Style */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          borderBottomWidth: 1,
          borderBottomColor: "rgba(126, 63, 228, 0.2)",
          marginBottom: 16,
        }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12, gap: 10 }}
      >
        {/* Create Story Card - Facebook Style */}
        <TouchableOpacity
          onPress={() => setShowCreateMoment(true)}
          style={{
            width: 110,
            height: 180,
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderWidth: 1,
            borderColor: "rgba(126, 63, 228, 0.2)",
          }}
        >
          {/* User Image Background */}
          <View style={{ flex: 1, backgroundColor: "rgba(126, 63, 228, 0.2)" }}>
            {sessionData?.user?.image ? (
              <Image
                source={{ uri: sessionData.user.image }}
                style={{ width: "100%", height: "70%" }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: "100%",
                  height: "70%",
                  backgroundColor: "#7E3FE4",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "white", fontSize: 32, fontWeight: "bold" }}>
                  {sessionData?.user?.name?.charAt(0).toUpperCase() || "?"}
                </Text>
              </View>
            )}
          </View>

          {/* Create Story Button */}
          <View
            style={{
              position: "absolute",
              bottom: 30,
              left: "50%",
              marginLeft: -18,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#7E3FE4",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 3,
              borderColor: "#0A0A0F",
            }}
          >
            <Plus size={20} color="white" strokeWidth={3} />
          </View>

          {/* Text Label */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              width: "100%",
              paddingVertical: 8,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>
              Create story
            </Text>
          </View>
        </TouchableOpacity>

        {/* User Stories */}
        {momentsData?.moments.map((momentUser) => (
          <TouchableOpacity
            key={momentUser.userId}
            onPress={() => {
              setSelectedMoment(momentUser);
              setMomentIndex(0);
            }}
            style={{
              width: 110,
              height: 180,
              borderRadius: 12,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Story Image */}
            {momentUser.moments[0]?.imageUrl ? (
              <Image
                source={{ uri: momentUser.moments[0].imageUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#7E3FE4",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "white", fontSize: 32, fontWeight: "bold" }}>
                  {momentUser.userName?.charAt(0).toUpperCase() || "?"}
                </Text>
              </View>
            )}

            {/* Gradient Overlay */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.3)",
              }}
            />

            {/* User Avatar Ring */}
            <View
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 3,
                borderColor: "#7E3FE4",
                overflow: "hidden",
              }}
            >
              {momentUser.userAvatar ? (
                <Image
                  source={{ uri: momentUser.userAvatar }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <View
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#7E3FE4",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
                    {momentUser.userName?.charAt(0).toUpperCase() || "?"}
                  </Text>
                </View>
              )}
            </View>

            {/* User Name */}
            <View
              style={{
                position: "absolute",
                bottom: 8,
                left: 8,
                right: 8,
              }}
            >
              <Text
                style={{ color: "white", fontSize: 13, fontWeight: "700", textShadowColor: "rgba(0, 0, 0, 0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}
                numberOfLines={2}
              >
                {momentUser.userName || "Anonymous"}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Posts Feed */}
      {feedLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#7E3FE4" />
        </View>
      ) : (
        <FlatList
          data={feedData?.posts || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard post={item} currentUserId={sessionData?.user?.id || ""} />
          )}
          contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                refetchFeed();
                refetchMoments();
              }}
              tintColor="#7E3FE4"
            />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Text style={{ color: "#888", fontSize: 16 }}>No posts yet</Text>
              <Text style={{ color: "#666", fontSize: 14, marginTop: 8 }}>
                Be the first to share something!
              </Text>
            </View>
          }
        />
      )}

      {/* Create Post Modal - Modern Popup Style */}
      <Modal
        visible={showCreatePost}
        animationType="fade"
        onRequestClose={() => setShowCreatePost(false)}
        transparent={true}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        }}>
          <SafeAreaView style={{ width: "100%", maxWidth: 500 }}>
            <View style={{
              backgroundColor: "#1A1A24",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "rgba(126, 63, 228, 0.3)",
              maxHeight: "85%",
              width: "100%",
            }}>
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 20,
                  paddingTop: 20,
                  paddingBottom: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(126, 63, 228, 0.2)",
                }}
              >
                <TouchableOpacity onPress={() => setShowCreatePost(false)}>
                  <X size={24} color="white" />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "white" }}>
                  Create post
                </Text>
                <TouchableOpacity
                  onPress={handleCreatePost}
                  disabled={createPostMutation.isPending || !postContent.trim()}
                  style={{
                    backgroundColor: !postContent.trim() ? "rgba(126, 63, 228, 0.3)" : "#7E3FE4",
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  {createPostMutation.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={{
                      color: "white",
                      fontWeight: "600",
                      fontSize: 14,
                      opacity: !postContent.trim() ? 0.5 : 1
                    }}>
                      Post
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ maxHeight: 450 }}
                showsVerticalScrollIndicator={false}
              >
                {/* User Info */}
                <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    {/* Avatar */}
                    {sessionData?.user?.image ? (
                      <Image
                        source={{ uri: sessionData.user.image }}
                        style={{ width: 44, height: 44, borderRadius: 22 }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: "#7E3FE4",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
                          {sessionData?.user?.name?.charAt(0).toUpperCase() || "?"}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "white", fontSize: 15, fontWeight: "600", marginBottom: 6 }}>
                        {sessionData?.user?.name || "Anonymous"}
                      </Text>
                      {/* Privacy Selector - Compact */}
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                        {(["PUBLIC", "FRIENDS", "GROUPS"] as const).map((privacy) => (
                          <TouchableOpacity
                            key={privacy}
                            onPress={() => setPostPrivacy(privacy)}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6,
                              backgroundColor:
                                postPrivacy === privacy
                                  ? "rgba(126, 63, 228, 0.3)"
                                  : "rgba(255, 255, 255, 0.05)",
                              borderWidth: 1,
                              borderColor:
                                postPrivacy === privacy
                                  ? "#7E3FE4"
                                  : "rgba(126, 63, 228, 0.2)",
                            }}
                          >
                            {privacyIcon(privacy)}
                            <Text
                              style={{
                                color: postPrivacy === privacy ? "#7E3FE4" : "#888",
                                marginLeft: 4,
                                fontSize: 11,
                                fontWeight: postPrivacy === privacy ? "600" : "400",
                              }}
                            >
                              {privacy}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>

                {/* Content Input */}
                <View style={{ paddingHorizontal: 20 }}>
                  <TextInput
                    value={postContent}
                    onChangeText={setPostContent}
                    placeholder="What's on your mind?"
                    placeholderTextColor="#666"
                    multiline
                    autoFocus
                    style={{
                      color: "white",
                      fontSize: 16,
                      minHeight: 120,
                      maxHeight: 200,
                      textAlignVertical: "top",
                      marginBottom: 12,
                    }}
                  />

                  {/* Selected Images */}
                  {selectedImages.length > 0 && (
                    <View style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 12,
                      padding: 8,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: "rgba(126, 63, 228, 0.2)",
                    }}>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {selectedImages.map((uri, index) => (
                          <View key={index} style={{ position: "relative" }}>
                            <Image
                              source={{ uri }}
                              style={{ width: 90, height: 90, borderRadius: 8 }}
                            />
                            <TouchableOpacity
                              onPress={() =>
                                setSelectedImages(selectedImages.filter((_, i) => i !== index))
                              }
                              style={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                backgroundColor: "rgba(0, 0, 0, 0.7)",
                                borderRadius: 12,
                                width: 24,
                                height: 24,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <X size={16} color="white" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={{
                  paddingHorizontal: 20,
                  paddingBottom: 20,
                }}>
                  <Text style={{
                    color: "#888",
                    fontSize: 13,
                    fontWeight: "600",
                    marginBottom: 10,
                  }}>
                    Add to your post
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                    {/* Photo/video */}
                    <TouchableOpacity
                      onPress={handlePickImage}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: "rgba(76, 175, 80, 0.2)",
                        borderWidth: 1,
                        borderColor: "rgba(76, 175, 80, 0.3)",
                        flex: 1,
                        minWidth: 100,
                      }}
                    >
                      <ImageIcon size={18} color="#4CAF50" />
                      <Text style={{ color: "#4CAF50", marginLeft: 6, fontWeight: "600", fontSize: 13 }}>
                        Photo
                      </Text>
                    </TouchableOpacity>

                    {/* Camera */}
                    <TouchableOpacity
                      onPress={handleTakePhoto}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: "rgba(255, 107, 53, 0.2)",
                        borderWidth: 1,
                        borderColor: "rgba(255, 107, 53, 0.3)",
                        flex: 1,
                        minWidth: 100,
                      }}
                    >
                      <Camera size={18} color="#FF6B35" />
                      <Text style={{ color: "#FF6B35", marginLeft: 6, fontWeight: "600", fontSize: 13 }}>
                        Camera
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Create Moment Modal - Instagram/Snapchat Style */}
      <Modal
        visible={showCreateMoment}
        animationType="slide"
        onRequestClose={() => setShowCreateMoment(false)}
        presentationStyle="fullScreen"
      >
        <View style={{ flex: 1, backgroundColor: "#000000" }}>
          <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingVertical: 16,
              }}
            >
              <TouchableOpacity onPress={() => setShowCreateMoment(false)}>
                <X size={28} color="white" strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={{ fontSize: 20, fontWeight: "700", color: "white" }}>
                Add to story
              </Text>
              <TouchableOpacity>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: "white",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "white",
                    }}
                  />
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Creation Options */}
              <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    {/* Add Yours Option */}
                    <TouchableOpacity
                      onPress={handlePickMomentImage}
                      style={{
                        width: 140,
                        height: 180,
                        borderRadius: 16,
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        overflow: "hidden",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 30,
                          backgroundColor: "rgba(255, 255, 255, 0.2)",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 12,
                        }}
                      >
                        <Plus size={32} color="white" strokeWidth={3} />
                      </View>
                      <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                        Add Yours
                      </Text>
                    </TouchableOpacity>

                    {/* Music Option */}
                    <TouchableOpacity
                      style={{
                        width: 140,
                        height: 180,
                        borderRadius: 16,
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        overflow: "hidden",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 30,
                          backgroundColor: "rgba(255, 100, 100, 0.3)",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 12,
                        }}
                      >
                        <Text style={{ fontSize: 32 }}>🎵</Text>
                      </View>
                      <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                        Music
                      </Text>
                    </TouchableOpacity>

                    {/* Collage Option */}
                    <TouchableOpacity
                      style={{
                        width: 140,
                        height: 180,
                        borderRadius: 16,
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        overflow: "hidden",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 30,
                          backgroundColor: "rgba(255, 150, 100, 0.3)",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 12,
                        }}
                      >
                        <ImageIcon size={32} color="white" />
                      </View>
                      <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                        Collage
                      </Text>
                    </TouchableOpacity>

                    {/* AI Images Option */}
                    <TouchableOpacity
                      style={{
                        width: 140,
                        height: 180,
                        borderRadius: 16,
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        overflow: "hidden",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 30,
                          backgroundColor: "rgba(150, 100, 255, 0.3)",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 12,
                        }}
                      >
                        <Text style={{ fontSize: 32 }}>✨</Text>
                      </View>
                      <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                        AI Images
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>

              {/* Recents Section */}
              <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>
                    Recents
                  </Text>
                  <TouchableOpacity>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ImageIcon size={18} color="white" />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Recent Posts Grid */}
                <View style={{ gap: 12 }}>
                  {feedData?.posts.slice(0, 4).map((post) => (
                    <TouchableOpacity
                      key={post.id}
                      onPress={() => {
                        // Could implement selecting a post to share as story
                        Alert.alert("Coming Soon", "Share post as story feature coming soon!");
                      }}
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                        borderRadius: 16,
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      {post.images && post.images[0] ? (
                        <Image
                          source={{ uri: post.images[0].imageUrl }}
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 12,
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                          }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 12,
                            backgroundColor: "rgba(126, 63, 228, 0.3)",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Camera size={32} color="#7E3FE4" />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ color: "white", fontSize: 15, fontWeight: "600" }}
                          numberOfLines={2}
                        >
                          {post.content}
                        </Text>
                        <Text
                          style={{
                            color: "rgba(255, 255, 255, 0.5)",
                            fontSize: 13,
                            marginTop: 4,
                          }}
                        >
                          {new Date(post.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                  {/* Camera Button at Bottom */}
                  <TouchableOpacity
                    onPress={handleTakeMomentPhoto}
                    style={{
                      backgroundColor: "rgba(126, 63, 228, 0.2)",
                      borderRadius: 16,
                      padding: 20,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: "#7E3FE4",
                      marginTop: 8,
                    }}
                  >
                    <Camera size={40} color="#7E3FE4" strokeWidth={2} />
                    <Text
                      style={{
                        color: "#7E3FE4",
                        fontSize: 16,
                        fontWeight: "700",
                        marginTop: 8,
                      }}
                    >
                      Take Photo
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Share Selected Image */}
            {momentImage && (
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.95)",
                  paddingVertical: 20,
                  paddingHorizontal: 20,
                  borderTopWidth: 1,
                  borderTopColor: "rgba(255, 255, 255, 0.1)",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Image
                    source={{ uri: momentImage }}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 12,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                      Ready to share
                    </Text>
                    <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14 }}>
                      Expires in 24 hours
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setMomentImage(null)}
                    style={{ padding: 8 }}
                  >
                    <X size={24} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCreateMoment}
                    disabled={createMomentMutation.isPending}
                    style={{
                      backgroundColor: "#7E3FE4",
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      borderRadius: 24,
                    }}
                  >
                    {createMomentMutation.isPending ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                        Share
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>

      {/* Moment Viewer Modal - Instagram Style */}
      {selectedMoment && (
        <Modal
          visible={!!selectedMoment}
          animationType="fade"
          onRequestClose={() => setSelectedMoment(null)}
        >
          <View style={{ flex: 1, backgroundColor: "black" }}>
            <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
              {/* Progress Bars */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 4,
                  paddingHorizontal: 12,
                  paddingTop: 12,
                }}
              >
                {selectedMoment.moments.map((_, index) => (
                  <View
                    key={index}
                    style={{
                      flex: 1,
                      height: 3,
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        backgroundColor: index <= momentIndex ? "white" : "transparent",
                        borderRadius: 2,
                      }}
                    />
                  </View>
                ))}
              </View>

              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      borderWidth: 2,
                      borderColor: "#7E3FE4",
                      overflow: "hidden",
                    }}
                  >
                    {selectedMoment.userAvatar ? (
                      <Image
                        source={{ uri: selectedMoment.userAvatar }}
                        style={{ width: "100%", height: "100%" }}
                      />
                    ) : (
                      <View
                        style={{
                          width: "100%",
                          height: "100%",
                          backgroundColor: "#7E3FE4",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                          {selectedMoment.userName?.charAt(0).toUpperCase() || "?"}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View>
                    <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                      {selectedMoment.userName || "Anonymous"}
                    </Text>
                    <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 13 }}>
                      {new Date(selectedMoment.moments[momentIndex].createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedMoment(null)}
                  style={{ padding: 8 }}
                >
                  <X size={28} color="white" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {/* Story Content */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => {
                  const { locationX } = e.nativeEvent;
                  const screenWidth = 400; // approximate
                  if (locationX < screenWidth / 2) {
                    // Tap left side - previous
                    if (momentIndex > 0) {
                      setMomentIndex(momentIndex - 1);
                    }
                  } else {
                    // Tap right side - next
                    if (momentIndex < selectedMoment.moments.length - 1) {
                      setMomentIndex(momentIndex + 1);
                    } else {
                      setSelectedMoment(null);
                    }
                  }
                }}
                style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
              >
                {selectedMoment.moments[momentIndex]?.imageUrl && (
                  <Image
                    source={{ uri: selectedMoment.moments[momentIndex].imageUrl }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="contain"
                  />
                )}
              </TouchableOpacity>

              {/* Bottom Info */}
              {selectedMoment.moments[momentIndex]?.content && (
                <View
                  style={{
                    position: "absolute",
                    bottom: 40,
                    left: 20,
                    right: 20,
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 15 }}>
                    {selectedMoment.moments[momentIndex].content}
                  </Text>
                </View>
              )}
            </SafeAreaView>
          </View>
        </Modal>
      )}
    </View>
  );
}
