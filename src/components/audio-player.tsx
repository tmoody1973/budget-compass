"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface AudioPlayerProps {
  script: string;
  topic: string;
  keyFacts?: Array<{ fact: string; value: string }>;
}

export function AudioPlayer({ script, topic, keyFacts }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => {
      setIsPlaying(false);
      setProgress(100);
    };
    utterance.onboundary = (e) => {
      setProgress((e.charIndex / script.length) * 100);
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }, [script, isPlaying]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="my-3 rounded-lg border-2 border-mke-dark bg-white p-5 shadow-[4px_4px_0px_0px_#1A1A2E]">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-lg">{"\ud83c\udfa7"}</span>
        <h3 className="font-bold text-mke-blue">{topic}</h3>
      </div>

      {/* Play/Pause Button */}
      <div className="mb-4 flex justify-center">
        <button
          onClick={handlePlay}
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-mke-dark bg-mke-blue text-white shadow-[3px_3px_0px_0px_#1A1A2E] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_#1A1A2E]"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-8 w-8"
            >
              <path
                fillRule="evenodd"
                d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="ml-1 h-8 w-8"
            >
              <path
                fillRule="evenodd"
                d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 h-3 overflow-hidden rounded-full border border-mke-dark bg-mke-cream">
        <div
          className="h-full rounded-full bg-mke-gold transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Key Facts */}
      {keyFacts && keyFacts.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {keyFacts.map((kf, i) => (
            <div
              key={i}
              className="rounded border border-mke-dark bg-mke-cream px-3 py-1.5"
            >
              <span className="text-xs text-gray-500">{kf.fact}</span>
              <span className="ml-2 font-bold text-mke-blue">{kf.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Transcript Toggle */}
      <button
        onClick={() => setShowTranscript(!showTranscript)}
        className="text-sm font-bold text-mke-blue underline hover:no-underline"
      >
        {showTranscript ? "Hide transcript" : "Show transcript"}
      </button>
      {showTranscript && (
        <div className="mt-2 rounded border border-mke-dark bg-mke-cream p-3 text-sm leading-relaxed text-mke-dark">
          {script}
        </div>
      )}
    </div>
  );
}
