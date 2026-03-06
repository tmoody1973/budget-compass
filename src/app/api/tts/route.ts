import { NextResponse } from "next/server";
import { PollyClient, SynthesizeSpeechCommand, type Engine, type VoiceId } from "@aws-sdk/client-polly";

const polly = new PollyClient({
  region: process.env.AWS_REGION ?? "us-east-1",
});

// Try engines in order of quality — generative > long-form > neural
const ENGINE_VOICE_FALLBACKS: Array<{ engine: Engine; voice: VoiceId }> = [
  { engine: "generative", voice: "Ruth" },
  { engine: "long-form", voice: "Ruth" },
  { engine: "neural", voice: "Joanna" },
];

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    // Truncate to Polly's 3000 char limit per request
    const truncated = text.slice(0, 3000);

    let lastError: unknown;
    for (const { engine, voice } of ENGINE_VOICE_FALLBACKS) {
      try {
        const command = new SynthesizeSpeechCommand({
          Text: truncated,
          OutputFormat: "mp3",
          VoiceId: voice,
          Engine: engine,
          TextType: "text",
        });

        const response = await polly.send(command);

        if (!response.AudioStream) continue;

        const chunks: Uint8Array[] = [];
        const reader = response.AudioStream as AsyncIterable<Uint8Array>;
        for await (const chunk of reader) {
          chunks.push(chunk);
        }
        const audioBytes = Buffer.concat(chunks);

        return new NextResponse(audioBytes, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Content-Length": audioBytes.length.toString(),
            "Cache-Control": "public, max-age=3600",
          },
        });
      } catch (err) {
        console.warn(`[tts] ${engine}/${voice} failed, trying next:`, (err as Error).message);
        lastError = err;
      }
    }

    console.error("[tts] All Polly engines failed:", lastError);
    return NextResponse.json(
      { error: "TTS synthesis failed" },
      { status: 500 },
    );
  } catch (err) {
    console.error("[tts] Request error:", err);
    return NextResponse.json(
      { error: "TTS synthesis failed" },
      { status: 500 },
    );
  }
}
