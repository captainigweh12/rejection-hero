import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  Users,
  Settings,
  UserPlus,
  Video,
  Target,
  Mail,
  Crown,
  Shield,
  X,
  LogOut,
  Trash2,
  Camera,
  Sparkles,
  Upload,
  Search,
  MessageSquare,
  Image as ImageIcon,
  Plus,
} from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { api, BACKEND_URL } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import PostCard from "@/components/PostCard";
import CreateStoryModal from "@/components/CreateStoryModal";

type Props = RootStackScreenProps<"GroupDetail">;

interface GroupMember {
  id: string;
  userId: string;
  displayName: string;
  avatar: string | null;
  role: "ADMIN" | "MODERATOR" | "MEMBER";
  joinedAt: string;
}

interface GroupDetail {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  isPublic: boolean;
  createdById: string;
  createdAt: string;
  members: GroupMember[];
  memberCount: number;
  userRole?: "ADMIN" | "MODERATOR" | "MEMBER";
}

export default function GroupDetailScreen({ navigation, route }: Props) {
  const { groupId } = route.params;
  const { data: sessionData } = useSession();
  const queryClient = useQueryClient();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showInviteUserModal, setShowInviteUserModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "stories" | "members">("posts");
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postImages, setPostImages] = useState<string[]>([]);

  // Fetch group details
  const { data: groupData, isLoading } = useQuery({
    queryKey: ["group-detail", groupId],
    queryFn: async () => {
      return api.get<{ group: GroupDetail }>(`/api/groups/${groupId}`);
    },
    enabled: !!sessionData?.user && !!groupId,
  });

  // Leave group mutation
  const leaveGroupMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/api/groups/${groupId}/leave`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      navigation.goBack();
      Alert.alert("Success", "You have left the group");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to leave group");
    },
  });

  // Delete group mutation (admin only)
  const deleteGroupMutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/api/groups/${groupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      navigation.goBack();
      Alert.alert("Success", "Group deleted successfully");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to delete group");
    },
  });

  // Invite to group mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; message: string }) => {
      return api.post(`/api/groups/${groupId}/invite`, data);
    },
    onSuccess: () => {
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteMessage("");
      queryClient.invalidateQueries({ queryKey: ["group-detail", groupId] });
      Alert.alert("Success", "Invitation sent successfully!");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to send invitation");
    },
  });

  // Invite in-app user mutation
  const inviteUserMutation = useMutation({
    mutationFn: async (data: { userId: string; message?: string }) => {
      return api.post(`/api/groups/${groupId}/invite-user`, data);
    },
    onSuccess: () => {
      setShowInviteUserModal(false);
      setSearchQuery("");
      setSearchResults([]);
      queryClient.invalidateQueries({ queryKey: ["group-detail", groupId] });
      Alert.alert("Success", "User invited to group!");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to invite user");
    },
  });

  // Update group avatar mutation
  const updateAvatarMutation = useMutation({
    mutationFn: async (coverImage: string) => {
      return api.patch(`/api/groups/${groupId}/avatar`, { coverImage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-detail", groupId] });
      Alert.alert("Success", "Group picture updated!");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to update picture");
    },
  });

  // Fetch group posts
  const { data: groupPostsData, refetch: refetchPosts } = useQuery({
    queryKey: ["group-posts", groupId],
    queryFn: async () => {
      return api.get<{ posts: any[] }>(`/api/groups/${groupId}/posts`);
    },
    enabled: !!sessionData?.user && !!groupId && activeTab === "posts",
  });

  // Fetch group moments/stories
  const { data: groupMomentsData, refetch: refetchMoments } = useQuery({
    queryKey: ["group-moments", groupId],
    queryFn: async () => {
      return api.get<{ moments: any[] }>(`/api/groups/${groupId}/moments`);
    },
    enabled: !!sessionData?.user && !!groupId && activeTab === "stories",
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; imageUrls?: string[] }) => {
      return api.post("/api/posts", {
        content: data.content,
        privacy: "GROUPS",
        groupId: groupId,
        imageUrls: data.imageUrls,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-posts", groupId] });
      setShowCreatePost(false);
      setPostContent("");
      setPostImages([]);
      Alert.alert("Success", "Post created successfully!");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to create post");
    },
  });

  // Create story/moment mutation
  const createStoryMutation = useMutation({
    mutationFn: async (data: { imageUrl: string; content?: string }) => {
      // Upload image first
      const formData = new FormData();
      const filename = data.imageUrl.split("/").pop() || "story.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("image", {
        uri: data.imageUrl,
        name: filename,
        type,
      } as any);

      const uploadResponse = await fetch(`${BACKEND_URL}/api/upload/image`, {
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
      const serverImageUrl = `${BACKEND_URL}${uploadData.url}`;

      // Create moment with groupId
      return api.post("/api/moments", {
        imageUrl: serverImageUrl,
        content: data.content,
        groupId: groupId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-moments", groupId] });
      setShowCreateStory(false);
      Alert.alert("Success", "Story posted!");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to create story");
    },
  });

  const handleCreateStory = async (imageUrl: string, text?: string) => {
    createStoryMutation.mutate({ imageUrl, content: text });
  };

  const group = groupData?.group;
  const isAdmin = group?.userRole === "ADMIN";
  const isModerator = group?.userRole === "MODERATOR" || isAdmin;

  const handleLeaveGroup = () => {
    Alert.alert(
      "Leave Group",
      `Are you sure you want to leave "${group?.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => leaveGroupMutation.mutate(),
        },
      ]
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      "Delete Group",
      `Are you sure you want to permanently delete "${group?.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteGroupMutation.mutate(),
        },
      ]
    );
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      Alert.alert("Error", "Please enter an email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    inviteMutation.mutate({
      email: inviteEmail.trim(),
      message: inviteMessage.trim(),
    });
  };

  // Search users for in-app invite
  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await api.get<{ users: any[] }>(
        `/api/friends/search?query=${encodeURIComponent(searchQuery)}`
      );
      // Filter out users who are already members
      const memberIds = new Set(group?.members.map((m) => m.userId) || []);
      setSearchResults((results.users || []).filter((u) => !memberIds.has(u.id)));
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  // Upload group avatar
  const handleUploadGroupAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant camera roll permissions.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [ImagePicker.MediaType.Image],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const imageUri = result.assets[0].uri;
      setShowAvatarModal(false);

      // Upload image
      const formData = new FormData();
      const filename = imageUri.split("/").pop() || "avatar.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("image", {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const uploadResponse = await fetch(`${BACKEND_URL}/api/upload/image`, {
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
      const serverImageUrl = `${BACKEND_URL}${uploadData.url}`;

      updateAvatarMutation.mutate(serverImageUrl);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      Alert.alert("Error", "Failed to upload picture. Please try again.");
    }
  };

  // Generate AI group avatar
  const handleGenerateGroupAvatar = async () => {
    setShowAvatarModal(false);
    try {
      const response = await api.post<{ success: boolean; avatarUrl: string; message: string }>(
        "/api/groups/generate-avatar",
        {
          groupName: group?.name || "Group",
          style: "gaming",
        }
      );

      if (response.success && response.avatarUrl) {
        const serverImageUrl = response.avatarUrl.startsWith("http")
          ? response.avatarUrl
          : `${BACKEND_URL}${response.avatarUrl}`;
        updateAvatarMutation.mutate(serverImageUrl);
      } else {
        Alert.alert("Error", response.message || "Failed to generate avatar");
      }
    } catch (error: any) {
      console.error("Error generating avatar:", error);
      Alert.alert("Error", error.message || "Failed to generate avatar. Please try again.");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Crown size={16} color="#FFD700" />;
      case "MODERATOR":
        return <Shield size={16} color="#00D9FF" />;
      default:
        return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "#FFD700";
      case "MODERATOR":
        return "#00D9FF";
      default:
        return "#7E3FE4";
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0F", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#7E3FE4" />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0F", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "white", fontSize: 16 }}>Group not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <Pressable onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="white" />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "white" }}>Group Details</Text>
          {/* Invite Button - Small Icon */}
          {isModerator && (
            <Pressable
              onPress={() => setShowInviteModal(true)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "rgba(126, 63, 228, 0.2)",
                borderWidth: 1,
                borderColor: "#7E3FE4",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserPlus size={18} color="#7E3FE4" />
            </Pressable>
          )}
          {!isModerator && <View style={{ width: 32 }} />}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Cover Image / Avatar */}
          <View style={{ position: "relative" }}>
            {group.coverImage ? (
              <Image
                source={{ uri: group.coverImage }}
                style={{ width: "100%", height: 200 }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: "100%",
                  height: 200,
                  backgroundColor: "rgba(126, 63, 228, 0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Users size={64} color="#7E3FE4" />
              </View>
            )}
            {/* Edit Avatar Button (Admin Only) */}
            {isAdmin && (
              <Pressable
                onPress={() => setShowAvatarModal(true)}
                style={{
                  position: "absolute",
                  bottom: 16,
                  right: 16,
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  borderRadius: 24,
                  padding: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Camera size={18} color="white" />
                <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>Edit Picture</Text>
              </Pressable>
            )}
          </View>

          {/* Group Info */}
          <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 28, fontWeight: "bold", color: "white", marginBottom: 8 }}>
              {group.name}
            </Text>
            {group.description && (
              <Text style={{ fontSize: 16, color: "rgba(255, 255, 255, 0.7)", marginBottom: 16, lineHeight: 24 }}>
                {group.description}
              </Text>
            )}

            {/* Group Stats */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Users size={18} color="#7E3FE4" />
                <Text style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 15 }}>
                  {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: group.isPublic ? "rgba(0, 217, 255, 0.2)" : "rgba(255, 107, 53, 0.2)",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    color: group.isPublic ? "#00D9FF" : "#FF6B35",
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  {group.isPublic ? "Public" : "Private"}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 12, marginBottom: 32 }}>
              {/* Invite Members Buttons */}
              {isModerator && (
                <>
                  <Pressable
                    onPress={() => setShowInviteUserModal(true)}
                    style={{
                      backgroundColor: "rgba(126, 63, 228, 0.2)",
                      borderRadius: 16,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      borderWidth: 1,
                      borderColor: "#7E3FE4",
                    }}
                  >
                    <UserPlus size={20} color="#7E3FE4" />
                    <Text style={{ color: "#7E3FE4", fontSize: 16, fontWeight: "700" }}>
                      Invite App Users
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setShowInviteModal(true)}
                    style={{
                      backgroundColor: "rgba(0, 217, 255, 0.2)",
                      borderRadius: 16,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      borderWidth: 1,
                      borderColor: "#00D9FF",
                    }}
                  >
                    <Mail size={20} color="#00D9FF" />
                    <Text style={{ color: "#00D9FF", fontSize: 16, fontWeight: "700" }}>
                      Invite by Email
                    </Text>
                  </Pressable>
                </>
              )}

              {/* Group Live Button */}
              <Pressable
                onPress={() => {
                  navigation.navigate("GroupLive", {
                    groupId: group.id,
                    groupName: group.name
                  });
                }}
                style={{
                  backgroundColor: "rgba(255, 107, 53, 0.2)",
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  borderWidth: 1,
                  borderColor: "#FF6B35",
                }}
              >
                <Video size={20} color="#FF6B35" />
                <Text style={{ color: "#FF6B35", fontSize: 16, fontWeight: "700" }}>
                  Group Live
                </Text>
              </Pressable>

              {/* Group Quests Button */}
              <Pressable
                onPress={() => {
                  navigation.navigate("GroupQuests", {
                    groupId: group.id,
                    groupName: group.name
                  });
                }}
                style={{
                  backgroundColor: "rgba(0, 217, 255, 0.2)",
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  borderWidth: 1,
                  borderColor: "#00D9FF",
                }}
              >
                <Target size={20} color="#00D9FF" />
                <Text style={{ color: "#00D9FF", fontSize: 16, fontWeight: "700" }}>
                  Group Quests
                </Text>
              </Pressable>
            </View>

            {/* Tabs */}
            <View
              style={{
                flexDirection: "row",
                marginBottom: 20,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 12,
                padding: 4,
              }}
            >
              <Pressable
                onPress={() => setActiveTab("posts")}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: activeTab === "posts" ? "#7E3FE4" : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: activeTab === "posts" ? "white" : "rgba(255, 255, 255, 0.6)",
                    fontWeight: "700",
                  }}
                >
                  Posts
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab("stories")}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: activeTab === "stories" ? "#7E3FE4" : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: activeTab === "stories" ? "white" : "rgba(255, 255, 255, 0.6)",
                    fontWeight: "700",
                  }}
                >
                  Stories
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab("members")}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: activeTab === "members" ? "#7E3FE4" : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: activeTab === "members" ? "white" : "rgba(255, 255, 255, 0.6)",
                    fontWeight: "700",
                  }}
                >
                  Members
                </Text>
              </Pressable>
            </View>

            {/* Posts Tab */}
            {activeTab === "posts" && (
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>Group Posts</Text>
                  <Pressable
                    onPress={() => setShowCreatePost(true)}
                    style={{
                      backgroundColor: "#7E3FE4",
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Plus size={16} color="white" />
                    <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>Post</Text>
                  </Pressable>
                </View>
                {groupPostsData?.posts && groupPostsData.posts.length > 0 ? (
                  <FlatList
                    data={groupPostsData.posts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <PostCard post={item} currentUserId={sessionData?.user?.id || ""} />
                    )}
                    scrollEnabled={false}
                  />
                ) : (
                  <View style={{ padding: 40, alignItems: "center" }}>
                    <MessageSquare size={48} color="rgba(255, 255, 255, 0.3)" />
                    <Text style={{ color: "rgba(255, 255, 255, 0.6)", marginTop: 16, fontSize: 16 }}>
                      No posts yet. Be the first to post!
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Stories Tab */}
            {activeTab === "stories" && (
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>Group Stories</Text>
                  <Pressable
                    onPress={() => setShowCreateStory(true)}
                    style={{
                      backgroundColor: "#7E3FE4",
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Plus size={16} color="white" />
                    <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>Story</Text>
                  </Pressable>
                </View>
                {groupMomentsData?.moments && groupMomentsData.moments.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                    {groupMomentsData.moments.map((momentUser) => (
                      <Pressable
                        key={momentUser.userId}
                        style={{
                          alignItems: "center",
                          marginRight: 16,
                        }}
                      >
                        <View
                          style={{
                            width: 70,
                            height: 70,
                            borderRadius: 35,
                            borderWidth: 2,
                            borderColor: "#7E3FE4",
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
                                backgroundColor: "#7E3FE4",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
                                {momentUser.userName?.charAt(0).toUpperCase() || "?"}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={{
                            color: "white",
                            fontSize: 12,
                            maxWidth: 70,
                            textAlign: "center",
                          }}
                          numberOfLines={1}
                        >
                          {momentUser.userName || "Member"}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={{ padding: 40, alignItems: "center" }}>
                    <ImageIcon size={48} color="rgba(255, 255, 255, 0.3)" />
                    <Text style={{ color: "rgba(255, 255, 255, 0.6)", marginTop: 16, fontSize: 16 }}>
                      No stories yet. Share your first story!
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Members Section */}
            {activeTab === "members" && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: "bold", color: "white", marginBottom: 16 }}>
                  Members ({group.members.length})
                </Text>
                {group.members.map((member) => (
                <View
                  key={member.id}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "rgba(126, 63, 228, 0.3)",
                  }}
                >
                  {/* Avatar */}
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: "#7E3FE4" + "20",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    {member.avatar ? (
                      <Image
                        source={{ uri: member.avatar }}
                        style={{ width: 48, height: 48, borderRadius: 24 }}
                      />
                    ) : (
                      <Text style={{ fontSize: 20, fontWeight: "bold", color: "#7E3FE4" }}>
                        {member.displayName.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>

                  {/* Member Info */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: "white" }}>
                        {member.displayName}
                      </Text>
                      {getRoleIcon(member.role)}
                    </View>
                    <Text style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </Text>
                  </View>

                  {/* Role Badge */}
                  <View
                    style={{
                      backgroundColor: getRoleColor(member.role) + "30",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: getRoleColor(member.role),
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {member.role}
                    </Text>
                  </View>
                </View>
              ))}
              </View>
            )}

            {/* Danger Zone */}
            <View style={{ marginTop: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#FF3B30", marginBottom: 12 }}>
                Danger Zone
              </Text>

              {/* Leave Group Button */}
              {!isAdmin && (
                <Pressable
                  onPress={handleLeaveGroup}
                  disabled={leaveGroupMutation.isPending}
                  style={{
                    backgroundColor: "rgba(255, 59, 48, 0.1)",
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    borderWidth: 1,
                    borderColor: "#FF3B30",
                    marginBottom: 12,
                    opacity: leaveGroupMutation.isPending ? 0.5 : 1,
                  }}
                >
                  {leaveGroupMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FF3B30" />
                  ) : (
                    <>
                      <LogOut size={20} color="#FF3B30" />
                      <Text style={{ color: "#FF3B30", fontSize: 16, fontWeight: "700" }}>
                        Leave Group
                      </Text>
                    </>
                  )}
                </Pressable>
              )}

              {/* Delete Group Button (Admin Only) */}
              {isAdmin && (
                <Pressable
                  onPress={handleDeleteGroup}
                  disabled={deleteGroupMutation.isPending}
                  style={{
                    backgroundColor: "rgba(255, 59, 48, 0.1)",
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    borderWidth: 1,
                    borderColor: "#FF3B30",
                    opacity: deleteGroupMutation.isPending ? 0.5 : 1,
                  }}
                >
                  {deleteGroupMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FF3B30" />
                  ) : (
                    <>
                      <Trash2 size={20} color="#FF3B30" />
                      <Text style={{ color: "#FF3B30", fontSize: 16, fontWeight: "700" }}>
                        Delete Group
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInviteModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
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
              onPress={() => setShowInviteModal(false)}
            />
            <View
              style={{
                backgroundColor: "#1A1A24",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingTop: 20,
                paddingBottom: 40,
                paddingHorizontal: 20,
                maxHeight: "70%",
              }}
            >
              {/* Header */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>Invite to Group</Text>
                <Pressable
                  onPress={() => setShowInviteModal(false)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={20} color="white" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Email Input */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "rgba(255, 255, 255, 0.8)", marginBottom: 8 }}>
                    Email Address *
                  </Text>
                  <TextInput
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    placeholder="Enter email address"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 12,
                      padding: 16,
                      color: "white",
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: "rgba(126, 63, 228, 0.3)",
                    }}
                  />
                </View>

                {/* Message Input */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "rgba(255, 255, 255, 0.8)", marginBottom: 8 }}>
                    Personal Message (Optional)
                  </Text>
                  <TextInput
                    value={inviteMessage}
                    onChangeText={setInviteMessage}
                    placeholder="Add a personal message..."
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 12,
                      padding: 16,
                      color: "white",
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: "rgba(126, 63, 228, 0.3)",
                      minHeight: 100,
                    }}
                    maxLength={300}
                  />
                </View>

                {/* Send Invite Button */}
                <Pressable
                  onPress={handleInvite}
                  disabled={inviteMutation.isPending || !inviteEmail.trim()}
                  style={{
                    backgroundColor: !inviteEmail.trim() ? "rgba(126, 63, 228, 0.3)" : "#7E3FE4",
                    paddingVertical: 16,
                    borderRadius: 24,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 10,
                    opacity: inviteMutation.isPending ? 0.7 : 1,
                    shadowColor: "#7E3FE4",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                >
                  {inviteMutation.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Mail size={20} color="white" />
                      <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>Send Invitation</Text>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Invite User Modal */}
      <Modal
        visible={showInviteUserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInviteUserModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
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
              onPress={() => setShowInviteUserModal(false)}
            />
            <View
              style={{
                backgroundColor: "#1A1A24",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingTop: 20,
                paddingBottom: 40,
                paddingHorizontal: 20,
                maxHeight: "80%",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>Invite App User</Text>
                <Pressable
                  onPress={() => setShowInviteUserModal(false)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={20} color="white" />
                </Pressable>
              </View>

              <View style={{ marginBottom: 16 }}>
                <TextInput
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    handleSearchUsers();
                  }}
                  placeholder="Search users by name or email..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 12,
                    padding: 16,
                    color: "white",
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: "rgba(126, 63, 228, 0.3)",
                  }}
                />
              </View>

              <ScrollView style={{ maxHeight: 400 }}>
                {searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <Pressable
                      key={user.id}
                      onPress={() => {
                        inviteUserMutation.mutate({ userId: user.id });
                      }}
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: "rgba(126, 63, 228, 0.3)",
                      }}
                    >
                      {user.avatar ? (
                        <Image source={{ uri: user.avatar }} style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }} />
                      ) : (
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#7E3FE4", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                          <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
                            {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "?"}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                          {user.name || user.email?.split("@")[0] || "User"}
                        </Text>
                        {user.email && <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14 }}>{user.email}</Text>}
                      </View>
                      <UserPlus size={20} color="#7E3FE4" />
                    </Pressable>
                  ))
                ) : (
                  <View style={{ padding: 40, alignItems: "center" }}>
                    <Search size={48} color="rgba(255, 255, 255, 0.3)" />
                    <Text style={{ color: "rgba(255, 255, 255, 0.6)", marginTop: 16, fontSize: 16 }}>
                      {searchQuery.trim() ? "No users found" : "Search for users to invite"}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Avatar Modal */}
      <Modal
        visible={showAvatarModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#1A1A24",
              borderRadius: 24,
              padding: 24,
              width: "85%",
              maxWidth: 400,
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "white", marginBottom: 20, textAlign: "center" }}>
              Choose Group Picture
            </Text>

            <Pressable
              onPress={handleUploadGroupAvatar}
              style={{
                backgroundColor: "rgba(126, 63, 228, 0.2)",
                borderRadius: 16,
                padding: 20,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                borderWidth: 1,
                borderColor: "#7E3FE4",
              }}
            >
              <Upload size={24} color="#7E3FE4" />
              <Text style={{ color: "#7E3FE4", fontSize: 16, fontWeight: "700" }}>Upload Photo</Text>
            </Pressable>

            <Pressable
              onPress={handleGenerateGroupAvatar}
              style={{
                backgroundColor: "rgba(0, 217, 255, 0.2)",
                borderRadius: 16,
                padding: 20,
                marginBottom: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                borderWidth: 1,
                borderColor: "#00D9FF",
              }}
            >
              <Sparkles size={24} color="#00D9FF" />
              <Text style={{ color: "#00D9FF", fontSize: 16, fontWeight: "700" }}>Generate with AI</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowAvatarModal(false)}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: 16,
                padding: 16,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Create Post Modal */}
      <Modal
        visible={showCreatePost}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreatePost(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
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
              onPress={() => setShowCreatePost(false)}
            />
            <View
              style={{
                backgroundColor: "#1A1A24",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingTop: 20,
                paddingBottom: 40,
                paddingHorizontal: 20,
                maxHeight: "80%",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>Create Post</Text>
                <Pressable
                  onPress={() => setShowCreatePost(false)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={20} color="white" />
                </Pressable>
              </View>

              <TextInput
                value={postContent}
                onChangeText={setPostContent}
                placeholder="What's on your mind?"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 12,
                  padding: 16,
                  color: "white",
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.3)",
                  minHeight: 150,
                  marginBottom: 20,
                }}
                maxLength={1000}
              />

              <Pressable
                onPress={() => {
                  if (!postContent.trim()) {
                    Alert.alert("Error", "Please enter some content");
                    return;
                  }
                  createPostMutation.mutate({ content: postContent.trim(), imageUrls: postImages });
                }}
                disabled={createPostMutation.isPending || !postContent.trim()}
                style={{
                  backgroundColor: !postContent.trim() ? "rgba(126, 63, 228, 0.3)" : "#7E3FE4",
                  paddingVertical: 16,
                  borderRadius: 24,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                  opacity: createPostMutation.isPending ? 0.5 : 1,
                }}
              >
                {createPostMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <MessageSquare size={20} color="white" />
                    <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>Post</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Create Story Modal */}
      <CreateStoryModal
        visible={showCreateStory}
        onClose={() => setShowCreateStory(false)}
        onCreateStory={handleCreateStory}
        isLoading={createStoryMutation.isPending}
      />
    </View>
  );
}
