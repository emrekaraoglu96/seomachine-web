"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SeoScoreRing } from "@/components/seo-score-ring";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Copy,
  Download,
  Code,
  Lightbulb,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Info,
  Wand2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { track } from "@vercel/analytics";
import { Skeleton } from "@/components/ui/skeleton";
import type { Article, OptimizationSuggestion, SeoScoreBreakdown } from "@/lib/types";

const priorityIcons = {
  high: AlertCircle,
  medium: Info,
  low: Lightbulb,
};

const priorityColors = {
  high: "text-red-500",
  medium: "text-yellow-500",
  low: "text-blue-500",
};

function ScoreCategory({
  name,
  data,
}: {
  name: string;
  data: { score: number; max: number; details: string[] };
}) {
  const pct = Math.round((data.score / data.max) * 100);
  const color =
    pct >= 80
      ? "bg-green-500"
      : pct >= 60
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="capitalize font-medium">{name}</span>
        <span className="text-muted-foreground">
          {data.score}/{data.max}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="text-xs text-muted-foreground space-y-0.5">
        {data.details.map((d, i) => (
          <li key={i}>{d}</li>
        ))}
      </ul>
    </div>
  );
}

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[] | null>(null);
  const supabase = createClient();

  const fetchArticle = useCallback(async () => {
    setError(null);
    setLoading(true);

    const { data, error: fetchError } = await supabase
      .from("articles")
      .select("*")
      .eq("id", params.id)
      .single();

    if (fetchError) {
      setError(fetchError.message);
    } else if (data) {
      setArticle(data as Article);
      if (data.optimization_suggestions) {
        setSuggestions(data.optimization_suggestions as OptimizationSuggestion[]);
      }
    }
    setLoading(false);
  }, [params.id, supabase]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  const handleCopyMarkdown = useCallback(() => {
    if (!article?.content) return;
    navigator.clipboard.writeText(article.content);
    toast.success("Markdown copied to clipboard");
  }, [article]);

  const handleCopyHtml = useCallback(() => {
    if (!article?.content) return;
    // Simple markdown to HTML approach — copy the rendered HTML
    const el = document.getElementById("article-content");
    if (el) {
      navigator.clipboard.writeText(el.innerHTML);
      toast.success("HTML copied to clipboard");
    }
  }, [article]);

  const handleDownload = useCallback(() => {
    if (!article?.content) return;
    const blob = new Blob([article.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${article.target_keyword || article.topic}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("File downloaded");
  }, [article]);

  const handleOptimize = useCallback(async () => {
    if (!article?.content || !article.target_keyword || !article.seo_score || !article.seo_score_breakdown) return;
    setOptimizing(true);

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: article.content,
          targetKeyword: article.target_keyword,
          seoScore: article.seo_score,
          breakdown: article.seo_score_breakdown,
        }),
      });

      if (!res.ok) throw new Error("Optimize failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
        }
      }

      const jsonMatch = fullText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as OptimizationSuggestion[];
        setSuggestions(parsed);

        // Save suggestions to DB
        await supabase
          .from("articles")
          .update({
            optimization_suggestions: parsed,
            status: "optimized",
          })
          .eq("id", article.id);

        toast.success("Optimization suggestions ready");
      }
    } catch (err) {
      toast.error("Failed to get suggestions");
      console.error(err);
    }

    setOptimizing(false);
  }, [article, supabase]);

  const handleApplySuggestions = useCallback(async (toApply: OptimizationSuggestion[]) => {
    if (!article?.content || !article.target_keyword) return;
    setApplying(true);

    try {
      const res = await fetch("/api/apply-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: article.content,
          suggestions: toApply,
          targetKeyword: article.target_keyword,
          metaTitle: article.meta_title,
          metaDescription: article.meta_description,
        }),
      });

      if (!res.ok) throw new Error("Apply failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
        }
      }

      // Parse meta from frontmatter if present
      let newContent = fullText;
      let newMetaTitle = article.meta_title;
      let newMetaDescription = article.meta_description;

      const frontmatterMatch = fullText.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        newContent = frontmatterMatch[2].trim();

        const titleMatch = frontmatter.match(/meta_title:\s*["'](.+?)["']/);
        const descMatch = frontmatter.match(/meta_description:\s*["'](.+?)["']/);
        if (titleMatch) newMetaTitle = titleMatch[1];
        if (descMatch) newMetaDescription = descMatch[1];
      }

      // Re-score
      const scoreRes = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent,
          targetKeyword: article.target_keyword,
          metaTitle: newMetaTitle,
          metaDescription: newMetaDescription,
        }),
      });
      const scoreData = await scoreRes.json();

      // Update in DB
      await supabase
        .from("articles")
        .update({
          content: newContent,
          meta_title: newMetaTitle,
          meta_description: newMetaDescription,
          seo_score: scoreData.score,
          seo_score_breakdown: scoreData.breakdown,
          word_count: scoreData.wordCount,
          optimization_suggestions: null,
          status: "optimized",
        })
        .eq("id", article.id);

      // Update local state
      setArticle({
        ...article,
        content: newContent,
        meta_title: newMetaTitle,
        meta_description: newMetaDescription,
        seo_score: scoreData.score,
        seo_score_breakdown: scoreData.breakdown,
        word_count: scoreData.wordCount,
        status: "optimized",
      });
      setSuggestions(null);
      toast.success(`Applied! New SEO score: ${scoreData.score}/100`);
      track("article_optimized", { newScore: scoreData.score });
    } catch (err) {
      toast.error("Failed to apply suggestions");
      console.error(err);
    }

    setApplying(false);
  }, [article, supabase]);

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-16" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          {/* Content skeleton */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-6 w-1/2 mt-4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-6 w-2/5 mt-4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>

          {/* Sidebar skeleton */}
          <div className="space-y-4">
            {/* Score ring */}
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="flex justify-center">
                <Skeleton className="h-32 w-32 rounded-full" />
              </CardContent>
            </Card>

            {/* Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-36" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-10" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Meta tags */}
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div>
                  <Skeleton className="h-3 w-28 mb-1" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-1" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center text-center py-10">
            <AlertCircle className="h-10 w-10 text-destructive mb-4" />
            <h3 className="font-semibold mb-1">Failed to load article</h3>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button onClick={fetchArticle}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Article not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const breakdown = article.seo_score_breakdown as SeoScoreBreakdown | null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{article.meta_title || article.topic}</h1>
          <p className="text-sm text-muted-foreground">
            {article.target_keyword} &middot; {article.word_count.toLocaleString()} words
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyMarkdown}>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyHtml}>
            <Code className="h-4 w-4 mr-1" />
            HTML
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Article content */}
        <Card>
          <CardContent className="p-6">
            <div
              id="article-content"
              className="prose prose-sm max-w-none prose-headings:scroll-mt-20"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {article.content || ""}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* SEO Score */}
          {article.seo_score !== null && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">SEO Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="relative">
                  <SeoScoreRing score={article.seo_score} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Score Breakdown */}
          {breakdown && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(breakdown).map(([name, data]) => (
                  <ScoreCategory key={name} name={name} data={data} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Meta Tags */}
          {(article.meta_title || article.meta_description) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Meta Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {article.meta_title && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                      Title ({article.meta_title.length} chars)
                    </p>
                    <p className="text-sm">{article.meta_title}</p>
                  </div>
                )}
                {article.meta_description && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                      Description ({article.meta_description.length} chars)
                    </p>
                    <p className="text-sm">{article.meta_description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Optimize */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Optimization</CardTitle>
              <CardDescription>
                Get AI suggestions to improve your SEO score
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!suggestions ? (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleOptimize}
                  disabled={optimizing}
                >
                  {optimizing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Lightbulb className="h-4 w-4 mr-2" />
                  )}
                  Get Suggestions
                </Button>
              ) : (
                <div className="space-y-3">
                  {/* Apply All button */}
                  <Button
                    className="w-full"
                    onClick={() => handleApplySuggestions(suggestions)}
                    disabled={applying}
                  >
                    {applying ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-2" />
                    )}
                    {applying ? "Applying..." : "Apply All Suggestions"}
                  </Button>

                  <Separator />

                  {suggestions.map((s, i) => {
                    const Icon = priorityIcons[s.priority];
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-start gap-2">
                          <Icon
                            className={`h-4 w-4 mt-0.5 ${priorityColors[s.priority]}`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {s.category}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-xs capitalize"
                                >
                                  {s.priority}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleApplySuggestions([s])}
                                disabled={applying}
                              >
                                Apply
                              </Button>
                            </div>
                            <p className="text-sm mt-1">{s.suggestion}</p>
                            {s.currentValue && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Current: {s.currentValue}
                              </p>
                            )}
                            {s.recommendedValue && (
                              <p className="text-xs text-green-600 mt-0.5">
                                Recommended: {s.recommendedValue}
                              </p>
                            )}
                          </div>
                        </div>
                        {i < suggestions.length - 1 && <Separator />}
                      </div>
                    );
                  })}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={handleOptimize}
                    disabled={optimizing || applying}
                  >
                    {optimizing ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                    )}
                    Refresh Suggestions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
