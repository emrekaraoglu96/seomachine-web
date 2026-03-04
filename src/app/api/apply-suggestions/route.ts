import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 120;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { content, suggestions, targetKeyword, metaTitle, metaDescription } =
    await request.json();

  const suggestionsText = suggestions
    .map(
      (s: { category: string; suggestion: string; currentValue?: string; recommendedValue?: string }, i: number) =>
        `${i + 1}. [${s.category}] ${s.suggestion}${s.currentValue ? `\n   Current: ${s.currentValue}` : ""}${s.recommendedValue ? `\n   Recommended: ${s.recommendedValue}` : ""}`
    )
    .join("\n\n");

  const result = streamText({
    model: anthropic("claude-sonnet-4-5-20250929"),
    system: `You are an expert SEO editor. Your job is to apply specific optimization suggestions to an existing article.

## Rules
1. Apply ALL the suggestions listed below to the article
2. Keep the article's overall structure, voice, and message intact
3. Do NOT add commentary or notes — output ONLY the revised article in Markdown
4. Preserve all existing links, headings, and formatting
5. If a suggestion asks to change meta title or description, output them as YAML frontmatter at the very top:
   ---
   meta_title: "new title here"
   meta_description: "new description here"
   ---
6. Target keyword: "${targetKeyword}"
7. Current meta title: "${metaTitle || "none"}"
8. Current meta description: "${metaDescription || "none"}"`,
    prompt: `Apply these SEO optimization suggestions to the article below.

## Suggestions to Apply
${suggestionsText}

## Current Article
${content}`,
    maxOutputTokens: 8192,
  });

  return result.toTextStreamResponse();
}
