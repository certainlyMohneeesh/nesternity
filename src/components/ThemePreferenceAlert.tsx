'use client';
import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export default function ThemePreferenceAlert() {
  const [show, setShow] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      const dismissed = localStorage.getItem("theme_pref_alert_dismissed");
      if (isDark && !dismissed) {
        setShow(true);
      }
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem("theme_pref_alert_dismissed", "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="bg-card border border-primary shadow-lg rounded-xl px-6 py-4 flex items-center gap-4 max-w-lg w-full mx-4 pointer-events-auto animate-in fade-in slide-in-from-top-4">
        <span className="text-sm text-primary font-medium">
          I prefer you using dark mode for more minimal experience
        </span>
        <Button
          variant="outline"
          onClick={() => setTheme("light")}
          className="ml-2"
        >
          Switch to Light Mode
        </Button>
        <Button
          onClick={dismiss}
          className="ml-auto bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium shadow hover:bg-primary/90 transition"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}
