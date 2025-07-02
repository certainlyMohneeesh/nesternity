import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Star, Zap, Shield, Users } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center">
            <img src="/nesternity.svg" alt="Nesternity" className="w-12 h-12" />
            </div>
          <span className="text-xl font-bold">Nesternity</span>
        </div>
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          <Link href="/auth/login" className="text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
          <Link href="/dashboard">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 md:py-32 px-6 text-center max-w-5xl mx-auto relative">
        {/* Background overlay image */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <img 
        src="/nesternity.svg" 
        alt="" 
        className="w-[600px] h-[600px] object-contain"
          />
        </div>
        
        <Badge variant="secondary" className="mb-6 relative z-10">
          🚀 Now in Beta - Join the waitlist
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent leading-tight relative z-10">
          The Freelancer's Nest for Clients, Contracts & Clarity
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed relative z-10">
          Nesternity helps solo professionals manage client relationships, send smart contracts,
          and stay paid — all from one calm, cozy hub.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12 relative z-10">
          <Link href="/dashboard">
        <Button size="lg" className="gap-2 text-lg px-8 py-6">
          Try it Free
          <ArrowRight className="h-5 w-5" />
        </Button>
          </Link>
          <Link href="/demo">
        <Button variant="outline" size="lg" className="gap-2 text-lg px-8 py-6">
          Watch Demo
        </Button>
          </Link>
        </div>
        <div className="flex justify-center items-center gap-6 text-muted-foreground relative z-10">
          <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span className="text-sm">Free to start</span>
          </div>
          <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span className="text-sm">No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span className="text-sm">Setup in 2 minutes</span>
          </div>
        </div>
      </section>

      {/* Problem-Solution Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-muted/30 to-muted/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">End the freelance workflow chaos</h2>
          <p className="text-xl text-muted-foreground text-center mb-16">Transform scattered tools into one seamless experience</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg bg-background/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">😵</span>
                </div>
                <CardTitle className="text-lg">Scattered Client Info</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Notes in emails, contacts in phone, project details everywhere but where you need them.</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-background/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">📄</span>
                </div>
                <CardTitle className="text-lg">Messy Contracts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Word docs, PDFs, email threads. Professional contracts shouldn't feel this complicated.</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-background/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">💸</span>
                </div>
                <CardTitle className="text-lg">Payment Stress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Manually tracking who paid what when. Your time is worth more than spreadsheet hell.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything you need to work smart</h2>
            <p className="text-xl text-muted-foreground">Built specifically for solo professionals who value simplicity</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Users className="h-8 w-8 text-primary" />}
              title="Client Capsule" 
              description="Track contacts, projects, and timelines all in one organized space. Never lose track of client details again." 
            />
            <FeatureCard 
              icon={<Shield className="h-8 w-8 text-primary" />}
              title="Contract Composer" 
              description="Generate, customize, and e-sign contracts in minutes. Professional documents without the complexity." 
            />
            <FeatureCard 
              icon={<Zap className="h-8 w-8 text-primary" />}
              title="Smart Invoicing" 
              description="Send invoices and monitor payment statuses in real-time. Get paid faster with automated follow-ups." 
            />
            <FeatureCard 
              icon={<Star className="h-8 w-8 text-primary" />}
              title="Visual Dashboard" 
              description="Stay on top of everything at a glance with beautiful, intuitive dashboards that actually make sense." 
            />
            <FeatureCard 
              icon={<CheckCircle className="h-8 w-8 text-primary" />}
              title="Project Tracking" 
              description="Kanban boards, deadlines, and progress tracking. Keep projects moving without the overwhelm." 
            />
            <FeatureCard 
              icon={<ArrowRight className="h-8 w-8 text-primary" />}
              title="Team Collaboration" 
              description="Invite clients and team members. Share progress, get feedback, and stay aligned effortlessly." 
            />
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Simple pricing for growing freelancers</h2>
          <p className="text-xl text-muted-foreground mb-12">Start free, scale when you're ready. No hidden fees, no surprises.</p>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <Card className="border-2 border-muted/20 shadow-lg">
              <CardHeader className="text-center">
                <Badge variant="secondary" className="w-fit mx-auto mb-4">Perfect for Starting</Badge>
                <CardTitle className="text-2xl mb-2">Free Forever</CardTitle>
                <div className="text-4xl font-bold mb-2">$0</div>
                <CardDescription>For freelancers just getting started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Up to 3 clients</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Basic contract templates</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Simple invoicing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Project tracking</span>
                  </div>
                </div>
                <Link href="/dashboard" className="block">
                  <Button className="w-full" size="lg">Get Started Free</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-primary shadow-xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1">Most Popular</Badge>
              </div>
              <CardHeader className="text-center">
                <Badge variant="outline" className="w-fit mx-auto mb-4">Coming Soon</Badge>
                <CardTitle className="text-2xl mb-2">Pro</CardTitle>
                <div className="text-4xl font-bold mb-2">$29<span className="text-lg font-normal">/month</span></div>
                <CardDescription>For established freelancers scaling up</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Unlimited clients</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Custom branding</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Advanced contract features</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Team collaboration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Priority support</span>
                  </div>
                </div>
                <Button variant="outline" size="lg" className="w-full" disabled>
                  Join Waitlist
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Newsletter / Waitlist */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">We're building Nesternity in public</h2>
          <p className="text-xl text-muted-foreground mb-8">Join our community and be the first to know about new features, updates, and launch announcements.</p>
          <Card className="p-8 shadow-lg border-0 bg-gradient-to-r from-primary/10 to-secondary/10">
            <form className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className="flex-1 h-12 text-lg"
                />
                <Button size="lg" className="px-8">
                  Join Waitlist
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                🔒 We respect your privacy. Unsubscribe at any time.
              </p>
            </form>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                {/* <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">N</span>
                </div> */}
                <span className="text-xl font-bold">Nesternity</span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                The all-in-one workspace for freelancers who want to focus on their craft, not their admin.
              </p>
              <div className="flex space-x-4">
                <Badge variant="outline">🚀 Beta</Badge>
                <Badge variant="outline">Built with Next.js</Badge>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <div className="space-y-2 text-muted-foreground">
                <div>Features</div>
                <div>Pricing</div>
                <div>Roadmap</div>
                <div>Changelog</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <div className="space-y-2 text-muted-foreground">
                <div>Help Center</div>
                <div>Contact</div>
                <div>Privacy</div>
                <div>Terms</div>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-muted/20 text-center text-muted-foreground">
            <p>Built with ❤️ by Mohneesh Naidu • © {new Date().getFullYear()} Nesternity</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
          {icon}
        </div>
        <CardTitle className="text-xl mb-2">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
