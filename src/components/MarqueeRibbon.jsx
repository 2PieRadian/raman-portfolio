import React from "react";
import { Asterisk, Sparkles } from "lucide-react";

export default function MarqueeRibbon() {
  const itemsTop = [
    "DISTRIBUTED MICROSERVICES",
    "EVENT-DRIVEN ARCHITECTURE",
    "REACT NATIVE & EXPO",
    "POSTGRESQL & SUPABASE",
    "FULL-STACK SYSTEM DESIGN",
    "CLEAN OOP & CONCURRENCY",
    "DOCKER & CI/CD PIPELINES",
    "SPEECH & AI INTEGRATIONS",
  ];

  const itemsBottom = [
    "HIGH-PERFORMANCE BACKENDS",
    "ZERO COMPROMISE RELIABILITY",
    "WEBSOCKET & REALTIME APIS",
    "PRODUCTION-FIRST MINDSET",
    "FAST & INTENTIONAL SOFTWARE",
    "SECURE BY DESIGN",
    "MODERN INTERFACES",
  ];

  return (
    <div className="awwwards-marquee-container" aria-hidden="true">
      {/* Top Ribbon (Lime background, Ink text, angles slightly) */}
      <div className="marquee-ribbon ribbon-lime">
        <div className="marquee-track track-left">
          {[...itemsTop, ...itemsTop, ...itemsTop].map((item, idx) => (
            <span key={idx} className="marquee-item">
              <Asterisk size={16} className="marquee-star" />
              <span>{item}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Ribbon (Ink background, Paper & Lilac text, moves reverse) */}
      <div className="marquee-ribbon ribbon-ink">
        <div className="marquee-track track-right">
          {[...itemsBottom, ...itemsBottom, ...itemsBottom].map((item, idx) => (
            <span key={idx} className="marquee-item">
              <span className="marquee-glyph">✦</span>
              <span>{item}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

