import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db, storage } from "../../firebase";
import {
    collection, query, where, getDocs, addDoc,
    serverTimestamp, doc, updateDoc, deleteDoc
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import useIsMobile from "../../hooks/useIsMobile";

/* ─── Constants ── */
const CLASS_OPTS = ["Class 11", "Class 12"];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

const SUB_META = {
    "Accountancy": { bg: "#EEF2FF", color: "#4F46E5", icon: "📒" },
    "Business Studies": { bg: "#E6FCF5", color: "#0D9488", icon: "📊" },
    "Economics": { bg: "#FFF7ED", color: "#C2410C", icon: "📈" },
};

/* ── Shared input style ── */
const baseInp = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "2px solid #E5E7EB", fontSize: 13, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit", background: "#fafbff",
    transition: "border 0.15s",
};

const selInp = {
    padding: "9px 10px", borderRadius: 10, border: "2px solid #E5E7EB",
    fontSize: 13, outline: "none", background: "#fafbff", fontFamily: "inherit",
    cursor: "pointer", appearance: "none", transition: "border 0.15s",
};

function InputField({ label, required, children }) {
    return (
        <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {label}{required && " *"}
            </label>
            {children}
        </div>
    );
}

function EmptyState({ icon, text }) {
    return (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#9CA3AF" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
            <div style={{ fontSize: 13 }}>{text}</div>
        </div>
    );
}

/* ── DateTime AM/PM Picker ── */
function DateTimePicker({ value, onChange }) {
    // value: { date, hour, minute, ampm }
    const fo = e => e.target.style.border = "2px solid #3B5BDB";
    const bl = e => e.target.style.border = "2px solid #E5E7EB";

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 8, alignItems: "center" }}>
            {/* Date */}
            <input
                type="date"
                value={value.date || ""}
                onChange={e => onChange({ ...value, date: e.target.value })}
                style={{ ...baseInp, colorScheme: "light", minWidth: 0 }}
                onFocus={fo} onBlur={bl}
            />
            {/* Hour */}
            <select
                value={value.hour || "08"}
                onChange={e => onChange({ ...value, hour: e.target.value })}
                style={{ ...selInp, width: 58 }}
                onFocus={fo} onBlur={bl}
            >
                {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            {/* Minute */}
            <select
                value={value.minute || "00"}
                onChange={e => onChange({ ...value, minute: e.target.value })}
                style={{ ...selInp, width: 58 }}
                onFocus={fo} onBlur={bl}
            >
                {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {/* AM / PM */}
            <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "2px solid #E5E7EB" }}>
                {["AM", "PM"].map(ap => (
                    <button
                        key={ap}
                        type="button"
                        onClick={() => onChange({ ...value, ampm: ap })}
                        style={{
                            padding: "8px 10px", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer",
                            background: value.ampm === ap ? "#3B5BDB" : "#fafbff",
                            color: value.ampm === ap ? "#fff" : "#6B7280",
                            transition: "all 0.15s",
                        }}
                    >{ap}</button>
                ))}
            </div>
        </div>
    );
}

/* ── Convert DateTimePicker value → JS Date ── */
function pickerToDate(v) {
    if (!v || !v.date) return null;
    let h = parseInt(v.hour || "8", 10);
    const ampm = v.ampm || "AM";
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    const [year, month, day] = v.date.split("-").map(Number);
    const m = parseInt(v.minute || "0", 10);
    return new Date(year, month - 1, day, h, m, 0);
}

/* ── Convert JS Date / Firestore Timestamp → picker value ── */
function dateToPicker(dateObj) {
    const empty = { date: "", hour: "08", minute: "00", ampm: "AM" };
    if (!dateObj) return empty;
    const d = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    if (isNaN(d.getTime())) return empty;
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    let h = d.getHours();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    const hour = String(h).padStart(2, "0");
    const minute = String(d.getMinutes()).padStart(2, "0");
    // snap minute to nearest available option
    const snapMin = MINUTES.reduce((prev, cur) => Math.abs(parseInt(cur) - d.getMinutes()) < Math.abs(parseInt(prev) - d.getMinutes()) ? cur : prev);
    return { date, hour, minute: snapMin, ampm };
}

/* ┌─────────────── MAIN COMPONENT ───────────────┐ */
export default function AcademicContent() {
    const { user } = useAuth();
    const isMobile = useIsMobile(900);
    const fileInputRef = useRef(null);

    const teacherSubject = user?.subject || "";
    const meta = SUB_META[teacherSubject] || { bg: "#E8EEFF", color: "#3B5BDB", icon: "📚" };

    const [selectedClass, setSelectedClass] = useState(CLASS_OPTS[0]);
    const [activeTab, setActiveTab] = useState("notes");

    // Content lists
    const [notes, setNotes] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(false);

    // Upload state
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);

    // Syllabus
    const [syllabus, setSyllabus] = useState(null);
    const [syllabusLoading, setSyllabusLoading] = useState(false);
    const [syllabusOpen, setSyllabusOpen] = useState(false);

    /* ── Empty picker values ── */
    const emptyPicker = { date: "", hour: "08", minute: "00", ampm: "AM" };

    /* ── Unified form state ── */
    const emptyForm = {
        id: null,
        title: "",
        description: "",
        driveLink: "",
        deadline: { ...emptyPicker },       // notes (optional) + assignments (due date)
        availableFrom: { ...emptyPicker },  // tests only
        availableTo: { ...emptyPicker },    // tests only
        fileURL: null,
        fileName: null,
        isWritten: false,                   // tests: collect student Drive link submission
    };
    const [form, setForm] = useState(emptyForm);

    // Submissions: { [itemId]: [submissionDoc, ...] }
    const [submissions, setSubmissions] = useState({});
    const [subsOpen, setSubsOpen] = useState({});   // { [itemId]: bool }
    const [subsLoading, setSubsLoading] = useState({});

    const courseKey = `${teacherSubject}__${selectedClass}`;

    /* ── Focus/Blur helpers ── */
    const fo = e => e.target.style.border = "2px solid #3B5BDB";
    const bl = e => e.target.style.border = "2px solid #E5E7EB";
    const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

    /* ── Reset form on tab change ── */
    useEffect(() => {
        setForm(emptyForm);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [activeTab]);

    /* ── Load syllabus ── */
    useEffect(() => {
        if (!teacherSubject) return;
        setSyllabusLoading(true);
        const fetch = async () => {
            try {
                let snap = await getDocs(query(collection(db, "courses"),
                    where("subject", "==", teacherSubject),
                    where("class", "==", selectedClass)));
                if (snap.empty) {
                    snap = await getDocs(query(collection(db, "courses"),
                        where("subject", "==", teacherSubject),
                        where("class", "==", "Both")));
                }
                setSyllabus(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
            } catch (e) { console.error(e); setSyllabus(null); }
            finally { setSyllabusLoading(false); }
        };
        fetch();
    }, [teacherSubject, selectedClass]);

    /* ── Load content ── */
    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            try {
                const [n, a, t] = await Promise.all([
                    getDocs(query(collection(db, "notes"), where("courseKey", "==", courseKey))),
                    getDocs(query(collection(db, "assignments"), where("courseKey", "==", courseKey))),
                    getDocs(query(collection(db, "tests"), where("courseKey", "==", courseKey))),
                ]);
                setNotes(n.docs.map(d => ({ id: d.id, ...d.data() })));
                setAssignments(a.docs.map(d => ({ id: d.id, ...d.data() })));
                setTests(t.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchContent();
    }, [courseKey]);

    /* ── Upload PDF to Storage ── */
    const uploadFile = async (file, folder) => {
        const storageRef = ref(storage, `${folder}/${courseKey}/${Date.now()}_${file.name}`);
        const task = uploadBytesResumable(storageRef, file);
        return new Promise((resolve, reject) => {
            task.on("state_changed",
                (snap) => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
                reject,
                async () => resolve({ fileURL: await getDownloadURL(task.snapshot.ref), fileName: file.name })
            );
        });
    };

    /* ── Save Note ── */
    const saveNote = async () => {
        if (!form.title.trim()) { alert("Please enter a title."); return; }
        if (!form.driveLink && !selectedFile && !form.fileURL && !form.id) {
            alert("Please provide a Google Drive link or upload a PDF."); return;
        }
        if (selectedFile && selectedFile.size > 30 * 1024 * 1024) { alert("File too large (max 30MB)."); return; }

        setUploading(true); setUploadProgress(0);
        try {
            let fileURL = form.fileURL, fileName = form.fileName;
            if (selectedFile) {
                const res = await uploadFile(selectedFile, "notes");
                fileURL = res.fileURL; fileName = res.fileName;
            }
            const deadline = pickerToDate(form.deadline);
            const payload = {
                courseKey, subject: teacherSubject, class: selectedClass,
                teacherId: user?.uid || user?.id || "",
                title: form.title.trim(),
                description: form.description.trim(),
                driveLink: form.driveLink.trim() || null,
                fileURL: fileURL || null, fileName: fileName || null,
                deadline: deadline || null,
            };
            if (form.id) {
                await updateDoc(doc(db, "notes", form.id), payload);
                setNotes(p => p.map(n => n.id === form.id ? { ...n, ...payload } : n));
            } else {
                const newDoc = await addDoc(collection(db, "notes"), { ...payload, createdAt: serverTimestamp() });
                setNotes(p => [{ id: newDoc.id, ...payload }, ...p]);
            }
            resetForm();
        } catch (e) { alert("Save failed: " + e.message); }
        finally { setUploading(false); }
    };

    /* ── Save Assignment ── */
    const saveAssignment = async () => {
        if (!form.title.trim()) { alert("Please enter a title."); return; }
        if (selectedFile && selectedFile.size > 30 * 1024 * 1024) { alert("File too large (max 30MB)."); return; }

        setUploading(true); setUploadProgress(0);
        try {
            let fileURL = form.fileURL, fileName = form.fileName;
            if (selectedFile) {
                const res = await uploadFile(selectedFile, "assignments");
                fileURL = res.fileURL; fileName = res.fileName;
            }
            const dueDate = pickerToDate(form.deadline);
            const payload = {
                courseKey, subject: teacherSubject, class: selectedClass,
                teacherId: user?.uid || user?.id || "",
                title: form.title.trim(),
                description: form.description.trim(),
                driveLink: form.driveLink.trim() || null,
                fileURL: fileURL || null, fileName: fileName || null,
                dueDate: dueDate || null,
            };
            if (form.id) {
                await updateDoc(doc(db, "assignments", form.id), payload);
                setAssignments(p => p.map(a => a.id === form.id ? { ...a, ...payload } : a));
            } else {
                const newDoc = await addDoc(collection(db, "assignments"), { ...payload, createdAt: serverTimestamp() });
                setAssignments(p => [...p, { id: newDoc.id, ...payload }]);
            }
            resetForm();
        } catch (e) { alert("Save failed: " + e.message); }
        finally { setUploading(false); }
    };

    /* ── Save Test ── */
    const saveTest = async () => {
        if (!form.title.trim()) { alert("Please enter a test title."); return; }
        setUploading(true);
        try {
            const payload = {
                courseKey, subject: teacherSubject, class: selectedClass,
                teacherId: user?.uid || user?.id || "",
                title: form.title.trim(),
                description: form.description.trim(),
                link: form.driveLink.trim() || null,
                availableFrom: pickerToDate(form.availableFrom) || null,
                availableTo: pickerToDate(form.availableTo) || null,
                isWritten: !!form.isWritten,
            };
            if (form.id) {
                await updateDoc(doc(db, "tests", form.id), payload);
                setTests(p => p.map(t => t.id === form.id ? { ...t, ...payload } : t));
            } else {
                const newDoc = await addDoc(collection(db, "tests"), { ...payload, createdAt: serverTimestamp() });
                setTests(p => [...p, { id: newDoc.id, ...payload }]);
            }
            resetForm();
        } catch (e) { alert("Save failed: " + e.message); }
        finally { setUploading(false); }
    };

    const handleDelete = async (col, id) => {
        if (!window.confirm("Delete this item?")) return;
        try {
            await deleteDoc(doc(db, col, id));
            if (col === "notes") setNotes(p => p.filter(i => i.id !== id));
            if (col === "assignments") setAssignments(p => p.filter(i => i.id !== id));
            if (col === "tests") setTests(p => p.filter(i => i.id !== id));
        } catch (e) { alert("Delete failed: " + e.message); }
    };

    const resetForm = () => {
        setForm(emptyForm);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const editNote = (n) => {
        setForm({ id: n.id, title: n.title || "", description: n.description || "", driveLink: n.driveLink || "", deadline: dateToPicker(n.deadline), availableFrom: { ...emptyPicker }, availableTo: { ...emptyPicker }, fileURL: n.fileURL || null, fileName: n.fileName || null });
        setSelectedFile(null);
    };
    const editAssignment = (a) => {
        setForm({ id: a.id, title: a.title || "", description: a.description || "", driveLink: a.driveLink || "", deadline: dateToPicker(a.dueDate), availableFrom: { ...emptyPicker }, availableTo: { ...emptyPicker }, fileURL: a.fileURL || null, fileName: a.fileName || null });
        setSelectedFile(null);
    };
    const editTest = (t) => {
        setForm({ id: t.id, title: t.title || "", description: t.description || "", driveLink: t.link || "", deadline: { ...emptyPicker }, availableFrom: dateToPicker(t.availableFrom), availableTo: dateToPicker(t.availableTo), fileURL: null, fileName: null, isWritten: !!t.isWritten });
        setSelectedFile(null);
    };

    /* ── Load submissions for one item ── */
    const loadSubmissions = async (itemId, type) => {
        const isOpen = subsOpen[itemId];
        setSubsOpen(p => ({ ...p, [itemId]: !isOpen }));
        if (isOpen || submissions[itemId]) return; // already loaded or closing
        setSubsLoading(p => ({ ...p, [itemId]: true }));
        try {
            const field = type === "assignment" ? "assignmentId" : "testId";
            // Try itemId field first, fallback to legacy specific field
            let snap = await getDocs(query(collection(db, "submissions"), where("itemId", "==", itemId)));
            if (snap.empty) {
                snap = await getDocs(query(collection(db, "submissions"), where(field, "==", itemId)));
            }
            setSubmissions(p => ({ ...p, [itemId]: snap.docs.map(d => ({ id: d.id, ...d.data() })) }));
        } catch (e) { console.error(e); }
        finally { setSubsLoading(p => ({ ...p, [itemId]: false })); }
    };

    const fmtDate = (dateObj) => {
        if (!dateObj) return null;
        const d = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
        if (isNaN(d.getTime())) return null;
        return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    };

    /* ── Styles ── */
    const tabStyle = t => ({
        padding: "10px 22px", borderRadius: 30, fontWeight: 700, fontSize: 14,
        border: "none", cursor: "pointer", transition: "all 0.2s",
        background: activeTab === t ? "#3B5BDB" : "#f0f2ff",
        color: activeTab === t ? "#fff" : "#3B5BDB",
    });
    const saveBtn = (col) => ({
        flex: 1, padding: "12px 0", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14,
        background: col === "red" ? "#FF6B6B" : "#3B5BDB", color: "#fff",
        opacity: uploading ? 0.7 : 1, transition: "opacity 0.2s",
    });
    const actionChip = (bg, color) => ({
        fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 10,
        background: bg, color, border: "none", cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3,
    });

    /* ────────── RENDER ────────── */
    return (
        <DashboardLayout>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 4 }}>Academic Content</h1>
            <p style={{ color: "#888", marginBottom: 24 }}>Upload notes, assignments, and create tests for your students</p>

            {/* ── Subject + Class filter ── */}
            <div style={{ background: "#fff", borderRadius: 18, padding: "18px 22px", marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}>
                <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Subject</div>
                    {teacherSubject ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 20, fontWeight: 700, fontSize: 13, background: meta.bg, color: meta.color }}>
                            {meta.icon} {teacherSubject}
                        </span>
                    ) : (
                        <span style={{ color: "#FF6B6B", fontSize: 13 }}>⚠️ Subject not set — ask admin to update your profile</span>
                    )}
                </div>
                <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Class</div>
                    <div style={{ display: "flex", gap: 8 }}>
                        {CLASS_OPTS.map(cl => (
                            <button key={cl} onClick={() => setSelectedClass(cl)} style={{
                                padding: "7px 18px", borderRadius: 20, fontWeight: 700, fontSize: 13,
                                border: "2px solid", cursor: "pointer", transition: "all 0.15s",
                                borderColor: selectedClass === cl ? "#6366f1" : "#E5E7EB",
                                background: selectedClass === cl ? "#EEF2FF" : "#F9FAFB",
                                color: selectedClass === cl ? "#4F46E5" : "#374151",
                            }}>{cl}</button>
                        ))}
                    </div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>
                    Showing content for<br />
                    <strong style={{ color: "#1F2937" }}>{teacherSubject || "—"} · {selectedClass}</strong>
                </div>
            </div>

            {/* ── Syllabus accordion ── */}
            <div style={{ background: "#fff", borderRadius: 18, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                <div style={{ padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", borderBottom: syllabusOpen ? "1px solid #F3F4F6" : "none" }}
                    onClick={() => setSyllabusOpen(o => !o)}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "#1F2937", marginBottom: 3 }}>📖 Course Syllabus</div>
                        <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                            {syllabusLoading ? "Loading…" : syllabus ? `${syllabus.chapters?.length || 0} chapters` : "Not added yet — admin needs to add syllabus in Course Management"}
                        </div>
                    </div>
                    <span style={{ fontSize: 16, color: "#9CA3AF" }}>{syllabusOpen ? "▲" : "▼"}</span>
                </div>
                {syllabusOpen && (
                    <div style={{ padding: "16px 22px" }}>
                        {!syllabus ? (
                            <div style={{ textAlign: "center", color: "#9CA3AF", padding: "16px 0" }}>No syllabus found for {teacherSubject} · {selectedClass}</div>
                        ) : (
                            <>
                                {syllabus.description && (
                                    <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#374151" }}>
                                        {syllabus.description}
                                    </div>
                                )}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                                    {(syllabus.chapters || []).map((ch, i) => (
                                        <div key={i} style={{ borderRadius: 12, padding: "12px 14px", border: `2px solid ${meta.bg}`, background: "#FAFAFA" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: ch.description ? 5 : 0 }}>
                                                <span style={{ width: 22, height: 22, borderRadius: "50%", background: meta.bg, color: meta.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                                                <span style={{ fontWeight: 700, fontSize: 13, color: "#1F2937" }}>{ch.name}</span>
                                            </div>
                                            {ch.description && <div style={{ fontSize: 11, color: "#9CA3AF", paddingLeft: 29 }}>{ch.description}</div>}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ── Tabs ── */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                <button style={tabStyle("notes")} onClick={() => setActiveTab("notes")}>📝 Notes</button>
                <button style={tabStyle("assignments")} onClick={() => setActiveTab("assignments")}>📋 Assignments</button>
                <button style={tabStyle("tests")} onClick={() => setActiveTab("tests")}>🧪 Tests</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>

                {/* ══════════ UPLOAD / CREATE PANEL ══════════ */}
                <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a2e", marginBottom: 20 }}>
                        {activeTab === "notes" ? (form.id ? "✏️ Edit Note" : "📤 Upload Note")
                            : activeTab === "assignments" ? (form.id ? "✏️ Edit Assignment" : "📤 Upload Assignment")
                                : (form.id ? "✏️ Edit Test" : "➕ Create Test")}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                        {/* NAME */}
                        <InputField label="Name" required>
                            <input value={form.title}
                                onChange={e => setF("title", e.target.value)}
                                placeholder={activeTab === "notes" ? "e.g. Partnership Notes" : activeTab === "assignments" ? "e.g. Balance Sheet Exercise" : "e.g. Chapter 3 Quiz"}
                                style={baseInp} onFocus={fo} onBlur={bl} />
                        </InputField>

                        {/* DESCRIPTION */}
                        <InputField label="Description">
                            <textarea value={form.description}
                                onChange={e => setF("description", e.target.value)}
                                rows={2}
                                placeholder={activeTab === "tests" ? "Topics covered in this test…" : "Add notes or instructions…"}
                                style={{ ...baseInp, resize: "vertical" }} onFocus={fo} onBlur={bl} />
                        </InputField>

                        {/* CLASS */}
                        <InputField label="Class">
                            <div style={{ display: "flex", gap: 8 }}>
                                {CLASS_OPTS.map(cl => (
                                    <button key={cl} onClick={() => setSelectedClass(cl)} style={{
                                        padding: "7px 18px", borderRadius: 20, fontWeight: 700, fontSize: 13,
                                        border: "2px solid", cursor: "pointer",
                                        borderColor: selectedClass === cl ? "#6366f1" : "#E5E7EB",
                                        background: selectedClass === cl ? "#EEF2FF" : "#F9FAFB",
                                        color: selectedClass === cl ? "#4F46E5" : "#374151",
                                    }}>{cl}</button>
                                ))}
                            </div>
                        </InputField>

                        {/* SUBJECT (read-only) */}
                        <InputField label="Subject">
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: meta.bg, color: meta.color, fontWeight: 700, fontSize: 13 }}>
                                {meta.icon} {teacherSubject || "—"}
                            </div>
                        </InputField>

                        {/* DEADLINE — Notes (optional) + Assignments (due date) */}
                        {activeTab !== "tests" && (
                            <InputField label={activeTab === "assignments" ? "Deadline (Due Date)" : "Deadline (Optional)"}>
                                <DateTimePicker value={form.deadline} onChange={v => setF("deadline", v)} />
                            </InputField>
                        )}

                        {/* AVAILABLE FROM / UNTIL — Tests */}
                        {activeTab === "tests" && (
                            <>
                                <InputField label="Available From">
                                    <DateTimePicker value={form.availableFrom} onChange={v => setF("availableFrom", v)} />
                                </InputField>
                                <InputField label="Available Until">
                                    <DateTimePicker value={form.availableTo} onChange={v => setF("availableTo", v)} />
                                </InputField>
                                {/* Written test toggle */}
                                <div
                                    onClick={() => setF("isWritten", !form.isWritten)}
                                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: `2px solid ${form.isWritten ? "#E8590C" : "#E5E7EB"}`, background: form.isWritten ? "#FFF4E6" : "#fafbff", cursor: "pointer", userSelect: "none" }}>
                                    <div style={{ width: 36, height: 20, borderRadius: 10, background: form.isWritten ? "#E8590C" : "#D1D5DB", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                                        <div style={{ position: "absolute", top: 2, left: form.isWritten ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 13, color: form.isWritten ? "#E8590C" : "#374151" }}>✍️ Written Test</div>
                                        <div style={{ fontSize: 11, color: "#9CA3AF" }}>Students submit their answer via Google Drive link</div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* GOOGLE DRIVE LINK */}
                        <InputField label={activeTab === "tests" ? "Google Form / Drive Link" : "Google Drive Link (Optional)"}>
                            <input value={form.driveLink}
                                onChange={e => setF("driveLink", e.target.value)}
                                placeholder="https://drive.google.com/…  or  https://forms.gle/…"
                                style={baseInp} onFocus={fo} onBlur={bl} />
                        </InputField>

                        {/* PDF UPLOAD — Notes & Assignments only */}
                        {activeTab !== "tests" && (
                            <InputField label="PDF Upload (Optional)">
                                <label style={{ display: "block", padding: 16, borderRadius: 12, border: "2px dashed #3B5BDB", textAlign: "center", cursor: uploading ? "not-allowed" : "pointer", background: "#f0f4ff", fontSize: 13, color: "#3B5BDB" }}>
                                    {uploading && uploadProgress > 0 ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                                            <div style={{ width: "100%", background: "#E5E7EB", borderRadius: 4, height: 6, overflow: "hidden" }}>
                                                <div style={{ width: `${uploadProgress}%`, background: "#3B5BDB", height: "100%", transition: "width 0.2s ease" }} />
                                            </div>
                                            <span>Uploading: {Math.round(uploadProgress)}%</span>
                                        </div>
                                    ) : uploading ? "Starting Upload…" : (
                                        <>
                                            <div style={{ fontSize: 22, marginBottom: 4 }}>📎</div>
                                            {selectedFile ? (
                                                <span style={{ color: "#4F46E5", fontWeight: 700 }}>✅ {selectedFile.name}</span>
                                            ) : form.fileName ? (
                                                <span>Current: {form.fileName} · Click to replace</span>
                                            ) : "Click to select PDF / DOC (max 30MB)"}
                                        </>
                                    )}
                                    <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx"
                                        style={{ display: "none" }}
                                        onChange={e => setSelectedFile(e.target.files[0] || null)}
                                        disabled={uploading} />
                                </label>
                                {selectedFile && (
                                    <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                        style={{ marginTop: 6, fontSize: 11, color: "#FF6B6B", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>
                                        ✕ Remove selected file
                                    </button>
                                )}
                            </InputField>
                        )}

                        {/* SAVE / CANCEL */}
                        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                            <button
                                disabled={uploading}
                                onClick={activeTab === "notes" ? saveNote : activeTab === "assignments" ? saveAssignment : saveTest}
                                style={saveBtn(activeTab === "tests" ? "red" : "blue")}>
                                {uploading ? "Saving…" : form.id ? "Update" : "Save"}
                            </button>
                            {form.id && (
                                <button onClick={resetForm} disabled={uploading}
                                    style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: "#f3f4f6", color: "#374151" }}>
                                    Cancel
                                </button>
                            )}
                        </div>

                    </div>
                </div>

                {/* ══════════ LIST PANEL ══════════ */}
                <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a2e", marginBottom: 18 }}>
                        {activeTab === "notes" ? "📚 Uploaded Notes" : activeTab === "assignments" ? "📋 Assignments" : "🧪 Tests"}
                        <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 600, color: "#9CA3AF" }}>
                            {activeTab === "notes" ? notes.length : activeTab === "assignments" ? assignments.length : tests.length} items
                        </span>
                    </div>

                    {loading ? (
                        <EmptyState icon="⏳" text="Loading…" />
                    ) : (

                        /* NOTES LIST */
                        activeTab === "notes" && (notes.length === 0 ? (
                            <EmptyState icon="📝" text={`No notes uploaded for ${teacherSubject} · ${selectedClass} yet.`} />
                        ) : notes.map((n, i) => (
                            <div key={n.id || i} style={{ padding: "14px 0", borderBottom: i < notes.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E8EEFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📄</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{n.title}</div>
                                        {n.description && <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{n.description}</div>}
                                        {n.deadline && (
                                            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                                                🗓 {fmtDate(n.deadline)}
                                            </div>
                                        )}
                                        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                                            {n.driveLink && <a href={n.driveLink} target="_blank" rel="noreferrer" style={actionChip("#EEF2FF", "#4F46E5")}>🔗 Drive Link</a>}
                                            {n.fileURL && <a href={n.fileURL} target="_blank" rel="noreferrer" style={actionChip("#E8EEFF", "#3B5BDB")}>📎 View PDF</a>}
                                            <button onClick={() => editNote(n)} style={actionChip("#f3f4f6", "#374151")}>✏️ Edit</button>
                                            <button onClick={() => handleDelete("notes", n.id)} style={actionChip("#FFF0F0", "#FF6B6B")}>🗑 Del</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )))
                    )}

                    {/* ASSIGNMENTS LIST */}
                    {!loading && activeTab === "assignments" && (assignments.length === 0 ? (
                        <EmptyState icon="📋" text={`No assignments yet for ${teacherSubject} · ${selectedClass}.`} />
                    ) : assignments.map((a, i) => (
                        <div key={a.id || i} style={{ padding: "14px 0", borderBottom: i < assignments.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{a.title}</div>
                            {a.description && <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{a.description}</div>}
                            {a.dueDate && <div style={{ fontSize: 11, color: "#FF6B6B", fontWeight: 600, marginTop: 3 }}>Due: {fmtDate(a.dueDate)}</div>}
                            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                                {a.driveLink && <a href={a.driveLink} target="_blank" rel="noreferrer" style={actionChip("#EEF2FF", "#4F46E5")}>🔗 Drive Link</a>}
                                {a.fileURL && <a href={a.fileURL} target="_blank" rel="noreferrer" style={actionChip("#E8EEFF", "#3B5BDB")}>📎 View PDF</a>}
                                <button onClick={() => editAssignment(a)} style={actionChip("#f3f4f6", "#374151")}>✏️ Edit</button>
                                <button onClick={() => handleDelete("assignments", a.id)} style={actionChip("#FFF0F0", "#FF6B6B")}>🗑 Del</button>
                                <button onClick={() => loadSubmissions(a.id, "assignment")} style={actionChip("#F0FDF4", "#16A34A")}>
                                    {subsLoading[a.id] ? "Loading…" : `📥 ${subsOpen[a.id] ? "Hide" : "View"} Submissions${submissions[a.id] ? ` (${submissions[a.id].length})` : ""}`}
                                </button>
                            </div>
                            {/* Submissions accordion */}
                            {subsOpen[a.id] && (
                                <div style={{ marginTop: 10, background: "#F8FFFE", borderRadius: 10, padding: "10px 12px", border: "1.5px solid #BBF7D0" }}>
                                    {!submissions[a.id] || submissions[a.id].length === 0 ? (
                                        <div style={{ fontSize: 12, color: "#9CA3AF" }}>No submissions yet.</div>
                                    ) : submissions[a.id].map((s, si) => (
                                        <div key={s.id || si} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: si < submissions[a.id].length - 1 ? "1px solid #E7F3EF" : "none", flexWrap: "wrap" }}>
                                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>👤</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: 12, color: "#1F2937" }}>{s.studentName || s.studentId || "Student"}</div>
                                                <div style={{ fontSize: 10, color: s.status === "Late" ? "#E8590C" : "#16A34A", fontWeight: 600 }}>{s.status || "On Time"}</div>
                                            </div>
                                            {s.driveLink && (
                                                <a href={s.driveLink} target="_blank" rel="noreferrer" style={actionChip("#DCFCE7", "#16A34A")}>🔗 View Answer</a>
                                            )}
                                            {s.submittedAt && (
                                                <div style={{ fontSize: 10, color: "#9CA3AF" }}>
                                                    {(s.submittedAt.toDate ? s.submittedAt.toDate() : new Date(s.submittedAt)).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )))}

                    {/* TESTS LIST */}
                    {!loading && activeTab === "tests" && (tests.length === 0 ? (
                        <EmptyState icon="🧪" text={`No tests yet for ${teacherSubject} · ${selectedClass}.`} />
                    ) : tests.map((t, i) => (
                        <div key={t.id || i} style={{ padding: "14px 0", borderBottom: i < tests.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <span style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{t.title}</span>
                                {t.isWritten && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 8, background: "#FFF4E6", color: "#E8590C" }}>✍️ Written</span>}
                            </div>
                            {t.description && <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{t.description}</div>}
                            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                                {t.availableFrom && <span>From: {fmtDate(t.availableFrom)} </span>}
                                {t.availableTo && <span>· Until: {fmtDate(t.availableTo)}</span>}
                            </div>
                            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                                {t.link && <a href={t.link} target="_blank" rel="noreferrer" style={actionChip("#FFF4E6", "#E8590C")}>🔗 Open Link</a>}
                                <button onClick={() => editTest(t)} style={actionChip("#f3f4f6", "#374151")}>✏️ Edit</button>
                                <button onClick={() => handleDelete("tests", t.id)} style={actionChip("#FFF0F0", "#FF6B6B")}>🗑 Del</button>
                                {t.isWritten && (
                                    <button onClick={() => loadSubmissions(t.id, "test")} style={actionChip("#F0FDF4", "#16A34A")}>
                                        {subsLoading[t.id] ? "Loading…" : `📥 ${subsOpen[t.id] ? "Hide" : "View"} Submissions${submissions[t.id] ? ` (${submissions[t.id].length})` : ""}`}
                                    </button>
                                )}
                            </div>
                            {/* Submissions accordion for written tests */}
                            {t.isWritten && subsOpen[t.id] && (
                                <div style={{ marginTop: 10, background: "#F8FFFE", borderRadius: 10, padding: "10px 12px", border: "1.5px solid #BBF7D0" }}>
                                    {!submissions[t.id] || submissions[t.id].length === 0 ? (
                                        <div style={{ fontSize: 12, color: "#9CA3AF" }}>No submissions yet.</div>
                                    ) : submissions[t.id].map((s, si) => (
                                        <div key={s.id || si} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: si < submissions[t.id].length - 1 ? "1px solid #E7F3EF" : "none", flexWrap: "wrap" }}>
                                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>👤</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: 12, color: "#1F2937" }}>{s.studentName || s.studentId || "Student"}</div>
                                                <div style={{ fontSize: 10, color: s.status === "Late" ? "#E8590C" : "#16A34A", fontWeight: 600 }}>{s.status || "On Time"}</div>
                                            </div>
                                            {s.driveLink && (
                                                <a href={s.driveLink} target="_blank" rel="noreferrer" style={actionChip("#DCFCE7", "#16A34A")}>🔗 View Answer</a>
                                            )}
                                            {s.submittedAt && (
                                                <div style={{ fontSize: 10, color: "#9CA3AF" }}>
                                                    {(s.submittedAt.toDate ? s.submittedAt.toDate() : new Date(s.submittedAt)).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )))}
                </div>
            </div>
        </DashboardLayout>
    );
}
