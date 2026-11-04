import React, { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { sfx } from "../utils/sfx";

export function fireAwwwardsConfetti(originX = 0.5, originY = 0.5) {
  sfx.playChime();
  const count = 90;
  const defaults = {
    origin: { x: originX, y: originY },
    colors: ["#e4ff62", "#ff705f", "#d9c4fa", "#211b2d", "#ffffff"],
    shapes: ["square", "circle"],
    scalar: 1.15,
  };

  confetti({
    ...defaults,
    particleCount: Math.floor(count * 0.6),
    spread: 60,
    startVelocity: 45,
  });
  confetti({
    ...defaults,
    particleCount: Math.floor(count * 0.4),
    spread: 100,
    startVelocity: 35,
    decay: 0.92,
  });
}

// Live Indian Standard Time Ticker (used cleanly across desktop and mobile layouts)
export function LiveTimeTicker() {
  const [istTime, setIstTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const options = {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      const formatter = new Intl.DateTimeFormat("en-US", options);
      setIstTime(formatter.format(new Date()));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hero-live-time-ticker">
      <span className="live-time-label">GHAZIABAD, IN</span>
      <span className="live-time-sep">/</span>
      <span className="live-time-val">{istTime || "LIVE"}</span>
    </div>
  );
}

export default function InteractiveHeroCanvas() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, radius: 140 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let isVisible = true;

    // Responsive sizing
    const handleResize = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
      initParticles(rect.width, rect.height);
    };

    // Particle nodes: neo-brutalist glyphs (+, ✳, ·, ▫)
    let particles = [];
    const glyphs = ["+", "✳", "·", "▫", "×"];

    const initParticles = (width, height) => {
      particles = [];
      const particleCount = Math.floor((width * height) / 22000); // Optimized mobile density
      for (let i = 0; i < Math.max(particleCount, 16); i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        particles.push({
          x,
          y,
          originX: x,
          originY: y,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
          size: Math.random() * 6 + 10,
          color: Math.random() > 0.4 ? "rgba(33, 27, 45, 0.18)" : "rgba(33, 27, 45, 0.35)",
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.02,
        });
      }
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    window.addEventListener("resize", handleResize);
    canvas.parentElement.addEventListener("mousemove", handleMouseMove, { passive: true });
    canvas.parentElement.addEventListener("mouseleave", handleMouseLeave);

    handleResize();

    // Intersection observer to pause off-screen rendering
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);

    // Animation loop
    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const mouse = mouseRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Natural drifting
        p.originX += p.vx;
        p.originY += p.vy;
        p.rotation += p.rotSpeed;

        if (p.originX < 0 || p.originX > rect.width) p.vx *= -1;
        if (p.originY < 0 || p.originY > rect.height) p.vy *= -1;

        // Physics reaction to mouse proximity
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          p.x -= Math.cos(angle) * force * 10;
          p.y -= Math.sin(angle) * force * 10;
        } else {
          // Elastic spring back to home position
          p.x += (p.originX - p.x) * 0.05;
          p.y += (p.originY - p.y) * 0.05;
        }

        // Draw particle glyph
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.font = `600 ${p.size}px "DM Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.glyph, 0, 0);
        ctx.restore();

        // Connect nearby points with delicate dashed lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist2 = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist2 < 95) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(33, 27, 45, ${0.08 * (1 - dist2 / 95)})`;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 4]);
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (canvas.parentElement) {
        canvas.parentElement.removeEventListener("mousemove", handleMouseMove);
        canvas.parentElement.removeEventListener("mouseleave", handleMouseLeave);
      }
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="hero-interactive-canvas-wrap" ref={containerRef} aria-hidden="true">
      <canvas ref={canvasRef} className="hero-interactive-canvas" />
    </div>
  );
}
