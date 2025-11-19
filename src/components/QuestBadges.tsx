import React from "react";
import { View, Text } from "react-native";
import { Award, Camera, Video, Users, UsersRound } from "lucide-react-native";

interface QuestBadgesProps {
  badges: {
    silver?: boolean; // Quest has photos (shared to community with images)
    gold?: boolean; // Quest was live streamed
    bronze?: boolean; // Quest was performed with others
    blue?: boolean; // Quest is a group quest
  };
  size?: "small" | "medium" | "large";
}

export function QuestBadges({ badges, size = "medium" }: QuestBadgesProps) {
  const badgeSize = size === "small" ? 16 : size === "large" ? 24 : 20;
  const iconSize = size === "small" ? 10 : size === "large" ? 16 : 12;
  const gap = size === "small" ? 4 : size === "medium" ? 6 : 8;

  const activeBadges = [];

  if (badges.blue) {
    activeBadges.push({
      color: "#3B82F6", // Blue
      icon: UsersRound,
      label: "Group Quest",
    });
  }

  if (badges.gold) {
    activeBadges.push({
      color: "#F59E0B", // Gold/Amber
      icon: Video,
      label: "Live Streamed",
    });
  }

  if (badges.silver) {
    activeBadges.push({
      color: "#9CA3AF", // Silver/Gray
      icon: Camera,
      label: "Has Photos",
    });
  }

  if (badges.bronze) {
    activeBadges.push({
      color: "#CD7F32", // Bronze
      icon: Users,
      label: "Performed with Others",
    });
  }

  if (activeBadges.length === 0) {
    return null;
  }

  return (
    <View style={{ flexDirection: "row", gap, alignItems: "center", flexWrap: "wrap" }}>
      {activeBadges.map((badge, index) => {
        const IconComponent = badge.icon;
        return (
          <View
            key={index}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: `${badge.color}20`,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: badgeSize / 2,
              borderWidth: 1.5,
              borderColor: badge.color,
            }}
          >
            <IconComponent size={iconSize} color={badge.color} />
            <Text
              style={{
                color: badge.color,
                fontSize: size === "small" ? 9 : size === "large" ? 13 : 11,
                fontWeight: "700",
              }}
            >
              {badge.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

