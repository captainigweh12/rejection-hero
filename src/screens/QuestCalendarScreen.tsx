import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, ChevronLeft, ChevronRight, Target, TrendingUp, CheckCircle2 } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { LinearGradient } from "expo-linear-gradient";

type Props = RootStackScreenProps<"QuestCalendar">;

interface CompletedQuest {
  id: string;
  completedAt: string;
  quest: {
    title: string;
    category: string;
    difficulty: string;
    xpReward: number;
    pointReward: number;
  };
  noCount: number;
  yesCount: number;
  actionCount: number;
}

export default function QuestCalendarScreen({ navigation }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch completed quests
  const { data: questsData, isLoading } = useQuery({
    queryKey: ["completed-quests"],
    queryFn: async () => {
      return api.get<{ quests: CompletedQuest[] }>("/api/quests/completed");
    },
  });

  const completedQuests = questsData?.quests || [];

  // Get quests for selected date
  const questsForDate = completedQuests.filter((q) => {
    const questDate = new Date(q.completedAt);
    return (
      questDate.getDate() === selectedDate.getDate() &&
      questDate.getMonth() === selectedDate.getMonth() &&
      questDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  // Get dates with completed quests for the current month
  const datesWithQuests = new Set(
    completedQuests
      .filter((q) => {
        const questDate = new Date(q.completedAt);
        return (
          questDate.getMonth() === currentMonth.getMonth() &&
          questDate.getFullYear() === currentMonth.getFullYear()
        );
      })
      .map((q) => new Date(q.completedAt).getDate())
  );

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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      SALES: "#FF6B35",
      SOCIAL: "#00D9FF",
      ENTREPRENEURSHIP: "#7E3FE4",
      DATING: "#FF3B9A",
      CONFIDENCE: "#FFD700",
      CAREER: "#4CAF50",
    };
    return colors[category] || "#7E3FE4";
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      EASY: "#4CAF50",
      MEDIUM: "#FFD700",
      HARD: "#FF6B35",
      EXPERT: "#FF3B30",
    };
    return colors[difficulty] || "#7E3FE4";
  };

  // Render calendar grid
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Day names header
    days.push(
      <View key="header" style={{ flexDirection: "row", marginBottom: 8 }}>
        {dayNames.map((name) => (
          <View key={name} style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 12, fontWeight: "600" }}>
              {name}
            </Text>
          </View>
        ))}
      </View>
    );

    // Empty cells for days before the first of the month
    let dayNumbers = [];
    for (let i = 0; i < firstDay; i++) {
      dayNumbers.push(<View key={`empty-${i}`} style={{ flex: 1 }} />);
    }

    // Actual day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected =
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear();
      const hasQuest = datesWithQuests.has(day);
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
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            backgroundColor: isSelected ? "#7E3FE4" : "transparent",
            borderWidth: isToday && !isSelected ? 2 : 0,
            borderColor: "#7E3FE4",
            margin: 2,
          }}
        >
          <Text
            style={{
              color: isSelected ? "white" : "rgba(255, 255, 255, 0.9)",
              fontSize: 14,
              fontWeight: isSelected ? "bold" : "400",
            }}
          >
            {day}
          </Text>
          {hasQuest && (
            <View
              style={{
                position: "absolute",
                bottom: 2,
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: isSelected ? "white" : "#00D9FF",
              }}
            />
          )}
        </Pressable>
      );

      // Start a new row every 7 days
      if ((firstDay + day) % 7 === 0 || day === daysInMonth) {
        days.push(
          <View key={`week-${day}`} style={{ flexDirection: "row" }}>
            {dayNumbers}
          </View>
        );
        dayNumbers = [];
      }
    }

    return days;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
      <LinearGradient
        colors={["#0A0A0F", "#1A1A24", "#2A1A34"]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 }}>
            <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
              <ChevronLeft size={28} color="white" />
            </Pressable>
            <Calendar size={24} color="#7E3FE4" />
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "white", marginLeft: 12 }}>
              Quest Calendar
            </Text>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Calendar Card */}
            <View
              style={{
                marginHorizontal: 20,
                marginBottom: 24,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "rgba(126, 63, 228, 0.3)",
              }}
            >
              {/* Month Navigation */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <Pressable
                  onPress={goToPreviousMonth}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "rgba(126, 63, 228, 0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ChevronLeft size={20} color="white" />
                </Pressable>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
                  {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
                </Text>
                <Pressable
                  onPress={goToNextMonth}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "rgba(126, 63, 228, 0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ChevronRight size={20} color="white" />
                </Pressable>
              </View>

              {/* Calendar Grid */}
              {renderCalendar()}
            </View>

            {/* Quests for Selected Date */}
            <View style={{ paddingHorizontal: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <Target size={20} color="#00D9FF" />
                <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", marginLeft: 8 }}>
                  {selectedDate.toLocaleDateString("default", { month: "long", day: "numeric", year: "numeric" })}
                </Text>
              </View>

              {isLoading ? (
                <ActivityIndicator size="large" color="#7E3FE4" style={{ marginTop: 40 }} />
              ) : questsForDate.length === 0 ? (
                <View
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 16,
                    padding: 32,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "rgba(126, 63, 228, 0.3)",
                  }}
                >
                  <CheckCircle2 size={48} color="rgba(255, 255, 255, 0.3)" />
                  <Text
                    style={{
                      fontSize: 16,
                      color: "rgba(255, 255, 255, 0.6)",
                      marginTop: 16,
                      textAlign: "center",
                    }}
                  >
                    No quests completed on this date
                  </Text>
                </View>
              ) : (
                questsForDate.map((quest, index) => (
                  <View
                    key={quest.id}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: `${getCategoryColor(quest.quest.category)}40`,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                      <View
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                          borderRadius: 12,
                          backgroundColor: `${getCategoryColor(quest.quest.category)}30`,
                          marginRight: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: getCategoryColor(quest.quest.category),
                          }}
                        >
                          {quest.quest.category}
                        </Text>
                      </View>
                      <View
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                          borderRadius: 12,
                          backgroundColor: `${getDifficultyColor(quest.quest.difficulty)}30`,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: getDifficultyColor(quest.quest.difficulty),
                          }}
                        >
                          {quest.quest.difficulty}
                        </Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 16, fontWeight: "700", color: "white", marginBottom: 8 }}>
                      {quest.quest.title}
                    </Text>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={{ fontSize: 14, color: "#4CAF50", fontWeight: "600" }}>
                          {quest.noCount} NOs
                        </Text>
                      </View>
                      {quest.yesCount > 0 && (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Text style={{ fontSize: 14, color: "#FF3B30", fontWeight: "600" }}>
                            {quest.yesCount} YESes
                          </Text>
                        </View>
                      )}
                      {quest.actionCount > 0 && (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Text style={{ fontSize: 14, color: "#FFD700", fontWeight: "600" }}>
                            {quest.actionCount} Actions
                          </Text>
                        </View>
                      )}
                      <View style={{ flexDirection: "row", alignItems: "center", marginLeft: "auto" }}>
                        <TrendingUp size={14} color="#7E3FE4" />
                        <Text style={{ fontSize: 14, color: "#7E3FE4", fontWeight: "600", marginLeft: 4 }}>
                          {quest.quest.xpReward} XP
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Summary Stats */}
            <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", marginBottom: 16 }}>
                This Month&apos;s Progress
              </Text>
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.3)",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 28, fontWeight: "bold", color: "#7E3FE4" }}>
                      {datesWithQuests.size}
                    </Text>
                    <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)", marginTop: 4 }}>
                      Active Days
                    </Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 28, fontWeight: "bold", color: "#00D9FF" }}>
                      {completedQuests.filter((q) => {
                        const date = new Date(q.completedAt);
                        return (
                          date.getMonth() === currentMonth.getMonth() &&
                          date.getFullYear() === currentMonth.getFullYear()
                        );
                      }).length}
                    </Text>
                    <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.6)", marginTop: 4 }}>
                      Quests Done
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
