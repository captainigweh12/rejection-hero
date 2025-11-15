import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mic, Square, Star, CheckCircle, XCircle, Activity } from "lucide-react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { BottomTabScreenProps } from "@/navigation/types";

interface TranscribeAudioResponse {
  transcript: string;
  summary: string;
}

interface CreateJournalEntryResponse {
  id: string;
  achievement: {
    id: string;
    type: string;
    description: string;
    earnedAt: string;
  };
}

interface JournalEntry {
  id: string;
  audioUrl: string | null;
  audioTranscript: string | null;
  aiSummary: string;
  userEditedSummary: string | null;
  outcome: string;
  createdAt: string;
  updatedAt: string;
  achievements: Array<{
    id: string;
    type: string;
    description: string;
    earnedAt: string;
  }>;
}

interface GetJournalEntriesResponse {
  entries: JournalEntry[];
}

type Props = BottomTabScreenProps<"JournalTab">;

export default function JournalScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [editedSummary, setEditedSummary] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState<"YES" | "NO" | "ACTIVITY" | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  // Fetch journal entries
  const { data: entriesData } = useQuery({
    queryKey: ["journal-entries"],
    queryFn: () => api.get<GetJournalEntriesResponse>("/api/journal"),
  });

  // Start recording
  const startRecording = async () => {
    try {
      console.log("Requesting permissions...");
      const permission = await Audio.requestPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert("Permission required", "Please enable microphone access to record audio.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log("Starting recording...");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      console.log("Recording started");
    } catch (err) {
      console.error("Failed to start recording", err);
      Alert.alert("Error", "Failed to start recording. Please try again.");
    }
  };

  // Stop recording and transcribe
  const stopRecording = async () => {
    if (!recording) return;

    try {
      console.log("Stopping recording...");
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      console.log("Recording stopped, URI:", uri);

      if (!uri) {
        Alert.alert("Error", "Failed to save recording");
        return;
      }

      setRecordingUri(uri);
      setRecording(null);

      // Transcribe audio
      setTranscribing(true);
      try {
        // Read audio file as base64
        const audioBase64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Send to backend for transcription
        const data = await api.post<TranscribeAudioResponse>("/api/journal/transcribe", {
          audioBase64,
        });

        setTranscript(data.transcript);
        setSummary(data.summary);
        setEditedSummary(data.summary);
        console.log("Transcription complete");
      } catch (err) {
        console.error("Transcription error:", err);
        Alert.alert("Error", "Failed to transcribe audio. Please try again.");
      } finally {
        setTranscribing(false);
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
      Alert.alert("Error", "Failed to stop recording");
    }
  };

  // Create journal entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOutcome) {
        throw new Error("Please select an outcome");
      }

      return api.post<CreateJournalEntryResponse>("/api/journal", {
        audioUrl: recordingUri,
        audioTranscript: transcript,
        aiSummary: summary,
        userEditedSummary: editedSummary,
        outcome: selectedOutcome,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      Alert.alert(
        "Achievement Earned! 🌟",
        data.achievement.description,
        [
          {
            text: "View Growth",
            onPress: () => navigation.navigate("GrowthAchievements"),
          },
          { text: "OK" },
        ]
      );
      // Reset form
      setRecordingUri(null);
      setTranscript("");
      setSummary("");
      setEditedSummary("");
      setSelectedOutcome(null);
    },
    onError: (error) => {
      console.error("Create entry error:", error);
      Alert.alert("Error", "Failed to save journal entry. Please try again.");
    },
  });

  const handleSave = () => {
    if (!selectedOutcome) {
      Alert.alert("Missing Information", "Please select an outcome (Yes/No/Activity)");
      return;
    }
    createEntryMutation.mutate();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView className="flex-1 px-4">
          {/* Header */}
          <View className="py-6">
            <Text className="text-3xl font-bold text-white">Journal</Text>
            <Text className="text-base text-white/60 mt-1">
              Record your growth experiences
            </Text>
          </View>

          {/* Recording Section */}
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderWidth: 1,
              borderColor: "rgba(126, 63, 228, 0.3)",
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <Text className="text-lg font-semibold text-white mb-4">
              Voice Recording
            </Text>

            <View className="items-center py-8">
              {isRecording ? (
                <TouchableOpacity
                  onPress={stopRecording}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: "#FF3B30",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Square size={32} color="white" fill="white" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={startRecording}
                  disabled={transcribing || createEntryMutation.isPending}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: "#7E3FE4",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Mic size={32} color="white" />
                </TouchableOpacity>
              )}

              <Text className="text-white/60 text-sm mt-4">
                {isRecording ? "Tap to stop recording" : "Tap to start recording"}
              </Text>
            </View>

            {transcribing && (
              <View className="items-center py-4">
                <ActivityIndicator size="large" color="#7E3FE4" />
                <Text className="text-white/60 text-sm mt-2">
                  Transcribing audio...
                </Text>
              </View>
            )}
          </View>

          {/* AI Summary Section */}
          {summary && (
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderWidth: 1,
                borderColor: "rgba(126, 63, 228, 0.3)",
                borderRadius: 16,
                padding: 20,
                marginBottom: 20,
              }}
            >
              <Text className="text-lg font-semibold text-white mb-2">
                AI Summary
              </Text>
              <Text className="text-white/80 text-base mb-4">{summary}</Text>

              <Text className="text-sm font-semibold text-white/60 mb-2">
                Edit Summary (Optional)
              </Text>
              <TextInput
                value={editedSummary}
                onChangeText={setEditedSummary}
                multiline
                numberOfLines={3}
                placeholder="Modify the summary if needed..."
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.2)",
                  borderRadius: 12,
                  padding: 12,
                  color: "white",
                  fontSize: 14,
                  minHeight: 80,
                }}
              />
            </View>
          )}

          {/* Outcome Selection */}
          {summary && (
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderWidth: 1,
                borderColor: "rgba(126, 63, 228, 0.3)",
                borderRadius: 16,
                padding: 20,
                marginBottom: 20,
              }}
            >
              <Text className="text-lg font-semibold text-white mb-4">
                What was the outcome?
              </Text>

              <View className="gap-3">
                {/* YES */}
                <TouchableOpacity
                  onPress={() => setSelectedOutcome("YES")}
                  style={{
                    backgroundColor:
                      selectedOutcome === "YES"
                        ? "rgba(76, 175, 80, 0.2)"
                        : "rgba(255, 255, 255, 0.03)",
                    borderWidth: 2,
                    borderColor:
                      selectedOutcome === "YES"
                        ? "#4CAF50"
                        : "rgba(126, 63, 228, 0.2)",
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "rgba(76, 175, 80, 0.2)",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                    }}
                  >
                    <CheckCircle size={24} color="#4CAF50" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className="text-white font-semibold text-base">
                      Yes
                    </Text>
                    <Text className="text-white/60 text-sm">
                      They said yes!
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* NO */}
                <TouchableOpacity
                  onPress={() => setSelectedOutcome("NO")}
                  style={{
                    backgroundColor:
                      selectedOutcome === "NO"
                        ? "rgba(255, 107, 53, 0.2)"
                        : "rgba(255, 255, 255, 0.03)",
                    borderWidth: 2,
                    borderColor:
                      selectedOutcome === "NO"
                        ? "#FF6B35"
                        : "rgba(126, 63, 228, 0.2)",
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "rgba(255, 107, 53, 0.2)",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                    }}
                  >
                    <XCircle size={24} color="#FF6B35" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className="text-white font-semibold text-base">
                      No
                    </Text>
                    <Text className="text-white/60 text-sm">
                      Faced rejection
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* ACTIVITY */}
                <TouchableOpacity
                  onPress={() => setSelectedOutcome("ACTIVITY")}
                  style={{
                    backgroundColor:
                      selectedOutcome === "ACTIVITY"
                        ? "rgba(0, 217, 255, 0.2)"
                        : "rgba(255, 255, 255, 0.03)",
                    borderWidth: 2,
                    borderColor:
                      selectedOutcome === "ACTIVITY"
                        ? "#00D9FF"
                        : "rgba(126, 63, 228, 0.2)",
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "rgba(0, 217, 255, 0.2)",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                    }}
                  >
                    <Activity size={24} color="#00D9FF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className="text-white font-semibold text-base">
                      Activity
                    </Text>
                    <Text className="text-white/60 text-sm">
                      Completed an action
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSave}
                disabled={!selectedOutcome || createEntryMutation.isPending}
                style={{
                  backgroundColor: selectedOutcome ? "#7E3FE4" : "rgba(126, 63, 228, 0.3)",
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 16,
                  alignItems: "center",
                }}
              >
                {createEntryMutation.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-base">
                    Save Journal Entry
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Recent Entries */}
          {entriesData && entriesData.entries.length > 0 && (
            <View className="mb-8">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-white">
                  Recent Entries
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("GrowthAchievements")}
                >
                  <Text className="text-[#7E3FE4] font-semibold">
                    View All
                  </Text>
                </TouchableOpacity>
              </View>

              {entriesData.entries.slice(0, 3).map((entry) => (
                <View
                  key={entry.id}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderWidth: 1,
                    borderColor: "rgba(126, 63, 228, 0.3)",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      {entry.outcome === "YES" && (
                        <CheckCircle size={20} color="#4CAF50" />
                      )}
                      {entry.outcome === "NO" && (
                        <XCircle size={20} color="#FF6B35" />
                      )}
                      {entry.outcome === "ACTIVITY" && (
                        <Activity size={20} color="#00D9FF" />
                      )}
                      <Text className="text-white/60 text-sm ml-2">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    {entry.achievements.length > 0 && (
                      <Star size={20} color="#FFD700" fill="#FFD700" />
                    )}
                  </View>
                  <Text className="text-white text-base">
                    {entry.userEditedSummary || entry.aiSummary}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
