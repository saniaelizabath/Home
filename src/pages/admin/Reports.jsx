import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { db } from "../../firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import Papa from "papaparse";
import useIsMobile from "../../hooks/useIsMobile";

export default function Reports() {
    const isMobile = useIsMobile(900);
    const [courses, setCourses] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters for Roster Level
    const [selectedCourse, setSelectedCourse] = useState("all");
    const [selectedClass, setSelectedClass] = useState("all");
    const [search, setSearch] = useState("");

    // Drill down state
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [activeTab, setActiveTab] = useState("tests"); // tests | assignments | attendance

    // Student specific data
    const [testScores, setTestScores] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [studentDataLoading, setStudentDataLoading] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [cSnap, sSnap] = await Promise.all([
                    getDocs(collection(db, "courses")),
                    getDocs(collection(db, "students"))
                ]);

                const fetchedStudents = sSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setStudents(fetchedStudents);

                let fetchedCourses = cSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.name);

                // Always ensure active student courses are populated in the filter
                const uniqueCourses = [...new Set(fetchedStudents.map(s => s.course).filter(Boolean))];
                uniqueCourses.forEach(courseName => {
                    if (!fetchedCourses.find(c => c.name === courseName)) {
                        fetchedCourses.push({ id: courseName, name: courseName });
                    }
                });

                setCourses(fetchedCourses);
            } catch (err) {
                console.error("Failed to fetch initial data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Fetch student specific data when a student is selected
    useEffect(() => {
        if (!selectedStudent) return;
        const fetchStudentData = async () => {
            setStudentDataLoading(true);
            try {
                // Fetch testScores and attendance for the specific student
                const [tsSnap, attSnap] = await Promise.all([
                    getDocs(query(collection(db, "testScores"), where("studentId", "==", selectedStudent.id))),
                    getDocs(query(collection(db, "attendance"), where("studentId", "==", selectedStudent.id)))
                ]);

                // Sort locally to avoid needing explicit composite indexes
                const tsData = tsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                tsData.sort((a, b) => {
                    const dateA = a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(a.submittedAt || 0);
                    const dateB = b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(b.submittedAt || 0);
                    return dateB - dateA; // Descending
                });

                const attData = attSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                attData.sort((a, b) => {
                    const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
                    const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
                    return dateB - dateA; // Descending
                });

                setTestScores(tsData);
                setAttendance(attData);
            } catch (err) {
                console.error("Failed to fetch student data:", err);
            } finally {
                setStudentDataLoading(false);
            }
        };
        fetchStudentData();
    }, [selectedStudent]);

    // Derived Roster List
    const filteredStudents = students.filter(s => {
        const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase());
        const matchCourse = selectedCourse === "all" || s.course === selectedCourse || s.courseId === selectedCourse || (courses.find(c => c.name === selectedCourse)?.id === s.courseId);
        const matchClass = selectedClass === "all" || s.class === selectedClass;
        return matchSearch && matchCourse && matchClass;
    });

    // Derived Student Tab Data
    const viewTests = testScores.filter(s => !s.type || s.type === "test");
    const viewAssignments = testScores.filter(s => s.type === "assignment");

    const testsEarned = viewTests.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
    const testsMax = viewTests.reduce((acc, curr) => acc + (Number(curr.max) || 100), 0);
    const testsPct = testsMax > 0 ? Math.round((testsEarned / testsMax) * 100) : 0;

    const assignEarned = viewAssignments.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
    const assignMax = viewAssignments.reduce((acc, curr) => acc + (Number(curr.max) || 100), 0);
    const assignPct = assignMax > 0 ? Math.round((assignEarned / assignMax) * 100) : 0;

    const absents = attendance.filter(a => a.status === "Absent").length;
    const presents = attendance.filter(a => a.status === "Present").length;
    const totalDays = absents + presents;
    const attendancePct = totalDays > 0 ? Math.round((presents / totalDays) * 100) : 0;

    const formatDate = (ts) => {
        if (!ts) return "—";
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Export individual reports
    const exportCSV = () => {
        let exportData = [];
        let filename = "";

        if (activeTab === "tests") {
            exportData = viewTests.map(t => ({ Date: formatDate(t.submittedAt), Item: t.testName || "Test", Score: t.score, Max: t.max }));
            filename = `${selectedStudent.name}_Tests_Report.csv`;
        } else if (activeTab === "assignments") {
            exportData = viewAssignments.map(a => ({ Date: formatDate(a.submittedAt), Item: a.testName || "Assignment", Score: a.score, Max: a.max }));
            filename = `${selectedStudent.name}_Assignments_Report.csv`;
        } else if (activeTab === "attendance") {
            exportData = attendance.map(a => ({ Date: formatDate(a.date), Course: a.courseId || "—", Status: a.status }));
            filename = `${selectedStudent.name}_Attendance_Report.csv`;
        }

        if (exportData.length === 0) return alert("No data to export.");

        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = filename;
        a.click(); URL.revokeObjectURL(url);
    };

    return (
        <DashboardLayout>
            {!selectedStudent ? (
                <>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Student Reports</h1>
                    <p style={{ color: "#888", marginBottom: 28 }}>Select a student to view their detailed performance and attendance records.</p>

                    {/* Roster Filters */}
                    <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", marginBottom: 24 }}>
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 6 }}>SEARCH</label>
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or email..."
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
                                    {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Roster List */}
                    <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", overflow: "hidden" }}>
                        {loading ? (
                            <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>Loading students…</div>
                        ) : filteredStudents.length === 0 ? (
                            <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>No students matched the filters.</div>
                        ) : (
                            filteredStudents.map((s, i) => (
                                <div key={s.id} onClick={() => setSelectedStudent(s)} style={{ display: "flex", alignItems: "center", padding: "16px 24px", borderBottom: i < filteredStudents.length - 1 ? "1px solid #f5f5f5" : "none", gap: 14, cursor: "pointer", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#f8f9ff"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#E8EEFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#3B5BDB", flexShrink: 0 }}>
                                        {(s.name || "S")[0].toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 15 }}>{s.name}</div>
                                        <div style={{ fontSize: 13, color: "#888" }}>{s.email} • {s.class} • {s.course}</div>
                                    </div>
                                    <div style={{ color: "#3B5BDB", fontWeight: 700, fontSize: 13 }}>View Report ➔</div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            ) : (
                /* Drill Down View */
                <div>
                    <button onClick={() => setSelectedStudent(null)} style={{ background: "transparent", border: "none", color: "#888", fontWeight: 700, fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
                        ← Back to Roster
                    </button>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
                        <div>
                            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 900, color: "#1a1a2e", marginBottom: 4 }}>{selectedStudent.name}</h1>
                            <p style={{ color: "#888", margin: 0 }}>{selectedStudent.class} • {selectedStudent.course}</p>
                        </div>
                        <button onClick={exportCSV} style={{ padding: "10px 20px", borderRadius: 30, background: "#20C997", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 13 }}>
                            ⬇️ Export {activeTab} (CSV)
                        </button>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: "flex", gap: 10, marginBottom: 24, paddingBottom: 10, overflowX: "auto", whiteSpace: "nowrap" }}>
                        {[
                            { id: "tests", label: "Tests" },
                            { id: "assignments", label: "Assignments" },
                            { id: "attendance", label: "Attendance" }
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: "10px 20px", borderRadius: 30, fontWeight: 700, fontSize: 14, cursor: "pointer", border: "none",
                                    background: activeTab === tab.id ? "#3B5BDB" : "#f1f3f5",
                                    color: activeTab === tab.id ? "#fff" : "#666",
                                    transition: "0.2s"
                                }}>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                        {studentDataLoading ? (
                            <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>Fetching records...</div>
                        ) : activeTab === "tests" ? (
                            <div>
                                <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
                                    <div style={{ background: "#f8f9ff", padding: 16, borderRadius: 16, flex: 1, textAlign: "center" }}>
                                        <div style={{ fontSize: 12, color: "#888", fontWeight: 700, marginBottom: 4 }}>TOTAL EARNED</div>
                                        <div style={{ fontSize: 24, fontWeight: 900, color: "#3B5BDB" }}>{testsEarned} / {testsMax}</div>
                                    </div>
                                    <div style={{ background: "#FFF9DB", padding: 16, borderRadius: 16, flex: 1, textAlign: "center" }}>
                                        <div style={{ fontSize: 12, color: "#888", fontWeight: 700, marginBottom: 4 }}>AGGREGATE</div>
                                        <div style={{ fontSize: 24, fontWeight: 900, color: "#e67700" }}>{testsPct}%</div>
                                    </div>
                                </div>
                                {viewTests.length === 0 ? <p style={{ textAlign: "center", color: "#aaa", padding: 20 }}>No tests recorded.</p> : (
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                                        <thead>
                                            <tr style={{ background: "#f8f9ff" }}>
                                                <th style={{ padding: "12px 16px", textAlign: "left", color: "#888" }}>Date</th>
                                                <th style={{ padding: "12px 16px", textAlign: "left", color: "#888" }}>Test Name</th>
                                                <th style={{ padding: "12px 16px", textAlign: "right", color: "#888" }}>Score</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewTests.map(t => (
                                                <tr key={t.id} style={{ borderBottom: "1px solid #eee" }}>
                                                    <td style={{ padding: "12px 16px" }}>{formatDate(t.submittedAt)}</td>
                                                    <td style={{ padding: "12px 16px", fontWeight: 700 }}>{t.testName || "Unknown Test"}</td>
                                                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#3B5BDB" }}>{t.score} / {t.max || 100}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        ) : activeTab === "assignments" ? (
                            <div>
                                <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
                                    <div style={{ background: "#E6FCF5", padding: 16, borderRadius: 16, flex: 1, textAlign: "center" }}>
                                        <div style={{ fontSize: 12, color: "#888", fontWeight: 700, marginBottom: 4 }}>TOTAL EARNED</div>
                                        <div style={{ fontSize: 24, fontWeight: 900, color: "#20C997" }}>{assignEarned} / {assignMax}</div>
                                    </div>
                                    <div style={{ background: "#FFF0F0", padding: 16, borderRadius: 16, flex: 1, textAlign: "center" }}>
                                        <div style={{ fontSize: 12, color: "#888", fontWeight: 700, marginBottom: 4 }}>AGGREGATE</div>
                                        <div style={{ fontSize: 24, fontWeight: 900, color: "#FF6B6B" }}>{assignPct}%</div>
                                    </div>
                                </div>
                                {viewAssignments.length === 0 ? <p style={{ textAlign: "center", color: "#aaa", padding: 20 }}>No assignments recorded.</p> : (
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                                        <thead>
                                            <tr style={{ background: "#f8f9ff" }}>
                                                <th style={{ padding: "12px 16px", textAlign: "left", color: "#888" }}>Date</th>
                                                <th style={{ padding: "12px 16px", textAlign: "left", color: "#888" }}>Assignment Name</th>
                                                <th style={{ padding: "12px 16px", textAlign: "right", color: "#888" }}>Score</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewAssignments.map(a => (
                                                <tr key={a.id} style={{ borderBottom: "1px solid #eee" }}>
                                                    <td style={{ padding: "12px 16px" }}>{formatDate(a.submittedAt)}</td>
                                                    <td style={{ padding: "12px 16px", fontWeight: 700 }}>{a.testName || "Unknown Assignment"}</td>
                                                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#20C997" }}>{a.score} / {a.max || 100}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
                                    <div style={{ background: "#f8f9ff", padding: 16, borderRadius: 16, flex: 1, textAlign: "center" }}>
                                        <div style={{ fontSize: 12, color: "#888", fontWeight: 700, marginBottom: 4 }}>TOTAL DAYS</div>
                                        <div style={{ fontSize: 24, fontWeight: 900, color: "#1a1a2e" }}>{totalDays}</div>
                                    </div>
                                    <div style={{ background: "#FFF9DB", padding: 16, borderRadius: 16, flex: 1, textAlign: "center" }}>
                                        <div style={{ fontSize: 12, color: "#888", fontWeight: 700, marginBottom: 4 }}>PUNCTUALITY</div>
                                        <div style={{ fontSize: 24, fontWeight: 900, color: "#e67700" }}>{attendancePct}%</div>
                                    </div>
                                </div>
                                {attendance.length === 0 ? <p style={{ textAlign: "center", color: "#aaa", padding: 20 }}>No attendance recorded.</p> : (
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                                        <thead>
                                            <tr style={{ background: "#f8f9ff" }}>
                                                <th style={{ padding: "12px 16px", textAlign: "left", color: "#888" }}>Date</th>
                                                <th style={{ padding: "12px 16px", textAlign: "left", color: "#888" }}>Course Code</th>
                                                <th style={{ padding: "12px 16px", textAlign: "right", color: "#888" }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendance.map(a => (
                                                <tr key={a.id} style={{ borderBottom: "1px solid #eee" }}>
                                                    <td style={{ padding: "12px 16px" }}>{formatDate(a.date)}</td>
                                                    <td style={{ padding: "12px 16px" }}>{a.courseId || "—"}</td>
                                                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: a.status === "Present" ? "#20C997" : "#FF6B6B" }}>
                                                        {a.status}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
