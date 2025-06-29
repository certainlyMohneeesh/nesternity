import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-24 px-6 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          The Freelancer's Nest for Clients, Contracts & Clarity
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Nesternity helps solo professionals manage client relationships, send smart contracts,
          and stay paid — all from one calm, cozy hub.
        </p>
        <div className="flex justify-center gap-4">
          <Link className="btn btn-primary" href="/dashboard">Try it Free</Link>
          <Link className="btn btn-outline" href="/demo">Watch Demo</Link>
        </div>
      </section>

      {/* Problem-Solution Section */}
      <section className="py-20 px-6 bg-muted/20 text-center">
        <h2 className="text-2xl font-semibold mb-6">Messy freelance workflows? Meet your new favorite workspace.</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div>
            <h3 className="font-bold mb-2 text-lg">❌ Forgetting client details</h3>
            <p className="text-muted-foreground">No more scattered notes or Excel chaos.</p>
          </div>
          <div>
            <h3 className="font-bold mb-2 text-lg">❌ Sending messy PDFs</h3>
            <p className="text-muted-foreground">Create clean, branded documents in seconds.</p>
          </div>
          <div>
            <h3 className="font-bold mb-2 text-lg">❌ Manually tracking payments</h3>
            <p className="text-muted-foreground">Nesternity tracks invoices so you don’t have to.</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need to work smart</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          <FeatureCard title="Client Capsule" description="Track contacts, projects, and timelines all in one place." />
          <FeatureCard title="Contract Composer" description="Generate, edit, and e-sign contracts in minutes." />
          <FeatureCard title="Smart Invoicing" description="Send invoices and monitor payment statuses in real-time." />
          <FeatureCard title="Dashboard" description="Stay on top of everything at a glance with the visual dashboard." />
          <FeatureCard title="Async Notes" description="Drop notes or reminders per client or project for smooth follow-ups." />
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-6 bg-muted/10 text-center">
        <h2 className="text-2xl font-semibold mb-4">Simple Pricing for Freelancers</h2>
        <p className="mb-8 text-muted-foreground">Start free. Upgrade when you’re ready for more.</p>
        <div className="flex justify-center gap-8">
          <div className="p-6 rounded-lg shadow bg-card w-64">
            <h3 className="font-bold text-lg mb-2">Free</h3>
            <p className="text-muted-foreground mb-4">Basic CRM, contracts & invoices for up to 3 clients.</p>
            <button className="btn btn-primary w-full">Get Started</button>
          </div>
          <div className="p-6 rounded-lg shadow bg-card w-64 border border-primary">
            <h3 className="font-bold text-lg mb-2">Pro</h3>
            <p className="text-muted-foreground mb-4">Unlimited clients, branding, and advanced features.</p>
            <button className="btn btn-outline-primary w-full">Join Waitlist</button>
          </div>
        </div>
      </section>

      {/* Newsletter / Waitlist */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-2xl font-semibold mb-4">We’re building Nesternity in public</h2>
        <p className="text-muted-foreground mb-6">Join our waitlist and be the first to know when we launch.</p>
        <form className="flex flex-col sm:flex-row justify-center gap-4 max-w-xl mx-auto">
          <input type="email" placeholder="you@example.com" className="input w-full" />
          <button className="btn btn-primary">Join Waitlist</button>
        </form>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 text-center text-sm text-muted-foreground">
        Built with ❤️ by Mohneesh Naidu • © {new Date().getFullYear()} Nesternity
      </footer>
    </main>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 bg-card rounded-lg shadow">
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
