"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

interface Settings {
  business_name: string;
  business_motto: string;
  brand_primary_color: string;
  brand_accent_color: string;
  reporting_year: string;
}

interface SettingsContextType {
  settings: Settings;
  refreshSettings: () => Promise<void>;
  loading: boolean;
}

const defaultSettings: Settings = {
  business_name: "A'ish Raiments",
  business_motto: "Fashion Designer with Panache",
  brand_primary_color: "#72D0CF",
  brand_accent_color: "#EC88C7",
  reporting_year: "2025",
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  refreshSettings: async () => {},
  loading: true,
});

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from("settings").select("*");

    if (data) {
      const settingsMap: Record<string, string> = {};
      data.forEach((setting) => {
        settingsMap[setting.key] = setting.value;
      });

      setSettings({
        business_name: settingsMap.business_name || defaultSettings.business_name,
        business_motto: settingsMap.business_motto || defaultSettings.business_motto,
        brand_primary_color: settingsMap.brand_primary_color || defaultSettings.brand_primary_color,
        brand_accent_color: settingsMap.brand_accent_color || defaultSettings.brand_accent_color,
        reporting_year: settingsMap.reporting_year || defaultSettings.reporting_year,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshSettings = async () => {
    await fetchSettings();
  };

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};
