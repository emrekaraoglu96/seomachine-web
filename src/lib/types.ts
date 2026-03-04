export interface Project {
  id: string;
  user_id: string;
  company_name: string;
  company_url: string | null;
  industry: string | null;
  target_audience: string | null;
  tone_of_voice: string;
  tone_description: string | null;
  example_articles: string[];
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  project_id: string;
  user_id: string;
  topic: string;
  status: "researching" | "writing" | "scoring" | "draft" | "optimized" | "published";
  research_brief: ResearchBrief | null;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  target_keyword: string | null;
  seo_score: number | null;
  seo_score_breakdown: SeoScoreBreakdown | null;
  optimization_suggestions: OptimizationSuggestion[] | null;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface ResearchBrief {
  targetKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string;
  competitorInsights: string[];
  contentOutline: {
    title: string;
    sections: { heading: string; keyPoints: string[] }[];
  };
  suggestedMetaTitle: string;
  suggestedMetaDescription: string;
  estimatedWordCount: number;
}

export interface SeoScoreBreakdown {
  content: { score: number; max: number; details: string[] };
  keywords: { score: number; max: number; details: string[] };
  meta: { score: number; max: number; details: string[] };
  structure: { score: number; max: number; details: string[] };
  links: { score: number; max: number; details: string[] };
  readability: { score: number; max: number; details: string[] };
}

export interface OptimizationSuggestion {
  category: string;
  priority: "high" | "medium" | "low";
  suggestion: string;
  currentValue?: string;
  recommendedValue?: string;
}
