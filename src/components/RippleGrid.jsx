import { useEffect, useRef, useState } from "react";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function RippleGrid({
  enableRainbow = false,
  gridColor = "#ffffff",
  rippleIntensity = 0.05,
  gridSize = 10,
  gridThickness = 1,
  mouseInteraction = true,
  mouseInteractionRadius = 1.2,
  opacity = 0.8,
}) {
  const rootRef = useRef(null);
  const [pointer, setPointer] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (!mouseInteraction) return undefined;

    const onPointerMove = (event) => {
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      setPointer({
        x: clamp(x, 0, 100),
        y: clamp(y, 0, 100),
      });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [mouseInteraction]);

  const safeGridSize = Math.max(gridSize, 2);
  const safeThickness = Math.max(gridThickness, 1);
  const safeOpacity = clamp(opacity, 0, 1);
  const safeRipple = clamp(rippleIntensity, 0, 1);
  const safeRadius = clamp(mouseInteractionRadius, 0.2, 6);

  const baseGrid = {
    backgroundImage: `
      linear-gradient(to right, ${gridColor} ${safeThickness}px, transparent ${safeThickness}px),
      linear-gradient(to bottom, ${gridColor} ${safeThickness}px, transparent ${safeThickness}px)
    `,
    backgroundSize: `${safeGridSize * 10}px ${safeGridSize * 10}px`,
    opacity: safeOpacity,
  };

  const rippleOverlay = mouseInteraction
    ? {
        background: `radial-gradient(circle at ${pointer.x}% ${pointer.y}%, rgba(255,255,255,${safeRipple}) 0%, rgba(255,255,255,0) ${safeRadius * 20}%)`,
      }
    : null;

  const rainbowOverlay = enableRainbow
    ? {
        background:
          "linear-gradient(120deg, rgba(255,107,107,0.16), rgba(59,91,219,0.16), rgba(32,201,151,0.16))",
        mixBlendMode: "screen",
      }
    : null;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, ...baseGrid }} />
      {rippleOverlay ? <div style={{ position: "absolute", inset: 0, ...rippleOverlay }} /> : null}
      {rainbowOverlay ? <div style={{ position: "absolute", inset: 0, ...rainbowOverlay }} /> : null}
    </div>
  );
}
