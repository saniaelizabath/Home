import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { loginAdmin, loginStudent, loginTeacher, resetStudentPassword, generateTeacherOtp, resetTeacherPassword } from "../../authService";

const ROLE_META = {
    student: { icon: "🎓", accent: "#3B5BDB", label: "Student", light: "#E8EEFF" },
    teacher: { icon: "👩‍🏫", accent: "#20C997", label: "Teacher", light: "#E6FCF5" },
    admin: { icon: "🛡️", accent: "#FF6B6B", label: "Admin", light: "#FFF0F0" },
};

const ROLE_REDIRECT = {
    student: "/student/dashboard",
    teacher: "/teacher/dashboard",
    admin: "/admin/dashboard",
};

export default function LoginPage() {
    const [params] = useSearchParams();
    const role = params.get("role") ?? "student";
    const meta = ROLE_META[role] ?? ROLE_META.student;
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [msg, setMsg] = useState("");

    // Reset flow states
    const [isResetMode, setIsResetMode] = useState(false);
    const [resetStep, setResetStep] = useState(1); // 1 = Email, 2 = Verify OTP (Teacher) & New Pass
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); setMsg("");
        if (!form.email || !form.password) { setError("Please fill in all fields."); return; }

        setLoading(true);
        try {
            let profile;

            if (role === "admin") {
                // loginAdmin validates credentials instantly (hardcoded check).
                // Firestore seeding runs in the background inside loginAdmin.
                profile = await loginAdmin(form.email, form.password);

            } else if (role === "teacher") {
                // Validates against teacher record stored by admin in Firestore
                profile = await loginTeacher(form.email, form.password);

            } else {
                // Student: Firebase Auth + Firestore profile fetch
                profile = await loginStudent(form.email, form.password);
            }

            login({ ...profile, role });
            navigate(ROLE_REDIRECT[role]);
        } catch (err) {
            console.error(err);
            // Clean up Firebase Auth error codes for display
            const msg = err.message.replace(/Firebase: |Error \(auth\/.*?\)\./g, "").trim();
            setError(msg || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setError(""); setMsg("");
        if (!form.email) { setError("Please enter your email."); return; }

        setLoading(true);
        try {
            if (role === "teacher") {
                if (resetStep === 1) {
                    // Send OTP
                    const { otp } = await generateTeacherOtp(form.email);
                    const res = await fetch('/api/send-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: form.email, otp })
                    });

                    if (!res.ok) throw new Error("Failed to send verification email.");
                    setMsg("A 6-digit verification code has been sent to your email.");
                    setResetStep(2);
                } else if (resetStep === 2) {
                    // Verify OTP and set new password
                    if (!otp || !newPassword) throw new Error("Please enter OTP and new password.");
                    await resetTeacherPassword(form.email, otp, newPassword);
                    setMsg("Password reset successfully! You can now log in.");
                    setIsResetMode(false);
                    setResetStep(1);
                    setOtp("");
                    setNewPassword("");
                    setForm(p => ({ ...p, password: "" }));
                }
            } else {
                // Admin & Student
                await resetStudentPassword(form.email);
                setMsg("A password reset link has been sent to your email.");
                setIsResetMode(false);
            }
        } catch (err) {
            console.error(err);
            const msg = err.message.replace(/Firebase: |Error \(auth\/.*?\)\./g, "").trim();
            setError(msg || "Failed to reset password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #0d1117 0%, #1a1a2e 60%, #0b1a40 100%)",
            padding: "24px", fontFamily: "var(--font-body)",
        }}>
            {/* Background dots */}
            <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

            <div style={{
                background: "#fff", borderRadius: 28,
                padding: "clamp(32px,5vw,56px)", maxWidth: 440, width: "100%",
                boxShadow: "0 32px 80px rgba(0,0,0,0.5)", position: "relative",
                animation: "slideUp 0.35s cubic-bezier(.4,0,.2,1)",
            }}>
                {/* Role badge */}
                <div style={{
                    background: meta.light, color: meta.accent,
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "8px 20px", borderRadius: 30, fontSize: 13, fontWeight: 700,
                    marginBottom: 28, letterSpacing: "0.06em",
                }}>
                    {meta.icon} {meta.label} Login
                </div>

                <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>
                    Welcome back
                </h1>
                <p style={{ color: "#888", fontSize: 14, marginBottom: 32 }}>
                    Sign in to access your {meta.label.toLowerCase()} portal
                </p>

                {/* Role-specific hints */}
                {role === "admin" && (
                    <div style={{ background: "#FFF0F0", color: "#FF6B6B", border: "1px solid #ffc2c2", borderRadius: 12, padding: "12px 16px", fontSize: 13, marginBottom: 20 }}>
                        🛡️ Admin login is restricted. Use your admin credentials.
                    </div>
                )}
                {role === "teacher" && (
                    <div style={{ background: "#E6FCF5", color: "#20C997", border: "1px solid #b2eed9", borderRadius: 12, padding: "12px 16px", fontSize: 13, marginBottom: 20 }}>
                        👩‍🏫 Use the email &amp; password provided by your admin.
                    </div>
                )}

                {error && (
                    <div style={{ background: "#FFF0F0", color: "#FF6B6B", border: "1px solid #ffc2c2", borderRadius: 12, padding: "12px 16px", fontSize: 14, marginBottom: 20 }}>
                        {error}
                    </div>
                )}
                {msg && (
                    <div style={{ background: "#E6FCF5", color: "#20C997", border: "1px solid #b2eed9", borderRadius: 12, padding: "12px 16px", fontSize: 14, marginBottom: 20 }}>
                        {msg}
                    </div>
                )}

                {!isResetMode ? (
                    <form onSubmit={handleSubmit}>
                        {["email", "password"].map(field => (
                            <div key={field} style={{ marginBottom: 20 }}>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#444", textTransform: "capitalize", marginBottom: 8 }}>{field}</label>
                                <input
                                    name={field} type={field} value={form[field]} onChange={handleChange}
                                    placeholder={field === "email" ? "you@example.com" : "••••••••"}
                                    style={{
                                        width: "100%", padding: "14px 16px", borderRadius: 14, fontSize: 15,
                                        border: "2px solid #eee", outline: "none", transition: "border 0.2s",
                                        background: "#fafbff", fontFamily: "var(--font-body)", boxSizing: "border-box",
                                    }}
                                    onFocus={e => e.target.style.border = `2px solid ${meta.accent}`}
                                    onBlur={e => e.target.style.border = "2px solid #eee"}
                                />
                            </div>
                        ))}

                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                            <span onClick={() => { setIsResetMode(true); setError(""); setMsg(""); }} style={{ color: meta.accent, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                                Forgot Password?
                            </span>
                        </div>

                        <button type="submit" disabled={loading} style={{
                            width: "100%", padding: "16px", borderRadius: 14, fontSize: 15, fontWeight: 800,
                            background: loading ? "#ccc" : meta.accent, color: "#fff", border: "none",
                            cursor: loading ? "not-allowed" : "pointer", marginTop: 8,
                            transition: "all 0.2s", boxShadow: `0 8px 28px ${meta.accent}44`,
                        }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-2px)"; }}
                            onMouseLeave={e => e.currentTarget.style.transform = "none"}
                        >
                            {loading ? "Signing in…" : `Sign in as ${meta.label} →`}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleReset}>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 8 }}>Email</label>
                            <input
                                name="email" type="email" value={form.email} onChange={handleChange}
                                placeholder="you@example.com"
                                disabled={role === "teacher" && resetStep === 2}
                                style={{
                                    width: "100%", padding: "14px 16px", borderRadius: 14, fontSize: 15,
                                    border: "2px solid #eee", outline: "none", transition: "border 0.2s",
                                    background: "#fafbff", fontFamily: "var(--font-body)", boxSizing: "border-box",
                                }}
                                onFocus={e => e.target.style.border = `2px solid ${meta.accent}`}
                                onBlur={e => e.target.style.border = "2px solid #eee"}
                            />
                        </div>

                        {role === "teacher" && resetStep === 2 && (
                            <>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 8 }}>6-Digit OTP</label>
                                    <input
                                        type="text" value={otp} onChange={e => setOtp(e.target.value)}
                                        placeholder="123456" maxLength={6}
                                        style={{
                                            width: "100%", padding: "14px 16px", borderRadius: 14, fontSize: 15, letterSpacing: "4px",
                                            border: "2px solid #eee", outline: "none", transition: "border 0.2s",
                                            background: "#fafbff", fontFamily: "var(--font-body)", boxSizing: "border-box",
                                        }}
                                        onFocus={e => e.target.style.border = `2px solid ${meta.accent}`}
                                        onBlur={e => e.target.style.border = "2px solid #eee"}
                                    />
                                </div>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 8 }}>New Password</label>
                                    <input
                                        type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        style={{
                                            width: "100%", padding: "14px 16px", borderRadius: 14, fontSize: 15,
                                            border: "2px solid #eee", outline: "none", transition: "border 0.2s",
                                            background: "#fafbff", fontFamily: "var(--font-body)", boxSizing: "border-box",
                                        }}
                                        onFocus={e => e.target.style.border = `2px solid ${meta.accent}`}
                                        onBlur={e => e.target.style.border = "2px solid #eee"}
                                    />
                                </div>
                            </>
                        )}

                        <button type="submit" disabled={loading} style={{
                            width: "100%", padding: "16px", borderRadius: 14, fontSize: 15, fontWeight: 800,
                            background: loading ? "#ccc" : meta.accent, color: "#fff", border: "none",
                            cursor: loading ? "not-allowed" : "pointer", marginTop: 8,
                            transition: "all 0.2s", boxShadow: `0 8px 28px ${meta.accent}44`,
                        }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-2px)"; }}
                            onMouseLeave={e => e.currentTarget.style.transform = "none"}
                        >
                            {loading ? "Processing…" : (role === "teacher" && resetStep === 2 ? "Reset Password" : "Send Reset Link")}
                        </button>

                        <div style={{ textAlign: "center", marginTop: 16 }}>
                            <span onClick={() => { setIsResetMode(false); setResetStep(1); setError(""); setMsg(""); }} style={{ color: "#888", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                                ← Back to Login
                            </span>
                        </div>
                    </form>
                )}

                {role === "student" && (
                    <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#888" }}>
                        Don't have an account?{" "}
                        <Link to={`/signup?role=${role}`} style={{ color: meta.accent, fontWeight: 700, textDecoration: "none" }}>Sign up</Link>
                    </p>
                )}
                <p style={{ textAlign: "center", marginTop: 8, fontSize: 13, color: "#bbb" }}>
                    <Link to="/" style={{ color: "#bbb", textDecoration: "none" }}>← Back to home</Link>
                </p>
            </div>

            <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:none } }`}</style>
        </div>
    );
}
