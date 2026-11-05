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
import SmoothScroll, { scrollToSection, getLenis } from "./components/SmoothScroll";
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
    headline: "Doorstep laundry and home cleaning with live order tracking.",
    description:
      "A mobile and web booking platform where customers can schedule doorstep laundry and cleaning services, choose convenient morning or evening time slots, and track their order through every step from pickup to wash and return.",
    howWeDidIt:
      "I built an automated system that matches customer addresses with the closest local branch, coordinates rider pickup and delivery trips, and sends live status notifications directly to the customer's phone.",
    stack: ["React Native", "Expo", "TypeScript", "Node.js", "PostgreSQL"],
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
    headline: "Custom gift box builder and personalized luxury shopping.",
    description:
      "An e-commerce store featuring a custom gift box builder where shoppers can pick a designer box, hand-select matching jewelry and lifestyle gifts, add a personalized printed greeting card, and preview the gift before checkout.",
    howWeDidIt:
      "I built an interactive box builder that calculates remaining box space and pricing in real time, integrated instant pincode delivery checks, and connected live courier tracking from checkout to doorstep delivery.",
    stack: ["React.js", "TypeScript", "Node.js", "Express", "Supabase"],
    date: "SEP 2026 — OCT 2026",
    links: [{ label: "Visit Ornify", href: links.ornify }],
  },
  {
    number: "03",
    name: "BankVoice AI",
    type: "VOICE INTELLIGENCE · BANKING ANALYTICS",
    color: "lilac",
    headline: "Real-time speech intelligence and customer support assistant.",
    description:
      "A voice intelligence tool for banking call centers that listens to customer calls, converts spoken conversation into text in real time, and identifies caller mood and urgency.",
    howWeDidIt:
      "I created an audio processing system that categorizes caller issues, verifies caller voices for security, and immediately flags distressed callers or suspected fraud to help support teams respond quickly.",
    stack: ["Python", "Speech-to-Text", "NLP", "FastAPI"],
    date: "NOV 2026",
    links: [{ label: "GitHub repository", href: links.bank }],
  },
  {
    number: "04",
    name: "MindCurePath",
    type: "MENTAL HEALTHCARE · TELE-COUNSELLING",
    color: "ink",
    headline: "Tele-therapy platform with live video sessions and smart scheduling.",
    description:
      "A mental wellness platform across mobile and web where users can discover licensed therapists by specialty, book 1-on-1 private video therapy sessions, and complete confidential self-assessment health quizzes.",
    howWeDidIt:
      "I built a calendar booking engine that prevents double-booking, integrated secure video calling for private sessions, and developed an administrative dashboard to verify therapist credentials and manage schedules.",
    stack: ["React Native", "React.js", "Node.js", "TypeScript", "PostgreSQL"],
    date: "DEC 2025 — MARCH 2026",
    links: [{ label: "Visit platform", href: links.mind }],
  },
  {
    number: "05",
    name: "Distributed Java Chess Engine",
    type: "CHESS ENGINE · MULTIPLAYER SERVER",
    color: "lime",
    headline: "Real-time multiplayer chess engine built from scratch in Java.",
    description:
      "A fast online chess platform where two players can join a game room and play live chess with instant move validation, timers, and checkmate detection.",
    howWeDidIt:
      "I programmed all chess rules and move calculations from scratch in Java, connecting players through real-time communication so every move and game state updates across screens with zero delay.",
    stack: ["Java", "OOP", "WebSockets", "REST APIs"],
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

  // Prevent background scroll when mobile menu is open & listen for Escape key
  useEffect(() => {
    if (open) {
      // 1. Cease Lenis smooth momentum scrolling
      getLenis()?.stop();

      // 2. Lock both HTML and Body overflow and touch scrolling
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.classList.add("mobile-menu-open");
      document.documentElement.classList.add("mobile-menu-open");

      // 3. Escape key listener
      const handleKeyDown = (e) => {
        if (e.key === "Escape") setOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);

      // 4. Lock background touchmove events while allowing internal drawer scrolling
      const preventTouchMove = (e) => {
        if (!e.target.closest("#primary-navigation")) {
          e.preventDefault();
        }
      };
      document.addEventListener("touchmove", preventTouchMove, { passive: false });

      return () => {
        getLenis()?.start();
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.classList.remove("mobile-menu-open");
        document.documentElement.classList.remove("mobile-menu-open");
        window.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("touchmove", preventTouchMove);
      };
    }
  }, [open]);

  // Close mobile drawer on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && open) {
        setOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [open]);

  const handleLinkClick = (e, href) => {
    sfx.playPop();

    // 1. Instantly unlock scroll styles before initiating scroll
    document.body.classList.remove("mobile-menu-open");
    document.documentElement.classList.remove("mobile-menu-open");
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    getLenis()?.start();

    // 2. Close mobile menu
    setOpen(false);

    // 3. Scroll to target section
    if (href && href.startsWith("#")) {
      e.preventDefault();
      setTimeout(() => {
        scrollToSection(href, { force: true });
        const el = document.querySelector(href);
        if (el && !getLenis()) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 50);
    }
  };

  return (
    <>
      <header className="topbar">
        <a
          className="wordmark"
          href="#home"
          data-magnetic
          onClick={(e) => handleLinkClick(e, "#home")}
        >
          <span className="mark">✳</span> raman<span className="wordmark-light">bhardwaj.</span>
        </a>

        <nav
          className={`nav ${open ? "open" : ""}`}
          id="primary-navigation"
          aria-label="Primary navigation"
          data-lenis-prevent="true"
        >
          <div className="nav-links-wrap">
            {nav.map(([name, href]) => (
              <a
                key={name}
                href={href}
                className="nav-link-item"
                onClick={(e) => handleLinkClick(e, href)}
                data-magnetic
              >
                <span className="nav-link-text">{name}</span>
                <span className="mobile-nav-arrow" aria-hidden="true">
                  <ArrowUpRight size={16} />
                </span>
              </a>
            ))}
          </div>

          {/* Editorial mobile drawer footer */}
          <div className="mobile-nav-footer">
            <div className="mobile-nav-contact-card">
              <span className="mobile-nav-tag">DIRECT INQUIRY</span>
              <a
                href={links.email}
                className="mobile-nav-email"
                onClick={() => sfx.playPop()}
              >
                <span>ramanbhardwaj2005@gmail.com</span>
                <ArrowUpRight size={15} />
              </a>
            </div>

            <div className="mobile-nav-bottom-row">
              <span className="mobile-nav-meta">DELHI, INDIA • UTC+5:30</span>
              <div className="mobile-nav-socials">
                <a
                  href={links.github}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub"
                  onClick={() => sfx.playPop()}
                >
                  <Github size={15} />
                </a>
                <a
                  href={links.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  onClick={() => sfx.playPop()}
                >
                  <Linkedin size={15} />
                </a>
                <a
                  href={links.email}
                  aria-label="Email"
                  onClick={() => sfx.playPop()}
                >
                  <Mail size={15} />
                </a>
              </div>
            </div>
          </div>
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
          className={`menu-toggle ${open ? "is-open" : ""}`}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="primary-navigation"
          onClick={() => {
            sfx.playSnap();
            setOpen((prev) => !prev);
          }}
        >
          <span className="menu-burger-box" aria-hidden="true">
            <span className="burger-bar bar-top"></span>
            <span className="burger-bar bar-mid"></span>
            <span className="burger-bar bar-bot"></span>
          </span>
        </button>
      </header>

      {/* Backdrop overlay for mobile menu drawer */}
      <div
        className={`mobile-nav-backdrop ${open ? "open" : ""}`}
        onClick={() => {
          setOpen(false);
          sfx.playPop();
        }}
        aria-hidden="true"
      />
    </>
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
                  data-offset="165"
                  data-offset-mobile="125"
                  data-magnetic
                  onClick={() => sfx.playPop()}
                  data-cursor-text="WORK ↓"
                >
                  Explore my work <ArrowDownRight size={19} />
                </a>

                {/* <div
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
                </div> */}
              </div>
            </div>

            <div className="hero-index">
              <span className="hero-index-location">INDIA · GHAZIABAD</span>
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
