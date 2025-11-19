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
  Check,
  UserPlus,
  Mail,
  CreditCard,
  Calendar,
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

  // Debug logging - moved to top level to comply with React hooks rules
  React.useEffect(() => {
    console.log("[AdminScreen] Rendering - sessionData:", !!sessionData?.user);
  }, [sessionData]);

  // Check if current user is admin
  const { data: profileData } = useQuery<GetProfileResponse>({
    queryKey: ["profile"],
    queryFn: async () => {
      return api.get("/api/profile");
    },
    enabled: !!sessionData?.user,
  });

  // Check if user is admin
  const isAdmin = profileData?.isAdmin || false;

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
        limit: "20",
        ...(searchQuery && { search: searchQuery }),
      });
      return api.get<{ users: User[]; total: number; page: number; limit: number; totalPages: number }>(
        `/api/admin/users?${params.toString()}`
      );
    },
    enabled: !!sessionData?.user && isAdmin,
    retry: false,
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.delete(`/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
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

  const manageSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, action, days }: { userId: string; action: string; days?: number }) => {
      return api.post(`/api/admin/users/${userId}/subscription`, { action, days });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", data.message || "Subscription updated");
      setSelectedUser(null);
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to manage subscription");
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
    ? colors.background as readonly [string, string, ...string[]]
    : ["#0A0A0F", "#1A1A24", "#2A1A34"] as const;

  if (isLoadingProfile) {
    return (
      <LinearGradient colors={backgroundColors} className="flex-1">
        <SafeAreaView edges={["top"]} className="flex-1">
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#7E3FE4" />
            <Text className="text-base mt-4" style={{ color: colors.textSecondary || "#999" }}>
              Loading...
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!isAdmin) {
    return (
      <LinearGradient colors={backgroundColors} className="flex-1">
        <SafeAreaView edges={["top"]} className="flex-1">
          <View className="flex-1 items-center justify-center px-6">
            <Shield size={64} color={colors.error || "#ef4444"} className="mb-4" />
            <Text className="text-2xl font-bold mb-2 text-center" style={{ color: colors.text || "#fff" }}>
              Access Denied
            </Text>
            <Text className="text-base text-center" style={{ color: colors.textSecondary || "#999" }}>
              You need admin privileges to access this page.
            </Text>
            <Pressable
              onPress={() => navigation.goBack()}
              className="mt-6 px-6 py-3 rounded-xl"
              style={{ backgroundColor: colors.primary || "#7E3FE4" }}
            >
              <Text className="text-white font-semibold">Go Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={backgroundColors} className="flex-1">
      <SafeAreaView edges={["top"]} className="flex-1" style={{ flex: 1 }}>
        {/* Header */}
        <View
          className="flex-row items-center px-6 py-4 border-b"
          style={{ borderBottomColor: "rgba(255, 255, 255, 0.1)" }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full mr-3"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>
          <View className="flex-1 flex-row items-center">
            <Shield size={24} color="#7E3FE4" className="mr-3" />
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              Admin Panel
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-6 py-4"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />}
        >
          {/* Invite Admin Section */}
          <View
            className="p-4 rounded-2xl mb-6"
            style={{ backgroundColor: "rgba(126, 63, 228, 0.15)", borderWidth: 1, borderColor: "#7E3FE4" }}
          >
            <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>
              Invite Admin
            </Text>
            <View className="flex-row gap-2">
              <TextInput
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="Enter email address"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                className="flex-1 py-3 px-4 rounded-xl"
                style={{
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
                className="px-6 py-3 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: "#7E3FE4",
                  opacity: inviteAdminMutation.isPending || !inviteEmail.trim() ? 0.5 : 1,
                }}
              >
                {inviteAdminMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <UserPlus size={20} color="white" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Search */}
          <View className="mb-4">
            <View
              className="flex-row items-center px-4 py-3 rounded-xl"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Search size={20} color={colors.textSecondary} className="mr-3" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search users by email or name..."
                placeholderTextColor={colors.textTertiary}
                className="flex-1"
                style={{ color: colors.text }}
              />
            </View>
          </View>

          {/* Error Message */}
          {usersError && (
            <View
              className="p-4 rounded-2xl mb-4"
              style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", borderWidth: 1, borderColor: "#ef4444" }}
            >
              <Text className="text-base font-semibold mb-1" style={{ color: "#ef4444" }}>
                Error Loading Users
              </Text>
              <Text className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                {(() => {
                  const error = usersError as any;
                  if (error?.message) {
                    // Extract a cleaner error message
                    const msg = error.message;
                    if (msg.includes("403") || msg.includes("Forbidden")) {
                      return "Access denied. Please ensure you have admin privileges.";
                    }
                    if (msg.includes("401") || msg.includes("Unauthorized")) {
                      return "Please log in again to access the admin panel.";
                    }
                    if (msg.includes("Network") || msg.includes("Connection")) {
                      return "Network error. Please check your connection and try again.";
                    }
                    return msg;
                  }
                  return "Failed to load users. Please try again.";
                })()}
              </Text>
              <Pressable
                onPress={() => refetch()}
                className="mt-3 py-2 px-4 rounded-xl items-center"
                style={{ backgroundColor: "#ef4444" }}
              >
                <Text className="text-white font-semibold">Retry</Text>
              </Pressable>
            </View>
          )}

          {/* Users List */}
          {isLoading ? (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color="#7E3FE4" />
              <Text className="text-sm mt-4" style={{ color: colors.textSecondary }}>
                Loading users...
              </Text>
            </View>
          ) : usersError ? null : (
            <>
              <Text className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                {usersData?.total || 0} total users
              </Text>
              {usersData?.users && usersData.users.length > 0 ? (
                <View className="gap-3">
                  {usersData.users.map((user) => (
                    <View
                      key={user.id}
                    className="p-4 rounded-2xl"
                    style={{
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="text-base font-bold" style={{ color: colors.text }}>
                            {user.profile?.displayName || user.name || user.email}
                          </Text>
                          {user.isAdmin && (
                            <View
                              className="px-2 py-1 rounded"
                              style={{ backgroundColor: "rgba(126, 63, 228, 0.2)" }}
                            >
                              <Text className="text-xs font-semibold" style={{ color: "#7E3FE4" }}>
                                ADMIN
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-sm" style={{ color: colors.textSecondary }}>
                          {user.email}
                        </Text>
                        {user.profile?.username && (
                          <Text className="text-sm" style={{ color: colors.textSecondary }}>
                            @{user.profile.username}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Stats */}
                    {user.stats && (
                      <View className="flex-row gap-4 mb-3">
                        <View>
                          <Text className="text-xs" style={{ color: colors.textSecondary }}>
                            XP
                          </Text>
                          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                            {user.stats.totalXP}
                          </Text>
                        </View>
                        <View>
                          <Text className="text-xs" style={{ color: colors.textSecondary }}>
                            Streak
                          </Text>
                          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                            {user.stats.currentStreak} days
                          </Text>
                        </View>
                        {user.subscription && (
                          <View>
                            <Text className="text-xs" style={{ color: colors.textSecondary }}>
                              Subscription
                            </Text>
                            <Text className="text-sm font-semibold" style={{ color: "#10b981" }}>
                              {user.subscription.status}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Actions */}
                    <View className="flex-row gap-2 mt-3">
                      {!user.isAdmin && (
                        <Pressable
                          onPress={() => handleMakeAdmin(user)}
                          disabled={makeAdminMutation.isPending}
                          className="flex-1 py-2 px-4 rounded-xl items-center"
                          style={{
                            backgroundColor: "rgba(126, 63, 228, 0.2)",
                            opacity: makeAdminMutation.isPending ? 0.5 : 1,
                          }}
                        >
                          <Crown size={16} color="#7E3FE4" />
                        </Pressable>
                      )}
                      {user.subscription && (
                        <Pressable
                          onPress={() => setSelectedUser(user)}
                          className="flex-1 py-2 px-4 rounded-xl items-center flex-row justify-center gap-2"
                          style={{ backgroundColor: "rgba(0, 217, 255, 0.2)" }}
                        >
                          <CreditCard size={16} color="#00D9FF" />
                          <Text className="text-xs font-semibold" style={{ color: "#00D9FF" }}>
                            Subscription
                          </Text>
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => {
                          setEmailRecipient(user);
                          setShowEmailModal(true);
                        }}
                        className="py-2 px-4 rounded-xl items-center"
                        style={{ backgroundColor: "rgba(126, 63, 228, 0.2)" }}
                      >
                        <Mail size={16} color="#7E3FE4" />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteUser(user)}
                        disabled={deleteUserMutation.isPending}
                        className="py-2 px-4 rounded-xl items-center"
                        style={{
                          backgroundColor: "rgba(239, 68, 68, 0.2)",
                          opacity: deleteUserMutation.isPending ? 0.5 : 1,
                        }}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </Pressable>
                    </View>
                  </View>
                  ))}
                </View>
              ) : (
                <View className="py-20 items-center">
                  <Text className="text-base" style={{ color: colors.textSecondary }}>
                    No users found
                  </Text>
                </View>
              )}

              {/* Pagination */}
              {usersData && usersData.totalPages > 1 && (
                <View className="flex-row justify-center items-center gap-4 mt-6">
                  <Pressable
                    onPress={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-xl"
                    style={{
                      backgroundColor: page === 1 ? "transparent" : colors.primary,
                      opacity: page === 1 ? 0.5 : 1,
                    }}
                  >
                    <Text style={{ color: page === 1 ? colors.textSecondary : "white" }}>Previous</Text>
                  </Pressable>
                  <Text style={{ color: colors.text }}>
                    Page {page} of {usersData.totalPages}
                  </Text>
                  <Pressable
                    onPress={() => setPage(Math.min(usersData.totalPages, page + 1))}
                    disabled={page === usersData.totalPages}
                    className="px-4 py-2 rounded-xl"
                    style={{
                      backgroundColor: page === usersData.totalPages ? "transparent" : colors.primary,
                      opacity: page === usersData.totalPages ? 0.5 : 1,
                    }}
                  >
                    <Text style={{ color: page === usersData.totalPages ? colors.textSecondary : "white" }}>
                      Next
                    </Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Subscription Management Modal */}
        {selectedUser && (
          <View
            className="absolute inset-0 items-center justify-center"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
          >
            <View
              className="w-11/12 p-6 rounded-2xl"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold" style={{ color: colors.text }}>
                  Manage Subscription
                </Text>
                <Pressable onPress={() => setSelectedUser(null)}>
                  <X size={24} color={colors.textSecondary} />
                </Pressable>
              </View>
              <Text className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                {selectedUser.email}
              </Text>
              <View className="gap-3">
                <Pressable
                  onPress={() => {
                    manageSubscriptionMutation.mutate({ userId: selectedUser.id, action: "activate" });
                  }}
                  className="py-3 px-4 rounded-xl items-center"
                  style={{ backgroundColor: "#10b981" }}
                >
                  <Text className="text-white font-semibold">Activate Subscription</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    manageSubscriptionMutation.mutate({ userId: selectedUser.id, action: "cancel" });
                  }}
                  className="py-3 px-4 rounded-xl items-center"
                  style={{ backgroundColor: "#ef4444" }}
                >
                  <Text className="text-white font-semibold">Cancel Subscription</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Alert.prompt(
                      "Extend Subscription",
                      "Enter number of days to extend:",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Extend",
                          onPress: (days) => {
                            if (days && !isNaN(parseInt(days))) {
                              manageSubscriptionMutation.mutate({
                                userId: selectedUser.id,
                                action: "extend",
                                days: parseInt(days),
                              });
                            }
                          },
                        },
                      ],
                      "plain-text",
                      "30"
                    );
                  }}
                  className="py-3 px-4 rounded-xl items-center"
                  style={{ backgroundColor: "#7E3FE4" }}
                >
                  <Text className="text-white font-semibold">Extend Subscription</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Email Modal */}
        {showEmailModal && emailRecipient && (
          <View
            className="absolute inset-0 items-center justify-center"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
          >
            <View
              className="w-11/12 p-6 rounded-2xl max-h-[90%]"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold" style={{ color: colors.text }}>
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
              <Text className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                To: {emailRecipient.email}
              </Text>
              <TextInput
                value={emailSubject}
                onChangeText={setEmailSubject}
                placeholder="Subject"
                placeholderTextColor={colors.textTertiary}
                className="py-3 px-4 rounded-xl mb-4"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: colors.text,
                }}
              />
              <TextInput
                value={emailBody}
                onChangeText={setEmailBody}
                placeholder="Email body (HTML supported)"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={10}
                textAlignVertical="top"
                className="py-3 px-4 rounded-xl mb-4"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: colors.text,
                  minHeight: 200,
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
                className="py-3 px-4 rounded-xl items-center"
                style={{
                  backgroundColor: "#7E3FE4",
                  opacity: sendEmailMutation.isPending || !emailSubject.trim() || !emailBody.trim() ? 0.5 : 1,
                }}
              >
                {sendEmailMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-semibold">Send Email</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

