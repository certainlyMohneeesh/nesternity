'use client';
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const consent = localStorage.getItem("cookie_consent");
      if (!consent) setVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
    toast.success("You have accepted cookies. Thank you!");
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="bg-card border border-border shadow-lg rounded-xl px-6 py-4 flex flex-col sm:flex-row items-center gap-4 max-w-xl w-full mx-4 pointer-events-auto animate-in fade-in slide-in-from-bottom-4">
        <span className="text-sm text-foreground">
          We use cookies to enhance your experience. Read our {" "}
          <Link href="/cookies-policy" className="underline hover:text-primary">Cookies Policy</Link>.
        </span>
        <button
          onClick={acceptCookies}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium shadow hover:bg-primary/90 transition"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
