"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Signing you out...");

  useEffect(() => {
    async function signOut() {
      try {
        setStatus("Signing you out...");
        await supabase.auth.signOut();
        setStatus("Signed out successfully");
        setTimeout(() => {
          router.push("/auth/login");
        }, 1000);
      } catch (error) {
        setStatus("Error signing out");
        console.error("Logout error:", error);
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      }
    }
    
    signOut();
  }, [router]);

  return (
    <AuthLayout 
      title="Signing out"
      subtitle="Please wait while we sign you out"
    >
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600 mb-4" />
        <p className="text-gray-600">{status}</p>
      </div>
    </AuthLayout>
  );
}
