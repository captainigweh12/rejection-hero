import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Video,
  Users,
  Play,
  Eye,
  Target,
  Clock,
} from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import type { GetGroupLiveStreamsResponse } from "@/shared/contracts";

type Props = RootStackScreenProps<"GroupLive">;

export default function GroupLiveScreen({ navigation, route }: Props) {
  const { groupId, groupName } = route.params;
  const { data: sessionData } = useSession();
  const queryClient = useQueryClient();

  // Fetch active group live streams
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["group-live-streams", groupId],
    queryFn: async () => {
      return api.get<GetGroupLiveStreamsResponse>(`/api/group-live/${groupId}`);
    },
    enabled: !!sessionData?.user && !!groupId,
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
  });

  const liveStreams = data?.liveStreams || [];
  const currentUserId = sessionData?.user?.id;

  // Start live stream mutation
  const startLiveMutation = useMutation({
    mutationFn: async () => {
      return api.post("/api/group-live/start", {
        groupId,
      });
    },
    onSuccess: (response: any) => {
      Alert.alert("Success", "Live stream started!");
      queryClient.invalidateQueries({ queryKey: ["group-live-streams", groupId] });
      // TODO: Navigate to live streaming view
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to start live stream");
    },
  });

  const handleStartLive = () => {
    Alert.alert(
      "Go Live",
      "Start streaming to your group members?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: () => startLiveMutation.mutate(),
        },
      ]
    );
  };

  const handleJoinStream = (streamId: string, roomUrl: string) => {
    // TODO: Navigate to live viewer screen
    Alert.alert("Join Stream", "Live viewer screen coming soon!");
  };

  const getTimeSince = (startedAt: string) => {
    const now = new Date();
    const started = new Date(startedAt);
    const diffMs = now.getTime() - started.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0F", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#7E3FE4" />
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
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "white" }}>{groupName}</Text>
            <Text style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)", marginTop: 2 }}>
              Group Live
            </Text>
          </View>
          <Pressable
            onPress={handleStartLive}
            disabled={startLiveMutation.isPending}
            style={{
              backgroundColor: "#FF3B30",
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              opacity: startLiveMutation.isPending ? 0.7 : 1,
            }}
          >
            {startLiveMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Video size={18} color="white" />
                <Text style={{ color: "white", fontSize: 14, fontWeight: "700" }}>Go Live</Text>
              </>
            )}
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {liveStreams.length === 0 ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <Video size={64} color="rgba(255, 255, 255, 0.3)" />
              <Text style={{ color: "white", fontSize: 20, fontWeight: "700", marginTop: 16, textAlign: "center" }}>
                No Live Streams Yet
              </Text>
              <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 15, marginTop: 8, textAlign: "center" }}>
                Be the first to go live and stream to your group!
              </Text>
              <Pressable
                onPress={handleStartLive}
                disabled={startLiveMutation.isPending}
                style={{
                  backgroundColor: "#FF3B30",
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 16,
                  marginTop: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Video size={20} color="white" />
                <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>Start Streaming</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ padding: 20 }}>
              {/* Live Now Header */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: "#FF3B30",
                  }}
                />
                <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>
                  Live Now ({liveStreams.length})
                </Text>
              </View>

              {/* Live Streams Grid */}
              <View style={{ gap: 16 }}>
                {liveStreams.map((stream) => (
                  <Pressable
                    key={stream.id}
                    onPress={() => handleJoinStream(stream.id, stream.roomUrl)}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 16,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: "rgba(255, 59, 48, 0.3)",
                    }}
                  >
                    {/* Stream Thumbnail */}
                    <View
                      style={{
                        height: 200,
                        backgroundColor: "#1A1A24",
                        justifyContent: "center",
                        alignItems: "center",
                        position: "relative",
                      }}
                    >
                      {/* Placeholder for video thumbnail */}
                      <View
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 40,
                          backgroundColor: "rgba(126, 63, 228, 0.2)",
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 2,
                          borderColor: "#7E3FE4",
                        }}
                      >
                        {stream.streamer.avatar ? (
                          <Image
                            source={{ uri: stream.streamer.avatar }}
                            style={{ width: 76, height: 76, borderRadius: 38 }}
                          />
                        ) : (
                          <Text style={{ color: "#7E3FE4", fontSize: 32, fontWeight: "700" }}>
                            {stream.streamer.displayName.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>

                      {/* Live Badge */}
                      <View
                        style={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          backgroundColor: "#FF3B30",
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
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
                        <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>LIVE</Text>
                      </View>

                      {/* Viewer Count */}
                      <View
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          backgroundColor: "rgba(0, 0, 0, 0.6)",
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 12,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Eye size={14} color="white" />
                        <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>
                          {stream.viewerCount}
                        </Text>
                      </View>

                      {/* Play Button Overlay */}
                      <View
                        style={{
                          position: "absolute",
                          bottom: 12,
                          right: 12,
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: "rgba(126, 63, 228, 0.9)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Play size={24} color="white" fill="white" />
                      </View>
                    </View>

                    {/* Stream Info */}
                    <View style={{ padding: 16 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: "#7E3FE4" + "30",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {stream.streamer.avatar ? (
                            <Image
                              source={{ uri: stream.streamer.avatar }}
                              style={{ width: 40, height: 40, borderRadius: 20 }}
                            />
                          ) : (
                            <Text style={{ color: "#7E3FE4", fontSize: 18, fontWeight: "700" }}>
                              {stream.streamer.displayName.charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                            {stream.streamer.displayName}
                            {stream.streamer.id === currentUserId && " (You)"}
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                            <Clock size={12} color="rgba(255, 255, 255, 0.6)" />
                            <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 12 }}>
                              {getTimeSince(stream.startedAt)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Quest Info (if streaming a quest) */}
                      {stream.quest && (
                        <View
                          style={{
                            backgroundColor: "rgba(0, 217, 255, 0.1)",
                            borderRadius: 10,
                            padding: 10,
                            marginTop: 8,
                            borderWidth: 1,
                            borderColor: "rgba(0, 217, 255, 0.3)",
                          }}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <Target size={14} color="#00D9FF" />
                            <Text style={{ color: "#00D9FF", fontSize: 12, fontWeight: "700" }}>
                              Quest Challenge
                            </Text>
                          </View>
                          <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
                            {stream.quest.title}
                          </Text>
                          <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                            {stream.quest.description}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
