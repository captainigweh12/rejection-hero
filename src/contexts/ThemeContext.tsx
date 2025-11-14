import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Theme = "light" | "dark" | "system";

interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  surface: string;
  surfaceHover: string;
  shadow: string;
}

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: "light" | "dark";
  colors: ThemeColors;
  setTheme: (theme: Theme) => void;
}

const lightColors: ThemeColors = {
  background: "#F5F5F7",
  card: "#FFFFFF",
  text: "#1C1C1E",
  textSecondary: "#666666",
  border: "#E5E5EA",
  primary: "#FF6B35",
  success: "#4CAF50",
  error: "#EF4444",
  warning: "#FFD700",
  info: "#00D9FF",
  surface: "#FAFAFA",
  surfaceHover: "#F0F0F0",
  shadow: "#000000",
};

const darkColors: ThemeColors = {
  background: "#000000",
  card: "#1C1C1E",
  text: "#FFFFFF",
  textSecondary: "#ABABAB",
  border: "#2C2C2E",
  primary: "#FF6B35",
  success: "#4CAF50",
  error: "#EF4444",
  warning: "#FFD700",
  info: "#00D9FF",
  surface: "#2C2C2E",
  surfaceHover: "#3A3A3C",
  shadow: "#FFFFFF",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("app_theme");
        if (savedTheme && (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system")) {
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

  const effectiveTheme: "light" | "dark" =
    theme === "system" ? (systemColorScheme === "dark" ? "dark" : "light") : theme;

  const colors = effectiveTheme === "dark" ? darkColors : lightColors;

  if (!isLoaded) {
    return null; // Or a loading screen
  }

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, colors, setTheme }}>
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
