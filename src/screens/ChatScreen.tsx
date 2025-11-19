import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { useSession } from "@/lib/useSession";
import type { GetMessagesResponse, SendMessageRequest } from "@/shared/contracts";
import { playSound } from "@/services/soundService";

type Props = RootStackScreenProps<"Chat">;

export default function ChatScreen({ navigation, route }: Props) {
  const { userId, userName, userAvatar } = route.params;
  const { data: sessionData } = useSession();
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messageText, setMessageText] = useState("");

  // Fetch messages
  const { data, isLoading } = useQuery({
    queryKey: ["messages", userId],
    queryFn: async () => {
      return api.get<GetMessagesResponse>(`/api/messages/${userId}`);
    },
    enabled: !!sessionData?.user && !!userId,
    refetchInterval: 3000, // Refresh every 3 seconds for real-time feel
  });

  const messages = data?.messages || [];
  const currentUserId = sessionData?.user?.id;

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const requestData: SendMessageRequest = {
        receiverId: userId,
        content,
      };
      return api.post("/api/messages/send", requestData);
    },
    onSuccess: async () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["messages", userId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      // Play message sent sound
      await playSound("messageSent");
      // Scroll to bottom after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessageMutation.mutate(messageText.trim());
  };

  // Scroll to bottom when messages change and play sound for received messages
  useEffect(() => {
    if (messages.length > 0) {
      // Check if last message is from other user (not current user)
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.senderId !== currentUserId) {
        // Play message received sound
        playSound("messageReceived").catch(console.error);
      }
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages.length, currentUserId]);

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
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255, 255, 255, 0.1)",
            backgroundColor: "#0A0A0F",
          }}
        >
          <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <ArrowLeft size={24} color="white" />
          </Pressable>

          {/* User Avatar */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#7E3FE4" + "30",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={{ width: 40, height: 40, borderRadius: 20 }} />
            ) : (
              <Text style={{ color: "#7E3FE4", fontSize: 18, fontWeight: "700" }}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          {/* User Name */}
          <Text style={{ fontSize: 18, fontWeight: "700", color: "white", flex: 1 }}>{userName}</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 10 }}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 60 }}>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: "rgba(126, 63, 228, 0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Send size={36} color="#7E3FE4" />
                </View>
                <Text style={{ color: "white", fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
                  Start a conversation
                </Text>
                <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14, textAlign: "center" }}>
                  Send a message to {userName}
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {messages.map((message: any, index: number) => {
                  const isMyMessage = message.senderId === currentUserId;
                  const showAvatar = !isMyMessage && (index === 0 || messages[index - 1]?.senderId !== message.senderId);
                  const showTimestamp = index === messages.length - 1 || messages[index + 1]?.senderId !== message.senderId;

                  return (
                    <View key={message.id} style={{ alignItems: isMyMessage ? "flex-end" : "flex-start" }}>
                      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "80%" }}>
                        {/* Avatar for received messages */}
                        {!isMyMessage && (
                          <View style={{ width: 32, height: 32 }}>
                            {showAvatar && (
                              <View
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 16,
                                  backgroundColor: "#7E3FE4" + "30",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {userAvatar ? (
                                  <Image
                                    source={{ uri: userAvatar }}
                                    style={{ width: 32, height: 32, borderRadius: 16 }}
                                  />
                                ) : (
                                  <Text style={{ color: "#7E3FE4", fontSize: 14, fontWeight: "700" }}>
                                    {userName.charAt(0).toUpperCase()}
                                  </Text>
                                )}
                              </View>
                            )}
                          </View>
                        )}

                        {/* Message Bubble */}
                        <View
                          style={{
                            backgroundColor: isMyMessage ? "#7E3FE4" : "rgba(255, 255, 255, 0.1)",
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 18,
                            borderBottomRightRadius: isMyMessage ? 4 : 18,
                            borderBottomLeftRadius: isMyMessage ? 18 : 4,
                          }}
                        >
                          <Text style={{ color: "white", fontSize: 15, lineHeight: 20 }}>{message.content}</Text>
                        </View>
                      </View>

                      {/* Timestamp */}
                      {showTimestamp && (
                        <Text
                          style={{
                            color: "rgba(255, 255, 255, 0.4)",
                            fontSize: 11,
                            marginTop: 4,
                            marginLeft: isMyMessage ? 0 : 40,
                          }}
                        >
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Input Bar */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 12,
              paddingBottom: Platform.OS === "ios" ? 20 : 12,
              borderTopWidth: 1,
              borderTopColor: "rgba(255, 255, 255, 0.1)",
              backgroundColor: "#0A0A0F",
            }}
          >
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type a message..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
              maxLength={500}
              style={{
                flex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 10,
                paddingTop: Platform.OS === "ios" ? 10 : 10,
                color: "white",
                fontSize: 15,
                maxHeight: 100,
                borderWidth: 1,
                borderColor: "rgba(126, 63, 228, 0.3)",
              }}
              onSubmitEditing={handleSendMessage}
            />
            <Pressable
              onPress={handleSendMessage}
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: messageText.trim() ? "#7E3FE4" : "rgba(126, 63, 228, 0.3)",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: 8,
              }}
            >
              {sendMessageMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Send size={20} color="white" fill={messageText.trim() ? "white" : "transparent"} />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
