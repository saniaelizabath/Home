import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { db } from "../../firebase";
import { collection, onSnapshot, updateDoc, deleteDoc, doc, arrayRemove, getDocs, query, where } from "firebase/firestore";
import useIsMobile from "../../hooks/useIsMobile";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ─── Slide Toggle ─────────────────────────────────────────── */
function SlideToggle({ enabled, onToggle }) {
    return (
        <button
            onClick={onToggle}
            title={enabled ? "Click to revoke access" : "Click to grant access"}
            style={{
                position: "relative", width: 52, height: 28, borderRadius: 99,
                background: enabled ? "#20C997" : "#E5E7EB",
                border: "none", cursor: "pointer", flexShrink: 0,
                transition: "background 0.25s",
                padding: 0, outline: "none",
            }}
        >
            <span style={{
                position: "absolute", top: 3, left: enabled ? 27 : 3,
                width: 22, height: 22, borderRadius: "50%", background: "#fff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                transition: "left 0.25s",
                display: "block",
            }} />
        </button>
    );
}

export default function StudentManagement() {
    const isMobile = useIsMobile(900);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedClass, setSelectedClass] = useState("all");
    const [selectedCourse, setSelectedCourse] = useState("all");
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [toggling, setToggling] = useState(null); // id currently being toggled

    /* ── Real-time student list ── */
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "students"), snap => {
            setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }, err => { console.error(err); setLoading(false); });
        return () => unsub();
    }, []);

    /* ── Toggle approval ── */
    const toggleApproval = async (s) => {
        const newStatus = s.status === "active" ? "pending" : "active";
        setToggling(s.id);
        try {
            await updateDoc(doc(db, "students", s.id), { status: newStatus });
            // onSnapshot will update state automatically
        } catch (e) { alert("Error: " + e.message); }
        finally { setToggling(null); }
    };

    /* ── Edit ── */
    const saveEdit = async () => {
        setSaving(true);
        try {
            await updateDoc(doc(db, "students", editingId), {
                name: editForm.name, phone: editForm.phone,
                course: editForm.course, class: editForm.class,
            });
            setEditingId(null);
        } catch (e) { console.error(e); alert("Error: " + e.message); }
        finally { setSaving(false); }
    };

    /* ── Send Report Email ── */
    const [sendingId, setSendingId] = useState(null);
    const sendReport = async (student) => {
        if (!confirm(`Send progress report to ${student.email}?`)) return;
        setSendingId(student.id);
        try {
            // Fetch records
            const [tsSnap, attSnap] = await Promise.all([
                getDocs(query(collection(db, "testScores"), where("studentId", "==", student.id))),
                getDocs(query(collection(db, "attendance"), where("studentId", "==", student.id)))
            ]);

            const tsData = tsSnap.docs.map(d => d.data());
            const attData = attSnap.docs.map(d => d.data());

            // Date formatter utility
            const formatDate = (ts) => {
                if (!ts) return "—";
                const d = ts.toDate ? ts.toDate() : new Date(ts);
                return d.toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' });
            };

            // Process Tests
            const tests = tsData.filter(s => !s.type || s.type === "test").sort((a, b) => (b.submittedAt?.toMillis?.() || 0) - (a.submittedAt?.toMillis?.() || 0));
            const testsEarned = tests.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
            const testsMax = tests.reduce((acc, curr) => acc + (Number(curr.max) || 100), 0);
            const testsPct = testsMax > 0 ? Math.round((testsEarned / testsMax) * 100) : 0;

            // Process Assignments
            const assignments = tsData.filter(s => s.type === "assignment").sort((a, b) => (b.submittedAt?.toMillis?.() || 0) - (a.submittedAt?.toMillis?.() || 0));
            const assignEarned = assignments.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
            const assignMax = assignments.reduce((acc, curr) => acc + (Number(curr.max) || 100), 0);
            const assignPct = assignMax > 0 ? Math.round((assignEarned / assignMax) * 100) : 0;

            // Process Attendance
            const attDataSorted = [...attData].sort((a, b) => (b.date?.toMillis?.() || 0) - (a.date?.toMillis?.() || 0));
            const attPresent = attData.filter(a => a.status === "present" || a.status === "Present").length;
            const attTotal = attData.length;
            const attPct = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0;

            const htmlContent = `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #1a1a2e; text-align: center;">Finova Academy Progress Report</h2>
                    <p><strong>Student:</strong> ${student.name}</p>
                    <p><strong>Course:</strong> ${student.course}</p>
                    <p><strong>Class:</strong> ${student.class}</p>
                    
                    <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px;">Overall Performance</h3>
                    <table style="width: 100%; text-align: left; margin-bottom: 20px;">
                        <tr>
                            <td style="padding: 8px 0;"><strong>Tests Aggregate:</strong></td>
                            <td style="color: ${testsPct >= 50 ? '#20C997' : '#FF6B6B'}; font-weight: bold;">${testsPct}% (${testsEarned}/${testsMax})</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;"><strong>Assignments Aggregate:</strong></td>
                            <td style="color: ${assignPct >= 50 ? '#20C997' : '#FF6B6B'}; font-weight: bold;">${assignPct}% (${assignEarned}/${assignMax})</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;"><strong>Attendance Punctuality:</strong></td>
                            <td style="color: ${attPct >= 75 ? '#20C997' : '#e67700'}; font-weight: bold;">${attPct}% (${attPresent}/${attTotal} Days)</td>
                        </tr>
                    </table>
                    <p style="font-size: 12px; color: #888; text-align: center;">This is an automatically generated report requested by the administration.</p>
                </div>
            `;

            // Generate PDF
            const doc = new jsPDF();
            doc.setFontSize(22);
            doc.setTextColor(26, 26, 46);
            doc.text("Finova Academy", 14, 22);

            doc.setFontSize(16);
            doc.text("Student Progress Report", 14, 32);

            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Student: ${student.name}`, 14, 42);
            doc.text(`Email: ${student.email}`, 14, 48);
            doc.text(`Course: ${student.course || "—"}`, 14, 54);
            doc.text(`Class: ${student.class || "—"}`, 14, 60);

            doc.setTextColor(26, 26, 46);
            doc.setFontSize(14);
            doc.text("Performance Summary", 14, 72);

            autoTable(doc, {
                startY: 76,
                head: [["Metric", "Score / Total", "Percentage"]],
                body: [
                    ["Tests Aggregate", `${testsEarned} / ${testsMax}`, `${testsPct}%`],
                    ["Assignments Aggregate", `${assignEarned} / ${assignMax}`, `${assignPct}%`],
                    ["Attendance Punctuality", `${attPresent} / ${attTotal} Days`, `${attPct}%`]
                ],
                theme: 'grid',
                headStyles: { fillColor: [59, 91, 219] },
                styles: { fontSize: 10 }
            });

            let finalY = doc.lastAutoTable.finalY + 15;

            if (tests.length > 0) {
                doc.setFontSize(14);
                doc.text("Tests Detail", 14, finalY);
                autoTable(doc, {
                    startY: finalY + 4,
                    head: [["Date", "Test Name", "Score"]],
                    body: tests.map(t => [formatDate(t.submittedAt), t.testName || "—", `${t.score} / ${t.max || 100}`]),
                    theme: 'striped',
                    headStyles: { fillColor: [32, 201, 151] },
                    styles: { fontSize: 9 }
                });
                finalY = doc.lastAutoTable.finalY + 15;
            }

            if (assignments.length > 0) {
                if (finalY > 250) { doc.addPage(); finalY = 20; }
                doc.setFontSize(14);
                doc.text("Assignments Detail", 14, finalY);
                autoTable(doc, {
                    startY: finalY + 4,
                    head: [["Date", "Assignment Name", "Score"]],
                    body: assignments.map(a => [formatDate(a.submittedAt), a.testName || "—", `${a.score} / ${a.max || 100}`]),
                    theme: 'striped',
                    headStyles: { fillColor: [81, 207, 102] },
                    styles: { fontSize: 9 }
                });
                finalY = doc.lastAutoTable.finalY + 15;
            }

            if (attDataSorted.length > 0) {
                if (finalY > 250) { doc.addPage(); finalY = 20; }
                doc.setFontSize(14);
                doc.text("Attendance Detail", 14, finalY);
                autoTable(doc, {
                    startY: finalY + 4,
                    head: [["Date", "Course", "Status"]],
                    body: attDataSorted.map(a => [formatDate(a.date), a.courseId || "—", a.status]),
                    theme: 'striped',
                    headStyles: { fillColor: [255, 146, 43] },
                    styles: { fontSize: 9 }
                });
            }

            const pdfBase64 = doc.output('datauristring');

            const res = await fetch("/api/send-report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: student.email,
                    subject: "Student Progress Report - Finova Academy",
                    htmlContent,
                    pdfAttachment: pdfBase64
                })
            });

            // If running local Vite without Vercel CLI, /api returns index.html or 404
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                throw new Error("API Route did not return JSON. Are you running 'npm run dev' instead of 'vercel dev'? Expected a Vercel Serverless Function response.");
            }

            const data = await res.json();
            if (!data.success) throw new Error(data.message || "Failed to send");
            alert("Report sent successfully!");

        } catch (e) {
            console.error(e);
            alert("Error sending report: " + e.message);
        } finally {
            setSendingId(null);
        }
    };

    /* ── Delete ── */
    const remove = async (s) => {
        if (!confirm(`Delete student ${s.name}? This cannot be undone.`)) return;
        try {
            await deleteDoc(doc(db, "students", s.id));
            if (s.courseId) {
                await updateDoc(doc(db, "courses", s.courseId), { enrolledStudents: arrayRemove(s.id) });
            }
        } catch (e) { alert("Error: " + e.message); }
    };

    const uniqueCourses = [...new Set(students.map(s => s.course).filter(Boolean))];

    const filtered = students.filter(s => {
        const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase()) ||
            s.email?.toLowerCase().includes(search.toLowerCase()) ||
            s.course?.toLowerCase().includes(search.toLowerCase());
        const matchClass = selectedClass === "all" || s.class === selectedClass;
        const matchCourse = selectedCourse === "all" || s.course === selectedCourse;
        return matchSearch && matchClass && matchCourse;
    });

    const approved = filtered.filter(s => s.status === "active").length;
    const pending = filtered.filter(s => s.status !== "active").length;

    return (
        <DashboardLayout>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 4 }}>Student Management</h1>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, color: "#888" }}>{students.length} registered</span>
                        <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "#E6FCF5", color: "#20C997" }}>✓ {approved} approved</span>
                        {pending > 0 && <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "#FFF9DB", color: "#e67700" }}>⏳ {pending} pending</span>}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
                <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 6 }}>SEARCH</label>
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Name, email, course…"
                        style={{ width: "100%", padding: "11px", borderRadius: 10, border: "2px solid #eee", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 6 }}>CLASS</label>
                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ width: "100%", padding: "11px", borderRadius: 10, border: "2px solid #eee", fontSize: 14, outline: "none" }}>
                        <option value="all">All Classes</option>
                        <option value="Class 11">Class 11</option>
                        <option value="Class 12">Class 12</option>
                    </select>
                </div>
                <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 6 }}>COURSE/SUBJECT</label>
                    <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} style={{ width: "100%", padding: "11px", borderRadius: 10, border: "2px solid #eee", fontSize: 14, outline: "none" }}>
                        <option value="all">All Courses</option>
                        {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>Loading students…</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>No students found.</div>
                ) : filtered.map((s, i) => (
                    <div key={s.id}>
                        {editingId === s.id ? (
                            /* ── Inline edit form ── */
                            <div style={{ padding: "20px 24px", background: "#f8f9ff", borderBottom: "1px solid #f0f0f0" }}>
                                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4,1fr)", gap: 12, marginBottom: 12 }}>
                                    {[["Name", "name"], ["Phone", "phone"], ["Course", "course"], ["Class", "class"]].map(([label, key]) => (
                                        <div key={key}>
                                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4 }}>{label.toUpperCase()}</label>
                                            <input value={editForm[key] || ""} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))}
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid #eee", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: "flex", gap: 10 }}>
                                    <button onClick={saveEdit} disabled={saving} style={{ padding: "10px 22px", borderRadius: 12, background: "#3B5BDB", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>
                                        {saving ? "Saving…" : "Save"}
                                    </button>
                                    <button onClick={() => setEditingId(null)} style={{ padding: "10px 22px", borderRadius: 12, background: "#f0f2ff", color: "#3B5BDB", fontWeight: 700, border: "none", cursor: "pointer" }}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            /* ── Student row ── */
                            <div style={{ display: "flex", alignItems: "center", padding: "16px 24px", borderBottom: i < filtered.length - 1 ? "1px solid #f5f5f5" : "none", gap: 14, flexWrap: "wrap" }}>
                                {/* Avatar */}
                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: s.status === "active" ? "#E6FCF5" : "#FFF9DB", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: s.status === "active" ? "#20C997" : "#e67700", flexShrink: 0 }}>
                                    {(s.name || "S")[0].toUpperCase()}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, color: "#1a1a2e" }}>{s.name}</div>
                                    <div style={{ fontSize: 12, color: "#888" }}>{s.email} · {s.course} · {s.class}</div>
                                </div>

                                {/* Approval toggle */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: s.status === "active" ? "#20C997" : "#9CA3AF", minWidth: 52, textAlign: "right" }}>
                                        {toggling === s.id ? "…" : s.status === "active" ? "Approved" : "Pending"}
                                    </span>
                                    <SlideToggle
                                        enabled={s.status === "active"}
                                        onToggle={() => !toggling && toggleApproval(s)}
                                    />
                                </div>

                                {/* Actions */}
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button onClick={() => sendReport(s)} disabled={sendingId === s.id} style={{ padding: "7px 14px", borderRadius: 20, background: "#E6FCF5", color: "#20C997", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 12 }}>
                                        {sendingId === s.id ? "Sending…" : "✉️ Send Report"}
                                    </button>
                                    <button onClick={() => { setEditingId(s.id); setEditForm(s); }} style={{ padding: "7px 14px", borderRadius: 20, background: "#E8EEFF", color: "#3B5BDB", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 12 }}>Edit</button>
                                    <button onClick={() => remove(s)} style={{ padding: "7px 14px", borderRadius: 20, background: "#FFF0F0", color: "#FF6B6B", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 12 }}>Delete</button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div style={{ marginTop: 12, fontSize: 12, color: "#9CA3AF", display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span>⬅ Slide left = revoke access</span>
                <span>Slide right ➡ = grant full access</span>
                <span>· Changes apply immediately</span>
            </div>
        </DashboardLayout>
    );
}
