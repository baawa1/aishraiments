"use client";

import { SettingsProvider } from "@/contexts/SettingsContext";
import { Toaster } from "sonner";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SettingsProvider>
      {children}
      <Toaster position="top-right" richColors />
    </SettingsProvider>
  );
}
