/**
 * AudioWorklet processor for speaker playback.
 * Ring buffer that receives base64 24kHz 16-bit LPCM chunks from the main
 * thread, decodes them, and outputs at 24kHz. Handles underruns gracefully
 * by outputting silence.
 */

class AudioPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Ring buffer: 5 seconds of 24kHz mono audio
    this._bufferSize = 24000 * 5;
    this._buffer = new Float32Array(this._bufferSize);
    this._writePos = 0;
    this._readPos = 0;
    this._samplesAvailable = 0;

    this.port.onmessage = (event) => {
      if (event.data.type === "audio") {
        this._enqueueAudio(event.data.audio);
      } else if (event.data.type === "clear") {
        this._clear();
      }
    };
  }

  /**
   * Decode base64 LPCM (16-bit signed, 24kHz) and write to ring buffer.
   */
  _enqueueAudio(base64) {
    // Decode base64 to bytes
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Convert Int16 PCM to Float32
    const int16 = new Int16Array(bytes.buffer);
    const samplesCount = int16.length;

    if (this._samplesAvailable + samplesCount > this._bufferSize) {
      // Buffer overflow — drop oldest samples
      const overflow = (this._samplesAvailable + samplesCount) - this._bufferSize;
      this._readPos = (this._readPos + overflow) % this._bufferSize;
      this._samplesAvailable -= overflow;
    }

    for (let i = 0; i < samplesCount; i++) {
      // Int16 to Float32 [-1, 1]
      this._buffer[this._writePos] = int16[i] / 32768;
      this._writePos = (this._writePos + 1) % this._bufferSize;
    }
    this._samplesAvailable += samplesCount;

    // Report amplitude for visualizer
    if (samplesCount > 0) {
      let sum = 0;
      for (let i = 0; i < int16.length; i++) {
        const s = int16[i] / 32768;
        sum += s * s;
      }
      const amplitude = Math.sqrt(sum / int16.length);
      this.port.postMessage({ type: "amplitude", amplitude });
    }
  }

  _clear() {
    this._writePos = 0;
    this._readPos = 0;
    this._samplesAvailable = 0;
    this._buffer.fill(0);
  }

  process(_inputs, outputs) {
    const output = outputs[0];
    if (!output || !output[0]) return true;

    const channel = output[0];

    // Note: output sampleRate may differ from 24kHz.
    // For simplicity, we output at whatever rate the AudioContext uses.
    // In practice, the AudioContext should be created at 24kHz to match.
    for (let i = 0; i < channel.length; i++) {
      if (this._samplesAvailable > 0) {
        channel[i] = this._buffer[this._readPos];
        this._readPos = (this._readPos + 1) % this._bufferSize;
        this._samplesAvailable--;
      } else {
        // Underrun — output silence
        channel[i] = 0;
      }
    }

    // Report playback state
    this.port.postMessage({
      type: "state",
      buffered: this._samplesAvailable,
      isPlaying: this._samplesAvailable > 0,
    });

    return true;
  }
}

registerProcessor("audio-playback-processor", AudioPlaybackProcessor);
