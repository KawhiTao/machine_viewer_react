import { useState, useEffect } from "react";

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
    <span
      className={className}
      style={{ minHeight: "1em", display: "inline-block" }}
    >
      {displayText}
      {showCursor && (
        <span
          className="inline-block transition-opacity duration-100 ease-linear ml-[1px]"
          style={{
            opacity: showCursorBlink ? 1 : 0,
            fontSize: "inherit",
            lineHeight: "inherit",
            fontWeight: "inherit",
          }}
        >
          {cursorChar}
        </span>
      )}
    </span>
  );
}

export default Typewriter;
