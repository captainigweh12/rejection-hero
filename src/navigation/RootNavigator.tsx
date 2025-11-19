import { StyleSheet, View, ActivityIndicator } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Home, Heart, Users, Video, Map, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { BottomTabParamList, RootStackParamList } from "@/navigation/types";
import HomeScreen from "@/screens/HomeScreen";
import CommunityScreen from "@/screens/CommunityScreen";
import MatchesScreen from "@/screens/MatchesScreen";
import LiveScreen from "@/screens/LiveScreen";
import MapScreen from "@/screens/MapScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import JournalScreen from "@/screens/JournalScreen";
import LoginModalScreen from "@/screens/LoginModalScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";
import AgeVerificationScreen from "@/screens/AgeVerificationScreen";
import EditProfileScreen from "@/screens/EditProfileScreen";
import QuestDetailScreen from "@/screens/QuestDetailScreen";
import CreateQuestScreen from "@/screens/CreateQuestScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import NotificationSettingsScreen from "@/screens/NotificationSettingsScreen";
import AdminScreen from "@/screens/AdminScreen";
import LanguageSelectionScreen from "@/screens/LanguageSelectionScreen";
import SearchUsersScreen from "@/screens/SearchUsersScreen";
import GrowthAchievementsScreen from "@/screens/GrowthAchievementsScreen";
import FriendsScreen from "@/screens/FriendsScreen";
import SendQuestToFriendScreen from "@/screens/SendQuestToFriendScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";
import QuestCalendarScreen from "@/screens/QuestCalendarScreen";
import InviteWarriorsScreen from "@/screens/InviteWarriorsScreen";
import ManageCategoriesScreen from "@/screens/ManageCategoriesScreen";
import SupportScreen from "@/screens/SupportScreen";
import GroupDetailScreen from "@/screens/GroupDetailScreen";
import GroupQuestsScreen from "@/screens/GroupQuestsScreen";
import GroupLiveScreen from "@/screens/GroupLiveScreen";
import ChatScreen from "@/screens/ChatScreen";
import CreateCustomQuestScreen from "@/screens/CreateCustomQuestScreen";
import LeaderboardScreen from "@/screens/LeaderboardScreen";
import LegalPoliciesScreen from "@/screens/LegalPoliciesScreen";
import ParentalGuidanceSettingsScreen from "@/screens/ParentalGuidanceSettingsScreen";
import { useSession } from "@/lib/useSession";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { setupNotificationListeners, requestNotificationPermissions } from "@/services/notificationService";

/**
 * RootStackNavigator
 * The root navigator for the app, which contains the bottom tab navigator and all the screens inside it
 */
const RootStack = createNativeStackNavigator<RootStackParamList>();
const RootNavigator = () => {
  // Set up notification listeners on mount
  useEffect(() => {
    // Request notification permissions
    requestNotificationPermissions();

    // Set up notification listeners
    const listeners = setupNotificationListeners(
      (notification) => {
        console.log("📬 Notification received in foreground:", notification);
      },
      (response) => {
        console.log("👆 Notification tapped:", response);
        // Handle navigation based on notification data
        const data = response.notification.request.content.data;
        if (data?.type === "confidence_low") {
          // Navigation will be handled by the notification screen
        }
      }
    );

    return () => {
      listeners.remove();
    };
  }, []);

  return (
    <>
      <AuthWrapper />
      <RootStack.Navigator>
        <RootStack.Screen
          name="Tabs"
          component={BottomTabNavigator}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="LoginModalScreen"
          component={LoginModalScreen}
          options={{ presentation: "modal", headerShown: false }}
        />
        <RootStack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ title: "Edit Profile", headerShown: true }}
        />
        <RootStack.Screen
          name="QuestDetail"
          component={QuestDetailScreen}
          options={{ title: "Quest", headerShown: true }}
        />
        <RootStack.Screen
          name="CreateQuest"
          component={CreateQuestScreen}
          options={{ presentation: "modal", headerShown: false }}
        />
        <RootStack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: "Settings", headerShown: true }}
        />
        <RootStack.Screen
          name="NotificationSettings"
          component={NotificationSettingsScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="LegalPolicies"
          component={LegalPoliciesScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="ParentalGuidanceSettings"
          component={ParentalGuidanceSettingsScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="Admin"
          component={AdminScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="LanguageSelection"
          component={LanguageSelectionScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="SearchUsers"
          component={SearchUsersScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="GrowthAchievements"
          component={GrowthAchievementsScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="Friends"
          component={FriendsScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="SendQuestToFriend"
          component={SendQuestToFriendScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="CreateCustomQuest"
          component={CreateCustomQuestScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="AgeVerification"
          component={AgeVerificationScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="QuestCalendar"
          component={QuestCalendarScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="InviteWarriors"
          component={InviteWarriorsScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="ManageCategories"
          component={ManageCategoriesScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="Support"
          component={SupportScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="GroupDetail"
          component={GroupDetailScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="GroupQuests"
          component={GroupQuestsScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="GroupLive"
          component={GroupLiveScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="Leaderboard"
          component={LeaderboardScreen}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="Journal"
          component={JournalScreen}
          options={{ headerShown: false }}
        />
      </RootStack.Navigator>
    </>
  );
};

/**
 * AuthWrapper
 * Checks if user is logged in on app startup and opens login modal if not
 * Also checks if user has completed onboarding and redirects if needed
 */
function AuthWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: sessionData, isPending } = useSession();
  const [hasChecked, setHasChecked] = useState(false);

  // Fetch user profile to check onboarding status and age verification
  const { data: profile, error: profileError, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      try {
        const response = await api.get("/api/profile");
        return response as { onboardingCompleted?: boolean; ageVerified?: boolean; age?: number };
      } catch (error) {
        console.error("🔐 [AuthWrapper] Error fetching profile:", error);
        // Return default profile if fetch fails (assume onboarding not completed)
        return { onboardingCompleted: false, ageVerified: false };
      }
    },
    enabled: !!sessionData?.user,
    retry: 2,
    retryDelay: 1000,
  });

  useEffect(() => {
    // Wait for session to be ready and profile to load (or fail)
    if (!isPending && sessionData?.user) {
      // If profile is still loading, wait a bit more
      if (profileLoading) {
        console.log("🔐 [AuthWrapper] Profile still loading, waiting...");
        return;
      }

      // Get current route to avoid unnecessary navigation
      const state = navigation.getState();
      if (!state) return;

      const currentRoute = state.routes[state.index || 0];
      const currentRouteName = currentRoute?.name;

      // Check age verification first
      if (profile && !profile.ageVerified) {
        // User needs to verify age before onboarding
        if (currentRouteName !== "AgeVerification" && !hasChecked) {
          console.log("🔐 [AuthWrapper] User needs age verification - redirecting");
          setHasChecked(true);
          setTimeout(() => {
            navigation.navigate("AgeVerification");
          }, 100);
        }
      } else if (profile && profile.ageVerified && !profile.onboardingCompleted) {
        // User has verified age but needs onboarding
        if (currentRouteName !== "Onboarding" && currentRouteName !== "AgeVerification" && !hasChecked) {
          console.log("🔐 [AuthWrapper] User needs onboarding - redirecting");
          console.log("🔐 [AuthWrapper] Profile onboardingCompleted:", profile.onboardingCompleted);
          setHasChecked(true);
          setTimeout(() => {
            navigation.navigate("Onboarding");
          }, 100);
        }
      } else if (profile && profile.onboardingCompleted) {
        // User has completed onboarding - ensure they're on the main app
        if (currentRouteName === "LoginModalScreen") {
          console.log("🔐 [AuthWrapper] User logged in with completed onboarding, closing login modal");
          setTimeout(() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate("Tabs");
            }
          }, 100);
        } else if (currentRouteName === "Onboarding") {
          // If somehow still on onboarding after completion, navigate away
          console.log("🔐 [AuthWrapper] User completed onboarding, navigating to main app");
          setTimeout(() => {
            navigation.navigate("Tabs");
          }, 100);
        }
        // Reset hasChecked to allow future checks if needed
        if (hasChecked) {
          setHasChecked(false);
        }
      } else if (profileError) {
        // If profile fetch failed, assume age not verified and redirect
        if (currentRouteName !== "AgeVerification" && !hasChecked) {
          console.log("🔐 [AuthWrapper] Profile fetch failed, redirecting to age verification");
          setHasChecked(true);
          setTimeout(() => {
            navigation.navigate("AgeVerification");
          }, 100);
        }
      } else if (!profile) {
        // Profile doesn't exist yet - will be auto-created with ageVerified: false
        // Wait for profile to be created, then redirect will happen on next effect run
        console.log("🔐 [AuthWrapper] Profile doesn't exist yet, waiting for auto-creation...");
        // Profile will be auto-created on next profile fetch with ageVerified: false
      }
    }
  }, [sessionData, isPending, hasChecked, navigation, profile, profileLoading, profileError]);

  return null;
}

/**
 * BottomTabNavigator
 * The bottom tab navigator for the app
 */
const BottomTab = createBottomTabNavigator<BottomTabParamList>();
const BottomTabNavigator = () => {
  return (
    <BottomTab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "rgba(10, 10, 15, 0.95)",
          borderTopWidth: 1,
          borderTopColor: "rgba(126, 63, 228, 0.2)",
        },
        tabBarActiveTintColor: "#FF6B35",
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.5)",
        tabBarBackground: () => (
          <BlurView tint="dark" intensity={100} style={StyleSheet.absoluteFill} />
        ),
      }}
      screenListeners={() => ({
        transitionStart: () => {
          Haptics.selectionAsync();
        },
      })}
    >
      <BottomTab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <BottomTab.Screen
        name="SwipeTab"
        component={CommunityScreen}
        options={{
          title: "Community",
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <BottomTab.Screen
        name="LiveTab"
        component={LiveScreen}
        options={{
          title: "Live",
          tabBarIcon: ({ color, size }) => <Video size={size} color={color} />,
        }}
      />
      <BottomTab.Screen
        name="MapTab"
        component={MapScreen}
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => <Map size={size} color={color} />,
        }}
      />
      <BottomTab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </BottomTab.Navigator>
  );
};

export default RootNavigator;
