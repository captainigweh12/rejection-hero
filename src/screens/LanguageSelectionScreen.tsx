import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Check } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { languages, type Language } from "@/lib/translations";

type Props = NativeStackScreenProps<RootStackParamList, "LanguageSelection">;

export default function LanguageSelectionScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { language: currentLanguage, setLanguage, t } = useLanguage();

  const handleSelectLanguage = async (lang: Language) => {
    await setLanguage(lang);
    // Navigate back after a short delay to show the selection
    setTimeout(() => {
      navigation.goBack();
    }, 300);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View
          style={{
            backgroundColor: colors.card,
            paddingHorizontal: 20,
            paddingVertical: 16,
            flexDirection: "row",
            alignItems: "center",
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
            <ChevronLeft size={28} color={colors.text} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}>
            {t("language.title")}
          </Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          {/* Title Section */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.text, marginBottom: 8 }}>
              {t("language.selectLanguage")}
            </Text>
            <Text style={{ fontSize: 16, color: colors.textSecondary }}>
              {t("language.subtitle")}
            </Text>
          </View>

          {/* Language List */}
          <View style={{ gap: 12 }}>
            {Object.entries(languages).map(([code, info]) => {
              const isSelected = currentLanguage === code;

              return (
                <Pressable
                  key={code}
                  onPress={() => handleSelectLanguage(code as Language)}
                  style={({ pressed }) => ({
                    backgroundColor: isSelected ? colors.primary + "15" : colors.card,
                    borderRadius: 16,
                    padding: 20,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.primary : colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: pressed ? 0.7 : 1,
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  })}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                    <Text style={{ fontSize: 32 }}>{info.flag}</Text>
                    <View>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "600",
                          color: isSelected ? colors.primary : colors.text,
                          marginBottom: 2,
                        }}
                      >
                        {info.nativeName}
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                        {info.name}
                      </Text>
                    </View>
                  </View>

                  {isSelected && (
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: colors.primary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={20} color="white" strokeWidth={3} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Current Language Info */}
          <View
            style={{
              marginTop: 32,
              padding: 16,
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: colors.info,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 4 }}>
              {t("language.currentLanguage")}
            </Text>
            <Text style={{ fontSize: 16, color: colors.textSecondary }}>
              {languages[currentLanguage].flag} {languages[currentLanguage].nativeName}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
