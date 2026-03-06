"use client";

import { useEffect, useRef, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ExpandableCardProps {
  id: string;
  isExpanded: boolean;
  onToggle: () => void;
  preview: ReactNode;
  detail: ReactNode;
  accentColor?: string;
}

function useOutsideClick(
  ref: React.RefObject<HTMLDivElement | null>,
  callback: () => void,
) {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ref, callback]);
}

export function ExpandableCard({
  id,
  isExpanded,
  onToggle,
  preview,
  detail,
  accentColor,
}: ExpandableCardProps) {
  const expandedRef = useRef<HTMLDivElement | null>(null);

  const handleClose = useCallback(() => {
    if (isExpanded) onToggle();
  }, [isExpanded, onToggle]);

  useOutsideClick(expandedRef, handleClose);

  // Escape key closes
  useEffect(() => {
    if (!isExpanded) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isExpanded, handleClose]);

  // Body scroll lock when expanded
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isExpanded]);

  return (
    <>
      {/* Collapsed card */}
      <motion.div layoutId={`card-${id}`} onClick={onToggle} className="cursor-pointer">
        {preview}
      </motion.div>

      {/* Expanded overlay */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />

            {/* Expanded card */}
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-0 md:items-center md:p-6">
              <motion.div
                ref={expandedRef}
                layoutId={`card-${id}`}
                className="relative min-h-screen w-full bg-white md:min-h-0 md:max-w-2xl md:rounded-2xl md:shadow-2xl"
                style={{
                  borderTop: accentColor
                    ? `4px solid ${accentColor}`
                    : undefined,
                }}
              >
                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

                <div className="p-4 md:p-6">{detail}</div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
