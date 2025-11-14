import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations, type Language } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved language preference
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("app_language");
        if (savedLanguage && translations[savedLanguage as Language]) {
          setLanguageState(savedLanguage as Language);
        }
      } catch (error) {
        console.error("Failed to load language:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (newLanguage: Language) => {
    try {
      await AsyncStorage.setItem("app_language", newLanguage);
      setLanguageState(newLanguage);
    } catch (error) {
      console.error("Failed to save language:", error);
    }
  };

  // Translation function
  const t = (key: string): string => {
    const keys = key.split(".");
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === "object" && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if not found
          }
        }
        break;
      }
    }

    return typeof value === "string" ? value : key;
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
