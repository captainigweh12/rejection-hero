import { ExpoConfig, ConfigContext } from "expo/config";
import appJson from "./app.json";

export default ({ config }: ConfigContext): ExpoConfig => {
  // Check if running in Expo Go by checking environment
  // In Expo Go, EXPO_PUBLIC_ENABLE_EXPO_GO will be set
  // For EAS builds, check the build profile
  const isExpoGo = process.env.EXPO_PUBLIC_ENABLE_EXPO_GO === "true" || 
                   process.env.EAS_BUILD_PROFILE === "expo-go";
  
  // Default to enabling new architecture unless explicitly in Expo Go mode
  // This ensures production builds use new architecture while Expo Go doesn't
  const newArchEnabled = !isExpoGo;

  return {
    ...config,
    expo: {
      ...appJson.expo,
      // Disable new architecture for Expo Go (it doesn't support it)
      // Keep it enabled for production builds (standalone)
      newArchEnabled,
    },
  };
};
