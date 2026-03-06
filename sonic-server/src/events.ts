/**
 * Event serialization helpers for Amazon Nova Sonic bidirectional streaming.
 *
 * Per AWS docs: All events wrapped in { event: { ... } }.
 * Every event references promptName and contentName for correlation.
 * Events are encoded as { chunk: { bytes: Uint8Array(JSON) } } on the wire.
 *
 * @see https://docs.aws.amazon.com/nova/latest/userguide/input-events.html
 */

import crypto from "crypto";

/* ------------------------------------------------------------------ */
/* Session lifecycle                                                    */
/* ------------------------------------------------------------------ */

export function sessionStartEvent() {
  return {
    event: {
      sessionStart: {
        inferenceConfiguration: {
          maxTokens: 1024,
          topP: 0.9,
          temperature: 0.7,
        },
      },
    },
  };
}

export function sessionEndEvent() {
  return { event: { sessionEnd: {} } };
}

/* ------------------------------------------------------------------ */
/* Prompt lifecycle                                                     */
/* ------------------------------------------------------------------ */

interface ToolDef {
  toolName: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

interface VoiceConfig {
  voiceId: string;
}

export function promptStartEvent(
  promptName: string,
  tools: ToolDef[],
  voiceConfig: VoiceConfig = { voiceId: "tiffany" }
) {
  return {
    event: {
      promptStart: {
        promptName,
        textOutputConfiguration: { mediaType: "text/plain" },
        audioOutputConfiguration: {
          mediaType: "audio/lpcm",
          sampleRateHertz: 24000,
          sampleSizeBits: 16,
          channelCount: 1,
          voiceId: voiceConfig.voiceId,
          encoding: "base64",
          audioType: "SPEECH",
        },
        toolUseOutputConfiguration: { mediaType: "application/json" },
        toolConfiguration: {
          tools: tools.map((t) => ({
            toolSpec: {
              name: t.toolName,
              description: t.description,
              inputSchema: {
                json: t.inputSchema, // object, NOT stringified
              },
            },
          })),
          toolChoice: { auto: {} },
        },
      },
    },
  };
}

export function promptEndEvent(promptName: string) {
  return { event: { promptEnd: { promptName } } };
}

/* ------------------------------------------------------------------ */
/* Content blocks — System prompt (TEXT, role=SYSTEM)                    */
/* ------------------------------------------------------------------ */

export function textContentStart(
  promptName: string,
  contentName: string,
  role: "SYSTEM" | "USER" | "ASSISTANT" = "SYSTEM",
  interactive: boolean = false
) {
  return {
    event: {
      contentStart: {
        promptName,
        contentName,
        type: "TEXT",
        interactive,
        role,
        textInputConfiguration: { mediaType: "text/plain" },
      },
    },
  };
}

export function textInputEvent(
  promptName: string,
  contentName: string,
  content: string
) {
  return {
    event: {
      textInput: {
        promptName,
        contentName,
        content,
      },
    },
  };
}

export function contentEndEvent(
  promptName: string,
  contentName: string
) {
  return {
    event: {
      contentEnd: {
        promptName,
        contentName,
      },
    },
  };
}

/* ------------------------------------------------------------------ */
/* Audio input                                                          */
/* ------------------------------------------------------------------ */

export function audioContentStart(
  promptName: string,
  contentName: string
) {
  return {
    event: {
      contentStart: {
        promptName,
        contentName,
        type: "AUDIO",
        interactive: true,
        role: "USER",
        audioInputConfiguration: {
          mediaType: "audio/lpcm",
          sampleRateHertz: 16000,
          sampleSizeBits: 16,
          channelCount: 1,
        },
      },
    },
  };
}

export function audioInputEvent(
  promptName: string,
  contentName: string,
  base64Audio: string
) {
  return {
    event: {
      audioInput: {
        promptName,
        contentName,
        content: base64Audio,
      },
    },
  };
}

/* ------------------------------------------------------------------ */
/* Tool results                                                         */
/* ------------------------------------------------------------------ */

export function toolResultStart(
  promptName: string,
  contentName: string,
  toolUseId: string
) {
  return {
    event: {
      contentStart: {
        promptName,
        contentName,
        interactive: false,
        type: "TOOL",
        role: "TOOL",
        toolResultInputConfiguration: {
          toolUseId,
          type: "TEXT",
          textInputConfiguration: { mediaType: "text/plain" },
        },
      },
    },
  };
}

export function toolResultEvent(
  promptName: string,
  contentName: string,
  result: string
) {
  return {
    event: {
      toolResult: {
        promptName,
        contentName,
        content: result,
      },
    },
  };
}

/* ------------------------------------------------------------------ */
/* Composite helpers                                                    */
/* ------------------------------------------------------------------ */

/** Build the full system prompt event sequence */
export function systemPromptEvents(promptName: string, text: string) {
  const contentName = crypto.randomUUID();
  return [
    textContentStart(promptName, contentName, "SYSTEM", false),
    textInputEvent(promptName, contentName, text),
    contentEndEvent(promptName, contentName),
  ];
}

/** Build a user context text event sequence */
export function contextEvents(promptName: string, text: string) {
  const contentName = crypto.randomUUID();
  return [
    textContentStart(promptName, contentName, "USER", false),
    textInputEvent(promptName, contentName, text),
    contentEndEvent(promptName, contentName),
  ];
}

/** Build tool result event sequence */
export function toolResultEvents(
  promptName: string,
  toolUseId: string,
  result: string
) {
  const contentName = crypto.randomUUID();
  return [
    toolResultStart(promptName, contentName, toolUseId),
    toolResultEvent(promptName, contentName, result),
    contentEndEvent(promptName, contentName),
  ];
}

/** Close events: audio contentEnd → promptEnd → sessionEnd */
export function closeEvents(promptName: string, audioContentName: string) {
  return [
    contentEndEvent(promptName, audioContentName),
    promptEndEvent(promptName),
    sessionEndEvent(),
  ];
}

/* ------------------------------------------------------------------ */
/* Wire encoding helper                                                 */
/* ------------------------------------------------------------------ */

/** Encode an event object into the wire format { chunk: { bytes } } */
export function encodeEvent(event: Record<string, unknown>) {
  return {
    chunk: {
      bytes: new TextEncoder().encode(JSON.stringify(event)),
    },
  };
}
