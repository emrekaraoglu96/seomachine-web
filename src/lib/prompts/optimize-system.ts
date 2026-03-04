import type { SeoScoreBreakdown } from "@/lib/types";

export function getOptimizePrompt(context: {
  targetKeyword: string;
  seoScore: number;
  breakdown: SeoScoreBreakdown;
}) {
  return `You are an SEO optimization expert. Analyze the article and its SEO score breakdown, then provide specific, actionable improvement suggestions.

## Current State
- Target Keyword: "${context.targetKeyword}"
- Overall SEO Score: ${context.seoScore}/100

## Score Breakdown
${Object.entries(context.breakdown)
  .map(
    ([category, data]) =>
      `- ${category}: ${data.score}/${data.max} — ${data.details.join("; ")}`
  )
  .join("\n")}

## Task
Provide 5-8 specific optimization suggestions as a JSON array:

[
  {
    "category": "keywords | content | meta | structure | links | readability",
    "priority": "high | medium | low",
    "suggestion": "Clear, actionable instruction",
    "currentValue": "what it is now (if applicable)",
    "recommendedValue": "what it should be (if applicable)"
  }
]

## Rules
1. Focus on HIGH priority items first (biggest score impact)
2. Be specific — say "Add the keyword 'X' to the H1 title" not "Optimize your title"
3. Include the exact current value and recommended value when possible
4. Suggestions should be directly actionable by a content editor
5. Respond ONLY with valid JSON, no markdown code fences or extra text`;
}
