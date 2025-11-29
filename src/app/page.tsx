import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle,
  Star,
  Zap,
  Shield,
  Users,
  Sparkles,
  Brain,
  FileText,
  Database,
  Lock,
  Globe,
  Workflow
} from "lucide-react";
import InteractiveDemo from "@/components/demo/InteractiveDemo";
import NewsletterSignup from "@/components/newsletter/NewsletterSignup";
import { HomeHeader } from "@/components/navigation/home-header";
import { BentoGrid } from "@/components/home/bento-grid";

export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20">
      {/* Dynamic Navigation Header */}
      <HomeHeader />

      {/* Hero Section */}
      <section className="py-20 md:py-32 px-6 text-center max-w-5xl mx-auto relative mt-16">
        {/* Background overlay image */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <img
            src="/nesternity.svg"
            alt=""
            className="w-[600px] h-[600px] object-contain"
          />
        </div>

        <Badge variant="secondary" className="mb-6 relative z-10">
          🚀 Now in Beta
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent leading-tight relative z-10">
          The Freelancer's Nest for Clients, Teams & Clarity.
          Build, Collaborate, Thrive.
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed relative z-10">
          Nesternity is your all-in-one workspace for managing clients, projects, tasks, and invoices — all from one calm, cozy hub.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12 relative z-10">
          <Link href="/dashboard">
            <Button size="lg" className="gap-2 text-lg px-8 py-6">
              Get Started Free
              <ArrowRight className="h-5 w-5" />
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

      {/* Feature Grid - Supabase Style */}
      <section className="py-20 px-6 bg-gradient-to-br from-background to-secondary/5">
        <div className="max-w-7xl mx-auto">
          {/* Bento Grid Features */}
          <BentoGrid />
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-primary/5 to-emerald-500/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1 inline" />
              AI-Powered
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Work smarter with
              <span className="bg-gradient-to-r from-primary to-[#A459D1] bg-clip-text text-transparent"> AI assistance</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Let artificial intelligence handle the heavy lifting while you focus on what matters most
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg bg-background/80 backdrop-blur-sm hover:shadow-xl transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Smart Project Planning</CardTitle>
                <CardDescription className="text-base">
                  AI analyzes your project requirements and generates detailed plans, timelines, and task breakdowns automatically.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Automatic task generation based on project scope</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Intelligent timeline suggestions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Resource allocation recommendations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-background/80 backdrop-blur-sm hover:shadow-xl transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Proposal Generator</CardTitle>
                <CardDescription className="text-base">
                  Create professional proposals in minutes. AI writes compelling content tailored to your client's needs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Personalized proposal content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Budget estimation and pricing suggestions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Industry-specific templates</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Product Demo Section */}
      <section className="py-12 px-6 bg-gradient-to-br from-background to-muted/10">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            ✨ Product Preview
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent pb-2">
            Your Work, Beautifully Organized
          </h2>
          <div className="h-2" />
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See how Nesternity transforms chaotic workflows into seamless experiences.
            Every feature designed with your productivity in mind.
          </p>
        </div>

        {/* Interactive Product Demo Section */}
        <div className="max-w-7xl mx-auto">
          <InteractiveDemo />
        </div>
      </section>

      {/* Call to Action After Demo */}
      <section className="py-16 px-6 bg-gradient-to-r from-primary/5 to-purple-500/5">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Build Your Next Project?</h3>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of teams who trust Nesternity to streamline their workflow
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2 text-lg px-8 py-4">
                Start For Free Now
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Problem-Solution Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-muted/30 to-muted/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Why Nesternity?</h2>
          <p className="text-xl text-muted-foreground text-center mb-16"> To transform scattered tools into one seamless experience</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg bg-background/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🧠</span>
                </div>
                <CardTitle className="text-lg">Smart Boards</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Plan projects with Kanban-style ease — assign, drag, and ship like a pro.</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-background/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🧾</span>
                </div>
                <CardTitle className="text-lg">Instant Invoicing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Generate beautiful, exportable PDFs and track payments effortlessly.</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-background/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🧍‍♂️</span>
                </div>
                <CardTitle className="text-lg">Client-Centric</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Keep all client details, tasks, and communication in one elegant place.
                  <br />
                  <span className="font-medium">Your time is worth more than spreadsheets hell.</span>
                  <br />
                </p>
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
              description="Track boards, projects, and issues all in one organized space. Never lose track of client details again."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-primary" />}
              title="Invoice Composer"
              description="Generate, customize, and e-sign invoices in minutes. Professional documents without the complexity."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8 text-primary" />}
              title="Lightweight & Blazing Fast"
              description="Built with Next.js and optimized for speed. No bloat, just brilliance."
            />
            <FeatureCard
              icon={<Star className="h-8 w-8 text-primary" />}
              title="Visual Dashboard"
              description="Stay on top of everything at a glance with beautiful, intuitive dashboards that actually make sense."
            />
            <FeatureCard
              icon={<CheckCircle className="h-8 w-8 text-primary" />}
              title="Activity Tracking"
              description="From task edits to comment threads — know who did what, when."
            />
            <FeatureCard
              icon={<ArrowRight className="h-8 w-8 text-primary" />}
              title="Team Collaboration"
              description="Invite team members. Share progress, get feedback, and stay aligned effortlessly."
            />
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-gradient-to-r from-secondary/10 to-primary/5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <span className="text-5xl">💼</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">Who It's For</h2>
          <p className="text-2xl font-semibold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Freelancers. Agencies. Indie Hackers. Creators.
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you work solo or with a small team, Nesternity brings your whole operation into one intuitive space.
          </p>
        </div>
      </section>

      {/* Newsletter / Waitlist */}
      <NewsletterSignup />

      {/* Footer */}
      <footer className="py-16 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-xl font-bold">Nesternity</span>
              </div>
              <p className="font-bold mb-2">The Philosophy Behind Nesternity</p>
              <p className="text-muted-foreground mb-4 max-w-md">
                Inspired by the idea of a nest: secure, supportive, and ever-growing. Nesternity empowers modern professionals to work smarter, not harder.
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
                <Link href="/docs" className="block hover:text-foreground">Documentation</Link>
                <div>Contact</div>
                <div>Privacy</div>
                <div>Terms</div>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-muted/20 text-center text-muted-foreground">
            <p>
              Built with ❤️ <a href="https://cyth.dev" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Cythical Labs</a> • © {new Date().getFullYear()} <a>Nesternity</a>
            </p>
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

