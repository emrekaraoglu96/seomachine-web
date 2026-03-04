"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

import { TONE_OPTIONS } from "@/lib/tone-options";

interface FormData {
  company_name: string;
  company_url: string;
  industry: string;
  target_audience: string;
  tone_of_voice: string;
  tone_description: string;
  example_articles: string[];
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    company_name: "",
    company_url: "",
    industry: "",
    target_audience: "",
    tone_of_voice: "Professional",
    tone_description: "",
    example_articles: [],
  });
  const [articleUrl, setArticleUrl] = useState("");
  const router = useRouter();
  const supabase = createClient();

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addArticle() {
    if (!articleUrl.trim()) return;
    setForm((prev) => ({
      ...prev,
      example_articles: [...prev.example_articles, articleUrl.trim()],
    }));
    setArticleUrl("");
  }

  function removeArticle(index: number) {
    setForm((prev) => ({
      ...prev,
      example_articles: prev.example_articles.filter((_, i) => i !== index),
    }));
  }

  async function handleFinish() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("projects").insert({
      user_id: user.id,
      ...form,
    });

    if (error) {
      toast.error("Failed to save: " + error.message);
      setLoading(false);
      return;
    }

    toast.success("Project created!");
    router.push("/dashboard");
  }

  const steps = [
    // Step 0: Company
    <div key="company" className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="company_name">Company Name *</Label>
        <Input
          id="company_name"
          placeholder="Acme Inc."
          value={form.company_name}
          onChange={(e) => update("company_name", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="company_url">Website</Label>
        <Input
          id="company_url"
          placeholder="https://acme.com"
          value={form.company_url}
          onChange={(e) => update("company_url", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="industry">Industry</Label>
        <Input
          id="industry"
          placeholder="SaaS, E-commerce, Healthcare..."
          value={form.industry}
          onChange={(e) => update("industry", e.target.value)}
        />
      </div>
    </div>,

    // Step 1: Audience
    <div key="audience" className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="target_audience">Target Audience</Label>
        <Textarea
          id="target_audience"
          placeholder="B2B SaaS marketing managers at companies with 50-500 employees who need to scale content production..."
          value={form.target_audience}
          onChange={(e) => update("target_audience", e.target.value)}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          Be specific. The more detail you give, the better your articles will
          target your readers.
        </p>
      </div>
    </div>,

    // Step 2: Tone
    <div key="tone" className="space-y-4">
      <div className="space-y-3">
        <Label>Tone of Voice</Label>
        <div className="flex flex-wrap gap-2">
          {TONE_OPTIONS.map((tone) => (
            <Badge
              key={tone.label}
              variant={form.tone_of_voice === tone.label ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => update("tone_of_voice", tone.label)}
            >
              {tone.label}
            </Badge>
          ))}
        </div>
        {/* Example preview */}
        <div className="bg-muted/50 border rounded-lg p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Example of {form.tone_of_voice.toLowerCase()} tone:
          </p>
          <p className="text-sm italic text-foreground/80">
            {TONE_OPTIONS.find((t) => t.label === form.tone_of_voice)?.example}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tone_description">Additional Tone Notes</Label>
        <Textarea
          id="tone_description"
          placeholder="Use data-driven arguments, avoid jargon, write like a smart friend..."
          value={form.tone_description}
          onChange={(e) => update("tone_description", e.target.value)}
          rows={3}
        />
      </div>
    </div>,

    // Step 3: Examples
    <div key="examples" className="space-y-4">
      <div className="space-y-2">
        <Label>Example Articles (optional)</Label>
        <p className="text-sm text-muted-foreground">
          Add URLs of articles that match the style you want. The AI will learn
          from them. The more examples you add, the better it captures your voice.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="https://blog.acme.com/great-article"
            value={articleUrl}
            onChange={(e) => setArticleUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addArticle())}
          />
          <Button type="button" variant="outline" onClick={addArticle}>
            Add
          </Button>
        </div>
        {form.example_articles.length > 0 && (
          <div className="space-y-2 mt-2">
            {form.example_articles.map((url, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-muted px-3 py-2 rounded text-sm"
              >
                <span className="truncate flex-1">{url}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeArticle(i)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
  ];

  const stepTitles = [
    { title: "Your Company", desc: "Tell us about your business" },
    { title: "Your Audience", desc: "Who are you writing for?" },
    { title: "Your Voice", desc: "How should your content sound?" },
    { title: "Examples", desc: "Share articles you admire (optional)" },
  ];

  const canNext =
    step === 0 ? form.company_name.trim().length > 0 : true;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              Step {step + 1} of {steps.length}
            </span>
          </div>
          <CardTitle>{stepTitles[step].title}</CardTitle>
          <CardDescription>{stepTitles[step].desc}</CardDescription>
          {/* Progress bar */}
          <div className="flex gap-1 mt-3">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {steps[step]}

          <div className="flex justify-between pt-2">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            {step < steps.length - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={loading || !canNext}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Finish Setup
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
