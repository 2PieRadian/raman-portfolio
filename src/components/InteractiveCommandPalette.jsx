import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Command,
  ArrowRight,
  Sparkles,
  Mail,
  Phone,
  Music,
  ExternalLink,
  Briefcase,
  Layers,
  Volume2,
  VolumeX,
  X,
  Terminal,
} from "lucide-react";
import { scrollToSection } from "./SmoothScroll";
import { fireAwwwardsConfetti } from "./InteractiveHeroCanvas";
import { sfx } from "../utils/sfx";

export default function InteractiveCommandPalette({
  isOpen,
  setIsOpen,
  onShowToast,
  musicState,
  onOpenDeck,
}) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const inputRef = useRef(null);

  const commands = [
    {
      id: "wash-and-wow",
      category: "PROJECTS",
      title: "Wash and Wow — On-Demand Laundry",
      subtitle: "Jump to React Native & Microservices build",
      action: () => {
        scrollToSection("#work");
      },
    },
    {
      id: "ornify",
      category: "PROJECTS",
      title: "Ornify — Luxury Gift E-Commerce",
      subtitle: "Jump to Supabase & Variant Builder",
      action: () => {
        scrollToSection("#work");
      },
    },
    {
      id: "bankvoice",
      category: "PROJECTS",
      title: "BankVoice AI — Speech Intelligence",
      subtitle: "Jump to Whisper & NLP platform",
      action: () => {
        scrollToSection("#work");
      },
    },
    {
      id: "mindcure",
      category: "PROJECTS",
      title: "MindCurePath — Tele-Counselling",
      subtitle: "Jump to WebRTC & Healthcare platform",
      action: () => {
        scrollToSection("#work");
      },
    },
    {
      id: "chess",
      category: "PROJECTS",
      title: "Distributed Java Chess Engine",
      subtitle: "Jump to OOP & WebSocket engine",
      action: () => {
        scrollToSection("#work");
      },
    },
    {
      id: "nav-experience",
      category: "NAVIGATION",
      title: "Work Experience & Deployments",
      subtitle: "Jump to production milestones",
      action: () => {
        scrollToSection("#experience");
      },
    },
    {
      id: "nav-toolkit",
      category: "NAVIGATION",
      title: "Technical Toolkit & Languages",
      subtitle: "Jump to skills and architectures",
      action: () => {
        scrollToSection("#toolkit");
      },
    },
    {
      id: "nav-about",
      category: "NAVIGATION",
      title: "About Raman Bhardwaj",
      subtitle: "Jump to background & engineering philosophy",
      action: () => {
        scrollToSection("#about");
      },
    },
    {
      id: "copy-email",
      category: "CONTACT",
      title: "Copy Email Address",
      subtitle: "ramanbhardwaj2005@gmail.com",
      action: () => {
        navigator.clipboard?.writeText("ramanbhardwaj2005@gmail.com");
        onShowToast("✓ Email copied to clipboard!");
        sfx.playChime();
      },
    },
    {
      id: "copy-phone",
      category: "CONTACT",
      title: "Copy Phone Number",
      subtitle: "+91 9318387705",
      action: () => {
        navigator.clipboard?.writeText("+919318387705");
        onShowToast("✓ Phone number copied to clipboard!");
        sfx.playChime();
      },
    },
    {
      id: "music-toggle",
      category: "STUDIO",
      title: musicState?.isPlaying ? "Pause Portfolio Soundtrack" : "Play Portfolio Soundtrack",
      subtitle: musicState?.isPlaying ? "Pause MeloMance / Tracy Chapman" : "Start studio vinyl deck",
      action: () => {
        if (!musicState?.isPlaying) {
          musicState?.togglePlay();
          onShowToast("🎵 Playing soundtrack");
        } else {
          musicState?.togglePlay();
          onShowToast("⏸ Soundtrack paused");
        }
      },
    },
    {
      id: "open-deck",
      category: "STUDIO",
      title: "Open Studio Music Deck",
      subtitle: "Explore playlist & add songs (MP3, WAV, FLAC, etc.)",
      action: () => {
        onOpenDeck?.();
        if (!musicState?.isPlaying) musicState?.togglePlay();
      },
    },
    {
      id: "open-fullscreen-deck",
      category: "STUDIO",
      title: "Open Fullscreen Music Studio",
      subtitle: "Direct-drive 33⅓ RPM turntable & expanded playlist console",
      action: () => {
        musicState?.openFullScreen?.();
        if (!musicState?.isPlaying) musicState?.togglePlay();
      },
    },
    {
      id: "toggle-sfx",
      category: "STUDIO",
      title: sfxEnabled ? "Mute Sound FX" : "Enable Sound FX",
      subtitle: "Toggle tactile synthesized audio clicks",
      action: () => {
        const next = sfx.toggleSound();
        setSfxEnabled(next);
        onShowToast(next ? "🔔 Sound FX Enabled" : "🔕 Sound FX Muted");
      },
    },
    {
      id: "fire-confetti",
      category: "DELIGHT",
      title: "Launch Confetti Blast",
      subtitle: "Shoot neo-brutalist celebratory burst",
      action: () => {
        fireAwwwardsConfetti(0.5, 0.4);
        onShowToast("🎉 Celebration burst!");
      },
    },
  ];

  const filtered = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        sfx.playSnap();
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDownInMenu = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
      sfx.playPop();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      sfx.playPop();
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      executeCommand(filtered[selectedIndex]);
    }
  };

  const executeCommand = (cmd) => {
    sfx.playSnap();
    cmd.action();
    setIsOpen(false);
    setSearch("");
  };

  if (!isOpen) return null;

  return (
    <div className="awwwards-cmd-backdrop" onClick={() => setIsOpen(false)}>
      <div
        className="awwwards-cmd-palette"
        data-lenis-prevent="true"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command Menu"
      >
        {/* Header Search Bar */}
        <div className="cmd-header">
          <Terminal size={18} className="cmd-header-icon" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Type a command or search (e.g. Wash, Email, Music, Confetti)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownInMenu}
          />
          <button
            type="button"
            className="cmd-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close Command Palette"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className="cmd-results">
          {filtered.length === 0 ? (
            <div className="cmd-empty">No matching commands found.</div>
          ) : (
            filtered.map((item, index) => (
              <div
                key={item.id}
                className={`cmd-item ${index === selectedIndex ? "selected" : ""}`}
                onClick={() => executeCommand(item)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="cmd-item-info">
                  <div className="cmd-item-title-row">
                    <span className="cmd-item-cat">{item.category}</span>
                    <strong className="cmd-item-title">{item.title}</strong>
                  </div>
                  <span className="cmd-item-sub">{item.subtitle}</span>
                </div>
                <ArrowRight size={14} className="cmd-item-arrow" />
              </div>
            ))
          )}
        </div>

        {/* Palette Footer Shortcuts */}
        <div className="cmd-footer">
          <div className="cmd-key-hints">
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Select</span>
            <span><kbd>Esc</kbd> Close</span>
          </div>
          <span className="cmd-brand">RAMAN.COMMAND // 01</span>
        </div>
      </div>
    </div>
  );
}

