"use client";
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import ReCAPTCHA from "react-google-recaptcha";

interface NewsletterSignupProps {
  className?: string;
}

export default function NewsletterSignup({ className }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    if (!recaptchaToken) {
      toast.error('Please complete the reCAPTCHA verification');
      return;
    }

    setIsLoading(true);

    try {
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
        setRecaptchaToken(null);
        // Reset reCAPTCHA
        recaptchaRef.current?.reset();
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

  const recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY;

  if (!recaptchaSiteKey) {
    console.error('reCAPTCHA site key not configured');
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
                disabled={isLoading || !recaptchaToken}
              >
                {isLoading ? 'Joining...' : 'Join Waitlist'}
              </Button>
            </div>
            
            {/* reCAPTCHA */}
            <div className="flex justify-center mt-4">
              {recaptchaSiteKey ? (
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={recaptchaSiteKey}
                  onChange={handleRecaptchaChange}
                  theme="light"
                  size="normal"
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  reCAPTCHA configuration pending...
                </div>
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
