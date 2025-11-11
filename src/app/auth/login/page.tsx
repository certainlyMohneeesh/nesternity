"use client";
import { useState, Suspense } from "react";
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
  const searchParams = useSearchParams();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    const startTime = Date.now();
    console.log('[Login Page] Starting login process...');
    
    try {
      console.log('[Login Page] Calling login API...');
      
      // Set a timeout for the fetch request (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      // Call server-side login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      console.log(`[Login Page] API response received in ${duration}ms`);

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('[Login Page] Failed to parse response:', jsonError);
        setError('Server returned an invalid response. Please try again.');
        setLoading(false);
        return;
      }

      console.log('[Login Page] Response:', {
        ok: response.ok,
        status: response.status,
        success: data.success,
      });

      if (!response.ok) {
        console.error('[Login Page] Login failed:', {
          status: response.status,
          error: data.error,
          details: data.details,
          requestId: data.requestId,
        });
        setError(data.error || data.details || 'Login failed');
        setLoading(false);
        return;
      }

      if (data.success) {
        // Check for both 'returnUrl' (from middleware) and 'redirect' (legacy)
        const returnUrl = searchParams.get('returnUrl') || 
                         searchParams.get('redirect') || 
                         searchParams.get('redirectTo') || 
                         '/dashboard';
        
        console.log('[Login Page] ✅ Login successful, redirecting to:', returnUrl);
        
        // Force a full page refresh to ensure session is loaded
        window.location.href = returnUrl;
      } else {
        console.error('[Login Page] Login failed: success=false');
        setError('Login failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      const duration = Date.now() - startTime;
      console.error(`[Login Page] ❌ Error after ${duration}ms:`, err);
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timeout. Please check your internet connection and try again.');
        } else if (err.message.includes('fetch')) {
          setError('Cannot connect to server. Please check your internet connection.');
        } else {
          setError(`Error: ${err.message}`);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      
      setLoading(false);
    }
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
