import React, { useEffect, useState } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { ArrowUp } from "lucide-react";
import { sfx } from "../utils/sfx";

let globalLenis = null;

export function getLenis() {
  return globalLenis;
}

export function scrollToSection(selector, options = {}) {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 480;
  const isTablet = typeof window !== "undefined" && window.innerWidth <= 900;
  const defaultOffset = selector === "#work" ? (isMobile ? 125 : isTablet ? 150 : 165) : 0;
  const offset = options.offset !== undefined ? options.offset : defaultOffset;

  if (globalLenis) {
    globalLenis.start();
    const duration = options.duration !== undefined ? options.duration : 1.2;
    globalLenis.scrollTo(selector, { offset, duration, force: true });
  } else {
    const el = document.querySelector(selector);
    if (el) {
      if (offset !== 0) {
        const y = el.getBoundingClientRect().top + window.scrollY - 90 + offset;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      } else {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }
}

export default function SmoothScroll() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    // Respect user's reduced-motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential ease out
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.0,
      syncTouch: true,
    });

    globalLenis = lenis;

    const handleScroll = (e) => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? (e.scroll / scrollHeight) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, Math.round(progress))));
      setShowBackToTop(e.scroll > 600);
    };

    lenis.on("scroll", handleScroll);

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const rafId = requestAnimationFrame(raf);

    // Intercept in-page hash links for smooth Lenis scrolling
    const handleAnchorClick = (e) => {
      const anchor = e.target.closest("a[href^='#']");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (href && href !== "#") {
        e.preventDefault();
        sfx.playPop();
        const w = window.innerWidth;
        const isMobile = w <= 480;
        const isTablet = w <= 900;
        let customOffset = 0;
        if (anchor.dataset.offset !== undefined) {
          customOffset = parseInt(anchor.dataset.offset, 10);
        } else if (href === "#work") {
          customOffset = isMobile ? 125 : isTablet ? 150 : 165;
        }
        if (isMobile && anchor.dataset.offsetMobile !== undefined) {
          customOffset = parseInt(anchor.dataset.offsetMobile, 10);
        }
        lenis.scrollTo(href, { offset: customOffset, duration: 1.2 });
      }
    };

    document.addEventListener("click", handleAnchorClick);

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      cancelAnimationFrame(rafId);
      lenis.destroy();
      globalLenis = null;
    };
  }, []);

  const handleBackToTop = () => {
    sfx.playSnap();
    if (globalLenis) {
      globalLenis.scrollTo(0, { duration: 1.4 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Neo-Brutalist Global Scroll Progress Indicator at top of screen */}
      <div className="awwwards-progress-track" aria-hidden="true">
        <div
          className="awwwards-progress-bar"
          style={{ transform: `scaleX(${scrollProgress / 100})` }}
        />
      </div>

      {/* Floating Readout Pill in bottom corner */}
      <div
        className={`awwwards-scroll-badge ${showBackToTop ? "visible" : ""}`}
        onClick={handleBackToTop}
        role="button"
        tabIndex={0}
        title="Click to scroll to top"
        data-cursor="click"
        data-cursor-text="TOP ↑"
      >
        <span className="scroll-percent">{scrollProgress}%</span>
        <span className="scroll-icon">
          <ArrowUp size={13} />
        </span>
      </div>
    </>
  );
}

