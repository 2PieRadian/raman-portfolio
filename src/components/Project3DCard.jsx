import React, { useState, useRef } from "react";
import { ArrowUpRight, Asterisk, ChevronDown, ChevronUp, Cpu, Layers, ShieldCheck, Zap } from "lucide-react";
import { fireAwwwardsConfetti } from "./InteractiveHeroCanvas";
import { sfx } from "../utils/sfx";

export default function Project3DCard({ project, index }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, opacity: 0 });
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -5.5; // Max 5.5deg
    const rotateY = ((x - centerX) / centerX) * 5.5;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({
      rotateX,
      rotateY,
      glareX,
      glareY,
      opacity: 0.18,
    });
  };

  const handleMouseLeave = () => {
    setTilt({
      rotateX: 0,
      rotateY: 0,
      glareX: 50,
      glareY: 50,
      opacity: 0,
    });
  };

  const handleStarClick = (e) => {
    e.stopPropagation();
    sfx.playChime();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    fireAwwwardsConfetti(x, y);
  };

  const toggleDetails = (e) => {
    e.stopPropagation();
    sfx.playSnap();
    setIsDetailsOpen(!isDetailsOpen);
  };

  return (
    <article
      ref={cardRef}
      className={`project-card ${project.color} p${index} awwwards-tilt-card ${isDetailsOpen ? "details-open" : ""}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
      }}
      data-cursor="project"
      data-cursor-text="EXPLORE"
    >
      {/* Specular glare shine overlay */}
      <div
        className="card-specular-glare"
        style={{
          background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255, ${tilt.opacity}), transparent 60%)`,
        }}
        aria-hidden="true"
      />

      {/* Top Bar with Number & Category */}
      <div className="project-top">
        <span
          className="project-num-badge"
          onClick={handleStarClick}
          title="Click for celebration burst!"
          data-cursor="click"
          data-cursor-text="BURST ✳"
        >
          {project.number} / SELECTED BUILD <Asterisk size={12} className="spin-hover" />
        </span>
        <span className="project-type">{project.type}</span>
      </div>

      {/* Main Typography */}
      <h3>
        {project.name}
        <span className="period">.</span>
      </h3>
      <h4>{project.headline}</h4>
      <p>{project.description}</p>

      {/* Interactive Blueprint Drawer Toggle */}
      {project.blueprints && (
        <div className="project-blueprint-section">
          <button
            type="button"
            className={`blueprint-toggle-btn ${isDetailsOpen ? "active" : ""}`}
            onClick={toggleDetails}
            aria-expanded={isDetailsOpen}
            data-cursor="click"
            data-cursor-text={isDetailsOpen ? "CLOSE" : "SYSTEM"}
          >
            <Cpu size={14} />
            <span>{isDetailsOpen ? "Hide System Blueprint" : "Inspect System Blueprint"}</span>
            {isDetailsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {isDetailsOpen && (
            <div className="blueprint-drawer">
              <div className="blueprint-header">
                <span className="blueprint-tag">CORE ARCHITECTURAL HIGHLIGHTS</span>
              </div>
              <ul className="blueprint-list">
                {project.blueprints.map((item, bIdx) => (
                  <li key={bIdx}>
                    <Zap size={13} className="bp-icon" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Stack Badges with micro bounce */}
      <div className="tags">
        {project.stack.map((t) => (
          <span
            key={t}
            className="stack-tag"
            onMouseEnter={() => sfx.playPop()}
            data-cursor="hover"
          >
            {t}
          </span>
        ))}
      </div>

      {/* Bottom Footer: Date & Live Links */}
      <div className="project-bottom">
        <span className="date">{project.date}</span>
        <div className="project-links">
          {project.links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              onClick={() => sfx.playPop()}
              data-cursor="external"
              data-cursor-text="VISIT ↗"
            >
              {l.label} <ArrowUpRight size={14} />
            </a>
          ))}
        </div>
      </div>
    </article>
  );
}

