import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { Mic, Square, CheckCircle, XCircle, Activity, X, Type } from "lucide-react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

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

interface AddJournalModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddJournalModal({ visible, onClose, onSuccess }: AddJournalModalProps) {
  const queryClient = useQueryClient();
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [textEntry, setTextEntry] = useState("");
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [editedSummary, setEditedSummary] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState<"YES" | "NO" | "ACTIVITY" | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

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

  // Process text entry
  const handleProcessText = async () => {
    if (!textEntry.trim()) {
      Alert.alert("Error", "Please write your experience first");
      return;
    }

    setTranscribing(true);
    try {
      // Use the same transcribe endpoint but with text instead of audio
      const data = await api.post<TranscribeAudioResponse>("/api/journal/transcribe", {
        text: textEntry.trim(),
      });

      setSummary(data.summary);
      setEditedSummary(data.summary);
      console.log("Text processing complete");
    } catch (err) {
      console.error("Text processing error:", err);
      Alert.alert("Error", "Failed to process text. Please try again.");
    } finally {
      setTranscribing(false);
    }
  };

  // Create journal entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOutcome) {
        throw new Error("Please select an outcome");
      }

      console.log("Creating journal entry with data:", {
        audioUrl: recordingUri,
        audioTranscript: inputMode === "voice" ? transcript : textEntry,
        aiSummary: summary,
        userEditedSummary: editedSummary,
        outcome: selectedOutcome,
      });

      return api.post<CreateJournalEntryResponse>("/api/journal", {
        audioUrl: recordingUri,
        audioTranscript: inputMode === "voice" ? transcript : textEntry,
        aiSummary: summary,
        userEditedSummary: editedSummary !== summary ? editedSummary : null,
        outcome: selectedOutcome,
      });
    },
    onSuccess: async (data) => {
      console.log("Journal entry created successfully:", data);

      // Refetch journal entries to ensure UI updates
      await queryClient.refetchQueries({ queryKey: ["journal-entries"] });

      console.log("Journal entries refetched");

      // Reset form first
      resetForm();

      // Close modal
      onClose();

      // Show success alert after modal closes
      setTimeout(() => {
        Alert.alert(
          "Achievement Earned!",
          data.achievement.description,
          [{ text: "OK" }]
        );
      }, 300);

      // Call success callback
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Create entry error:", error);
      Alert.alert("Error", "Failed to save journal entry. Please try again.");
    },
  });

  const resetForm = () => {
    setInputMode("text");
    setRecordingUri(null);
    setTextEntry("");
    setTranscript("");
    setSummary("");
    setEditedSummary("");
    setSelectedOutcome(null);
  };

  const handleSave = () => {
    if (!selectedOutcome) {
      Alert.alert("Missing Information", "Please select an outcome (Yes/No/Activity)");
      return;
    }
    createEntryMutation.mutate();
  };

  const handleClose = () => {
    if (isRecording) {
      Alert.alert("Recording in Progress", "Please stop recording before closing.");
      return;
    }
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: "90%",
            maxHeight: "85%",
            backgroundColor: "#0A0A0F",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "rgba(126, 63, 228, 0.3)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(126, 63, 228, 0.2)",
            }}
          >
            <Text className="text-xl font-bold text-white">Add Journal Entry</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Input Mode Selector */}
            {!summary && (
              <View style={{ marginBottom: 16 }}>
                <Text className="text-sm font-semibold text-white/80 mb-3">
                  How would you like to log your experience?
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setInputMode("text")}
                    style={{
                      flex: 1,
                      backgroundColor: inputMode === "text"
                        ? "rgba(126, 63, 228, 0.3)"
                        : "rgba(255, 255, 255, 0.05)",
                      borderWidth: 2,
                      borderColor: inputMode === "text"
                        ? "#7E3FE4"
                        : "rgba(126, 63, 228, 0.3)",
                      borderRadius: 12,
                      padding: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Type size={20} color={inputMode === "text" ? "#7E3FE4" : "white"} />
                    <Text className={`font-semibold ${inputMode === "text" ? "text-[#7E3FE4]" : "text-white"}`}>
                      Type
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setInputMode("voice")}
                    style={{
                      flex: 1,
                      backgroundColor: inputMode === "voice"
                        ? "rgba(255, 107, 53, 0.3)"
                        : "rgba(255, 255, 255, 0.05)",
                      borderWidth: 2,
                      borderColor: inputMode === "voice"
                        ? "#FF6B35"
                        : "rgba(126, 63, 228, 0.3)",
                      borderRadius: 12,
                      padding: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Mic size={20} color={inputMode === "voice" ? "#FF6B35" : "white"} />
                    <Text className={`font-semibold ${inputMode === "voice" ? "text-[#FF6B35]" : "text-white"}`}>
                      Voice
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Text Input Section */}
            {inputMode === "text" && !summary && (
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.3)",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <Text className="text-base font-semibold text-white mb-3">
                  Write Your Experience
                </Text>
                <TextInput
                  value={textEntry}
                  onChangeText={setTextEntry}
                  placeholder="Describe what happened, how you felt, what you learned..."
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  multiline
                  numberOfLines={6}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    borderWidth: 1,
                    borderColor: "rgba(126, 63, 228, 0.2)",
                    borderRadius: 12,
                    padding: 12,
                    color: "white",
                    fontSize: 14,
                    minHeight: 120,
                    textAlignVertical: "top",
                    marginBottom: 12,
                  }}
                />
                <TouchableOpacity
                  onPress={handleProcessText}
                  disabled={!textEntry.trim() || transcribing}
                  style={{
                    backgroundColor: textEntry.trim() ? "#7E3FE4" : "rgba(126, 63, 228, 0.3)",
                    borderRadius: 12,
                    padding: 14,
                    alignItems: "center",
                  }}
                >
                  {transcribing ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="text-white font-semibold">Process Entry</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Voice Recording Section */}
            {inputMode === "voice" && !summary && (
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.3)",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <Text className="text-base font-semibold text-white mb-3">
                  Voice Recording
                </Text>

                <View className="items-center py-4">
                  {isRecording ? (
                    <TouchableOpacity
                      onPress={stopRecording}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: "#FF3B30",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Square size={24} color="white" fill="white" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={startRecording}
                      disabled={transcribing || createEntryMutation.isPending}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: "#FF6B35",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Mic size={24} color="white" />
                    </TouchableOpacity>
                  )}

                  <Text className="text-white/60 text-xs mt-2">
                    {isRecording ? "Tap to stop" : "Tap to record"}
                  </Text>
                </View>

                {transcribing && (
                  <View className="items-center py-3">
                    <ActivityIndicator size="small" color="#7E3FE4" />
                    <Text className="text-white/60 text-xs mt-2">
                      Transcribing...
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* AI Summary Section */}
            {summary && (
              <>
                <View
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderWidth: 1,
                    borderColor: "rgba(126, 63, 228, 0.3)",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <Text className="text-base font-semibold text-white mb-2">
                    AI Summary
                  </Text>
                  <Text className="text-white/80 text-sm mb-3">{summary}</Text>

                  <Text className="text-xs font-semibold text-white/60 mb-2">
                    Edit Summary (Optional)
                  </Text>
                  <TextInput
                    value={editedSummary}
                    onChangeText={setEditedSummary}
                    multiline
                    numberOfLines={2}
                    placeholder="Modify the summary if needed..."
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      borderWidth: 1,
                      borderColor: "rgba(126, 63, 228, 0.2)",
                      borderRadius: 12,
                      padding: 10,
                      color: "white",
                      fontSize: 13,
                      minHeight: 60,
                    }}
                  />
                </View>

                {/* Outcome Selection */}
                <View
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderWidth: 1,
                    borderColor: "rgba(126, 63, 228, 0.3)",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <Text className="text-base font-semibold text-white mb-3">
                    What was the outcome?
                  </Text>

                  <View className="gap-2">
                    {/* YES */}
                    <TouchableOpacity
                      onPress={() => setSelectedOutcome("YES")}
                      style={{
                        backgroundColor:
                          selectedOutcome === "YES"
                            ? "rgba(255, 59, 48, 0.2)"
                            : "rgba(255, 255, 255, 0.03)",
                        borderWidth: 2,
                        borderColor:
                          selectedOutcome === "YES"
                            ? "#FF3B30"
                            : "rgba(126, 63, 228, 0.2)",
                        borderRadius: 12,
                        padding: 12,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: "rgba(255, 59, 48, 0.2)",
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 10,
                        }}
                      >
                        <CheckCircle size={18} color="#FF3B30" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text className="text-white font-semibold text-sm">
                          Yes
                        </Text>
                        <Text className="text-white/60 text-xs">
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
                            ? "rgba(76, 175, 80, 0.2)"
                            : "rgba(255, 255, 255, 0.03)",
                        borderWidth: 2,
                        borderColor:
                          selectedOutcome === "NO"
                            ? "#4CAF50"
                            : "rgba(126, 63, 228, 0.2)",
                        borderRadius: 12,
                        padding: 12,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: "rgba(76, 175, 80, 0.2)",
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 10,
                        }}
                      >
                        <XCircle size={18} color="#4CAF50" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text className="text-white font-semibold text-sm">
                          No
                        </Text>
                        <Text className="text-white/60 text-xs">
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
                        padding: 12,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: "rgba(0, 217, 255, 0.2)",
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 10,
                        }}
                      >
                        <Activity size={18} color="#00D9FF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text className="text-white font-semibold text-sm">
                          Activity
                        </Text>
                        <Text className="text-white/60 text-xs">
                          Completed an action
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={!selectedOutcome || createEntryMutation.isPending}
                  style={{
                    backgroundColor: selectedOutcome ? "#7E3FE4" : "rgba(126, 63, 228, 0.3)",
                    borderRadius: 12,
                    padding: 14,
                    alignItems: "center",
                  }}
                >
                  {createEntryMutation.isPending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-semibold text-base">
                      Save Entry
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
