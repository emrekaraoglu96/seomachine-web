"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProject } from "@/hooks/use-project";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
  PenTool,
  BarChart3,
  Loader2,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import type { ResearchBrief } from "@/lib/types";

type PipelineStage = "topic" | "researching" | "research-done" | "writing" | "scoring" | "done";

export default function NewArticlePage() {
  const { project, loading: projectLoading } = useProject();
  const [topic, setTopic] = useState("");
  const [stage, setStage] = useState<PipelineStage>("topic");
  const [researchBrief, setResearchBrief] = useState<ResearchBrief | null>(null);
  const [researchText, setResearchText] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [articleId, setArticleId] = useState<string | null>(null);
  const [refinement, setRefinement] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const startResearch = useCallback(async (feedback?: string) => {
    if (!project || !topic.trim()) return;
    setStage("researching");
    setResearchText("");

    const prompt = feedback
      ? `${topic}\n\nUser feedback on previous research:\n${feedback}`
      : topic;

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: prompt, projectId: project.id }),
      });

      if (!res.ok) throw new Error("Research failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setResearchText(fullText);
        }
      }

      // Parse the JSON response
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const brief = JSON.parse(jsonMatch[0]) as ResearchBrief;
        setResearchBrief(brief);
        setStage("research-done");
      } else {
        throw new Error("Failed to parse research brief");
      }
    } catch (err) {
      toast.error("Research failed. Please try again.");
      setStage("topic");
      console.error(err);
    }
  }, [project, topic]);

  const startWriting = useCallback(async () => {
    if (!project || !researchBrief) return;
    setStage("writing");
    setArticleContent("");

    try {
      const res = await fetch("/api/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          researchBrief,
        }),
      });

      if (!res.ok) throw new Error("Writing failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setArticleContent(fullText);
        }
      }

      // Score the article
      setStage("scoring");
      const scoreRes = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: fullText,
          targetKeyword: researchBrief.targetKeyword,
          metaTitle: researchBrief.suggestedMetaTitle,
          metaDescription: researchBrief.suggestedMetaDescription,
        }),
      });

      const scoreData = await scoreRes.json();

      // Save to Supabase
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { data: article, error } = await supabase
        .from("articles")
        .insert({
          project_id: project.id,
          user_id: user.id,
          topic,
          status: "draft",
          research_brief: researchBrief,
          content: fullText,
          meta_title: researchBrief.suggestedMetaTitle,
          meta_description: researchBrief.suggestedMetaDescription,
          target_keyword: researchBrief.targetKeyword,
          seo_score: scoreData.score,
          seo_score_breakdown: scoreData.breakdown,
          word_count: scoreData.wordCount,
        })
        .select("id")
        .single();

      if (error) throw error;

      setArticleId(article.id);
      setStage("done");
      toast.success("Article created!");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      setStage("research-done");
      console.error(err);
    }
  }, [project, researchBrief, topic, supabase]);

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Article</h1>
        <p className="text-sm text-muted-foreground">
          Enter a topic and let AI handle the rest
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 text-sm">
        <StepIndicator
          icon={Search}
          label="Research"
          active={stage === "researching"}
          done={["research-done", "writing", "scoring", "done"].includes(stage)}
        />
        <div className="h-px flex-1 bg-border" />
        <StepIndicator
          icon={PenTool}
          label="Write"
          active={stage === "writing"}
          done={["scoring", "done"].includes(stage)}
        />
        <div className="h-px flex-1 bg-border" />
        <StepIndicator
          icon={BarChart3}
          label="Score"
          active={stage === "scoring"}
          done={stage === "done"}
        />
      </div>

      {/* Topic Input */}
      {stage === "topic" && (
        <Card>
          <CardHeader>
            <CardTitle>What do you want to write about?</CardTitle>
            <CardDescription>
              Enter a topic, question, or keyword — be as specific as possible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                startResearch();
              }}
              className="flex gap-3"
            >
              <Input
                placeholder="e.g., How to reduce SaaS churn with onboarding emails"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <Button type="submit" disabled={!topic.trim()}>
                <Search className="h-4 w-4 mr-2" />
                Research
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Researching */}
      {stage === "researching" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Researching &ldquo;{topic}&rdquo;
            </CardTitle>
            <CardDescription>
              Analyzing keywords, search intent, and competitor content...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96 whitespace-pre-wrap font-mono">
              {researchText || "Starting research..."}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Research Done */}
      {stage === "research-done" && researchBrief && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Research Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Target Keyword
                </p>
                <p className="font-medium">{researchBrief.targetKeyword}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Search Intent
                </p>
                <p className="font-medium capitalize">{researchBrief.searchIntent}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Secondary Keywords
              </p>
              <div className="flex flex-wrap gap-1">
                {researchBrief.secondaryKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="bg-muted px-2 py-0.5 rounded text-xs"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Content Outline
              </p>
              <p className="font-medium">
                {researchBrief.contentOutline.title}
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {researchBrief.contentOutline.sections.map((s, i) => (
                  <li key={i}>
                    {i + 1}. {s.heading}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Meta Title
              </p>
              <p className="text-sm">{researchBrief.suggestedMetaTitle}</p>
            </div>

            {/* Refinement feedback */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground">
                Want to adjust? Tell the AI what to change.
              </p>
              <Textarea
                placeholder='e.g., "Focus more on enterprise use cases", "Add a section about pricing", "Remove the community section"'
                value={refinement}
                onChange={(e) => setRefinement(e.target.value)}
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    startResearch(refinement);
                    setRefinement("");
                  }}
                  disabled={!refinement.trim()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refine Research
                </Button>
                <Button onClick={startWriting} className="flex-1">
                  <PenTool className="h-4 w-4 mr-2" />
                  Write Article
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Writing */}
      {(stage === "writing" || stage === "scoring") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {stage === "writing" ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Writing article...
                </>
              ) : (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Scoring SEO...
                </>
              )}
            </CardTitle>
            <CardDescription>
              {stage === "writing"
                ? "Generating your SEO-optimized article with brand voice..."
                : "Analyzing content for SEO score..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg max-h-96 overflow-auto">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {articleContent || "Starting to write..."}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Done */}
      {stage === "done" && articleId && (
        <Card className="border-green-200">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Article Created!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Your article has been written, scored, and saved.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => router.push(`/articles/${articleId}`)}>
                View Article
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStage("topic");
                  setTopic("");
                  setResearchBrief(null);
                  setResearchText("");
                  setArticleContent("");
                  setArticleId(null);
                }}
              >
                Write Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StepIndicator({
  icon: Icon,
  label,
  active,
  done,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 ${
        done
          ? "text-green-600"
          : active
            ? "text-primary font-medium"
            : "text-muted-foreground"
      }`}
    >
      {done ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : active ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      <span>{label}</span>
    </div>
  );
}
