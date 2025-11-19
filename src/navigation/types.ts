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
  CreateCustomQuest: { friendId: string; friendName: string };
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
};

export type BottomTabParamList = {
  HomeTab: undefined;
  SwipeTab: undefined;
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
