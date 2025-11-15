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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";

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
      Alert.alert("Success", "Invitation sent successfully!");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to send invitation");
    },
  });

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
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Cover Image */}
          {group.coverImage && (
            <Image
              source={{ uri: group.coverImage }}
              style={{ width: "100%", height: 200 }}
              resizeMode="cover"
            />
          )}

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
              {/* Invite Members Button */}
              {isModerator && (
                <Pressable
                  onPress={() => setShowInviteModal(true)}
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
                    Invite Members
                  </Text>
                </Pressable>
              )}

              {/* Group Live Button */}
              <Pressable
                onPress={() => {
                  // TODO: Navigate to group live screen
                  Alert.alert("Coming Soon", "Group live streaming is being developed!");
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
                  // TODO: Navigate to group quests screen
                  Alert.alert("Coming Soon", "Group quests are being developed!");
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

            {/* Members Section */}
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
    </View>
  );
}
