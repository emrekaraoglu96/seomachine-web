"use client";

import { useEffect, useState } from "react";
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
import { Plus, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Article } from "@/lib/types";

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
  const supabase = createClient();

  useEffect(() => {
    if (!project) return;

    async function fetchArticles() {
      const { data } = await supabase
        .from("articles")
        .select("*")
        .eq("project_id", project!.id)
        .order("created_at", { ascending: false });

      if (data) setArticles(data as Article[]);
      setLoading(false);
    }

    fetchArticles();
  }, [project, supabase]);

  if (projectLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-1">No articles yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first SEO-optimized article in minutes.
            </p>
            <Button asChild>
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
