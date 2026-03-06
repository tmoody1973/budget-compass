import { NextResponse } from "next/server";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

const polly = new PollyClient({
  region: process.env.AWS_REGION ?? "us-east-1",
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    // Truncate to Polly's 3000 char limit per request
    const truncated = text.slice(0, 3000);

    const command = new SynthesizeSpeechCommand({
      Text: truncated,
      OutputFormat: "mp3",
      VoiceId: "Ruth", // US English neural voice — warm, professional
      Engine: "generative", // highest quality
      TextType: "text",
    });

    const response = await polly.send(command);

    if (!response.AudioStream) {
      return NextResponse.json(
        { error: "No audio returned" },
        { status: 500 },
      );
    }

    // Convert stream to bytes
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
    console.error("[tts] Polly error:", err);
    return NextResponse.json(
      { error: "TTS synthesis failed" },
      { status: 500 },
    );
  }
}
