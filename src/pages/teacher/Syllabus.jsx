import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { db } from "../../firebase";
import {
    collection, addDoc, updateDoc, deleteDoc, doc,
    query, onSnapshot, Timestamp,
} from "firebase/firestore";
import useIsMobile from "../../hooks/useIsMobile";

/* ─── Defaults (teacher can add more any time) ──────────────── */
const DEFAULT_SUBJECTS = ["Accountancy", "Business Studies"];
const CLASS_OPTS = ["Class 11", "Class 12", "Both"];

const EMPTY_CHAPTER = { name: "", description: "" };
const EMPTY_FORM = { subject: "", class: "Class 11", description: "", chapters: [{ ...EMPTY_CHAPTER }] };

/* ─── Subject autocomplete input ─────────────────────────── */
function SubjectInput({ value, onChange, suggestions }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filtered = suggestions.filter(s =>
        s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase()
    );

    const inp = {
        width: "100%", padding: "10px 14px", borderRadius: 10,
        border: "2px solid #E5E7EB", fontSize: 13, outline: "none",
        boxSizing: "border-box", background: "#F9FAFB",
        fontFamily: "Inter, sans-serif", transition: "border 0.15s",
    };

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <input
                value={value}
                onChange={e => { onChange(e.target.value); setOpen(true); }}
                placeholder="e.g. Accountancy, Business Studies…"
                style={inp}
                onFocus={e => { e.target.style.border = "2px solid #6366f1"; setOpen(true); }}
                onBlur={e => e.target.style.border = "2px solid #E5E7EB"}
            />
            {open && filtered.length > 0 && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
                    background: "#fff", borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.13)",
                    border: "1.5px solid #E5E7EB", overflow: "hidden",
                }}>
                    {filtered.map((s, i) => (
                        <div key={s}
                            onMouseDown={() => { onChange(s); setOpen(false); }}
                            style={{
                                padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600,
                                borderBottom: i < filtered.length - 1 ? "1px solid #F3F4F6" : "none",
                                transition: "background 0.1s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#EEF2FF"}
                            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                        >
                            📚 {s}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ═══════════════ MAIN ═══════════════ */
export default function Syllabus() {
    const isMobile = useIsMobile(900);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState(null);    // null | "add" | "edit"
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ ...EMPTY_FORM, chapters: [{ ...EMPTY_CHAPTER }] });
    const [saving, setSaving] = useState(false);
    const [expanded, setExpanded] = useState({});
    const [deleteId, setDeleteId] = useState(null);
    const [toast, setToast] = useState(null);

    /* ── Toast ── */
    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    /* ── Dynamic subject suggestions = defaults + any unique subjects already saved ── */
    const uniqueSubjects = [
        ...new Set([...DEFAULT_SUBJECTS, ...courses.map(c => c.subject).filter(Boolean)])
    ];

    /* ── Real-time subscription ── */
    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "courses")), snap => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            docs.sort((a, b) => (a.subject || "").localeCompare(b.subject || ""));
            setCourses(docs);
            setLoading(false);
        }, err => { console.error(err); setLoading(false); });
        return () => unsub();
    }, []);

    /* ── Chapter helpers ── */
    const addChapter = () => setForm(p => ({ ...p, chapters: [...p.chapters, { ...EMPTY_CHAPTER }] }));
    const removeChapter = i => setForm(p => ({ ...p, chapters: p.chapters.filter((_, idx) => idx !== i) }));
    const setChapter = (i, key, val) => setForm(p => {
        const chs = [...p.chapters]; chs[i] = { ...chs[i], [key]: val }; return { ...p, chapters: chs };
    });

    /* ── Open edit ── */
    const openEdit = c => {
        setEditingId(c.id);
        setForm({ subject: c.subject || "", class: c.class || "Class 11", description: c.description || "", chapters: c.chapters?.length ? c.chapters : [{ ...EMPTY_CHAPTER }] });
        setMode("edit");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    /* ── Save ── */
    const save = async () => {
        if (!form.subject.trim()) { showToast("Enter a subject name", "error"); return; }
        if (form.chapters.some(ch => !ch.name.trim())) { showToast("All chapters need a name", "error"); return; }
        setSaving(true);
        try {
            const payload = {
                subject: form.subject.trim(),
                class: form.class,
                description: form.description.trim(),
                chapters: form.chapters.map(ch => ({ name: ch.name.trim(), description: ch.description.trim() })),
                subjectClass: `${form.subject.trim()}__${form.class}`,
            };
            if (editingId) {
                await updateDoc(doc(db, "courses", editingId), { ...payload, updatedAt: Timestamp.now() });
                showToast("Course updated ✓");
            } else {
                await addDoc(collection(db, "courses"), { ...payload, createdAt: Timestamp.now() });
                showToast("Course added 🎉");
            }
            setMode(null); setEditingId(null);
            setForm({ ...EMPTY_FORM, chapters: [{ ...EMPTY_CHAPTER }] });
        } catch (e) { showToast("Error: " + e.message, "error"); }
        finally { setSaving(false); }
    };

    /* ── Delete ── */
    const confirmDelete = async () => {
        try { await deleteDoc(doc(db, "courses", deleteId)); setDeleteId(null); showToast("Deleted"); }
        catch (e) { showToast("Delete failed: " + e.message, "error"); }
    };

    /* ── Styles ── */
    const inp = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E5E7EB", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#F9FAFB", fontFamily: "Inter, sans-serif", transition: "border 0.15s" };
    const fo = e => e.target.style.border = "2px solid #6366f1";
    const bl = e => e.target.style.border = "2px solid #E5E7EB";
    const Lbl = ({ children }) => (
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>{children}</div>
    );

    return (
        <DashboardLayout>
            {/* Toast */}
            {toast && (
                <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, padding: "14px 22px", borderRadius: 14, fontWeight: 700, fontSize: 14, background: toast.type === "success" ? "#E6FCF5" : "#FFF0F0", color: toast.type === "success" ? "#20C997" : "#c92a2a", boxShadow: "0 8px 32px rgba(0,0,0,0.13)", border: "1.5px solid currentColor" }}>
                    {toast.type === "success" ? "✓ " : "✕ "}{toast.msg}
                </div>
            )}

            {/* Delete confirm */}
            {deleteId && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "#fff", borderRadius: 20, padding: 32, maxWidth: 340, width: "90%", textAlign: "center" }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
                        <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 8 }}>Delete this course?</div>
                        <div style={{ color: "#888", marginBottom: 24, fontSize: 13 }}>Students enrolled in this course will lose access to the syllabus.</div>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button onClick={confirmDelete} style={{ flex: 1, padding: 13, borderRadius: 12, background: "#EF4444", color: "#fff", fontWeight: 800, border: "none", cursor: "pointer" }}>Delete</button>
                            <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: 13, borderRadius: 12, background: "#F3F4F6", color: "#374151", fontWeight: 700, border: "none", cursor: "pointer" }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Page header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1F2937", marginBottom: 4 }}>📚 Syllabus Management</h1>
                    <p style={{ color: "#9CA3AF", fontSize: 13 }}>Add chapter-wise syllabi per subject and class. Students and teachers see only their matching course.</p>
                </div>
                <button
                    onClick={() => { setMode(mode === "add" ? null : "add"); setEditingId(null); setForm({ ...EMPTY_FORM, chapters: [{ ...EMPTY_CHAPTER }] }); }}
                    style={{ padding: "12px 24px", borderRadius: 30, fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", transition: "all 0.2s", background: mode === "add" ? "#F3F4F6" : "linear-gradient(135deg,#6366f1,#8B5CF6)", color: mode === "add" ? "#374151" : "#fff", boxShadow: mode === "add" ? "none" : "0 6px 20px rgba(99,102,241,0.4)" }}>
                    {mode === "add" ? "✕ Cancel" : "+ Add Course"}
                </button>
            </div>

            {/* ═══ FORM ═══ */}
            {(mode === "add" || mode === "edit") && (
                <div style={{ background: "#fff", borderRadius: 20, padding: isMobile ? 20 : 32, boxShadow: "0 4px 28px rgba(0,0,0,0.09)", marginBottom: 32, border: "2px solid #EEF2FF" }}>
                    <div style={{ fontWeight: 800, fontSize: 17, color: "#1F2937", marginBottom: 24 }}>
                        {mode === "edit" ? "✏️ Edit Course" : "➕ Add New Course"}
                    </div>

                    {/* Subject + Class + Description — 3 col grid */}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 2fr", gap: "0 20px", marginBottom: 24 }}>
                        {/* Subject — free-type with autocomplete */}
                        <div>
                            <Lbl>📚 Subject Name *</Lbl>
                            <SubjectInput
                                value={form.subject}
                                onChange={val => setForm(p => ({ ...p, subject: val }))}
                                suggestions={uniqueSubjects}
                            />
                            <div style={{ marginTop: 6, fontSize: 11, color: "#9CA3AF" }}>
                                Type your own or pick from suggestions below the field
                            </div>
                        </div>

                        {/* Class — dropdown */}
                        <div>
                            <Lbl>🏫 Class *</Lbl>
                            <select value={form.class} onChange={e => setForm(p => ({ ...p, class: e.target.value }))}
                                style={{ ...inp, cursor: "pointer", height: 42 }}>
                                {CLASS_OPTS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Description */}
                        <div>
                            <Lbl>📝 Overview (optional)</Lbl>
                            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                rows={3} placeholder="Brief overview of what students will learn…"
                                style={{ ...inp, resize: "vertical" }} onFocus={fo} onBlur={bl} />
                        </div>
                    </div>

                    {/* Chapters */}
                    <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                            <Lbl>📖 Chapters / Units *</Lbl>
                            <button type="button" onClick={addChapter} style={{ padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "#EEF2FF", color: "#4F46E5", border: "none", cursor: "pointer" }}>+ Add Chapter</button>
                        </div>
                        {form.chapters.map((ch, i) => (
                            <div key={i} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr auto", gap: 10, marginBottom: 10, alignItems: "start" }}>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", marginBottom: 4 }}>Chapter {i + 1} *</div>
                                    <input value={ch.name} onChange={e => setChapter(i, "name", e.target.value)}
                                        placeholder={`e.g. Chapter ${i + 1}: Partnership Accounts`}
                                        style={inp} onFocus={fo} onBlur={bl} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", marginBottom: 4 }}>Short Description</div>
                                    <input value={ch.description} onChange={e => setChapter(i, "description", e.target.value)}
                                        placeholder="Brief topic summary (optional)"
                                        style={inp} onFocus={fo} onBlur={bl} />
                                </div>
                                {form.chapters.length > 1 && (
                                    <button type="button" onClick={() => removeChapter(i)} style={{ marginTop: 24, padding: "9px 14px", borderRadius: 10, background: "#FEF2F2", color: "#EF4444", border: "none", cursor: "pointer", fontWeight: 700 }}>✕</button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Buttons */}
                    <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                        <button onClick={save} disabled={saving} style={{ flex: 1, padding: "13px 0", borderRadius: 12, background: saving ? "#aaa" : "linear-gradient(135deg,#6366f1,#8B5CF6)", color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: saving ? "not-allowed" : "pointer" }}>
                            {saving ? "Saving…" : mode === "edit" ? "💾 Save Changes" : "➕ Add Course"}
                        </button>
                        <button onClick={() => { setMode(null); setEditingId(null); }} style={{ padding: "13px 24px", borderRadius: 12, background: "#F3F4F6", color: "#374151", fontWeight: 700, border: "none", cursor: "pointer" }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* ═══ LIST ═══ */}
            <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: 60, textAlign: "center", color: "#9CA3AF" }}>
                        <div style={{ width: 36, height: 36, border: "4px solid #EEF2FF", borderTop: "4px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        Loading courses…
                    </div>
                ) : courses.length === 0 ? (
                    <div style={{ padding: 60, textAlign: "center", color: "#9CA3AF" }}>
                        <div style={{ fontSize: 48, marginBottom: 14 }}>📚</div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: "#1F2937", marginBottom: 6 }}>No courses yet</div>
                        <div style={{ fontSize: 13 }}>Click "+ Add Course" above to build your first syllabus</div>
                    </div>
                ) : courses.map((c, idx) => {
                    const isExp = expanded[c.id];
                    return (
                        <div key={c.id} style={{ borderBottom: idx < courses.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                            {/* Row */}
                            <div style={{ display: "flex", alignItems: "center", padding: "18px 24px", gap: 16, cursor: "pointer" }}
                                onClick={() => setExpanded(p => ({ ...p, [c.id]: !p[c.id] }))}>
                                <div style={{ width: 44, height: 44, borderRadius: 14, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📒</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                                        <span style={{ fontWeight: 800, fontSize: 15, color: "#1F2937" }}>{c.subject}</span>
                                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#E6FCF5", color: "#0D9488" }}>{c.class}</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                                        {c.chapters?.length || 0} chapter{c.chapters?.length !== 1 ? "s" : ""}
                                        {c.description ? ` · ${c.description.slice(0, 70)}${c.description.length > 70 ? "…" : ""}` : ""}
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                    <button onClick={e => { e.stopPropagation(); openEdit(c); }} style={{ padding: "7px 16px", borderRadius: 20, fontWeight: 700, fontSize: 12, background: "#EEF2FF", color: "#4F46E5", border: "none", cursor: "pointer" }}>✏️ Edit</button>
                                    <button onClick={e => { e.stopPropagation(); setDeleteId(c.id); }} style={{ padding: "7px 16px", borderRadius: 20, fontWeight: 700, fontSize: 12, background: "#FEF2F2", color: "#EF4444", border: "none", cursor: "pointer" }}>🗑 Delete</button>
                                    <span style={{ fontSize: 16, color: "#9CA3AF", alignSelf: "center" }}>{isExp ? "▲" : "▼"}</span>
                                </div>
                            </div>

                            {/* Expanded chapters */}
                            {isExp && (
                                <div style={{ padding: "0 24px 20px 72px" }}>
                                    {c.description && (
                                        <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#374151", fontStyle: "italic" }}>
                                            {c.description}
                                        </div>
                                    )}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
                                        {(c.chapters || []).map((ch, ci) => (
                                            <div key={ci} style={{ background: "#F9FAFB", borderRadius: 12, padding: "12px 16px", border: "1px solid #F3F4F6" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: ch.description ? 5 : 0 }}>
                                                    <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#EEF2FF", color: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{ci + 1}</span>
                                                    <span style={{ fontWeight: 700, fontSize: 13, color: "#1F2937" }}>{ch.name}</span>
                                                </div>
                                                {ch.description && <div style={{ fontSize: 12, color: "#9CA3AF", paddingLeft: 29 }}>{ch.description}</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {courses.length > 0 && (
                <div style={{ marginTop: 12, fontSize: 12, color: "#9CA3AF", textAlign: "right" }}>
                    ✓ Changes reflect instantly for teachers and students
                </div>
            )}
        </DashboardLayout>
    );
}
