import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { getWritePrompt } from "@/lib/prompts/write-system";
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

  const { projectId, researchBrief } = await request.json();

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
    system: getWritePrompt({
      companyName: project.company_name,
      companyUrl: project.company_url,
      industry: project.industry,
      targetAudience: project.target_audience,
      toneOfVoice: project.tone_of_voice,
      toneDescription: project.tone_description,
      researchBrief,
    }),
    prompt:
      "Write the complete article following the content brief and all writing rules. Output clean Markdown.",
    maxOutputTokens: 8192,
  });

  return result.toTextStreamResponse();
}
