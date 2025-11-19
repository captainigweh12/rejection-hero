import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { GetProfileResponse } from "@/shared/contracts";

export interface ParentalGuidancePreferences {
  contentRestrictions: boolean;
  liveStreamingDisabled: boolean;
  purchaseRestrictions: boolean;
  socialFeatureRestrictions: boolean;
  screenTimeAlerts: boolean;
  reportingEnabled: boolean;
}

interface ParentalGuidanceContextType {
  settings: ParentalGuidancePreferences;
  isLoading: boolean;
  isEnforcingRestrictions: boolean;
  canAccessFeature: (feature: keyof ParentalGuidancePreferences) => boolean;
  refetch: () => void;
}

const ParentalGuidanceContext = createContext<ParentalGuidanceContextType | undefined>(undefined);

export function ParentalGuidanceProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ParentalGuidancePreferences>({
    contentRestrictions: false,
    liveStreamingDisabled: false,
    purchaseRestrictions: false,
    socialFeatureRestrictions: false,
    screenTimeAlerts: false,
    reportingEnabled: false,
  });

  const { data: profileData, isLoading, refetch } = useQuery<GetProfileResponse>({
    queryKey: ["profile"],
    queryFn: async () => {
      return api.get<GetProfileResponse>("/api/profile");
    },
  });

  // Update settings when profile data changes
  useEffect(() => {
    if (profileData?.parentalGuidance) {
      setSettings(profileData.parentalGuidance as unknown as ParentalGuidancePreferences);
    }
  }, [profileData?.parentalGuidance]);

  // Check if user is a minor (parental restrictions apply)
  const isEnforcingRestrictions = (profileData?.age ?? 18) < 18;

  // Feature access checker
  const canAccessFeature = (feature: keyof ParentalGuidancePreferences): boolean => {
    if (!isEnforcingRestrictions) {
      return true; // Adults have full access
    }

    // For minors, check if the restriction is enabled
    const restriction = settings[feature];

    // If restriction is enabled, user CANNOT access the feature
    if (restriction) {
      return false;
    }

    return true;
  };

  return (
    <ParentalGuidanceContext.Provider
      value={{
        settings,
        isLoading,
        isEnforcingRestrictions,
        canAccessFeature,
        refetch,
      }}
    >
      {children}
    </ParentalGuidanceContext.Provider>
  );
}

export function useParentalGuidance() {
  const context = useContext(ParentalGuidanceContext);
  if (!context) {
    throw new Error("useParentalGuidance must be used within ParentalGuidanceProvider");
  }
  return context;
}
