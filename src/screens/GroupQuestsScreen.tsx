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
  KeyboardAvoidingView,
  Platform,
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
  X,
  Check,
  Globe,
  UserCheck,
} from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import type { GetGroupQuestsResponse, GetUserQuestsResponse, CreateGroupQuestRequest } from "@/shared/contracts";

type Props = RootStackScreenProps<"GroupQuests">;

// Create Group Quest Modal Component
interface CreateGroupQuestModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  onSuccess: () => void;
}

function CreateGroupQuestModal({ visible, onClose, groupId, onSuccess }: CreateGroupQuestModalProps) {
  const { data: sessionData } = useSession();
  const queryClient = useQueryClient();

  const [creationType, setCreationType] = useState<"existing" | "custom">("existing");
  const [customQuestText, setCustomQuestText] = useState("");
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [assignmentType, setAssignmentType] = useState<"all" | "assigned">("all");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Select Quest Type, 2: Assignment Type, 3: Select Members (if assigned)

  // Fetch user's quests
  const { data: questsData, isLoading: questsLoading } = useQuery({
    queryKey: ["user-quests"],
    queryFn: async () => {
      return api.get<GetUserQuestsResponse>("/api/quests");
    },
    enabled: !!sessionData?.user && visible,
  });

  // Fetch group members
  const { data: groupData, isLoading: membersLoading } = useQuery({
    queryKey: ["group-detail", groupId],
    queryFn: async () => {
      return api.get<{ group: { members: Array<{ userId: string; displayName: string; avatar: string | null; role: string }> } }>(`/api/groups/${groupId}`);
    },
    enabled: !!sessionData?.user && visible && assignmentType === "assigned",
  });

  // Create group quest mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateGroupQuestRequest) => {
      return api.post("/api/group-quests/create", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-quests", groupId] });
      Alert.alert("Success", "Group quest created successfully!");
      resetAndClose();
      onSuccess();
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to create group quest");
    },
  });

  const resetAndClose = () => {
    setCreationType("existing");
    setCustomQuestText("");
    setSelectedQuestId(null);
    setAssignmentType("all");
    setSelectedMemberIds([]);
    setStep(1);
    onClose();
  };

  const handleNext = () => {
    if (step === 1) {
      // Validate based on creation type
      if (creationType === "existing" && !selectedQuestId) {
        Alert.alert("Error", "Please select a quest");
        return;
      }
      if (creationType === "custom" && !customQuestText.trim()) {
        Alert.alert("Error", "Please enter a quest description");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (assignmentType === "all") {
        handleCreate();
      } else {
        setStep(3);
      }
    } else if (step === 3) {
      if (selectedMemberIds.length === 0) {
        Alert.alert("Error", "Please select at least one member");
        return;
      }
      handleCreate();
    }
  };

  const handleCreate = () => {
    const requestData: CreateGroupQuestRequest = {
      groupId,
      assignmentType,
      assignedMemberIds: assignmentType === "assigned" ? selectedMemberIds : undefined,
    };

    if (creationType === "existing") {
      if (!selectedQuestId) return;
      requestData.questId = selectedQuestId;
    } else {
      if (!customQuestText.trim()) return;
      requestData.customQuestDescription = customQuestText.trim();
    }

    createMutation.mutate(requestData);
  };

  const toggleMember = (userId: string) => {
    if (selectedMemberIds.includes(userId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== userId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  const allQuests = [
    ...(questsData?.activeQuests || []),
    ...(questsData?.queuedQuests || []),
  ];

  const selectedQuest = allQuests.find((q) => q.quest.id === selectedQuestId);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy": return "#10B981";
      case "medium": return "#FFD700";
      case "hard": return "#FF6B35";
      case "expert": return "#FF3B30";
      default: return "#7E3FE4";
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={resetAndClose}>
      <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
        <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
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
              <Text style={{ fontSize: 20, fontWeight: "700", color: "white" }}>Create Group Quest</Text>
              <Pressable
                onPress={resetAndClose}
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

            {/* Step Indicators */}
            <View style={{ flexDirection: "row", paddingHorizontal: 20, paddingVertical: 16, gap: 8 }}>
              {[1, 2, 3].map((s) => (
                <View
                  key={s}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: step >= s ? "#7E3FE4" : "rgba(255, 255, 255, 0.1)",
                  }}
                />
              ))}
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {/* Step 1: Choose Quest Type and Select/Create Quest */}
              {step === 1 && (
                <View style={{ padding: 20 }}>
                  {/* Quest Type Selector */}
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
                    Choose Quest Type
                  </Text>
                  <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
                    <Pressable
                      onPress={() => setCreationType("existing")}
                      style={{
                        flex: 1,
                        padding: 16,
                        borderRadius: 12,
                        backgroundColor: creationType === "existing" ? "rgba(126, 63, 228, 0.2)" : "rgba(255, 255, 255, 0.05)",
                        borderWidth: 2,
                        borderColor: creationType === "existing" ? "#7E3FE4" : "rgba(255, 255, 255, 0.1)",
                        alignItems: "center",
                      }}
                    >
                      <Target size={24} color={creationType === "existing" ? "#7E3FE4" : "rgba(255, 255, 255, 0.5)"} />
                      <Text style={{ color: creationType === "existing" ? "white" : "rgba(255, 255, 255, 0.6)", fontSize: 13, fontWeight: "600", marginTop: 8, textAlign: "center" }}>
                        From My Quests
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setCreationType("custom")}
                      style={{
                        flex: 1,
                        padding: 16,
                        borderRadius: 12,
                        backgroundColor: creationType === "custom" ? "rgba(126, 63, 228, 0.2)" : "rgba(255, 255, 255, 0.05)",
                        borderWidth: 2,
                        borderColor: creationType === "custom" ? "#7E3FE4" : "rgba(255, 255, 255, 0.1)",
                        alignItems: "center",
                      }}
                    >
                      <Plus size={24} color={creationType === "custom" ? "#7E3FE4" : "rgba(255, 255, 255, 0.5)"} />
                      <Text style={{ color: creationType === "custom" ? "white" : "rgba(255, 255, 255, 0.6)", fontSize: 13, fontWeight: "600", marginTop: 8, textAlign: "center" }}>
                        Create Custom
                      </Text>
                    </Pressable>
                  </View>

                  {/* Existing Quest Selection */}
                  {creationType === "existing" && (
                    <>
                      <Text style={{ color: "white", fontSize: 16, fontWeight: "600", marginBottom: 16 }}>
                        Select a Quest
                      </Text>
                      {questsLoading ? (
                        <ActivityIndicator size="large" color="#7E3FE4" />
                      ) : allQuests.length === 0 ? (
                        <View style={{ padding: 40, alignItems: "center" }}>
                          <Target size={48} color="rgba(255, 255, 255, 0.3)" />
                          <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 15, marginTop: 16, textAlign: "center" }}>
                            You don&apos;t have any quests yet. Try creating a custom quest instead!
                          </Text>
                        </View>
                      ) : (
                        <View style={{ gap: 12 }}>
                          {allQuests.map((q) => (
                            <Pressable
                              key={q.quest.id}
                              onPress={() => setSelectedQuestId(q.quest.id)}
                              style={{
                                backgroundColor: selectedQuestId === q.quest.id ? "rgba(126, 63, 228, 0.2)" : "rgba(255, 255, 255, 0.05)",
                                borderRadius: 16,
                                padding: 16,
                                borderWidth: 2,
                                borderColor: selectedQuestId === q.quest.id ? "#7E3FE4" : "rgba(255, 255, 255, 0.1)",
                              }}
                            >
                              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                                <View
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 12,
                                    backgroundColor: selectedQuestId === q.quest.id ? "#7E3FE4" : "rgba(255, 255, 255, 0.1)",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginTop: 2,
                                  }}
                                >
                                  {selectedQuestId === q.quest.id && <Check size={16} color="white" />}
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ color: "white", fontSize: 16, fontWeight: "700", marginBottom: 4 }}>
                                    {q.quest.title}
                                  </Text>
                                  <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 14, marginBottom: 8 }}>
                                    {q.quest.description}
                                  </Text>
                                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                                    <View
                                      style={{
                                        backgroundColor: getDifficultyColor(q.quest.difficulty) + "30",
                                        paddingHorizontal: 10,
                                        paddingVertical: 4,
                                        borderRadius: 8,
                                      }}
                                    >
                                      <Text style={{ color: getDifficultyColor(q.quest.difficulty), fontSize: 12, fontWeight: "600" }}>
                                        {q.quest.difficulty}
                                      </Text>
                                    </View>
                                    <View style={{ backgroundColor: "rgba(0, 217, 255, 0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                                      <Text style={{ color: "#00D9FF", fontSize: 12, fontWeight: "600" }}>
                                        {q.quest.category}
                                      </Text>
                                    </View>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                      <Star size={14} color="#FFD700" />
                                      <Text style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 12 }}>
                                        {q.quest.xpReward} XP
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                              </View>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </>
                  )}

                  {/* Custom Quest Creation */}
                  {creationType === "custom" && (
                    <>
                      <Text style={{ color: "white", fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
                        Describe Your Quest
                      </Text>
                      <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14, marginBottom: 16 }}>
                        Enter a description for the custom group quest. AI safety filters will ensure it&apos;s appropriate.
                      </Text>
                      <TextInput
                        value={customQuestText}
                        onChangeText={setCustomQuestText}
                        placeholder="e.g., Ask 3 strangers for directions to a nearby coffee shop"
                        placeholderTextColor="rgba(255, 255, 255, 0.3)"
                        multiline
                        numberOfLines={4}
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: customQuestText.trim() ? "#7E3FE4" : "rgba(255, 255, 255, 0.1)",
                          padding: 16,
                          color: "white",
                          fontSize: 15,
                          minHeight: 120,
                          textAlignVertical: "top",
                        }}
                      />
                      {customQuestText.trim() && (
                        <View style={{ marginTop: 12, padding: 12, backgroundColor: "rgba(126, 63, 228, 0.1)", borderRadius: 8, borderLeftWidth: 3, borderLeftColor: "#7E3FE4" }}>
                          <Text style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 13 }}>
                            ✓ Quest will be checked by AI safety filters before creation
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}

              {/* Step 2: Assignment Type */}
              {step === 2 && (
                <View style={{ padding: 20 }}>
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "600", marginBottom: 16 }}>
                    Who can join this quest?
                  </Text>
                  <View style={{ gap: 12 }}>
                    <Pressable
                      onPress={() => setAssignmentType("all")}
                      style={{
                        backgroundColor: assignmentType === "all" ? "rgba(126, 63, 228, 0.2)" : "rgba(255, 255, 255, 0.05)",
                        borderRadius: 16,
                        padding: 20,
                        borderWidth: 2,
                        borderColor: assignmentType === "all" ? "#7E3FE4" : "rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: "rgba(0, 217, 255, 0.2)",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Globe size={24} color="#00D9FF" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: "white", fontSize: 18, fontWeight: "700", marginBottom: 4 }}>
                            Open to All
                          </Text>
                          <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 14 }}>
                            Any group member can join this quest
                          </Text>
                        </View>
                        {assignmentType === "all" && (
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: "#7E3FE4",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Check size={16} color="white" />
                          </View>
                        )}
                      </View>
                    </Pressable>

                    <Pressable
                      onPress={() => setAssignmentType("assigned")}
                      style={{
                        backgroundColor: assignmentType === "assigned" ? "rgba(126, 63, 228, 0.2)" : "rgba(255, 255, 255, 0.05)",
                        borderRadius: 16,
                        padding: 20,
                        borderWidth: 2,
                        borderColor: assignmentType === "assigned" ? "#7E3FE4" : "rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: "rgba(255, 215, 0, 0.2)",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <UserCheck size={24} color="#FFD700" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: "white", fontSize: 18, fontWeight: "700", marginBottom: 4 }}>
                            Assigned Only
                          </Text>
                          <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 14 }}>
                            Only specific members can participate
                          </Text>
                        </View>
                        {assignmentType === "assigned" && (
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: "#7E3FE4",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Check size={16} color="white" />
                          </View>
                        )}
                      </View>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Step 3: Select Members (only if assigned) */}
              {step === 3 && (
                <View style={{ padding: 20 }}>
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "600", marginBottom: 16 }}>
                    Select Members ({selectedMemberIds.length} selected)
                  </Text>
                  {membersLoading ? (
                    <ActivityIndicator size="large" color="#7E3FE4" />
                  ) : (
                    <View style={{ gap: 12 }}>
                      {groupData?.group.members
                        ?.filter((m) => m.userId !== sessionData?.user?.id)
                        ?.map((member) => (
                          <Pressable
                            key={member.userId}
                            onPress={() => toggleMember(member.userId)}
                            style={{
                              backgroundColor: selectedMemberIds.includes(member.userId)
                                ? "rgba(126, 63, 228, 0.2)"
                                : "rgba(255, 255, 255, 0.05)",
                              borderRadius: 16,
                              padding: 16,
                              borderWidth: 2,
                              borderColor: selectedMemberIds.includes(member.userId) ? "#7E3FE4" : "rgba(255, 255, 255, 0.1)",
                            }}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                              <View
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 24,
                                  backgroundColor: "#7E3FE4" + "20",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {member.avatar ? (
                                  <Image source={{ uri: member.avatar }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                                ) : (
                                  <Text style={{ fontSize: 18, fontWeight: "bold", color: "#7E3FE4" }}>
                                    {member.displayName.charAt(0).toUpperCase()}
                                  </Text>
                                )}
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>{member.displayName}</Text>
                                <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 13 }}>{member.role}</Text>
                              </View>
                              <View
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 12,
                                  backgroundColor: selectedMemberIds.includes(member.userId) ? "#7E3FE4" : "rgba(255, 255, 255, 0.1)",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {selectedMemberIds.includes(member.userId) && <Check size={16} color="white" />}
                              </View>
                            </View>
                          </Pressable>
                        ))}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Footer Buttons */}
            <View
              style={{
                padding: 20,
                borderTopWidth: 1,
                borderTopColor: "rgba(255, 255, 255, 0.1)",
                gap: 12,
              }}
            >
              {step > 1 && (
                <Pressable
                  onPress={() => setStep((step - 1) as 1 | 2)}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    paddingVertical: 16,
                    borderRadius: 16,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>Back</Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleNext}
                disabled={
                  createMutation.isPending ||
                  (step === 1 && !selectedQuestId) ||
                  (step === 3 && selectedMemberIds.length === 0)
                }
                style={{
                  backgroundColor:
                    (step === 1 && !selectedQuestId) || (step === 3 && selectedMemberIds.length === 0)
                      ? "rgba(126, 63, 228, 0.3)"
                      : "#7E3FE4",
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: "center",
                  opacity: createMutation.isPending ? 0.7 : 1,
                }}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                    {step === 2 && assignmentType === "all" ? "Create Quest" : step === 3 ? "Create Quest" : "Next"}
                  </Text>
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

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

  // Join group quest mutation
  const joinQuestMutation = useMutation({
    mutationFn: async (groupQuestId: string) => {
      return api.post(`/api/group-quests/${groupQuestId}/join`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-quests", groupId] });
      Alert.alert("Success", "Joined group quest! You can now start it.");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to join group quest");
    },
  });

  const handleJoinQuest = (groupQuestId: string) => {
    joinQuestMutation.mutate(groupQuestId);
  };

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

                  {/* Participants - WhatsApp Style */}
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: "rgba(255, 255, 255, 0.1)",
                      paddingTop: 12,
                    }}
                  >
                    {/* Participant Count and Status */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
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

                    {/* WhatsApp-style Overlapping Avatars */}
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                      {gq.participants.slice(0, 5).map((participant, index) => (
                        <View
                          key={participant.id}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: "#0A0A0F",
                            alignItems: "center",
                            justifyContent: "center",
                            marginLeft: index === 0 ? 0 : -12,
                            borderWidth: 2,
                            borderColor: "#0A0A0F",
                            position: "relative",
                            zIndex: 10 - index,
                          }}
                        >
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: getStatusColor(participant.status) + "30",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                            }}
                          >
                            {participant.avatar ? (
                              <Image
                                source={{ uri: participant.avatar }}
                                style={{ width: 40, height: 40, borderRadius: 20 }}
                              />
                            ) : (
                              <Text style={{ color: getStatusColor(participant.status), fontSize: 16, fontWeight: "700" }}>
                                {participant.displayName.charAt(0).toUpperCase()}
                              </Text>
                            )}
                          </View>
                          {/* Status Badge */}
                          <View
                            style={{
                              position: "absolute",
                              bottom: 0,
                              right: 0,
                              width: 16,
                              height: 16,
                              borderRadius: 8,
                              backgroundColor: "#0A0A0F",
                              alignItems: "center",
                              justifyContent: "center",
                              borderWidth: 1.5,
                              borderColor: getStatusColor(participant.status),
                            }}
                          >
                            {participant.status === "completed" && (
                              <CheckCircle size={10} color="#10B981" fill="#10B981" />
                            )}
                            {participant.status === "failed" && (
                              <XCircle size={10} color="#FF3B30" fill="#FF3B30" />
                            )}
                            {participant.status === "in_progress" && (
                              <Clock size={10} color="#00D9FF" fill="#00D9FF" />
                            )}
                          </View>
                        </View>
                      ))}
                      {gq.participants.length > 5 && (
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: "rgba(126, 63, 228, 0.2)",
                            alignItems: "center",
                            justifyContent: "center",
                            marginLeft: -12,
                            borderWidth: 2,
                            borderColor: "#0A0A0F",
                          }}
                        >
                          <Text style={{ color: "#7E3FE4", fontSize: 13, fontWeight: "700" }}>
                            +{gq.participants.length - 5}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Progress Summary */}
                    {gq.participants.length > 0 && (
                      <View style={{ backgroundColor: "rgba(255, 255, 255, 0.03)", padding: 10, borderRadius: 10, marginBottom: 12 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around" }}>
                          <View style={{ alignItems: "center" }}>
                            <Text style={{ color: "#10B981", fontSize: 18, fontWeight: "700" }}>
                              {gq.participants.filter((p) => p.status === "completed").length}
                            </Text>
                            <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 11 }}>Completed</Text>
                          </View>
                          <View style={{ width: 1, height: 30, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
                          <View style={{ alignItems: "center" }}>
                            <Text style={{ color: "#00D9FF", fontSize: 18, fontWeight: "700" }}>
                              {gq.participants.filter((p) => p.status === "in_progress").length}
                            </Text>
                            <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 11 }}>In Progress</Text>
                          </View>
                          <View style={{ width: 1, height: 30, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
                          <View style={{ alignItems: "center" }}>
                            <Text style={{ color: "#FF3B30", fontSize: 18, fontWeight: "700" }}>
                              {gq.participants.filter((p) => p.status === "failed").length}
                            </Text>
                            <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 11 }}>Failed</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* User Actions */}
                    {!gq.userParticipation && (
                      <Pressable
                        onPress={() => handleJoinQuest(gq.id)}
                        disabled={joinQuestMutation.isPending}
                        style={{
                          backgroundColor: "#7E3FE4",
                          paddingVertical: 12,
                          borderRadius: 12,
                          alignItems: "center",
                          opacity: joinQuestMutation.isPending ? 0.7 : 1,
                        }}
                      >
                        {joinQuestMutation.isPending ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Text style={{ color: "white", fontSize: 14, fontWeight: "700" }}>Join Quest</Text>
                        )}
                      </Pressable>
                    )}
                    {gq.userParticipation && gq.userParticipation.status === "joined" && (
                      <Pressable
                        onPress={() => {
                          Alert.alert("Start Quest", "Group quest starting functionality will navigate to quest detail screen (coming soon!)");
                        }}
                        style={{
                          backgroundColor: "#10B981",
                          paddingVertical: 12,
                          borderRadius: 12,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: "white", fontSize: 14, fontWeight: "700" }}>Start Quest</Text>
                      </Pressable>
                    )}
                    {gq.userParticipation && gq.userParticipation.status === "in_progress" && (
                      <Pressable
                        onPress={() => {
                          Alert.alert("Continue Quest", "Group quest detail screen coming soon!");
                        }}
                        style={{
                          backgroundColor: "#00D9FF",
                          paddingVertical: 12,
                          borderRadius: 12,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: "white", fontSize: 14, fontWeight: "700" }}>Continue Quest</Text>
                      </Pressable>
                    )}
                    {gq.userParticipation && gq.userParticipation.status === "completed" && (
                      <View
                        style={{
                          backgroundColor: "rgba(16, 185, 129, 0.2)",
                          paddingVertical: 12,
                          borderRadius: 12,
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: "#10B981",
                        }}
                      >
                        <Text style={{ color: "#10B981", fontSize: 14, fontWeight: "700" }}>✓ Completed</Text>
                      </View>
                    )}
                    {gq.userParticipation && gq.userParticipation.status === "failed" && (
                      <View
                        style={{
                          backgroundColor: "rgba(255, 59, 48, 0.2)",
                          paddingVertical: 12,
                          borderRadius: 12,
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: "#FF3B30",
                        }}
                      >
                        <Text style={{ color: "#FF3B30", fontSize: 14, fontWeight: "700" }}>✗ Failed</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Create Quest Modal */}
      <CreateGroupQuestModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        groupId={groupId}
        onSuccess={() => {
          setShowCreateModal(false);
          refetch();
        }}
      />
    </View>
  );
}
