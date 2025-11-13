import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  Video,
  X,
  FlipHorizontal,
  Mic,
  MicOff,
  VideoIcon,
  VideoOff,
  Users,
  Send,
  Radio,
} from "lucide-react-native";
import type { BottomTabScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import type {
  GetActiveLiveStreamsResponse,
  StartLiveStreamResponse,
  GetUserQuestsResponse,
  GetLiveCommentsResponse,
  AddLiveCommentResponse,
} from "@/shared/contracts";

type Props = BottomTabScreenProps<"LiveTab">;

export default function LiveScreen({ navigation }: Props) {
  const { data: sessionData } = useSession();
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [viewingStreamId, setViewingStreamId] = useState<string | null>(null);
  const [facing, setFacing] = useState<"front" | "back">("front");
  const [permission, requestPermission] = useCameraPermissions();

  // Fetch active quests for the user to select from
  const { data: questsData } = useQuery<GetUserQuestsResponse>({
    queryKey: ["quests"],
    queryFn: async () => {
      return api.get<GetUserQuestsResponse>("/api/quests");
    },
    enabled: !!sessionData?.user,
  });

  // Fetch active live streams
  const { data: streamsData, refetch: refetchStreams } = useQuery<GetActiveLiveStreamsResponse>({
    queryKey: ["liveStreams"],
    queryFn: async () => {
      return api.get<GetActiveLiveStreamsResponse>("/api/live/active");
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch comments for current stream
  const { data: commentsData, refetch: refetchComments } = useQuery<GetLiveCommentsResponse>({
    queryKey: ["liveComments", currentStreamId],
    queryFn: async () => {
      return api.get<GetLiveCommentsResponse>(`/api/live/${currentStreamId}/comments`);
    },
    enabled: !!currentStreamId,
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Start live stream mutation
  const startStreamMutation = useMutation({
    mutationFn: async (userQuestId?: string) => {
      return api.post<StartLiveStreamResponse>("/api/live/start", {
        userQuestId,
      });
    },
    onSuccess: (data) => {
      setIsStreaming(true);
      setCurrentStreamId(data.liveStreamId);
      queryClient.invalidateQueries({ queryKey: ["liveStreams"] });
      Alert.alert("Live!", "You are now live streaming!");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to start live stream");
    },
  });

  // End live stream mutation
  const endStreamMutation = useMutation({
    mutationFn: async () => {
      if (!currentStreamId) return;
      return api.post(`/api/live/${currentStreamId}/end`, {});
    },
    onSuccess: () => {
      setIsStreaming(false);
      setCurrentStreamId(null);
      queryClient.invalidateQueries({ queryKey: ["liveStreams"] });
      Alert.alert("Stream Ended", "Your live stream has ended");
    },
  });

  // Send comment mutation
  const sendCommentMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!currentStreamId) return;
      return api.post<AddLiveCommentResponse>(`/api/live/${currentStreamId}/comment`, {
        message,
      });
    },
    onSuccess: () => {
      setCommentText("");
      refetchComments();
    },
  });

  const handleStartStream = () => {
    if (!sessionData?.user) {
      Alert.alert("Sign In Required", "Please sign in to start a live stream");
      navigation.navigate("LoginModalScreen");
      return;
    }

    // Show quest selection if there are active quests
    const activeQuests = questsData?.activeQuests || [];
    if (activeQuests.length > 0) {
      Alert.alert(
        "Select Quest",
        "Do you want to link an active quest to this stream?",
        [
          {
            text: "No Quest",
            onPress: () => startStreamMutation.mutate(undefined),
          },
          ...activeQuests.map((uq) => ({
            text: uq.quest.title.substring(0, 30),
            onPress: () => startStreamMutation.mutate(uq.id),
          })),
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    } else {
      startStreamMutation.mutate(undefined);
    }
  };

  const handleEndStream = () => {
    Alert.alert("End Stream", "Are you sure you want to end this live stream?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Stream",
        style: "destructive",
        onPress: () => endStreamMutation.mutate(),
      },
    ]);
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    sendCommentMutation.mutate(commentText);
  };

  const activeQuest = questsData?.activeQuests.find((uq) => uq.id === selectedQuestId);

  // Find the stream being viewed
  const viewingStream = streamsData?.streams.find((s) => s.id === viewingStreamId);

  // If viewing someone else's stream, show viewer interface
  if (viewingStreamId && viewingStream) {
    return (
      <View style={{ flex: 1, backgroundColor: "#1A1A1A" }}>
        {/* Camera View Placeholder */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#2A2A2A",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Video size={80} color="#666" />
          <Text style={{ color: "#666", marginTop: 16, fontSize: 16 }}>
            Viewing {viewingStream.user.name}&apos;s stream
          </Text>
          <Text style={{ color: "#999", marginTop: 8, fontSize: 12 }}>
            Daily.co integration ready
          </Text>
        </View>

        {/* LIVE Badge */}
        <View
          style={{
            position: "absolute",
            top: 60,
            left: 20,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FF0000",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
          }}
        >
          <Radio size={12} color="white" style={{ marginRight: 6 }} />
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>LIVE</Text>
        </View>

        {/* Close Button */}
        <Pressable
          onPress={() => setViewingStreamId(null)}
          style={{
            position: "absolute",
            top: 60,
            right: 20,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={24} color="white" />
        </Pressable>

        {/* Viewer Count */}
        <View
          style={{
            position: "absolute",
            top: 120,
            right: 20,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            gap: 6,
          }}
        >
          <Users size={16} color="white" />
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>
            {viewingStream.viewerCount}
          </Text>
        </View>

        {/* Quest Card Overlay */}
        {viewingStream.userQuest && (
          <View
            style={{
              position: "absolute",
              bottom: 120,
              left: 20,
              right: 20,
              backgroundColor: "white",
              borderRadius: 16,
              padding: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: "bold", color: "#666", marginBottom: 4 }}>Quest</Text>
                <Text style={{ fontSize: 16, fontWeight: "bold", color: "#000", marginBottom: 8 }}>
                  {viewingStream.userQuest.quest.title}
                </Text>
                <Text style={{ fontSize: 14, color: "#666", marginBottom: 12 }} numberOfLines={2}>
                  {viewingStream.userQuest.quest.description}
                </Text>
              </View>
              <Pressable
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#F0F0F0",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} color="#666" />
              </Pressable>
            </View>
          </View>
        )}

        {/* Comment Section */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 32,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Comment"
              placeholderTextColor="#999"
              style={{
                flex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: 24,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: "white",
                fontSize: 14,
              }}
            />
            <Pressable
              onPress={handleSendComment}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#FF6B35",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Send size={20} color="white" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  if (!sessionData?.user) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "rgba(255, 0, 0, 0.1)",
                borderWidth: 2,
                borderColor: "#FF0000",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <Video size={40} color="#FF0000" />
            </View>
            <Text style={{ color: "white", fontSize: 28, fontWeight: "bold", marginBottom: 16, textAlign: "center" }}>
              Go Live
            </Text>
            <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 16, textAlign: "center", marginBottom: 32 }}>
              Sign in to start streaming your quest journey or watch others go for their NOs!
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

  // If user is streaming, show streaming interface
  if (isStreaming && currentStreamId) {
    // Check camera permissions
    if (!permission) {
      return (
        <View style={{ flex: 1, backgroundColor: "#1A1A1A", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "white" }}>Loading camera...</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={{ flex: 1, backgroundColor: "#1A1A1A", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Video size={64} color="#FF6B35" style={{ marginBottom: 24 }} />
          <Text style={{ color: "white", fontSize: 20, fontWeight: "bold", marginBottom: 12, textAlign: "center" }}>
            Camera Permission Required
          </Text>
          <Text style={{ color: "#999", fontSize: 16, textAlign: "center", marginBottom: 32 }}>
            We need access to your camera to start the live stream
          </Text>
          <Pressable
            onPress={requestPermission}
            style={{
              backgroundColor: "#FF6B35",
              paddingHorizontal: 32,
              paddingVertical: 16,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Grant Permission</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, backgroundColor: "#1A1A1A" }}>
        {/* Camera View */}
        {!isVideoOff ? (
          <CameraView
            style={{ flex: 1 }}
            facing={facing}
          />
        ) : (
          <View
            style={{
              flex: 1,
              backgroundColor: "#2A2A2A",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <VideoOff size={80} color="#666" />
            <Text style={{ color: "#666", marginTop: 16, fontSize: 16 }}>
              Camera is off
            </Text>
          </View>
        )}

        {/* LIVE Badge */}
        <View
          style={{
            position: "absolute",
            top: 60,
            left: 20,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FF0000",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
          }}
        >
          <Radio size={12} color="white" style={{ marginRight: 6 }} />
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>LIVE</Text>
        </View>

        {/* Close Button */}
        <Pressable
          onPress={handleEndStream}
          style={{
            position: "absolute",
            top: 60,
            right: 20,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={24} color="white" />
        </Pressable>

        {/* Control Buttons */}
        <View
          style={{
            position: "absolute",
            top: 120,
            right: 20,
            gap: 16,
          }}
        >
          {/* Flip Camera */}
          <Pressable
            onPress={() => setFacing(facing === "front" ? "back" : "front")}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FlipHorizontal size={24} color="white" />
          </Pressable>

          {/* Mic Toggle */}
          <Pressable
            onPress={() => setIsMuted(!isMuted)}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: isMuted ? "rgba(255, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isMuted ? <MicOff size={24} color="white" /> : <Mic size={24} color="white" />}
          </Pressable>

          {/* Video Toggle */}
          <Pressable
            onPress={() => setIsVideoOff(!isVideoOff)}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: isVideoOff ? "rgba(255, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isVideoOff ? <VideoOff size={24} color="white" /> : <VideoIcon size={24} color="white" />}
          </Pressable>

          {/* Participants */}
          <Pressable
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "rgba(94, 114, 235, 0.8)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users size={24} color="white" />
          </Pressable>
        </View>

        {/* Quest Card Overlay */}
        {activeQuest && (
          <View
            style={{
              position: "absolute",
              bottom: 120,
              left: 20,
              right: 20,
              backgroundColor: "white",
              borderRadius: 16,
              padding: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: "bold", color: "#666", marginBottom: 4 }}>Quest</Text>
                <Text style={{ fontSize: 16, fontWeight: "bold", color: "#000", marginBottom: 8 }}>
                  {activeQuest.quest.title}
                </Text>
                <Text style={{ fontSize: 14, color: "#666", marginBottom: 12 }} numberOfLines={2}>
                  {activeQuest.quest.description}
                </Text>
                <Pressable
                  style={{
                    backgroundColor: "#FF6B35",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>See more</Text>
                </Pressable>
              </View>
              <Pressable
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#F0F0F0",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} color="#666" />
              </Pressable>
            </View>
          </View>
        )}

        {/* Comment Section */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 32,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Comment"
              placeholderTextColor="#999"
              style={{
                flex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: 24,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: "white",
                fontSize: 14,
              }}
            />
            <Pressable
              onPress={handleSendComment}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#FF6B35",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Send size={20} color="white" />
            </Pressable>
            <Pressable
              onPress={handleEndStream}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 24,
                backgroundColor: "#FF0000",
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>Flip</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // Default view - show active streams or start streaming button
  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={{ paddingTop: 16, paddingBottom: 12, paddingHorizontal: 24 }}>
          <Text style={{ color: "white", fontSize: 28, fontWeight: "bold" }}>Live</Text>
          <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 14, marginTop: 4 }}>
            Watch live streams or go live yourself
          </Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 96 }}>
          {/* Go Live Button */}
          <Pressable
            onPress={handleStartStream}
            style={{
              backgroundColor: "#FF0000",
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              shadowColor: "#FF0000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Radio size={24} color="white" />
            <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>Go Live</Text>
          </Pressable>

          {/* Active Streams */}
          <Text style={{ color: "white", fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
            Active Streams
          </Text>

          {streamsData?.streams && streamsData.streams.length > 0 ? (
            streamsData.streams.map((stream) => (
              <Pressable
                key={stream.id}
                onPress={() => setViewingStreamId(stream.id)}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
              >
                {/* Live Badge */}
                <View
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#FF0000",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                  }}
                >
                  <Radio size={10} color="white" style={{ marginRight: 4 }} />
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: 10 }}>LIVE</Text>
                </View>

                {/* Stream Info */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: "#FF6B35",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>
                      {stream.user.name?.[0] || "U"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
                      {stream.user.name || "Anonymous"}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <Users size={14} color="#999" />
                      <Text style={{ color: "#999", fontSize: 12 }}>{stream.viewerCount} watching</Text>
                    </View>
                  </View>
                </View>

                {/* Quest Info */}
                {stream.userQuest && (
                  <View
                    style={{
                      backgroundColor: "rgba(255, 107, 53, 0.1)",
                      borderRadius: 8,
                      padding: 12,
                      borderLeftWidth: 3,
                      borderLeftColor: "#FF6B35",
                    }}
                  >
                    <Text style={{ color: "#FF6B35", fontSize: 10, fontWeight: "bold", marginBottom: 4 }}>
                      {stream.userQuest.quest.category}
                    </Text>
                    <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
                      {stream.userQuest.quest.title}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))
          ) : (
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 16,
                padding: 32,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.1)",
              }}
            >
              <Video size={48} color="#666" />
              <Text style={{ color: "white", fontSize: 16, fontWeight: "600", marginTop: 16, marginBottom: 8 }}>
                No Live Streams
              </Text>
              <Text style={{ color: "#999", fontSize: 14, textAlign: "center" }}>
                Be the first to go live and share your quest journey!
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
