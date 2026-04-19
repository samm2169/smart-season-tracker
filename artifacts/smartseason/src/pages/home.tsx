import { Link } from "wouter";
import { Leaf, ArrowRight, BarChart3, Map, BellRing, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl tracking-tight text-foreground">SmartSeason</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 md:py-32 px-4 md:px-8">
          <div className="container max-w-5xl mx-auto text-center">
            <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20 border-0 px-3 py-1">
              Field Operations Command Center
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-8 max-w-4xl mx-auto">
              Precision tracking for the <span className="text-primary">growing season.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Equip your field agents and farm coordinators with a reliable, grounded tool to track crop lifecycle stages, monitor risks, and record updates in real-time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto">
                  Start Monitoring
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-muted/50 px-4 md:px-8 border-t border-border">
          <div className="container max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">Built for Agricultural Operations</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to manage field operations, organized exactly where you expect it to be.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard 
                icon={Map}
                title="Field Tracking"
                description="Monitor fields, crop types, and locations with precise status tracking."
              />
              <FeatureCard 
                icon={BarChart3}
                title="Lifecycle Stages"
                description="Track crops from planting to harvest with clear progress indicators."
              />
              <FeatureCard 
                icon={BellRing}
                title="Risk Monitoring"
                description="Quickly identify at-risk fields and coordinate timely interventions."
              />
              <FeatureCard 
                icon={ShieldCheck}
                title="Role-Based Access"
                description="Secure tools for both farm coordinators and assigned field agents."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-12 px-4 md:px-8 bg-background mt-auto">
        <div className="container max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold text-muted-foreground">SmartSeason</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SmartSeason Field Monitoring System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-3 text-card-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
