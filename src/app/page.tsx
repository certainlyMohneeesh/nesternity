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
import { ModeToggle } from "@/components/ui/mode-toggle";
import { TestimonialsMarquee } from "@/components/home/testimonials-marquee";
import { AIFeaturesGrid } from "@/components/home/ai-features-grid";
import { Layout, Receipt, Monitor, Briefcase } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20">
      {/* Dynamic Navigation Header */}
      <HomeHeader />

      {/* Hero Section */}
      <section className="py-8 md:py-16 px-6 text-center max-w-5xl mx-auto relative mt-16">
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
      <section className="py-8 px-6 bg-gradient-to-br from-background to-secondary/5">
        <div className="max-w-7xl mx-auto">
          {/* Bento Grid Features */}
          <BentoGrid />
        </div>
      </section>

      {/* AI Features Section */}
      <AIFeaturesGrid />

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

      {/* Problem-Solution Section - Redesigned */}
      <section className="py-12 px-6 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Nesternity?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stop juggling scattered tools. Transform chaos into one seamless, calm experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(200px,auto)]">
            {/* Card 1 - Large Span */}
            <Card className="md:col-span-2 border-0 shadow-lg bg-gradient-to-br from-red-500/5 to-orange-500/5 hover:shadow-xl transition-all duration-300 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Workflow className="w-32 h-32" />
              </div>
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Layout className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-2xl">Smart Boards & Kanban</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-muted-foreground">
                  Plan projects with intuitive Kanban boards. Drag, drop, and ship without the mental overhead of complex project management tools.
                </p>
              </CardContent>
            </Card>

            {/* Card 2 */}
            <Card className="border-0 shadow-lg bg-background/60 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Receipt className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-xl">Instant Invoicing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Generate beautiful, exportable PDFs and track payments. Get paid faster with zero friction.
                </p>
              </CardContent>
            </Card>

            {/* Card 3 */}
            <Card className="border-0 shadow-lg bg-background/60 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Monitor className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <CardTitle className="text-xl">Client Portal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Give clients a professional hub to view progress and invoices. Build trust through transparency.
                </p>
              </CardContent>
            </Card>

            {/* Card 4 - Large Span */}
            <Card className="md:col-span-2 border-0 shadow-lg bg-gradient-to-br from-blue-500/5 to-purple-500/5 hover:shadow-xl transition-all duration-300 overflow-hidden relative group">
              <div className="absolute bottom-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles className="w-32 h-32" />
              </div>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-2xl">AI-Powered Clarity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-muted-foreground">
                  Let AI handle the boring stuff. From drafting proposals to estimating budgets, Nesternity acts as your intelligent partner.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Infinite Marquee */}
      <section className="py-8 px-0 overflow-hidden">
        <div className="text-center mb-12 px-6">
          <h2 className="text-4xl font-bold mb-4">Loved by Freelancers</h2>
          <p className="text-xl text-muted-foreground">Join the community of professionals building their dreams</p>
        </div>
        <TestimonialsMarquee />
      </section>

      <section className="pt-0 pb-8 px-6 bg-gradient-to-r from-secondary/10 to-primary/5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Briefcase className="h-12 w-12 text-primary" />
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
              <div className="flex space-x-4 items-center">
                <Badge variant="outline">🚀 Beta</Badge>
                <Badge variant="outline">Built with Next.js</Badge>
                <ModeToggle />
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

