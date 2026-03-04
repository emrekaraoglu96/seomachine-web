"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProject } from "@/hooks/use-project";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, AlertCircle, RefreshCw, Search, PenTool, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Article } from "@/lib/types";

function ArticleCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-7 w-8" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-3 w-24 mt-2" />
      </CardContent>
    </Card>
  );
}

const statusColors: Record<string, string> = {
  researching: "bg-blue-100 text-blue-700",
  writing: "bg-purple-100 text-purple-700",
  scoring: "bg-yellow-100 text-yellow-700",
  draft: "bg-gray-100 text-gray-700",
  optimized: "bg-green-100 text-green-700",
  published: "bg-emerald-100 text-emerald-700",
};

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const color =
    score >= 80
      ? "text-green-600"
      : score >= 60
        ? "text-yellow-600"
        : "text-red-600";
  return <span className={`font-bold text-lg ${color}`}>{score}</span>;
}

export default function DashboardPage() {
  const { project, loading: projectLoading } = useProject();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchArticles = useCallback(async () => {
    if (!project) return;
    setError(null);
    setLoading(true);

    const { data, error: fetchError } = await supabase
      .from("articles")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else if (data) {
      setArticles(data as Article[]);
    }
    setLoading(false);
  }, [project, supabase]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  if (projectLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
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
            <h3 className="font-semibold mb-1">Failed to load articles</h3>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <Button onClick={fetchArticles}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Articles</h1>
          <p className="text-sm text-muted-foreground">
            {project?.company_name} — {articles.length} article
            {articles.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/articles/new">
            <Plus className="h-4 w-4 mr-2" />
            New Article
          </Link>
        </Button>
      </div>

      {articles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-primary/10 rounded-full p-4 mb-6">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Write your first article</h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm">
              AI handles the research, writing, and SEO optimization.
              You just pick a topic.
            </p>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-8">
              <div className="flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5" />
                <span>Research</span>
              </div>
              <ArrowRight className="h-3 w-3" />
              <div className="flex items-center gap-1.5">
                <PenTool className="h-3.5 w-3.5" />
                <span>Write</span>
              </div>
              <ArrowRight className="h-3 w-3" />
              <div className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Score</span>
              </div>
            </div>

            <Button asChild size="lg">
              <Link href="/articles/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Article
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link key={article.id} href={`/articles/${article.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">
                      {article.meta_title || article.topic}
                    </CardTitle>
                    <ScoreBadge score={article.seo_score} />
                  </div>
                  <CardDescription className="line-clamp-1">
                    {article.target_keyword || article.topic}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <Badge
                      variant="secondary"
                      className={statusColors[article.status] || ""}
                    >
                      {article.status}
                    </Badge>
                    <span className="text-muted-foreground">
                      {article.word_count > 0
                        ? `${article.word_count.toLocaleString()} words`
                        : "—"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(article.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
