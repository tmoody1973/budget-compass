/**
 * Client-side orchestrator for Nova Sonic voice conversations.
 * Manages Socket.IO connection, AudioWorklet mic capture + playback,
 * state machine, and barge-in detection.
 */

import { io, Socket } from "socket.io-client";

export type SonicState = "idle" | "connecting" | "listening" | "thinking" | "speaking";

export interface SonicConfig {
  sonicUrl: string;
  persona: string;
  assessedValue: number;
  totalTax: number;
  jurisdictions: Array<{
    shortName: string;
    yourShare: number;
    pct: number;
    rate: number;
  }>;
  voiceId?: string;
  onStateChange: (state: SonicState) => void;
  onTranscript: (text: string, role: "user" | "assistant") => void;
  onToolUse: (toolName: string, status: string) => void;
  onAmplitude: (level: number) => void;
  onError?: (message: string) => void;
}

export class SonicClient {
  private socket: Socket | null = null;
  private audioContext: AudioContext | null = null;
  private captureNode: AudioWorkletNode | null = null;
  private playbackNode: AudioWorkletNode | null = null;
  private mediaStream: MediaStream | null = null;
  private state: SonicState = "idle";
  private config: SonicConfig;

  constructor(config: SonicConfig) {
    this.config = config;
  }

  getState(): SonicState {
    return this.state;
  }

  isConnected(): boolean {
    return this.state !== "idle" && this.socket?.connected === true;
  }

  private setState(state: SonicState) {
    this.state = state;
    this.config.onStateChange(state);
  }

  async connect(): Promise<void> {
    if (this.state !== "idle") return;
    this.setState("connecting");

    try {
      // 1. Connect Socket.IO with timeout
      await this.connectSocket();

      // 2. Set up audio pipeline
      await this.setupAudio();

      // 3. Start Sonic session on server
      this.socket!.emit("sonic:start", {
        persona: this.config.persona,
        voiceId: this.config.voiceId ?? "tiffany",
        assessedValue: this.config.assessedValue,
        totalTax: this.config.totalTax,
        jurisdictions: this.config.jurisdictions,
      });

      this.setState("listening");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[SonicClient] Connection failed:", msg);
      this.config.onError?.(msg);
      this.cleanup();
      this.setState("idle");
      throw err;
    }
  }

  disconnect(): void {
    if (this.state === "idle") return;
    this.socket?.emit("sonic:stop");
    this.cleanup();
    this.setState("idle");
  }

  /** Stop playback immediately (barge-in) */
  private clearPlayback(): void {
    this.playbackNode?.port.postMessage({ type: "clear" });
  }

  private async connectSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Sonic server connection timeout"));
      }, 3000);

      this.socket = io(this.config.sonicUrl, {
        transports: ["websocket"],
        timeout: 3000,
      });

      this.socket.on("connect", () => {
        clearTimeout(timeout);
        this.setupSocketListeners();
        resolve();
      });

      this.socket.on("connect_error", (err) => {
        clearTimeout(timeout);
        reject(new Error(`Socket connection failed: ${err.message}`));
      });
    });
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on("sonic:ready", () => {
      this.setState("listening");
    });

    this.socket.on("sonic:audio", (data: { audio: string }) => {
      // Feed audio to playback worklet
      this.playbackNode?.port.postMessage({ type: "audio", audio: data.audio });
      if (this.state !== "speaking") {
        this.setState("speaking");
      }
    });

    this.socket.on("sonic:transcript", (data: { text: string; role: "user" | "assistant" }) => {
      this.config.onTranscript(data.text, data.role);
      if (data.role === "user" && this.state === "speaking") {
        // Barge-in: user spoke while AI was playing
        this.clearPlayback();
        this.setState("listening");
      }
    });

    this.socket.on("sonic:tool-use", (data: { toolName: string; status: string }) => {
      this.config.onToolUse(data.toolName, data.status);
      if (data.status === "start" || data.status === "executing") {
        this.setState("thinking");
      }
    });

    this.socket.on("sonic:end", () => {
      // Session ended — don't auto-disconnect, user may want to continue
    });

    this.socket.on("sonic:error", (data: {
      message?: string;
      code?: string;
      requestId?: string;
      lastEvent?: { kind?: string } | null;
    }) => {
      const message = data?.message ?? "Unknown Sonic server error";
      const details = [
        data?.code ? `code=${data.code}` : "",
        data?.requestId ? `requestId=${data.requestId}` : "",
        data?.lastEvent?.kind ? `lastEvent=${data.lastEvent.kind}` : "",
      ]
        .filter(Boolean)
        .join(" ");
      const combined = details ? `${message} (${details})` : message;
      console.error("[SonicClient] Server error:", combined, data);
      this.config.onError?.(combined);
    });

    this.socket.on("disconnect", () => {
      this.cleanup();
      this.setState("idle");
    });
  }

  private async setupAudio(): Promise<void> {
    // Request mic access
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000,
      },
    });

    // Create AudioContext at 24kHz for playback (matches Sonic output)
    this.audioContext = new AudioContext({ sampleRate: 24000 });

    // Load capture worklet
    await this.audioContext.audioWorklet.addModule("/audio-capture-worklet.js");
    this.captureNode = new AudioWorkletNode(this.audioContext, "audio-capture-processor");

    // Capture worklet messages (audio chunks + amplitude)
    this.captureNode.port.onmessage = (event) => {
      if (event.data.type === "audio" && this.socket?.connected) {
        this.socket.emit("sonic:audio", { audio: event.data.audio });
      }
      if (event.data.amplitude !== undefined) {
        this.config.onAmplitude(event.data.amplitude);
      }
    };

    // Connect mic → capture worklet
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    source.connect(this.captureNode);
    // Don't connect captureNode to destination (we don't want to hear our own voice)

    // Load playback worklet
    await this.audioContext.audioWorklet.addModule("/audio-playback-worklet.js");
    this.playbackNode = new AudioWorkletNode(this.audioContext, "audio-playback-processor");

    // Playback worklet messages (amplitude for visualizer)
    this.playbackNode.port.onmessage = (event) => {
      if (event.data.type === "amplitude") {
        this.config.onAmplitude(event.data.amplitude);
      }
      if (event.data.type === "state" && !event.data.isPlaying && this.state === "speaking") {
        // Playback buffer empty — switch back to listening
        this.setState("listening");
      }
    };

    // Connect playback worklet → speakers
    this.playbackNode.connect(this.audioContext.destination);
  }

  private cleanup(): void {
    // Stop mic
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;

    // Disconnect audio nodes
    try {
      this.captureNode?.disconnect();
      this.playbackNode?.disconnect();
    } catch {
      // ignore
    }
    this.captureNode = null;
    this.playbackNode = null;

    // Close AudioContext
    if (this.audioContext?.state !== "closed") {
      this.audioContext?.close().catch(() => {});
    }
    this.audioContext = null;

    // Disconnect socket
    this.socket?.disconnect();
    this.socket = null;
  }
}
