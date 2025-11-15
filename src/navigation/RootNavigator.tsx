import { StyleSheet, View, ActivityIndicator } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Home, Heart, Users, Video, Map, User, BookOpen } from "lucide-react-native";
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
import EditProfileScreen from "@/screens/EditProfileScreen";
import QuestDetailScreen from "@/screens/QuestDetailScreen";
import CreateQuestScreen from "@/screens/CreateQuestScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import LanguageSelectionScreen from "@/screens/LanguageSelectionScreen";
import SearchUsersScreen from "@/screens/SearchUsersScreen";
import GrowthAchievementsScreen from "@/screens/GrowthAchievementsScreen";
import FriendsScreen from "@/screens/FriendsScreen";
import SendQuestToFriendScreen from "@/screens/SendQuestToFriendScreen";
import { useSession } from "@/lib/useSession";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

/**
 * RootStackNavigator
 * The root navigator for the app, which contains the bottom tab navigator and all the screens inside it
 */
const RootStack = createNativeStackNavigator<RootStackParamList>();
const RootNavigator = () => {
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
          options={{ presentation: "modal", title: "Login" }}
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
          name="Onboarding"
          component={OnboardingScreen}
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

  // Fetch user profile to check onboarding status
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await api.get("/api/profile");
      return response as { onboardingCompleted?: boolean };
    },
    enabled: !!sessionData?.user,
  });

  useEffect(() => {
    if (!isPending && !hasChecked) {
      setHasChecked(true);

      if (!sessionData?.user) {
        // Open login modal on first launch if not authenticated
        setTimeout(() => {
          navigation.navigate("LoginModalScreen");
        }, 100);
      } else if (profile && !profile.onboardingCompleted) {
        // Redirect to onboarding if user hasn't completed it
        setTimeout(() => {
          navigation.navigate("Onboarding");
        }, 100);
      }
    }
  }, [sessionData, isPending, hasChecked, navigation, profile]);

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
        name="JournalTab"
        component={JournalScreen}
        options={{
          title: "Journal",
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
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
