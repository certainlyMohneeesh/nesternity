"use client";
import { useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Eye, EyeOff, Shield } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else if (data.session) {
      // Sync user to Prisma database
      try {
        const syncResponse = await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${data.session.access_token}`
          }
        });
        
        if (!syncResponse.ok) {
          console.warn('Failed to sync user to database');
        }
      } catch (syncError) {
        console.warn('User sync error:', syncError);
      }
      
      // Check for both 'returnUrl' (from middleware) and 'redirect' (legacy)
      const returnUrl = searchParams.get('returnUrl') || searchParams.get('redirect');
      console.log('🔄 [Login] Redirecting to:', returnUrl || '/dashboard');
      router.push(returnUrl || "/dashboard");
    }
    setLoading(false);
  }

  return (
    <AuthLayout 
      title="Sign in to your account"
      subtitle="Welcome back! Please enter your details."
    >
        <div className="bg-transparent py-3 px-2 sm:py-4 sm:px-3 shadow-xl rounded-lg pb-4 mb-6">
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-800">
              Notice
            </span>
          </div>
          <p className="text-xs text-blue-700 mt-0.5">
            If you are new to Nesternity, please sign up first. If you have an account, use your registered email and password to log in.
          </p>
        </div>

            <div className="pb-0.5" />

            <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link href="/auth/forgot-password" className="text-indigo-600 hover:text-indigo-500">
              Forgot your password?
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>

        <div className="text-center">
          <span className="text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-indigo-600 hover:text-indigo-500 font-medium">
              Sign up
            </Link>
          </span>
        </div>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <AuthLayout
        title="Sign in to your account"
        subtitle="Welcome back! Please sign in to continue."
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </AuthLayout>
    }>
      <LoginForm />
    </Suspense>
  );
}
