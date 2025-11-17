import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Theme = "day" | "night";

interface ThemeColors {
  background: readonly [string, string, ...string[]];
  backgroundSolid: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  primary: string;
  primaryLight: string;
  secondary: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  surface: string;
  surfaceHover: string;
  shadow: string;
  inputBackground: string;
  inputBorder: string;
  modalOverlay: string;
}

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  setTheme: (theme: Theme) => void;
  isDayMode: boolean;
}

// Day Theme (Light Mode)
const dayColors: ThemeColors = {
  background: ["#F8F9FA", "#E9ECEF", "#DEE2E6"] as const,
  backgroundSolid: "#F8F9FA",
  card: "#FFFFFF",
  cardBorder: "rgba(126, 63, 228, 0.2)",
  text: "#212529",
  textSecondary: "rgba(33, 37, 41, 0.7)",
  textTertiary: "rgba(33, 37, 41, 0.5)",
  border: "rgba(126, 63, 228, 0.3)",
  primary: "#7E3FE4",
  primaryLight: "rgba(126, 63, 228, 0.1)",
  secondary: "#FF6B35",
  success: "#4CAF50",
  error: "#EF4444",
  warning: "#FFD700",
  info: "#00D9FF",
  surface: "rgba(126, 63, 228, 0.05)",
  surfaceHover: "rgba(126, 63, 228, 0.1)",
  shadow: "rgba(0, 0, 0, 0.1)",
  inputBackground: "rgba(126, 63, 228, 0.03)",
  inputBorder: "rgba(126, 63, 228, 0.2)",
  modalOverlay: "rgba(0, 0, 0, 0.5)",
};

// Night Theme (Dark Mode) - Current theme
const nightColors: ThemeColors = {
  background: ["#0A0A0F", "#1A1A24", "#2A1A34"] as const,
  backgroundSolid: "#0A0A0F",
  card: "rgba(255, 255, 255, 0.05)",
  cardBorder: "rgba(126, 63, 228, 0.3)",
  text: "#FFFFFF",
  textSecondary: "rgba(255, 255, 255, 0.7)",
  textTertiary: "rgba(255, 255, 255, 0.5)",
  border: "rgba(126, 63, 228, 0.3)",
  primary: "#7E3FE4",
  primaryLight: "rgba(126, 63, 228, 0.2)",
  secondary: "#FF6B35",
  success: "#4CAF50",
  error: "#EF4444",
  warning: "#FFD700",
  info: "#00D9FF",
  surface: "rgba(255, 255, 255, 0.05)",
  surfaceHover: "rgba(255, 255, 255, 0.1)",
  shadow: "rgba(0, 0, 0, 0.5)",
  inputBackground: "rgba(255, 255, 255, 0.05)",
  inputBorder: "rgba(126, 63, 228, 0.2)",
  modalOverlay: "rgba(0, 0, 0, 0.7)",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>("night");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("app_theme");
        if (savedTheme && (savedTheme === "day" || savedTheme === "night")) {
          setThemeState(savedTheme as Theme);
        }
      } catch (error) {
        console.error("Failed to load theme:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem("app_theme", newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  };

  const isDayMode = theme === "day";
  const colors = theme === "night" ? nightColors : dayColors;

  if (!isLoaded) {
    return null; // Or a loading screen
  }

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme, isDayMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
