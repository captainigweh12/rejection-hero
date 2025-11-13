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
import SwipeScreen from "@/screens/SwipeScreen";
import MatchesScreen from "@/screens/MatchesScreen";
import LiveScreen from "@/screens/LiveScreen";
import MapScreen from "@/screens/MapScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import LoginModalScreen from "@/screens/LoginModalScreen";
import EditProfileScreen from "@/screens/EditProfileScreen";
import QuestDetailScreen from "@/screens/QuestDetailScreen";
import { useSession } from "@/lib/useSession";

/**
 * RootStackNavigator
 * The root navigator for the app, which contains the bottom tab navigator and all the screens inside it
 */
const RootStack = createNativeStackNavigator<RootStackParamList>();
const RootNavigator = () => {
  return (
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
    </RootStack.Navigator>
  );
};

/**
 * AuthWrapper
 * Checks if user is logged in on app startup and opens login modal if not
 */
function AuthWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: sessionData, isPending } = useSession();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!isPending && !hasChecked) {
      setHasChecked(true);
      if (!sessionData?.user) {
        // Open login modal on first launch if not authenticated
        setTimeout(() => {
          navigation.navigate("LoginModalScreen");
        }, 100);
      }
    }
  }, [sessionData, isPending, hasChecked, navigation]);

  return null;
}

/**
 * BottomTabNavigator
 * The bottom tab navigator for the app
 */
const BottomTab = createBottomTabNavigator<BottomTabParamList>();
const BottomTabNavigator = () => {
  return (
    <>
      <AuthWrapper />
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
        component={SwipeScreen}
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
    </>
  );
};

export default RootNavigator;
