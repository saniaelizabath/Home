import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const ROLE_META = {
    student: { icon: "🎓", accent: "#3B5BDB", label: "Student", light: "#E8EEFF" },
    teacher: { icon: "👩‍🏫", accent: "#20C997", label: "Teacher", light: "#E6FCF5" },
    admin: { icon: "🛡️", accent: "#FF6B6B", label: "Admin", light: "#FFF0F0" },
};

export default function SignupPage() {
    const [params] = useSearchParams();
    const role = params.get("role") ?? "student";
    const meta = ROLE_META[role] ?? ROLE_META.student;
    const navigate = useNavigate();

    const REGISTER_PATHS = {
        student: "/student/register",
    };

    // Redirect non-students to login
    useEffect(() => {
        if (role !== "student") {
            navigate(`/login?role=${role}`);
        }
    }, [role, navigate]);

    if (role !== "student") return null;

    // Redirect to role-specific registration
    const handleContinue = () => navigate(REGISTER_PATHS.student);

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #0d1117 0%, #1a1a2e 60%, #0b1a40 100%)",
            padding: "24px", fontFamily: "var(--font-body)",
        }}>
            <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

            <div style={{
                background: "#fff", borderRadius: 28,
                padding: "clamp(32px,5vw,56px)", maxWidth: 440, width: "100%",
                boxShadow: "0 32px 80px rgba(0,0,0,0.5)", textAlign: "center",
                animation: "slideUp 0.35s cubic-bezier(.4,0,.2,1)",
            }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>{meta.icon}</div>
                <div style={{
                    background: meta.light, color: meta.accent,
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "8px 20px", borderRadius: 30, fontSize: 13, fontWeight: 700,
                    marginBottom: 24,
                }}>
                    Create {meta.label} Account
                </div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 12 }}>
                    Join Finova Academy
                </h1>
                <p style={{ color: "#888", fontSize: 14, marginBottom: 36, lineHeight: 1.7 }}>
                    You're registering as a <strong style={{ color: meta.accent }}>{meta.label}</strong>.
                    Click below to complete your registration form.
                </p>

                <button onClick={handleContinue} style={{
                    width: "100%", padding: "16px", borderRadius: 14, fontSize: 15, fontWeight: 800,
                    background: meta.accent, color: "#fff", border: "none", cursor: "pointer",
                    marginBottom: 16, transition: "all 0.2s", boxShadow: `0 8px 28px ${meta.accent}44`,
                }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "none"}
                >
                    Continue to Registration →
                </button>

                <p style={{ fontSize: 14, color: "#888", marginTop: 8 }}>
                    Already have an account?{" "}
                    <Link to={`/login?role=${role}`} style={{ color: meta.accent, fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
                </p>
                <p style={{ marginTop: 8, fontSize: 13 }}>
                    <Link to="/" style={{ color: "#bbb", textDecoration: "none" }}>← Back to home</Link>
                </p>
            </div>
        </div>
    );
}
