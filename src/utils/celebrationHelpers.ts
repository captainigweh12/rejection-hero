/**
 * Celebration Flow Helpers
 * 
 * Utilities for generating accomplishment images and managing celebration flow data
 */

import { View, Text } from "react-native";
import { captureRef } from "react-native-view-shot";
import { LinearGradient } from "expo-linear-gradient";
import { Trophy, Flame, Star, Zap } from "lucide-react-native";

export interface CelebrationData {
  questTitle: string;
  questCategory: string;
  xpEarned: number;
  pointsEarned: number;
  noCount: number;
  streak: number;
  rank: number;
  rankChange?: number;
}

/**
 * Generate a story caption for quest completion
 */
export function generateStoryCaption(data: CelebrationData): string {
  const emoji = data.rankChange && data.rankChange > 0 ? "📈" : "🎉";
  return `${emoji} Just completed "${data.questTitle}"!\n\n` +
    `🔥 ${data.streak} day streak\n` +
    `⭐ +${data.xpEarned} XP | +${data.pointsEarned} points\n` +
    `🏆 Rank #${data.rank}\n\n` +
    `#RejectionHero #QuestComplete`;
}

/**
 * Generate a post content for quest completion
 */
export function generatePostContent(data: CelebrationData): string {
  return `🎉 Quest Complete: ${data.questTitle}\n\n` +
    `I just completed another quest in the ${data.questCategory} category!\n\n` +
    `📊 Stats:\n` +
    `• ${data.noCount} NOs collected\n` +
    `• ${data.xpEarned} XP earned\n` +
    `• ${data.pointsEarned} points gained\n` +
    `• 🔥 ${data.streak} day streak\n` +
    `• 🏆 Rank #${data.rank}${data.rankChange ? ` (${data.rankChange > 0 ? "+" : ""}${data.rankChange})` : ""}\n\n` +
    `Every rejection is a step forward! 💪\n\n` +
    `#RejectionHero #QuestComplete #GrowthMindset`;
}

/**
 * Get category color for UI
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    SALES: "#FF6B35",
    SOCIAL: "#00D9FF",
    ENTREPRENEURSHIP: "#7E3FE4",
    DATING: "#FF4081",
    CONFIDENCE: "#FFD700",
    CAREER: "#4CAF50",
  };
  return colors[category] || "#7E3FE4";
}

