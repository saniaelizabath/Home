import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ROLES = [
    {
        key: "student",
        icon: "🎓",
        title: "Student",
        accent: "#4C6EF5",
        canSignup: true,
    },
    {
        key: "teacher",
        icon: "👩‍🏫",
        title: "Teacher",
        accent: "#20C997",
        canSignup: false,
    },
    {
        key: "admin",
        icon: "🛡️",
        title: "Admin",
        accent: "#FF6B6B",
        canSignup: false,
    },
];

export default function RoleSelectModal({ onClose }) {
    const navigate = useNavigate();
    const [hovered, setHovered] = useState(null);

    const pick = (role, action) => {
        navigate(`/${action}?role=${role}`);
        onClose?.();
    };

    return (
        /* Full-screen dimmed backdrop */
        <div
            className="role-modal-overlay"
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                /* semi-transparent so the page shows behind */

                display: "flex",
                alignItems: "flex-start",
                /* pushes the card below the sticky PillNav (~60-70 px tall) + extra half cm down */
                paddingTop: "92px",
                animation: "fadeIn 0.2s ease",
            }}
        >
            {/* Dropdown card */}
            <div
                className="role-modal-box"
                onClick={e => e.stopPropagation()}
                style={{
                    /* blue-glass look that mirrors the dark header */
                    background: "linear-gradient(145deg, rgba(13,17,55,0.97) 0%, rgba(26,26,80,0.97) 100%)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 20,
                    padding: "30px 20px 20px",
                    width: 320,
                    boxShadow: "0 20px 60px rgba(0,0,30,0.55), 0 0 0 1px rgba(80,100,255,0.15)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    animation: "dropDown 0.25s cubic-bezier(.4,0,.2,1)",
                    fontFamily: "var(--font-body, sans-serif)",
                }}
            >
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 18 }}>
                    <p style={{
                        fontSize: 11, fontWeight: 800, letterSpacing: "0.14em",
                        textTransform: "uppercase", color: "#818cf8", margin: 0,
                    }}>
                        Select Portal
                    </p>
                    <h3 style={{
                        fontFamily: "var(--font-display, sans-serif)",
                        fontSize: 20, fontWeight: 900, color: "#fff",
                        margin: "6px 0 0",
                    }}>
                        Who are you?
                    </h3>
                </div>

                {/* Role rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {ROLES.map(r => (
                        <div
                            key={r.key}
                            onMouseEnter={() => setHovered(r.key)}
                            onMouseLeave={() => setHovered(null)}
                            style={{
                                background: hovered === r.key
                                    ? "rgba(255,255,255,0.07)"
                                    : "rgba(255,255,255,0.04)",
                                border: `1px solid ${hovered === r.key ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)"}`,
                                borderRadius: 14,
                                padding: "12px 14px",
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                transition: "all 0.2s ease",
                            }}
                        >
                            {/* Icon circle */}
                            <div style={{
                                width: 40, height: 40, flexShrink: 0,
                                borderRadius: "50%",
                                background: `${r.accent}22`,
                                border: `1.5px solid ${r.accent}55`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 18,
                            }}>
                                {r.icon}
                            </div>

                            {/* Label */}
                            <span style={{
                                flex: 1, fontWeight: 700, fontSize: 15,
                                color: "#fff",
                            }}>
                                {r.title}
                            </span>

                            {/* Buttons */}
                            <div style={{ display: "flex", gap: 6 }}>
                                {/* Login */}
                                <button
                                    onClick={() => pick(r.key, "login")}
                                    style={{
                                        padding: "7px 14px",
                                        borderRadius: 30, fontSize: 12, fontWeight: 800,
                                        background: r.accent,
                                        color: "#fff",
                                        border: "none",
                                        cursor: "pointer",
                                        boxShadow: `0 4px 12px ${r.accent}44`,
                                        transition: "opacity 0.15s",
                                        whiteSpace: "nowrap",
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                                >
                                    Login
                                </button>

                                {/* Sign Up — students only */}
                                {r.canSignup && (
                                    <button
                                        onClick={() => pick(r.key, "signup")}
                                        style={{
                                            padding: "7px 14px",
                                            borderRadius: 30, fontSize: 12, fontWeight: 800,
                                            background: "transparent",
                                            color: r.accent,
                                            border: `1.5px solid ${r.accent}`,
                                            cursor: "pointer",
                                            transition: "all 0.15s",
                                            whiteSpace: "nowrap",
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = `${r.accent}22`;
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = "transparent";
                                        }}
                                    >
                                        Sign Up
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dismiss */}
                <button
                    onClick={onClose}
                    style={{
                        display: "block", margin: "16px auto 0",
                        background: "none", border: "none",
                        color: "rgba(255,255,255,0.35)",
                        cursor: "pointer", fontSize: 12, fontWeight: 600,
                    }}
                >
                    ✕ Dismiss
                </button>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
                @keyframes dropDown { from { opacity:0; transform:translateY(-12px) } to { opacity:1; transform:none } }
                
                .role-modal-overlay {
                    justify-content: center;
                }
                
                @media (min-width: 1024px) {
                    .role-modal-overlay {
                        justify-content: flex-end !important;
                        padding-right: calc(max(0px, 50vw - 720px) + 32px) !important;
                    }
                }
            `}</style>
        </div>
    );
}
