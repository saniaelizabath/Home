import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
    collection, query, where, getDocs, updateDoc, doc, getDoc, addDoc
} from "firebase/firestore";
import useIsMobile from "../../hooks/useIsMobile";

export default function Evaluation() {
    const { user } = useAuth();
    const isMobile = useIsMobile(900);

    // Data states
    const [students, setStudents] = useState([]);
    const [items, setItems] = useState([]); // { id, title, type, class, date, isWritten }
    const [submissionsMap, setSubmissionsMap] = useState({}); // { `${studentId}_${itemId}`: submissionDoc }
    const [loading, setLoading] = useState(true);

    // UI states
    const [selectedClass, setSelectedClass] = useState("Class 11"); // or 12
    const [activeTab, setActiveTab] = useState("tests"); // "tests" | "assignments"
    const [activeItem, setActiveItem] = useState(null); // the clicked assignment/test
    const [grading, setGrading] = useState({}); // { subId: { marks, maxMarks, feedback, editing } }
    const [saving, setSaving] = useState({});

    useEffect(() => {
        if (!(user?.uid || user?.id)) { setLoading(false); return; }

        const fetchData = async () => {
            try {
                // 1. Fetch Students
                const studentSnap = await getDocs(collection(db, "students"));
                const allStudents = studentSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setStudents(allStudents);

                if (user.class && user.class !== "Both") {
                    setSelectedClass(user.class);
                } else {
                    setSelectedClass("Class 11");
                }

                // 2. Fetch Assignments & Tests
                const tid = user?.uid || user?.id;
                const [assignSnap, testSnap] = await Promise.all([
                    getDocs(query(collection(db, "assignments"), where("teacherId", "==", tid))),
                    getDocs(query(collection(db, "tests"), where("teacherId", "==", tid)))
                ]);

                // Map items, parse "time" or "createdAt" for sorting
                const processItems = (snap, type) => snap.docs.map(d => {
                    const data = d.data();
                    const dts = data.createdAt || data.time;
                    const tMillis = dts?.toMillis ? dts.toMillis() : Date.now();
                    return { id: d.id, type, timestamp: tMillis, ...data };
                });

                const allItems = [
                    ...processItems(assignSnap, "assignment"),
                    ...processItems(testSnap, "test")
                ];
                // sort chronologically
                allItems.sort((a, b) => a.timestamp - b.timestamp);
                setItems(allItems);

                if (allItems.length === 0) { setLoading(false); return; }
                const itemIds = allItems.map(i => i.id);

                // 3. Fetch Submissions
                const subs = [];
                for (let i = 0; i < itemIds.length; i += 10) {
                    const chunk = itemIds.slice(i, i + 10);
                    const [s1, s2, s3] = await Promise.all([
                        getDocs(query(collection(db, "submissions"), where("assignmentId", "in", chunk))),
                        getDocs(query(collection(db, "submissions"), where("testId", "in", chunk))),
                        getDocs(query(collection(db, "submissions"), where("itemId", "in", chunk)))
                    ]);
                    s1.docs.forEach(d => subs.push({ id: d.id, ...d.data() }));
                    s2.docs.forEach(d => subs.push({ id: d.id, ...d.data() }));
                    s3.docs.forEach(d => subs.push({ id: d.id, ...d.data() }));
                }

                const sMap = {};
                subs.forEach(s => {
                    const iId = s.itemId || s.assignmentId || s.testId;
                    sMap[`${s.studentId}_${iId}`] = s;
                });
                setSubmissionsMap(sMap);

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.uid, user?.id, user?.class]);

    // Formatting date
    const formatDate = ts => {
        if (!ts) return "—";
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    };

    // Calculate students/completion stats for a given item card
    const getItemStats = (item) => {
        const itemClass = item.class === "Both" ? selectedClass : item.class;
        const targetStudents = students.filter(s => s.class === itemClass);
        let submittedCount = 0;
        let gradedCount = 0;

        targetStudents.forEach(stu => {
            const sub = submissionsMap[`${stu.id}_${item.id}`];
            if (sub) {
                submittedCount++;
                if (sub.marks != null) gradedCount++;
            }
        });

        return { total: targetStudents.length, submitted: submittedCount, graded: gradedCount };
    };

    // Build flat array of virtual & real submissions for the Active Item view
    const getActiveItemSubmissions = () => {
        if (!activeItem) return [];
        const itemClass = activeItem.class === "Both" ? selectedClass : activeItem.class;
        const targetStudents = students.filter(s => s.class === itemClass);
        const enriched = [];

        targetStudents.forEach(stu => {
            const sub = submissionsMap[`${stu.id}_${activeItem.id}`];
            if (sub) {
                enriched.push({ ...sub, studentName: stu.name, isVirtual: false });
            } else {
                enriched.push({
                    id: `virtual_${stu.id}_${activeItem.id}`,
                    studentId: stu.id,
                    studentName: stu.name,
                    status: "Not Attempted",
                    marks: null,
                    isVirtual: true
                });
            }
        });
        return enriched; // we can sort these by status or name if needed
    };

    // Save Grade action (reused logic)
    const saveGrade = async (subId, entry) => {
        const grade = grading[subId];
        if (!grade?.marks) { alert("Enter marks first."); return; }
        const marksNum = Number(grade.marks);
        const maxNum = Number(grade.maxMarks || 100);

        setSaving(p => ({ ...p, [subId]: true }));
        try {
            if (entry.isVirtual) {
                // Block unattempted written tests
                if (activeItem.type === "test" && activeItem.isWritten) {
                    alert("Cannot grade an unattempted written test.");
                    return;
                }
                const payload = {
                    itemId: activeItem.id,
                    testId: activeItem.id,
                    studentId: entry.studentId,
                    studentName: entry.studentName,
                    type: activeItem.type,
                    status: "Evaluated",
                    marks: marksNum,
                    feedback: grade.feedback || "",
                    submittedAt: new Date()
                };
                const newDocRef = await addDoc(collection(db, "submissions"), payload);
                subId = newDocRef.id;

                // Write to testScores for ALL item types (test & assignment)
                await addDoc(collection(db, "testScores"), {
                    studentId: entry.studentId,
                    testId: activeItem.id,
                    testName: activeItem.title,
                    type: activeItem.type,
                    score: marksNum,
                    max: maxNum,
                    submittedAt: new Date()
                });

                setSubmissionsMap(p => ({ ...p, [`${entry.studentId}_${activeItem.id}`]: { id: subId, ...payload } }));
            } else {
                // Update
                await updateDoc(doc(db, "submissions", subId), {
                    marks: marksNum,
                    feedback: grade.feedback || "",
                });

                // Update testScores for ALL item types (test & assignment)
                const scoreQuery = query(collection(db, "testScores"), where("studentId", "==", entry.studentId), where("testId", "==", entry.testId || entry.itemId));
                const scoreSnap = await getDocs(scoreQuery);
                if (!scoreSnap.empty) {
                    await updateDoc(doc(db, "testScores", scoreSnap.docs[0].id), {
                        score: marksNum, max: maxNum, submittedAt: new Date()
                    });
                } else {
                    await addDoc(collection(db, "testScores"), {
                        studentId: entry.studentId,
                        testId: entry.testId || entry.itemId,
                        testName: activeItem.title,
                        type: activeItem.type,
                        score: marksNum,
                        max: maxNum,
                        submittedAt: new Date()
                    });
                }
                setSubmissionsMap(p => {
                    const m = { ...p };
                    const k = `${entry.studentId}_${activeItem.id}`;
                    m[k] = { ...m[k], marks: marksNum, feedback: grade.feedback };
                    return m;
                });
            }

            // clear form & disable editing
            setGrading(p => {
                const n = { ...p };
                if (n[subId]) n[subId].editing = false;
                return n;
            });
        } catch (e) {
            console.error(e);
            alert("Error: " + e.message);
        } finally {
            setSaving(p => ({ ...p, [subId]: false, [entry.id]: false }));
        }
    };

    // Filter items by selected class + tab
    const viewItems = items.filter(i =>
        (i.class === "Both" || i.class === selectedClass) &&
        (i.type === activeTab.slice(0, -1)) // "tests" -> "test", "assignments" -> "assignment"
    );

    if (loading) return <DashboardLayout><div style={{ padding: 40, textAlign: "center", color: "#888" }}>Loading evaluation dashboard...</div></DashboardLayout>;

    // ─── ACTIVE ITEM VIEW (Grading mode) ───
    if (activeItem) {
        const activeSubs = getActiveItemSubmissions();
        const stats = getItemStats(activeItem);

        return (
            <DashboardLayout>
                <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24 }}>
                    <button onClick={() => setActiveItem(null)} style={{ background: "#f0f2ff", color: "#3B5BDB", border: "none", padding: "10px 18px", borderRadius: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                        ← Back
                    </button>
                    <div>
                        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 900, color: "#1a1a2e", marginBottom: 4 }}>{activeItem.title}</h1>
                        <div style={{ color: "#888", fontSize: 13, display: "flex", gap: 12, fontWeight: 600 }}>
                            <span>{activeItem.type === "test" ? (activeItem.isWritten ? "📝 Written Test" : "💻 Online Test") : "📚 Assignment"}</span>
                            <span>•</span>
                            <span style={{ color: "#20C997" }}>{stats.graded} / {stats.total} Graded</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: "grid", gap: 16 }}>
                    {activeSubs.map(s => {
                        const canGrade = !(s.isVirtual && activeItem.type === "test" && activeItem.isWritten);
                        const isGraded = s.marks != null;
                        const editing = grading[s.id]?.editing;
                        // For display logic: if graded and NOT explicitly editing, show simple view
                        const showForm = !isGraded || editing;

                        return (
                            <div key={s.id} style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", borderLeft: isGraded ? "6px solid #20C997" : s.status === "Late" ? "6px solid #FF6B6B" : "6px solid #F3F4F6", transition: "all 0.2s" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: showForm || (s.fileURL || s.driveLink) ? 16 : 0 }}>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", display: "flex", gap: 8, alignItems: "center" }}>
                                            {s.studentName}
                                            {s.isVirtual && <span style={{ background: "#FFF0F0", color: "#FF6B6B", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>Not Attempted</span>}
                                            {s.status === "Late" && <span style={{ background: "#FFF0F0", color: "#FF6B6B", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>Late Submission</span>}
                                        </div>
                                        {!s.isVirtual && <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Submitted: {formatDate(s.submittedAt)}</div>}
                                    </div>

                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        {!showForm && isGraded && (
                                            <>
                                                <span style={{ fontSize: 14, fontWeight: 800, color: "#20C997", background: "#E6FCF5", padding: "6px 16px", borderRadius: 20 }}>
                                                    {s.marks} Marks
                                                </span>
                                                <button onClick={() => setGrading(p => ({ ...p, [s.id]: { marks: s.marks, maxMarks: 100, feedback: s.feedback, editing: true } }))} style={{ background: "transparent", color: "#888", border: "1px solid #ddd", borderRadius: 12, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Edit Grade</button>
                                            </>
                                        )}
                                        {s.fileURL && <a href={s.fileURL} target="_blank" rel="noreferrer" style={{ padding: "8px 16px", borderRadius: 20, background: "#E8EEFF", color: "#3B5BDB", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>📄 View File</a>}
                                        {s.driveLink && <a href={s.driveLink} target="_blank" rel="noreferrer" style={{ padding: "8px 16px", borderRadius: 20, background: "#E8EEFF", color: "#3B5BDB", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>🔗 View Drive</a>}
                                    </div>
                                </div>

                                {showForm && (
                                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "80px 80px 1fr auto", gap: 10, alignItems: "flex-end", opacity: canGrade ? 1 : 0.4 }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4 }}>MARKS</label>
                                            <input type="number" min="0" disabled={!canGrade}
                                                value={grading[s.id]?.marks ?? ""}
                                                onChange={e => setGrading(p => ({ ...p, [s.id]: { ...p[s.id], editing: true, marks: e.target.value } }))}
                                                placeholder={isGraded ? String(s.marks) : "0"}
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid #eee", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4 }}>MAX</label>
                                            <input type="number" min="1" disabled={!canGrade}
                                                value={grading[s.id]?.maxMarks ?? 100}
                                                onChange={e => setGrading(p => ({ ...p, [s.id]: { ...p[s.id], editing: true, maxMarks: e.target.value } }))}
                                                placeholder="100"
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid #eee", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4 }}>FEEDBACK</label>
                                            <input disabled={!canGrade}
                                                value={grading[s.id]?.feedback ?? ""}
                                                onChange={e => setGrading(p => ({ ...p, [s.id]: { ...p[s.id], editing: true, feedback: e.target.value } }))}
                                                placeholder={!canGrade ? "Waiting for submission..." : isGraded ? String(s.feedback || "") : "Excellent / Needs work..."}
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid #eee", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                                            />
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            {editing && <button onClick={() => setGrading(p => { const n = { ...p }; delete n[s.id]; return n; })} style={{ padding: "11px 16px", borderRadius: 12, background: "#F3F4F6", color: "#374151", fontWeight: 700, border: "none", cursor: "pointer" }}>Cancel</button>}
                                            <button onClick={() => saveGrade(s.id, s)} disabled={saving[s.id] || !canGrade} style={{ padding: "11px 22px", borderRadius: 12, background: "#3B5BDB", color: "#fff", fontWeight: 700, border: "none", cursor: canGrade ? "pointer" : "not-allowed", whiteSpace: "nowrap" }}>
                                                {saving[s.id] ? "Saving…" : isGraded ? "Update Grade" : "Save Grade"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </DashboardLayout>
        );
    }

    // ─── MAIN LISTING VIEW (Classes -> Tabs -> Items) ───
    return (
        <DashboardLayout>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Evaluation</h1>
            <p style={{ color: "#888", marginBottom: 24 }}>Select a class and an assignment to begin grading submissions.</p>

            {/* CLASS FILTER */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                {["Class 11", "Class 12"].map(cls => (
                    <button key={cls} onClick={() => setSelectedClass(cls)} style={{
                        padding: "10px 24px", borderRadius: 14, fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer",
                        background: selectedClass === cls ? "#1a1a2e" : "#f0f2ff", color: selectedClass === cls ? "#fff" : "#1a1a2e", boxSizing: "border-box"
                    }}>{cls}</button>
                ))}
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

            {/* ITEM GRID */}
            {viewItems.length === 0 ? (
                <div style={{ background: "#fff", borderRadius: 20, padding: 40, textAlign: "center", color: "#aaa", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                    <div style={{ fontWeight: 700 }}>No {activeTab} defined for {selectedClass}.</div>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                    {viewItems.map(item => {
                        const stats = getItemStats(item);
                        const progress = stats.total > 0 ? (stats.graded / stats.total) * 100 : 0;
                        const fullyGraded = stats.total > 0 && stats.graded === stats.total;

                        return (
                            <div key={item.id}
                                onClick={() => setActiveItem(item)}
                                style={{
                                    background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", cursor: "pointer",
                                    border: "2px solid transparent", transition: "all 0.2s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
                                onMouseLeave={e => e.currentTarget.style.transform = "none"}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1a1a2e" }}>{item.title}</h3>
                                    {fullyGraded && <div style={{ background: "#E6FCF5", color: "#20C997", padding: "4px 8px", borderRadius: 12, fontSize: 10, fontWeight: 800 }}>Completed</div>}
                                </div>
                                <div style={{ fontSize: 12, color: "#888", marginBottom: 20, fontWeight: 600 }}>
                                    {/* Format item.timestamp into a readable date string if needed, or stick to simpler metadata */}
                                    {new Date(item.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                                </div>

                                {/* Progress Bar Mini */}
                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6 }}>
                                        <span>Grading Progress</span>
                                        <span style={{ color: "#1a1a2e" }}>{stats.graded} / {stats.total}</span>
                                    </div>
                                    <div style={{ background: "#F3F4F6", borderRadius: 10, height: 6, overflow: "hidden" }}>
                                        <div style={{ width: `${progress}%`, background: fullyGraded ? "#20C997" : "#3B5BDB", height: "100%", borderRadius: 10 }} />
                                    </div>
                                </div>

                                <div style={{ fontSize: 11, fontWeight: 700, color: "#3B5BDB", background: "#E8EEFF", display: "inline-block", padding: "4px 12px", borderRadius: 12 }}>
                                    → Click to Evaluate
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </DashboardLayout>
    );
}
