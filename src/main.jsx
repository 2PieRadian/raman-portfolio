import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownRight,
  ArrowUpRight,
  Asterisk,
  Github,
  Linkedin,
  Mail,
  Phone,
  ExternalLink,
  Menu,
  X,
  Code2,
  Terminal,
  Layers3,
  Cloud,
  Database,
  Cpu,
  GraduationCap,
  Disc,
  Command,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";

import MusicPlayer from "./components/MusicPlayer";
import CustomCursor from "./components/CustomCursor";
import SmoothScroll, { scrollToSection } from "./components/SmoothScroll";
import InteractiveHeroCanvas, { fireAwwwardsConfetti, LiveTimeTicker } from "./components/InteractiveHeroCanvas";
import Project3DCard from "./components/Project3DCard";
import MarqueeRibbon from "./components/MarqueeRibbon";
import SkillsInteractiveFilter from "./components/SkillsInteractiveFilter";
import InteractiveCommandPalette from "./components/InteractiveCommandPalette";
import ToastNotification from "./components/ToastNotification";
import { sfx } from "./utils/sfx";

import "./styles.css";

const links = {
  email: "mailto:ramanbhardwaj2005@gmail.com",
  phone: "tel:+919318387705",
  linkedin: "https://www.linkedin.com/in/raman-bhardwaj-india",
  github: "https://github.com/2PieRadian",
  wash: "https://washandwow.in",
  play: "https://play.google.com/store/apps/details?id=com.washandwow.app&hl=en_IN",
  ornify: "https://ornify.in",
  mind: "https://mindcurepath.com",
  bank: "https://github.com/2PieRadian/Voice-Authentication",
  chess: "https://github.com/2PieRadian/chess-engine",
};

const projects = [
  {
    number: "01",
    name: "Wash and Wow",
    type: "ON-DEMAND LAUNDRY · MOBILE & WEB",
    color: "lime",
    headline: "Care that moves at your speed.",
    description:
      "An on-demand garment-care platform with a multi-stage order state machine, live status tracking, fabric and weight-based pricing, 8km Haversine geofencing for branch routing, and a promotional wallet engine.",
    stack: ["React Native", "Expo", "TypeScript", "PostgreSQL"],
    blueprints: [
      "Order State Machine: Draft → Picked → In-Wash → Quality Check → Out for Delivery",
      "8km Haversine Geofencing branch dispatch & geofence routing algorithm",
      "Promotional wallet engine with atomic balance updates & concurrency locks",
    ],
    date: "APRIL 2026 — MAY 2026",
    links: [
      { label: "Website", href: links.wash },
      { label: "Google Play", href: links.play },
    ],
  },
  {
    number: "02",
    name: "Ornify",
    type: "LUXURY E-COMMERCE · CUSTOM GIFT BUILDER",
    color: "coral",
    headline: "A little more personal.",
    description:
      "An e-commerce experience with a custom Gift Box Builder, dynamic piece bounds and greeting cards, strict multi-attribute variant validation, WhatsApp abandoned-cart recovery, and a complete return and exchange lifecycle.",
    stack: ["TypeScript", "Node.js", "Express", "Supabase"],
    blueprints: [
      "Custom Gift Box Builder with dynamic piece bounding constraints & live SVG layout",
      "Strict multi-attribute variant validation engine with combinatorial integrity",
      "Automated WhatsApp abandoned-cart recovery with signed checkout URLs",
    ],
    date: "SEP 2026 — OCT 2026",
    links: [{ label: "Visit Ornify", href: links.ornify }],
  },
  {
    number: "03",
    name: "BankVoice AI",
    type: "VOICE AUTHENTICATION · BANKING ANALYTICS",
    color: "lilac",
    headline: "Every voice tells a story.",
    description:
      "An on-premise audio intelligence platform turning customer voice streams into banking telemetry. Includes Whisper transcription, DistilBERT sentiment scoring, a six-domain complaint taxonomy, fraud escalation, and acoustic speaker verification.",
    stack: ["Python", "Whisper", "DistilBERT", "SciPy"],
    blueprints: [
      "On-premise Whisper STT audio transcription with zero third-party latency",
      "Acoustic speaker verification analyzing spectral MFCC voice characteristics via SciPy",
      "Six-domain complaint taxonomy classifier with automated fraud severity escalation",
    ],
    date: "NOV 2026",
    links: [{ label: "GitHub repository", href: links.bank }],
  },
  {
    number: "04",
    name: "MindCurePath",
    type: "MENTAL HEALTHCARE · TELE-COUNSELLING",
    color: "ink",
    headline: "Technology with a human side.",
    description:
      "A mental-health platform with therapist scheduling and double-booking prevention, PHQ-9 and GAD-7 intake scoring, encrypted clinical journaling, and post-consultation feedback.",
    stack: ["React.js", "Node.js", "PostgreSQL", "TailwindCSS"],
    blueprints: [
      "Concurrency-safe slot reservation engine eliminating therapist double-booking",
      "Standardized psychiatric assessment scoring algorithms for PHQ-9 and GAD-7",
      "Encrypted digital health journaling system with clinical audit trails",
    ],
    date: "DEC 2025 — MARCH 2026",
    links: [{ label: "Visit platform", href: links.mind }],
  },
  {
    number: "05",
    name: "Distributed Java Chess Engine",
    type: "CORE OOP ENGINE · MOVE GENERATOR · WEBSOCKET API",
    color: "lime",
    headline: "A game of states and systems.",
    description:
      "An immutable board-representation engine built from first principles, with legal move generation and board-state validation. Exposes REST and WebSocket APIs for real-time multiplayer matchmaking and board-evaluation streaming.",
    stack: ["Java", "OOP", "REST APIs", "WebSocket"],
    blueprints: [
      "Immutable bitboard state model with zero-allocation legal move generation",
      "WebSocket streaming server for live board evaluation broadcasting",
      "Strict OOP architecture with exhaustive checkmate, stalemate, and draw validation",
    ],
    date: "IN PROGRESS",
    links: [{ label: "GitHub repository", href: links.chess }],
  },
];

const experience = [
  {
    company: "Wash and Wow",
    role: "Freelance Full-Stack Developer",
    date: "APRIL 2026 — MAY 2026",
    href: links.wash,
    detail: "Production mobile app and distributed service architecture.",
    points: [
      <>
        Engineered and deployed a production{" "}
        <b>Android app using Expo (React Native)</b>, live on{" "}
        <a href={links.play} target="_blank" rel="noreferrer">
          Google Play Store
        </a>
        ; integrated Razorpay checkout, Google OAuth, Expo SecureStore, and location-based branch dispatch.
      </>,
      <>
        Architected a decoupled <b>Node.js microservices backend</b> with six services and an API Gateway, asynchronous RabbitMQ messaging, JWT validation, rate limiting, and centralized Swagger documentation.
      </>,
      <>
        Built a multi-branch operations dashboard in <b>Next.js</b> with TanStack Table and Recharts, PDF invoices, dynamic catalog management, and RBAC.
      </>,
      <>
        Deployed with Docker Compose on Oracle Cloud, Nginx SSL/TLS, GitHub Actions CI/CD, and PostgreSQL via Prisma.
      </>,
    ],
  },
  {
    company: "Ornify",
    role: "Backend Developer",
    date: "SEP 2026 — OCT 2026",
    href: links.ornify,
    detail: "Scalable commerce backend and automated fulfillment.",
    points: [
      <>
        Architected a TypeScript and Express.js backend on Supabase PostgreSQL, with relational schemas, indexing, and{" "}
        <b>Row-Level Security</b> for multi-tenant isolation.
      </>,
      <>
        Built Shiprocket fulfillment pipelines: multi-tier packaging allocation, courier quotations, AWB generation, and webhook tracking synchronization.
      </>,
      <>
        Integrated Razorpay with HMAC SHA256 webhook verification and instant refund recovery for database insertion failures.
      </>,
      <>
        Built transactional email and SMS notification pipelines using AWS SES and SNS, with rate limiting and anti-replay cooldowns.
      </>,
    ],
  },
  {
    company: "MindCurePath Consultancy Pvt. Ltd.",
    role: "Freelance Full-Stack Software Developer",
    date: "DEC 2025 — MARCH 2026",
    href: links.mind,
    detail: "A live tele-counselling product serving real users.",
    points: [
      <>
        Architected a platform serving <b>168+ active users</b> and <b>5.8K+ user events</b>, with Socket.io and WebRTC signaling for live client-therapist consultations.
      </>,
      <>
        Engineered appointment lifecycle workflows and an emergency booking system (≤ 30 mins) with instant counselor dispatch.
      </>,
      <>
        Built asynchronous notifications with AWS SQS, SES, SNS, Dead-Letter Queues, cron reminders, and transactional alerts.
      </>,
      <>
        Implemented JWT and Google OAuth 2.0, Redis session management, Razorpay payments, and HMAC webhook verification.
      </>,
      <>
        Deployed with Docker Compose, Oracle Cloud, Nginx, GitHub Actions CI/CD, and optimized PostgreSQL queries.
      </>,
    ],
  },
];

const skillGroups = [
  {
    icon: Code2,
    title: "Languages",
    color: "lime",
    items: "JavaScript (ES6+), TypeScript, SQL, Java, Python, C++",
  },
  {
    icon: Layers3,
    title: "Mobile & Frontend",
    color: "coral",
    items: "React Native, Expo Router, React.js, Next.js, Zustand, TanStack Query, TailwindCSS, HTML5/CSS3",
  },
  {
    icon: Terminal,
    title: "Backend & Distributed Systems",
    color: "lilac",
    items: "Node.js, Express.js, Microservices Architecture, RabbitMQ (AMQP), WebSockets (Socket.io), WebRTC",
  },
  {
    icon: Cloud,
    title: "Cloud, DevOps & Systems",
    color: "ink",
    items: "Oracle Cloud (OCI VM), Docker, Docker Compose, Nginx, AWS SES/SQS/SNS/S3, GitHub Actions CI/CD",
  },
  {
    icon: Database,
    title: "Databases & Storage",
    color: "lime",
    items: "PostgreSQL, Supabase (RLS), Redis, MongoDB, Prisma ORM, Amazon S3 Presigned URLs",
  },
  {
    icon: Cpu,
    title: "AI, Speech & NLP",
    color: "coral",
    items: "OpenAI Whisper (STT), Hugging Face Transformers (DistilBERT), Acoustic Signal Processing (SciPy), Streamlit, Plotly",
  },
  {
    icon: Code2,
    title: "Integrations & Logistics",
    color: "lilac",
    items: "Razorpay, Shiprocket API, Meta WhatsApp Cloud API, RESTful APIs",
  },
  {
    icon: Cloud,
    title: "Hosting, Domains & Networking",
    color: "ink",
    items: "Vercel, DNS Management, Domain-to-IP mapping, Reverse Proxies",
  },
];

const awards = [
  {
    title: "Smart India Hackathon (SIH) — Top 45",
    detail: "Shortlisted out of 348 teams · Internal Round",
    href: "https://drive.google.com/file/d/1aU1eIwNgv1felkl1Dxz7rH6V-hhDpYBw/view",
  },
  {
    title: "Exploratory Data Analysis — NASSCOM & MeitY",
    detail: "FutureSkills Prime · Gold Category (95%)",
    href: "https://drive.google.com/file/d/1Ds2TovnRdCeqQfnttiXCiPdTb8jmvKaB/view?usp=sharing",
  },
  {
    title: "AWS Academy Graduate — Cloud Architecting",
    detail: "AWS Academy",
    href: "https://www.credly.com/badges/2a428992-393e-46d7-b78b-c7d815c2e197/public_url",
  },
  {
    title: "Java — Advanced Concepts for High-Performance Development",
    detail: "LinkedIn Learning Certification",
    href: "https://www.linkedin.com/learning/certificates/a328bafa1f70ae8b0f339cf6f5c1a5125b8e38f49e96aa6aaaebd9372552091c",
  },
];

function SectionLabel({ children, light = false }) {
  return (
    <div className={`eyebrow ${light ? "light" : ""}`}>
      <Asterisk
        size={14}
        className="spin-hover"
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          fireAwwwardsConfetti(
            (rect.left + rect.width / 2) / window.innerWidth,
            (rect.top + rect.height / 2) / window.innerHeight
          );
        }}
        data-cursor="click"
        data-cursor-text="BURST ✳"
      />{" "}
      {children}
    </div>
  );
}

function ActuallyBox() {
  const boxRef = useRef(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const heroSection = box.closest(".hero");
    if (!heroSection) return;

    let rafId = null;

    const handleMouseMove = (e) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (window.matchMedia("(hover: none) or (pointer: coarse)").matches) return;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = box.getBoundingClientRect();
        const boxCenterX = rect.left + rect.width / 2;
        const boxCenterY = rect.top + rect.height / 2;
        const heroRect = heroSection.getBoundingClientRect();

        const halfW = heroRect.width / 2 || window.innerWidth / 2;
        const halfH = heroRect.height / 2 || window.innerHeight / 2;

        const relX = Math.max(-1.15, Math.min(1.15, (e.clientX - boxCenterX) / halfW));
        const relY = Math.max(-1.15, Math.min(1.15, (e.clientY - boxCenterY) / halfH));

        const maxRotX = 20;
        const maxRotY = 22;

        const rotX = -relY * maxRotX;
        const rotY = relX * maxRotY;

        const transX = relX * 6;
        const transY = relY * 5;

        const shadowX = 5 - relX * 4;
        const shadowY = 6 - relY * 4;

        box.style.transform = `perspective(700px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotate(-1deg) translate3d(${transX.toFixed(1)}px, ${transY.toFixed(1)}px, 12px)`;
        box.style.boxShadow = `${shadowX.toFixed(1)}px ${shadowY.toFixed(1)}px 0 var(--ink)`;
      });
    };

    const handleMouseLeave = () => {
      if (rafId) cancelAnimationFrame(rafId);
      box.style.transform = `perspective(700px) rotateX(0deg) rotateY(0deg) rotate(-1deg) translate3d(0px, 0px, 0px)`;
      box.style.boxShadow = `5px 6px 0 var(--ink)`;
    };

    heroSection.addEventListener("mousemove", handleMouseMove, { passive: true });
    heroSection.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      heroSection.removeEventListener("mousemove", handleMouseMove);
      heroSection.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <span
      ref={boxRef}
      className="highlight-word kinetic-word actually-perspective-box"
      onClick={() => sfx.playPop()}
      data-cursor="click"
    >
      <span className="actually-text-depth">actually</span>
    </span>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const nav = [
    ["Work", "#work"],
    ["Experience", "#experience"],
    ["Toolkit", "#toolkit"],
    ["About", "#about"],
    ["Say hello", "#contact"],
  ];

  return (
    <header className="topbar">
      <a
        className="wordmark"
        href="#home"
        data-magnetic
        onClick={() => sfx.playPop()}
      >
        <span className="mark">✳</span> raman<span className="wordmark-light">bhardwaj.</span>
      </a>

      <nav className={open ? "nav open" : "nav"}>
        {nav.map(([name, href]) => (
          <a
            key={name}
            href={href}
            onClick={() => {
              setOpen(false);
              sfx.playPop();
            }}
            data-magnetic
          >
            {name}
          </a>
        ))}
      </nav>

      <a
        className="nav-cta"
        href={links.email}
        data-magnetic
        onClick={() => sfx.playPop()}
      >
        Let’s talk <ArrowUpRight size={15} />
      </a>

      <button
        className="menu-toggle"
        aria-label="Toggle navigation"
        onClick={() => {
          sfx.playSnap();
          setOpen(!open);
        }}
      >
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}

function App() {
  const [isDeckOpen, setIsDeckOpen] = useState(false);
  const [musicState, setMusicState] = useState(null);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSfxOn, setIsSfxOn] = useState(true);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 2800);
  };

  const handleToggleSfx = () => {
    const next = sfx.toggleSound();
    setIsSfxOn(next);
    showToast(next ? "🔔 Sound FX enabled" : "🔕 Sound FX muted");
  };

  useEffect(() => {
    const nodes = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  const handleStampClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    fireAwwwardsConfetti(
      (rect.left + rect.width / 2) / window.innerWidth,
      (rect.top + rect.height / 2) / window.innerHeight
    );
    showToast("✳ Building code with a point of view!");
  };

  const handleCopyEmail = (e) => {
    e.preventDefault();
    navigator.clipboard?.writeText("ramanbhardwaj2005@gmail.com");
    sfx.playChime();
    showToast("✓ Copied ramanbhardwaj2005@gmail.com to clipboard!");
  };

  const handleCopyPhone = (e) => {
    e.preventDefault();
    navigator.clipboard?.writeText("+919318387705");
    sfx.playChime();
    showToast("✓ Copied +91 9318387705 to clipboard!");
  };

  return (
    <div id="home" className="awwwards-site-wrapper">
      {/* Smooth Momentum Scroll with Lenis */}
      <SmoothScroll />

      {/* Interactive Custom Cursor */}
      <CustomCursor />

      {/* Floating Interactive Toast System */}
      <ToastNotification message={toastMessage} />

      {/* Interactive Command Palette */}
      <InteractiveCommandPalette
        isOpen={isCmdOpen}
        setIsOpen={setIsCmdOpen}
        onShowToast={showToast}
        musicState={musicState}
        onOpenDeck={() => setIsDeckOpen(true)}
      />

      <Header />

      <main>
        {/* HERO SECTION */}
        <section className="hero">
          {/* Interactive geometric spring canvas */}
          <InteractiveHeroCanvas />

          <div className="hero-inner">
            <div className="hero-kicker">
              <SectionLabel>A DEVELOPER WHO LIKES THE DETAILS</SectionLabel>
              <div className="hero-kicker-badges">
                <LiveTimeTicker />
                <span className="availability">
                  OPEN TO OPPORTUNITIES
                </span>
              </div>
            </div>

            {/* Kinetic Typography */}
            <h1 className="hero-title-kinetic">
              <span className="kinetic-line">
                <span className="kinetic-word">Building</span>{" "}
                <span className="kinetic-word">things</span>
              </span>
              <br />
              <span className="kinetic-line">
                <span className="kinetic-word">that</span>{" "}
                <ActuallyBox />
              </span>
              <br />
              <span className="kinetic-line">
                <span className="outlined-word kinetic-word">work.</span>
                {/* <span
                  className="hero-star"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    fireAwwwardsConfetti(
                      (rect.left + rect.width / 2) / window.innerWidth,
                      (rect.top + rect.height / 2) / window.innerHeight
                    );
                    showToast("✳ Starburst unlocked!");
                  }}
                  title="Click for celebration burst!"
                  data-cursor="click"
                  data-cursor-text="BURST ✳"
                >
                  ✳
                </span> */}
              </span>
            </h1>

            <div className="hero-foot">
              <p>
                Full-stack developer. Systems thinker.
                <br />A little obsessed with making software useful.
              </p>

              <div className="hero-cta-group">
                <a
                  className="round-cta"
                  href="#work"
                  data-magnetic
                  onClick={() => sfx.playPop()}
                  data-cursor-text="WORK ↓"
                >
                  Explore my work <ArrowDownRight size={19} />
                </a>

                <div
                  className="hero-stamp interactive-stamp"
                  onClick={handleStampClick}
                  data-magnetic
                  data-cursor="click"
                  data-cursor-text="BURST ✳"
                  title="Click for celebration blast!"
                >
                  <div className="stamp-inner">
                    CODE WITH
                    <br />A POINT OF VIEW{" "}
                    <Asterisk size={20} className="stamp-star" />
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-index">
              <span className="hero-index-location">INDIA · GHAZIABAD</span>
              <span
                className="scroll-explore-prompt"
                onClick={() => scrollToSection("#work")}
                data-cursor="click"
              >
                SCROLL TO EXPLORE ↓
              </span>
              <span>01 — 05</span>
            </div>
          </div>

          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
        </section>

        {/* KINETIC MARQUEE RIBBONS */}
        <MarqueeRibbon />

        {/* ABOUT SECTION */}
        <section className="intro section-pad reveal" id="about">
          <div className="intro-heading">
            <SectionLabel>THE SHORT VERSION</SectionLabel>
            <h2>
              Serious about
              <br />
              the <em>build.</em> Curious
              <br />
              about the <span>why.</span>
            </h2>
          </div>

          <div className="intro-copy">
            <p className="lead">
              I’m Raman Bhardwaj — a Computer Science and Engineering student
              focused on building full-stack products, backend systems, and
              practical software.
            </p>
            <p>
              From production mobile apps to event-driven services, I enjoy
              taking a product from a rough idea to something people can use. I
              care about clean architecture, dependable systems, and the small
              details that make an experience feel right.
            </p>

            <div className="intro-links">
              <a
                href={links.linkedin}
                target="_blank"
                rel="noreferrer"
                data-magnetic
                onClick={() => sfx.playPop()}
                data-cursor="external"
              >
                <Linkedin size={16} /> LinkedIn <ArrowUpRight size={14} />
              </a>
              <a
                href={links.github}
                target="_blank"
                rel="noreferrer"
                data-magnetic
                onClick={() => sfx.playPop()}
                data-cursor="external"
              >
                <Github size={16} /> GitHub <ArrowUpRight size={14} />
              </a>
              <button
                type="button"
                className="soundtrack-trigger"
                onClick={() => {
                  sfx.playSnap();
                  setIsDeckOpen(true);
                  if (!musicState?.isPlaying) musicState?.togglePlay();
                }}
                title="Click to play soundtrack"
                data-magnetic
                data-cursor="click"
                data-cursor-text="DECK ♫"
              >
                <Disc size={15} className="spin-slow" /> Listening to:{" "}
                {musicState?.currentTrack?.title || "Love, Maybe"}{" "}
                <Asterisk size={12} />
              </button>
            </div>
          </div>
        </section>

        {/* SELECTED PROJECTS SECTION */}
        <section className="work-section section-pad" id="work">
          <div className="section-heading reveal">
            <div>
              <SectionLabel>THINGS OUT IN THE WORLD</SectionLabel>
              <h2>
                Proof of work.
                <br />
                <span>Not just pixels.</span>
              </h2>
            </div>
            <p>
              Selected projects, real systems,
              <br />
              and a few rabbit holes.
            </p>
          </div>

          {/* High-End 3D Tilt Project Cards */}
          <div className="project-grid">
            {projects.map((p, i) => (
              <Project3DCard key={p.number} project={p} index={i} />
            ))}
          </div>
        </section>

        {/* MANIFESTO SECTION */}
        <section className="manifesto">
          <div className="manifesto-inner reveal">
            <SectionLabel light>A FEW THINGS I BUILD BY</SectionLabel>
            <h2>
              Make it <span>useful.</span>
              <br />
              Make it <span>reliable.</span>
              <br />
              Make it <u>matter.</u>
            </h2>
            <p>
              Good software should solve a real problem.
              <br />
              Great software should keep solving it.
            </p>
            <div
              className="manifesto-spark spin-hover"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                fireAwwwardsConfetti(
                  (rect.left + rect.width / 2) / window.innerWidth,
                  (rect.top + rect.height / 2) / window.innerHeight
                );
                showToast("✳ Make it matter!");
              }}
              data-cursor="click"
              data-cursor-text="BURST ✳"
            >
              ✳
            </div>
          </div>
        </section>

        {/* EXPERIENCE TIMELINE SECTION */}
        <section className="experience-section section-pad" id="experience">
          <div className="section-heading reveal">
            <div>
              <SectionLabel>WHERE IDEAS MET REAL USERS</SectionLabel>
              <h2>
                Work in the
                <br />
                <span>real world.</span>
              </h2>
            </div>
            <p>
              Freelance builds, production
              <br />
              deployments, and ownership.
            </p>
          </div>

          <div className="timeline">
            {experience.map((job, i) => (
              <article
                className="job reveal awwwards-job-card"
                key={job.company}
                onMouseEnter={() => sfx.playPop()}
              >
                <div className="job-index">0{i + 1}</div>
                <div className="job-main">
                  <div className="job-head">
                    <div>
                      <h3>
                        <a
                          href={job.href}
                          target="_blank"
                          rel="noreferrer"
                          data-magnetic
                          data-cursor="external"
                        >
                          {job.company} <ArrowUpRight size={16} />
                        </a>
                      </h3>
                      <p>{job.role}</p>
                    </div>
                    <span className="job-date-pill">{job.date}</span>
                  </div>
                  <p className="job-detail">{job.detail}</p>
                  <ul>
                    {job.points.map((pt, n) => (
                      <li key={n}>{pt}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* TOOLKIT SECTION WITH INTERACTIVE FILTER */}
        <section className="toolkit-section section-pad" id="toolkit">
          <div className="section-heading reveal">
            <div>
              <SectionLabel>TOOLS OF THE TRADE</SectionLabel>
              <h2>
                A broad toolkit.
                <br />
                <span>A systems mindset.</span>
              </h2>
            </div>
            <p>
              Technologies I’ve used to
              <br />
              ship and support products.
            </p>
          </div>

          <SkillsInteractiveFilter skillGroups={skillGroups} />
        </section>

        {/* CREDENTIALS & EDUCATION */}
        <section className="credentials section-pad">
          <div className="credentials-col reveal">
            <SectionLabel>GOOD TO KNOW</SectionLabel>
            <h2>
              Milestones
              <br />& <span>learning.</span>
            </h2>
            <div className="award-list">
              {awards.map((a, i) => (
                <a
                  className="award awwwards-award-row"
                  key={a.title}
                  href={a.href}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="external"
                  data-cursor-text="VIEW ↗"
                  onMouseEnter={() => sfx.playPop()}
                >
                  <span className="award-num">0{i + 1}</span>
                  <span>
                    <b>{a.title}</b>
                    <small>{a.detail}</small>
                  </span>
                  <ArrowUpRight size={20} className="award-arrow" />
                </a>
              ))}
            </div>
          </div>

          <div className="education-card reveal" onMouseEnter={() => sfx.playPop()}>
            <div className="edu-icon">
              <GraduationCap size={27} />
            </div>
            <SectionLabel>EDUCATION</SectionLabel>
            <h3>
              ABES Engineering
              <br />
              College
            </h3>
            <p>Bachelor of Technology</p>
            <b>Computer Science and Engineering (AI & ML)</b>
            <div className="edu-meta">
              <span>GHAZIABAD, UTTAR PRADESH, IN</span>
              <span>OCT 2023 — OCT 2027</span>
            </div>
            <div className="coursework">
              <small>COURSES</small>
              <p>
                Operating Systems · Data Structures · Design & Analysis of Algorithms · Artificial Intelligence · Machine Learning · Networking · Databases
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer" id="contact">
          <div className="footer-top">
            <SectionLabel light>HAVE A GOOD ONE IN MIND?</SectionLabel>
            <div
              className="footer-star spin-hover"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                fireAwwwardsConfetti(
                  (rect.left + rect.width / 2) / window.innerWidth,
                  (rect.top + rect.height / 2) / window.innerHeight
                );
                showToast("✳ Let's make something matter!");
              }}
              data-cursor="click"
              data-cursor-text="BURST ✳"
            >
              ✳
            </div>
            <h2>
              Let’s make
              <br />
              <em>something</em>
              <br />
              matter.
            </h2>
            <a
              className="footer-button"
              href={links.email}
              data-magnetic
              onClick={() => sfx.playPop()}
            >
              Say hello <ArrowUpRight size={20} />
            </a>
          </div>

          <div className="footer-bottom">
            <a
              className="wordmark footer-logo"
              href="#home"
              data-magnetic
              onClick={() => sfx.playPop()}
            >
              <span className="mark">✳</span> raman
              <span className="wordmark-light">bhardwaj.</span>
            </a>

            <div className="contact-links">
              <a
                href={links.email}
                onClick={handleCopyEmail}
                data-magnetic
                data-cursor="copy"
                data-cursor-text="COPY"
                title="Click to copy email address"
              >
                <Mail size={19} /> ramanbhardwaj2005@gmail.com
              </a>
              <a
                href={links.phone}
                onClick={handleCopyPhone}
                data-magnetic
                data-cursor="copy"
                data-cursor-text="COPY"
                title="Click to copy phone number"
              >
                <Phone size={19} /> +91 9318387705
              </a>
              <a
                href={links.linkedin}
                target="_blank"
                rel="noreferrer"
                data-magnetic
                onClick={() => sfx.playPop()}
                data-cursor="external"
              >
                <Linkedin size={19} /> LinkedIn
              </a>
              <a
                href={links.github}
                target="_blank"
                rel="noreferrer"
                data-magnetic
                onClick={() => sfx.playPop()}
                data-cursor="external"
              >
                <Github size={19} /> GitHub
              </a>
            </div>

            <span className="copyright">© RAMAN BHARDWAJ</span>
          </div>
        </footer>
      </main>

      <MusicPlayer
        isDeckOpen={isDeckOpen}
        setIsDeckOpen={setIsDeckOpen}
        onPlayingStateChange={setMusicState}
      />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
