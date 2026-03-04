"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Search,
  PenTool,
  BarChart3,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { track } from "@vercel/analytics";

function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        toast.success(data.message);
        track("waitlist_signup");
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Something went wrong");
    }
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Check className="h-4 w-4" />
        <span>You&apos;re on the list! We&apos;ll be in touch.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md">
      <Input
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-1"
      />
      <Button type="submit" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Join Waitlist
            <ArrowRight className="ml-1 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}

const features = [
  {
    icon: Search,
    title: "AI Keyword Research",
    description:
      "Analyze search intent, competitors, and find high-impact keywords — all in seconds.",
  },
  {
    icon: PenTool,
    title: "Long-Form SEO Writing",
    description:
      "Generate 2,000+ word articles with your brand voice, hook formulas, and strategic CTAs.",
  },
  {
    icon: BarChart3,
    title: "Real-Time SEO Scoring",
    description:
      "Get an instant score across 6 categories with actionable optimization suggestions.",
  },
];

const steps = [
  {
    number: "1",
    title: "Set Up Your Brand",
    description: "Add your company info, target audience, and tone of voice.",
  },
  {
    number: "2",
    title: "Enter a Topic",
    description:
      "Type any topic and watch AI research keywords and plan your content.",
  },
  {
    number: "3",
    title: "Get Your Article",
    description:
      "Receive a fully optimized, publish-ready article with SEO score.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Zap className="h-5 w-5" />
            SEO
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <Badge variant="secondary" className="mb-2">
            Free Beta — Limited Spots
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            SEO articles that{" "}
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              actually rank
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From topic to publish-ready article in minutes. AI-powered keyword
            research, brand-voice writing, and real-time SEO scoring — built for
            B2B marketing teams.
          </p>
          <div className="flex flex-col items-center gap-4 pt-2">
            <WaitlistForm />
            <p className="text-xs text-muted-foreground">
              No credit card required. Free during beta.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Research. Write. Optimize.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border-0 shadow-sm">
                <CardContent className="pt-6 space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {f.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Three steps to publish
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.number} className="text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto">
                  {s.number}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to ship content faster?</h2>
          <p className="text-muted-foreground">
            Join the beta and start creating SEO-optimized articles today.
          </p>
          <div className="flex justify-center">
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>SEO</span>
          </div>
          <p>&copy; {new Date().getFullYear()} SEO. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
