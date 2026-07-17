"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const STEP = 0.35; // seconds per keyframe leg; the tween runs two of them
const STAGGER_MS = 100;

/**
 * Reveals a heading one word at a time: each word rises out of a blur, briefly
 * overshoots, then settles. Words animate on their own timer, staggered by
 * index, so the line resolves left-to-right.
 *
 * Words are laid out by the parent flex container rather than by spaces —
 * tight tracking swallows a normal space, so the gap is a margin instead.
 */
export function BlurText({
  text,
  className = "",
  wordClassName = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  /**
   * Applied to each word. Anything using `background-clip: text` (e.g.
   * `.text-gradient-gold`) must go here, not on `className` — each word
   * animates `filter`, which creates its own stacking context, so a clipped
   * background on the parent never reaches the words and they render
   * transparent.
   */
  wordClassName?: string;
  /** Seconds to wait before the first word starts. */
  delay?: number;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [shown, setShown] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const words = text.split(" ");

  return (
    <p
      ref={ref}
      className={className}
      style={{ display: "flex", flexWrap: "wrap", rowGap: "0.1em" }}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className={wordClassName}
          style={{ display: "inline-block", marginRight: "0.28em", willChange: "transform, filter" }}
          initial={
            reduced
              ? { opacity: 0 }
              : { filter: "blur(10px)", opacity: 0, y: 50 }
          }
          animate={
            shown
              ? reduced
                ? { opacity: 1 }
                : {
                    filter: ["blur(10px)", "blur(5px)", "blur(0px)"],
                    opacity: [0, 0.5, 1],
                    y: [50, -5, 0],
                  }
              : undefined
          }
          transition={
            reduced
              ? { duration: 0.2, delay }
              : {
                  duration: STEP * 2,
                  times: [0, 0.5, 1],
                  ease: "easeOut",
                  delay: delay + (i * STAGGER_MS) / 1000,
                }
          }
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
}
