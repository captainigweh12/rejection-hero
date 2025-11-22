import type { BottomTabScreenProps as BottomTabScreenPropsBase } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<BottomTabParamList> | undefined;
  InsideScreen: undefined;
  LoginModalScreen: undefined;
  AgeVerification: undefined;
  Onboarding: undefined;
  EditProfile: undefined;
  QuestDetail: { userQuestId: string };
  CreateQuest: undefined;
  Settings: undefined;
  NotificationSettings: undefined;
  Admin: undefined;
  LanguageSelection: undefined;
  SearchUsers: undefined;
  GrowthAchievements: undefined;
  Friends: undefined;
  SendQuestToFriend: { friendId: string; friendName: string };
  CreateCustomQuest: { friendId?: string; friendName?: string };
  Notifications: undefined;
  QuestCalendar: undefined;
  InviteWarriors: undefined;
  ManageCategories: undefined;
  Support: undefined;
  GroupDetail: { groupId: string };
  GroupQuests: { groupId: string; groupName: string };
  GroupLive: { groupId: string; groupName: string };
  Chat: { userId: string; userName: string; userAvatar?: string | null };
  Leaderboard: undefined;
  Journal: undefined;
  LegalPolicies: undefined;
  ParentalGuidanceSettings: undefined;
  ReportBug: undefined;
  FriendQuestView: { userQuestId: string; userId: string };
  CreateStory: { initialCaption?: string } | undefined;
  QuestComplete: {
    questData: {
      questTitle: string;
      questCategory: string;
      xpEarned: number;
      pointsEarned: number;
      noCount: number;
      yesCount: number;
      actionCount: number;
    };
    onContinue: () => void;
  };
  QuestStreak: {
    streakData: {
      currentStreak: number;
      previousStreak: number;
      streakIncreased: boolean;
    };
    onContinue: () => void;
  };
  QuestWeeklyAchievements: {
    weeklyData: {
      achievements: Array<{
        id: string;
        title: string;
        description: string;
        progress: number;
        target: number;
        icon: "trophy" | "target" | "award" | "star";
        completed: boolean;
      }>;
      weeklyNoCount: number;
      weeklyQuestCount: number;
    };
    onContinue: () => void;
  };
  QuestLeaderboardPosition: {
    leaderboardData: {
      currentRank: number;
      previousRank: number;
      rankChanged: boolean;
      rankDirection: "up" | "down" | "same";
      totalXP: number;
      totalPoints: number;
    };
    onContinue: () => void;
  };
  QuestCelebrationFinal: {
    celebrationSummary: {
      questTitle: string;
      xpEarned: number;
      pointsEarned: number;
      streak: number;
      rank: number;
      rankChange?: number;
    };
    onShareToStory: () => void;
    onShareAsPost: () => void;
  };
};

export type BottomTabParamList = {
  HomeTab: undefined;
  SwipeTab: { initialPostContent?: string } | undefined;
  MatchesTab: undefined;
  LiveTab: undefined;
  JournalTab: undefined;
  MapTab: undefined;
  ProfileTab: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type BottomTabScreenProps<Screen extends keyof BottomTabParamList> = CompositeScreenProps<
  BottomTabScreenPropsBase<BottomTabParamList, Screen>,
  NativeStackScreenProps<RootStackParamList>
>;
