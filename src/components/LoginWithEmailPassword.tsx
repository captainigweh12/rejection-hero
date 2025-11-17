import React, { useState, useEffect } from "react";
import { Alert, Pressable, Text, TextInput, View, ActivityIndicator, Image } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { authClient } from "@/lib/authClient";
import { useSession } from "@/lib/useSession";
import { api } from "@/lib/api";
import type { RootStackParamList } from "@/navigation/types";

export default function LoginWithEmailPassword() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const { data: session, refetch } = useSession();

  // Close modal when user is logged in (AuthWrapper will handle navigation)
  useEffect(() => {
    if (session?.user && !isCheckingOnboarding) {
      setIsCheckingOnboarding(true);
      setTimeout(() => {
        // Try to go back, but if we can't, AuthWrapper will handle navigation
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, 100);
    }
  }, [session, navigation, isCheckingOnboarding]);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    console.log("🔐 [Login] Starting sign in process...");
    console.log("🔐 [Login] Backend URL:", process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL);

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log("🔐 [Login] Calling authClient.signIn.email...");
      const result = await authClient.signIn.email({
        email,
        password,
      });

      console.log("🔐 [Login] Auth result:", JSON.stringify(result, null, 2));

      if (result.error) {
        console.error("🔐 [Login] Sign in error:", result.error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Sign In Failed", result.error.message || "Please check your credentials");
      } else {
        console.log("🔐 [Login] Sign in successful!");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setEmail("");
        setPassword("");
        console.log("🔐 [Login] Refetching session...");
        await refetch();
        console.log("🔐 [Login] Session refetched");
      }
    } catch (error) {
      console.error("🔐 [Login] Unexpected error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "An unexpected error occurred. Check logs for details.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    console.log("🔐 [SignUp] Starting sign up process...");
    console.log("🔐 [SignUp] Backend URL:", process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL);

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log("🔐 [SignUp] Calling authClient.signUp.email...");
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });

      console.log("🔐 [SignUp] Auth result:", JSON.stringify(result, null, 2));

      if (result.error) {
        console.error("🔐 [SignUp] Sign up error:", result.error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Sign Up Failed", result.error.message || "Please try again");
      } else {
        console.log("🔐 [SignUp] Sign up successful!");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setEmail("");
        setPassword("");
        setName("");
        setIsSignUp(false);
        console.log("🔐 [SignUp] Refetching session...");
        await refetch();
        console.log("🔐 [SignUp] Session refetched");
      }
    } catch (error) {
      console.error("🔐 [SignUp] Unexpected error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "An unexpected error occurred. Check logs for details.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "vibecode://auth/callback",
      });

      if (result.error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", result.error.message || "Failed to sign in with Google");
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error?.message || "Failed to sign in with Google");
      console.error("Google Sign-In Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking onboarding
  if (session && isCheckingOnboarding) {
    return (
      <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#7E3FE4" />
        <Text className="text-white mt-4 text-lg">Setting up your account...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} className="flex-1">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pt-12 pb-8">
          {/* Logo */}
          <View className="items-center mb-8">
            <Image
              source={require("../../assets/rejection-hero-logo.png")}
              style={{ width: 180, height: 180 }}
              resizeMode="contain"
            />
            <Text className="text-white text-3xl font-bold mt-4">Rejection Hero</Text>
            <Text className="text-white/60 text-base mt-2">Embrace Your Journey</Text>
          </View>

          {/* Form Container */}
          <View
            className="rounded-3xl p-6 mb-6"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderWidth: 1,
              borderColor: "rgba(126, 63, 228, 0.3)",
            }}
          >
            <Text className="text-2xl font-bold text-white text-center mb-6">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </Text>

            {isSignUp && (
              <View className="mb-4">
                <Text className="text-sm font-medium mb-2 text-white/80">Name</Text>
                <View
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderWidth: 1,
                    borderColor: "rgba(126, 63, 228, 0.2)",
                  }}
                >
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    className="text-white text-base"
                    autoCapitalize="words"
                    editable={!isLoading}
                  />
                </View>
              </View>
            )}

            <View className="mb-4">
              <Text className="text-sm font-medium mb-2 text-white/80">Email</Text>
              <View
                className="rounded-xl p-4"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.2)",
                }}
              >
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  className="text-white text-base"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium mb-2 text-white/80">Password</Text>
              <View
                className="rounded-xl p-4"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(126, 63, 228, 0.2)",
                }}
              >
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  className="text-white text-base"
                  secureTextEntry
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Sign In/Up Button */}
            <Pressable
              onPress={isSignUp ? handleSignUp : handleSignIn}
              disabled={isLoading}
              className="rounded-2xl overflow-hidden mb-4"
            >
              <LinearGradient
                colors={["#7E3FE4", "#FF6B35"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 items-center justify-center"
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg text-center">
                    {isSignUp ? "Create Account" : "Sign In"}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            {/* Toggle Sign Up/Sign In */}
            <Pressable
              onPress={() => {
                setIsSignUp(!isSignUp);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              disabled={isLoading}
              className="py-2"
            >
              <Text className="text-white/70 text-center">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <Text className="text-purple-400 font-semibold">
                  {isSignUp ? "Sign In" : "Sign Up"}
                </Text>
              </Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-white/20" />
            <Text className="text-white/50 mx-4">OR</Text>
            <View className="flex-1 h-px bg-white/20" />
          </View>

          {/* Google Sign In Button */}
          <Pressable
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.2)",
            }}
          >
            <View className="py-4 flex-row items-center justify-center">
              <Text className="text-4xl mr-3">🔍</Text>
              <Text className="text-white font-semibold text-base">
                Continue with Google
              </Text>
            </View>
          </Pressable>

          {/* Footer */}
          <Text className="text-white/40 text-xs text-center mt-8">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </LinearGradient>
  );
}
