import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownRight, ArrowUpRight, Asterisk, Github, Linkedin, Mail,
  Phone, ExternalLink, Menu, X, Code2, Terminal, Layers3, Cloud,
  Database, Cpu, Award, GraduationCap, BriefcaseBusiness, Disc
} from "lucide-react";
import MusicPlayer from "./components/MusicPlayer";
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
  chess: "https://github.com/2PieRadian/chess-engine"
};

const projects = [
  {
    number: "01", name: "Wash and Wow", type: "ON-DEMAND LAUNDRY · MOBILE & WEB",
    color: "lime", headline: "Care that moves at your speed.",
    description: "An on-demand garment-care platform with a multi-stage order state machine, live status tracking, fabric and weight-based pricing, 8km Haversine geofencing for branch routing, and a promotional wallet engine.",
    stack: ["React Native", "Expo", "TypeScript", "PostgreSQL"],
    date: "APRIL 2026 — MAY 2026",
    links: [{ label: "Website", href: links.wash }, { label: "Google Play", href: links.play }]
  },
  {
    number: "02", name: "Ornify", type: "LUXURY E-COMMERCE · CUSTOM GIFT BUILDER",
    color: "coral", headline: "A little more personal.",
    description: "An e-commerce experience with a custom Gift Box Builder, dynamic piece bounds and greeting cards, strict multi-attribute variant validation, WhatsApp abandoned-cart recovery, and a complete return and exchange lifecycle.",
    stack: ["TypeScript", "Node.js", "Express", "Supabase"],
    date: "SEP 2026 — OCT 2026",
    links: [{ label: "Visit Ornify", href: links.ornify }]
  },
  {
    number: "03", name: "BankVoice AI", type: "VOICE AUTHENTICATION · BANKING ANALYTICS",
    color: "lilac", headline: "Every voice tells a story.",
    description: "An on-premise audio intelligence platform turning customer voice streams into banking telemetry. Includes Whisper transcription, DistilBERT sentiment scoring, a six-domain complaint taxonomy, fraud escalation, and acoustic speaker verification.",
    stack: ["Python", "Whisper", "DistilBERT", "SciPy"],
    date: "NOV 2026",
    links: [{ label: "GitHub repository", href: links.bank }]
  },
  {
    number: "04", name: "MindCurePath", type: "MENTAL HEALTHCARE · TELE-COUNSELLING",
    color: "ink", headline: "Technology with a human side.",
    description: "A mental-health platform with therapist scheduling and double-booking prevention, PHQ-9 and GAD-7 intake scoring, encrypted clinical journaling, and post-consultation feedback.",
    stack: ["React.js", "Node.js", "PostgreSQL", "TailwindCSS"],
    date: "DEC 2025 — MARCH 2026",
    links: [{ label: "Visit platform", href: links.mind }]
  },
  {
    number: "05", name: "Distributed Java Chess Engine", type: "CORE OOP ENGINE · MOVE GENERATOR · WEBSOCKET API",
    color: "lime", headline: "A game of states and systems.",
    description: "An immutable board-representation engine built from first principles, with legal move generation and board-state validation. Exposes REST and WebSocket APIs for real-time multiplayer matchmaking and board-evaluation streaming.",
    stack: ["Java", "OOP", "REST APIs", "WebSocket"],
    date: "IN PROGRESS",
    links: [{ label: "GitHub repository", href: links.chess }]
  }
];

const experience = [
  {
    company: "Wash and Wow", role: "Freelance Full-Stack Developer", date: "FEB 2026 — PRESENT",
    href: links.wash, detail: "Production mobile app and distributed service architecture.",
    points: [
      <>Engineered and deployed a production <b>Android app using Expo (React Native)</b>, live on <a href={links.play}>Google Play Store</a>; integrated Razorpay checkout, Google OAuth, Expo SecureStore, and location-based branch dispatch.</>,
      <>Architected a decoupled <b>Node.js microservices backend</b> with six services and an API Gateway, asynchronous RabbitMQ messaging, JWT validation, rate limiting, and centralized Swagger documentation.</>,
      <>Built a multi-branch operations dashboard in <b>Next.js</b> with TanStack Table and Recharts, PDF invoices, dynamic catalog management, and RBAC.</>,
      <>Deployed with Docker Compose on Oracle Cloud, Nginx SSL/TLS, GitHub Actions CI/CD, and PostgreSQL via Prisma.</>
    ]
  },
  {
    company: "Ornify", role: "Backend Developer", date: "SEP 2026 — OCT 2026",
    href: links.ornify, detail: "Scalable commerce backend and automated fulfillment.",
    points: [
      <>Architected a TypeScript and Express.js backend on Supabase PostgreSQL, with relational schemas, indexing, and <b>Row-Level Security</b> for multi-tenant isolation.</>,
      <>Built Shiprocket fulfillment pipelines: multi-tier packaging allocation, courier quotations, AWB generation, and webhook tracking synchronization.</>,
      <>Integrated Razorpay with HMAC SHA256 webhook verification and instant refund recovery for database insertion failures.</>,
      <>Built transactional email and SMS notification pipelines using AWS SES and SNS, with rate limiting and anti-replay cooldowns.</>
    ]
  },
  {
    company: "MindCurePath Consultancy Pvt. Ltd.", role: "Freelance Full-Stack Software Developer", date: "DEC 2025 — FEB 2026",
    href: links.mind, detail: "A live tele-counselling product serving real users.",
    points: [
      <>Architected a platform serving <b>168+ active users</b> and <b>5.8K+ user events</b>, with Socket.io and WebRTC signaling for live client-therapist consultations.</>,
      <>Engineered appointment lifecycle workflows and an emergency booking system (≤ 30 mins) with instant counselor dispatch.</>,
      <>Built asynchronous notifications with AWS SQS, SES, SNS, Dead-Letter Queues, cron reminders, and transactional alerts.</>,
      <>Implemented JWT and Google OAuth 2.0, Redis session management, Razorpay payments, and HMAC webhook verification.</>,
      <>Deployed with Docker Compose, Oracle Cloud, Nginx, GitHub Actions CI/CD, and optimized PostgreSQL queries.</>
    ]
  }
];

const skillGroups = [
  { icon: Code2, title: "Languages", color: "lime", items: "JavaScript (ES6+), TypeScript, SQL, Java, Python, C++" },
  { icon: Layers3, title: "Mobile & Frontend", color: "coral", items: "React Native, Expo Router, React.js, Next.js, Zustand, TanStack Query, TailwindCSS, HTML5/CSS3" },
  { icon: Terminal, title: "Backend & Distributed Systems", color: "lilac", items: "Node.js, Express.js, Microservices Architecture, RabbitMQ (AMQP), WebSockets (Socket.io), WebRTC" },
  { icon: Cloud, title: "Cloud, DevOps & Systems", color: "ink", items: "Oracle Cloud (OCI VM), Docker, Docker Compose, Nginx, AWS SES/SQS/SNS/S3, GitHub Actions CI/CD" },
  { icon: Database, title: "Databases & Storage", color: "lime", items: "PostgreSQL, Supabase (RLS), Redis, MongoDB, Prisma ORM, Amazon S3 Presigned URLs" },
  { icon: Cpu, title: "AI, Speech & NLP", color: "coral", items: "OpenAI Whisper (STT), Hugging Face Transformers (DistilBERT), Acoustic Signal Processing (SciPy), Streamlit, Plotly" },
  { icon: Code2, title: "Integrations & Logistics", color: "lilac", items: "Razorpay, Shiprocket API, Meta WhatsApp Cloud API, RESTful APIs" },
  { icon: Cloud, title: "Hosting, Domains & Networking", color: "ink", items: "Vercel, DNS Management, Domain-to-IP mapping, Reverse Proxies" }
];

const awards = [
  { title: "Smart India Hackathon (SIH) — Top 45", detail: "Shortlisted out of 348 teams · Internal Round", href: "https://drive.google.com/file/d/1aU1eIwNgv1felkl1Dxz7rH6V-hhDpYBw/view" },
  { title: "Exploratory Data Analysis — NASSCOM & MeitY", detail: "FutureSkills Prime · Gold Category (95%)", href: "https://drive.google.com/file/d/1Ds2TovnRdCeqQfnttiXCiPdTb8jmvKaB/view?usp=sharing" },
  { title: "AWS Academy Graduate — Cloud Architecting", detail: "AWS Academy", href: "https://www.credly.com/badges/2a428992-393e-46d7-b78b-c7d815c2e197/public_url" },
  { title: "Java — Advanced Concepts for High-Performance Development", detail: "LinkedIn Learning Certification", href: "https://www.linkedin.com/learning/certificates/a328bafa1f70ae8b0f339cf6f5c1a5125b8e38f49e96aa6aaaebd9372552091c" }
];

function SectionLabel({ children, light = false }) {
  return <div className={`eyebrow ${light ? "light" : ""}`}><Asterisk size={14} /> {children}</div>;
}
function Header({ musicState, onOpenDeck }) {
  const [open, setOpen] = useState(false);
  const nav = [["Work", "#work"], ["Experience", "#experience"], ["Toolkit", "#toolkit"], ["About", "#about"], ["Say hello", "#contact"]];
  return <header className="topbar">
    <a className="wordmark" href="#home"><span className="mark">✳</span> raman<span className="wordmark-light">bhardwaj.</span></a>
    <nav className={open ? "nav open" : "nav"}>
      {nav.map(([name, href]) => <a key={name} href={href} onClick={() => setOpen(false)}>{name}</a>)}
    </nav>
    {musicState && (
      <button
        type="button"
        className={`topbar-music-pill ${musicState.isPlaying ? "playing" : ""}`}
        onClick={() => {
          if (!musicState.isPlaying) {
            musicState.togglePlay();
          } else {
            onOpenDeck();
          }
        }}
        title={musicState.isPlaying ? "Click to open deck" : "Click to play soundtrack"}
        aria-label="Soundtrack status"
      >
        <span className="topbar-music-dot" />
        <span className="topbar-music-label">
          {musicState.isPlaying
            ? `${musicState.currentTrack?.title} · ${musicState.currentTrack?.artist}`
            : "Soundtrack: 01 / 02"}
        </span>
        <span className="topbar-music-eq" aria-hidden="true">
          <span /><span /><span />
        </span>
      </button>
    )}
    <a className="nav-cta" href={links.email}>Let’s talk <ArrowUpRight size={15} /></a>
    <button className="menu-toggle" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
  </header>;
}
function ProjectCard({ project, index }) {
  return <article className={`project-card ${project.color} p${index}`}>
    <div className="project-top"><span>{project.number} / SELECTED BUILD</span><span className="project-type">{project.type}</span></div>
    <h3>{project.name}<span className="period">.</span></h3>
    <h4>{project.headline}</h4>
    <p>{project.description}</p>
    <div className="tags">{project.stack.map(t => <span key={t}>{t}</span>)}</div>
    <div className="project-bottom"><span className="date">{project.date}</span><div className="project-links">{project.links.map(l => <a key={l.label} href={l.href} target="_blank" rel="noreferrer">{l.label} <ArrowUpRight size={14} /></a>)}</div></div>
  </article>;
}
function App() {
  const [isDeckOpen, setIsDeckOpen] = useState(false);
  const [musicState, setMusicState] = useState(null);

  useEffect(() => {
    const nodes = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); }
    }), { threshold: 0.12 });
    nodes.forEach(n => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  return <div id="home">
    <Header musicState={musicState} onOpenDeck={() => setIsDeckOpen(true)} />
    <main>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-kicker"><SectionLabel>A DEVELOPER WHO LIKES THE DETAILS</SectionLabel><span className="availability"><i /> OPEN TO OPPORTUNITIES</span></div>
          <h1>Building things<br />that <span className="highlight-word">actually</span><br /><span className="outlined-word">work.</span><span className="hero-star">✳</span></h1>
          <div className="hero-foot">
            <p>Full-stack developer. Systems thinker.<br />A little obsessed with making software useful.</p>
            <a className="round-cta" href="#work">Explore my work <ArrowDownRight size={19} /></a>
            <div className="hero-stamp">CODE WITH<br />A POINT OF VIEW <Asterisk size={24} /></div>
          </div>
          <div className="hero-index"><span>INDIA · GHAZIABAD</span><span>SCROLL TO EXPLORE ↓</span><span>01 — 05</span></div>
        </div>
        <div className="hero-orbit orbit-one"></div><div className="hero-orbit orbit-two"></div>
      </section>

      <section className="intro section-pad reveal" id="about">
        <div className="intro-heading"><SectionLabel>THE SHORT VERSION</SectionLabel><h2>Serious about<br />the <em>build.</em> Curious<br />about the <span>why.</span></h2></div>
        <div className="intro-copy">
          <p className="lead">I’m Raman Bhardwaj — a Computer Science and Engineering student focused on building full-stack products, backend systems, and practical software.</p>
          <p>From production mobile apps to event-driven services, I enjoy taking a product from a rough idea to something people can use. I care about clean architecture, dependable systems, and the small details that make an experience feel right.</p>
          <div className="intro-links">
            <a href={links.linkedin} target="_blank" rel="noreferrer"><Linkedin size={16} /> LinkedIn <ArrowUpRight size={14} /></a>
            <a href={links.github} target="_blank" rel="noreferrer"><Github size={16} /> GitHub <ArrowUpRight size={14} /></a>
            <button
              type="button"
              className="soundtrack-trigger"
              onClick={() => {
                setIsDeckOpen(true);
                if (!musicState?.isPlaying) musicState?.togglePlay();
              }}
              title="Click to play soundtrack"
            >
              <Disc size={15} /> Listening to: {musicState?.currentTrack?.title || "Love, Maybe"} <Asterisk size={12} />
            </button>
          </div>
        </div>
      </section>

      <section className="work-section section-pad" id="work">
        <div className="section-heading reveal"><div><SectionLabel>THINGS OUT IN THE WORLD</SectionLabel><h2>Proof of work.<br /><span>Not just pixels.</span></h2></div><p>Selected projects, real systems,<br />and a few rabbit holes.</p></div>
        <div className="project-grid">{projects.map((p, i) => <ProjectCard key={p.number} project={p} index={i} />)}</div>
      </section>

      <section className="manifesto">
        <div className="manifesto-inner reveal"><SectionLabel light>A FEW THINGS I BUILD BY</SectionLabel><h2>Make it <span>useful.</span><br />Make it <span>reliable.</span><br />Make it <u>matter.</u></h2><p>Good software should solve a real problem.<br />Great software should keep solving it.</p><div className="manifesto-spark">✳</div></div>
      </section>

      <section className="experience-section section-pad" id="experience">
        <div className="section-heading reveal"><div><SectionLabel>WHERE IDEAS MET REAL USERS</SectionLabel><h2>Work in the<br /><span>real world.</span></h2></div><p>Freelance builds, production<br />deployments, and ownership.</p></div>
        <div className="timeline">{experience.map((job, i) => <article className="job reveal" key={job.company}><div className="job-index">0{i + 1}</div><div className="job-main"><div className="job-head"><div><h3><a href={job.href} target="_blank" rel="noreferrer">{job.company} <ArrowUpRight size={16} /></a></h3><p>{job.role}</p></div><span>{job.date}</span></div><p className="job-detail">{job.detail}</p><ul>{job.points.map((pt, n) => <li key={n}>{pt}</li>)}</ul></div></article>)}</div>
      </section>

      <section className="toolkit-section section-pad" id="toolkit">
        <div className="section-heading reveal"><div><SectionLabel>TOOLS OF THE TRADE</SectionLabel><h2>A broad toolkit.<br /><span>A systems mindset.</span></h2></div><p>Technologies I’ve used to<br />ship and support products.</p></div>
        <div className="skills-grid">{skillGroups.map((g, i) => { const Icon = g.icon; return <article className={`skill-card ${g.color} reveal`} key={g.title}><div className="skill-top"><span>0{i + 1}</span><Icon size={23} /></div><h3>{g.title}</h3><p>{g.items}</p></article> })}</div>
      </section>

      <section className="credentials section-pad">
        <div className="credentials-col reveal"><SectionLabel>GOOD TO KNOW</SectionLabel><h2>Milestones<br />& <span>learning.</span></h2><div className="award-list">{awards.map((a, i) => <a className="award" key={a.title} href={a.href} target="_blank" rel="noreferrer"><span className="award-num">0{i + 1}</span><span><b>{a.title}</b><small>{a.detail}</small></span><ArrowUpRight size={17} /></a>)}</div></div>
        <div className="education-card reveal"><div className="edu-icon"><GraduationCap size={27} /></div><SectionLabel>EDUCATION</SectionLabel><h3>ABES Engineering<br />College</h3><p>Bachelor of Technology</p><b>Computer Science and Engineering (AI & ML)</b><div className="edu-meta"><span>GHAZIABAD, UTTAR PRADESH, IN</span><span>OCT 2023 — OCT 2027</span></div><div className="coursework"><small>COURSES</small><p>Operating Systems · Data Structures · Design & Analysis of Algorithms · Artificial Intelligence · Machine Learning · Networking · Databases</p></div></div>
      </section>

      <footer className="footer" id="contact"><div className="footer-top"><SectionLabel light>HAVE A GOOD ONE IN MIND?</SectionLabel><div className="footer-star">✳</div><h2>Let’s make<br /><em>something</em><br />matter.</h2><a className="footer-button" href={links.email}>Say hello <ArrowUpRight size={20} /></a></div><div className="footer-bottom"><a className="wordmark footer-logo" href="#home"><span className="mark">✳</span> raman<span className="wordmark-light">bhardwaj.</span></a><div className="contact-links"><a href={links.email}><Mail size={15} /> ramanbhardwaj2005@gmail.com</a><a href={links.phone}><Phone size={15} /> +91 9318387705</a><a href={links.linkedin} target="_blank" rel="noreferrer"><Linkedin size={15} /> LinkedIn</a><a href={links.github} target="_blank" rel="noreferrer"><Github size={15} /> GitHub</a></div><span className="copyright">© RAMAN BHARDWAJ</span></div></footer>
    </main>

    <MusicPlayer
      isDeckOpen={isDeckOpen}
      setIsDeckOpen={setIsDeckOpen}
      onPlayingStateChange={setMusicState}
    />
  </div>;
}

createRoot(document.getElementById("root")).render(<App />);
