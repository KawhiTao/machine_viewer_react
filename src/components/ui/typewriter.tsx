import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface TypewriterProps {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  showCursor?: boolean;
  cursorChar?: string;
  onComplete?: () => void;
}

export function Typewriter({
  text,
  delay = 0,
  speed = 50,
  className = "",
  showCursor = true,
  cursorChar = "|",
  onComplete,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showCursorBlink, setShowCursorBlink] = useState(true);

  useEffect(() => {
    if (currentIndex < text.length) {
      setIsTyping(true);
      const timer = setTimeout(
        () => {
          setDisplayText((prev) => prev + text[currentIndex]);
          setCurrentIndex((prev) => prev + 1);
        },
        currentIndex === 0 ? delay : speed,
      );

      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
      if (onComplete) {
        onComplete();
      }
    }
  }, [currentIndex, text, delay, speed, onComplete]);

  useEffect(() => {
    if (!isTyping && showCursor) {
      const cursorTimer = setInterval(() => {
        setShowCursorBlink((prev) => !prev);
      }, 530);

      return () => clearInterval(cursorTimer);
    } else {
      setShowCursorBlink(true);
    }
  }, [isTyping, showCursor]);

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {displayText}
      <AnimatePresence>
        {showCursor && (
          <motion.span
            className="inline-block"
            animate={{
              opacity: showCursorBlink ? 1 : 0,
            }}
            transition={{
              duration: 0.1,
              ease: "linear",
            }}
          >
            {cursorChar}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.span>
  );
}

export default Typewriter;
