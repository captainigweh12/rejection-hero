import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Star, CheckCircle, XCircle, Activity } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { BottomTabScreenProps } from "@/navigation/types";
import AddJournalModal from "@/components/AddJournalModal";

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
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch journal entries
  const { data: entriesData, isLoading, error, refetch } = useQuery({
    queryKey: ["journal-entries"],
    queryFn: async () => {
      console.log("[JournalScreen] Fetching journal entries...");
      const result = await api.get<GetJournalEntriesResponse>("/api/journal");
      console.log("[JournalScreen] Fetched entries:", result?.entries?.length || 0);
      return result;
    },
  });

  // Log when data changes
  React.useEffect(() => {
    console.log("[JournalScreen] entriesData updated:", {
      hasData: !!entriesData,
      entryCount: entriesData?.entries?.length || 0,
      entries: entriesData?.entries?.map(e => ({
        id: e.id,
        summary: e.userEditedSummary || e.aiSummary,
        outcome: e.outcome,
      })),
    });
  }, [entriesData]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="py-6 flex-row justify-between items-center">
            <View>
              <Text className="text-3xl font-bold text-white">Journal</Text>
              <Text className="text-base text-white/60 mt-1">
                Record your growth experiences
              </Text>
            </View>

            {/* Add Entry Button */}
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#7E3FE4",
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#7E3FE4",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Plus size={28} color="white" />
            </TouchableOpacity>
          </View>

          {/* Debug Info */}
          {__DEV__ && (
            <View style={{ padding: 12, backgroundColor: "rgba(255, 255, 255, 0.05)", marginBottom: 12, borderRadius: 8 }}>
              <Text className="text-white/60 text-xs">
                Debug: {isLoading ? "Loading..." : `${entriesData?.entries?.length || 0} entries`}
                {error ? ` | Error: ${error}` : ""}
              </Text>
            </View>
          )}

          {/* Recent Entries */}
          {entriesData && entriesData.entries.length > 0 ? (
            <View className="mb-8">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-white">
                  Your Entries
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("GrowthAchievements")}
                >
                  <Text className="text-[#7E3FE4] font-semibold">
                    View Achievements
                  </Text>
                </TouchableOpacity>
              </View>

              {entriesData.entries.map((entry) => (
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
                        <CheckCircle size={20} color="#FF3B30" />
                      )}
                      {entry.outcome === "NO" && (
                        <XCircle size={20} color="#4CAF50" />
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
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 60,
              }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "rgba(126, 63, 228, 0.1)",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Plus size={40} color="#7E3FE4" />
              </View>
              <Text className="text-white/80 text-lg font-semibold mb-2">
                No entries yet
              </Text>
              <Text className="text-white/60 text-sm text-center px-8">
                Tap the + button to record your first growth experience
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Add Journal Modal */}
      <AddJournalModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={() => {
          // Modal handles success message
        }}
      />
    </View>
  );
}
