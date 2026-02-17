import React, { useEffect, useRef, useState } from "react";

// ─── 3D Scene Components (Adapted for White Theme) ───────────────────────────

const FinanceScene = () => (
    <div style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d" }}>
        {/* Floating laptop */}
        <div className="float-1" style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%) rotateY(-20deg) rotateX(10deg)",
            width: 220, height: 140,
        }}>
            {/* Screen */}
            <div style={{
                width: 220, height: 140, background: "linear-gradient(135deg, #f0f4f8 0%, #ffffff 100%)",
                borderRadius: 12, border: "3px solid #e8a838", boxShadow: "0 10px 30px rgba(232,168,56,0.2), inset 0 0 20px rgba(232,168,56,0.05)",
                display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8
            }}>
                {[1, 0.7, 0.5].map((w, i) => (
                    <div key={i} style={{ width: `${w * 140}px`, height: 8, background: `rgba(232,168,56,${0.9 - i * 0.2})`, borderRadius: 4 }} />
                ))}
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    {["#e8a838", "#4db6ac", "#ef5350"].map((c, i) => (
                        <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
                    ))}
                </div>
            </div>
            {/* Base */}
            <div style={{ width: 240, height: 8, background: "#e2e8f0", borderRadius: 4, marginTop: 4, marginLeft: -10, border: "2px solid #cbd5e1" }} />
        </div>

        {/* Coin stack */}
        {[0, 1, 2, 3].map(i => (
            <div key={i} className="float-2" style={{
                position: "absolute", left: "15%", bottom: `${30 + i * 18}%`,
                width: 60, height: 14, borderRadius: "50%",
                background: `linear-gradient(135deg, #f9c846, #e8a838, #c8882a)`,
                boxShadow: "0 4px 12px rgba(232,168,56,0.4)",
                transform: "rotateX(60deg)", border: "1px solid #f9c846"
            }} />
        ))}

        {/* Bar chart */}
        <div className="float-3" style={{
            position: "absolute", right: "10%", bottom: "20%",
            display: "flex", alignItems: "flex-end", gap: 8, padding: 12,
            background: "rgba(255,255,255,0.8)", borderRadius: 10, border: "1px solid rgba(232,168,56,0.3)",
            backdropFilter: "blur(8px)", boxShadow: "0 8px 20px rgba(0,0,0,0.05)"
        }}>
            {[40, 65, 50, 80, 55, 90].map((h, i) => (
                <div key={i} style={{ width: 12, height: h * 0.6, background: `hsl(${200 + i * 20},70%,${50 + i * 5}%)`, borderRadius: "3px 3px 0 0" }} />
            ))}
        </div>

        {/* Dollar signs floating */}
        {["$", "₹", "€"].map((s, i) => (
            <div key={i} className={`float-${i + 1}`} style={{
                position: "absolute",
                top: `${20 + i * 25}%`, right: `${15 + i * 10}%`,
                fontSize: 28, fontWeight: 900,
                color: "#e8a838", textShadow: "0 4px 10px rgba(232,168,56,0.3)",
                fontFamily: "'Georgia', serif"
            }}>{s}</div>
        ))}
    </div>
);

const TechScene = () => (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
        {/* Server rack */}
        <div className="float-1" style={{
            position: "absolute", right: "8%", top: "20%",
            width: 70, height: 160,
            background: "linear-gradient(180deg, #f8fafc, #e2e8f0)",
            borderRadius: 6, border: "2px solid #4db6ac",
            boxShadow: "0 10px 30px rgba(77,182,172,0.2)",
            display: "flex", flexDirection: "column", gap: 4, padding: 6
        }}>
            {[...Array(6)].map((_, i) => (
                <div key={i} style={{
                    height: 18, background: "rgba(77,182,172,0.1)", borderRadius: 3, border: "1px solid rgba(77,182,172,0.2)",
                    display: "flex", alignItems: "center", paddingLeft: 4, gap: 3
                }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: i % 2 === 0 ? "#4db6ac" : "#f9c846" }} />
                    <div style={{ flex: 1, height: 3, background: "rgba(77,182,172,0.4)", borderRadius: 2 }} />
                </div>
            ))}
        </div>

        {/* Big laptop */}
        <div className="float-2" style={{
            position: "absolute", top: "25%", left: "10%",
            transform: "rotateY(15deg) rotateX(5deg)",
            width: 200, height: 130
        }}>
            <div style={{
                width: 200, height: 130, background: "linear-gradient(135deg, #ffffff, #f1f5f9)",
                borderRadius: 10, border: "2px solid #4db6ac",
                boxShadow: "0 10px 40px rgba(77,182,172,0.15)",
                padding: 12, display: "flex", flexDirection: "column", gap: 6
            }}>
                <div style={{ display: "flex", gap: 4 }}>
                    {["#ef5350", "#f9c846", "#4db6ac"].map((c, i) => (
                        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
                    ))}
                </div>
                {[0.9, 0.7, 0.8, 0.5, 0.6].map((w, i) => (
                    <div key={i} style={{ width: `${w * 100}%`, height: 6, background: i === 1 ? "#f9c846" : "rgba(77,182,172,0.6)", borderRadius: 3 }} />
                ))}
            </div>
        </div>

        {/* Chat bubbles */}
        {[{ t: "10%", l: "30%", text: "..." }, { t: "55%", r: "30%", text: "✓✓" }].map((b, i) => (
            <div key={i} className={`float-${i + 2}`} style={{
                position: "absolute", top: b.t, left: b.l, right: b.r,
                background: i === 0 ? "#4db6ac" : "#f9c846",
                color: "#ffffff", padding: "8px 14px", borderRadius: 20,
                fontSize: 14, fontWeight: 700,
                boxShadow: `0 4px 15px ${i === 0 ? "rgba(77,182,172,0.3)" : "rgba(249,200,70,0.3)"}`
            }}>{b.text}</div>
        ))}
    </div>
);

const SupportScene = () => (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
        {/* Person with headset - abstract */}
        <div className="float-2" style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -55%)",
            width: 100, height: 100,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #ff6b35, #f7931e)",
            boxShadow: "0 10px 30px rgba(255,107,53,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40
        }}>
            🎧
        </div>

        {/* Orbiting icons */}
        {[
            { icon: "💬", deg: 0 }, { icon: "📧", deg: 60 }, { icon: "📞", deg: 120 },
            { icon: "⚙️", deg: 180 }, { icon: "✈️", deg: 240 }, { icon: "🔑", deg: 300 }
        ].map((item, i) => {
            const rad = (item.deg * Math.PI) / 180;
            const r = 110;
            return (
                <div key={i} className={`orbit-${i % 3 + 1}`} style={{
                    position: "absolute",
                    top: `calc(50% + ${Math.sin(rad) * r}px - 20px)`,
                    left: `calc(50% + ${Math.cos(rad) * r}px - 20px)`,
                    width: 40, height: 40, borderRadius: "50%",
                    background: "white",
                    border: "2px solid rgba(255,107,53,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18,
                    boxShadow: "0 4px 12px rgba(255,107,53,0.15)"
                }}>{item.icon}</div>
            );
        })}
    </div>
);

const SecurityScene = () => (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
        {/* Shield */}
        <div className="float-1" style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -55%)",
            width: 110, height: 130,
            filter: "drop-shadow(0 10px 20px rgba(249,200,70,0.3))"
        }}>
            <svg viewBox="0 0 110 130" width="110" height="130">
                <path d="M55,5 L100,25 L100,70 Q100,110 55,125 Q10,110 10,70 L10,25 Z"
                    fill="url(#shieldGrad)" stroke="#f9c846" strokeWidth="2" />
                <defs>
                    <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#f8fafc" />
                    </linearGradient>
                </defs>
                <path d="M35,65 L50,80 L78,50" stroke="#f9c846" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>

        {/* User avatars in circles */}
        {[
            { t: "5%", l: "5%", emoji: "👨💻" }, { t: "5%", r: "5%", emoji: "👩🏫" },
            { b: "15%", l: "5%", emoji: "👨🎓" }, { b: "15%", r: "5%", emoji: "👩💼" }
        ].map((a, i) => (
            <div key={i} className={`float-${i % 3 + 1}`} style={{
                position: "absolute", top: a.t, bottom: a.b, left: a.l, right: a.r,
                width: 70, height: 70, borderRadius: "50%",
                background: "white",
                border: "3px solid #f9c846",
                boxShadow: "0 4px 20px rgba(249,200,70,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28
            }}>{a.emoji}</div>
        ))}
    </div>
);

const AnalyticsScene = () => (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
        {/* Clipboard */}
        <div className="float-1" style={{
            position: "absolute", top: "10%", right: "8%",
            width: 120, height: 150,
            background: "linear-gradient(135deg, #ffffff, #f3e5f5)",
            borderRadius: 10, border: "2px solid #9c27b0",
            boxShadow: "0 10px 30px rgba(156,39,176,0.15)",
            padding: 12
        }}>
            <div style={{ width: 40, height: 12, background: "#9c27b0", borderRadius: "0 0 6px 6px", margin: "0 auto 10px" }} />
            {[0.9, 0.7, 1, 0.6, 0.8].map((w, i) => (
                <div key={i} style={{ width: `${w * 100}%`, height: 6, background: `rgba(156,39,176,${0.4 + i * 0.1})`, borderRadius: 3, marginBottom: 8 }} />
            ))}
            {/* Pie chart stub */}
            <div style={{ marginTop: 8, width: 40, height: 40, borderRadius: "50%", border: "4px solid #ce93d8", borderTopColor: "#9c27b0", margin: "0 auto" }} />
        </div>

        {/* Graph notebook */}
        <div className="float-2" style={{
            position: "absolute", left: "5%", top: "15%",
            width: 130, height: 140,
            background: "rgba(255,255,255,0.9)",
            borderRadius: 8, border: "2px solid rgba(156,39,176,0.5)",
            backdropFilter: "blur(10px)", padding: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.05)"
        }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 80, marginBottom: 8 }}>
                {[25, 45, 35, 60, 50, 75, 55, 80].map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, background: `hsl(${270 + i * 10},60%,${65 + i * 5}%)`, borderRadius: "2px 2px 0 0" }} />
                ))}
            </div>
        </div>
    </div>
);

const EduScene = () => (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
        {/* Laptop with graduation cap */}
        <div className="float-1" style={{
            position: "absolute", top: "30%", left: "50%",
            transform: "translate(-50%, -50%) rotateY(-10deg)",
            width: 200, height: 130
        }}>
            <div style={{
                width: 200, height: 130, background: "linear-gradient(135deg, #ffffff, #e8eaf6)",
                borderRadius: 12, border: "2px solid #5c6bc0",
                boxShadow: "0 10px 40px rgba(92,107,192,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8
            }}>
                <div style={{ fontSize: 40 }}>🎓</div>
                <div style={{
                    width: 80, height: 30, background: "rgba(92,107,192,0.1)", borderRadius: 6,
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <div style={{ width: 50, height: 8, background: "#5c6bc0", borderRadius: 4 }} />
                </div>
            </div>
        </div>

        {/* Headphones */}
        <div className="float-3" style={{
            position: "absolute", top: "8%", left: "8%",
            fontSize: 45, filter: "drop-shadow(0 4px 10px rgba(92,107,192,0.3))"
        }}>🎧</div>

        {/* Video play */}
        <div className="float-2" style={{
            position: "absolute", bottom: "25%", left: "8%",
            width: 50, height: 35, borderRadius: 8,
            background: "#5c6bc0", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 15px rgba(92,107,192,0.3)", color: "white"
        }}>▶</div>
    </div>
);

// ─── Extra Background Elements ───────────────────────────────────────────────

const BackgroundElements = () => {
    // Generates static random elements to fill space
    const elements = [
        { char: "∑", top: "10%", left: "10%", color: "#cbd5e1", size: 40 },
        { char: "%", top: "20%", right: "15%", color: "#e2e8f0", size: 60 },
        { char: "+", bottom: "15%", left: "5%", color: "#cbd5e1", size: 50 },
        { char: "÷", top: "40%", left: "80%", color: "#f1f5f9", size: 80 },
        { char: "x", bottom: "30%", right: "10%", color: "#e2e8f0", size: 40 },
        { char: "π", top: "5%", left: "40%", color: "#f8fafc", size: 100 },
        { char: "∫", bottom: "5%", left: "40%", color: "#f1f5f9", size: 90 },
        // Shapes
        { shape: "circle", top: "60%", left: "20%", color: "#e0f2fe", size: 30 },
        { shape: "square", top: "25%", right: "35%", color: "#fef3c7", size: 20 },
        { shape: "triangle", bottom: "40%", left: "10%", color: "#ffe4e6", size: 25 },
    ];

    return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {elements.map((el, i) => (
                <div key={i} className="absolute flex items-center justify-center opacity-40 animate-pulse" style={{
                    top: el.top, left: el.left, right: el.right, bottom: el.bottom,
                    color: el.color, fontSize: el.size, width: el.size, height: el.size
                }}>
                    {el.shape === "circle" && <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: el.color }} />}
                    {el.shape === "square" && <div style={{ width: "100%", height: "100%", borderRadius: "4px", background: el.color }} />}
                    {el.shape === "triangle" && <div style={{ width: 0, height: 0, borderLeft: `${el.size / 2}px solid transparent`, borderRight: `${el.size / 2}px solid transparent`, borderBottom: `${el.size}px solid ${el.color}` }} />}
                    {!el.shape && el.char}
                </div>
            ))}
        </div>
    )
}

// ─── Slide data ───────────────────────────────────────────────────────────────

// Removed "bg" property to enforce global white
const slides = [
    {
        id: 0,
        headline: "Master Commerce",
        sub: "Smarter, Faster, Stronger.",
        accent: "#e8a838",
        textGlow: "rgba(232,168,56,0.1)",
        Scene: FinanceScene,
        tag: "💰 Finance & Commerce",
    },
    {
        id: 1,
        headline: "Learn Live.",
        sub: "Revise Smart. Score Higher.",
        accent: "#4db6ac",
        textGlow: "rgba(77,182,172,0.1)",
        Scene: TechScene,
        tag: "💻 Digital Learning",
    },
    {
        id: 2,
        headline: "Board-Ready",
        sub: "Learning Made Simple.",
        accent: "#ff6b35",
        textGlow: "rgba(255,107,53,0.1)",
        Scene: SupportScene,
        tag: "🎧 Expert Support",
    },
    {
        id: 3,
        headline: "Your Complete",
        sub: "CBSE 11–12 Board Prep Partner.",
        accent: "#f9c846",
        textGlow: "rgba(249,200,70,0.1)",
        Scene: SecurityScene,
        tag: "🛡️ Trusted Platform",
    },
    {
        id: 4,
        headline: "From Concept",
        sub: "to Confidence — Learn It All.",
        accent: "#ce93d8",
        textGlow: "rgba(206,147,216,0.1)",
        Scene: AnalyticsScene,
        tag: "📊 Deep Analytics",
    },
    {
        id: 5,
        headline: "Excellence",
        sub: "Starts Here — Join Us Today.",
        accent: "#5c6bc0",
        textGlow: "rgba(92,107,192,0.1)",
        Scene: EduScene,
        tag: "🎓 Certified Courses",
    },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnimatedHero() {
    const containerRef = useRef(null);
    const [activeSlide, setActiveSlide] = useState(0);
    const [particles, setParticles] = useState([]);

    // Generate particles
    useEffect(() => {
        const p = Array.from({ length: 40 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 2,
            color: ["#e8a838", "#4db6ac", "#ff6b35", "#3B5BDB"][Math.floor(Math.random() * 4)],
            opacity: Math.random() * 0.3 + 0.1,
            speed: Math.random() * 20 + 10,
            delay: Math.random() * 5,
        }));
        setParticles(p);
    }, []);

    // Use Intersection Observer or Scroll Handler if needed, but for horizontal slider we use pure scroll
    const onScroll = () => {
        const el = containerRef.current;
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        const pct = el.scrollLeft / max;
        // setScrollProgress(pct); // Unused currently
        const idx = Math.round(pct * (slides.length - 1));
        setActiveSlide(Math.max(0, Math.min(slides.length - 1, idx)));
    };

    const currentSlide = slides[activeSlide];

    return (
        <div className="relative w-full h-[700px] md:h-[800px] bg-white overflow-hidden font-nunito text-ink">
            <style>{`
        .scroll-track {
          display: flex;
          width: 100%;
          height: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-behavior: smooth;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
        }
        .scroll-track::-webkit-scrollbar { display: none; }

        .slide {
          flex: none;
          width: 100%;
          height: 100%;
          scroll-snap-align: center;
          position: relative;
          overflow: hidden;
        }

        /* ── Floating animations ── */
        @keyframes float1 { 0%,100% { transform: translateY(0) rotateZ(0deg); } 33% { transform: translateY(-12px) rotateZ(1deg); } 66% { transform: translateY(-6px) rotateZ(-1deg); } }
        @keyframes float2 { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-15px) scale(1.02); } }
        @keyframes drift { 0% { transform: translateY(100%) translateX(0); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(-20%) translateX(20px); opacity: 0; } }

        .float-1 { animation: float1 6s ease-in-out infinite; }
        .float-2 { animation: float2 8s ease-in-out infinite; }
        .orbit-1 { animation: spin 10s linear infinite; } /* Simplified */

        .headline-3d {
          font-family: 'Caveat', cursive; /* Using App Font */
          font-weight: 700;
          line-height: 1;
        }
      `}</style>

            <BackgroundElements />

            <div
                ref={containerRef}
                className="scroll-track"
                onScroll={onScroll}
            >
                {slides.map((slide, si) => {
                    const { Scene } = slide;
                    const isActive = si === activeSlide;

                    return (
                        <div key={slide.id} className="slide bg-white relative">

                            {/* Particle field (foreground) */}
                            {isActive && particles.map(p => (
                                <div key={p.id} style={{
                                    position: "absolute",
                                    left: `${p.x}%`,
                                    bottom: "-10%", /* Start from bottom */
                                    width: p.size,
                                    height: p.size,
                                    borderRadius: "50%",
                                    background: p.color,
                                    opacity: p.opacity,
                                    animation: `drift ${p.speed}s ${p.delay}s linear infinite`,
                                    zIndex: 1
                                }} />
                            ))}

                            {/* Layout */}
                            <div className="relative z-10 w-full h-full flex flex-col md:flex-row items-center justify-center px-6 md:px-16 gap-8 md:gap-0">

                                {/* LEFT: Text */}
                                <div className="flex-1 flex flex-col gap-6 items-start z-20 md:pr-10 pt-20 md:pt-0">
                                    {/* Tag */}
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-200 bg-white shadow-sm backdrop-blur-md">
                                        <span className="text-sm">{slide.tag.split(" ")[0]}</span>
                                        <span className="text-xs font-bold uppercase tracking-wider text-ink/70">
                                            {slide.tag.split(" ").slice(1).join(" ")}
                                        </span>
                                    </div>

                                    {/* Headline */}
                                    <div>
                                        <h1 className="headline-3d text-6xl md:text-8xl text-ink" style={{
                                            textShadow: `2px 2px 0px ${slide.accent}40`
                                        }}>
                                            {slide.headline}
                                        </h1>
                                        <p className="mt-4 text-xl md:text-3xl font-bold text-ink/80" style={{ color: slide.accent }}>
                                            {slide.sub}
                                        </p>
                                    </div>

                                    {/* Divider */}
                                    <div className="h-1.5 w-24 rounded-full bg-gray-200 overflow-hidden">
                                        <div className="h-full bg-current transition-all duration-1000" style={{ width: isActive ? '100%' : '0%', color: slide.accent, backgroundColor: slide.accent }} />
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex gap-4 mt-2">
                                        <button
                                            className="px-8 py-3 rounded-full text-white font-bold text-sm shadow-lg transition-transform hover:-translate-y-1"
                                            style={{ backgroundColor: slide.accent, boxShadow: `0 8px 20px -5px ${slide.accent}80` }}
                                        >
                                            Start Learning
                                        </button>
                                        <button
                                            className="px-8 py-3 rounded-full bg-white border-2 font-bold text-sm text-ink transition-colors hover:bg-gray-50"
                                            style={{ borderColor: slide.accent, color: slide.textGlow === 'rgba(232,168,56,0.1)' ? '#b45309' : '#1a1a2e' }} /* Contrast fix */
                                        >
                                            Explore Courses
                                        </button>
                                    </div>
                                </div>

                                {/* RIGHT: 3D Scene */}
                                <div className="flex-1 w-full h-[40vh] md:h-[60vh] relative perspective-1000 transform-gpu">
                                    <div className={`w-full h-full transition-all duration-1000 ease-out ${isActive ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10'}`}>
                                        <Scene />
                                    </div>
                                </div>

                            </div>

                            {/* Number Indicator */}
                            <div className="absolute bottom-10 left-6 md:left-16 flex items-center gap-4 text-xs font-bold text-ink/40 tracking-widest z-20">
                                <span style={{ color: slide.accent }}>{String(si + 1).padStart(2, "0")}</span>
                                <div className="h-px w-8 bg-gray-300"></div>
                                <span>{String(slides.length).padStart(2, "0")}</span>
                            </div>

                            {/* Scroll Hint (Mobile only/Desktop) */}
                            {si === 0 && (
                                <div className="absolute bottom-10 right-6 md:right-16 text-xs font-bold text-ink/40 flex items-center gap-2 animate-pulse z-20">
                                    <span>SCROLL TO EXPLORE</span>
                                    <span>→</span>
                                </div>
                            )}

                        </div>
                    );
                })}
            </div>

            {/* Slide Dots Control (Bottom Center) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                {slides.map((s, i) => (
                    <button key={i} onClick={() => {
                        const el = containerRef.current;
                        if (el) {
                            const max = el.scrollWidth - el.clientWidth;
                            el.scrollTo({ left: (i / (slides.length - 1)) * max, behavior: "smooth" });
                        }
                    }}
                        className="h-2 rounded-full transition-all duration-300 shadow-sm"
                        style={{
                            width: i === activeSlide ? 32 : 8,
                            backgroundColor: i === activeSlide ? s.accent : "#e2e8f0"
                        }} />
                ))}
            </div>
        </div>
    );
}
