import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mic, Square, CheckCircle, XCircle, Activity, X, Type } from "lucide-react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface AddJournalModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddJournalModal({ visible, onClose, onSuccess }: AddJournalModalProps) {
  const queryClient = useQueryClient();

  // Step control
  const [currentStep, setCurrentStep] = useState(1);

  // Method selection
  const [selectedMethod, setSelectedMethod] = useState<"text" | "voice" | null>(null);

  // Text input
  const [textContent, setTextContent] = useState("");

  // Voice recording
  const [audioRecording, setAudioRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  // Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [transcript, setTranscript] = useState("");

  // Outcome
  const [selectedOutcome, setSelectedOutcome] = useState<"YES" | "NO" | "ACTIVITY" | null>(null);

  // Reset everything when modal opens
  useEffect(() => {
    if (visible) {
      console.log("[Journal] Modal opened - resetting all state");
      console.log("[Journal] Current step:", currentStep);
      setCurrentStep(1);
      setSelectedMethod(null);
      setTextContent("");
      setAudioRecording(null);
      setIsRecording(false);
      setRecordingUri(null);
      setIsProcessing(false);
      setAiSummary("");
      setTranscript("");
      setSelectedOutcome(null);
    }
  }, [visible]);

  // Step 1: Select method (Type or Voice)
  const handleSelectMethod = (method: "text" | "voice") => {
    console.log("[Journal] Method selected:", method);
    setSelectedMethod(method);
    setCurrentStep(2);
  };

  // Step 2: Voice recording functions
  const startVoiceRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission Required", "Please enable microphone access.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setAudioRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopVoiceRecording = async () => {
    if (!audioRecording) return;

    try {
      setIsRecording(false);
      await audioRecording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = audioRecording.getURI();
      if (!uri) {
        Alert.alert("Error", "Failed to save recording");
        return;
      }

      setRecordingUri(uri);
      setAudioRecording(null);

      // Process the audio
      await processAudio(uri);
    } catch (err) {
      console.error("Stop recording error:", err);
      Alert.alert("Error", "Failed to stop recording");
    }
  };

  const processAudio = async (uri: string) => {
    setIsProcessing(true);
    try {
      const audioBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await api.post<{ transcript: string; summary: string }>(
        "/api/journal/transcribe",
        { audioBase64 }
      );

      setTranscript(response.transcript);
      setAiSummary(response.summary);
      setCurrentStep(3);
    } catch (err) {
      console.error("Transcription error:", err);
      Alert.alert("Error", "Failed to transcribe audio");
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Process text
  const processText = async () => {
    if (!textContent.trim()) {
      Alert.alert("Empty Entry", "Please write something first");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await api.post<{ summary: string }>(
        "/api/journal/transcribe",
        { text: textContent.trim() }
      );

      setAiSummary(response.summary);
      setCurrentStep(3);
    } catch (err) {
      console.error("Text processing error:", err);
      Alert.alert("Error", "Failed to process text");
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 3: Save entry
  const saveEntryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOutcome) {
        throw new Error("Please select an outcome");
      }

      return api.post<{
        id: string;
        achievement: {
          id: string;
          type: string;
          description: string;
          earnedAt: string;
        };
      }>(
        "/api/journal",
        {
          audioUrl: recordingUri,
          audioTranscript: selectedMethod === "voice" ? transcript : textContent,
          aiSummary,
          userEditedSummary: null,
          outcome: selectedOutcome,
        }
      );
    },
    onSuccess: async (data) => {
      console.log("[Journal] Entry saved successfully");

      // Refetch journal entries
      await queryClient.refetchQueries({ queryKey: ["journal-entries"] });

      // Close modal
      onClose();

      // Show achievement
      setTimeout(() => {
        Alert.alert("Achievement Earned!", data.achievement.description);
      }, 300);

      onSuccess?.();
    },
    onError: (error) => {
      console.error("Save error:", error);
      Alert.alert("Error", "Failed to save journal entry");
    },
  });

  const handleSave = () => {
    if (!selectedOutcome) {
      Alert.alert("Missing Information", "Please select an outcome");
      return;
    }
    saveEntryMutation.mutate();
  };

  const handleClose = () => {
    if (isRecording) {
      Alert.alert("Recording in Progress", "Please stop recording first");
      return;
    }
    onClose();
  };

  console.log("[Journal] Rendering modal, visible:", visible, "currentStep:", currentStep);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.95)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                width: "100%",
                maxWidth: 420,
                height: "90%",
                maxHeight: 700,
                backgroundColor: "#1A1A24",
                borderRadius: 24,
                borderWidth: 2,
                borderColor: "#7E3FE4",
                overflow: "hidden",
                shadowColor: "#7E3FE4",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.5,
                shadowRadius: 16,
                elevation: 20,
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
              borderBottomColor: "rgba(126, 63, 228, 0.3)",
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
              Journal Entry
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={28} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ 
              padding: 20,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* STEP 1: METHOD SELECTION */}
            {currentStep === 1 && (
              <View style={{ minHeight: 400 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: "white",
                    textAlign: "center",
                    marginBottom: 24,
                  }}
                >
                  How would you like to log your experience?
                </Text>

                {/* Type Button */}
                <TouchableOpacity
                  onPress={() => handleSelectMethod("text")}
                  style={{
                    backgroundColor: "rgba(126, 63, 228, 0.2)",
                    borderWidth: 2,
                    borderColor: "#7E3FE4",
                    borderRadius: 20,
                    padding: 28,
                    marginBottom: 20,
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: "#7E3FE4",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Type size={40} color="white" />
                  </View>
                  <Text style={{ fontSize: 22, fontWeight: "bold", color: "white", marginBottom: 8 }}>
                    Type Your Entry
                  </Text>
                  <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)", textAlign: "center" }}>
                    Write down your thoughts and experiences
                  </Text>
                </TouchableOpacity>

                {/* Voice Button */}
                <TouchableOpacity
                  onPress={() => handleSelectMethod("voice")}
                  style={{
                    backgroundColor: "rgba(255, 107, 53, 0.2)",
                    borderWidth: 2,
                    borderColor: "#FF6B35",
                    borderRadius: 20,
                    padding: 28,
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: "#FF6B35",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Mic size={40} color="white" />
                  </View>
                  <Text style={{ fontSize: 22, fontWeight: "bold", color: "white", marginBottom: 8 }}>
                    Voice Recording
                  </Text>
                  <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)", textAlign: "center" }}>
                    Speak your thoughts and we&apos;ll transcribe them
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: INPUT */}
            {currentStep === 2 && (
              <View>
                {/* Back Button */}
                <TouchableOpacity
                  onPress={() => setCurrentStep(1)}
                  style={{ marginBottom: 20 }}
                >
                  <Text style={{ color: "#7E3FE4", fontSize: 16, fontWeight: "600" }}>
                    ← Back
                  </Text>
                </TouchableOpacity>

                {selectedMethod === "text" ? (
                  <View>
                    <Text style={{ fontSize: 18, fontWeight: "600", color: "white", marginBottom: 16 }}>
                      Write Your Experience
                    </Text>
                    <TextInput
                      value={textContent}
                      onChangeText={setTextContent}
                      placeholder="Describe what happened, how you felt, what you learned..."
                      placeholderTextColor="rgba(255, 255, 255, 0.3)"
                      multiline
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        borderWidth: 1,
                        borderColor: "rgba(126, 63, 228, 0.3)",
                        borderRadius: 16,
                        padding: 16,
                        color: "white",
                        fontSize: 15,
                        minHeight: 200,
                        textAlignVertical: "top",
                        marginBottom: 24,
                      }}
                    />
                    <TouchableOpacity
                      onPress={processText}
                      disabled={!textContent.trim() || isProcessing}
                      style={{
                        backgroundColor: textContent.trim() ? "#7E3FE4" : "rgba(126, 63, 228, 0.3)",
                        borderRadius: 16,
                        padding: 18,
                        alignItems: "center",
                      }}
                    >
                      {isProcessing ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
                          Continue
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "600",
                        color: "white",
                        textAlign: "center",
                        marginBottom: 32,
                      }}
                    >
                      Voice Recording
                    </Text>

                    <View style={{ alignItems: "center", paddingVertical: 40 }}>
                      <TouchableOpacity
                        onPress={isRecording ? stopVoiceRecording : startVoiceRecording}
                        disabled={isProcessing}
                        style={{
                          width: 120,
                          height: 120,
                          borderRadius: 60,
                          backgroundColor: isRecording ? "#FF3B30" : "#FF6B35",
                          justifyContent: "center",
                          alignItems: "center",
                          shadowColor: isRecording ? "#FF3B30" : "#FF6B35",
                          shadowOffset: { width: 0, height: 8 },
                          shadowOpacity: 0.6,
                          shadowRadius: 16,
                        }}
                      >
                        {isRecording ? (
                          <Square size={48} color="white" fill="white" />
                        ) : (
                          <Mic size={48} color="white" />
                        )}
                      </TouchableOpacity>

                      <Text
                        style={{
                          color: "white",
                          fontSize: 16,
                          fontWeight: "600",
                          marginTop: 24,
                        }}
                      >
                        {isRecording ? "Tap to stop recording" : "Tap to start recording"}
                      </Text>
                    </View>

                    {isProcessing && (
                      <View style={{ alignItems: "center", marginTop: 20 }}>
                        <ActivityIndicator size="large" color="#7E3FE4" />
                        <Text style={{ color: "rgba(255, 255, 255, 0.6)", marginTop: 12 }}>
                          Transcribing your audio...
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* STEP 3: OUTCOME SELECTION */}
            {currentStep === 3 && (
              <View>
                {/* AI Summary */}
                <View
                  style={{
                    backgroundColor: "rgba(126, 63, 228, 0.1)",
                    borderWidth: 1,
                    borderColor: "rgba(126, 63, 228, 0.3)",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 24,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "rgba(255, 255, 255, 0.7)", marginBottom: 8 }}>
                    AI Summary
                  </Text>
                  <Text style={{ fontSize: 15, color: "white" }}>{aiSummary}</Text>
                </View>

                <Text style={{ fontSize: 18, fontWeight: "600", color: "white", marginBottom: 16 }}>
                  What was the outcome?
                </Text>

                {/* YES */}
                <TouchableOpacity
                  onPress={() => setSelectedOutcome("YES")}
                  style={{
                    backgroundColor:
                      selectedOutcome === "YES" ? "rgba(255, 59, 48, 0.3)" : "rgba(255, 255, 255, 0.05)",
                    borderWidth: 2,
                    borderColor: selectedOutcome === "YES" ? "#FF3B30" : "rgba(255, 255, 255, 0.1)",
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
                  <View>
                    <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", marginBottom: 4 }}>
                      Yes
                    </Text>
                    <Text style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>
                      They said yes!
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* NO */}
                <TouchableOpacity
                  onPress={() => setSelectedOutcome("NO")}
                  style={{
                    backgroundColor:
                      selectedOutcome === "NO" ? "rgba(76, 175, 80, 0.3)" : "rgba(255, 255, 255, 0.05)",
                    borderWidth: 2,
                    borderColor: selectedOutcome === "NO" ? "#4CAF50" : "rgba(255, 255, 255, 0.1)",
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
                  <View>
                    <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", marginBottom: 4 }}>
                      No
                    </Text>
                    <Text style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>
                      Faced rejection
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* ACTIVITY */}
                <TouchableOpacity
                  onPress={() => setSelectedOutcome("ACTIVITY")}
                  style={{
                    backgroundColor:
                      selectedOutcome === "ACTIVITY" ? "rgba(0, 217, 255, 0.3)" : "rgba(255, 255, 255, 0.05)",
                    borderWidth: 2,
                    borderColor: selectedOutcome === "ACTIVITY" ? "#00D9FF" : "rgba(255, 255, 255, 0.1)",
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
                  <View>
                    <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", marginBottom: 4 }}>
                      Activity
                    </Text>
                    <Text style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>
                      Completed an action
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Save Button */}
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={!selectedOutcome || saveEntryMutation.isPending}
                  style={{
                    backgroundColor: selectedOutcome ? "#7E3FE4" : "rgba(126, 63, 228, 0.3)",
                    borderRadius: 16,
                    padding: 18,
                    alignItems: "center",
                  }}
                >
                  {saveEntryMutation.isPending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
                      Save Entry
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
