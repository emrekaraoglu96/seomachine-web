import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { getResearchPrompt } from "@/lib/prompts/research-system";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { topic, projectId, voiceTranscript } = await request.json();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return new Response("Project not found", { status: 404 });
  }

  const result = streamText({
    model: anthropic("claude-sonnet-4-5-20250929"),
    system: getResearchPrompt({
      companyName: project.company_name,
      industry: project.industry,
      targetAudience: project.target_audience,
    }),
    prompt: voiceTranscript
      ? `Research this topic and create a comprehensive content brief: "${topic}"\n\nThe author described their vision and angle in their own words:\n"""\n${voiceTranscript}\n"""\n\nUse the author's perspective to shape the research — prioritize their angle, key points, and unique insights when building the content outline.`
      : `Research this topic and create a comprehensive content brief: "${topic}"`,
    maxOutputTokens: 4096,
  });

  return result.toTextStreamResponse();
}
