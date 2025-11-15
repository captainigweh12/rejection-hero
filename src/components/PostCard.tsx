import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, TextInput, Alert } from "react-native";
import { Heart, MessageCircle, Send, MoreVertical } from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

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
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

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

  return (
    <View
      style={{
        backgroundColor: "#1C1C1E",
        marginBottom: 12,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          {/* Avatar */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#7E3FE4",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            {post.user.avatar ? (
              <Image
                source={{ uri: post.user.avatar }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
              />
            ) : (
              <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
                {post.user.name?.charAt(0).toUpperCase() || "?"}
              </Text>
            )}
          </View>

          {/* User info */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
              {post.user.name || "Anonymous"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: "#888", fontSize: 12 }}>
                {timeAgo(post.createdAt)}
              </Text>
              {post.group && (
                <>
                  <Text style={{ color: "#888", fontSize: 12, marginHorizontal: 4 }}>
                    •
                  </Text>
                  <Text style={{ color: "#7E3FE4", fontSize: 12 }}>
                    {post.group.name}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* More options */}
        {post.user.id === currentUserId && (
          <TouchableOpacity onPress={handleDelete}>
            <MoreVertical size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
        <Text style={{ color: "white", fontSize: 15, lineHeight: 20 }}>
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

      {/* Actions */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderTopWidth: 1,
          borderTopColor: "#2C2C2E",
        }}
      >
        {/* Like */}
        <TouchableOpacity
          onPress={handleLike}
          style={{ flexDirection: "row", alignItems: "center", marginRight: 20 }}
        >
          <Heart
            size={20}
            color={post.isLikedByCurrentUser ? "#FF3B30" : "#888"}
            fill={post.isLikedByCurrentUser ? "#FF3B30" : "none"}
          />
          <Text
            style={{
              color: post.isLikedByCurrentUser ? "#FF3B30" : "#888",
              marginLeft: 6,
              fontSize: 14,
            }}
          >
            {post.likeCount}
          </Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity
          onPress={() => setShowComments(!showComments)}
          style={{ flexDirection: "row", alignItems: "center", marginRight: 20 }}
        >
          <MessageCircle size={20} color="#888" />
          <Text style={{ color: "#888", marginLeft: 6, fontSize: 14 }}>
            {post.commentCount}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Comments section */}
      {showComments && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
          {/* Comment list */}
          {post.comments.slice(0, 3).map((comment) => (
            <View
              key={comment.id}
              style={{
                flexDirection: "row",
                marginBottom: 8,
                backgroundColor: "#2C2C2E",
                borderRadius: 8,
                padding: 8,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "#7E3FE4",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                }}
              >
                <Text style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>
                  {comment.user.name?.charAt(0).toUpperCase() || "?"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
                  {comment.user.name || "Anonymous"}
                </Text>
                <Text style={{ color: "#CCC", fontSize: 14 }}>{comment.content}</Text>
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
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write a comment..."
              placeholderTextColor="#666"
              style={{
                flex: 1,
                backgroundColor: "#2C2C2E",
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                color: "white",
                marginRight: 8,
              }}
            />
            <TouchableOpacity
              onPress={handleComment}
              disabled={!commentText.trim() || commentMutation.isPending}
            >
              <Send size={20} color={commentText.trim() ? "#7E3FE4" : "#666"} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
