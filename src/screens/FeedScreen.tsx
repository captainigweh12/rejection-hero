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

export default function FeedScreen() {
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

  const handleCreateMoment = () => {
    if (!momentImage) {
      Alert.alert("Error", "Please select an image");
      return;
    }

    createMomentMutation.mutate({
      imageUrl: momentImage,
    });
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
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          paddingTop: 60,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(126, 63, 228, 0.2)",
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>Feed</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={() => setShowCreateMoment(true)}
            style={{
              backgroundColor: "#7E3FE4",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>+ Moment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowCreatePost(true)}
            style={{
              backgroundColor: "#7E3FE4",
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Moments Bar */}
      {momentsData && momentsData.moments.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            borderBottomWidth: 1,
            borderBottomColor: "rgba(126, 63, 228, 0.2)",
          }}
          contentContainerStyle={{ padding: 12, gap: 12 }}
        >
          {momentsData.moments.map((momentUser) => (
            <TouchableOpacity
              key={momentUser.userId}
              onPress={() => {
                setSelectedMoment(momentUser);
                setMomentIndex(0);
              }}
              style={{ alignItems: "center" }}
            >
              <View
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  borderWidth: 3,
                  borderColor: "#7E3FE4",
                  padding: 3,
                }}
              >
                {momentUser.userAvatar ? (
                  <Image
                    source={{ uri: momentUser.userAvatar }}
                    style={{ width: "100%", height: "100%", borderRadius: 32 }}
                  />
                ) : (
                  <View
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 32,
                      backgroundColor: "#7E3FE4",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
                      {momentUser.userName?.charAt(0).toUpperCase() || "?"}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={{ color: "white", fontSize: 12, marginTop: 4 }}
                numberOfLines={1}
              >
                {momentUser.userName || "Anonymous"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

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

      {/* Create Post Modal */}
      <Modal
        visible={showCreatePost}
        animationType="slide"
        onRequestClose={() => setShowCreatePost(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0F" }} edges={["top", "bottom"]}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(126, 63, 228, 0.2)",
            }}
          >
            <TouchableOpacity onPress={() => setShowCreatePost(false)}>
              <X size={24} color="white" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
              Create Post
            </Text>
            <TouchableOpacity
              onPress={handleCreatePost}
              disabled={createPostMutation.isPending}
            >
              {createPostMutation.isPending ? (
                <ActivityIndicator size="small" color="#7E3FE4" />
              ) : (
                <Text style={{ color: "#7E3FE4", fontWeight: "600" }}>Post</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            {/* Privacy Selector */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: "white", fontSize: 14, marginBottom: 8 }}>
                Privacy
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {(["PUBLIC", "FRIENDS", "GROUPS"] as const).map((privacy) => (
                  <TouchableOpacity
                    key={privacy}
                    onPress={() => setPostPrivacy(privacy)}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 12,
                      borderRadius: 8,
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
                        color: postPrivacy === privacy ? "white" : "#888",
                        marginLeft: 6,
                        fontSize: 12,
                      }}
                    >
                      {privacy}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Content Input */}
            <TextInput
              value={postContent}
              onChangeText={setPostContent}
              placeholder="What's on your mind?"
              placeholderTextColor="#666"
              multiline
              style={{
                color: "white",
                fontSize: 16,
                minHeight: 120,
                textAlignVertical: "top",
              }}
            />

            {/* Selected Images */}
            {selectedImages.length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                {selectedImages.map((uri, index) => (
                  <View key={index} style={{ position: "relative" }}>
                    <Image
                      source={{ uri }}
                      style={{ width: 100, height: 100, borderRadius: 8 }}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setSelectedImages(selectedImages.filter((_, i) => i !== index))
                      }
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
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
            )}

            {/* Add Images Button */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                onPress={handlePickImage}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 16,
                  borderRadius: 8,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.2)",
                }}
              >
                <ImageIcon size={20} color="#7E3FE4" />
                <Text style={{ color: "white", marginLeft: 12 }}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleTakePhoto}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 16,
                  borderRadius: 8,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.2)",
                }}
              >
                <Camera size={20} color="#7E3FE4" />
                <Text style={{ color: "white", marginLeft: 12 }}>Camera</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Create Moment Modal */}
      <Modal
        visible={showCreateMoment}
        animationType="slide"
        onRequestClose={() => setShowCreateMoment(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0F" }} edges={["top", "bottom"]}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(126, 63, 228, 0.2)",
            }}
          >
            <TouchableOpacity onPress={() => setShowCreateMoment(false)}>
              <X size={24} color="white" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
              Create Moment
            </Text>
            <TouchableOpacity
              onPress={handleCreateMoment}
              disabled={createMomentMutation.isPending}
            >
              {createMomentMutation.isPending ? (
                <ActivityIndicator size="small" color="#7E3FE4" />
              ) : (
                <Text style={{ color: "#7E3FE4", fontWeight: "600" }}>Share</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
            {momentImage ? (
              <>
                <Image
                  source={{ uri: momentImage }}
                  style={{ width: "100%", height: "70%", borderRadius: 12 }}
                  resizeMode="contain"
                />
                <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
                  <TouchableOpacity
                    onPress={handlePickMomentImage}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      borderRadius: 8,
                      backgroundColor: "rgba(126, 63, 228, 0.2)",
                      borderWidth: 1,
                      borderColor: "#7E3FE4",
                    }}
                  >
                    <Text style={{ color: "#7E3FE4", fontWeight: "600" }}>Change Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setMomentImage(null)}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      borderRadius: 8,
                      backgroundColor: "rgba(255, 59, 48, 0.2)",
                      borderWidth: 1,
                      borderColor: "#FF3B30",
                    }}
                  >
                    <Text style={{ color: "#FF3B30", fontWeight: "600" }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 100,
                    backgroundColor: "rgba(126, 63, 228, 0.2)",
                    borderWidth: 2,
                    borderColor: "#7E3FE4",
                    borderStyle: "dashed",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                  }}
                >
                  <ImageIcon size={48} color="#7E3FE4" />
                  <Text style={{ color: "white", marginTop: 12, fontSize: 16 }}>
                    Add Photo
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    onPress={handlePickMomentImage}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      borderRadius: 8,
                      backgroundColor: "rgba(126, 63, 228, 0.2)",
                      borderWidth: 1,
                      borderColor: "#7E3FE4",
                    }}
                  >
                    <ImageIcon size={20} color="#7E3FE4" />
                    <Text style={{ color: "white", marginLeft: 8, fontWeight: "600" }}>
                      Gallery
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleTakeMomentPhoto}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      borderRadius: 8,
                      backgroundColor: "rgba(126, 63, 228, 0.2)",
                      borderWidth: 1,
                      borderColor: "#7E3FE4",
                    }}
                  >
                    <Camera size={20} color="#7E3FE4" />
                    <Text style={{ color: "white", marginLeft: 8, fontWeight: "600" }}>
                      Camera
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Moment Viewer Modal */}
      {selectedMoment && (
        <Modal
          visible={!!selectedMoment}
          animationType="fade"
          onRequestClose={() => setSelectedMoment(null)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: "black" }} edges={["top", "bottom"]}>
            <TouchableOpacity
              onPress={() => setSelectedMoment(null)}
              style={{ position: "absolute", top: 50, right: 20, zIndex: 10 }}
            >
              <X size={32} color="white" />
            </TouchableOpacity>

            {selectedMoment.moments[momentIndex]?.imageUrl && (
              <Image
                source={{ uri: selectedMoment.moments[momentIndex].imageUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            )}

            <View
              style={{
                position: "absolute",
                bottom: 40,
                left: 20,
                right: 20,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              {momentIndex > 0 && (
                <TouchableOpacity
                  onPress={() => setMomentIndex(momentIndex - 1)}
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 20,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>Previous</Text>
                </TouchableOpacity>
              )}

              {momentIndex < selectedMoment.moments.length - 1 && (
                <TouchableOpacity
                  onPress={() => setMomentIndex(momentIndex + 1)}
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 20,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>Next</Text>
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
}
