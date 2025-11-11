"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    business_name: "A'ish Raiments",
    business_motto: "Fashion Designer with Panache",
    brand_primary_color: "#72D0CF",
    brand_accent_color: "#EC88C7",
    reporting_year: "2025",
  });

  const supabase = createClient();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("settings")
      .select("*");

    if (data) {
      const settingsMap: Record<string, string> = {};
      data.forEach((setting) => {
        settingsMap[setting.key] = setting.value;
      });
      setSettings({
        business_name: settingsMap.business_name || "A'ish Raiments",
        business_motto: settingsMap.business_motto || "Fashion Designer with Panache",
        brand_primary_color: settingsMap.brand_primary_color || "#72D0CF",
        brand_accent_color: settingsMap.brand_accent_color || "#EC88C7",
        reporting_year: settingsMap.reporting_year || "2025",
      });
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);

    for (const [key, value] of Object.entries(settings)) {
      const { error } = await supabase
        .from("settings")
        .upsert({ key, value }, { onConflict: "key" });

      if (error) {
        console.error(`Error saving ${key}:`, error);
      }
    }

    setSaving(false);
    alert("Settings saved successfully! Refresh the page to see changes.");
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure your business settings and preferences
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>
              Update your business name and branding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={settings.business_name}
                onChange={(e) =>
                  setSettings({ ...settings, business_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_motto">Business Motto / Tagline</Label>
              <Input
                id="business_motto"
                value={settings.business_motto}
                onChange={(e) =>
                  setSettings({ ...settings, business_motto: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brand Colors</CardTitle>
            <CardDescription>
              Customize your brand color scheme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand_primary_color">Primary Color (Teal)</Label>
                <div className="flex gap-2">
                  <Input
                    id="brand_primary_color"
                    type="color"
                    value={settings.brand_primary_color}
                    onChange={(e) =>
                      setSettings({ ...settings, brand_primary_color: e.target.value })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={settings.brand_primary_color}
                    onChange={(e) =>
                      setSettings({ ...settings, brand_primary_color: e.target.value })
                    }
                    placeholder="#72D0CF"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand_accent_color">Accent Color (Pink)</Label>
                <div className="flex gap-2">
                  <Input
                    id="brand_accent_color"
                    type="color"
                    value={settings.brand_accent_color}
                    onChange={(e) =>
                      setSettings({ ...settings, brand_accent_color: e.target.value })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={settings.brand_accent_color}
                    onChange={(e) =>
                      setSettings({ ...settings, brand_accent_color: e.target.value })
                    }
                    placeholder="#EC88C7"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-md border">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <div className="flex gap-4">
                <div
                  className="w-20 h-20 rounded-md border-2"
                  style={{ backgroundColor: settings.brand_primary_color }}
                />
                <div
                  className="w-20 h-20 rounded-md border-2"
                  style={{ backgroundColor: settings.brand_accent_color }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reporting Settings</CardTitle>
            <CardDescription>
              Configure reporting parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="reporting_year">Reporting Year</Label>
              <Input
                id="reporting_year"
                type="number"
                value={settings.reporting_year}
                onChange={(e) =>
                  setSettings({ ...settings, reporting_year: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Change this to view reports for a different year
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            style={{ backgroundColor: "#72D0CF" }}
            className="w-full sm:w-auto"
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
