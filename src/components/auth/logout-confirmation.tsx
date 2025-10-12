"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase"; "@/components/ui/button";


export function LogoutConfirmation() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoading(true);
    
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        // Even if there's an error, redirect to login
      }
      
      // Clear any local storage data
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect to login page
      router.push('/auth/login');
      router.refresh(); // Force a complete page refresh
      
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect even if logout fails
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          size="sm" 
          variant="outline" 
          className="hidden sm:inline-flex hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 border-border/60">
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/20">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
          </div>
          <AlertDialogTitle className="text-center text-lg font-semibold text-foreground">
            Confirm Logout
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-muted-foreground">
            Are you sure you want to logout? You'll need to sign in again to access your dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3 sm:gap-2">
          <AlertDialogCancel 
            className="w-full sm:w-auto hover:bg-muted/80 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20 transition-all duration-200"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                Logout
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}