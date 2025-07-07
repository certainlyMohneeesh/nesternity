'use client';
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";

export default function ThemePreferenceAlert() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            );
            // Use a session cookie to show alert once per session
            const dismissed = Cookies.get("mobile_pref_alert_dismissed");
            if (isMobile && !dismissed) {
                setShow(true);
            }
        }
    }, []);

    const dismiss = () => {
        Cookies.set("mobile_pref_alert_dismissed", "1");
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="bg-card border border-primary shadow-lg rounded-xl px-6 py-4 flex items-center gap-4 max-w-lg w-full mx-4 pointer-events-auto animate-in fade-in slide-in-from-top-4">
                <span className="text-sm text-primary font-medium">
                    Switch to Desktop or PC instead of phone for better experience
                </span>
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
