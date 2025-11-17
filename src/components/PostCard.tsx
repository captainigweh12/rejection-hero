import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, TextInput, Alert, Modal, ActivityIndicator } from "react-native";
import { Heart, MessageCircle, Send, MoreVertical, Edit2, Trash2, Globe, Users, Lock, X } from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    privacy: string;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
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
    likeCount: number;
    commentCount: number;
    isLikedByCurrentUser: boolean;
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
  };
  currentUserId: string;
}

export default function PostCard({ post, currentUserId }: PostCardProps) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: () => api.post(`/api/posts/${post.id}/like`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts-feed"] });
    },
  });

  // Unlike mutation
  const unlikeMutation = useMutation({
    mutationFn: () => api.delete(`/api/posts/${post.id}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts-feed"] });
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/api/posts/${post.id}/comment`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts-feed"] });
      setCommentText("");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/posts/${post.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts-feed"] });
    },
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: (content: string) => api.put(`/api/posts/${post.id}`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts-feed"] });
      setShowEditModal(false);
      Alert.alert("Success", "Post updated successfully!");
    },
    onError: () => {
      Alert.alert("Error", "Failed to update post. Please try again.");
    },
  });

  const handleLike = () => {
    if (post.isLikedByCurrentUser) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText);
  };

  const handleEdit = () => {
    if (!editContent.trim()) {
      Alert.alert("Error", "Post content cannot be empty");
      return;
    }
    editMutation.mutate(editContent);
  };

  const handleDelete = () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate(),
      },
    ]);
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const privacyIcon = () => {
    switch (post.privacy) {
      case "PUBLIC":
        return <Globe size={13} color={colors.textTertiary} />;
      case "FRIENDS":
        return <Users size={13} color={colors.textTertiary} />;
      case "GROUPS":
        return <Lock size={13} color={colors.textTertiary} />;
      default:
        return <Globe size={13} color={colors.textTertiary} />;
    }
  };

  const privacyLabel = () => {
    switch (post.privacy) {
      case "PUBLIC":
        return "Public";
      case "FRIENDS":
        return "Friends";
      case "GROUPS":
        return "Groups";
      default:
        return "Public";
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.card,
        marginBottom: 16,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.cardBorder,
      }}
    >
      {/* Header - Facebook Style */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          {/* Avatar - Larger */}
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
              borderWidth: 2,
              borderColor: colors.cardBorder,
            }}
          >
            {post.user.avatar ? (
              <Image
                source={{ uri: post.user.avatar }}
                style={{ width: 48, height: 48, borderRadius: 24 }}
              />
            ) : (
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}>
                {post.user.name?.charAt(0).toUpperCase() || "?"}
              </Text>
            )}
          </View>

          {/* User info */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", marginBottom: 2 }}>
              {post.user.name || "Anonymous"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                {timeAgo(post.createdAt)}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>•</Text>
              {privacyIcon()}
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                {privacyLabel()}
              </Text>
              {post.group && (
                <>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>•</Text>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>
                    {post.group.name}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* More options */}
        {post.user.id === currentUserId && (
          <View>
            <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={{ padding: 4 }}>
              <MoreVertical size={22} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Dropdown Menu */}
            {showMenu && (
              <View
                style={{
                  position: "absolute",
                  right: 0,
                  top: 35,
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  paddingVertical: 8,
                  minWidth: 150,
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                  zIndex: 1000,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setShowMenu(false);
                    setShowEditModal(true);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    gap: 12,
                  }}
                >
                  <Edit2 size={18} color={colors.textSecondary} />
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600" }}>
                    Edit post
                  </Text>
                </TouchableOpacity>

                <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 12 }} />

                <TouchableOpacity
                  onPress={() => {
                    setShowMenu(false);
                    handleDelete();
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    gap: 12,
                  }}
                >
                  <Trash2 size={18} color={colors.error} />
                  <Text style={{ color: colors.error, fontSize: 15, fontWeight: "600" }}>
                    Delete post
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Content */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <Text style={{ color: colors.text, fontSize: 16, lineHeight: 24 }}>
          {post.content}
        </Text>
      </View>

      {/* Images */}
      {post.images.length > 0 && (
        <View>
          {post.images.length === 1 ? (
            <Image
              source={{ uri: post.images[0].imageUrl }}
              style={{ width: "100%", height: 300 }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {post.images.slice(0, 4).map((img, index) => (
                <Image
                  key={img.id}
                  source={{ uri: img.imageUrl }}
                  style={{
                    width: post.images.length === 2 ? "50%" : "50%",
                    height: 150,
                  }}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Like/Comment Stats - Facebook Style */}
      {(post.likeCount > 0 || post.commentCount > 0) && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          {post.likeCount > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: colors.error,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 6,
                }}
              >
                <Heart size={12} color={colors.text} fill={colors.text} />
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                {post.likeCount}
              </Text>
            </View>
          )}
          {post.commentCount > 0 && (
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
              {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
            </Text>
          )}
        </View>
      )}

      {/* Actions - Facebook Style */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        {/* Like */}
        <TouchableOpacity
          onPress={handleLike}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Heart
            size={22}
            color={post.isLikedByCurrentUser ? colors.error : colors.textSecondary}
            fill={post.isLikedByCurrentUser ? colors.error : "none"}
            strokeWidth={2}
          />
          <Text
            style={{
              color: post.isLikedByCurrentUser ? colors.error : colors.textSecondary,
              marginLeft: 8,
              fontSize: 15,
              fontWeight: "600",
            }}
          >
            Like
          </Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity
          onPress={() => setShowComments(!showComments)}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <MessageCircle size={22} color={colors.textSecondary} strokeWidth={2} />
          <Text style={{ color: colors.textSecondary, marginLeft: 8, fontSize: 15, fontWeight: "600" }}>
            Comment
          </Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Send size={22} color={colors.textSecondary} strokeWidth={2} />
          <Text style={{ color: colors.textSecondary, marginLeft: 8, fontSize: 15, fontWeight: "600" }}>
            Share
          </Text>
        </TouchableOpacity>
      </View>

      {/* Comments section - Facebook Style */}
      {showComments && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 }}>
          {/* Comment list */}
          {post.comments.slice(0, 3).map((comment) => (
            <View
              key={comment.id}
              style={{
                flexDirection: "row",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                {comment.user.avatar ? (
                  <Image
                    source={{ uri: comment.user.avatar }}
                    style={{ width: 32, height: 32, borderRadius: 16 }}
                  />
                ) : (
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: "bold" }}>
                    {comment.user.name?.charAt(0).toUpperCase() || "?"}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 18,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600", marginBottom: 2 }}>
                    {comment.user.name || "Anonymous"}
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 15, lineHeight: 20 }}>
                    {comment.content}
                  </Text>
                </View>
                <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 4, marginLeft: 14 }}>
                  {timeAgo(comment.createdAt)}
                </Text>
              </View>
            </View>
          ))}

          {/* Comment input */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 8,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: "bold" }}>
                You
              </Text>
            </View>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Write a comment..."
                placeholderTextColor={colors.textTertiary}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  color: colors.text,
                  fontSize: 15,
                  marginRight: 8,
                }}
              />
              <TouchableOpacity
                onPress={handleComment}
                disabled={!commentText.trim() || commentMutation.isPending}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: commentText.trim() ? colors.primary : colors.primaryLight,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Send size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Edit Post Modal */}
      <Modal
        visible={showEditModal}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
        transparent={true}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.modalOverlay,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.backgroundSolid,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              width: "100%",
              maxWidth: 500,
              maxHeight: "80%",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text }}>
                Edit post
              </Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={{ padding: 20 }}>
              <TextInput
                value={editContent}
                onChangeText={setEditContent}
                placeholder="What's on your mind?"
                placeholderTextColor={colors.textTertiary}
                multiline
                style={{
                  backgroundColor: colors.inputBackground,
                  borderRadius: 12,
                  padding: 16,
                  color: colors.text,
                  fontSize: 16,
                  minHeight: 150,
                  textAlignVertical: "top",
                  borderWidth: 1,
                  borderColor: colors.inputBorder,
                }}
                maxLength={5000}
              />

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleEdit}
                disabled={!editContent.trim() || editMutation.isPending}
                style={{
                  backgroundColor: editContent.trim() ? colors.primary : colors.primaryLight,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  marginTop: 16,
                  opacity: editMutation.isPending ? 0.7 : 1,
                }}
              >
                {editMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
                    Save changes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
