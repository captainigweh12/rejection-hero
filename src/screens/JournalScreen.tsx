import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  Image,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Plus,
  Star,
  CheckCircle,
  XCircle,
  Activity,
  ChevronLeft,
  ChevronRight,
  Flame,
  Calendar as CalendarIcon,
  MapPin,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { BottomTabScreenProps } from "@/navigation/types";
import AddJournalModal from "@/components/AddJournalModal";
import { useTheme } from "@/contexts/ThemeContext";
import { useSession } from "@/lib/useSession";
import { LinearGradient } from "expo-linear-gradient";
import type { GetUserStatsResponse } from "@/shared/contracts";

interface JournalEntry {
  id: string;
  audioUrl: string | null;
  audioTranscript: string | null;
  aiSummary: string;
  userEditedSummary: string | null;
  outcome: string;
  imageUrls?: string[];
  location?: string | null;
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
  const { colors } = useTheme();
  const { data: sessionData } = useSession();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showInsights, setShowInsights] = useState(true);

  // Fetch user stats
  const { data: statsData } = useQuery<GetUserStatsResponse>({
    queryKey: ["stats"],
    queryFn: async () => {
      return api.get<GetUserStatsResponse>("/api/stats");
    },
    enabled: !!sessionData?.user,
  });

  // Fetch journal entries
  const { data: entriesData, isLoading, error: entriesError, refetch } = useQuery({
    queryKey: ["journal-entries"],
    queryFn: async () => {
      console.log("[JournalScreen] Fetching journal entries...");
      try {
        const result = await api.get<GetJournalEntriesResponse>("/api/journal");
        console.log("[JournalScreen] Fetched entries:", result?.entries?.length || 0);
        return result;
      } catch (error) {
        console.error("[JournalScreen] Error fetching entries:", error);
        throw error;
      }
    },
    enabled: !!sessionData?.user,
    retry: 2,
  });

  const entries = entriesData?.entries || [];

  // Get entries for selected date
  const entriesForSelectedDate = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    
    return entries.filter((entry) => {
      try {
        const entryDate = new Date(entry.createdAt);
        // Normalize dates to compare only year, month, day (ignore time)
        const entryDateOnly = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
        const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        return entryDateOnly.getTime() === selectedDateOnly.getTime();
      } catch (error) {
        console.error("[JournalScreen] Error parsing entry date:", error, entry);
        return false;
      }
    });
  }, [entries, selectedDate]);

  // Get dates with entries for current month
  const datesWithEntries = useMemo(() => {
    if (!entries || entries.length === 0) return new Set<number>();
    
    return new Set(
      entries
        .filter((entry) => {
          try {
            const entryDate = new Date(entry.createdAt);
            return (
              entryDate.getMonth() === currentMonth.getMonth() &&
              entryDate.getFullYear() === currentMonth.getFullYear()
            );
          } catch (error) {
            console.error("[JournalScreen] Error parsing entry date for calendar:", error, entry);
            return false;
          }
        })
        .map((entry) => {
          try {
            return new Date(entry.createdAt).getDate();
          } catch (error) {
            console.error("[JournalScreen] Error getting date from entry:", error, entry);
            return 0;
          }
        })
        .filter((day) => day > 0) // Filter out invalid dates
    );
  }, [entries, currentMonth]);

  // Calculate stats
  const journalStats = useMemo(() => {
    const totalEntries = entries.length;
    const noCount = entries.filter((e) => e.outcome === "NO").length;
    const yesCount = entries.filter((e) => e.outcome === "YES").length;
    const activityCount = entries.filter((e) => e.outcome === "ACTIVITY").length;
    const totalAchievements = entries.reduce((sum, e) => sum + e.achievements.length, 0);

    return {
      totalEntries,
      noCount,
      yesCount,
      activityCount,
      totalAchievements,
    };
  }, [entries]);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Render calendar
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    // Day names header
    days.push(
      <View key="header" style={{ flexDirection: "row", marginBottom: 8 }}>
        {dayNames.map((name) => (
          <View key={name} style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "600" }}>
              {name}
            </Text>
          </View>
        ))}
      </View>
    );

    // Empty cells
    let dayNumbers = [];
    for (let i = 0; i < firstDay; i++) {
      dayNumbers.push(<View key={`empty-${i}`} style={{ flex: 1 }} />);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected =
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear();
      const hasEntry = datesWithEntries.has(day);
      const isToday =
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear();

      dayNumbers.push(
        <Pressable
          key={day}
          onPress={() => setSelectedDate(date)}
          style={{
            flex: 1,
            aspectRatio: 1,
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 8,
            backgroundColor: isSelected ? "rgba(0, 217, 255, 0.2)" : "transparent",
            borderWidth: isSelected ? 1 : 0,
            borderColor: isSelected ? "#00D9FF" : "transparent",
          }}
        >
          <View style={{ position: "relative" }}>
            <Text
              style={{
                color: isToday ? "#FFD700" : colors.text,
                fontSize: 14,
                fontWeight: isToday ? "bold" : "600",
              }}
            >
              {day}
            </Text>
            {hasEntry && (
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#FF6B35",
                  position: "absolute",
                  bottom: -6,
                  alignSelf: "center",
                }}
              />
            )}
          </View>
        </Pressable>
      );
    }

    const rows = [];
    for (let i = 0; i < dayNumbers.length; i += 7) {
      rows.push(
        <View key={`row-${i}`} style={{ flexDirection: "row", marginBottom: 8 }}>
          {dayNumbers.slice(i, i + 7)}
        </View>
      );
    }

    return [days[0], ...rows];
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSolid }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Header */}
          <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.text }}>
                  Journal
                </Text>
                <Text style={{ fontSize: 14, marginTop: 4, color: colors.textSecondary }}>
                  Track your growth journey
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.primary,
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Plus size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Insights Panel */}
          {showInsights && (
            <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
              <LinearGradient
                colors={["rgba(126, 63, 228, 0.15)", "rgba(0, 217, 255, 0.1)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "rgba(0, 217, 255, 0.2)",
                }}
              >
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 16 }}>
                    Insights
                  </Text>

                  {/* Streak Card */}
                  <View
                    style={{
                      backgroundColor: "rgba(67, 233, 123, 0.15)",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: "rgba(67, 233, 123, 0.3)",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: "rgba(67, 233, 123, 0.2)",
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 12,
                        }}
                      >
                        <Flame size={24} color="#43E97B" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>Current Streak</Text>
                        <Text style={{ fontSize: 20, fontWeight: "bold", color: "#43E97B" }}>
                          {statsData?.currentStreak || 0} days
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Stats Grid */}
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    {/* Entries Card */}
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "rgba(255, 107, 53, 0.15)",
                        borderRadius: 12,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: "rgba(255, 107, 53, 0.3)",
                      }}
                    >
                      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#FF6B35" }}>
                        {journalStats.totalEntries}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                        Entries
                      </Text>
                    </View>

                    {/* YES Count */}
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "rgba(67, 233, 123, 0.15)",
                        borderRadius: 12,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: "rgba(67, 233, 123, 0.3)",
                      }}
                    >
                      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#43E97B" }}>
                        {journalStats.yesCount}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                        YES Outcomes
                      </Text>
                    </View>

                    {/* NO Count */}
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "rgba(0, 217, 255, 0.15)",
                        borderRadius: 12,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: "rgba(0, 217, 255, 0.3)",
                      }}
                    >
                      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#00D9FF" }}>
                        {journalStats.noCount}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                        NO Outcomes
                      </Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Calendar Section */}
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <View
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                borderRadius: 16,
                padding: 16,
              }}
            >
              {/* Month Navigation */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text }}>
                  {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    onPress={goToPreviousMonth}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: colors.surface,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <ChevronLeft size={20} color={colors.text} />
                  </Pressable>
                  <Pressable
                    onPress={goToNextMonth}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: colors.surface,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <ChevronRight size={20} color={colors.text} />
                  </Pressable>
                </View>
              </View>

              {/* Calendar Grid */}
              {renderCalendar()}
            </View>
          </View>

          {/* Date Header */}
          <View style={{ paddingHorizontal: 24, marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.text }}>
              {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </Text>
          </View>

          {/* Entries for Selected Date */}
          {isLoading ? (
            <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 60 }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : entriesError ? (
            <View style={{ paddingHorizontal: 24, paddingVertical: 40, alignItems: "center" }}>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: "rgba(255, 59, 48, 0.2)",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <XCircle size={30} color="#FF3B30" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 4 }}>
                Error loading entries
              </Text>
              <Text style={{ fontSize: 12, textAlign: "center", color: colors.textSecondary, marginBottom: 16 }}>
                {entriesError instanceof Error ? entriesError.message : "Failed to load journal entries"}
              </Text>
              <TouchableOpacity
                onPress={() => refetch()}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : entriesForSelectedDate.length > 0 ? (
            <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
              {entriesForSelectedDate.map((entry) => (
                <View
                  key={entry.id}
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                    overflow: "hidden",
                  }}
                >
                  {/* Entry Header */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      {entry.outcome === "YES" && (
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: "rgba(67, 233, 123, 0.2)",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <CheckCircle size={18} color="#43E97B" />
                        </View>
                      )}
                      {entry.outcome === "NO" && (
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: "rgba(0, 217, 255, 0.2)",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <XCircle size={18} color="#00D9FF" />
                        </View>
                      )}
                      {entry.outcome === "ACTIVITY" && (
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: "rgba(255, 107, 53, 0.2)",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Activity size={18} color="#FF6B35" />
                        </View>
                      )}
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: colors.textSecondary,
                          textTransform: "uppercase",
                        }}
                      >
                        {entry.outcome}
                      </Text>
                    </View>
                    {entry.achievements.length > 0 && (
                      <Star size={18} color="#FFD700" fill="#FFD700" />
                    )}
                  </View>

                  {/* Location */}
                  {entry.location && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <MapPin size={14} color={colors.primary} />
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        {entry.location}
                      </Text>
                    </View>
                  )}

                  {/* Summary Text */}
                  <Text style={{ fontSize: 14, lineHeight: 20, color: colors.text, marginBottom: 12 }}>
                    {entry.userEditedSummary || entry.aiSummary}
                  </Text>

                  {/* Images Gallery */}
                  {entry.imageUrls && entry.imageUrls.length > 0 && (
                    <View style={{ marginBottom: 12 }}>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8 }}
                      >
                        {entry.imageUrls
                          .filter((url) => url && typeof url === "string") // Filter out invalid URLs
                          .map((imageUrl, index) => (
                            <Image
                              key={`${entry.id}-img-${index}`}
                              source={{ uri: imageUrl }}
                              style={{
                                width: 120,
                                height: 120,
                                borderRadius: 12,
                                backgroundColor: colors.surface,
                              }}
                              onError={(error) => {
                                console.error("[JournalScreen] Error loading image:", imageUrl, error);
                              }}
                            />
                          ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Achievement Badge */}
                  {entry.achievements.length > 0 && (
                    <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.cardBorder }}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 }}>
                        Achievement Unlocked
                      </Text>
                      <View style={{ backgroundColor: "rgba(255, 215, 0, 0.15)", borderRadius: 8, padding: 10 }}>
                        <Text style={{ fontSize: 12, color: "#FFD700" }}>
                          {entry.achievements[0].description}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={{ paddingHorizontal: 24, paddingVertical: 40, alignItems: "center" }}>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: colors.primaryLight,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <CalendarIcon size={30} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 4 }}>
                No entries yet
              </Text>
              <Text style={{ fontSize: 12, textAlign: "center", color: colors.textSecondary }}>
                Start your journey by recording your first experience
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
          refetch();
        }}
      />
    </View>
  );
}
