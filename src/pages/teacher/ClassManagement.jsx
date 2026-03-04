import { useState, useEffect } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
    collection, addDoc, deleteDoc, updateDoc, doc,
    query, where, onSnapshot, getDocs, Timestamp,
} from "firebase/firestore";

import useIsMobile from "../../hooks/useIsMobile";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
const CLASS_OPTS = ["Class 11", "Class 12", "Individual"];
const SUBJECTS = ["Accountancy", "Business Studies", "Economics", "Both"];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ["00", "15", "30", "45"];

function pad(n) { return String(n).padStart(2, "0"); }
function buildTime(h, m, ampm) { return `${pad(h)}:${pad(m)} ${ampm}`; }

function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function formatDateShort(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function tsToStr(ts) {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function parseTime(timeStr) {
    if (!timeStr) return { hour: "10", minute: "00", ampm: "AM" };
    const [hm, ampm] = timeStr.split(" ");
    const [hour, minute] = (hm || "10:00").split(":");
    return { hour: hour || "10", minute: minute || "00", ampm: ampm || "AM" };
}

const isClassPast = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return false;
    const { hour, minute, ampm } = parseTime(timeStr);
    let h = parseInt(hour, 10);
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;

    const classDate = new Date(`${dateStr}T${pad(h)}:${pad(minute)}:00`);
    return classDate < new Date();
};

/* ─── Toast ───────────────────────────────────────────────── */
function Toast({ toasts }) {
    return (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
            {toasts.map(t => (
                <div key={t.id} style={{
                    padding: "14px 22px", borderRadius: 14, fontWeight: 700, fontSize: 14,
                    background: t.type === "success" ? "#E6FCF5" : "#FFF0F0",
                    color: t.type === "success" ? "#20C997" : "#c92a2a",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.13)", border: "1.5px solid currentColor",
                    animation: "slideIn 0.3s ease",
                }}>
                    {t.type === "success" ? "✓ " : "✕ "}{t.msg}
                </div>
            ))}
            <style>{`@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
        </div>
    );
}

/* ─── Normalise student subject to one of SUBJECTS ─────── */
function resolveSubject(student) {
    const raw = (student?.favSubject || student?.course || student?.subject || "").toLowerCase();
    if (!raw) return "";
    if (raw.includes("account")) return "Accountancy";
    if (raw.includes("business")) return "Business Studies";
    if (raw.includes("econ")) return "Economics";
    if (raw.includes("both") || raw.includes("all")) return "Both";
    return "";
}

/* ─── Student Picker autocomplete ──────────────────── */
function StudentPicker({ value, onChange, onSelect, students }) {
    const [open, setOpen] = useState(false);
    const [queryStr, setQueryStr] = useState(value || "");

    useEffect(() => { setQueryStr(value || ""); }, [value]);

    const matches = queryStr.trim().length > 0
        ? students.filter(s =>
            (s.name || "").toLowerCase().includes(queryStr.toLowerCase())
        ).slice(0, 8)
        : [];

    const select = (student) => {
        setQueryStr(student.name);
        onChange(student.name);
        onSelect && onSelect(student);
        setOpen(false);
    };

    return (
        <div style={{ position: "relative", marginTop: 10 }}>
            <div style={{ position: "relative" }}>
                <span style={{
                    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                    fontSize: 15, pointerEvents: "none",
                }}>🔍</span>
                <input
                    value={queryStr}
                    onChange={e => { setQueryStr(e.target.value); onChange(e.target.value); setOpen(true); }}
                    onFocus={e => { setOpen(true); e.target.style.border = "2px solid #6366f1"; }}
                    onBlur={e => { setTimeout(() => setOpen(false), 150); e.target.style.border = "2px solid #E5E7EB"; }}
                    placeholder="Type student name to search…"
                    style={{
                        width: "100%", padding: "11px 14px 11px 36px",
                        borderRadius: 10, border: "2px solid #E5E7EB", fontSize: 13,
                        outline: "none", boxSizing: "border-box", background: "#F9FAFB",
                        fontFamily: "Inter, Poppins, sans-serif", color: "#1F2937", transition: "border 0.15s",
                    }}
                />
            </div>

            {open && matches.length > 0 && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
                    background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
                    border: "1.5px solid #E5E7EB", overflow: "hidden",
                }}>
                    {matches.map((s, i) => (
                        <div key={s.id || i}
                            onMouseDown={() => select(s)}
                            style={{
                                padding: "10px 16px", cursor: "pointer", display: "flex",
                                alignItems: "center", gap: 10, transition: "background 0.1s",
                                borderBottom: i < matches.length - 1 ? "1px solid #F3F4F6" : "none",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#EEF2FF"}
                            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                        >
                            <span style={{
                                width: 32, height: 32, borderRadius: "50%", background: "#EEF2FF",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 14, flexShrink: 0,
                            }}>🎓</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 13, color: "#1F2937" }}>{s.name}</div>
                                {(s.class || s.email) && (
                                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                                        {s.class ? `${s.class}` : ""}{s.class && s.email ? " · " : ""}{s.email || ""}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── Field wrapper ───────────────────────────────────────── */
function Field({ icon, label, children }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>
                <span style={{ fontSize: 15 }}>{icon}</span>{label}
            </label>
            {children}
        </div>
    );
}

/* ─── Badge colours by classType ─── */
function TypeBadge({ type }) {
    const map = {
        "Class 11": { bg: "#F0FDF4", color: "#16A34A", icon: "📗" },
        "Class 12": { bg: "#EEF2FF", color: "#4F46E5", icon: "📘" },
        "Individual": { bg: "#FDF4FF", color: "#9333EA", icon: "👤" },
    };
    const s = map[type] || { bg: "#F3F4F6", color: "#374151", icon: "📅" };
    return (
        <span style={{
            padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: s.bg, color: s.color, whiteSpace: "nowrap"
        }}>{s.icon} {type}</span>
    );
}

/* ═══════════════ SCHEDULE FORM (Add / Edit) ═══════════════ */
function ScheduleForm({ initial, students, onSave, onCancel, saving, isMobile }) {
    const emptyForm = {
        classType: "Class 11", studentName: "", subject: "",
        topic: "", date: "", hour: "10", minute: "00", ampm: "AM", meetingLink: "",
    };
    const [form, setForm] = useState(initial || emptyForm);

    useEffect(() => { if (initial) setForm(initial); }, [JSON.stringify(initial)]);

    const inp = {
        width: "100%", padding: "11px 14px", borderRadius: 10, border: "2px solid #E5E7EB",
        fontSize: 13, outline: "none", boxSizing: "border-box", background: "#F9FAFB",
        fontFamily: "Inter, Poppins, sans-serif", color: "#1F2937", transition: "border 0.15s",
    };
    const onFocus = e => (e.target.style.border = "2px solid #6366f1");
    const onBlur = e => (e.target.style.border = "2px solid #E5E7EB");

    return (
        <div style={{ background: "#fff", borderRadius: 20, padding: isMobile ? 20 : 32, boxShadow: "0 4px 28px rgba(0,0,0,0.09)", marginBottom: 32, border: "2px solid #EEF2FF" }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#1F2937", marginBottom: 22 }}>
                {initial ? "✏️ Edit Scheduled Class" : "✍️ Schedule a New Class"}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 24px" }}>
                {/* Class type */}
                <div style={{ gridColumn: isMobile ? "1" : "1 / -1" }}>
                    <Field icon="🎓" label="Class / Audience">
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {CLASS_OPTS.map(opt => (
                                <label key={opt} style={{
                                    display: "flex", alignItems: "center", gap: 7, padding: "9px 16px",
                                    borderRadius: 30, cursor: "pointer", fontWeight: 700, fontSize: 12,
                                    border: "2px solid", transition: "all 0.15s",
                                    borderColor: form.classType === opt ? "#6366f1" : "#E5E7EB",
                                    background: form.classType === opt ? "#EEF2FF" : "#F9FAFB",
                                    color: form.classType === opt ? "#4F46E5" : "#6B7280",
                                }}>
                                    <input type="radio" name="classType" value={opt}
                                        checked={form.classType === opt}
                                        onChange={() => setForm(p => ({ ...p, classType: opt, studentName: "" }))}
                                        style={{ accentColor: "#6366f1" }} />
                                    {opt === "Class 11" ? "📗 Class 11" : opt === "Class 12" ? "📘 Class 12" : "👤 Individual"}
                                </label>
                            ))}
                        </div>
                        {form.classType === "Individual" && (
                            <>
                                <StudentPicker
                                    value={form.studentName}
                                    onChange={val => setForm(p => ({ ...p, studentName: val }))}
                                    onSelect={student => {
                                        const subj = resolveSubject(student);
                                        setForm(p => ({
                                            ...p,
                                            studentName: student.name,
                                            ...(subj && { subject: subj }),
                                        }));
                                    }}
                                    students={students}
                                />
                            </>
                        )}
                    </Field>
                </div>

                {/* Subject */}
                <Field icon="📚" label="Subject">
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {SUBJECTS.map(s => (
                            <button key={s} type="button"
                                onClick={() => setForm(p => ({ ...p, subject: p.subject === s ? "" : s }))}
                                style={{
                                    padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                                    cursor: "pointer", border: "2px solid",
                                    borderColor: form.subject === s ? "#6366f1" : "#E5E7EB",
                                    background: form.subject === s ? "#EEF2FF" : "#F9FAFB",
                                    color: form.subject === s ? "#4F46E5" : "#6B7280",
                                }}>{s}</button>
                        ))}
                    </div>
                </Field>

                {/* Topic */}
                <Field icon="📝" label="Topic / Chapter">
                    <input value={form.topic}
                        onChange={e => setForm(p => ({ ...p, topic: e.target.value }))}
                        placeholder="e.g. Partnership Accounts — Chapter 3"
                        style={inp} onFocus={onFocus} onBlur={onBlur} />
                </Field>

                {/* Date */}
                <Field icon="📅" label="Date">
                    <input type="date" value={form.date}
                        onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                        min={new Date().toISOString().split("T")[0]}
                        style={{ ...inp, colorScheme: "light" }} onFocus={onFocus} onBlur={onBlur} />
                </Field>

                {/* Time */}
                <Field icon="🕐" label="Time (12-hr)">
                    <div style={{ display: "flex", gap: 8 }}>
                        <select value={form.hour} onChange={e => setForm(p => ({ ...p, hour: e.target.value }))}
                            style={{ ...inp, flex: 1 }} onFocus={onFocus} onBlur={onBlur}>
                            {HOURS.map(h => <option key={h} value={h}>{pad(h)}</option>)}
                        </select>
                        <select value={form.minute} onChange={e => setForm(p => ({ ...p, minute: e.target.value }))}
                            style={{ ...inp, flex: 1 }} onFocus={onFocus} onBlur={onBlur}>
                            {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select value={form.ampm} onChange={e => setForm(p => ({ ...p, ampm: e.target.value }))}
                            style={{ ...inp, flex: 1 }} onFocus={onFocus} onBlur={onBlur}>
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                        </select>
                    </div>
                </Field>

                {/* Meeting link */}
                <div style={{ gridColumn: isMobile ? "1" : "1 / -1" }}>
                    <Field icon="🔗" label="Meeting Link (Zoom / Google Meet)">
                        <input value={form.meetingLink} type="url"
                            onChange={e => setForm(p => ({ ...p, meetingLink: e.target.value }))}
                            placeholder="https://meet.google.com/abc-def-ghi"
                            style={inp} onFocus={onFocus} onBlur={onBlur} />
                    </Field>
                </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button onClick={() => onSave(form)} disabled={saving} style={{
                    flex: 1, padding: "13px 0", borderRadius: 12,
                    background: saving ? "#aaa" : "linear-gradient(135deg,#6366f1,#8B5CF6)",
                    color: "#fff", fontWeight: 800, fontSize: 14,
                    border: "none", cursor: saving ? "not-allowed" : "pointer",
                    boxShadow: saving ? "none" : "0 6px 20px rgba(99,102,241,0.4)",
                    transition: "all 0.2s",
                }}>
                    {saving ? "Saving…" : (initial ? "💾 Save Changes" : "📅 Schedule Class")}
                </button>
                {onCancel && (
                    <button onClick={onCancel} style={{
                        padding: "13px 24px", borderRadius: 12, background: "#F3F4F6",
                        color: "#374151", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer",
                    }}>Cancel</button>
                )}
            </div>
        </div>
    );
}

/* ─── Upcoming class row ─── */
function ClassRow({ c, isLast, onEdit, onDelete }) {
    const isPast = isClassPast(c.date, c.time);
    return (
        <div style={{
            display: "flex", gap: 14, padding: "16px 0",
            borderBottom: isLast ? "none" : "1px solid #F3F4F6",
            opacity: isPast ? 0.55 : 1,
            alignItems: "flex-start", flexWrap: "wrap",
        }}>
            {/* Date tile */}
            <div style={{
                minWidth: 52, textAlign: "center", background: isPast ? "#F3F4F6" : "linear-gradient(135deg,#6366f1,#8B5CF6)",
                borderRadius: 14, padding: "8px 4px", flexShrink: 0,
            }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: isPast ? "#9CA3AF" : "#fff", lineHeight: 1 }}>
                    {c.date ? new Date(c.date + "T00:00:00").getDate() : "—"}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: isPast ? "#9CA3AF" : "rgba(255,255,255,0.8)", textTransform: "uppercase" }}>
                    {c.date ? MONTHS[new Date(c.date + "T00:00:00").getMonth()].slice(0, 3) : ""}
                </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: "#1F2937", marginBottom: 4 }}>{c.topic}</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                            <TypeBadge type={c.classType} />
                            {c.subject && (
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", background: "#F9FAFB", borderRadius: 20, padding: "3px 10px", display: "flex", alignItems: "center" }}>
                                    📚 {c.subject}
                                </span>
                            )}
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", background: "#F9FAFB", borderRadius: 20, padding: "3px 10px", display: "flex", alignItems: "center" }}>
                                🕐 {c.time}
                            </span>
                            {c.classType === "Individual" && c.studentName && (
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", background: "#F9FAFB", borderRadius: 20, padding: "3px 10px", display: "flex", alignItems: "center" }}>
                                    👤 {c.studentName}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {c.meetingLink && (
                    <div style={{ display: "flex", gap: 10, marginTop: 4, alignItems: "center" }}>
                        <a href={c.meetingLink} target="_blank" rel="noreferrer" style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "7px 16px", borderRadius: 20,
                            background: isPast ? "#F3F4F6" : "linear-gradient(135deg,#6366f1,#8B5CF6)",
                            color: isPast ? "#9CA3AF" : "#fff",
                            fontWeight: 700, fontSize: 12, textDecoration: "none",
                        }}
                            onClick={isPast ? (e) => e.preventDefault() : undefined}
                        >
                            🔗 Join Class
                        </a>
                        <button onClick={() => onEdit(c)} style={{
                            background: "transparent", border: "none", color: "#6366f1", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "5px 10px"
                        }}>✏️ Edit</button>
                        <button onClick={() => onDelete(c.id)} style={{
                            background: "transparent", border: "none", color: "#EF4444", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "5px 10px"
                        }}>🗑️ Delete</button>
                    </div>
                )}
            </div>
            <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "right", alignSelf: "flex-end", flexShrink: 0 }}>
                {formatDateShort(c.date)}
            </div>
        </div>
    );
}

/* ═══════════════ MAIN COMPONENT ═══════════════ */
export default function ClassManagement() {
    const { user } = useAuth();
    const isMobile = useIsMobile(900);
    const now = new Date();

    const [month, setMonth] = useState(now.getMonth());
    const [year, setYear] = useState(now.getFullYear());
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("upcoming");
    const [selectedDay, setSelectedDay] = useState(null);

    const [mode, setMode] = useState(null); // "add" | "edit" | null
    const [editingClass, setEditingClass] = useState(null);
    const [saving, setSaving] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [deleteId, setDeleteId] = useState(null);

    const teacherName = user?.name || user?.displayName || user?.email || "";

    /* ── Toast helper ── */
    const toast = (msg, type = "success") => {
        const id = Date.now();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
    };

    /* ── Fetch students for autocomplete ── */
    useEffect(() => {
        getDocs(collection(db, "students"))
            .then(s => setStudents(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    /* ── Real-time: fetch all classes assigned to this teacher ── */
    useEffect(() => {
        if (!teacherName) { setLoading(false); return; }
        const q = query(
            collection(db, "scheduled_classes"),
            where("teacherName", "==", teacherName)
        );
        const unsub = onSnapshot(q,
            snap => {
                const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                // Sort client-side by createdAt descending
                docs.sort((a, b) => {
                    const ta = a.createdAt?.seconds ?? 0;
                    const tb = b.createdAt?.seconds ?? 0;
                    return tb - ta;
                });
                setClasses(docs);
                setLoading(false);
            },
            err => {
                console.error("Firestore error:", err);
                setLoading(false);
            }
        );
        return () => unsub();
    }, [teacherName]);

    /* ── Validate ── */
    const validate = (form) => {
        if (form.classType === "Individual" && !form.studentName.trim()) { toast("Student name required for Individual", "error"); return false; }
        if (!form.topic.trim()) { toast("Topic is required", "error"); return false; }
        if (!form.date) { toast("Please pick a date", "error"); return false; }
        if (!form.meetingLink.trim()) { toast("Meeting link is required", "error"); return false; }

        if (isClassPast(form.date, buildTime(form.hour, form.minute, form.ampm))) {
            toast("Cannot schedule a class in the past", "error");
            return false;
        }
        return true;
    };

    /* ── Add ── */
    const handleAdd = async (form) => {
        if (!validate(form)) return;
        setSaving(true);
        try {
            await addDoc(collection(db, "scheduled_classes"), {
                classType: form.classType,
                studentName: form.classType === "Individual" ? form.studentName.trim() : null,
                teacherName: teacherName,
                teacherUid: user?.uid || null,
                subject: form.subject,
                topic: form.topic.trim(),
                date: form.date,
                time: buildTime(form.hour, form.minute, form.ampm),
                meetingLink: form.meetingLink.trim(),
                createdBy: user?.uid || null,
                createdAt: Timestamp.now(),
            });
            toast("Class scheduled successfully! 🎉");
            setMode(null);
        } catch (e) { toast("Failed to schedule: " + e.message, "error"); }
        finally { setSaving(false); }
    };

    /* ── Edit ── */
    const handleEdit = async (form) => {
        if (!validate(form) || !editingClass) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, "scheduled_classes", editingClass.id), {
                classType: form.classType,
                studentName: form.classType === "Individual" ? form.studentName.trim() : null,
                teacherName: teacherName,
                teacherUid: user?.uid || null,
                subject: form.subject,
                topic: form.topic.trim(),
                date: form.date,
                time: buildTime(form.hour, form.minute, form.ampm),
                meetingLink: form.meetingLink.trim(),
                updatedBy: user?.uid || null,
                updatedAt: Timestamp.now(),
            });
            toast("Class updated ✓");
            setMode(null);
            setEditingClass(null);
        } catch (e) { toast("Update failed: " + e.message, "error"); }
        finally { setSaving(false); }
    };

    /* ── Delete ── */
    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, "scheduled_classes", id));
            setDeleteId(null);
            toast("Class removed");
        } catch (e) { toast("Delete failed: " + e.message, "error"); }
    };

    const openEdit = (c) => {
        setEditingClass(c);
        setMode("edit");
        setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
    };

    const editInitial = editingClass ? {
        classType: editingClass.classType || "Class 11",
        studentName: editingClass.studentName || "",
        subject: editingClass.subject || "",
        topic: editingClass.topic || "",
        date: editingClass.date || "",
        meetingLink: editingClass.meetingLink || "",
        ...parseTime(editingClass.time),
    } : null;

    /* ── Calendar helpers ── */
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
    const startOffset = (firstDayOfMonth + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const grid = [];
    for (let i = 0; i < startOffset; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);

    const getClassesForDay = (d) => {
        if (!d) return [];
        return classes.filter(c => {
            if (!c.date) return false;
            const cd = new Date(c.date + "T00:00:00");
            return cd.getDate() === d && cd.getMonth() === month && cd.getFullYear() === year;
        });
    };

    /* ── Filtered list ── */
    const todayStr = now.toISOString().split("T")[0];
    const filtered = filter === "upcoming"
        ? classes.filter(c => c.date > todayStr || (c.date === todayStr && !isClassPast(c.date, c.time)))
        : filter === "today"
            ? classes.filter(c => c.date === todayStr)
            : filter === "past"
                ? classes.filter(c => isClassPast(c.date, c.time))
                : classes;

    const dayClasses = selectedDay ? getClassesForDay(selectedDay) : [];

    /* ── Nav button style ── */
    const navBtn = {
        background: "#F3F4F6", border: "none", borderRadius: 10,
        width: 34, height: 34, cursor: "pointer", fontSize: 14, color: "#374151",
        fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div style={{ textAlign: "center", padding: 80, color: "#9CA3AF" }}>
                    <div style={{ width: 40, height: 40, border: "4px solid #EEF2FF", borderTop: "4px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    Loading your schedule…
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Toast toasts={toasts} />

            {/* Delete confirm modal */}
            {deleteId && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "#fff", borderRadius: 20, padding: 32, maxWidth: 340, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
                        <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 8 }}>Remove this class?</div>
                        <div style={{ color: "#888", marginBottom: 24, fontSize: 13 }}>This cannot be undone. Students will no longer see it.</div>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button onClick={() => handleDelete(deleteId)} style={{ flex: 1, padding: 13, borderRadius: 12, background: "#EF4444", color: "#fff", fontWeight: 800, border: "none", cursor: "pointer" }}>Remove</button>
                            <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: 13, borderRadius: 12, background: "#F3F4F6", color: "#374151", fontWeight: 700, border: "none", cursor: "pointer" }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Header ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontFamily: "Inter, Poppins, sans-serif", fontSize: 30, fontWeight: 900, color: "#1F2937", marginBottom: 4 }}>
                        📅 My Class Schedule
                    </h1>
                    <p style={{ color: "#9CA3AF", fontSize: 14 }}>
                        Manage your classes · {classes.length} total &nbsp;·&nbsp;
                        <span style={{ color: "#6366f1", fontWeight: 700 }}>{teacherName}</span>
                    </p>
                </div>
                <button
                    onClick={() => { setMode(mode === "add" ? null : "add"); setEditingClass(null); }}
                    style={{
                        padding: "12px 24px", borderRadius: 30, fontWeight: 800, fontSize: 14,
                        background: mode === "add" ? "#F3F4F6" : "linear-gradient(135deg,#6366f1,#8B5CF6)",
                        color: mode === "add" ? "#374151" : "#fff",
                        border: "none", cursor: "pointer",
                        boxShadow: mode === "add" ? "none" : "0 6px 20px rgba(99,102,241,0.4)",
                        transition: "all 0.2s",
                    }}>
                    {mode === "add" ? "✕ Cancel" : "+ Schedule Class"}
                </button>
            </div>

            {/* ── Add / Edit Form (collapsible) ── */}
            {(mode === "add" || mode === "edit") && (
                <ScheduleForm
                    key={mode === "edit" ? editingClass?.id : "new"}
                    initial={mode === "edit" ? editInitial : null}
                    students={students}
                    onSave={mode === "edit" ? handleEdit : handleAdd}
                    onCancel={() => { setMode(null); setEditingClass(null); }}
                    saving={saving}
                    isMobile={isMobile}
                />
            )}

            {/* ── Main grid ── */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 380px", gap: 24, alignItems: "start" }}>

                {/* ═══ CLASS LIST ═══ */}
                <div style={{ background: "#fff", borderRadius: 24, padding: isMobile ? 20 : 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                    {/* Filter tabs */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                        {[["upcoming", "⏰ Upcoming"], ["today", "📅 Today"], ["past", "✅ Past"], ["all", "📋 All"]].map(([v, l]) => (
                            <button key={v} onClick={() => { setFilter(v); setSelectedDay(null); }} style={{
                                padding: "8px 18px", borderRadius: 30, fontWeight: 700, fontSize: 13,
                                border: "none", cursor: "pointer",
                                background: filter === v ? "#6366f1" : "#F3F4F6",
                                color: filter === v ? "#fff" : "#374151",
                                transition: "all 0.15s",
                            }}>{l}</button>
                        ))}
                        {selectedDay && (
                            <button onClick={() => setSelectedDay(null)} style={{
                                padding: "8px 18px", borderRadius: 30, fontWeight: 700, fontSize: 13,
                                border: "1.5px solid #6366f1", cursor: "pointer",
                                background: "#EEF2FF", color: "#4F46E5",
                            }}>
                                {MONTHS[month].slice(0, 3)} {selectedDay} ✕
                            </button>
                        )}
                    </div>

                    {/* Class rows */}
                    {(selectedDay ? dayClasses : filtered).length === 0 ? (
                        <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>🗓️</div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: "#1F2937" }}>
                                {selectedDay ? `No class on ${MONTHS[month].slice(0, 3)} ${selectedDay}` : "No classes in this view"}
                            </div>
                            <div style={{ fontSize: 13, marginTop: 6 }}>
                                {filter === "upcoming" ? "All your upcoming classes will appear here." : "Switch filter to see classes."}
                            </div>
                        </div>
                    ) : (
                        (selectedDay ? dayClasses : filtered).map((c, i, arr) => (
                            <ClassRow key={c.id} c={c} isLast={i === arr.length - 1} onEdit={() => openEdit(c)} onDelete={(id) => setDeleteId(id)} />
                        ))
                    )}
                </div>

                {/* ═══ CALENDAR SIDEBAR ═══ */}
                <div style={{ position: isMobile ? "static" : "sticky", top: 24 }}>
                    <div style={{ background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                        {/* Month nav */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <button style={navBtn} onClick={() => {
                                if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
                                setSelectedDay(null);
                            }}>‹</button>
                            <div style={{ fontWeight: 800, fontSize: 15, color: "#1F2937" }}>{MONTHS[month]} {year}</div>
                            <button style={navBtn} onClick={() => {
                                if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
                                setSelectedDay(null);
                            }}>›</button>
                        </div>

                        {/* Day labels */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 4 }}>
                            {DAYS.map(d => (
                                <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", padding: "3px 0" }}>{d}</div>
                            ))}
                        </div>

                        {/* Date grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
                            {grid.map((d, i) => {
                                const dayCls = d ? getClassesForDay(d) : [];
                                const hasClass = dayCls.length > 0;
                                const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                                const isSelected = d === selectedDay;
                                return (
                                    <div key={`${d}-${i}`}
                                        onClick={() => d && setSelectedDay(d === selectedDay ? null : d)}
                                        style={{
                                            textAlign: "center", padding: "7px 2px", borderRadius: 10, fontSize: 13,
                                            fontWeight: d ? 600 : 400,
                                            cursor: d ? "pointer" : "default",
                                            color: !d ? "transparent" : isSelected ? "#fff" : isToday ? "#fff" : hasClass ? "#4F46E5" : "#374151",
                                            background: !d ? "transparent" : isSelected ? "#6366f1" : isToday ? "#4F46E5" : hasClass ? "#EEF2FF" : "transparent",
                                            transition: "all 0.1s",
                                            position: "relative",
                                        }}>
                                        {d ?? ""}
                                        {hasClass && !isSelected && !isToday && (
                                            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#6366f1", margin: "2px auto 0" }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #F3F4F6", display: "flex", gap: 16, flexWrap: "wrap" }}>
                            {[["#4F46E5", "#fff", "Today"], ["#EEF2FF", "#4F46E5", "Class day"], ["#6366f1", "#fff", "Selected"]].map(([bg, col, lbl]) => (
                                <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6B7280" }}>
                                    <div style={{ width: 14, height: 14, borderRadius: 4, background: bg, border: "1px solid #E5E7EB" }} />
                                    {lbl}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stats card */}
                    <div style={{ background: "linear-gradient(135deg,#6366f1,#8B5CF6)", borderRadius: 20, padding: 20, marginTop: 16, color: "#fff" }}>
                        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>📊 Overview</div>
                        {[
                            ["📅", "Total", classes.length],
                            ["⏰", "Upcoming", classes.filter(c => c.date > todayStr || (c.date === todayStr && !isClassPast(c.date, c.time))).length],
                            ["☀️", "Today", classes.filter(c => c.date === todayStr).length],
                            ["✅", "Completed", classes.filter(c => isClassPast(c.date, c.time)).length],
                        ].map(([icon, lbl, val]) => (
                            <div key={lbl} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                                <span style={{ opacity: 0.85 }}>{icon} {lbl}</span>
                                <span style={{ fontWeight: 800 }}>{val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
