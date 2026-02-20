import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import PillNav from "../components/PillNav";
import logo from "../assets/logo.svg";

// ─── DATA ────────────────────────────────────────────────────────────────────

const HEADLINES = [
  {
    text: "Master Commerce —",
    highlight: "Smarter, Faster, Stronger.",
    icon: "",
    accent: "#3B5BDB",
    animation: "slideUp",
  },
  {
    text: "Your Complete CBSE 11–12",
    highlight: "Board Prep Partner.",
    icon: "",
    accent: "#FF6B6B",
    animation: "slideRight",
  },
  {
    text: "Learn Live. Revise Smart.",
    highlight: "Score Higher.",
    icon: "",
    accent: "#20C997",
    animation: "zoomIn",
  },
  {
    text: "From Concept to Confidence —",
    highlight: "Learn It All with Us.",
    icon: "",
    accent: "#FFD43B",
    animation: "fadeWave",
  },
];

const SUBJECTS = [
  {
    key: "accountancy",
    icon: "📒",
    title: "Accountancy",
    accent: "blue",
    copy: "From basic journal entries to advanced partnership accounts and cash flow statements, we cover the full CBSE syllabus with visual teaching and practice worksheets.",
    topics: [
      "Journal Entries",
      "Ledger & Trial Balance",
      "Financial Statements",
      "Partnership Accounts",
      "Ratio Analysis",
      "Cash Flow Statement",
      "Depreciation",
      "NPO Accounts",
    ],
  },
  {
    key: "business",
    icon: "📊",
    title: "Business Studies",
    accent: "coral",
    copy: "Learn management, marketing, finance, and entrepreneurship with real-world business cases that make board prep easier and more practical.",
    topics: [
      "Nature of Business",
      "Forms of Organisation",
      "Management Principles",
      "Business Finance",
      "Marketing",
      "Consumer Protection",
      "Staffing & Directing",
      "Entrepreneurship",
    ],
  },
];

const FEATURES = [
  { icon: "🎥", title: "Live Online Classes", desc: "Real-time interactive classes with expert commerce teachers — ask questions on the spot, just like a physical classroom but from home.", bg: "#E8EEFF" },
  { icon: "📝", title: "Regular Tests with Revision Notes", desc: "Frequent chapter-wise and unit tests in the exact CBSE board pattern — MCQs, short answers, and case-based questions with support of revision notes.", bg: "#FFF0F0" },
  { icon: "📋", title: "Academic Progress Reports", desc: "Detailed reports tracking every student's performance across tests, attendance, and assignments — so nothing slips through the cracks.", bg: "#E6FCF5" },
  { icon: "👨‍👩‍👧", title: "Parent Notifications", desc: "Parents stay in the loop with timely progress updates, test results, and attendance notifications.", bg: "#FFF9DB" },
  { icon: "🙋", title: "1-on-1 Doubt Clearance", desc: "Stuck on a tricky journal entry? Book a one-to-one session with your faculty and get it cleared with full, personalised attention.", bg: "#F3F0FF" },
  { icon: "🎓", title: "Board Exam Preparation", desc: "Full-length mock papers, previous year question banks (2015–2024), and model answers — structured board prep for full confidence.", bg: "#FFF0F0" },
];

const TESTIMONIALS = [
  {
    name: "Riya Mehta",
    meta: "Class 12 · Delhi · CBSE 2024",
    avatar: "R",
    avatarBg: "#E8EEFF",
    avatarColor: "#3B5BDB",
    text: "The live classes are so interactive. Partnership accounts finally made sense and I scored 92 in boards. Couldn't have done it without LedgerLearn.",
  },
  {
    name: "Aditya Sharma",
    meta: "Class 11 · Mumbai · Ongoing",
    avatar: "A",
    avatarBg: "#FFF0F0",
    avatarColor: "#FF6B6B",
    text: "The 1-on-1 doubt sessions changed everything. My bank reconciliation doubts were solved in one 30-minute session. Way better than any coaching.",
    highlight: true,
  },
  {
    name: "Priya Nair",
    meta: "Class 12 · Chennai · CBSE 2024",
    avatar: "P",
    avatarBg: "#E6FCF5",
    avatarColor: "#20C997",
    text: "Weekly progress reports kept me consistent and focused. My parents were always informed and that motivated me to study harder. Full marks in BST!",
  },
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
    { title: "Trial Balance & Rectification of Errors", meta: "5 Lessons · 2 Tests" },
    { title: "Depreciation, Provisions & Reserves", meta: "6 Lessons · 2 Tests" },
    { title: "Bills of Exchange", meta: "4 Lessons · 1 Test" },
    { title: "Financial Statements – I & II", meta: "7 Lessons · 3 Tests" },
    { title: "Accounts from Incomplete Records", meta: "4 Lessons · 1 Test" },
  ],
  acc12: [
    { title: "Accounting for Partnership Firms – Basics", meta: "5 Lessons · 2 Tests" },
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
    { title: "Private, Public and Global Enterprises", meta: "4 Lessons · 1 Test" },
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

// ─── DOODLE SVG COMPONENTS ───────────────────────────────────────────────────

const DoodleBook = ({ style }) => (
  <svg width="60" height="60" viewBox="0 0 60 60" fill="none" style={style}>
    <rect x="5" y="5" width="50" height="50" rx="8" stroke="#3B5BDB" strokeWidth="2.5" strokeDasharray="6 3" fill="none" />
    <line x1="15" y1="20" x2="45" y2="20" stroke="#3B5BDB" strokeWidth="2" strokeLinecap="round" />
    <line x1="15" y1="30" x2="45" y2="30" stroke="#3B5BDB" strokeWidth="2" strokeLinecap="round" />
    <line x1="15" y1="40" x2="35" y2="40" stroke="#3B5BDB" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const DoodleRupee = ({ style }) => (
  <svg width="50" height="50" viewBox="0 0 50 50" fill="none" style={style}>
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
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={style}>
    <rect x="8" y="4" width="12" height="36" rx="2" stroke="#20C997" strokeWidth="2.2" strokeDasharray="5 3" fill="none" transform="rotate(25 24 24)" />
    <path d="M 30 36 L 35 42 L 25 42 Z" stroke="#20C997" strokeWidth="2" fill="none" />
  </svg>
);

const DoodleStar = ({ style }) => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={style}>
    <polygon points="22,4 26,16 38,16 28,24 32,36 22,28 12,36 16,24 6,16 18,16" stroke="#FFD43B" strokeWidth="2" fill="none" strokeLinejoin="round" />
  </svg>
);

const DoodleGrid = ({ id = "grid-hero" }) => (
  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.04, pointerEvents: "none" }} preserveAspectRatio="none" viewBox="0 0 100 100">
    <defs>
      <pattern id={id} width="4" height="4" patternUnits="userSpaceOnUse">
        <path d="M 4 0 L 0 0 0 4" fill="none" stroke="#1a1a2e" strokeWidth="0.3" />
      </pattern>
    </defs>
    <rect width="100" height="100" fill={`url(#${id})`} />
  </svg>
);

// ─── MINI LEDGER CARD ────────────────────────────────────────────────────────

const MiniLedgerCard = () => (
  <div style={{
    background: "white",
    border: "2.5px solid #1a1a2e",
    borderRadius: 24,
    padding: "clamp(16px, 4vw, 28px)",
    width: "min(290px, 85vw)",
    maxWidth: 290,
    boxShadow: "8px 8px 0 #3B5BDB",
    position: "relative",
    zIndex: 2,
    animation: "floatY 5s ease-in-out infinite",
    fontFamily: "Nunito, sans-serif",
  }}>
    <div style={{ background: "#E8EEFF", border: "2px dashed #3B5BDB", color: "#3B5BDB", fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 20, display: "inline-block", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>📒 Today's Lesson</div>
    <h3 style={{ fontFamily: "Caveat, cursive", fontSize: 26, marginBottom: 14, color: "#1a1a2e" }}>Trial Balance</h3>
    <div style={{ background: "#F8F9FA", borderRadius: 12, padding: 14, fontSize: 12, border: "1.5px solid #e0e0e0" }}>
      <div style={{ fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#888", marginBottom: 6 }}>Particulars &nbsp;&nbsp;&nbsp;&nbsp; Dr &nbsp;&nbsp; Cr</div>
      {[
        { name: "Cash A/c", dr: "50,000", cr: "—", drColor: "#FF6B6B" },
        { name: "Sales A/c", dr: "—", cr: "80,000", crColor: "#20C997" },
        { name: "Purchase A/c", dr: "30,000", cr: "—", drColor: "#FF6B6B" },
      ].map((row, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dashed #ddd", fontWeight: 600, color: "#1a1a2e" }}>
          <span>{row.name}</span>
          <span style={{ color: row.drColor || "#1a1a2e" }}>{row.dr}</span>
          <span style={{ color: row.crColor || "#1a1a2e" }}>{row.cr}</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 2px", fontWeight: 800, borderTop: "2px solid #1a1a2e", marginTop: 4 }}>
        <span>Total</span>
        <span style={{ color: "#FF6B6B" }}>80,000</span>
        <span style={{ color: "#20C997" }}>80,000</span>
      </div>
    </div>
    <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
      <span style={{ background: "#E6FCF5", color: "#20C997", border: "1.5px solid #20C997", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>✔ Tallied!</span>
      <span style={{ background: "#FFF9DB", color: "#e67700", border: "1.5px dashed #e67700", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>▶ Next</span>
    </div>
  </div>
);

// ─── ANIMATED HERO ───────────────────────────────────────────────────────────

function AnimatedHero() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [count, setCount] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setActiveIdx((prev) => (prev + 1) % HEADLINES.length);
        setAnimating(false);
      }, 350);
    }, 2800);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    let c = 0;
    const t = setInterval(() => {
      c = Math.min(c + 9, 500);
      setCount(c);
      if (c >= 500) clearInterval(t);
    }, 18);
    return () => clearInterval(t);
  }, []);

  const current = HEADLINES[activeIdx];

  return (
    <div className="hero-root">
      {/* Backgrounds */}
      <div className="dot-bg" />
      <DoodleGrid id="grid-hero" />

      {/* Scattered doodles */}
      <div className="doodle-scatter" style={{ top: "10%", left: "4%", animation: "floatY 6s ease-in-out infinite" }}><DoodleBook /></div>
      <div className="doodle-scatter" style={{ top: "62%", left: "2.5%", animation: "floatY2 5s ease-in-out infinite 1.5s" }}><DoodleRupee /></div>
      <div className="doodle-scatter" style={{ top: "18%", right: "38%", animation: "floatY3 7s ease-in-out infinite 0.8s" }}><DoodleTriangle /></div>
      <div className="doodle-scatter" style={{ bottom: "12%", left: "8%", animation: "floatY 8s ease-in-out infinite 2s" }}><DoodlePencil /></div>
      <div className="doodle-scatter" style={{ top: "8%", right: "5%", animation: "spinSlow 18s linear infinite" }}><DoodleCircles style={{ opacity: 0.12 }} /></div>
      <div className="doodle-scatter" style={{ bottom: "20%", right: "38%", animation: "floatY2 5s ease-in-out infinite 3s" }}><DoodleStar /></div>

      {/* Hero content */}
      <div style={{ maxWidth: 600, zIndex: 2, position: "relative" }}>
        <div className="hero-badge">
          🎥 Live Online Classes · CBSE Classes 11 & 12 · Commerce Stream
        </div>

        <div className="accent-bar" style={{ background: current.accent }} />

        <div className="hero-h1">
          {animating ? (
            <div className="headline-exit">
              <div>{current.text}</div>
              <div className="h-highlight" style={{ color: current.accent }}>{current.highlight}</div>
            </div>
          ) : (
            <div className={`headline-enter-${current.animation}`}>
              <div><span className="hero-icon">{current.icon}</span> {current.text}</div>
              <div className="h-highlight" style={{ color: current.accent }}>{current.highlight}</div>
            </div>
          )}
        </div>

        <div className="dot-indicator">
          {HEADLINES.map((h, i) => (
            <div
              key={i}
              className={`dot${activeIdx === i ? " active" : ""}`}
              style={{ background: activeIdx === i ? h.accent : "transparent", borderColor: h.accent }}
              onClick={() => { clearInterval(intervalRef.current); setAnimating(false); setActiveIdx(i); }}
            />
          ))}
        </div>

        <p className="hero-sub">
          Stop dreading journal entries and ratio analysis! LedgerLearn brings
          expert-led <strong>live online classes</strong> for Class 11–12 Commerce — with
          personal attention, regular tests, and parent progress reports that
          keep everyone on track.
        </p>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <a href="#cta" className="btn-primary">🔴 Book Free Trial Class</a>
          <a href="#chapters" className="btn-secondary">📖 Browse Chapters</a>
        </div>

        <div className="hero-stats">
          <div style={{ textAlign: "center" }}>
            <span className="stat-number">{count}+</span>
            <span className="stat-label">Students Enrolled</span>
          </div>
          <div className="stat-divider" />
          <div style={{ textAlign: "center" }}>
            <span className="stat-number">Live</span>
            <span className="stat-label">Online Classes</span>
          </div>
          <div className="stat-divider" />
          <div style={{ textAlign: "center" }}>
            <span className="stat-number">1-on-1</span>
            <span className="stat-label">Doubt Sessions</span>
          </div>
        </div>
      </div>

      {/* Illustration */}
      <div className="hero-illustration">
        <div className="float-card" style={{ top: 40, right: 20, background: "#FFF0F0", animation: "floatY3 4s ease-in-out infinite 1s" }}>🔴 Live Class in Progress!</div>
        <div className="float-card" style={{ top: 100, left: 20, background: "#E6FCF5", animation: "floatY 6s ease-in-out infinite 2s" }}>📈 Quick Ratio = 1.8</div>
        <div className="float-card" style={{ bottom: 80, right: 10, background: "#FFF9DB", animation: "floatY2 5s ease-in-out infinite 0.5s" }}>📊 Progress Report Sent ✔</div>
        <svg style={{ position: "absolute", zIndex: 0, opacity: 0.05, width: 400, height: 400 }} viewBox="0 0 400 400" fill="none">
          <defs><pattern id="grid-illus" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1a1a2e" strokeWidth="0.7" /></pattern></defs>
          <rect width="400" height="400" fill="url(#grid-illus)" />
        </svg>
        <MiniLedgerCard />
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

function HomePage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("acc11");
  const visibleChapters = CHAPTERS[activeTab] ?? [];

  return (
    <>
      {/* ── ALL STYLES ─────────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Nunito:wght@400;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink: #1a1a2e;
          --blue: #3B5BDB;
          --coral: #FF6B6B;
          --mint: #20C997;
          --gold: #FFD43B;
          --soft-blue: #E8EEFF;
          --soft-coral: #FFF0F0;
        }

        body { font-family: 'Nunito', sans-serif; color: var(--ink); overflow-x: hidden; }

        /* ── HERO ── */
        .hero-root {
          min-height: 90vh;
          display: flex;
          align-items: center;
          padding: 60px 60px 40px;
          position: relative;
          overflow: hidden;
          font-family: 'Nunito', sans-serif;
          background: #fff;
        }
        .dot-bg {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          opacity: 0.04;
          background-image: radial-gradient(circle, #3B5BDB 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .doodle-scatter { position: absolute; pointer-events: none; }

        @keyframes floatY  { 0%,100%{transform:translateY(0) rotate(0deg)}  50%{transform:translateY(-15px) rotate(3deg)} }
        @keyframes floatY2 { 0%,100%{transform:translateY(0) rotate(0deg)}  50%{transform:translateY(-12px) rotate(-4deg)} }
        @keyframes floatY3 { 0%,100%{transform:translateY(0) rotate(0deg)}  50%{transform:translateY(-18px) rotate(5deg)} }
        @keyframes spinSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulseScale { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }

        @keyframes slideUpIn   { from{opacity:0;transform:translateY(32px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes slideRightIn{ from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes zoomInAnim  { from{opacity:0;transform:scale(0.7)}        to{opacity:1;transform:scale(1)} }
        @keyframes fadeWaveAnim{ from{opacity:0;letter-spacing:0.2em}        to{opacity:1;letter-spacing:normal} }
        @keyframes exitDown    { from{opacity:1;transform:translateY(0)}     to{opacity:0;transform:translateY(-28px)} }
        @keyframes bounceIn    { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }

        .headline-enter-slideUp   { animation: slideUpIn    0.45s cubic-bezier(.22,1,.36,1) both; }
        .headline-enter-slideRight{ animation: slideRightIn  0.45s cubic-bezier(.22,1,.36,1) both; }
        .headline-enter-zoomIn    { animation: zoomInAnim   0.45s cubic-bezier(.22,1,.36,1) both; }
        .headline-enter-fadeWave  { animation: fadeWaveAnim  0.5s ease both; }
        .headline-exit            { animation: exitDown 0.3s ease both; }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--soft-blue); border: 2px dashed var(--blue);
          padding: 8px 10px; border-radius: 30px;
          font-size: 13px; font-weight: 700; color: var(--blue);
          margin-bottom: 18px; animation: bounceIn 0.8s ease both;
        }
        .accent-bar { width: 60px; height: 5px; border-radius: 3px; margin-bottom: 20px; transition: background 0.4s; }

        .hero-h1 {
          font-family: 'Caveat', cursive;
          font-size: clamp(48px, 6vw, 72px);
          line-height: 1.05; font-weight: 700;
          min-height: 160px; color: var(--ink);
        }
        .h-highlight {
          text-decoration: underline; text-decoration-style: wavy;
          text-underline-offset: 6px; display: inline-block;
        }
        .hero-icon { display: inline-block; font-size: 0.9em; animation: pulseScale 1.5s ease-in-out infinite; }

        .dot-indicator { display: flex; gap: 7px; margin-top: 20px; }
        .dot {
          width: 8px; height: 8px; border-radius: 50%;
          border: 2px solid var(--ink); background: transparent;
          transition: background 0.3s, transform 0.2s; cursor: pointer;
        }
        .dot.active { transform: scale(1.3); }

        .hero-sub { font-size: 17px; color: #555; line-height: 1.75; margin: 24px 0 36px; max-width: 520px; }

        .btn-primary {
          background: var(--blue); color: white;
          padding: 16px 36px; border-radius: 50px; font-size: 16px; font-weight: 800;
          border: 2.5px solid var(--ink); cursor: pointer;
          box-shadow: 5px 5px 0 var(--ink); transition: all 0.2s;
          text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
          font-family: 'Nunito', sans-serif;
        }
        .btn-primary:hover { transform: translate(-3px,-3px); box-shadow: 8px 8px 0 var(--ink); }

        .btn-secondary {
          background: white; color: var(--ink);
          padding: 16px 36px; border-radius: 50px; font-size: 16px; font-weight: 800;
          border: 2.5px solid var(--ink); cursor: pointer;
          box-shadow: 5px 5px 0 #ccc; transition: all 0.2s;
          text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
          font-family: 'Nunito', sans-serif;
        }
        .btn-secondary:hover { transform: translate(-3px,-3px); box-shadow: 8px 8px 0 #ccc; }

        .hero-stats { display: flex; gap: 32px; margin-top: 48px; }
        .stat-number { font-family: 'Caveat', cursive; font-size: 40px; font-weight: 700; color: var(--blue); display: block; }
        .stat-label  { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; }
        .stat-divider {
          width: 2px;
          background: repeating-linear-gradient(to bottom, var(--ink) 0px, var(--ink) 5px, transparent 5px, transparent 10px);
          opacity: 0.2;
        }

        .hero-illustration {
          flex: 1; display: flex; justify-content: center; align-items: center;
          position: relative; min-height: 500px;
        }
        .float-card {
          position: absolute; background: white;
          border: 2px solid var(--ink); border-radius: 16px; padding: 12px 16px;
          font-weight: 700; font-size: 13px;
          box-shadow: 4px 4px 0 var(--ink);
          display: flex; align-items: center; gap: 8px; z-index: 3;
          font-family: 'Nunito', sans-serif;
        }

        /* ── SECTION COMMON ── */
        .section-tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'Caveat', cursive; font-size: 22px; color: var(--coral); font-weight: 600;
        }
        .section-tag::before { content:''; display:inline-block; width:30px; height:3px; background:var(--coral); border-radius:2px; }
        .section-title { font-family: 'Caveat', cursive; font-size: clamp(36px,5vw,54px); font-weight: 700; line-height: 1.1; margin-top: 8px; }

        /* ── SUBJECTS ── */
        .subjects-section { padding: 80px 60px; background: #F8F9FA; position: relative; overflow: hidden; }
        .subjects-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 44px; }
        .subject-card {
          background: white; border: 2.5px solid var(--ink); border-radius: 24px; padding: 40px;
          position: relative; overflow: hidden; transition: transform 0.3s, box-shadow 0.3s; cursor: pointer;
        }
        .subject-card:hover { transform: translate(-5px,-5px); }
        .subject-card.acc { box-shadow: 6px 6px 0 var(--blue); }
        .subject-card.acc:hover { box-shadow: 10px 10px 0 var(--blue); }
        .subject-card.bst { box-shadow: 6px 6px 0 var(--coral); }
        .subject-card.bst:hover { box-shadow: 10px 10px 0 var(--coral); }
        .subject-icon {
          width: 68px; height: 68px; border-radius: 18px; display: flex;
          align-items: center; justify-content: center; font-size: 34px;
          margin-bottom: 18px; border: 2px solid var(--ink);
        }
        .class-badges { position: absolute; top: 22px; right: 22px; display: flex; gap: 6px; }
        .class-badge { background: var(--ink); color: white; font-size: 16px; font-weight: 800; padding: 4px 10px; border-radius: 10px; font-family: 'Caveat', cursive; }
        .topic-pills { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0 22px; }
        .topic-pill { background: #F8F9FA; border: 1.5px dashed #bbb; padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; color: #555; }
        .btn-card { background: transparent; border: 2px solid var(--ink); padding: 10px 22px; border-radius: 50px; font-weight: 800; font-size: 14px; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; font-family: 'Nunito', sans-serif; }
        .acc .btn-card:hover { background: var(--blue); color: white; border-color: var(--blue); }
        .bst .btn-card:hover { background: var(--coral); color: white; border-color: var(--coral); }

        /* ── FEATURES ── */
        .features-section { padding: 80px 60px; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-top: 44px; }
        .feature-card {
          border: 2px solid #e0e0e0; border-radius: 20px; padding: 30px;
          text-align: center; transition: all 0.3s; background: white;
        }
        .feature-card:hover { border-color: var(--blue); transform: translateY(-6px); box-shadow: 0 20px 40px rgba(59,91,219,0.1); }
        .feature-icon {
          width: 64px; height: 64px; border-radius: 16px; display: flex;
          align-items: center; justify-content: center; font-size: 28px;
          margin: 0 auto 16px; border: 2px dashed var(--ink);
        }
        .feature-card h4 { font-size: 17px; font-weight: 800; margin-bottom: 10px; }
        .feature-card p  { font-size: 14px; color: #777; line-height: 1.7; }

        /* ── CHAPTERS ── */
        .chapters-section { padding: 80px 60px; background: var(--ink); color: white; position: relative; overflow: hidden; }
        .chapters-section .section-tag { color: var(--gold); }
        .chapters-section .section-tag::before { background: var(--gold); }
        .chapters-section .section-title { color: white; }
        .tabs-row { display: flex; gap: 10px; flex-wrap: wrap; margin: 28px 0 24px; }
        .tab-btn {
          background: transparent; border: 2px solid rgba(255,255,255,0.3);
          color: rgba(255,255,255,0.6); padding: 9px 22px; border-radius: 50px;
          font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s;
          font-family: 'Nunito', sans-serif;
        }
        .tab-btn:hover { border-color: var(--gold); color: white; }
        .tab-btn.active { background: var(--gold); border-color: var(--gold); color: var(--ink); }
        .chapters-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .chapter-item {
          background: rgba(255,255,255,0.07); border: 1.5px solid rgba(255,255,255,0.13);
          border-radius: 14px; padding: 16px 20px;
          display: flex; align-items: center; gap: 14px;
          cursor: pointer; transition: all 0.2s;
        }
        .chapter-item:hover { background: rgba(255,255,255,0.14); transform: translateX(6px); border-color: var(--gold); }
        .chapter-num { font-family: 'Caveat', cursive; font-size: 24px; color: var(--gold); font-weight: 700; min-width: 36px; }
        .chapter-info h5 { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
        .chapter-info span { font-size: 11px; color: rgba(255,255,255,0.5); font-weight: 600; }

        /* ── TESTIMONIALS ── */
        .testimonials-section { padding: 80px 60px; background: white; }
        .testimonials-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 22px; margin-top: 44px; }
        .testimonial-card {
          border: 2px solid #e0e0e0; border-radius: 20px; padding: 26px;
          position: relative; transition: all 0.3s;
        }
        .testimonial-card:hover { border-color: var(--blue); transform: translateY(-4px); }
        .testimonial-card.featured { border-color: var(--blue); }
        .quote-mark { font-family: 'Caveat', cursive; font-size: 72px; line-height: 0.5; color: var(--blue); opacity: 0.18; position: absolute; top: 18px; left: 18px; }
        .testimonial-text { font-size: 14px; line-height: 1.75; color: #555; margin-bottom: 20px; padding-top: 22px; font-style: italic; }
        .author-row { display: flex; align-items: center; gap: 12px; }
        .author-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid var(--ink); font-family: 'Caveat', cursive; font-size: 22px; font-weight: 700; }
        .author-info h5 { font-size: 14px; font-weight: 800; }
        .author-info span { font-size: 12px; color: #888; font-weight: 600; }
        .stars { color: var(--gold); font-size: 13px; margin-bottom: 10px; }

        /* ── CTA ── */
        .cta-section {
          padding: 80px 60px; text-align: center; background: white;
          position: relative; overflow: hidden;
        }
        .cta-section h2 { font-family: 'Caveat', cursive; font-size: clamp(38px,5vw,60px); font-weight: 700; line-height: 1.1; margin: 20px 0; }
        .cta-section p  { font-size: 17px; color: #666; margin: 0 auto 36px; max-width: 500px; line-height: 1.7; }

        /* ── FOOTER ── */
        .footer-root { background: var(--ink); color: white; padding: 60px; border-top: 4px dashed rgba(255,255,255,0.08); }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 40px; }
        .footer-logo { font-family: 'Caveat', cursive; font-size: 36px; font-weight: 700; color: var(--gold); margin-bottom: 14px; }
        .footer-desc { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.8; }
        .footer-heading { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.4); margin-bottom: 14px; }
        .footer-link { color: rgba(255,255,255,0.7); text-decoration: none; font-size: 14px; font-weight: 600; transition: color 0.2s; display: block; margin-bottom: 10px; }
        .footer-link:hover { color: var(--gold); }
        .footer-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 22px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: rgba(255,255,255,0.4); }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .hero-root { 
            flex-direction: column; 
            padding: 40px 24px; 
            min-height: auto;
          }
          
          /* Show illustration on mobile but make it compact */
          .hero-illustration { 
            display: flex;
            min-height: 320px;
            margin-top: 32px;
            transform: scale(0.85);
          }
          
          /* Hide some doodles on mobile to reduce clutter */
          .doodle-scatter:nth-child(5),
          .doodle-scatter:nth-child(6) {
            display: none;
          }
          
          /* Adjust remaining doodles */
          .doodle-scatter {
            transform: scale(0.7) !important;
          }
          
          /* Make ledger card smaller on mobile */
          .hero-illustration > div:last-child {
            transform: scale(0.75);
          }
          
          /* Adjust float cards for mobile */
          .float-card {
            font-size: 11px !important;
            padding: 8px 12px !important;
            box-shadow: 3px 3px 0 var(--ink) !important;
          }
          
          .hero-h1 { 
            font-size: 44px; 
            min-height: 110px; 
          }
          
          .hero-badge {
            font-size: 11px;
            padding: 6px 14px;
          }
          
          .hero-sub {
            font-size: 15px;
            margin: 20px 0 28px;
          }
          
          .hero-stats {
            gap: 20px;
            margin-top: 32px;
            flex-wrap: wrap;
          }
          
          .stat-number { font-size: 32px; }
          .stat-label { font-size: 10px; }
          
          .btn-primary, .btn-secondary {
            padding: 14px 28px;
            font-size: 14px;
            box-shadow: 4px 4px 0 var(--ink) !important;
          }
          
          .subjects-section, .features-section, .chapters-section,
          .testimonials-section, .cta-section { padding: 60px 24px; }
          .subjects-grid, .testimonials-grid { grid-template-columns: 1fr; }
          .features-grid { grid-template-columns: 1fr 1fr; }
          .chapters-grid { grid-template-columns: 1fr; }
          .footer-root { padding: 40px 24px; }
          .footer-grid { grid-template-columns: 1fr; gap: 28px; }
          .footer-bottom { flex-direction: column; gap: 6px; text-align: center; }
        }
        
        @media (max-width: 600px) {
          .features-grid { grid-template-columns: 1fr; }
          
          /* Further optimize hero for very small screens */
          .hero-illustration {
            min-height: 280px;
            transform: scale(0.7);
          }
          
          .hero-h1 {
            font-size: 36px;
            min-height: 100px;
          }
          
          .hero-stats {
            gap: 16px;
          }
          
          .stat-divider:nth-child(4) {
            display: none;
          }
        }
      `}</style>

      <main id="home" style={{ position: "relative" }}>
        {/* NAV */}
        <PillNav
          logo={logo}
          logoAlt="LedgerLearn Logo"
          items={HEADER_ITEMS}
          activeHref={location.pathname}
          className="custom-nav"
          ease="power2.easeOut"
          baseColor="#1a1a2e"
          pillColor="#ffffff"
          hoveredPillTextColor="#ffffff"
          pillTextColor="#000000"
          theme="light"
          initialLoadAnimation={false}
        />

        {/* ── HERO / ABOUT US ─────────────────────────────────────────────── */}
        <section id="about-us" style={{ position: "relative", background: "white" }}>
          <AnimatedHero />
        </section>

        {/* ── SUBJECTS ────────────────────────────────────────────────────── */}
        <section id="subjects" className="subjects-section">
          {/* Background doodle circles */}
          <svg style={{ position: "absolute", top: 0, right: 0, width: 280, opacity: 0.07, pointerEvents: "none" }} viewBox="0 0 300 300">
            <circle cx="250" cy="50" r="80" stroke="#3B5BDB" strokeWidth="3" strokeDasharray="10 5" fill="none" />
            <circle cx="250" cy="50" r="50" stroke="#FF6B6B" strokeWidth="2" strokeDasharray="6 4" fill="none" />
          </svg>

          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <p className="section-tag">What We Teach</p>
            <h2 className="section-title">Two subjects.<br />One platform. 🎯</h2>

            <div className="subjects-grid">
              {SUBJECTS.map((s) => {
                const isAcc = s.accent === "blue";
                return (
                  <div key={s.key} className={`subject-card ${isAcc ? "acc" : "bst"}`}>
                    <div className="class-badges">
                      <span className="class-badge">11</span>
                      <span className="class-badge">12</span>
                    </div>
                    <div className="subject-icon" style={{ background: isAcc ? "#E8EEFF" : "#FFF0F0" }}>{s.icon}</div>
                    <h3 style={{ fontFamily: "Caveat, cursive", fontSize: 34, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
                    <p style={{ color: "#666", lineHeight: 1.7, fontSize: 15, marginBottom: 4 }}>{s.copy}</p>
                    <div className="topic-pills">
                      {s.topics.map((t) => <span key={t} className="topic-pill">{t}</span>)}
                    </div>
                    <button className="btn-card">Explore {s.title} →</button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── FEATURES ────────────────────────────────────────────────────── */}
        <section className="features-section">
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <p className="section-tag">Why LedgerLearn</p>
            <h2 className="section-title">Everything you need<br />to score big 💯</h2>

            <div className="features-grid">
              {FEATURES.map((f) => (
                <div key={f.title} className="feature-card">
                  <div className="feature-icon" style={{ background: f.bg }}>{f.icon}</div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CHAPTERS ────────────────────────────────────────────────────── */}
        <section id="chapters" className="chapters-section">
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <p className="section-tag">Syllabus Coverage</p>
            <h2 className="section-title">Every chapter. Every topic.<br />100% CBSE covered. 📚</h2>

            <div className="tabs-row">
              {CHAPTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-btn${activeTab === tab.id ? " active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="chapters-grid">
              {visibleChapters.map((ch, i) => (
                <div key={ch.title} className="chapter-item">
                  <span className="chapter-num">{(i + 1).toString().padStart(2, "0")}</span>
                  <div className="chapter-info">
                    <h5>{ch.title}</h5>
                    <span>{ch.meta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
        <section id="tests" className="testimonials-section">
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <p className="section-tag">Student Stories</p>
            <h2 className="section-title">Real students,<br />real results ⭐</h2>

            <div className="testimonials-grid">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className={`testimonial-card${t.highlight ? " featured" : ""}`}>
                  <div className="quote-mark">"</div>
                  <div className="stars">★★★★★</div>
                  <p className="testimonial-text">"{t.text}"</p>
                  <div className="author-row">
                    <div className="author-avatar" style={{ background: t.avatarBg, color: t.avatarColor }}>{t.avatar}</div>
                    <div className="author-info">
                      <h5>{t.name}</h5>
                      <span>{t.meta}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <section id="cta" className="cta-section">
          {/* Dot bg */}
          <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.04, pointerEvents: "none" }} preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs><pattern id="dots-cta" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="0.8" fill="#3B5BDB" /></pattern></defs>
            <rect width="100" height="100" fill="url(#dots-cta)" />
          </svg>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 60, marginBottom: 4 }}>🎓</div>
            <h2>Your Class 12 boards are<br /><span style={{ color: "#3B5BDB" }}>closer than you think.</span></h2>
            <p>Join hundreds of commerce students attending live classes, getting personal faculty attention, and tracking their progress every step of the way — all from home.</p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="#" className="btn-primary" style={{ fontSize: 17 }}>🔴 Book a Free Trial Class</a>
              <a href="#chapters" className="btn-secondary">Browse Chapters →</a>
            </div>
            <p style={{ marginTop: 18, fontSize: 12, color: "#aaa" }}>No commitment needed · Free trial class available · Limited seats per batch</p>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <footer className="footer-root">
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div className="footer-grid">
              <div>
                <p className="footer-logo">📒 LedgerLearn</p>
                <p className="footer-desc">Live online tuition platform for CBSE Class 11 & 12 Commerce. Expert-led live classes, regular tests, personal doubt clearing, and parent progress updates — all in one place.</p>
              </div>
              <div>
                <p className="footer-heading">Subjects</p>
                <a href="#subjects" className="footer-link">Accountancy – Class 11</a>
                <a href="#subjects" className="footer-link">Accountancy – Class 12</a>
                <a href="#subjects" className="footer-link">Business Studies – Class 11</a>
                <a href="#subjects" className="footer-link">Business Studies – Class 12</a>
              </div>
              <div>
                <p className="footer-heading">Resources</p>
                <a href="#" className="footer-link">Revision Notes</a>
                <a href="#" className="footer-link">Practice Tests</a>
                <a href="#" className="footer-link">Previous Year Papers</a>
                <a href="#chapters" className="footer-link">CBSE Syllabus 2025–26</a>
                <a href="#" className="footer-link">Board Exam Tips</a>
              </div>
              <div>
                <p className="footer-heading">Company</p>
                <a href="#" className="footer-link">About Us</a>
                <a href="#" className="footer-link">Our Teachers</a>
                <a href="#" className="footer-link">Blog</a>
                <a href="#" className="footer-link">Contact</a>
                <a href="#" className="footer-link">Privacy Policy</a>
              </div>
            </div>
            <div className="footer-bottom">
              <span>© 2026 LedgerLearn. Made with ❤️ for commerce students across India.</span>
              <span>CBSE Class 11 & 12 · Accountancy · Business Studies</span>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

export default HomePage;