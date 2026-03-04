import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { getOptimizePrompt } from "@/lib/prompts/optimize-system";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { content, targetKeyword, seoScore, breakdown } = await request.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-5-20250929"),
    system: getOptimizePrompt({ targetKeyword, seoScore, breakdown }),
    prompt: `Analyze this article and provide optimization suggestions:\n\n${content.substring(0, 6000)}`,
    maxOutputTokens: 4096,
  });

  return result.toTextStreamResponse();
}
