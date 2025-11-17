import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Mail, UserPlus, Send, CheckCircle } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import { useTheme } from "@/contexts/ThemeContext";

type Props = NativeStackScreenProps<RootStackParamList, "InviteWarriors">;

export default function InviteWarriorsScreen({ navigation }: Props) {
  const { data: sessionData } = useSession();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendInvite = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter an email address");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setSending(true);
    try {
      // Send invite via GoHighLevel
      const response = await api.post("/api/gohighlevel/send-invite", {
        email: email.trim(),
        name: name.trim(),
        inviterName: sessionData?.user?.name || "A Rejection Hero",
      });

      setSent(true);
      setTimeout(() => {
        setEmail("");
        setName("");
        setSent(false);
      }, 2000);
    } catch (error: any) {
      console.error("Failed to send invite:", error);
      Alert.alert(
        "Failed to Send Invite",
        error?.message || "Could not send the invite. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
      <LinearGradient colors={colors.background as any} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.cardBorder,
            }}
          >
            <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
              <ArrowLeft size={24} color={colors.text} />
            </Pressable>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.text, flex: 1 }}>
              Invite Warriors
            </Text>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Hero Section */}
            <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 20,
                  padding: 24,
                  borderWidth: 2,
                  borderColor: "rgba(126, 63, 228, 0.4)",
                  shadowColor: "#7E3FE4",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                  alignItems: "center",
                }}
              >
                <LinearGradient
                  colors={["#FF6B35", "#FFD700", "#00D9FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <View
                    style={{
                      width: 74,
                      height: 74,
                      borderRadius: 37,
                      backgroundColor: "#1A1A24",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <UserPlus size={36} color="#FFD700" />
                  </View>
                </LinearGradient>

                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "bold",
                    color: "white",
                    textAlign: "center",
                    marginBottom: 8,
                  }}
                >
                  Build Your Warrior Tribe
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    color: "rgba(255, 255, 255, 0.7)",
                    textAlign: "center",
                    lineHeight: 22,
                  }}
                >
                  Invite friends to join Rejection Hero and grow together. Every warrior you invite
                  strengthens the community!
                </Text>
              </View>
            </View>

            {/* Invite Form */}
            <View style={{ paddingHorizontal: 20, paddingTop: 32 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "white",
                  marginBottom: 16,
                }}
              >
                Send an Invite
              </Text>

              {/* Name Input */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "rgba(255, 255, 255, 0.8)",
                    marginBottom: 8,
                  }}
                >
                  Friend&apos;s Name
                </Text>
                <View
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                  }}
                >
                  <UserPlus size={20} color="rgba(255, 255, 255, 0.5)" />
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter their name"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    style={{
                      flex: 1,
                      color: "white",
                      fontSize: 16,
                      paddingVertical: 16,
                      paddingHorizontal: 12,
                    }}
                  />
                </View>
              </View>

              {/* Email Input */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "rgba(255, 255, 255, 0.8)",
                    marginBottom: 8,
                  }}
                >
                  Friend&apos;s Email
                </Text>
                <View
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                  }}
                >
                  <Mail size={20} color="rgba(255, 255, 255, 0.5)" />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="friend@example.com"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{
                      flex: 1,
                      color: "white",
                      fontSize: 16,
                      paddingVertical: 16,
                      paddingHorizontal: 12,
                    }}
                  />
                </View>
              </View>

              {/* Send Button */}
              <Pressable
                onPress={handleSendInvite}
                disabled={sending || sent}
                style={{
                  borderRadius: 16,
                  padding: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: sent ? "#4CAF50" : "#FF6B35",
                  shadowColor: sent ? "#4CAF50" : "#FF6B35",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 6,
                  opacity: sending ? 0.7 : 1,
                }}
              >
                {sending ? (
                  <ActivityIndicator color="white" />
                ) : sent ? (
                  <>
                    <CheckCircle size={24} color="white" />
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: "white",
                        marginLeft: 12,
                      }}
                    >
                      Invite Sent!
                    </Text>
                  </>
                ) : (
                  <>
                    <Send size={24} color="white" />
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: "white",
                        marginLeft: 12,
                      }}
                    >
                      Send Invite
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Benefits Section */}
            <View style={{ paddingHorizontal: 20, paddingTop: 40 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "white",
                  marginBottom: 16,
                }}
              >
                Why Invite Friends?
              </Text>

              <View style={{ gap: 12 }}>
                {[
                  {
                    icon: "🎯",
                    title: "Shared Journey",
                    desc: "Grow together and support each other through challenges",
                  },
                  {
                    icon: "🏆",
                    title: "Friendly Competition",
                    desc: "Compete on leaderboards and celebrate victories together",
                  },
                  {
                    icon: "💪",
                    title: "Accountability Partners",
                    desc: "Keep each other motivated and on track with your quests",
                  },
                  {
                    icon: "🌟",
                    title: "Build Community",
                    desc: "Create a tribe of warriors overcoming fear together",
                  },
                ].map((benefit, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 32, marginRight: 16 }}>{benefit.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          color: "white",
                          marginBottom: 4,
                        }}
                      >
                        {benefit.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: "rgba(255, 255, 255, 0.7)",
                          lineHeight: 20,
                        }}
                      >
                        {benefit.desc}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
