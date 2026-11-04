import React, { useEffect, useState, useRef } from "react";

export default function CustomCursor() {
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [trailerPos, setTrailerPos] = useState({ x: -100, y: -100 });
  const [cursorType, setCursorType] = useState("default");
  const [cursorText, setCursorText] = useState("");
  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const posRef = useRef({ x: -100, y: -100 });
  const trailerRef = useRef({ x: -100, y: -100 });
  const rafId = useRef(null);

  useEffect(() => {
    // Only enable on desktop devices with fine pointer
    if (window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const handleMouseMove = (e) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      setCursorPos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      // Check element under cursor for special cursor modes
      const target = e.target.closest("[data-cursor], a, button, .project-card, .skill-card, .award, input, [role='button']");

      if (target) {
        setIsPointer(true);
        const customCursor = target.getAttribute("data-cursor");
        const customText = target.getAttribute("data-cursor-text");

        if (customCursor) {
          setCursorType(customCursor);
          if (customText && customText.trim().toUpperCase() !== "HOVER") {
            setCursorText(customText);
          } else {
            setCursorText("");
          }
        } else if (target.classList.contains("project-card") || target.closest(".project-card")) {
          setCursorType("project");
          setCursorText("VIEW");
        } else if (target.tagName === "A" && target.getAttribute("target") === "_blank") {
          setCursorType("external");
          setCursorText("VISIT ↗");
        } else {
          setCursorType("hover");
          setCursorText("");
        }

        // Magnetic effect if element has data-magnetic
        const magneticEl = target.closest("[data-magnetic]");
        if (magneticEl) {
          const rect = magneticEl.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const deltaX = (e.clientX - centerX) * 0.28;
          const deltaY = (e.clientY - centerY) * 0.28;
          magneticEl.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        }
      } else {
        setIsPointer(false);
        setCursorType("default");
        setCursorText("");

        // Reset any existing magnetic elements
        document.querySelectorAll("[data-magnetic]").forEach((el) => {
          el.style.transform = "";
        });
      }
    };

    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);

    const handleMouseLeave = () => {
      setIsVisible(false);
      document.querySelectorAll("[data-magnetic]").forEach((el) => {
        el.style.transform = "";
      });
    };

    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    // Smooth physics loop for the trailing fluid ring
    const render = () => {
      trailerRef.current.x += (posRef.current.x - trailerRef.current.x) * 0.18;
      trailerRef.current.y += (posRef.current.y - trailerRef.current.y) * 0.18;
      setTrailerPos({ x: trailerRef.current.x, y: trailerRef.current.y });
      rafId.current = requestAnimationFrame(render);
    };
    rafId.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="awwwards-cursor-container" aria-hidden="true">
      {/* Precision inner center dot */}
      <div
        className={`awwwards-cursor-dot ${isPressed ? "pressed" : ""} ${isPointer ? "pointer" : ""}`}
        style={{
          transform: `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)`,
        }}
      />

      {/* Fluid trailing ring with dynamic states & badge labels */}
      <div
        className={`awwwards-cursor-trailer mode-${cursorType} ${isPointer ? "pointer" : ""} ${isPressed ? "pressed" : ""}`}
        style={{
          transform: `translate3d(${trailerPos.x}px, ${trailerPos.y}px, 0)`,
        }}
      >
        {cursorText && <span className="cursor-badge-text">{cursorText}</span>}
      </div>
    </div>
  );
}

