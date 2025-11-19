import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Shield,
  Search,
  Trash2,
  Crown,
  X,
  Users,
  TrendingUp,
  AlertCircle,
  Mail,
  CreditCard,
  Activity,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useSession } from "@/lib/useSession";
import type { RootStackScreenProps } from "@/navigation/types";
import type { GetProfileResponse } from "@/shared/contracts";

type Props = RootStackScreenProps<"Admin">;

interface User {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  createdAt: string;
  profile: {
    displayName: string;
    username: string | null;
    createdAt: string;
  } | null;
  subscription: {
    status: string;
    plan: string;
    currentPeriodEnd: string | null;
  } | null;
  stats: {
    totalXP: number;
    currentStreak: number;
    createdAt: string;
  } | null;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  subscribedUsers: number;
  adminCount: number;
}

export default function AdminScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { data: sessionData } = useSession();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailRecipient, setEmailRecipient] = useState<User | null>(null);

  // Check if current user is admin
  const { data: profileData } = useQuery<GetProfileResponse>({
    queryKey: ["profile"],
    queryFn: async () => {
      return api.get("/api/profile");
    },
    enabled: !!sessionData?.user,
  });

  const isAdmin = profileData?.isAdmin || false;

  // Fetch admin stats
  const { data: adminStats } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      return api.get<AdminStats>("/api/admin/stats");
    },
    enabled: isAdmin,
  });

  // Fetch users
  const {
    data: usersData,
    isLoading,
    error: usersError,
    refetch,
  } = useQuery<{ users: User[]; total: number; page: number; limit: number; totalPages: number }>({
    queryKey: ["admin-users", page, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        ...(searchQuery && { search: searchQuery }),
      });
      return api.get<{ users: User[]; total: number; page: number; limit: number; totalPages: number }>(
        `/api/admin/users?${params.toString()}`
      );
    },
    enabled: isAdmin,
    retry: false,
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.delete(`/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "User deleted successfully");
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to delete user");
    },
  });

  const makeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.post(`/api/admin/users/${userId}/make-admin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "User is now an admin");
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to make user admin");
    },
  });

  const inviteAdminMutation = useMutation({
    mutationFn: async (email: string) => {
      return api.post("/api/admin/invite-admin", { email });
    },
    onSuccess: (data: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", data.message || "Admin invitation sent");
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to invite admin");
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async ({ userId, subject, html }: { userId: string; subject: string; html: string }) => {
      return api.post("/api/admin/send-email", { userId, subject, html });
    },
    onSuccess: (data: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", data.message || "Email sent successfully");
      setShowEmailModal(false);
      setEmailSubject("");
      setEmailBody("");
      setEmailRecipient(null);
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to send email");
    },
  });

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to delete ${user.email}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteUserMutation.mutate(user.id),
        },
      ]
    );
  };

  const handleMakeAdmin = (user: User) => {
    Alert.alert("Make Admin", `Make ${user.email} an admin?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Make Admin",
        onPress: () => makeAdminMutation.mutate(user.id),
      },
    ]);
  };

  const isLoadingProfile = !profileData && !!sessionData?.user;

  // Ensure background is an array for LinearGradient
  const backgroundColors: readonly [string, string, ...string[]] = Array.isArray(colors.background)
    ? (colors.background as readonly [string, string, ...string[]])
    : (["#0A0A0F", "#1A1A24", "#2A1A34"] as const);

  if (isLoadingProfile) {
    return (
      <LinearGradient colors={backgroundColors} style={{ flex: 1 }}>
        <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#7E3FE4" />
            <Text style={{ color: colors.textSecondary || "#999", marginTop: 16, fontSize: 16 }}>
              Loading...
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!isAdmin) {
    return (
      <LinearGradient colors={backgroundColors} style={{ flex: 1 }}>
        <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
            <Shield size={64} color={colors.error || "#ef4444"} style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8, textAlign: "center", color: colors.text || "#fff" }}>
              Access Denied
            </Text>
            <Text style={{ fontSize: 16, textAlign: "center", color: colors.textSecondary || "#999", marginBottom: 32 }}>
              You need admin privileges to access this page.
            </Text>
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ backgroundColor: colors.primary || "#7E3FE4", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
            >
              <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>Go Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={backgroundColors} style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <ArrowLeft size={20} color={colors.text || "#fff"} />
          </Pressable>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Shield size={24} color="#7E3FE4" style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.text || "#fff" }}>
              Admin Panel
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Stats Dashboard */}
          {adminStats && (
            <View style={{ paddingHorizontal: 20, paddingTop: 20, marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 12 }}>
                Dashboard
              </Text>
              <View style={{ gap: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: "rgba(126, 63, 228, 0.15)",
                    borderWidth: 1,
                    borderColor: "#7E3FE4",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                      Total Users
                    </Text>
                    <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.text }}>
                      {adminStats.totalUsers}
                    </Text>
                  </View>
                  <Users size={32} color="#7E3FE4" />
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      padding: 16,
                      borderRadius: 16,
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      borderWidth: 1,
                      borderColor: "#10b981",
                    }}
                  >
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                      Active Users
                    </Text>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: "#10b981" }}>
                      {adminStats.activeUsers}
                    </Text>
                  </View>

                  <View
                    style={{
                      flex: 1,
                      padding: 16,
                      borderRadius: 16,
                      backgroundColor: "rgba(0, 217, 255, 0.15)",
                      borderWidth: 1,
                      borderColor: "#00D9FF",
                    }}
                  >
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                      Subscribed
                    </Text>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: "#00D9FF" }}>
                      {adminStats.subscribedUsers}
                    </Text>
                  </View>

                  <View
                    style={{
                      flex: 1,
                      padding: 16,
                      borderRadius: 16,
                      backgroundColor: "rgba(255, 107, 53, 0.15)",
                      borderWidth: 1,
                      borderColor: "#FF6B35",
                    }}
                  >
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                      Admins
                    </Text>
                    <Text style={{ fontSize: 24, fontWeight: "bold", color: "#FF6B35" }}>
                      {adminStats.adminCount}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Invite Admin Section */}
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 12 }}>
              Manage Admins
            </Text>
            <View
              style={{
                padding: 16,
                borderRadius: 16,
                backgroundColor: "rgba(126, 63, 228, 0.15)",
                borderWidth: 1,
                borderColor: "#7E3FE4",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 12 }}>
                Invite Admin
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  placeholder="Enter email address"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    color: colors.text,
                  }}
                />
                <Pressable
                  onPress={() => {
                    if (inviteEmail.trim()) {
                      inviteAdminMutation.mutate(inviteEmail.trim());
                    }
                  }}
                  disabled={inviteAdminMutation.isPending || !inviteEmail.trim()}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: "#7E3FE4",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: inviteAdminMutation.isPending || !inviteEmail.trim() ? 0.5 : 1,
                  }}
                >
                  {inviteAdminMutation.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Shield size={20} color="white" />
                  )}
                </Pressable>
              </View>
            </View>
          </View>

          {/* Users Management */}
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 12 }}>
              Manage Users
            </Text>

            {/* Search */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                marginBottom: 16,
              }}
            >
              <Search size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by email or name..."
                placeholderTextColor={colors.textTertiary}
                style={{ flex: 1, color: colors.text, paddingVertical: 8, fontSize: 14 }}
              />
            </View>

            {/* Error Message */}
            {usersError && (
              <View
                style={{
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  borderWidth: 1,
                  borderColor: "#ef4444",
                  marginBottom: 16,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <AlertCircle size={20} color="#ef4444" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#ef4444", flex: 1 }}>
                    Error Loading Users
                  </Text>
                </View>
                <Pressable
                  onPress={() => refetch()}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: "#ef4444",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "600", fontSize: 12 }}>Retry</Text>
                </Pressable>
              </View>
            )}

            {/* Users List */}
            {isLoading ? (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#7E3FE4" />
                <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>
                  Loading users...
                </Text>
              </View>
            ) : !usersData || usersData.users.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <Text style={{ color: colors.text, fontSize: 16, marginBottom: 8 }}>
                  No users found
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                  {searchQuery ? "Try a different search" : "No users in system"}
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  {usersData?.total || 0} users total
                </Text>
                {usersData?.users.map((user) => (
                  <View
                    key={user.id}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text, flex: 1 }}>
                            {user.profile?.displayName || user.name || user.email}
                          </Text>
                          {user.isAdmin && (
                            <View
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 6,
                                backgroundColor: "rgba(126, 63, 228, 0.2)",
                              }}
                            >
                              <Text style={{ fontSize: 10, fontWeight: "600", color: "#7E3FE4" }}>
                                ADMIN
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                          {user.email}
                        </Text>
                      </View>
                    </View>

                    {/* Stats Row */}
                    {user.stats && (
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 16,
                          paddingVertical: 12,
                          borderTopWidth: 1,
                          borderTopColor: "rgba(255, 255, 255, 0.1)",
                          marginBottom: 12,
                        }}
                      >
                        <View>
                          <Text style={{ fontSize: 11, color: colors.textSecondary }}>XP</Text>
                          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                            {user.stats.totalXP}
                          </Text>
                        </View>
                        <View>
                          <Text style={{ fontSize: 11, color: colors.textSecondary }}>Streak</Text>
                          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                            {user.stats.currentStreak}d
                          </Text>
                        </View>
                        {user.subscription && (
                          <View>
                            <Text style={{ fontSize: 11, color: colors.textSecondary }}>Status</Text>
                            <Text style={{ fontSize: 13, fontWeight: "600", color: "#10b981" }}>
                              {user.subscription.status}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Actions */}
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {!user.isAdmin && (
                        <Pressable
                          onPress={() => handleMakeAdmin(user)}
                          disabled={makeAdminMutation.isPending}
                          style={{
                            flex: 1,
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                            backgroundColor: "rgba(126, 63, 228, 0.2)",
                            alignItems: "center",
                            opacity: makeAdminMutation.isPending ? 0.5 : 1,
                          }}
                        >
                          <Crown size={16} color="#7E3FE4" />
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => {
                          setEmailRecipient(user);
                          setShowEmailModal(true);
                        }}
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                          backgroundColor: "rgba(126, 63, 228, 0.2)",
                          alignItems: "center",
                        }}
                      >
                        <Mail size={16} color="#7E3FE4" />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteUser(user)}
                        disabled={deleteUserMutation.isPending}
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                          backgroundColor: "rgba(239, 68, 68, 0.2)",
                          alignItems: "center",
                          opacity: deleteUserMutation.isPending ? 0.5 : 1,
                        }}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </Pressable>
                    </View>
                  </View>
                ))}

                {/* Pagination */}
                {usersData && usersData.totalPages > 1 && (
                  <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 20 }}>
                    <Pressable
                      onPress={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: page === 1 ? "transparent" : colors.primary,
                        opacity: page === 1 ? 0.5 : 1,
                      }}
                    >
                      <Text style={{ color: page === 1 ? colors.textSecondary : "white", fontWeight: "600" }}>
                        Previous
                      </Text>
                    </Pressable>
                    <Text style={{ color: colors.text, fontWeight: "600" }}>
                      Page {page} of {usersData.totalPages}
                    </Text>
                    <Pressable
                      onPress={() => setPage(Math.min(usersData.totalPages, page + 1))}
                      disabled={page === usersData.totalPages}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: page === usersData.totalPages ? "transparent" : colors.primary,
                        opacity: page === usersData.totalPages ? 0.5 : 1,
                      }}
                    >
                      <Text style={{ color: page === usersData.totalPages ? colors.textSecondary : "white", fontWeight: "600" }}>
                        Next
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Email Modal */}
        {showEmailModal && emailRecipient && (
          <View
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 20,
            }}
          >
            <View
              style={{
                width: "100%",
                maxWidth: 400,
                maxHeight: "90%",
                padding: 20,
                borderRadius: 16,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text }}>
                  Send Email
                </Text>
                <Pressable
                  onPress={() => {
                    setShowEmailModal(false);
                    setEmailSubject("");
                    setEmailBody("");
                    setEmailRecipient(null);
                  }}
                >
                  <X size={24} color={colors.textSecondary} />
                </Pressable>
              </View>

              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 16 }}>
                To: {emailRecipient.email}
              </Text>

              <TextInput
                value={emailSubject}
                onChangeText={setEmailSubject}
                placeholder="Subject"
                placeholderTextColor={colors.textTertiary}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: colors.text,
                  marginBottom: 12,
                  fontSize: 14,
                }}
              />

              <TextInput
                value={emailBody}
                onChangeText={setEmailBody}
                placeholder="Email body (HTML supported)"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: colors.text,
                  minHeight: 150,
                  marginBottom: 16,
                  fontSize: 14,
                }}
              />

              <Pressable
                onPress={() => {
                  if (emailSubject.trim() && emailBody.trim()) {
                    sendEmailMutation.mutate({
                      userId: emailRecipient.id,
                      subject: emailSubject.trim(),
                      html: emailBody.trim(),
                    });
                  } else {
                    Alert.alert("Error", "Please fill in both subject and body");
                  }
                }}
                disabled={sendEmailMutation.isPending || !emailSubject.trim() || !emailBody.trim()}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: "#7E3FE4",
                  alignItems: "center",
                  opacity: sendEmailMutation.isPending || !emailSubject.trim() || !emailBody.trim() ? 0.5 : 1,
                }}
              >
                {sendEmailMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>Send Email</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}
