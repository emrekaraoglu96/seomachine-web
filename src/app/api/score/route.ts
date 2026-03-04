import { NextResponse } from "next/server";
import { calculateSeoScore } from "@/lib/seo-scorer";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { content, targetKeyword, metaTitle, metaDescription } =
    await request.json();

  if (!content || !targetKeyword) {
    return NextResponse.json(
      { error: "content and targetKeyword required" },
      { status: 400 }
    );
  }

  const result = calculateSeoScore({
    content,
    targetKeyword,
    metaTitle,
    metaDescription,
  });

  return NextResponse.json(result);
}
