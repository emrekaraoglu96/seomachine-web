export const maxDuration = 60;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response("OpenAI API key not configured", { status: 500 });
  }

  const formData = await request.formData();
  const audio = formData.get("audio") as Blob | null;

  if (!audio) {
    return new Response("No audio file provided", { status: 400 });
  }

  const whisperForm = new FormData();
  whisperForm.append("file", audio, "recording.webm");
  whisperForm.append("model", "whisper-1");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: whisperForm,
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("[transcribe] Whisper API error:", error);
    return new Response("Transcription failed", { status: 500 });
  }

  const data = await res.json();
  return Response.json({ text: data.text });
}
