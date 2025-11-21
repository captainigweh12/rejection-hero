import React, { useState, useEffect } from "react";
import { Alert, Pressable, Text, TextInput, View, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { authClient } from "@/lib/authClient";
import { useSession } from "@/lib/useSession";
import { api } from "@/lib/api";
import type { RootStackParamList } from "@/navigation/types";
import ForgotPasswordScreen from "./ForgotPasswordScreen";
import PolicyViewerModal from "./PolicyViewerModal";

export default function LoginWithEmailPassword() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [showPolicyViewer, setShowPolicyViewer] = useState(false);
  const { data: session, refetch } = useSession();

  // Close modal when user is logged in (AuthWrapper will handle navigation)
  useEffect(() => {
    if (session?.user && !isCheckingOnboarding) {
      console.log("🔐 [Login] Session detected, closing login modal");
      setIsCheckingOnboarding(true);
      
      // Give a small delay to ensure session is fully established
      const timer = setTimeout(() => {
        // Try to go back, but if we can't, AuthWrapper will handle navigation
        if (navigation.canGoBack()) {
          console.log("🔐 [Login] Navigating back from login modal");
          navigation.goBack();
        } else {
          console.log("🔐 [Login] Cannot go back, closing modal directly");
          // If we can't go back, try to close the modal by navigating to Tabs
          navigation.navigate("Tabs");
        }
      }, 500); // Increased delay to ensure session is ready
      
      // Fallback timeout - if navigation doesn't work after 3 seconds, force close
      const fallbackTimer = setTimeout(() => {
        console.log("🔐 [Login] Fallback: Force closing modal after timeout");
        setIsCheckingOnboarding(false);
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate("Tabs");
        }
      }, 3000);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(fallbackTimer);
      };
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
        setIsLoading(false);
        return;
      }

      console.log("🔐 [Login] Sign in successful!");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEmail("");
      setPassword("");

      // Refetch session and wait for it to be available
      console.log("🔐 [Login] Refetching session...");
      try {
        // Trigger refetch (it returns void, not a promise)
        refetch();
        
        // Wait for session to be available (with retry logic)
        // The session from the hook will update reactively
        let retries = 0;
        const maxRetries = 15; // 3 seconds total (15 * 200ms)
        while (retries < maxRetries) {
          // Small delay to allow session to update reactively
          await new Promise((resolve) => setTimeout(resolve, 200));
          
          // Check if session is now available from the hook
          // We need to check the current session state
          // Since we can't directly access it here, we'll rely on the useEffect
          // But we can trigger another refetch to help
          if (retries % 3 === 0) {
            // Refetch every 600ms to check for session
            refetch();
          }
          
          retries++;
        }
        
        console.log("🔐 [Login] Session refetch completed");
        // The useEffect will handle navigation when session becomes available
      } catch (refetchError) {
        console.error("🔐 [Login] Error during session refetch:", refetchError);
        // Don't fail the login if refetch fails - session might still be valid
        // The useEffect will handle navigation when session becomes available
      }
    } catch (error) {
      console.error("🔐 [Login] Unexpected error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Provide more helpful error messages
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("Network") || error.message.includes("fetch failed")) {
          errorMessage = "Network error: Please check your internet connection and try again.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Request timed out. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert("Error", errorMessage);
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
      console.log("🔐 [SignUp] Backend URL:", process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL);

      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });

      console.log("🔐 [SignUp] Auth result received");
      console.log("🔐 [SignUp] Result has error:", !!result.error);
      console.log("🔐 [SignUp] Result has data:", !!result.data);
      if (result.error) {
        console.error("🔐 [SignUp] Error details:", JSON.stringify(result.error, null, 2));
      }
      if (result.data) {
        console.log("🔐 [SignUp] Success data:", JSON.stringify(result.data, null, 2));
      }

      if (result.error) {
        console.error("🔐 [SignUp] Sign up error:", result.error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Sign Up Failed", result.error.message || "Please try again");
        setIsLoading(false);
        return;
      }

      console.log("🔐 [SignUp] Sign up successful!");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEmail("");
      setPassword("");
      setName("");
      setIsSignUp(false);

      // Refetch session and wait for it to be available
      console.log("🔐 [SignUp] Refetching session...");
      try {
        // Trigger refetch (it returns void, not a promise)
        refetch();
        
        // Wait for session to be available (with retry logic)
        // The session from the hook will update reactively
        let retries = 0;
        const maxRetries = 15; // 3 seconds total (15 * 200ms)
        while (retries < maxRetries) {
          // Small delay to allow session to update reactively
          await new Promise((resolve) => setTimeout(resolve, 200));
          
          // Check if session is now available from the hook
          // We need to check the current session state
          // Since we can't directly access it here, we'll rely on the useEffect
          // But we can trigger another refetch to help
          if (retries % 3 === 0) {
            // Refetch every 600ms to check for session
            refetch();
          }
          
          retries++;
        }
        
        console.log("🔐 [SignUp] Session refetch completed");
        // The useEffect will handle navigation when session becomes available
      } catch (refetchError) {
        console.error("🔐 [SignUp] Error during session refetch:", refetchError);
        // Don't fail the signup if refetch fails - session might still be valid
        // The useEffect will handle navigation when session becomes available
      }
    } catch (error) {
      console.error("🔐 [SignUp] Unexpected error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Provide more helpful error messages
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("Network") || error.message.includes("fetch failed")) {
          errorMessage = "Network error: Please check your internet connection and try again.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Request timed out. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert("Error", errorMessage);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log("🔐 [Google OAuth] Starting Google sign-in...");
      console.log("🔐 [Google OAuth] Backend URL:", process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL);
      console.log("🔐 [Google OAuth] Callback URL: vibecode://auth/callback");
      console.log("🔐 [Google OAuth] Auth Client initialized with Expo plugin");

      // Call the social sign-in with explicit callback URL
      console.log("🔐 [Google OAuth] Calling authClient.signIn.social...");
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "vibecode://auth/callback",
      });

      console.log("🔐 [Google OAuth] Sign-in result:", JSON.stringify(result, null, 2));

      if (result.error) {
        console.error("🔐 [Google OAuth] Sign-in error:", result.error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        // Provide more specific error messages
        let errorMessage = result.error.message || "Failed to sign in with Google";
        if (result.error.message?.includes("network") || result.error.message?.includes("fetch")) {
          errorMessage = "Network error: Please check your internet connection and try again.";
        } else if (result.error.message?.includes("cancelled") || result.error.message?.includes("canceled")) {
          errorMessage = "Sign-in was cancelled. Please try again.";
        } else if (result.error.message?.includes("not enabled") || result.error.message?.includes("not configured")) {
          errorMessage = "Google sign-in is not configured. Please try email sign-in instead.";
        }

        Alert.alert("Sign In Failed", errorMessage);
        setIsLoading(false);
        return;
      }

      console.log("🔐 [Google OAuth] Sign-in successful!");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Refetch session and wait for it to be available (similar to email login)
      console.log("🔐 [Google OAuth] Refetching session...");
      try {
        // Trigger refetch
        refetch();

        // Wait for session to be available (with retry logic)
        let retries = 0;
        const maxRetries = 20; // 4 seconds total (20 * 200ms) - increased for OAuth flow
        while (retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 200));

          // Check if session is now available
          if (retries % 3 === 0) {
            // Refetch every 600ms to check for session
            console.log(`🔐 [Google OAuth] Waiting for session... (${retries}/${maxRetries})`);
            refetch();
          }

          retries++;
        }

        console.log("🔐 [Google OAuth] Session refetch completed");
        // The useEffect will handle navigation when session becomes available
      } catch (refetchError) {
        console.error("🔐 [Google OAuth] Error during session refetch:", refetchError);
        // Don't fail the login if refetch fails - session might still be valid
        // The useEffect will handle navigation when session becomes available
      }
    } catch (error: any) {
      console.error("🔐 [Google OAuth] Unexpected error:", error);
      console.error("🔐 [Google OAuth] Error details:", {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        stack: error?.stack?.split('\n').slice(0, 3).join('\n'),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Provide more helpful error messages
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("Network") || error.message.includes("fetch failed")) {
          errorMessage = "Network error: Please check your internet connection and try again.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Request timed out. Please try again.";
        } else if (error.message.includes("cancelled") || error.message.includes("canceled")) {
          errorMessage = "Sign-in was cancelled. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking onboarding
  if (session?.user && isCheckingOnboarding) {
    return (
      <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#7E3FE4" />
        <Text style={{ color: "white", marginTop: 16, fontSize: 18 }}>Setting up your account...</Text>
        <Text style={{ color: "rgba(255, 255, 255, 0.5)", marginTop: 8, fontSize: 12 }}>This should only take a moment</Text>
      </LinearGradient>
    );
  }

  // Show forgot password screen
  if (showForgotPassword) {
    return (
      <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} style={{ flex: 1 }}>
        <ForgotPasswordScreen
          onBack={() => setShowForgotPassword(false)}
          onSuccess={() => setShowForgotPassword(false)}
        />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0A0A0F", "#1A1A24", "#2A1A34"]} style={{ flex: 1 }}>
      <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
        <KeyboardAwareScrollView
          contentContainerStyle={{ flexGrow: 1, paddingTop: 20 }}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 }}>
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

              {/* Forgot Password Button - Only show on sign in */}
              {!isSignUp && (
                <Pressable
                  onPress={() => setShowForgotPassword(true)}
                  disabled={isLoading}
                  className="mb-4"
                >
                  <Text className="text-cyan-300 text-center text-sm font-medium">
                    Forgot Password?
                  </Text>
                </Pressable>
              )}

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

            {/* Legal Links - Required for App Store compliance */}
            <View className="mt-6 mb-4">
              <Text className="text-white/60 text-xs text-center mb-3">
                By continuing, you agree to our:
              </Text>
              <View className="flex-row flex-wrap justify-center gap-x-4 gap-y-2">
                <Pressable
                  onPress={() => {
                    setSelectedPolicy("terms-of-service");
                    setShowPolicyViewer(true);
                  }}
                >
                  <Text className="text-cyan-300 text-xs underline">Terms of Service</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setSelectedPolicy("privacy-policy");
                    setShowPolicyViewer(true);
                  }}
                >
                  <Text className="text-cyan-300 text-xs underline">Privacy Policy</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setSelectedPolicy("content-guidelines");
                    setShowPolicyViewer(true);
                  }}
                >
                  <Text className="text-cyan-300 text-xs underline">Community Guidelines</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setSelectedPolicy("safety-policy");
                    setShowPolicyViewer(true);
                  }}
                >
                  <Text className="text-cyan-300 text-xs underline">Safety Policy</Text>
                </Pressable>
              </View>
            </View>

            {/* Footer */}
            <Text className="text-white/40 text-xs text-center mt-4">
              You must be 13+ to use this app. By signing up, you confirm you meet the age requirement.
            </Text>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>

      {/* Policy Viewer Modal */}
      {selectedPolicy && (
        <PolicyViewerModal
          visible={showPolicyViewer}
          policyType={selectedPolicy as any}
          onClose={() => {
            setShowPolicyViewer(false);
            setSelectedPolicy(null);
          }}
        />
      )}
    </LinearGradient>
  );
}
