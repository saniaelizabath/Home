import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import useIsMobile from "../../hooks/useIsMobile";

export default function ProgressDashboard() {
    const { user } = useAuth();
    const isMobile = useIsMobile(900);
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("tests"); // "tests" or "assignments"

    const target = Number(user?.targetAggregate ?? 90);

    useEffect(() => {
        if (!user?.uid) { setLoading(false); return; }
        getDocs(
            query(collection(db, "testScores"),
                where("studentId", "==", user.uid))
        ).then(snap => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Sort locally to avoid needing a Firestore Composite Index
            data.sort((a, b) => {
                const dateA = a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(a.submittedAt || 0);
                const dateB = b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(b.submittedAt || 0);
                return dateA - dateB;
            });
            setScores(data);
        }).catch(console.error).finally(() => setLoading(false));
    }, [user?.uid]);

    const formatDate = (ts) => {
        if (!ts) return "—";
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    };

    // Filter scores based on active tab
    // Older test scores might missing "type" field, so default them to "test"
    const viewScores = scores.filter(s => {
        const type = s.type || "test";
        return activeTab === "tests" ? type === "test" : type === "assignment";
    });

    // Calculate aggregate dynamically from fetched viewScores
    const totalEarned = viewScores.reduce((a, b) => a + (Number(b.score) || 0), 0);
    const totalMax = viewScores.reduce((a, b) => a + (Number(b.max) || 100), 0);
    const current = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
    const progressPct = target > 0 ? Math.min((current / target) * 100, 100) : 0;

    // Build monthly chart data
    const monthlyMap = {};
    viewScores.forEach(s => {
        const d = s.submittedAt?.toDate ? s.submittedAt.toDate() : new Date(s.submittedAt);
        const label = d.toLocaleDateString("en-IN", { month: "short" });
        if (!monthlyMap[label]) monthlyMap[label] = [];
        monthlyMap[label].push((s.score / (s.max || 100)) * 100);
    });
    const monthlyData = Object.entries(monthlyMap).map(([label, vals]) => ({
        label, avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }));
    const graphMax = monthlyData.length ? Math.max(...monthlyData.map(m => m.avg)) : 100;

    const bestPct = viewScores.length ? Math.max(...viewScores.map(s => {
        const score = Number(s.score) || 0;
        const max = Number(s.max) || 100;
        return Math.round((score / max) * 100);
    })) : 0;

    const downloadReport = () => {
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Progress Report - ${user?.name || "Student"}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #eee; }
                h1 { color: #1a1a2e; margin: 0 0 10px 0; }
                .stats { display: flex; gap: 20px; justify-content: center; margin-bottom: 40px; }
                .stat-box { background: #f8f9ff; padding: 20px 40px; border-radius: 12px; text-align: center; border: 1px solid #e1e7ff; }
                .stat-value { font-size: 28px; font-weight: bold; color: #3B5BDB; }
                .stat-label { font-size: 14px; color: #666; font-weight: 600; margin-top: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f4f6fb; color: #555; font-weight: 600; text-transform: uppercase; font-size: 12px; }
                .grade { padding: 4px 10px; border-radius: 20px; font-weight: bold; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Academic Progress Report</h1>
                <p>Student: <strong>${user?.name || "N/A"}</strong> | Email: ${user?.email || "N/A"}</p>
                <p>Report Type: <strong>${activeTab === "tests" ? "Tests" : "Assignments"}</strong> | Date: ${new Date().toLocaleDateString("en-IN")}</p>
            </div>
            
            <div class="stats">
                <div class="stat-box">
                    <div class="stat-value">${current}%</div>
                    <div class="stat-label">Current Aggregate</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${target}%</div>
                    <div class="stat-label">Target Aggregate</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${viewScores.length}</div>
                    <div class="stat-label">Completed</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${viewScores.length ? bestPct + '%' : '—'}</div>
                    <div class="stat-label">Best Score</div>
                </div>
            </div>

            <h2>Detailed Scores</h2>
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Date</th>
                        <th>Score</th>
                        <th>Max</th>
                        <th>Percentage</th>
                        <th>Grade</th>
                    </tr>
                </thead>
                <tbody>
                    ${viewScores.map(t => {
            const score = Number(t.score) || 0;
            const max = Number(t.max) || 100;
            const pct = Math.round((score / max) * 100);
            const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : "D";
            return `
                        <tr>
                            <td><strong>${t.testName || t.subject || "Item"}</strong></td>
                            <td>${formatDate(t.submittedAt)}</td>
                            <td>${score}</td>
                            <td>${max}</td>
                            <td>${pct}%</td>
                            <td><span class="grade">${grade}</span></td>
                        </tr>
                        `;
        }).join("")}
                    ${viewScores.length === 0 ? '<tr><td colspan="6" style="text-align:center;">No records found.</td></tr>' : ''}
                </tbody>
            </table>
        </body>
        </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${user?.name || "Student"}_${activeTab}_Report.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <DashboardLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Progress Dashboard</h1>
                    <p style={{ color: "#888", margin: 0 }}>Track your performance and goal progress</p>
                </div>
                <button
                    onClick={downloadReport}
                    style={{ background: "#3B5BDB", color: "#fff", padding: "10px 20px", borderRadius: 12, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", gap: 8, alignItems: "center" }}
                >
                    <span>📥</span> Download Report (HTML)
                </button>
            </div>

            {/* CONTENT TABS */}
            <div style={{ display: "flex", gap: 10, borderBottom: "2px solid #f0f2ff", paddingBottom: 16, marginBottom: 24, flexWrap: "wrap" }}>
                {[
                    { id: "tests", label: "Tests" },
                    { id: "assignments", label: "Assignments" }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                        padding: "8px 20px", borderRadius: 30, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer",
                        background: activeTab === tab.id ? "#3B5BDB" : "transparent",
                        color: activeTab === tab.id ? "#fff" : "#888",
                        transition: "all 0.2s"
                    }}>{tab.label}</button>
                ))}
            </div>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 20, marginBottom: 32 }}>
                {[
                    { label: "Current Aggregate", value: current ? `${current}%` : "—", icon: "📊", color: "#3B5BDB", bg: "#E8EEFF" },
                    { label: "Target Aggregate", value: `${target}%`, icon: "🏆", color: "#e67700", bg: "#FFF9DB" },
                    { label: activeTab === "tests" ? "Tests Taken" : "Assignments Done", value: viewScores.length, icon: "📝", color: "#20C997", bg: "#E6FCF5" },
                    { label: "Best Score %", value: viewScores.length ? `${bestPct}%` : "—", icon: "⭐", color: "#FF6B6B", bg: "#FFF0F0" },
                ].map(s => (
                    <div key={s.label} style={{ background: "#fff", borderRadius: 20, padding: "22px 20px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 14 }}>{s.icon}</div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: s.color, fontFamily: "var(--font-display)", marginBottom: 4 }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24, marginBottom: 24 }}>
                {/* Progress vs Goal */}
                <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 20 }}>🎯 {activeTab === "tests" ? "Tests" : "Assignments"} Progress vs Goal</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13, color: "#888", fontWeight: 600 }}>
                        <span>Current: <strong style={{ color: "#3B5BDB" }}>{current}%</strong></span>
                        <span>Target: <strong style={{ color: "#e67700" }}>{target}%</strong></span>
                    </div>
                    <div style={{ background: "#f0f2ff", borderRadius: 30, height: 18, overflow: "hidden", marginBottom: 24 }}>
                        <div style={{ width: `${progressPct}%`, height: "100%", background: "linear-gradient(90deg,#3B5BDB,#7048e8)", borderRadius: 30, transition: "width 1s", position: "relative" }}>
                            <div style={{ position: "absolute", right: 8, top: 0, lineHeight: "18px", fontSize: 10, color: "#fff", fontWeight: 800 }}>{current}%</div>
                        </div>
                    </div>
                    <div style={{ color: "#888", fontSize: 14 }}>
                        {current >= target
                            ? <strong style={{ color: "#20C997" }}>🎉 You've reached your target!</strong>
                            : <>You need <strong style={{ color: "#3B5BDB" }}>{Math.max(0, target - current)}%</strong> more to reach your target!</>
                        }
                    </div>
                </div>

                {/* Monthly Performance chart */}
                <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 20 }}>📈 Monthly Performance</div>
                    {monthlyData.length === 0 ? (
                        <div style={{ color: "#aaa", fontSize: 14 }}>No data yet. Your monthly chart will appear here after graded by teacher.</div>
                    ) : (
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120 }}>
                            {monthlyData.map((m, i) => (
                                <div key={m.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                                    <div style={{ fontSize: 10, color: "#3B5BDB", fontWeight: 700 }}>{m.avg}%</div>
                                    <div style={{
                                        width: "100%", borderRadius: "6px 6px 0 0",
                                        height: `${(m.avg / graphMax) * 90}px`,
                                        background: i === monthlyData.length - 1 ? "linear-gradient(180deg,#3B5BDB,#7048e8)" : "linear-gradient(180deg,#c5d0ff,#dde5ff)",
                                    }} />
                                    <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600 }}>{m.label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Test scores table */}
            <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 20 }}>📋 Recent {activeTab === "tests" ? "Tests" : "Assignments"} Scores</div>
                {loading ? (
                    <div style={{ color: "#aaa", fontSize: 14 }}>Loading scores…</div>
                ) : viewScores.length === 0 ? (
                    <div style={{ color: "#aaa", fontSize: 14 }}>No scored items yet. They'll appear here once your teacher grades them.</div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                            <thead>
                                <tr style={{ background: "#f8f9ff" }}>
                                    {["Title", "Date", "Score", "Max", "Percentage", "Grade"].map(h => (
                                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#888", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {viewScores.map((t, i) => {
                                    const score = Number(t.score) || 0;
                                    const max = Number(t.max) || 100;
                                    const pct = Math.round((score / max) * 100);
                                    const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : "D";
                                    const gradeColors = { "A+": "#20C997", "A": "#3B5BDB", "B": "#e67700", "C": "#FF6B6B", "D": "#aaa" };
                                    return (
                                        <tr key={t.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                                            <td style={{ padding: "14px 16px", fontWeight: 600, color: "#1a1a2e" }}>{t.testName || t.subject || "Item"}</td>
                                            <td style={{ padding: "14px 16px", color: "#888" }}>{formatDate(t.submittedAt)}</td>
                                            <td style={{ padding: "14px 16px", fontWeight: 700, color: "#3B5BDB" }}>{score}</td>
                                            <td style={{ padding: "14px 16px", color: "#888" }}>{max}</td>
                                            <td style={{ padding: "14px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <div style={{ background: "#f0f2ff", borderRadius: 30, height: 8, flex: 1, overflow: "hidden" }}>
                                                        <div style={{ width: `${pct}%`, height: "100%", background: "#3B5BDB", borderRadius: 30 }} />
                                                    </div>
                                                    <span style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e", minWidth: 36 }}>{pct}%</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: "14px 16px" }}>
                                                <span style={{ background: gradeColors[grade] + "22", color: gradeColors[grade], padding: "4px 14px", borderRadius: 20, fontWeight: 800, fontSize: 13 }}>{grade}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
