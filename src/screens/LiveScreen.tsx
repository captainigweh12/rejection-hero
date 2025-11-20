import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, Modal, FlatList, ActivityIndicator } from "react-native";
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
  Gift,
  CheckCircle,
  XCircle,
  Crown,
  MessageCircle,
  Sparkles,
  Plus,
  Share2,
} from "lucide-react-native";
import type { BottomTabScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import { useTheme } from "@/contexts/ThemeContext";
import { useParentalGuidance } from "@/contexts/ParentalGuidanceContext";
import type {
  GetActiveLiveStreamsResponse,
  StartLiveStreamResponse,
  GetUserQuestsResponse,
  GetLiveCommentsResponse,
  AddLiveCommentResponse,
  GetQuestSuggestionsResponse,
  SuggestQuestToStreamerResponse,
  RespondToSuggestionResponse,
} from "@/shared/contracts";

type Props = BottomTabScreenProps<"LiveTab">;

export default function LiveScreen({ navigation }: Props) {
  const { data: sessionData } = useSession();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { canAccessFeature, isEnforcingRestrictions } = useParentalGuidance();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [viewingStreamId, setViewingStreamId] = useState<string | null>(null);
  const [facing, setFacing] = useState<"front" | "back">("front");
  const [permission, requestPermission] = useCameraPermissions();
  const [showQuestCardOnStream, setShowQuestCardOnStream] = useState(false);
  const [showCreateQuestModal, setShowCreateQuestModal] = useState(false);
  const [newQuestPrompt, setNewQuestPrompt] = useState("");

  // Check if live streaming is disabled by parental guidance
  useEffect(() => {
    if (isEnforcingRestrictions && !canAccessFeature("liveStreamingDisabled")) {
      Alert.alert(
        "Streaming Disabled",
        "Live streaming is not allowed due to parental guidance settings.",
        [
          {
            text: "OK",
            onPress: () => {
              // Redirect to home or settings
              navigation.navigate("HomeTab" as any);
            },
          },
        ]
      );
    }
  }, [isEnforcingRestrictions, canAccessFeature, navigation]);

  // Chat and suggestions UI
  const [showChat, setShowChat] = useState(true);
  const [showQuestSuggestions, setShowQuestSuggestions] = useState(false);
  const [showSendQuestModal, setShowSendQuestModal] = useState(false);
  const [selectedSuggestQuestId, setSelectedSuggestQuestId] = useState<string | null>(null);
  const [boostAmount, setBoostAmount] = useState(0);
  const [questMessage, setQuestMessage] = useState("");

  // Fetch active quests for the user to select from
  const { data: questsData } = useQuery<GetUserQuestsResponse>({
    queryKey: ["quests"],
    queryFn: async () => {
      return api.get<GetUserQuestsResponse>("/api/quests");
    },
    enabled: !!sessionData?.user,
  });

  // Fetch user stats for token balance
  const { data: userStats } = useQuery<{ tokens: number; currentStreak: number; totalXP: number }>({
    queryKey: ["userStats"],
    queryFn: async () => {
      return api.get("/api/stats");
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
    queryKey: ["liveComments", viewingStreamId || currentStreamId],
    queryFn: async () => {
      const streamId = viewingStreamId || currentStreamId;
      return api.get<GetLiveCommentsResponse>(`/api/live/${streamId}/comments`);
    },
    enabled: !!(viewingStreamId || currentStreamId),
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Fetch quest suggestions (for streamers)
  const { data: suggestionsData, refetch: refetchSuggestions } = useQuery<GetQuestSuggestionsResponse>({
    queryKey: ["questSuggestions", currentStreamId],
    queryFn: async () => {
      return api.get<GetQuestSuggestionsResponse>(`/api/live/${currentStreamId}/quest-suggestions`);
    },
    enabled: !!currentStreamId && isStreaming && !!sessionData?.user,
    refetchInterval: 5000,
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
      // Don't show alert - let the UI update automatically
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
      const streamId = viewingStreamId || currentStreamId;
      if (!streamId) return;
      return api.post<AddLiveCommentResponse>(`/api/live/${streamId}/comment`, {
        message,
      });
    },
    onSuccess: () => {
      setCommentText("");
      refetchComments();
    },
  });

  // Suggest quest mutation
  const suggestQuestMutation = useMutation({
    mutationFn: async (data: { questId: string; boostAmount: number; message?: string }) => {
      if (!viewingStreamId) return;
      return api.post<SuggestQuestToStreamerResponse>(`/api/live/${viewingStreamId}/suggest-quest`, data);
    },
    onSuccess: (data) => {
      setShowSendQuestModal(false);
      setSelectedSuggestQuestId(null);
      setBoostAmount(0);
      setQuestMessage("");
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      Alert.alert("Quest Sent!", `Quest suggestion sent! New diamond balance: ${data?.newDiamondBalance || 0}`);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to send quest");
    },
  });

  // Respond to suggestion mutation
  const respondToSuggestionMutation = useMutation({
    mutationFn: async (data: { suggestionId: string; action: "accept" | "decline" }) => {
      if (!currentStreamId) return;
      return api.post<RespondToSuggestionResponse>(`/api/live/${currentStreamId}/respond-to-suggestion`, data);
    },
    onSuccess: (data, variables) => {
      refetchSuggestions();
      queryClient.invalidateQueries({ queryKey: ["quests"] });
      if (variables.action === "accept") {
        Alert.alert("Quest Accepted!", data?.message || "Quest started!");
        setShowQuestSuggestions(false);
      } else {
        Alert.alert("Declined", data?.message || "Quest suggestion declined");
      }
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to respond to suggestion");
    },
  });

  // Record quest action mutation (for viewers)
  const recordQuestActionMutation = useMutation({
    mutationFn: async (data: { action: "YES" | "NO" | "ACTION" }) => {
      if (!viewingStreamId) return;
      return api.post(`/api/live/${viewingStreamId}/record-quest-action`, data);
    },
    onSuccess: () => {
      refetchStreams();
      queryClient.invalidateQueries({ queryKey: ["liveStreams"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to record action");
    },
  });

  // Record streamer's own quest action
  const recordStreamerQuestMutation = useMutation({
    mutationFn: async (data: { action: "YES" | "NO" | "ACTION" }) => {
      if (!activeQuest) return;
      return api.post(`/api/quests/${activeQuest.id}/record`, {
        action: data.action,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quests"] });
      refetchStreams();
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to record action");
    },
  });

  // Create quest mutation (for creating quests directly in livestream)
  const createQuestInLiveMutation = useMutation({
    mutationFn: async (prompt: string) => {
      return api.post<any>("/api/quests/generate", {
        userInput: prompt,
      });
    },
    onSuccess: async (data) => {
      setNewQuestPrompt("");
      setShowCreateQuestModal(false);
      queryClient.invalidateQueries({ queryKey: ["quests"] });

      // Auto-start the quest
      if (data.userQuestId) {
        try {
          await api.post(`/api/quests/${data.userQuestId}/start`, {});
          setShowQuestCardOnStream(true);
          Alert.alert("Quest Created!", "Your quest is now live on your stream!");
        } catch (error) {
          console.error("Failed to start quest:", error);
        }
      }
    },
    onError: (error: any) => {
      // Check if it's a subscription limit error (403 with specific message)
      if (error.status === 403 && error.message?.includes("quest limit")) {
        Alert.alert(
          "🚀 Upgrade to Premium",
          "You've reached your free quest limit! Upgrade to create unlimited AI-powered quests and unlock all premium features.",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Upgrade Now",
              style: "default",
              onPress: () => {
                // Navigate to subscription/payment screen
                // For now, we'll use a web link until in-app purchases are set up
                if (Platform.OS === "ios") {
                  // TODO: Implement Apple In-App Purchase
                  Alert.alert(
                    "Coming Soon",
                    "In-app purchases are coming soon! For now, please visit our website to upgrade.",
                    [
                      {
                        text: "OK",
                        style: "cancel",
                      },
                    ]
                  );
                } else if (Platform.OS === "android") {
                  // TODO: Implement Google Play Billing
                  Alert.alert(
                    "Coming Soon",
                    "In-app purchases are coming soon! For now, please visit our website to upgrade.",
                    [
                      {
                        text: "OK",
                        style: "cancel",
                      },
                    ]
                  );
                } else {
                  // Web - redirect to Stripe checkout
                  Alert.alert(
                    "Redirect to Upgrade",
                    "You'll be redirected to our secure checkout page.",
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                      },
                      {
                        text: "Continue",
                        onPress: () => {
                          // TODO: Open Stripe checkout URL
                          console.log("Redirect to Stripe checkout");
                        },
                      },
                    ]
                  );
                }
              },
            },
          ]
        );
      } else {
        // Show generic error for other errors
        Alert.alert("Error", error.message || "Failed to create quest");
      }
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

  const handleSuggestQuest = () => {
    if (!selectedSuggestQuestId) {
      Alert.alert("Error", "Please select a quest");
      return;
    }

    const userTokens = userStats?.tokens || 0;
    if (boostAmount > userTokens) {
      Alert.alert("Insufficient Tokens", `You only have ${userTokens} tokens`);
      return;
    }

    suggestQuestMutation.mutate({
      questId: selectedSuggestQuestId,
      boostAmount,
      message: questMessage || undefined,
    });
  };

  // Get active quest from stream or selected quest
  const currentStream = streamsData?.streams.find((s) => s.id === currentStreamId);
  const streamQuestId = currentStream?.userQuest?.id;
  const activeQuest = questsData?.activeQuests.find((uq) => {
    return streamQuestId === uq.id || uq.id === selectedQuestId;
  });

  // Find the stream being viewed
  const viewingStream = streamsData?.streams.find((s) => s.id === viewingStreamId);

  // If viewing someone else's stream, show viewer interface
  if (viewingStreamId && viewingStream) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
        {/* Camera View Placeholder */}
        <View
          style={{
            flex: 1,
            backgroundColor: colors.card,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Video size={80} color={colors.textTertiary} />
          <Text style={{ color: colors.textSecondary, marginTop: 16, fontSize: 16 }}>
            {viewingStream.user.name}&apos;s stream
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
            backgroundColor: colors.error,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
          }}
        >
          <Radio size={12} color={colors.text} style={{ marginRight: 6 }} />
          <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 14 }}>LIVE</Text>
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
            backgroundColor: colors.modalOverlay,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={24} color={colors.text} />
        </Pressable>

        {/* Viewer Count */}
        <View
          style={{
            position: "absolute",
            top: 120,
            right: 20,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.modalOverlay,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            gap: 6,
          }}
        >
          <Users size={16} color={colors.text} />
          <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 14 }}>
            {viewingStream.viewerCount}
          </Text>
        </View>

        {/* Send Quest Button */}
        <Pressable
          onPress={() => setShowSendQuestModal(true)}
          style={{
            position: "absolute",
            top: 180,
            right: 20,
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: "#FFD700",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#FFD700",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
          }}
        >
          <Gift size={24} color="#000" />
        </Pressable>

        {/* Modern Quest Card Overlay with Yes/No Buttons */}
        {viewingStream.userQuest && (
          <View
            style={{
              position: "absolute",
              bottom: 240,
              left: 20,
              right: 20,
              backgroundColor: "rgba(255, 107, 53, 0.95)",
              borderRadius: 16,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: "#FFD700",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ color: colors.text, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>
                {viewingStream.userQuest.quest.category}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ color: "white", fontSize: 10, fontWeight: "600" }}>
                  {viewingStream.userQuest.noCount} / {viewingStream.userQuest.quest.goalCount}
                </Text>
                <View style={{ width: 40, height: 6, backgroundColor: "rgba(255, 255, 255, 0.3)", borderRadius: 3 }}>
                  <View
                    style={{
                      width: `${(viewingStream.userQuest.noCount / viewingStream.userQuest.quest.goalCount) * 100}%`,
                      height: "100%",
                      backgroundColor: "#FFD700",
                      borderRadius: 3,
                    }}
                  />
                </View>
              </View>
            </View>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "bold", marginBottom: 6 }}>
              {viewingStream.userQuest.quest.title}
            </Text>
            <Text style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: 13, lineHeight: 18 }} numberOfLines={2}>
              {viewingStream.userQuest.quest.description}
            </Text>

            {/* Yes/No Buttons for Viewers */}
            {(viewingStream.userQuest.quest.goalType === "COLLECT_NOS" || viewingStream.userQuest.quest.goalType === "COLLECT_YES") && (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                <Pressable
                  onPress={() => recordQuestActionMutation.mutate({ action: "YES" })}
                  disabled={recordQuestActionMutation.isPending}
                  style={{
                    flex: 1,
                    backgroundColor: "#EF4444",
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: recordQuestActionMutation.isPending ? 0.6 : 1,
                  }}
                >
                  {recordQuestActionMutation.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>YES</Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => recordQuestActionMutation.mutate({ action: "NO" })}
                  disabled={recordQuestActionMutation.isPending}
                  style={{
                    flex: 1,
                    backgroundColor: "#3B82F6",
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: recordQuestActionMutation.isPending ? 0.6 : 1,
                  }}
                >
                  {recordQuestActionMutation.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>NO</Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Chat Section - Modern Design */}
        <View
          style={{
            position: "absolute",
            bottom: 85,
            left: 0,
            right: 0,
          }}
        >
          {/* Chat Messages - Minimal Bubbles */}
          {commentsData?.comments && commentsData.comments.length > 0 && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 12, maxHeight: 200 }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {commentsData.comments.slice(-4).map((comment) => (
                  <View
                    key={comment.id}
                    style={{
                      marginBottom: 8,
                      alignSelf: "flex-start",
                      maxWidth: "80%",
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "#000000",
                        borderRadius: 16,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderWidth: 1,
                        borderColor: "rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      <Text style={{ color: "#FF6B35", fontSize: 11, fontWeight: "700", marginBottom: 3 }}>
                        {comment.user.name || "Anonymous"}
                      </Text>
                      <Text style={{ color: "rgba(255, 255, 255, 0.95)", fontSize: 13, lineHeight: 18 }}>
                        {comment.message}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Input Area - Sleek & Modern */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{
              backgroundColor: "#000000",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderTopWidth: 1,
              borderTopColor: "rgba(255, 255, 255, 0.05)",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  borderRadius: 24,
                  paddingHorizontal: 18,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.08)",
                }}
              >
                <MessageCircle size={18} color="rgba(255, 255, 255, 0.4)" style={{ marginRight: 10 }} />
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Add a message..."
                  placeholderTextColor="rgba(255, 255, 255, 0.35)"
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    color: "white",
                    fontSize: 14,
                  }}
                />
              </View>
              <Pressable
                onPress={handleSendComment}
                disabled={!commentText.trim()}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: commentText.trim() ? "#FF6B35" : "rgba(255, 255, 255, 0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Send size={19} color={commentText.trim() ? "white" : "rgba(255, 255, 255, 0.3)"} />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>

        {/* Send Quest Modal */}
        <Modal
          visible={showSendQuestModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowSendQuestModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: colors.modalOverlay, justifyContent: "flex-end" }}>
            <View
              style={{
                backgroundColor: colors.backgroundSolid,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingTop: 20,
                paddingBottom: 40,
                paddingHorizontal: 20,
                maxHeight: "80%",
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <Text style={{ color: colors.text, fontSize: 22, fontWeight: "bold" }}>
                  Send Quest Challenge
                </Text>
                <Pressable onPress={() => setShowSendQuestModal(false)}>
                  <X size={28} color={colors.text} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 16 }}>
                  Challenge {viewingStream.user.name} to complete a quest! Boost with tokens for higher priority.
                </Text>

                {/* Token Balance */}
                <View style={{ backgroundColor: colors.warning + "20", borderRadius: 12, padding: 12, marginBottom: 16 }}>
                  <Text style={{ color: colors.warning, fontSize: 12, fontWeight: "600" }}>
                    Your Tokens: {userStats?.tokens || 0} 🪙
                  </Text>
                </View>

                {/* Available Quests */}
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>
                  Select Quest
                </Text>
                {questsData?.activeQuests && questsData.activeQuests.length > 0 ? (
                  questsData.activeQuests.map((uq) => (
                    <Pressable
                      key={uq.id}
                      onPress={() => setSelectedSuggestQuestId(uq.quest.id)}
                      style={{
                        backgroundColor:
                          selectedSuggestQuestId === uq.quest.id
                            ? "rgba(255, 107, 53, 0.3)"
                            : "rgba(255, 255, 255, 0.05)",
                        borderRadius: 12,
                        padding: 14,
                        marginBottom: 10,
                        borderWidth: 2,
                        borderColor:
                          selectedSuggestQuestId === uq.quest.id ? "#FF6B35" : "transparent",
                      }}
                    >
                      <Text style={{ color: colors.secondary, fontSize: 11, fontWeight: "600", marginBottom: 4 }}>
                        {uq.quest.category}
                      </Text>
                      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600" }}>
                        {uq.quest.title}
                      </Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={{ color: colors.textTertiary, fontSize: 14, textAlign: "center", paddingVertical: 20 }}>
                    You don&apos;t have any active quests to share
                  </Text>
                )}

                {/* Boost Amount */}
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold", marginTop: 16, marginBottom: 12 }}>
                  Boost Priority (Optional)
                </Text>
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                  {[0, 5, 10, 25, 50].map((amount) => (
                    <Pressable
                      key={amount}
                      onPress={() => setBoostAmount(amount)}
                      style={{
                        flex: 1,
                        backgroundColor: boostAmount === amount ? colors.warning : colors.surface,
                        paddingVertical: 12,
                        borderRadius: 8,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: boostAmount === amount ? colors.backgroundSolid : colors.text,
                          fontSize: 14,
                          fontWeight: "700",
                        }}
                      >
                        {amount === 0 ? "Free" : `${amount}💎`}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Message */}
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>
                  Add Message (Optional)
                </Text>
                <TextInput
                  value={questMessage}
                  onChangeText={setQuestMessage}
                  placeholder="Add a challenge message..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  style={{
                    backgroundColor: colors.inputBackground,
                    borderRadius: 12,
                    padding: 12,
                    color: colors.text,
                    fontSize: 14,
                    minHeight: 80,
                    textAlignVertical: "top",
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                  }}
                />

                {/* Send Button */}
                <Pressable
                  onPress={handleSuggestQuest}
                  disabled={!selectedSuggestQuestId}
                  style={{
                    backgroundColor: selectedSuggestQuestId ? colors.secondary : colors.textTertiary,
                    paddingVertical: 16,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: selectedSuggestQuestId ? colors.text : colors.textSecondary, fontSize: 16, fontWeight: "bold" }}>
                    Send Quest {boostAmount > 0 ? `(${boostAmount}💎)` : ""}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  if (!sessionData?.user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.error + "20",
                borderWidth: 2,
                borderColor: colors.error,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <Video size={40} color={colors.error} />
            </View>
            <Text style={{ color: colors.text, fontSize: 28, fontWeight: "bold", marginBottom: 16, textAlign: "center" }}>
              Go Live
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 16, textAlign: "center", marginBottom: 32 }}>
              Sign in to start streaming your quest journey or watch others go for their NOs!
            </Text>
            <Pressable
              onPress={() => navigation.navigate("LoginModalScreen")}
              style={{
                backgroundColor: colors.secondary,
                paddingHorizontal: 48,
                paddingVertical: 16,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 18 }}>Get Started</Text>
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
        <View style={{ flex: 1, backgroundColor: colors.backgroundSolid, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.text }}>Loading camera...</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={{ flex: 1, backgroundColor: colors.backgroundSolid, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Video size={64} color={colors.secondary} style={{ marginBottom: 24 }} />
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold", marginBottom: 12, textAlign: "center" }}>
            Camera Permission Required
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 16, textAlign: "center", marginBottom: 32 }}>
            We need access to your camera to start the live stream
          </Text>
          <Pressable
            onPress={requestPermission}
            style={{
              backgroundColor: colors.secondary,
              paddingHorizontal: 32,
              paddingVertical: 16,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 16 }}>Grant Permission</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
        {/* Camera View */}
        {!isVideoOff ? (
          <CameraView style={{ flex: 1 }} facing={facing} />
        ) : (
          <View
            style={{
              flex: 1,
              backgroundColor: colors.card,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <VideoOff size={80} color={colors.textTertiary} />
            <Text style={{ color: colors.textSecondary, marginTop: 16, fontSize: 16 }}>
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
            backgroundColor: colors.error,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
          }}
        >
          <Radio size={12} color={colors.text} style={{ marginRight: 6 }} />
          <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 14 }}>LIVE</Text>
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
            backgroundColor: colors.modalOverlay,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={24} color={colors.text} />
        </Pressable>

        {/* Control Buttons */}
        <View
          style={{
            position: "absolute",
            top: 120,
            right: 20,
            gap: 12,
          }}
        >
          {/* Quest Suggestions Badge */}
          {suggestionsData && suggestionsData.suggestions.length > 0 && (
            <Pressable
              onPress={() => setShowQuestSuggestions(true)}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#FFD700",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <Gift size={24} color="#000" />
              <View
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: "#FF0000",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>
                  {suggestionsData.suggestions.length}
                </Text>
              </View>
            </Pressable>
          )}

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

          {/* Quest Card Toggle Button - Always show when streaming */}
          <Pressable
            onPress={() => {
              if (!activeQuest) {
                setShowCreateQuestModal(true);
              } else {
                setShowQuestCardOnStream(!showQuestCardOnStream);
              }
            }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: activeQuest && showQuestCardOnStream ? "rgba(255, 107, 53, 0.8)" : "rgba(255, 255, 255, 0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={24} color="white" />
          </Pressable>
        </View>

        {/* Modern Quest Card Overlay - Interactive & Expandable */}
        {activeQuest && showQuestCardOnStream && (
          <Pressable
            onPress={() => {
              // Expand/collapse on tap - for now just toggle visibility
              setShowQuestCardOnStream(!showQuestCardOnStream);
            }}
            style={{
              position: "absolute",
              bottom: 240,
              left: 20,
              right: 20,
              backgroundColor: "rgba(255, 107, 53, 0.95)",
              borderRadius: 16,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: "#FFD700",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ color: colors.text, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>
                {activeQuest.quest.category}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ color: "white", fontSize: 10, fontWeight: "600" }}>
                  {activeQuest.noCount} / {activeQuest.quest.goalCount}
                </Text>
                <View style={{ width: 40, height: 6, backgroundColor: "rgba(255, 255, 255, 0.3)", borderRadius: 3 }}>
                  <View
                    style={{
                      width: `${(activeQuest.noCount / activeQuest.quest.goalCount) * 100}%`,
                      height: "100%",
                      backgroundColor: "#FFD700",
                      borderRadius: 3,
                    }}
                  />
                </View>
              </View>
            </View>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "bold", marginBottom: 6 }}>
              {activeQuest.quest.title}
            </Text>
            <Text style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: 13, lineHeight: 18 }} numberOfLines={2}>
              {activeQuest.quest.description}
            </Text>

            {/* Interactive Yes/No Buttons */}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  recordStreamerQuestMutation.mutate({ action: "NO" });
                }}
                disabled={recordStreamerQuestMutation.isPending}
                style={{
                  flex: 1,
                  backgroundColor: "rgba(220, 38, 38, 0.8)",
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: "center",
                  opacity: recordStreamerQuestMutation.isPending ? 0.6 : 1,
                }}
              >
                <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
                  {recordStreamerQuestMutation.isPending ? "Recording..." : "NO"}
                </Text>
              </Pressable>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  recordStreamerQuestMutation.mutate({ action: "YES" });
                }}
                disabled={recordStreamerQuestMutation.isPending}
                style={{
                  flex: 1,
                  backgroundColor: "rgba(34, 197, 94, 0.8)",
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: "center",
                  opacity: recordStreamerQuestMutation.isPending ? 0.6 : 1,
                }}
              >
                <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
                  {recordStreamerQuestMutation.isPending ? "Recording..." : "YES"}
                </Text>
              </Pressable>
            </View>

            <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 11, marginTop: 8, textAlign: "center" }}>
              Tap card to hide • Tap sparkles to show
            </Text>
          </Pressable>
        )}

        {/* Create Quest Button - Show when streaming without active quest */}
        {!activeQuest && (
          <Pressable
            onPress={() => navigation.navigate("CreateQuest")}
            style={{
              position: "absolute",
              bottom: 240,
              left: 20,
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "#7E3FE4",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#7E3FE4",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 8,
            }}
          >
            <Plus size={24} color="white" />
          </Pressable>
        )}

        {/* Chat Section - Modern Design */}
        <View
          style={{
            position: "absolute",
            bottom: 85,
            left: 0,
            right: 0,
          }}
        >
          {/* Chat Messages - Minimal Bubbles */}
          {commentsData?.comments && commentsData.comments.length > 0 && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 12, maxHeight: 200 }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {commentsData.comments.slice(-4).map((comment) => (
                  <View
                    key={comment.id}
                    style={{
                      marginBottom: 8,
                      alignSelf: "flex-start",
                      maxWidth: "80%",
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "#000000",
                        borderRadius: 16,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderWidth: 1,
                        borderColor: "rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      <Text style={{ color: "#FF6B35", fontSize: 11, fontWeight: "700", marginBottom: 3 }}>
                        {comment.user.name || "Anonymous"}
                      </Text>
                      <Text style={{ color: "rgba(255, 255, 255, 0.95)", fontSize: 13, lineHeight: 18 }}>
                        {comment.message}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Input Area - Sleek & Modern */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{
              backgroundColor: "#000000",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderTopWidth: 1,
              borderTopColor: "rgba(255, 255, 255, 0.05)",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  borderRadius: 24,
                  paddingHorizontal: 18,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.08)",
                }}
              >
                <MessageCircle size={18} color="rgba(255, 255, 255, 0.4)" style={{ marginRight: 10 }} />
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Chat with viewers..."
                  placeholderTextColor="rgba(255, 255, 255, 0.35)"
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    color: "white",
                    fontSize: 14,
                  }}
                />
              </View>
              <Pressable
                onPress={handleSendComment}
                disabled={!commentText.trim()}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: commentText.trim() ? "#FF6B35" : "rgba(255, 255, 255, 0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Send size={19} color={commentText.trim() ? "white" : "rgba(255, 255, 255, 0.3)"} />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>

        {/* Create Quest Modal */}
        <Modal
          visible={showCreateQuestModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowCreateQuestModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: colors.modalOverlay, justifyContent: "flex-end" }}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
              <View
                style={{
                  backgroundColor: colors.backgroundSolid,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  paddingTop: 20,
                  paddingBottom: 40,
                  paddingHorizontal: 20,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <Text style={{ color: colors.text, fontSize: 22, fontWeight: "bold" }}>
                    Create Quest Live
                  </Text>
                  <Pressable onPress={() => setShowCreateQuestModal(false)}>
                    <X size={28} color={colors.text} />
                  </Pressable>
                </View>

                <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 16 }}>
                  Describe what you want to do, and AI will create a quest for your livestream
                </Text>

                <TextInput
                  value={newQuestPrompt}
                  onChangeText={setNewQuestPrompt}
                  placeholder="E.g., Ask 5 strangers for directions..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={3}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    padding: 16,
                    color: colors.text,
                    fontSize: 15,
                    minHeight: 100,
                    textAlignVertical: "top",
                    marginBottom: 20,
                  }}
                />

                <Pressable
                  onPress={() => {
                    if (newQuestPrompt.trim()) {
                      createQuestInLiveMutation.mutate(newQuestPrompt.trim());
                    }
                  }}
                  disabled={!newQuestPrompt.trim() || createQuestInLiveMutation.isPending}
                  style={{
                    backgroundColor: newQuestPrompt.trim() ? colors.secondary : colors.card,
                    paddingVertical: 16,
                    borderRadius: 12,
                    alignItems: "center",
                    opacity: createQuestInLiveMutation.isPending ? 0.6 : 1,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold" }}>
                    {createQuestInLiveMutation.isPending ? "Creating Quest..." : "Create & Start Quest"}
                  </Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* Quest Suggestions Modal */}
        <Modal
          visible={showQuestSuggestions}
          animationType="slide"
          transparent
          onRequestClose={() => setShowQuestSuggestions(false)}
        >
          <View style={{ flex: 1, backgroundColor: colors.modalOverlay, justifyContent: "flex-end" }}>
            <View
              style={{
                backgroundColor: colors.backgroundSolid,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingTop: 20,
                paddingBottom: 40,
                paddingHorizontal: 20,
                maxHeight: "70%",
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <Text style={{ color: colors.text, fontSize: 22, fontWeight: "bold" }}>
                  Quest Suggestions
                </Text>
                <Pressable onPress={() => setShowQuestSuggestions(false)}>
                  <X size={28} color={colors.text} />
                </Pressable>
              </View>

              {suggestionsData && suggestionsData.suggestions.length > 0 ? (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {suggestionsData.suggestions.map((suggestion) => (
                    <View
                      key={suggestion.id}
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                      }}
                    >
                      {/* Boost Badge */}
                      {suggestion.boostAmount > 0 && (
                        <View
                          style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            backgroundColor: colors.warning,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Crown size={12} color={colors.backgroundSolid} />
                          <Text style={{ color: colors.backgroundSolid, fontSize: 11, fontWeight: "bold" }}>
                            {suggestion.boostAmount}💎
                          </Text>
                        </View>
                      )}

                      <Text style={{ color: colors.textTertiary, fontSize: 11, marginBottom: 4 }}>
                        From {suggestion.suggester.name || "Anonymous"}
                      </Text>

                      <Text style={{ color: colors.secondary, fontSize: 12, fontWeight: "600", marginBottom: 6 }}>
                        {suggestion.quest.category} • {suggestion.quest.difficulty}
                      </Text>

                      <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>
                        {suggestion.quest.title}
                      </Text>

                      <Text style={{ color: colors.text, fontSize: 14, marginBottom: 12 }} numberOfLines={2}>
                        {suggestion.quest.description}
                      </Text>

                      {suggestion.message && (
                        <View style={{ backgroundColor: colors.warning + "20", borderRadius: 8, padding: 10, marginBottom: 12 }}>
                          <Text style={{ color: colors.warning, fontSize: 13, fontStyle: "italic" }}>
                            &quot;{suggestion.message}&quot;
                          </Text>
                        </View>
                      )}

                      {/* Action Buttons */}
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <Pressable
                          onPress={() =>
                            respondToSuggestionMutation.mutate({
                              suggestionId: suggestion.id,
                              action: "accept",
                            })
                          }
                          style={{
                            flex: 1,
                            backgroundColor: colors.success,
                            paddingVertical: 12,
                            borderRadius: 10,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                          }}
                        >
                          <CheckCircle size={18} color={colors.text} />
                          <Text style={{ color: colors.text, fontSize: 14, fontWeight: "bold" }}>Accept</Text>
                        </Pressable>

                        <Pressable
                          onPress={() =>
                            respondToSuggestionMutation.mutate({
                              suggestionId: suggestion.id,
                              action: "decline",
                            })
                          }
                          style={{
                            flex: 1,
                            backgroundColor: colors.error,
                            paddingVertical: 12,
                            borderRadius: 10,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                          }}
                        >
                          <XCircle size={18} color={colors.text} />
                          <Text style={{ color: colors.text, fontSize: 14, fontWeight: "bold" }}>Decline</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Gift size={48} color={colors.textTertiary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 16, textAlign: "center" }}>
                    No quest suggestions yet
                  </Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 14, marginTop: 8, textAlign: "center" }}>
                    Viewers can send you quest challenges during your stream
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Default view - show active streams or start streaming button
  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={{ paddingTop: 16, paddingBottom: 20, paddingHorizontal: 24 }}>
          <Text style={{ color: colors.text, fontSize: 32, fontWeight: "bold", letterSpacing: -1 }}>
            Live Now
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 6 }}>
            Join warriors streaming their quest challenges
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Go Live Hero Card */}
          <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
            <Pressable
              onPress={handleStartStream}
              style={{
                backgroundColor: colors.error,
                borderRadius: 20,
                padding: 24,
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
                shadowColor: colors.error,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.5,
                shadowRadius: 16,
                elevation: 12,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.text + "30",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Radio size={28} color={colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold", marginBottom: 4 }}>
                  Start Streaming
                </Text>
                <Text style={{ color: colors.text, fontSize: 14 }}>
                  Share your quest journey live
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Featured Live Streams (Horizontal Scroll) */}
          {streamsData?.streams && streamsData.streams.length > 0 && (
            <View style={{ marginBottom: 32 }}>
              <View style={{ paddingHorizontal: 24, marginBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: colors.text, fontSize: 22, fontWeight: "bold" }}>
                  Featured Streams
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error }} />
                  <Text style={{ color: colors.error, fontSize: 14, fontWeight: "600" }}>
                    {streamsData.streams.length} LIVE
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
              >
                {streamsData.streams.slice(0, 3).map((stream) => (
                  <Pressable
                    key={stream.id}
                    onPress={() => setViewingStreamId(stream.id)}
                    style={{
                      width: 280,
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      overflow: "hidden",
                      borderWidth: 1.5,
                      borderColor: colors.error + "30",
                    }}
                  >
                    {/* Thumbnail Area */}
                    <View
                      style={{
                        height: 160,
                        backgroundColor: colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                      }}
                    >
                      <Video size={48} color={colors.textTertiary} />

                      {/* LIVE Badge */}
                      <View
                        style={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: colors.error,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 6,
                        }}
                      >
                        <Radio size={12} color={colors.text} style={{ marginRight: 6 }} />
                        <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 11 }}>LIVE</Text>
                      </View>

                      {/* Viewer Count */}
                      <View
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: colors.modalOverlay,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 6,
                          gap: 6,
                        }}
                      >
                        <Users size={14} color={colors.text} />
                        <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 12 }}>
                          {stream.viewerCount}
                        </Text>
                      </View>
                    </View>

                    {/* Stream Info */}
                    <View style={{ padding: 14 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: colors.secondary,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 16 }}>
                            {stream.user.name?.[0] || "U"}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>
                            {stream.user.name || "Anonymous"}
                          </Text>
                          {stream.userQuest && (
                            <Text style={{ color: colors.secondary, fontSize: 11, fontWeight: "600", marginTop: 2 }}>
                              {stream.userQuest.quest.category}
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Quest Title */}
                      {stream.userQuest && (
                        <Text
                          style={{ color: colors.text, fontSize: 13, lineHeight: 18 }}
                          numberOfLines={2}
                        >
                          {stream.userQuest.quest.title}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* All Live Streams Grid */}
          {streamsData?.streams && streamsData.streams.length > 0 ? (
            <View style={{ paddingHorizontal: 24 }}>
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: "bold", marginBottom: 16 }}>
                All Streams
              </Text>

              <View style={{ gap: 16 }}>
                {streamsData.streams.map((stream) => (
                  <Pressable
                    key={stream.id}
                    onPress={() => setViewingStreamId(stream.id)}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <View style={{ flexDirection: "row", padding: 14, gap: 14 }}>
                      {/* Thumbnail */}
                      <View
                        style={{
                          width: 100,
                          height: 100,
                          borderRadius: 12,
                          backgroundColor: colors.surface,
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                        }}
                      >
                        <Video size={32} color={colors.textTertiary} />

                        {/* Mini LIVE Badge */}
                        <View
                          style={{
                            position: "absolute",
                            top: 6,
                            left: 6,
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: colors.error,
                            paddingHorizontal: 6,
                            paddingVertical: 3,
                            borderRadius: 4,
                          }}
                        >
                          <Radio size={8} color={colors.text} style={{ marginRight: 4 }} />
                          <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 9 }}>LIVE</Text>
                        </View>
                      </View>

                      {/* Info */}
                      <View style={{ flex: 1, justifyContent: "center" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <View
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              backgroundColor: colors.secondary,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 14 }}>
                              {stream.user.name?.[0] || "U"}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
                              {stream.user.name || "Anonymous"}
                            </Text>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                              <Users size={12} color={colors.textTertiary} />
                              <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
                                {stream.viewerCount} watching
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Quest Info */}
                        {stream.userQuest && (
                          <View
                            style={{
                              backgroundColor: colors.secondary + "20",
                              borderRadius: 8,
                              padding: 8,
                              borderLeftWidth: 2,
                              borderLeftColor: colors.secondary,
                            }}
                          >
                            <Text style={{ color: colors.secondary, fontSize: 10, fontWeight: "700", marginBottom: 3 }}>
                              {stream.userQuest.quest.category}
                            </Text>
                            <Text
                              style={{ color: colors.text, fontSize: 13, fontWeight: "600" }}
                              numberOfLines={1}
                            >
                              {stream.userQuest.quest.title}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 24 }}>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 20,
                  padding: 40,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: colors.error + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  <Video size={40} color={colors.error} />
                </View>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 8 }}>
                  No Live Streams
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: "center", lineHeight: 22 }}>
                  Be the first warrior to go live and{"\n"}share your quest journey!
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
