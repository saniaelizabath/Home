import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PillNav from "../components/PillNav";
import LightRays from "../components/LightRays";
import logo from "../assets/logo.svg";

// ─── GIF Assets ──────────────────────────────────────────────────────────────
import backgroundGif from "../assets/background.gif";
import liveClassGif from "../assets/live class.gif";
import boardExamPrep2Gif from "../assets/board exam prep 2.gif";
import laptopGif from "../assets/laptop.gif";
import progressGif from "../assets/progress.gif";
import doubtclearanceGif from "../assets/doubtclearance.gif";
import boardExamPrepGif from "../assets/board exam prep.gif";
import solomonGif from "../assets/soloman.gif";
import ideaGif from "../assets/idea.gif";
import RippleGrid from "../components/RippleGrid";

// ─── Images ──────────────────────────────────────────────────────────────────
import bgImg from "../images/background.jpg";
import commerceImg from "../images/commerce.jpg";
import groupImg from "../images/group.jpg";
import messageImg from "../images/message.jpg";
import onlineWebp from "../images/online.webp";
import onlineClassImg from "../images/onlineclass.jpg";
import tabletImg from "../images/tablet.jpg";
import womenWebp from "../images/women.webp";
import img2Img from "../images/img2.jpg";
import helpImg from "../images/help.jpg";
import searchImg from "../images/search.jpg";
import t1 from "../images/testimonial1.jpg";
import t2 from "../images/testimonial2.jpg";
import t3 from "../images/testimonial3.jpg";
import t4 from "../images/testimonial4.jpg";
import t5 from "../images/testimonial5.jpg";

gsap.registerPlugin(ScrollTrigger);

// ─── DATA ────────────────────────────────────────────────────────────────────

const HEADLINES = [
  { text: "Master Commerce ", highlight: "Smarter, Faster, Stronger.", accent: "#5076c1ff" },
  { text: "Your Complete CBSE 11–12", highlight: "Board Prep Partner.", accent: "#FFD43B" },
  { text: "Learn Live. Revise Smart.", highlight: "Score Higher.", accent: "#20C997" },
  { text: "From Concept to Confidence ", highlight: "Learn It All with Us.", accent: "#FF6B6B" },
];

const SUBJECTS = [
  {
    key: "accountancy", icon: "📒", title: "Accountancy", accent: "blue",
    copy: "From basic journal entries to advanced partnership accounts and cash flow statements, we cover the full CBSE syllabus with visual teaching and practice worksheets.",
    topics: ["Journal Entries", "Ledger & Trial Balance", "Financial Statements", "Partnership Accounts", "Ratio Analysis", "Cash Flow Statement", "Depreciation", "NPO Accounts"],
  },
  {
    key: "business", icon: "📊", title: "Business Studies", accent: "coral",
    copy: "Learn management, marketing, finance, and entrepreneurship with real-world business cases that make board prep easier and more practical.",
    topics: ["Nature of Business", "Forms of Organisation", "Management Principles", "Business Finance", "Marketing", "Consumer Protection", "Staffing & Directing", "Entrepreneurship"],
  },
];

const FEATURES = [
  { icon: "🎥", title: "Live Online Classes", desc: "Real-time interactive classes with expert commerce teachers — ask questions on the spot, just like a physical classroom but from home.", bg: "#E8EEFF", color: "#3B5BDB" },
  { icon: "📝", title: "Regular Tests & Revision Notes", desc: "Frequent chapter-wise and unit tests in the exact CBSE board pattern — MCQs, short answers, and case-based questions with revision notes.", bg: "#FFF0F0", color: "#FF6B6B" },
  { icon: "📋", title: "Academic Progress Reports", desc: "Detailed reports tracking every student's performance across tests, attendance, and assignments — so nothing slips through the cracks.", bg: "#E6FCF5", color: "#20C997" },
  { icon: "👨‍👩‍👧", title: "Parent Notifications", desc: "Parents stay in the loop with timely progress updates, test results, and attendance notifications.", bg: "#FFF9DB", color: "#e67700" },
  { icon: "🙋", title: "1-on-1 Doubt Clearance", desc: "Stuck on a tricky journal entry? Book a one-to-one session with your faculty and get it cleared with full, personalised attention.", bg: "#F3F0FF", color: "#7048e8" },
  { icon: "🎓", title: "Board Exam Preparation", desc: "Full-length mock papers, previous year question banks (2015–2024), and model answers — structured board prep for full confidence.", bg: "#FFF0F0", color: "#FF6B6B" },
];

const TESTIMONIALS = [
  { name: "Riya Mehta", meta: "Class 12 · Delhi · CBSE 2024", avatar: "R", avatarBg: "#E8EEFF", avatarColor: "#3B5BDB", score: "92/100", subject: "Accountancy", text: "The live classes are so interactive. Partnership accounts finally made sense and I scored 92 in boards. Couldn't have done it without LedgerLearn." },
  { name: "Aditya Sharma", meta: "Class 11 · Mumbai · Ongoing", avatar: "A", avatarBg: "#FFF0F0", avatarColor: "#FF6B6B", score: "Top Batch", subject: "Both Subjects", text: "The 1-on-1 doubt sessions changed everything. My bank reconciliation doubts were solved in one 30-minute session. Way better than any coaching.", highlight: true },
  { name: "Priya Nair", meta: "Class 12 · Chennai · CBSE 2024", avatar: "P", avatarBg: "#E6FCF5", avatarColor: "#20C997", score: "Full Marks", subject: "Business Studies", text: "Weekly progress reports kept me consistent and focused. My parents were always informed and that motivated me to study harder. Full marks in BST!" },
];

const CHAPTER_TABS = [
  { id: "acc11", label: "Accountancy – Class 11" },
  { id: "acc12", label: "Accountancy – Class 12" },
  { id: "bst11", label: "Business Studies – Class 11" },
  { id: "bst12", label: "Business Studies – Class 12" },
];

const CHAPTERS = {
  acc11: [
    { title: "Introduction to Accounting", meta: "3 Lessons · 1 Test" },
    { title: "Theory Base of Accounting", meta: "4 Lessons · 1 Test" },
    { title: "Recording of Transactions – I", meta: "6 Lessons · 2 Tests" },
    { title: "Recording of Transactions – II", meta: "5 Lessons · 2 Tests" },
    { title: "Bank Reconciliation Statement", meta: "4 Lessons · 1 Test" },
    { title: "Trial Balance & Rectification", meta: "5 Lessons · 2 Tests" },
    { title: "Depreciation, Provisions & Reserves", meta: "6 Lessons · 2 Tests" },
    { title: "Bills of Exchange", meta: "4 Lessons · 1 Test" },
    { title: "Financial Statements – I & II", meta: "7 Lessons · 3 Tests" },
    { title: "Accounts from Incomplete Records", meta: "4 Lessons · 1 Test" },
  ],
  acc12: [
    { title: "Accounting for Partnership Firms", meta: "5 Lessons · 2 Tests" },
    { title: "Reconstitution – Admission of Partner", meta: "6 Lessons · 2 Tests" },
    { title: "Reconstitution – Retirement & Death", meta: "6 Lessons · 2 Tests" },
    { title: "Dissolution of Partnership Firm", meta: "4 Lessons · 1 Test" },
    { title: "Accounting for Share Capital", meta: "6 Lessons · 2 Tests" },
    { title: "Issue & Redemption of Debentures", meta: "5 Lessons · 2 Tests" },
    { title: "Financial Statements of Companies", meta: "5 Lessons · 2 Tests" },
    { title: "Analysis of Financial Statements", meta: "4 Lessons · 1 Test" },
    { title: "Accounting Ratios", meta: "5 Lessons · 2 Tests" },
    { title: "Cash Flow Statement", meta: "5 Lessons · 2 Tests" },
  ],
  bst11: [
    { title: "Business, Trade and Commerce", meta: "3 Lessons · 1 Test" },
    { title: "Forms of Business Organisation", meta: "5 Lessons · 2 Tests" },
    { title: "Private, Public & Global Enterprises", meta: "4 Lessons · 1 Test" },
    { title: "Business Services", meta: "4 Lessons · 1 Test" },
    { title: "Emerging Modes of Business", meta: "3 Lessons · 1 Test" },
    { title: "Social Responsibility of Business", meta: "3 Lessons · 1 Test" },
    { title: "Formation of a Company", meta: "3 Lessons · 1 Test" },
    { title: "Sources of Business Finance", meta: "5 Lessons · 2 Tests" },
    { title: "Small Business & Entrepreneurship", meta: "4 Lessons · 1 Test" },
    { title: "Internal Trade & International Business", meta: "5 Lessons · 2 Tests" },
  ],
  bst12: [
    { title: "Nature & Significance of Management", meta: "4 Lessons · 1 Test" },
    { title: "Principles of Management", meta: "5 Lessons · 2 Tests" },
    { title: "Business Environment", meta: "3 Lessons · 1 Test" },
    { title: "Planning", meta: "3 Lessons · 1 Test" },
    { title: "Organising", meta: "3 Lessons · 1 Test" },
    { title: "Staffing", meta: "4 Lessons · 2 Tests" },
    { title: "Directing", meta: "4 Lessons · 2 Tests" },
    { title: "Controlling", meta: "3 Lessons · 1 Test" },
    { title: "Financial Management", meta: "5 Lessons · 2 Tests" },
    { title: "Financial Markets", meta: "4 Lessons · 1 Test" },
    { title: "Marketing Management", meta: "5 Lessons · 2 Tests" },
    { title: "Consumer Protection", meta: "3 Lessons · 1 Test" },
  ],
};

const HEADER_ITEMS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "#about-us" },
  { label: "Subjects", href: "#subjects" },
  { label: "Free Trial", href: "#cta" },
  { label: "Login/Signup", href: "#cta" },
];

// ─── Masonry helpers ─────────────────────────────────────────────────────────

const useMedia = (queries, values, defaultValue) => {
  const get = () => values[queries.findIndex(q => matchMedia(q).matches)] ?? defaultValue;
  const [value, setValue] = useState(get);
  useEffect(() => {
    const handler = () => setValue(get);
    queries.forEach(q => matchMedia(q).addEventListener("change", handler));
    return () => queries.forEach(q => matchMedia(q).removeEventListener("change", handler));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
};

const useMeasure = () => {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
};

const preloadImages = async urls => {
  await Promise.all(urls.map(src => new Promise(resolve => {
    const img = new Image(); img.src = src;
    img.onload = img.onerror = () => resolve();
  })));
};

// ─── Masonry Component ────────────────────────────────────────────────────────

const Masonry = ({ items, ease = "power3.out", duration = 0.6, stagger = 0.06, animateFrom = "bottom", scaleOnHover = true, hoverScale = 0.96, blurToFocus = true }) => {
  const columns = useMedia(
    ["(min-width:1200px)", "(min-width:900px)", "(min-width:600px)"],
    [4, 3, 2], 2
  );
  const [containerRef, { width }] = useMeasure();
  const [imagesReady, setImagesReady] = useState(false);
  const hasMounted = useRef(false);

  useEffect(() => {
    preloadImages(items.map(i => i.img)).then(() => setImagesReady(true));
  }, [items]);

  const grid = useMemo(() => {
    if (!width) return [];
    const gap = 12;
    const colHeights = new Array(columns).fill(0);
    const colW = (width - gap * (columns - 1)) / columns;
    return items.map(child => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = col * (colW + gap);
      const h = child.height / 2;
      const y = colHeights[col];
      colHeights[col] += h + gap;
      return { ...child, x, y, w: colW, h };
    });
  }, [columns, items, width]);

  const totalH = useMemo(() => {
    if (!grid.length) return 0;
    return Math.max(...grid.map(g => g.y + g.h));
  }, [grid]);

  useLayoutEffect(() => {
    if (!imagesReady || !grid.length) return;
    grid.forEach((item, i) => {
      const sel = `[data-mkey="${item.id}"]`;
      const target = { x: item.x, y: item.y, width: item.w, height: item.h };
      if (!hasMounted.current) {
        let fromY = item.y + 120;
        if (animateFrom === "top") fromY = item.y - 120;
        gsap.fromTo(sel,
          { opacity: 0, x: item.x, y: fromY, width: item.w, height: item.h, ...(blurToFocus && { filter: "blur(8px)" }) },
          { opacity: 1, ...target, ...(blurToFocus && { filter: "blur(0px)" }), duration: 0.75, ease: "power3.out", delay: i * stagger }
        );
      } else {
        gsap.to(sel, { ...target, duration, ease, overwrite: "auto" });
      }
    });
    hasMounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, imagesReady]);

  const onEnter = id => {
    if (scaleOnHover) gsap.to(`[data-mkey="${id}"]`, { scale: hoverScale, duration: 0.3, ease: "power2.out" });
  };
  const onLeave = id => {
    if (scaleOnHover) gsap.to(`[data-mkey="${id}"]`, { scale: 1, duration: 0.3, ease: "power2.out" });
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: totalH }}>
      {grid.map(item => (
        <div
          key={item.id}
          data-mkey={item.id}
          style={{ position: "absolute", willChange: "transform, width, height, opacity", cursor: "pointer" }}
          onMouseEnter={() => onEnter(item.id)}
          onMouseLeave={() => onLeave(item.id)}
        >
          <div style={{
            width: "100%", height: "100%",
            backgroundImage: `url(${item.img})`,
            backgroundSize: "cover", backgroundPosition: "center",
            borderRadius: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            overflow: "hidden",
          }}>
            {/* subtle overlay on hover via CSS handled through gsap scale */}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── DOODLE ELEMENTS ─────────────────────────────────────────────────────────

const DoodleBook = ({ style }) => (
  <svg width="60" height="60" viewBox="0 0 60 60" fill="none" style={style}>
    <rect x="5" y="5" width="50" height="50" rx="8" stroke="#3B5BDB" strokeWidth="2.5" strokeDasharray="6 3" fill="none" />
    <line x1="15" y1="20" x2="45" y2="20" stroke="#3B5BDB" strokeWidth="2" strokeLinecap="round" />
    <line x1="15" y1="30" x2="45" y2="30" stroke="#3B5BDB" strokeWidth="2" strokeLinecap="round" />
    <line x1="15" y1="40" x2="35" y2="40" stroke="#3B5BDB" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const DoodleRupee = ({ style }) => (
  <svg width="56" height="56" viewBox="0 0 50 50" fill="none" style={style}>
    <circle cx="25" cy="25" r="20" stroke="#FF6B6B" strokeWidth="2.5" strokeDasharray="5 3" fill="none" />
    <text x="25" y="33" textAnchor="middle" fontSize="20" fill="#FF6B6B">₹</text>
  </svg>
);

const DoodleTriangle = ({ style }) => (
  <svg width="55" height="55" viewBox="0 0 55 55" fill="none" style={style}>
    <polygon points="27,5 50,45 5,45" stroke="#FFD43B" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
    <text x="27" y="38" textAnchor="middle" fontSize="16" fill="#FFD43B" fontWeight="bold">!</text>
  </svg>
);

const DoodleCircles = ({ style }) => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={style}>
    <circle cx="60" cy="60" r="50" stroke="#3B5BDB" strokeWidth="2.5" strokeDasharray="8 4" fill="none" />
    <circle cx="60" cy="60" r="30" stroke="#FF6B6B" strokeWidth="2" strokeDasharray="5 4" fill="none" />
  </svg>
);

const DoodlePencil = ({ style }) => (
  <svg width="52" height="52" viewBox="0 0 48 48" fill="none" style={style}>
    <rect x="8" y="4" width="12" height="36" rx="2" stroke="#20C997" strokeWidth="2.2" strokeDasharray="5 3" fill="none" transform="rotate(25 24 24)" />
    <path d="M 30 36 L 35 42 L 25 42 Z" stroke="#20C997" strokeWidth="2" fill="none" />
  </svg>
);

const DoodleStar = ({ style }) => (
  <svg width="48" height="48" viewBox="0 0 44 44" fill="none" style={style}>
    <polygon points="22,4 26,16 38,16 28,24 32,36 22,28 12,36 16,24 6,16 18,16" stroke="#FFD43B" strokeWidth="2" fill="none" strokeLinejoin="round" />
  </svg>
);

const DoodleBarChart = ({ style }) => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={style}>
    <rect x="6" y="28" width="10" height="22" rx="3" stroke="#3B5BDB" strokeWidth="2.2" strokeDasharray="4 2" fill="none" />
    <rect x="22" y="16" width="10" height="34" rx="3" stroke="#FF6B6B" strokeWidth="2.2" strokeDasharray="4 2" fill="none" />
    <rect x="38" y="8" width="10" height="42" rx="3" stroke="#20C997" strokeWidth="2.2" strokeDasharray="4 2" fill="none" />
    <line x1="4" y1="51" x2="52" y2="51" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const DoodleMagnifier = ({ style }) => (
  <svg width="50" height="50" viewBox="0 0 50 50" fill="none" style={style}>
    <circle cx="21" cy="21" r="14" stroke="#7048e8" strokeWidth="2.5" strokeDasharray="5 3" fill="none" />
    <line x1="31" y1="31" x2="45" y2="45" stroke="#7048e8" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const DoodleWave = ({ style }) => (
  <svg width="80" height="30" viewBox="0 0 80 30" fill="none" style={style}>
    <path d="M0 15 Q10 5 20 15 Q30 25 40 15 Q50 5 60 15 Q70 25 80 15" stroke="#FF6B6B" strokeWidth="2.5" strokeDasharray="4 3" fill="none" strokeLinecap="round" />
  </svg>
);

const DoodleGrid = ({ id = "grid-hero" }) => (
  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.035, pointerEvents: "none" }} preserveAspectRatio="none" viewBox="0 0 100 100">
    <defs>
      <pattern id={id} width="4" height="4" patternUnits="userSpaceOnUse">
        <path d="M 4 0 L 0 0 0 4" fill="none" stroke="#1a1a2e" strokeWidth="0.3" />
      </pattern>
    </defs>
    <rect width="100" height="100" fill={`url(#${id})`} />
  </svg>
);

// ─── MINI LEDGER CARD ─────────────────────────────────────────────────────────

const MiniLedgerCard = () => (
  <div style={{
    background: "white", border: "2.5px solid #1a1a2e", borderRadius: 24,
    padding: "clamp(16px,4vw,28px)", width: "min(290px,85vw)", maxWidth: 290,
    boxShadow: "8px 8px 0 #3B5BDB", position: "relative", zIndex: 2,
    animation: "floatY 5s ease-in-out infinite", fontFamily: "var(--font-body)",
  }}>
    <div style={{ background: "#E8EEFF", border: "2px dashed #3B5BDB", color: "#3B5BDB", fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 20, display: "inline-block", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>📒 Today's Lesson</div>
    <h3 style={{ fontFamily: "var(--font-hand)", fontSize: 28, marginBottom: 14, color: "#1a1a2e" }}>Trial Balance</h3>
    <div style={{ background: "#F8F9FA", borderRadius: 12, padding: 14, fontSize: 12, border: "1.5px solid #e0e0e0" }}>
      <div style={{ fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#888", marginBottom: 6 }}>Particulars &nbsp;&nbsp;&nbsp;&nbsp; Dr &nbsp;&nbsp;&nbsp; Cr</div>
      {[
        { name: "Cash A/c", dr: "50,000", cr: "—", drColor: "#FF6B6B" },
        { name: "Sales A/c", dr: "—", cr: "80,000", crColor: "#20C997" },
        { name: "Purchase A/c", dr: "30,000", cr: "—", drColor: "#FF6B6B" },
      ].map((row, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px dashed #ddd", fontWeight: 600, color: "#1a1a2e", gap: 8 }}>
          <span style={{ flex: 1 }}>{row.name}</span>
          <span style={{ color: row.drColor || "#1a1a2e", minWidth: 52, textAlign: "right" }}>{row.dr}</span>
          <span style={{ color: row.crColor || "#1a1a2e", minWidth: 52, textAlign: "right" }}>{row.cr}</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 2px", fontWeight: 800, borderTop: "2px solid #1a1a2e", marginTop: 4, gap: 8 }}>
        <span style={{ flex: 1 }}>Total</span>
        <span style={{ color: "#FF6B6B", minWidth: 52, textAlign: "right" }}>80,000</span>
        <span style={{ color: "#20C997", minWidth: 52, textAlign: "right" }}>80,000</span>
      </div>
    </div>
    <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
      <span style={{ background: "#E6FCF5", color: "#20C997", border: "1.5px solid #20C997", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>✔ Tallied!</span>
      <span style={{ background: "#FFF9DB", color: "#e67700", border: "1.5px dashed #e67700", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>▶ Next</span>
    </div>
  </div>
);

// ─── HERO ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const textRefs = useRef([]);
  const intervalRef = useRef(null);
  const doodleRefs = useRef([]);

  // Headline rotate: blur-scale animation
  useEffect(() => {
    const el = textRefs.current[activeIdx];
    if (!el) return;
    gsap.fromTo(el,
      { scale: 0.82, opacity: 0, y: 18 },
      { scale: 1, opacity: 1, y: 0, duration: 0.65, ease: "back.out(1.5)" }
    );
  }, [activeIdx]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const cur = textRefs.current[activeIdx];
      if (cur) {
        gsap.to(cur, {
          scale: 0.82, opacity: 0, y: -12, duration: 0.4, ease: "power2.in",
          onComplete: () => setActiveIdx(p => (p + 1) % HEADLINES.length),
        });
      } else {
        setActiveIdx(p => (p + 1) % HEADLINES.length);
      }
    }, 3400);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);

  // Doodle entrance stagger
  useEffect(() => {
    gsap.fromTo(doodleRefs.current.filter(Boolean),
      { opacity: 0, scale: 0.5 },
      { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.6)", stagger: 0.08, delay: 0.4 }
    );
  }, []);

  return (
    <section id="about-us" style={{ position: "relative", minHeight: "100vh", overflow: "hidden", display: "flex", alignItems: "center", background: "#fafbff" }}>

      {/* Subtle dot-grid bg */}
      <DoodleGrid id="hero-dots" />

      {/* ── Scattered doodles ── */}
      {/* Top-left */}
      <DoodleCircles ref={null} style={{ position: "absolute", top: 36, left: 32, opacity: 0, zIndex: 1 }} />
      <DoodleBook style={{ position: "absolute", top: 100, left: 180, opacity: 0, zIndex: 1, transform: "rotate(-12deg)" }} />
      <DoodleWave style={{ position: "absolute", top: 52, left: 320, opacity: 0, zIndex: 1 }} />
      {/* Top-right */}
      <DoodleStar style={{ position: "absolute", top: 44, right: 200, opacity: 0, zIndex: 1, transform: "rotate(18deg)" }} />
      <DoodleRupee style={{ position: "absolute", top: 28, right: 80, opacity: 0, zIndex: 1 }} />
      {/* Mid-left */}
      <DoodlePencil style={{ position: "absolute", top: "42%", left: 40, opacity: 0, zIndex: 1, transform: "rotate(-20deg)" }} />
      <DoodleTriangle style={{ position: "absolute", top: "55%", left: 150, opacity: 0, zIndex: 1 }} />
      {/* Mid-right */}
      <DoodleMagnifier style={{ position: "absolute", top: "38%", right: 60, opacity: 0, zIndex: 1, transform: "rotate(10deg)" }} />
      {/* Bottom */}
      <DoodleBarChart style={{ position: "absolute", bottom: 80, left: 90, opacity: 0, zIndex: 1 }} />
      <DoodleStar style={{ position: "absolute", bottom: 60, right: 180, opacity: 0, zIndex: 1, transform: "rotate(-15deg)" }} />
      <DoodleWave style={{ position: "absolute", bottom: 40, left: "45%", opacity: 0, zIndex: 1, transform: "rotate(6deg)" }} />

      {/* ── GSAP-driven refs (re-attach visibility through GSAP entrance) ── */}
      {[
        { el: <DoodleCircles />, s: { position: "absolute", top: 36, left: 32, zIndex: 1, opacity: 0 } },
        { el: <DoodleBook />, s: { position: "absolute", top: 100, left: 180, zIndex: 1, opacity: 0, transform: "rotate(-12deg)" } },
        { el: <DoodleWave />, s: { position: "absolute", top: 52, left: 318, zIndex: 1, opacity: 0 } },
        { el: <DoodleStar />, s: { position: "absolute", top: 44, right: 196, zIndex: 1, opacity: 0, transform: "rotate(18deg)" } },
        { el: <DoodleRupee />, s: { position: "absolute", top: 28, right: 76, zIndex: 1, opacity: 0 } },
        { el: <DoodlePencil />, s: { position: "absolute", top: "42%", left: 40, zIndex: 1, opacity: 0, transform: "rotate(-20deg)" } },
        { el: <DoodleTriangle />, s: { position: "absolute", top: "55%", left: 148, zIndex: 1, opacity: 0 } },
        { el: <DoodleMagnifier />, s: { position: "absolute", top: "38%", right: 58, zIndex: 1, opacity: 0, transform: "rotate(10deg)" } },
        { el: <DoodleBarChart />, s: { position: "absolute", bottom: 80, left: 88, zIndex: 1, opacity: 0 } },
        { el: <DoodleStar />, s: { position: "absolute", bottom: 60, right: 178, zIndex: 1, opacity: 0, transform: "rotate(-15deg)" } },
        { el: <DoodleWave />, s: { position: "absolute", bottom: 40, left: "45%", zIndex: 1, opacity: 0, transform: "rotate(6deg)" } },
      ].map((d, i) => (
        <div key={i} ref={el => { doodleRefs.current[i] = el; }} style={d.s}>
          {d.el}
        </div>
      ))}

      {/* ── Main content: two-column ── */}
      <div style={{ position: "relative", zIndex: 2, maxWidth: 1220, width: "100%", margin: "0 auto", padding: "100px clamp(24px,6vw,80px) 80px", display: "flex", alignItems: "center", gap: "clamp(32px,5vw,80px)", flexWrap: "wrap" }}>

        {/* Left: text */}
        <div style={{ flex: "1 1 420px", minWidth: 0 }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#E8EEFF", border: "1.5px dashed #3B5BDB", padding: "8px 20px", borderRadius: 40, fontSize: 13, fontWeight: 700, color: "#3B5BDB", marginBottom: 32, fontFamily: "var(--font-body)", letterSpacing: "0.04em" }}>
            🎥 Live Online · CBSE 11 &amp; 12 · Commerce
          </div>

          {/* Rotating headline */}
          <div style={{ position: "relative", minHeight: 220, display: "flex", alignItems: "flex-start" }}>
            {HEADLINES.map((h, i) => (
              <div
                key={i}
                ref={el => { textRefs.current[i] = el; }}
                style={{ position: "absolute", width: "100%", opacity: i === activeIdx ? 1 : 0, pointerEvents: i === activeIdx ? "auto" : "none" }}
              >
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(38px,5.5vw,72px)", fontWeight: 800, color: "#1a1a2e", lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 8 }}>
                  {h.text}
                </h1>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(38px,5.5vw,72px)", fontWeight: 900, color: h.accent, lineHeight: 1.1, letterSpacing: "-0.03em", fontStyle: "italic", textDecoration: "underline", textDecorationColor: h.accent + "55", textUnderlineOffset: 6 }}>
                  {h.highlight}
                </h1>
              </div>
            ))}
          </div>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 8, marginTop: 12, marginBottom: 28 }}>
            {HEADLINES.map((h, i) => (
              <button key={i} onClick={() => setActiveIdx(i)} style={{ width: i === activeIdx ? 28 : 8, height: 8, borderRadius: 4, background: i === activeIdx ? h.accent : "#dde", border: "none", cursor: "pointer", transition: "all 0.4s", padding: 0 }} />
            ))}
          </div>

          <p style={{ fontFamily: "var(--font-body)", fontSize: 17, color: "#555", lineHeight: 1.9, maxWidth: 520, margin: "0 0 36px" }}>
            Stop dreading journal entries and ratio analysis! LedgerLearn brings expert-led{" "}
            <strong style={{ color: "#1a1a2e", fontWeight: 700 }}>live online classes</strong> for Class 11–12 Commerce — personal attention, regular tests, and parent progress reports.
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 44 }}>
            <a href="#cta" className="btn-primary">🔴 Book Free Trial Class</a>
            <a href="#chapters" style={{ background: "white", color: "#1a1a2e", padding: "14px 30px", borderRadius: 50, fontSize: 15, fontWeight: 700, border: "2.5px solid #1a1a2e", cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", boxShadow: "4px 4px 0 #dde", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translate(-3px,-3px)"; e.currentTarget.style.boxShadow = "7px 7px 0 #dde"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translate(0,0)"; e.currentTarget.style.boxShadow = "4px 4px 0 #dde"; }}
            >📖 Browse Chapters</a>
          </div>

          {/* Stat pills */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { icon: "🔴", label: "Live", sub: "Group Classes", color: "#FF6B6B", bg: "#FFF0F0" },
              { icon: "👤", label: "1-on-1", sub: "Individual Sessions", color: "#3B5BDB", bg: "#E8EEFF" },
              { icon: "💬", label: "Instant", sub: "Doubt Clearance", color: "#20C997", bg: "#E6FCF5" },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, border: `1.5px solid ${s.color}55`, borderRadius: 50, padding: "10px 20px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.label}</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: floating ledger card */}
        <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }} className="hero-card-col">
          {/* Small accent tag above card */}
          <div style={{ background: "#FFF9DB", border: "1.5px dashed #e67700", color: "#e67700", fontSize: 12, fontWeight: 800, padding: "6px 18px", borderRadius: 30, letterSpacing: 0.5 }}>✏️ Commerce · CBSE Boards</div>
          <MiniLedgerCard />
          {/* Small floating chips below */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            {["📊 Accountancy", "📋 Business Studies"].map(t => (
              <span key={t} style={{ background: "white", border: "1.5px solid #dde", color: "#555", fontSize: 12, fontWeight: 700, padding: "6px 16px", borderRadius: 30, boxShadow: "2px 2px 0 #dde" }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "#bbb", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 700 }}>Scroll</div>
        <div className="scroll-arrow-dark" />
      </div>
    </section>
  );
}

// ─── WHAT WE TEACH — white split panels ──────────────────────────────────────

const SUBJECT_PANELS = [
  {
    key: "accountancy", img: commerceImg, icon: "📒", title: "Accountancy",
    accent: "#3B5BDB", accentLight: "#E8EEFF", num: "01",
    copy: "From basic journal entries to advanced partnership accounts — full CBSE syllabus with visual teaching & practice worksheets.",
    topics: ["Journal Entries", "Ledger & Trial Balance", "Financial Statements", "Partnership Accounts", "Ratio Analysis", "Cash Flow Statement"],
  },
  {
    key: "business", img: onlineClassImg, icon: "📊", title: "Business Studies",
    accent: "#FF6B6B", accentLight: "#FFF0F0", num: "02",
    copy: "Management, marketing, finance & entrepreneurship with real-world business cases — making board prep easier and practical.",
    topics: ["Nature of Business", "Forms of Organisation", "Management Principles", "Business Finance", "Marketing", "Consumer Protection"],
  },
];

function WhatWeTeach() {
  const trackRef = useRef(null);

  // Pause on touch — resume on touch end
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const pause = () => track.classList.add("wt-paused");
    const resume = () => track.classList.remove("wt-paused");
    track.addEventListener("touchstart", pause, { passive: true });
    track.addEventListener("touchend", resume, { passive: true });
    track.addEventListener("touchcancel", resume, { passive: true });
    return () => {
      track.removeEventListener("touchstart", pause);
      track.removeEventListener("touchend", resume);
      track.removeEventListener("touchcancel", resume);
    };
  }, []);

  // Render panels twice so the loop is seamless
  const panels = [...SUBJECT_PANELS, ...SUBJECT_PANELS];

  return (
    <section id="subjects" style={{ background: "#f8f9ff", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "80px 24px 56px" }}>
        <p className="section-tag" style={{ justifyContent: "center" }}>What We Teach</p>
        <h2 className="section-title" style={{ textAlign: "center" }}>Two subjects. One platform. 🎯</h2>
        <p style={{ fontFamily: "var(--font-body)", color: "#666", fontSize: 16, lineHeight: 1.8, maxWidth: 460, margin: "14px auto 0" }}>
          Expert-led live classes for CBSE Class 11 &amp; 12 — interactive, structured, board-ready.
        </p>
      </div>

      {/* Marquee viewport */}
      <div style={{ overflow: "hidden", width: "100%", paddingBottom: 56 }}>
        <div
          ref={trackRef}
          className="wt-marquee-track"
          style={{ display: "flex", alignItems: "stretch", gap: "clamp(20px,3vw,40px)", width: "max-content" }}
        >
          {panels.map((s, i) => (
            <div
              key={`${s.key}-${i}`}
              className="wt-card"
              onMouseEnter={() => trackRef.current?.classList.add("wt-paused")}
              onMouseLeave={() => trackRef.current?.classList.remove("wt-paused")}
              style={{
                display: "flex", flexDirection: "row", alignItems: "stretch",
                width: "min(84vw, 960px)", flexShrink: 0,
                borderRadius: 28, overflow: "hidden",
                background: "white",
                boxShadow: `0 20px 60px ${s.accent}12, 0 4px 20px rgba(0,0,0,0.07)`,
                border: `1.5px solid ${s.accent}22`,
                position: "relative",
              }}
            >
              {/* Accent left stripe */}
              <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 5, background: s.accent, zIndex: 2 }} />

              {/* Image */}
              <div className="wt-img-wrap" style={{ flex: "0 0 42%", position: "relative", minHeight: 420, overflow: "hidden" }}>
                <img src={s.img} alt={s.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(110deg, rgba(0,0,0,0.18) 0%, transparent 52%, white 100%)" }} />
                <div style={{ position: "absolute", bottom: 16, right: 16, fontFamily: "var(--font-display)", fontSize: 100, fontWeight: 900, color: "white", opacity: 0.14, lineHeight: 1, fontStyle: "italic", userSelect: "none" }}>{s.num}</div>
                <div style={{ position: "absolute", top: 22, left: 22, background: s.accent, color: "white", borderRadius: 50, padding: "8px 20px", fontSize: 13, fontWeight: 700, boxShadow: `0 4px 16px ${s.accent}55` }}>{s.icon} {s.title}</div>
              </div>

              {/* Text */}
              <div style={{ flex: 1, padding: "44px clamp(24px,3.5vw,56px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 60, fontWeight: 900, color: s.accent, opacity: 0.09, lineHeight: 1, marginBottom: -8, fontStyle: "italic", letterSpacing: "-3px" }}>{s.num}</div>

                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {["Class 11", "Class 12"].map(n => (
                    <span key={n} style={{ background: s.accentLight, color: s.accent, fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 30 }}>{n}</span>
                  ))}
                </div>

                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,2.6vw,40px)", fontWeight: 900, color: "#1a1a2e", lineHeight: 1.12, marginBottom: 12, letterSpacing: "-0.02em" }}>{s.title}</h2>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#555", lineHeight: 1.85, marginBottom: 22, maxWidth: 380 }}>{s.copy}</p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 28 }}>
                  {s.topics.map(t => (
                    <span key={t} style={{ background: s.accentLight, border: `1.5px solid ${s.accent}44`, color: s.accent, padding: "5px 14px", borderRadius: 30, fontSize: 11, fontWeight: 700 }}>{t}</span>
                  ))}
                </div>

                <button style={{ background: s.accent, color: "white", border: "none", padding: "12px 28px", borderRadius: 50, fontSize: 13, fontWeight: 700, cursor: "pointer", width: "fit-content", fontFamily: "var(--font-body)", boxShadow: `0 6px 24px ${s.accent}44`, transition: "all 0.22s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px) scale(1.04)"; e.currentTarget.style.boxShadow = `0 12px 32px ${s.accent}66`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 6px 24px ${s.accent}44`; }}
                >Explore {s.title} →</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── WHY LEDGERLEARN — horizontal scroll with GIFs ───────────────────────────



const FEATURE_GIFS = [
  { gif: null, side: "left" },   // Live Online Classes
  { gif: null, side: "right" },  // Regular Tests
  { gif: null, side: "left" },   // Academic Progress
  { gif: null, side: "right" },  // Parent Notifications
  { gif: null, side: "left" },   // 1-on-1 Doubt
  { gif: null, side: "right" },  // Board Exam Prep
];

const FEATURES_WITH_GIFS = [
  { ...{ icon: "🎥", title: "Live Online Classes", desc: "Real-time interactive classes with expert commerce teachers — ask questions on the spot, just like a physical classroom but from home.", bg: "#E8EEFF", color: "#3B5BDB" }, gif: liveClassGif, side: "left" },
  { ...{ icon: "📝", title: "Regular Tests & Revision", desc: "Frequent chapter-wise and unit tests in the exact CBSE board pattern — MCQs, short answers, and case-based questions with revision notes.", bg: "#FFF0F0", color: "#FF6B6B" }, gif: boardExamPrep2Gif, side: "right" },
  { ...{ icon: "📋", title: "Academic Progress Reports", desc: "Detailed reports tracking every student's performance across tests, attendance, and assignments — so nothing slips through the cracks.", bg: "#E6FCF5", color: "#20C997" }, gif: laptopGif, side: "left" },
  { ...{ icon: "👨‍👩‍👧", title: "Parent Notifications", desc: "Parents stay in the loop with timely progress updates, test results, and attendance notifications.", bg: "#FFF9DB", color: "#e67700" }, gif: progressGif, side: "right" },
  { ...{ icon: "🙋", title: "1-on-1 Doubt Clearance", desc: "Stuck on a tricky journal entry? Book a one-to-one session with your faculty and get it cleared with full, personalised attention.", bg: "#F3F0FF", color: "#7048e8" }, gif: doubtclearanceGif, side: "left" },
  { ...{ icon: "🎓", title: "Board Exam Preparation", desc: "Full-length mock papers, previous year question banks (2015–2024), and model answers — structured board prep for full confidence.", bg: "#FFF0F0", color: "#FF6B6B" }, gif: boardExamPrepGif, side: "right" },
];

function FeaturesSection() {
  const rowRefs = useRef([]);

  useEffect(() => {
    rowRefs.current.forEach((el, i) => {
      if (!el) return;
      const isLeft = FEATURES_WITH_GIFS[i].side === "left";
      const gifEl = el.querySelector(".feat-gif");
      const textEl = el.querySelector(".feat-text");
      gsap.fromTo(gifEl,
        { opacity: 0, x: isLeft ? -80 : 80 },
        { opacity: 1, x: 0, duration: 0.85, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 82%" } }
      );
      gsap.fromTo(textEl,
        { opacity: 0, x: isLeft ? 80 : -80 },
        { opacity: 1, x: 0, duration: 0.85, ease: "power3.out", delay: 0.12, scrollTrigger: { trigger: el, start: "top 82%" } }
      );
    });
  }, []);

  return (
    <section style={{ background: "#fafafa", padding: "0" }}>
      <div style={{ textAlign: "center", padding: "90px 24px 60px", background: "#ffffff" }}>
        <p className="section-tag" style={{ justifyContent: "center" }}>Why LedgerLearn</p>
        <h2 className="section-title" style={{ textAlign: "center" }}>Everything you need<br />to score big 💯</h2>
        <p style={{ fontFamily: "var(--font-body)", color: "#666", fontSize: 16, lineHeight: 1.8, maxWidth: 500, margin: "14px auto 0" }}>
          Six powerful features that set LedgerLearn apart from any coaching class.
        </p>
      </div>

      {FEATURES_WITH_GIFS.map((f, i) => (
        <div
          key={f.title}
          ref={el => { rowRefs.current[i] = el; }}
          style={{
            display: "flex",
            flexDirection: f.side === "left" ? "row" : "row-reverse",
            alignItems: "stretch",
            minHeight: "72vh",
            borderTop: `1px solid #f0f0f0`,
            background: i % 2 === 0 ? "#ffffff" : "#fafafa",
          }}
          className="feat-row"
        >
          {/* GIF side */}
          <div className="feat-gif" style={{ flex: "0 0 48%", position: "relative", overflow: "hidden", minHeight: 380 }}>
            <img src={f.gif} alt={f.title} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(${f.side === "left" ? "to right" : "to left"}, transparent 50%, ${i % 2 === 0 ? "#ffffff" : "#fafafa"} 100%)` }} />
            {/* Color accent bar on the outer edge */}
            <div style={{ position: "absolute", [f.side === "left" ? "left" : "right"]: 0, top: 0, bottom: 0, width: 6, background: f.color }} />
          </div>

          {/* Text side */}
          <div className="feat-text" style={{ flex: "1", padding: "52px clamp(28px,5vw,72px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, background: f.bg, marginBottom: 20, boxShadow: `0 4px 20px ${f.color}33` }}>{f.icon}</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: f.bg, border: `1.5px solid ${f.color}55`, borderRadius: 30, padding: "5px 16px", fontSize: 11, fontWeight: 700, color: f.color, marginBottom: 14, width: "fit-content", fontFamily: "var(--font-body)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Feature {String(i + 1).padStart(2, "0")}</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,3.5vw,42px)", fontWeight: 800, color: "#1a1a2e", lineHeight: 1.12, marginBottom: 14, letterSpacing: "-0.02em" }}>{f.title}</h3>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "#555", lineHeight: 1.85, maxWidth: 440 }}>{f.desc}</p>
            <div style={{ marginTop: 28, height: 4, width: 56, background: f.color, borderRadius: 2 }} />
          </div>
        </div>
      ))}
    </section>
  );
}

// ─── CHAPTERS with LightRays ──────────────────────────────────────────────────

function ChaptersSection() {
  const [activeTab, setActiveTab] = useState("acc11");
  const visibleChapters = CHAPTERS[activeTab] ?? [];
  const listRef = useRef(null);
  const gifRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll(".chapter-item");
    gsap.fromTo(items,
      { opacity: 0, x: -24 },
      { opacity: 1, x: 0, duration: 0.4, ease: "power2.out", stagger: 0.04, overwrite: true }
    );
  }, [activeTab]);

  useEffect(() => {
    if (!gifRef.current || !sectionRef.current) return;
    gsap.fromTo(gifRef.current,
      { opacity: 0, y: 32 },
      {
        opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" }
      }
    );
  }, []);

  return (
    <section id="chapters" ref={sectionRef} style={{ background: "linear-gradient(160deg, #020a24 0%, #071540 35%, #0b2266 70%, #071a55 100%)", padding: "90px clamp(24px,5vw,80px)", position: "relative", overflow: "hidden" }}>
      {/* Subtle dot pattern */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", gap: 60, alignItems: "flex-start", position: "relative", zIndex: 1 }}>

        {/* Left: Chapter list */}
        <div style={{ flex: "1 1 0", minWidth: 0 }}>
          <p className="section-tag" style={{ color: "#FFD43B" }}>
            <span style={{ display: "inline-block", width: 30, height: 3, background: "#FFD43B", borderRadius: 2, marginRight: 8, verticalAlign: "middle" }} />
            Syllabus Coverage
          </p>
          <h2 className="section-title" style={{ color: "white" }}>Every chapter. Every topic.<br />100% CBSE covered. 📚</h2>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "28px 0 24px" }}>
            {CHAPTER_TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? "#FFD43B" : "transparent",
                  border: `2px solid ${activeTab === tab.id ? "#FFD43B" : "rgba(255,255,255,0.3)"}`,
                  color: activeTab === tab.id ? "#ffffffff" : "rgba(255,255,255,0.65)",
                  padding: "9px 22px", borderRadius: 50, fontSize: 13,
                  fontWeight: activeTab === tab.id ? 700 : 600,
                  cursor: "pointer", transition: "all 0.2s", fontFamily: "var(--font-body)",
                  boxShadow: activeTab === tab.id ? "0 4px 16px rgba(255,212,59,0.4)" : "none",
                }}
                onMouseEnter={e => { if (activeTab !== tab.id) { e.currentTarget.style.borderColor = "#FFD43B"; e.currentTarget.style.color = "white"; } }}
                onMouseLeave={e => { if (activeTab !== tab.id) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "rgba(255,255,255,0.65)"; } }}
              >{tab.label}</button>
            ))}
          </div>

          <div ref={listRef} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {visibleChapters.map((ch, i) => (
              <div key={ch.title} className="chapter-item"
                onMouseEnter={e => gsap.to(e.currentTarget, { x: 8, duration: 0.25 })}
                onMouseLeave={e => gsap.to(e.currentTarget, { x: 0, duration: 0.25 })}
              >
                <span style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "#FFD43B", fontWeight: 700, minWidth: 36, fontStyle: "italic" }}>{(i + 1).toString().padStart(2, "0")}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: "white" }}>{ch.title}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{ch.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Solomon GIF – enlarged, no border/shadow */}
        <div style={{ flex: "0 0 360px", display: "flex", alignItems: "center", justifyContent: "center" }} className="chapters-gif-col">
          <img ref={gifRef} src={solomonGif} alt="Solomon" style={{ display: "block", width: 360, height: "auto" }} />
        </div>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS with RippleGrid + corner images ────────────────────────────

const CORNER_IMGS = [
  // Top-left collage: 3 large squares
  { src: t1, style: { top: 10, left: 10, width: 190, height: 190, borderRadius: "12px", animDelay: "0s", zIndex: 5 } },
  { src: t2, style: { top: 170, left: 6, width: 145, height: 145, borderRadius: "10px", animDelay: "0.5s", zIndex: 4 } },
  { src: t3, style: { top: 24, left: 178, width: 160, height: 160, borderRadius: "10px", animDelay: "0.3s", zIndex: 3 } },
  // Bottom-right collage: 2 large squares
  { src: t4, style: { bottom: 40, right: 10, width: 170, height: 170, borderRadius: "12px", animDelay: "0.7s", zIndex: 5 } },
  { src: t5, style: { bottom: 6, right: 158, width: 140, height: 140, borderRadius: "10px", animDelay: "0.4s", zIndex: 4 } },
];

const CARD_ACCENTS = ["#3B5BDB", "#FF6B6B", "#20C997"];

function TestimonialsSection() {
  const cardRefs = useRef([]);
  useEffect(() => {
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(el,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: i * 0.12, scrollTrigger: { trigger: el, start: "top 88%" } }
      );
    });
  }, []);

  return (
    <section id="tests" style={{ position: "relative", overflow: "hidden", padding: 0, background: "#f0f2f7" }}>
      {/* Corner floating testimonial images — large square collage */}
      {CORNER_IMGS.map((img, i) => (
        <div key={i} className="corner-img" style={{
          position: "absolute", zIndex: img.style.zIndex,
          top: img.style.top, left: img.style.left,
          bottom: img.style.bottom, right: img.style.right,
          width: img.style.width, height: img.style.height,
          borderRadius: img.style.borderRadius,
          backgroundImage: `url(${img.src})`,
          backgroundSize: "cover", backgroundPosition: "center",
          border: "3px solid rgba(255,255,255,0.95)",
          boxShadow: "0 8px 28px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.07)",
          animation: `cornerFloat 5s ${img.style.animDelay} ease-in-out infinite`,
        }} />
      ))}

      {/* Content */}
      <div style={{ position: "relative", zIndex: 4, padding: "90px 80px", maxWidth: 1200, margin: "0 auto" }}>
        <p className="section-tag" style={{ color: "#3B5BDB", justifyContent: "center" }}>
          <span style={{ display: "inline-block", width: 30, height: 3, background: "#3B5BDB", borderRadius: 2, marginRight: 8, verticalAlign: "middle" }} />
          Student Stories
        </p>
        <h2 className="section-title" style={{ color: "#1a1a2e", textAlign: "center" }}>Real students,<br />real results ⭐</h2>

        <div className="testimonials-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, marginTop: 52 }}>
          {TESTIMONIALS.map((t, i) => {
            const accent = CARD_ACCENTS[i % 3];
            return (
              <div key={t.name}
                ref={el => { cardRefs.current[i] = el; }}
                style={{
                  background: "white", borderRadius: 20, padding: 28,
                  position: "relative", overflow: "hidden",
                  border: `2px solid ${accent}22`,
                  boxShadow: `0 8px 32px ${accent}14, 0 2px 8px rgba(0,0,0,0.05)`,
                }}
                onMouseEnter={e => gsap.to(e.currentTarget, { y: -8, duration: 0.3, ease: "power2.out" })}
                onMouseLeave={e => gsap.to(e.currentTarget, { y: 0, duration: 0.3, ease: "power2.out" })}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: accent, borderRadius: "20px 20px 0 0" }} />
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 30, fontSize: 12, fontWeight: 700, background: accent + "15", color: accent, border: `1.5px solid ${accent}40`, marginBottom: 14, marginTop: 6 }}>
                  🏆 {t.score} · {t.subject}
                </div>
                <div style={{ color: "#FFB800", fontSize: 13, marginBottom: 10, letterSpacing: 2 }}>★★★★★</div>
                <p style={{ fontSize: 14, lineHeight: 1.85, color: "#444", marginBottom: 22, fontStyle: "italic" }}>"{t.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: t.avatarBg, color: t.avatarColor, border: `2px solid ${accent}44`, fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, fontStyle: "italic" }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{t.meta}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const location = useLocation();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=DM+Sans:wght@300;400;500;600;700&family=Caveat:wght@400;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink: #1a1a2e;
          --blue: #3B5BDB;
          --coral: #FF6B6B;
          --mint: #20C997;
          --gold: #FFD43B;
          --font-display: 'Playfair Display', Georgia, serif;
          --font-body: 'DM Sans', system-ui, sans-serif;
          --font-hand: 'Caveat', cursive;
        }

        body { font-family: var(--font-body); color: var(--ink); overflow-x: hidden; }

        /* ── HERO BUTTONS ── */
        .btn-primary {
          background: var(--blue); color: white; padding: 15px 34px; border-radius: 50px;
          font-size: 15px; font-weight: 700; border: 2.5px solid rgba(255,255,255,0.3);
          cursor: pointer; text-decoration: none; display: inline-flex; align-items: center;
          gap: 8px; font-family: var(--font-body); transition: all 0.2s;
          box-shadow: 0 4px 24px rgba(59,91,219,0.4);
        }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(59,91,219,0.55); }

        .btn-secondary-glass {
          background: rgba(255,255,255,0.12); color: white; padding: 15px 34px; border-radius: 50px;
          font-size: 15px; font-weight: 700; border: 2px solid rgba(255,255,255,0.3);
          cursor: pointer; text-decoration: none; display: inline-flex; align-items: center;
          gap: 8px; font-family: var(--font-body); transition: all 0.2s; backdrop-filter: blur(8px);
        }
        .btn-secondary-glass:hover { background: rgba(255,255,255,0.22); transform: translateY(-3px); }

        /* ── SCROLL ARROW ── */
        @keyframes scrollBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }
        .scroll-arrow {
          width: 18px; height: 18px; border-right: 2.5px solid rgba(255,255,255,0.4);
          border-bottom: 2.5px solid rgba(255,255,255,0.4); transform: rotate(45deg);
          animation: scrollBounce 1.6s ease-in-out infinite;
        }
        .scroll-arrow-dark {
          width: 18px; height: 18px; border-right: 2.5px solid #bbb;
          border-bottom: 2.5px solid #bbb; transform: rotate(45deg);
          animation: scrollBounce 1.6s ease-in-out infinite;
        }

        /* ── FLOAT Y (ledger card) ── */
        @keyframes floatY {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-14px); }
        }

        /* ── SECTION TAG ── */
        .section-tag {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-hand); font-size: 22px; color: var(--coral); font-weight: 600;
        }
        .section-tag::before {
          content: ''; display: inline-block; width: 30px; height: 3px;
          background: var(--coral); border-radius: 2px;
        }
        .section-title {
          font-family: var(--font-display); font-size: clamp(30px,4.5vw,50px);
          font-weight: 700; line-height: 1.15; margin-top: 10px; letter-spacing: -0.02em;
        }

        /* ── SUBJECT CARDS ── */
        .subject-card {
          background: white; border: 2.5px solid var(--ink); border-radius: 24px; padding: 36px;
          position: relative; overflow: hidden; transition: transform 0.3s, box-shadow 0.3s; cursor: pointer;
          box-shadow: 6px 6px 0 var(--sa, #3B5BDB);
        }
        .subject-card:hover { transform: translate(-4px,-4px); box-shadow: 10px 10px 0 var(--sa, #3B5BDB); }

        /* ── WTW MARQUEE ── */
        @keyframes wtMarquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .wt-marquee-track {
          animation: wtMarquee 50s linear infinite;
          will-change: transform;
        }
        .wt-marquee-track.wt-paused {
          animation-play-state: paused;
        }
        .wt-card {
          transition: box-shadow 0.25s, transform 0.25s;
        }
        .wt-card:hover {
          box-shadow: 0 28px 72px rgba(0,0,0,0.12) !important;
          transform: translateY(-4px);
        }

        /* ── FEATURES (horizontal scroll rows) ── */
        .feat-row { flex-wrap: nowrap; }
        @media (max-width: 768px) {
          .feat-row { flex-direction: column !important; }
          .feat-gif  { flex: 0 0 auto !important; width: 100% !important; min-height: 55vw !important; position: relative !important; }
          .feat-gif img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
          .feat-text { flex: 0 0 auto !important; width: 100% !important; padding: 40px 24px !important; }
          .hero-card-col { display: none !important; }
        }

        /* ── CHAPTER ITEMS ── */
        .chapter-item {
          background: rgba(255,255,255,0.07); border: 1.5px solid rgba(255,255,255,0.13);
          border-radius: 14px; padding: 16px 20px; display: flex; align-items: center; gap: 14px;
          cursor: pointer; transition: background 0.2s, border-color 0.2s;
        }
        .chapter-item:hover { background: rgba(255,255,255,0.14); border-color: rgba(255,212,59,0.5); }
        .ci-white { background: white !important; border: 1.5px solid #e8e8e8 !important; border-left: 4px solid var(--ca, #3B5BDB) !important; }
        .ci-white:hover { background: #f0f5ff !important; border-color: var(--ca, #3B5BDB) !important; }

        /* ── TESTIMONIAL CARDS ── */
        .tcard { position: relative; border-radius: 20px; padding: 28px; background: rgba(255,255,255,0.055); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); overflow: hidden; will-change: transform; }
        .tcard::before { content: ''; position: absolute; inset: 0; border-radius: 20px; background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 55%); pointer-events: none; }

        /* ── CORNER IMAGES ANIMATION ── */
        @keyframes cornerFloat {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-14px); }
        }
        @keyframes ideaFloat {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-18px); }
        }
        @keyframes cardReveal { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }

        /* ── CTA ── */
        .cta-section { padding: 90px 60px; text-align: center; background: white; position: relative; overflow: hidden; }
        .cta-section h2 { font-family: var(--font-display); font-size: clamp(34px,5vw,58px); font-weight: 700; line-height: 1.15; margin: 20px 0; letter-spacing: -0.02em; }
        .cta-section p  { font-size: 16px; color: #666; margin: 0 auto 36px; max-width: 500px; line-height: 1.8; }

        /* ── FOOTER ── */
        .footer-root { background: var(--ink); color: white; padding: 60px; border-top: 4px dashed rgba(255,255,255,0.08); }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 40px; }
        .footer-logo { font-family: var(--font-display); font-size: 34px; font-weight: 700; color: var(--gold); margin-bottom: 14px; font-style: italic; }
        .footer-desc { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.8; }
        .footer-heading { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.4); margin-bottom: 14px; }
        .footer-link { color: rgba(255,255,255,0.7); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; display: block; margin-bottom: 10px; }
        .footer-link:hover { color: var(--gold); }
        .footer-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 22px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: rgba(255,255,255,0.4); }

        /* ── RESPONSIVE ── */

        /* ── Tablet + Mobile: stop marquee, stack cards vertically ── */
        @media (max-width: 900px) {
          /* WhatWeTeach: kill marquee animation → vertical stack */
          #subjects { overflow: hidden !important; }
          #subjects > div:nth-child(2) { padding-bottom: 40px !important; }
          .wt-marquee-track {
            animation: none !important;
            flex-direction: column !important;
            width: 100% !important;
            gap: 24px !important;
            padding: 0 16px !important;
          }
          .wt-card {
            flex-direction: column !important;
            width: 100% !important;
            margin: 0 !important;
            border-radius: 20px !important;
            min-height: auto !important;
          }
          /* Hide duplicate panels (loop copies) — only show the real 2 */
          .wt-card:nth-child(n+3) { display: none !important; }
          /* Image becomes top banner */
          .wt-img-wrap {
            flex: 0 0 52vw !important;
            width: 100% !important;
            min-height: 48vw !important;
            max-height: 220px !important;
          }
          /* Text gets reasonable padding */
          .wt-card > div:last-child { padding: 28px 24px 32px !important; }

          /* Features */
          .feat-row { flex-direction: column !important; }
          .feat-gif { flex: 0 0 auto !important; width: 100% !important; min-height: 52vw !important; }
          .feat-text { flex: 0 0 auto !important; width: 100% !important; padding: 40px 24px !important; }
          /* Chapters: hide GIF col */
          .chapters-gif-col { display: none !important; }
          /* CTA: hide GIF */
          .cta-gif-card { display: none !important; }
        }

        /* ── Mobile: 640px – extra polish ── */
        @media (max-width: 640px) {
          /* Hero */
          .hero-card-col { display: none !important; }

          /* WhatWeTeach header padding */
          #subjects > div:first-child { padding: 56px 20px 32px !important; }
          .wt-marquee-track { padding: 0 12px !important; gap: 18px !important; }

          /* Chapters: single-col grid, smaller tabs */
          #chapters { padding: 56px 16px !important; }
          #chapters button { padding: 7px 14px !important; font-size: 12px !important; }
          #chapters [style*="gridTemplateColumns"] { grid-template-columns: 1fr !important; }

          /* Testimonials */
          #tests .corner-img { display: none !important; }
          #tests > div { padding: 56px 20px !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }

          /* CTA */
          #cta { padding: 56px 20px !important; }
          #cta > div > div:first-child { display: none !important; }
          #cta > div > div:last-child { text-align: center !important; }
          #cta > div > div:last-child > div { justify-content: center !important; flex-wrap: wrap !important; }

          /* Footer */
          .footer-root { padding: 40px 20px !important; }
          .footer-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .footer-bottom { flex-direction: column !important; gap: 6px !important; text-align: center !important; }
        }

        /* ── Tablet testimonials: 2-col ── */
        @media (min-width: 641px) and (max-width: 900px) {
          .testimonials-grid { grid-template-columns: 1fr 1fr !important; }
          #tests .corner-img { display: none !important; }
          #tests > div { padding: 56px 32px !important; }
        }
      `}</style>

      <main style={{ position: "relative" }}>
        <PillNav
          logo={logo} logoAlt="LedgerLearn Logo" items={HEADER_ITEMS}
          activeHref={location.pathname}
          ease="power2.easeOut" baseColor="#1a1a2e" pillColor="#ffffff"
          hoveredPillTextColor="#ffffff" pillTextColor="#000000"
          theme="light" initialLoadAnimation={false}
        />

        <HeroSection />
        <WhatWeTeach />
        <FeaturesSection />
        <ChaptersSection />
        <TestimonialsSection />

        {/* ── CTA ── */}
        <section id="cta" style={{ padding: "80px clamp(24px,5vw,80px)", position: "relative", overflow: "hidden", background: "#ffffff" }}>
          {/* Subtle dot bg */}
          <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.04, pointerEvents: "none" }} preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs><pattern id="dots-cta" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="0.8" fill="#3B5BDB" /></pattern></defs>
            <rect width="100" height="100" fill="url(#dots-cta)" />
          </svg>
          <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 60, flexWrap: "wrap" }}>
            {/* idea.gif – enlarged, no border/shadow */}
            <div className="cta-gif-card" style={{ flex: "0 0 340px", display: "flex", justifyContent: "center" }}>
              <img src={ideaGif} alt="Idea" style={{ display: "block", width: 340, height: "auto", animation: "ideaFloat 4s ease-in-out infinite" }} />
            </div>
            {/* Text + buttons */}
            <div style={{ flex: "1 1 340px", textAlign: "left" }}>
              <p className="section-tag" style={{ color: "#3B5BDB", marginBottom: 8 }}>Start Learning Today</p>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,4.5vw,52px)", fontWeight: 900, color: "#1a1a2e", lineHeight: 1.12, margin: "0 0 18px", letterSpacing: "-0.02em" }}>
                Your Class 12 boards are<br /><span style={{ color: "#3B5BDB" }}>closer than you think.</span>
              </h2>
              <p style={{ fontSize: 16, color: "#555", marginBottom: 32, maxWidth: 440, lineHeight: 1.8 }}>
                Join commerce students with live group &amp; individual classes, personal 1-on-1 faculty attention, and progress tracking — all from home.
              </p>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <a href="#" className="btn-primary" style={{ fontSize: 15 }}>🔴 Book a Free Trial Class</a>
                <a href="#chapters" style={{ background: "white", color: "#1a1a2e", padding: "13px 28px", borderRadius: 50, fontSize: 14, fontWeight: 700, border: "2.5px solid #1a1a2e", cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", boxShadow: "4px 4px 0 #ddd", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translate(-3px,-3px)"; e.currentTarget.style.boxShadow = "7px 7px 0 #ddd"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translate(0,0)"; e.currentTarget.style.boxShadow = "4px 4px 0 #ddd"; }}
                >Browse Chapters →</a>
              </div>
              <p style={{ marginTop: 18, fontSize: 12, color: "#aaa" }}>No commitment · Free trial class · Limited seats per batch</p>
            </div>
          </div>
        </section>


        {/* ── FOOTER ── */}
        <footer className="footer-root">
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div className="footer-grid">
              <div>
                <p className="footer-logo">📒 LedgerLearn</p>
                <p className="footer-desc">Live online tuition for CBSE Class 11 & 12 Commerce. Expert-led live classes for groups & individuals, personal 1-on-1 doubt clearing, and parent progress updates — all in one place.</p>
              </div>
              <div>
                <p className="footer-heading">Subjects</p>
                {["Accountancy – Class 11", "Accountancy – Class 12", "Business Studies – Class 11", "Business Studies – Class 12"].map(l => <a key={l} href="#subjects" className="footer-link">{l}</a>)}
              </div>
              <div>
                <p className="footer-heading">Resources</p>
                {["Revision Notes", "Practice Tests", "Previous Year Papers", "CBSE Syllabus 2025–26", "Board Exam Tips"].map(l => <a key={l} href="#" className="footer-link">{l}</a>)}
              </div>
              <div>
                <p className="footer-heading">Company</p>
                {["About Us", "Our Teachers", "Blog", "Contact", "Privacy Policy"].map(l => <a key={l} href="#" className="footer-link">{l}</a>)}
              </div>
            </div>
            <div className="footer-bottom">
              <span>© 2026 LedgerLearn. Made with ❤️ for commerce students across India.</span>
              <span>CBSE Class 11 & 12 · Accountancy · Business Studies</span>
            </div>
          </div>
        </footer>
      </main >
    </>
  );
}