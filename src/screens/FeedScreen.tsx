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
import { Plus, X, Image as ImageIcon, Globe, Users, Lock, Camera, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Video as ExpoVideo, ResizeMode } from "expo-av";
import { api, BACKEND_URL, uploadImage } from "@/lib/api";
import PostCard from "@/components/PostCard";
import { useSession } from "@/lib/useSession";
import CreateStoryModal from "@/components/CreateStoryModal";
import { useTheme } from "@/contexts/ThemeContext";
import type { GetProfileResponse } from "@/shared/contracts";

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
  navigation?: any;
}

export default function FeedScreen({ onCreatePostPress, navigation }: FeedScreenProps = {}) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const { data: sessionData } = useSession();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateMoment, setShowCreateMoment] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState<MomentsUser | null>(null);
  const [momentIndex, setMomentIndex] = useState(0);

  // Fetch profile data for current user
  const { data: profileData } = useQuery<GetProfileResponse>({
    queryKey: ["profile"],
    queryFn: async () => {
      return api.get<GetProfileResponse>("/api/profile");
    },
    enabled: !!sessionData?.user,
  });

  // Create post state
  const [postContent, setPostContent] = useState("");
  const [postPrivacy, setPostPrivacy] = useState<"PUBLIC" | "FRIENDS" | "GROUPS">("PUBLIC");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

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
    mutationFn: (data: { imageUrl?: string; videoUrl?: string; content?: string }) =>
      api.post("/api/moments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moments"] });
      setShowCreateMoment(false);
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

  const handleCreateMoment = async (imageUrl?: string, videoUrl?: string, text?: string) => {
    try {
      let serverImageUrl: string | undefined;
      let serverVideoUrl: string | undefined;

      // Upload image if provided
      if (imageUrl) {
        // Use the uploadImage helper which handles FormData correctly
        serverImageUrl = await uploadImage(imageUrl);
      }

      // Upload video if provided (using same endpoint for now, backend will handle it)
      if (videoUrl) {
        // Use the uploadImage helper which handles FormData correctly (works for videos too)
        serverVideoUrl = await uploadImage(videoUrl, videoUrl.split("/").pop() || "moment.mp4");
      }

      // Now create moment with server URL(s)
      createMomentMutation.mutate({
        imageUrl: serverImageUrl,
        videoUrl: serverVideoUrl,
        content: text,
      });
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Failed to upload media. Please try again.");
      throw error; // Re-throw so modal can handle it
    }
  };

  const privacyIcon = (privacy: string) => {
    switch (privacy) {
      case "PUBLIC":
        return <Globe size={16} color={colors.textTertiary} />;
      case "FRIENDS":
        return <Users size={16} color={colors.textTertiary} />;
      case "GROUPS":
        return <Lock size={16} color={colors.textTertiary} />;
      default:
        return <Globe size={16} color={colors.textTertiary} />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
      {/* Stories/Moments Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.cardBorder,
          marginBottom: 8, // Reduced padding between stories and posts
          paddingTop: 8, // Add top padding
        }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12, gap: 10, paddingBottom: 16 }}
      >
        {/* Your Story Button */}
        <TouchableOpacity
          onPress={() => {
            // Navigate to CreateStory screen if navigation is available
            // Otherwise fall back to modal
            if (navigation) {
              navigation.navigate("CreateStory");
            } else {
              setShowCreateMoment(true);
            }
          }}
          style={{
            alignItems: "center",
            marginRight: 8,
          }}
        >
          <View
            style={{
              width: 70,
              height: 70,
              borderRadius: 35,
              borderWidth: 2,
              borderStyle: "dashed",
              borderColor: colors.primary,
              backgroundColor: colors.surface,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <Plus size={24} color={colors.primary} />
          </View>
          <Text style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}>
            Your Story
          </Text>
        </TouchableOpacity>

        {/* Friends' Stories */}
        {momentsData?.moments?.map((momentUser) => (
          <TouchableOpacity
            key={momentUser.userId}
            onPress={() => {
              setSelectedMoment(momentUser);
              setMomentIndex(0);
            }}
            style={{
              alignItems: "center",
              marginRight: 8,
            }}
          >
            <View
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                borderWidth: 2,
                borderColor: colors.primary,
                padding: 2,
                marginBottom: 6,
              }}
            >
              {momentUser.userAvatar ? (
                <Image
                  source={{ uri: momentUser.userAvatar }}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 33,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 33,
                    backgroundColor: colors.primary,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}>
                    {momentUser.userName?.charAt(0).toUpperCase() || "?"}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={{
                color: colors.text,
                fontSize: 12,
                maxWidth: 70,
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              {momentUser.userName || "Friend"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 12,
            borderWidth: 1,
            borderColor: colors.inputBorder,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {/* User Avatar */}
            {profileData?.avatar ? (
              <Image
                source={{ uri: profileData.avatar }}
                style={{ width: 44, height: 44, borderRadius: 22 }}
              />
            ) : (
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>
                  {profileData?.displayName?.charAt(0).toUpperCase() || sessionData?.user?.email?.split("@")[0]?.charAt(0).toUpperCase() || "?"}
                </Text>
              </View>
            )}
            {/* Input Placeholder */}
            <Text style={{ flex: 1, color: colors.textTertiary, fontSize: 16 }}>
              What&apos;s on your mind?
            </Text>
            {/* Photo Icon */}
            <ImageIcon size={24} color={colors.success} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Posts Feed - Scrollable with infinite scroll */}
      {feedLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={feedData?.posts || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard post={item} currentUserId={sessionData?.user?.id || ""} />
          )}
          contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 4, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                refetchFeed();
                refetchMoments();
              }}
              tintColor={colors.primary}
            />
          }
          onEndReached={() => {
            // Infinite scroll: Load more posts when reaching the end
            // This will be handled by the backend pagination if implemented
            console.log("[FeedScreen] Reached end of posts list");
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 16 }}>No posts yet</Text>
              <Text style={{ color: colors.textTertiary, fontSize: 14, marginTop: 8 }}>
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
          backgroundColor: colors.modalOverlay,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        }}>
          <SafeAreaView style={{ width: "100%", maxWidth: 500 }}>
            <View style={{
              backgroundColor: colors.backgroundSolid,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.cardBorder,
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
                  borderBottomColor: colors.inputBorder,
                }}
              >
                <TouchableOpacity onPress={() => setShowCreatePost(false)}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
                  Create post
                </Text>
                <TouchableOpacity
                  onPress={handleCreatePost}
                  disabled={createPostMutation.isPending || !postContent.trim()}
                  style={{
                    backgroundColor: !postContent.trim() ? colors.primaryLight : colors.primary,
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  {createPostMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Text style={{
                      color: colors.text,
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
                    {profileData?.avatar ? (
                      <Image
                        source={{ uri: profileData.avatar }}
                        style={{ width: 44, height: 44, borderRadius: 22 }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: colors.primary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>
                          {profileData?.displayName?.charAt(0).toUpperCase() || sessionData?.user?.email?.split("@")[0]?.charAt(0).toUpperCase() || "?"}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600", marginBottom: 6 }}>
                        {profileData?.displayName || sessionData?.user?.email?.split("@")[0] || "Anonymous"}
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
                                  ? colors.primaryLight
                                  : colors.surface,
                              borderWidth: 1,
                              borderColor:
                                postPrivacy === privacy
                                  ? colors.primary
                                  : colors.inputBorder,
                            }}
                          >
                            {privacyIcon(privacy)}
                            <Text
                              style={{
                                color: postPrivacy === privacy ? colors.primary : colors.textTertiary,
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
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    autoFocus
                    style={{
                      color: colors.text,
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
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      padding: 8,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: colors.inputBorder,
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
                              <X size={16} color={colors.text} />
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
                    color: colors.textSecondary,
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
                      <ImageIcon size={18} color={colors.success} />
                      <Text style={{ color: colors.success, marginLeft: 6, fontWeight: "600", fontSize: 13 }}>
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
                      <Camera size={18} color={colors.secondary} />
                      <Text style={{ color: colors.secondary, marginLeft: 6, fontWeight: "600", fontSize: 13 }}>
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

      {/* Create Story Modal - Compact Popup */}
      <CreateStoryModal
        visible={showCreateMoment}
        onClose={() => setShowCreateMoment(false)}
        onCreateStory={handleCreateMoment}
        isLoading={createMomentMutation.isPending}
      />

      {/* Moment Viewer Modal - Instagram Style */}
      {selectedMoment && (
        <Modal
          visible={!!selectedMoment}
          animationType="fade"
          onRequestClose={() => setSelectedMoment(null)}
        >
          <View style={{ flex: 1, backgroundColor: "black" }}>
            <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom", "left", "right"]}>
              <View style={{ flex: 1, overflow: "hidden" }}>
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
                      borderColor: colors.primary,
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
                          backgroundColor: colors.primary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
                          {selectedMoment.userName?.charAt(0).toUpperCase() || "?"}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View>
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
                      {selectedMoment.userName || "Anonymous"}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
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
                  <X size={28} color={colors.text} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {/* Story Content with Swipe Navigation */}
              <View style={{ flex: 1, position: "relative", overflow: "hidden" }}>
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
                  style={{ flex: 1, justifyContent: "center", alignItems: "center", overflow: "hidden" }}
                >
                  {selectedMoment.moments[momentIndex]?.imageUrl && (
                    <Image
                      source={{ uri: String(selectedMoment.moments[momentIndex].imageUrl) }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="contain"
                      onError={(error) => {
                        const imageUrl = selectedMoment.moments[momentIndex]?.imageUrl;
                        console.error("Failed to load story image:", {
                          imageUrl: typeof imageUrl === "string" ? imageUrl : "Invalid URL type",
                          error: error?.nativeEvent?.error || "Unknown error",
                        });
                      }}
                    />
                  )}
                  {selectedMoment.moments[momentIndex]?.videoUrl && (
                    <ExpoVideo
                      source={{ uri: selectedMoment.moments[momentIndex].videoUrl }}
                      style={{ width: "100%", height: "100%" }}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      isLooping
                    />
                  )}
                  {selectedMoment.moments[momentIndex]?.content && !selectedMoment.moments[momentIndex]?.imageUrl && !selectedMoment.moments[momentIndex]?.videoUrl && (
                    <View style={{ padding: 20 }}>
                      <Text style={{ color: "white", fontSize: 18, textAlign: "center" }}>
                        {selectedMoment.moments[momentIndex].content}
                      </Text>
                    </View>
                  )}

                {/* Navigation Arrows */}
                {momentIndex > 0 && (
                  <TouchableOpacity
                    onPress={() => setMomentIndex(momentIndex - 1)}
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: [{ translateY: -20 }],
                      padding: 12,
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      borderRadius: 20,
                    }}
                  >
                    <ChevronLeft size={24} color="white" />
                  </TouchableOpacity>
                )}
                {momentIndex < selectedMoment.moments.length - 1 && (
                  <TouchableOpacity
                    onPress={() => setMomentIndex(momentIndex + 1)}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: [{ translateY: -20 }],
                      padding: 12,
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      borderRadius: 20,
                    }}
                  >
                    <ChevronRight size={24} color="white" />
                  </TouchableOpacity>
                )}

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
              </TouchableOpacity>
              </View>
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      )}
    </View>
  );
}
