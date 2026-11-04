import React, { useState } from "react";
import { sfx } from "../utils/sfx";

export default function SkillsInteractiveFilter({ skillGroups }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [hoveredTag, setHoveredTag] = useState(null);

  const categories = [
    { id: "all", label: "ALL" },
    { id: "Languages", label: "LANGUAGES" },
    { id: "Mobile & Frontend", label: "MOBILE & WEB" },
    { id: "Backend & Distributed Systems", label: "BACKEND" },
    { id: "Cloud, DevOps & Systems", label: "CLOUD & DEVOPS" },
    { id: "Databases & Storage", label: "DATABASES" },
    { id: "AI, Speech & NLP", label: "AI & NLP" },
  ];

  const filteredGroups = activeCategory === "all"
    ? skillGroups
    : skillGroups.filter((g) => g.title.toLowerCase().includes(activeCategory.toLowerCase()));

  const handleCategorySelect = (e, id) => {
    sfx.playPop();
    setActiveCategory(id);
    try {
      e.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    } catch (_) { }
  };

  return (
    <div className="skills-interactive-container">
      {/* Category Filter Pills */}
      <div className="skills-filter-bar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`filter-pill ${activeCategory === cat.id ? "active" : ""}`}
            onClick={(e) => handleCategorySelect(e, cat.id)}
            data-cursor="click"
            data-cursor-text="FILTER"
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Filtered Grid of Skills */}
      <div className="skills-grid">
        {filteredGroups.map((g) => {
          const Icon = g.icon;
          const itemsList = g.items.split(", ");
          return (
            <article
              className={`skill-card ${g.color} awwwards-skill-card`}
              key={g.title}
              onMouseEnter={() => sfx.playPop()}
            >
              <div className="skill-top">
                <div className="skill-icon-bubble">
                  <Icon size={22} color="var(--ink)" />
                </div>
              </div>

              <h3>{g.title}</h3>

              {/* Interactive Skill Chips */}
              <div className="skill-chips-wrap">
                {itemsList.map((item) => (
                  <span
                    key={item}
                    className={`skill-chip ${hoveredTag === item ? "highlight" : ""}`}
                    onMouseEnter={() => setHoveredTag(item)}
                    onMouseLeave={() => setHoveredTag(null)}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

