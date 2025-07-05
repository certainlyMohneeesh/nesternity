"use client";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

declare global {
  interface Window {
    grecaptcha: any;
  }
}

interface NewsletterSignupProps {
  className?: string;
}

export default function NewsletterSignup({ className }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!recaptchaSiteKey) {
      console.error('reCAPTCHA site key not configured');
      return;
    }

    // Load reCAPTCHA v3 script
    const loadRecaptcha = () => {
      if (window.grecaptcha) {
        setRecaptchaLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`;
      script.onload = () => {
        setRecaptchaLoaded(true);
        console.log('reCAPTCHA v3 loaded successfully');
      };
      script.onerror = () => {
        console.error('Failed to load reCAPTCHA script');
      };
      document.head.appendChild(script);
    };

    loadRecaptcha();
  }, [recaptchaSiteKey]);

  const executeRecaptcha = async (): Promise<string | null> => {
    if (!window.grecaptcha || !recaptchaLoaded) {
      console.error('reCAPTCHA not loaded');
      return null;
    }

    try {
      const token = await window.grecaptcha.execute(recaptchaSiteKey, { 
        action: 'newsletter_signup' 
      });
      return token;
    } catch (error) {
      console.error('reCAPTCHA execution failed:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    if (!recaptchaLoaded) {
      toast.error('Security verification is loading. Please wait and try again.');
      return;
    }

    setIsLoading(true);

    try {
      // Execute reCAPTCHA v3
      const recaptchaToken = await executeRecaptcha();
      
      if (!recaptchaToken) {
        toast.error('Security verification failed. Please try again.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Successfully subscribed to newsletter!');
        setEmail('');
      } else {
        toast.error(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Newsletter signup error:', error);
      toast.error('Failed to subscribe. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!recaptchaSiteKey) {
    return (
      <section className={`py-20 px-6 ${className}`}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-sm text-muted-foreground bg-yellow-50 border border-yellow-200 rounded p-4">
            ⚠️ Newsletter signup temporarily unavailable. reCAPTCHA configuration pending.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-20 px-6 ${className}`}>
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">We're building Nesternity in public.</h2>
        <p className="text-xl text-muted-foreground mb-8">
          Join our community and be the first to know about new features, updates, and launch announcements.
        </p>
        <Card className="p-8 shadow-lg border-0 bg-gradient-to-r from-primary/10 to-secondary/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input 
                type="email" 
                placeholder="Enter your email address" 
                className="flex-1 h-12 text-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
              <Button 
                type="submit" 
                size="lg" 
                className="px-8"
                disabled={isLoading || !recaptchaLoaded}
              >
                {isLoading ? 'Joining...' : !recaptchaLoaded ? 'Loading...' : 'Join Waitlist'}
              </Button>
            </div>
            
            <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground">
              {recaptchaLoaded ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>🔒 Protected by reCAPTCHA</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                  <span>Loading security verification...</span>
                </>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">
              🔒 We respect your privacy. Unsubscribe at any time.
            </p>
          </form>
        </Card>
      </div>
    </section>
  );
}
