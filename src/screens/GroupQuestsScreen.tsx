import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Users,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  MapPin,
  Star,
  User,
} from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import type { GetGroupQuestsResponse } from "@/shared/contracts";

type Props = RootStackScreenProps<"GroupQuests">;

export default function GroupQuestsScreen({ navigation, route }: Props) {
  const { groupId, groupName } = route.params;
  const { data: sessionData } = useSession();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch group quests
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["group-quests", groupId],
    queryFn: async () => {
      return api.get<GetGroupQuestsResponse>(`/api/group-quests/${groupId}`);
    },
    enabled: !!sessionData?.user && !!groupId,
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
  });

  const groupQuests = data?.groupQuests || [];
  const currentUserId = sessionData?.user?.id;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10B981";
      case "in_progress":
        return "#00D9FF";
      case "failed":
        return "#FF3B30";
      default:
        return "#7E3FE4";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={20} color="#10B981" />;
      case "failed":
        return <XCircle size={20} color="#FF3B30" />;
      case "in_progress":
        return <Clock size={20} color="#00D9FF" />;
      default:
        return <User size={20} color="#7E3FE4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "#10B981";
      case "medium":
        return "#FFD700";
      case "hard":
        return "#FF6B35";
      case "expert":
        return "#FF3B30";
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
              Group Quests
            </Text>
          </View>
          <Pressable
            onPress={() => setShowCreateModal(true)}
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
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {groupQuests.length === 0 ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <Target size={64} color="rgba(255, 255, 255, 0.3)" />
              <Text style={{ color: "white", fontSize: 20, fontWeight: "700", marginTop: 16, textAlign: "center" }}>
                No Group Quests Yet
              </Text>
              <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 15, marginTop: 8, textAlign: "center" }}>
                Create a group quest to challenge your members!
              </Text>
              <Pressable
                onPress={() => setShowCreateModal(true)}
                style={{
                  backgroundColor: "#7E3FE4",
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 16,
                  marginTop: 24,
                }}
              >
                <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>Create Group Quest</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ padding: 20, gap: 16 }}>
              {groupQuests.map((gq) => (
                <Pressable
                  key={gq.id}
                  onPress={() => {
                    // TODO: Navigate to group quest detail
                    Alert.alert("Quest Detail", "Group quest detail screen coming soon!");
                  }}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: "rgba(126, 63, 228, 0.3)",
                  }}
                >
                  {/* Quest Info */}
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: "white", marginBottom: 4 }}>
                      {gq.quest.title}
                    </Text>
                    <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.7)", lineHeight: 20 }}>
                      {gq.quest.description}
                    </Text>
                  </View>

                  {/* Quest Meta */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                    <View
                      style={{
                        backgroundColor: getDifficultyColor(gq.quest.difficulty) + "30",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: getDifficultyColor(gq.quest.difficulty), fontSize: 12, fontWeight: "600" }}>
                        {gq.quest.difficulty}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: "rgba(0, 217, 255, 0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ color: "#00D9FF", fontSize: 12, fontWeight: "600" }}>
                        {gq.quest.category}
                      </Text>
                    </View>
                    {gq.assignmentType === "assigned" && (
                      <View style={{ backgroundColor: "rgba(255, 215, 0, 0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ color: "#FFD700", fontSize: 12, fontWeight: "600" }}>
                          Assigned Only
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Rewards */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Star size={16} color="#FFD700" />
                      <Text style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 13 }}>
                        {gq.quest.xpReward} XP
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Trophy size={16} color="#00D9FF" />
                      <Text style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 13 }}>
                        {gq.quest.pointReward} pts
                      </Text>
                    </View>
                    {gq.quest.location && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <MapPin size={16} color="#7E3FE4" />
                        <Text style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 13, flex: 1 }} numberOfLines={1}>
                          {gq.quest.location}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Participants */}
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: "rgba(255, 255, 255, 0.1)",
                      paddingTop: 12,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Users size={16} color="#7E3FE4" />
                        <Text style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 14, fontWeight: "600" }}>
                          {gq.participants.length} Participants
                        </Text>
                      </View>
                      <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 12 }}>
                        {gq.participants.filter((p) => p.status === "completed").length} completed
                      </Text>
                    </View>

                    {/* Participant List */}
                    <View style={{ gap: 8 }}>
                      {gq.participants.slice(0, 3).map((participant) => (
                        <View
                          key={participant.id}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            backgroundColor: "rgba(255, 255, 255, 0.03)",
                            padding: 10,
                            borderRadius: 10,
                          }}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                            <View
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: "#7E3FE4" + "30",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {participant.avatar ? (
                                <Image
                                  source={{ uri: participant.avatar }}
                                  style={{ width: 36, height: 36, borderRadius: 18 }}
                                />
                              ) : (
                                <Text style={{ color: "#7E3FE4", fontSize: 16, fontWeight: "700" }}>
                                  {participant.displayName.charAt(0).toUpperCase()}
                                </Text>
                              )}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
                                {participant.displayName}
                                {participant.userId === currentUserId && " (You)"}
                              </Text>
                              <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 12 }}>
                                {gq.quest.goalType === "COLLECT_NOS" && `${participant.noCount}/${gq.quest.goalCount} NOs`}
                                {gq.quest.goalType === "COLLECT_YES" && `${participant.yesCount}/${gq.quest.goalCount} YESes`}
                                {gq.quest.goalType === "TAKE_ACTION" && `${participant.actionCount}/${gq.quest.goalCount} actions`}
                              </Text>
                            </View>
                            {getStatusIcon(participant.status)}
                          </View>
                        </View>
                      ))}
                      {gq.participants.length > 3 && (
                        <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 12, textAlign: "center" }}>
                          +{gq.participants.length - 3} more participants
                        </Text>
                      )}
                    </View>

                    {/* User Actions */}
                    {!gq.userParticipation && (
                      <Pressable
                        onPress={() => {
                          // TODO: Join quest
                          Alert.alert("Join Quest", "Joining group quest coming soon!");
                        }}
                        style={{
                          backgroundColor: "#7E3FE4",
                          paddingVertical: 12,
                          borderRadius: 12,
                          marginTop: 12,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: "white", fontSize: 14, fontWeight: "700" }}>Join Quest</Text>
                      </Pressable>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Create Quest Modal (Placeholder) */}
      <Modal visible={showCreateModal} animationType="slide" transparent={true} onRequestClose={() => setShowCreateModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.8)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View style={{ backgroundColor: "#1A1A24", borderRadius: 24, padding: 24, width: "100%", maxWidth: 400 }}>
            <Text style={{ color: "white", fontSize: 24, fontWeight: "700", marginBottom: 16 }}>
              Create Group Quest
            </Text>
            <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 15, marginBottom: 24 }}>
              Quest creation screen coming soon! You&apos;ll be able to:
              {"\n"}- Choose from your existing quests
              {"\n"}- Generate new quests with AI
              {"\n"}- Assign to specific members or open to all
            </Text>
            <Pressable
              onPress={() => setShowCreateModal(false)}
              style={{
                backgroundColor: "#7E3FE4",
                paddingVertical: 14,
                borderRadius: 16,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
