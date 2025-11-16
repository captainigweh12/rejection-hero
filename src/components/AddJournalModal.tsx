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

  // State management
  const [step, setStep] = useState<"method" | "input" | "outcome">("method");
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

  // Reset form when modal opens
  React.useEffect(() => {
    if (visible) {
      console.log("[AddJournalModal] Modal opened - resetting to method step");
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setStep("method");
    setInputMode("text");
    setRecording(null);
    setIsRecording(false);
    setTranscribing(false);
    setRecordingUri(null);
    setTextEntry("");
    setTranscript("");
    setSummary("");
    setEditedSummary("");
    setSelectedOutcome(null);
    console.log("[AddJournalModal] Form reset complete");
  };

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
        const audioBase64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const data = await api.post<TranscribeAudioResponse>("/api/journal/transcribe", {
          audioBase64,
        });

        setTranscript(data.transcript);
        setSummary(data.summary);
        setEditedSummary(data.summary);
        setStep("outcome");
        console.log("Transcription complete, moving to outcome step");
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
      const data = await api.post<TranscribeAudioResponse>("/api/journal/transcribe", {
        text: textEntry.trim(),
      });

      setSummary(data.summary);
      setEditedSummary(data.summary);
      setStep("outcome");
      console.log("Text processing complete, moving to outcome step");
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

      // Close modal
      onClose();

      // Reset form after closing
      setTimeout(() => {
        resetForm();
      }, 100);

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
    onClose();
    setTimeout(() => {
      resetForm();
    }, 300);
  };

  const handleMethodSelect = (method: "text" | "voice") => {
    setInputMode(method);
    setStep("input");
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View
        key={`journal-modal-${step}`}
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 400,
            maxHeight: "90%",
            backgroundColor: "#1A1A24",
            borderRadius: 24,
            borderWidth: 2,
            borderColor: "rgba(126, 63, 228, 0.4)",
            overflow: "hidden",
            shadowColor: "#7E3FE4",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(126, 63, 228, 0.2)",
            }}
          >
            <Text className="text-2xl font-bold text-white">Journal Entry</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={28} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Debug Step Indicator */}
            {__DEV__ && (
              <View style={{
                padding: 8,
                backgroundColor: "rgba(255, 0, 0, 0.3)",
                marginBottom: 12,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: "red",
              }}>
                <Text className="text-white text-xs font-bold">
                  🔍 DEBUG: Current Step = &quot;{step}&quot;
                </Text>
              </View>
            )}

            {/* Render ONLY the current step */}
            {step === "method" ? (
              <View>
                <Text className="text-lg font-semibold text-white mb-4 text-center">
                  How would you like to log your experience?
                </Text>

                {/* Type Button */}
                <TouchableOpacity
                  onPress={() => handleMethodSelect("text")}
                  style={{
                    backgroundColor: "rgba(126, 63, 228, 0.2)",
                    borderWidth: 2,
                    borderColor: "#7E3FE4",
                    borderRadius: 16,
                    padding: 24,
                    marginBottom: 16,
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: "rgba(126, 63, 228, 0.3)",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Type size={32} color="#7E3FE4" />
                  </View>
                  <Text className="text-xl font-bold text-white mb-2">Type Your Entry</Text>
                  <Text className="text-sm text-white/60 text-center">
                    Write down your thoughts and experiences
                  </Text>
                </TouchableOpacity>

                {/* Voice Button */}
                <TouchableOpacity
                  onPress={() => handleMethodSelect("voice")}
                  style={{
                    backgroundColor: "rgba(255, 107, 53, 0.2)",
                    borderWidth: 2,
                    borderColor: "#FF6B35",
                    borderRadius: 16,
                    padding: 24,
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: "rgba(255, 107, 53, 0.3)",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Mic size={32} color="#FF6B35" />
                  </View>
                  <Text className="text-xl font-bold text-white mb-2">Voice Recording</Text>
                  <Text className="text-sm text-white/60 text-center">
                    Speak your thoughts and we&apos;ll transcribe them
                  </Text>
                </TouchableOpacity>
              </View>
            ) : step === "input" ? (
              <View>
                {/* Back Button */}
                <TouchableOpacity
                  onPress={() => setStep("method")}
                  style={{ marginBottom: 16 }}
                >
                  <Text className="text-[#7E3FE4] font-semibold">← Back</Text>
                </TouchableOpacity>

                {inputMode === "text" ? (
                  <View>
                    <Text className="text-lg font-semibold text-white mb-4">
                      Write Your Experience
                    </Text>
                    <TextInput
                      value={textEntry}
                      onChangeText={setTextEntry}
                      placeholder="Describe what happened, how you felt, what you learned..."
                      placeholderTextColor="rgba(255, 255, 255, 0.3)"
                      multiline
                      numberOfLines={8}
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        borderWidth: 1,
                        borderColor: "rgba(126, 63, 228, 0.3)",
                        borderRadius: 16,
                        padding: 16,
                        color: "white",
                        fontSize: 15,
                        minHeight: 180,
                        textAlignVertical: "top",
                        marginBottom: 20,
                      }}
                    />
                    <TouchableOpacity
                      onPress={handleProcessText}
                      disabled={!textEntry.trim() || transcribing}
                      style={{
                        backgroundColor: textEntry.trim() ? "#7E3FE4" : "rgba(126, 63, 228, 0.3)",
                        borderRadius: 16,
                        padding: 18,
                        alignItems: "center",
                      }}
                    >
                      {transcribing ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text className="text-white font-bold text-lg">Continue</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <Text className="text-lg font-semibold text-white mb-4 text-center">
                      Voice Recording
                    </Text>

                    <View className="items-center py-8">
                      {isRecording ? (
                        <TouchableOpacity
                          onPress={stopRecording}
                          style={{
                            width: 100,
                            height: 100,
                            borderRadius: 50,
                            backgroundColor: "#FF3B30",
                            justifyContent: "center",
                            alignItems: "center",
                            shadowColor: "#FF3B30",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.5,
                            shadowRadius: 12,
                            elevation: 8,
                          }}
                        >
                          <Square size={40} color="white" fill="white" />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={startRecording}
                          disabled={transcribing}
                          style={{
                            width: 100,
                            height: 100,
                            borderRadius: 50,
                            backgroundColor: "#FF6B35",
                            justifyContent: "center",
                            alignItems: "center",
                            shadowColor: "#FF6B35",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.5,
                            shadowRadius: 12,
                            elevation: 8,
                          }}
                        >
                          <Mic size={40} color="white" />
                        </TouchableOpacity>
                      )}

                      <Text className="text-white text-base mt-6 font-semibold">
                        {isRecording ? "Tap to stop recording" : "Tap to start recording"}
                      </Text>
                    </View>

                    {transcribing && (
                      <View className="items-center py-4">
                        <ActivityIndicator size="large" color="#7E3FE4" />
                        <Text className="text-white/60 text-base mt-4">
                          Transcribing your audio...
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ) : step === "outcome" ? (
              <View>
                {/* AI Summary */}
                <View
                  style={{
                    backgroundColor: "rgba(126, 63, 228, 0.1)",
                    borderWidth: 1,
                    borderColor: "rgba(126, 63, 228, 0.3)",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <Text className="text-sm font-semibold text-white/80 mb-2">
                    AI Summary
                  </Text>
                  <Text className="text-white text-base">{summary}</Text>
                </View>

                {/* Outcome Selection */}
                <Text className="text-lg font-semibold text-white mb-4">
                  What was the outcome?
                </Text>

                {/* YES */}
                <TouchableOpacity
                  onPress={() => setSelectedOutcome("YES")}
                  style={{
                    backgroundColor:
                      selectedOutcome === "YES"
                        ? "rgba(255, 59, 48, 0.3)"
                        : "rgba(255, 255, 255, 0.05)",
                    borderWidth: 2,
                    borderColor:
                      selectedOutcome === "YES"
                        ? "#FF3B30"
                        : "rgba(255, 255, 255, 0.1)",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: "rgba(255, 59, 48, 0.2)",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 16,
                    }}
                  >
                    <CheckCircle size={24} color="#FF3B30" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className="text-white font-bold text-lg mb-1">
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
                        ? "rgba(76, 175, 80, 0.3)"
                        : "rgba(255, 255, 255, 0.05)",
                    borderWidth: 2,
                    borderColor:
                      selectedOutcome === "NO"
                        ? "#4CAF50"
                        : "rgba(255, 255, 255, 0.1)",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: "rgba(76, 175, 80, 0.2)",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 16,
                    }}
                  >
                    <XCircle size={24} color="#4CAF50" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className="text-white font-bold text-lg mb-1">
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
                        ? "rgba(0, 217, 255, 0.3)"
                        : "rgba(255, 255, 255, 0.05)",
                    borderWidth: 2,
                    borderColor:
                      selectedOutcome === "ACTIVITY"
                        ? "#00D9FF"
                        : "rgba(255, 255, 255, 0.1)",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 24,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: "rgba(0, 217, 255, 0.2)",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 16,
                    }}
                  >
                    <Activity size={24} color="#00D9FF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className="text-white font-bold text-lg mb-1">
                      Activity
                    </Text>
                    <Text className="text-white/60 text-sm">
                      Completed an action
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Save Button */}
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={!selectedOutcome || createEntryMutation.isPending}
                  style={{
                    backgroundColor: selectedOutcome ? "#7E3FE4" : "rgba(126, 63, 228, 0.3)",
                    borderRadius: 16,
                    padding: 18,
                    alignItems: "center",
                  }}
                >
                  {createEntryMutation.isPending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-bold text-lg">
                      Save Entry
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
