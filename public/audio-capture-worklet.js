/**
 * AudioWorklet processor for mic capture.
 * Receives Float32 audio from the browser mic (native 44.1/48kHz),
 * resamples to 16kHz, converts to 16-bit PCM, and base64-encodes
 * chunks for transmission via Socket.IO.
 */

class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Float32Array(0);
    // Accumulate ~256ms of 16kHz audio before sending (4096 samples)
    this._chunkSize = 4096;
    this._targetRate = 16000;
  }

  /**
   * Simple linear interpolation resampler.
   * Good enough for speech — no need for sinc interpolation.
   */
  _resample(input, fromRate, toRate) {
    if (fromRate === toRate) return input;
    const ratio = fromRate / toRate;
    const outputLength = Math.floor(input.length / ratio);
    const output = new Float32Array(outputLength);
    for (let i = 0; i < outputLength; i++) {
      const srcIndex = i * ratio;
      const srcFloor = Math.floor(srcIndex);
      const srcCeil = Math.min(srcFloor + 1, input.length - 1);
      const frac = srcIndex - srcFloor;
      output[i] = input[srcFloor] * (1 - frac) + input[srcCeil] * frac;
    }
    return output;
  }

  /**
   * Convert Float32 [-1, 1] to Int16 PCM, then to base64 string.
   */
  _float32ToBase64PCM(float32) {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    // Convert Int16Array buffer to base64
    const bytes = new Uint8Array(int16.buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Calculate RMS amplitude for visualizer feedback.
   */
  _rms(samples) {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) return true;

    const channelData = input[0]; // mono channel

    // Resample from native rate to 16kHz
    const resampled = this._resample(channelData, sampleRate, this._targetRate);

    // Append to buffer
    const newBuffer = new Float32Array(this._buffer.length + resampled.length);
    newBuffer.set(this._buffer);
    newBuffer.set(resampled, this._buffer.length);
    this._buffer = newBuffer;

    // Send chunks when we have enough
    while (this._buffer.length >= this._chunkSize) {
      const chunk = this._buffer.slice(0, this._chunkSize);
      this._buffer = this._buffer.slice(this._chunkSize);

      const base64 = this._float32ToBase64PCM(chunk);
      const amplitude = this._rms(chunk);

      this.port.postMessage({ type: "audio", audio: base64, amplitude });
    }

    return true;
  }
}

registerProcessor("audio-capture-processor", AudioCaptureProcessor);
