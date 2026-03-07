import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
    collection, query, where, getDocs, addDoc, updateDoc, deleteDoc,
    doc, serverTimestamp, orderBy, getDoc,
} from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITIES = [
    { label: "High", emoji: "🔴", value: "High", color: "#FF6B6B", bg: "#FFF0F0" },
    { label: "Medium", emoji: "🟡", value: "Medium", color: "#F59F00", bg: "#FFF9DB" },
    { label: "Low", emoji: "🟢", value: "Low", color: "#20C997", bg: "#E6FCF5" },
];

const DIFFICULTIES = [
    { label: "Easy", emoji: "😊", color: "#20C997", bg: "#E6FCF5" },
    { label: "Medium", emoji: "😐", color: "#F59F00", bg: "#FFF9DB" },
    { label: "Hard", emoji: "😤", color: "#FF6B6B", bg: "#FFF0F0" },
];

const MOODS = [
    { key: "energy", label: "Energy Level", icon: "⚡", options: ["Low", "Medium", "High"], colors: ["#FF6B6B", "#F59F00", "#20C997"] },
    { key: "focus", label: "Focus Level", icon: "🎯", options: ["Scattered", "Moderate", "Sharp"], colors: ["#FF6B6B", "#F59F00", "#3B5BDB"] },
    { key: "stress", label: "Stress Level", icon: "😰", options: ["High", "Medium", "Low"], colors: ["#FF6B6B", "#F59F00", "#20C997"] },
    { key: "motivation", label: "Motivation", icon: "🚀", options: ["Low", "Medium", "High"], colors: ["#FF6B6B", "#F59F00", "#6366f1"] },
];

const ACCENT = "#3B5BDB";
const ACCENT_GRAD = "linear-gradient(135deg, #3B5BDB, #4c6ef5)";
const AI_GRAD = "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const label = (txt) => ({
    display: "block", fontSize: 11, fontWeight: 700, color: "#888",
    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7,
});

const card = (extra = {}) => ({
    background: "#fff", borderRadius: 24, padding: 28,
    boxShadow: "0 4px 24px rgba(0,0,0,0.07)", ...extra,
});

const inputSt = {
    width: "100%", padding: "11px 14px", borderRadius: 12,
    border: "2px solid #eee", fontSize: 14, outline: "none",
    background: "#fafbff", boxSizing: "border-box",
    fontFamily: "Inter, Poppins, sans-serif", transition: "border 0.2s",
};

const pri = (p) => PRIORITIES.find(x => x.value === p) || PRIORITIES[1];
const dif = (d) => DIFFICULTIES.find(x => x.label === d) || DIFFICULTIES[0];

function PriorityBadge({ value }) {
    const p = pri(value);
    return (
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: p.bg, color: p.color }}>
            {p.emoji} {p.label}
        </span>
    );
}

function DiffBadge({ value }) {
    const d = dif(value);
    return (
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: d.bg, color: d.color }}>
            {d.emoji} {d.label}
        </span>
    );
}

function ToggleGroup({ options, colors, value, onChange }) {
    return (
        <div style={{ display: "flex", gap: 8 }}>
            {options.map((opt, i) => {
                const active = value === opt;
                return (
                    <button key={opt} onClick={() => onChange(opt)} style={{
                        flex: 1, padding: "10px 0", borderRadius: 12, fontWeight: 700, fontSize: 13,
                        border: `2px solid ${active ? colors[i] : "#eee"}`,
                        background: active ? colors[i] : "#fafbff",
                        color: active ? (colors[i] === "#F59F00" || colors[i] === "#FFD43B" ? "#333" : "#fff") : "#666",
                        cursor: "pointer", transition: "all 0.18s",
                    }}>
                        {opt}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Gemini API call ─────────────────────────────────────────────────────────

async function callGemini(prompt) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
        throw new Error("VITE_GEMINI_API_KEY not set in .env");
    }

    // Step 1: auto-discover which models are available for this key
    let modelName = "gemini-1.5-flash"; // default
    try {
        const listRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        if (listRes.ok) {
            const listData = await listRes.json();
            const available = (listData.models || []).filter(m =>
                m.supportedGenerationMethods?.includes("generateContent")
            );
            console.log("[AI Scheduler] Available models:", available.map(m => m.name));
            // prefer flash models, then pro
            const preferred = available.find(m => m.name.includes("flash")) ||
                available.find(m => m.name.includes("pro")) ||
                available[0];
            if (preferred) {
                // model name comes as "models/gemini-1.5-flash" — strip prefix
                modelName = preferred.name.replace("models/", "");
            }
        }
    } catch (e) {
        console.warn("[AI Scheduler] Could not list models, using default:", e.message);
    }

    console.log(`[AI Scheduler] Using model: ${modelName}`);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    return result.response.text();
}


function buildPrompt(tasks, mood, profile) {
    const taskList = tasks.map((t, i) =>
        `${i + 1}. "${t.taskName}" | Priority: ${t.priority} | Difficulty: ${t.difficulty} | Estimated: ${t.timeRequired}h`
    ).join("\n");

    const profileInfo = [
        profile.class && `Class: ${profile.class}`,
        profile.favSubject && `Favourite Subject: ${profile.favSubject}`,
        profile.focusLevel && `Usual Focus Level: ${profile.focusLevel}`,
        profile.studyPlan && `Study Plan Style: ${profile.studyPlan}`,
        profile.studyTime && `Preferred Study Time: ${profile.studyTime}`,
        profile.dailyHours && `Usual Daily Study Hours: ${profile.dailyHours}`,
        profile.currentAggregate && `Current Aggregate: ${profile.currentAggregate}%`,
        profile.targetAggregate && `Target Aggregate: ${profile.targetAggregate}%`,
    ].filter(Boolean).join("\n");

    return `You are an expert AI study coach for a commerce stream student. Create a personalised, optimised study schedule.

## Student Profile
${profileInfo || "No profile data available."}

## Today's Mood Check-in
- Energy Level: ${mood.energy}
- Focus Level: ${mood.focus}
- Stress Level: ${mood.stress}
- Motivation: ${mood.motivation}
- Planned Study Hours: ${mood.hours} hours
- Study Start Time: ${mood.startTime}

## Tasks to Schedule
${taskList || "No tasks added."}

## Scheduling Rules
- If energy is Low or focus is Scattered: start with Easy tasks to build momentum, keep sessions short (30-45 min), add frequent breaks
- If stress is High: avoid Hard tasks at the start, intersperse light tasks
- If motivation is Low: start with quick wins (Low difficulty tasks)
- Match task difficulty to current energy/focus thresholds
- If student's usual focus is Low (from profile), keep tasks shorter and simpler than normal
- Add 10-15 min breaks between sessions
- Don't exceed the planned study hours
- Consider the student's preferred study time when ordering tasks

## Output Format
Return ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "summary": "2-sentence motivational summary personalised to this student's mood",
  "insight": "1 key insight about why this order was chosen, referencing mood + profile",
  "schedule": [
    {
      "taskName": "exact task name",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "breakAfter": 10,
      "priority": "High|Medium|Low",
      "difficulty": "Easy|Medium|Hard",
      "reason": "short specific reason for this placement (mention energy/focus if relevant)",
      "tip": "a quick actionable study tip for this specific task"
    }
  ],
  "skipped": ["any task names that didn't fit with reason"]
}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TaskScheduler() {
    const { user } = useAuth();
    const [profile, setProfile] = useState({});
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ taskName: "", priority: "Medium", difficulty: "Medium", timeRequired: "1" });
    const [mood, setMood] = useState({
        energy: "Medium", focus: "Moderate", stress: "Medium",
        motivation: "Medium", hours: "4", startTime: "09:00",
    });
    const [schedule, setSchedule] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [adding, setAdding] = useState(false);
    const [aiError, setAiError] = useState("");
    const [step, setStep] = useState("tasks"); // "tasks" | "mood" | "schedule"
    const [completedIds, setCompletedIds] = useState(new Set());
    const scheduleRef = useRef(null);

    // Load profile + tasks
    useEffect(() => {
        if (!user?.uid) { setLoading(false); return; }
        Promise.all([
            getDoc(doc(db, "students", user.uid)),
            // No orderBy — avoids composite index requirement; sorted client-side
            getDocs(query(collection(db, "tasks"),
                where("studentId", "==", user.uid),
                where("completed", "==", false)))
        ]).then(([profileSnap, taskSnap]) => {
            if (profileSnap.exists()) setProfile(profileSnap.data());
            const list = taskSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Sort newest first client-side
            list.sort((a, b) => {
                const tA = a.createdAt?.toMillis?.() || 0;
                const tB = b.createdAt?.toMillis?.() || 0;
                return tB - tA;
            });
            setTasks(list);
        }).catch(e => {
            console.error("[TaskScheduler] Load error:", e);
        }).finally(() => setLoading(false));
    }, [user?.uid]);

    const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const setM = (k, v) => setMood(p => ({ ...p, [k]: v }));

    const addTask = async () => {
        if (!form.taskName.trim() || !user?.uid) return;
        setAdding(true);
        try {
            const ref = await addDoc(collection(db, "tasks"), {
                ...form, studentId: user.uid,
                completed: false, createdAt: serverTimestamp(),
            });
            setTasks(p => [{ id: ref.id, ...form, completed: false }, ...p]);
            setF("taskName", "");
        } catch (e) { console.error(e); }
        finally { setAdding(false); }
    };

    const deleteTask = async (id) => {
        try {
            await deleteDoc(doc(db, "tasks", id));
            setTasks(p => p.filter(t => t.id !== id));
        } catch (e) { console.error(e); }
    };

    const markDone = async (id) => {
        setCompletedIds(prev => new Set([...prev, id]));
        try {
            await updateDoc(doc(db, "tasks", id), { completed: true });
            setTimeout(() => setTasks(p => p.filter(t => t.id !== id)), 600);
        } catch (e) { console.error(e); }
    };

    const generateSchedule = async () => {
        if (tasks.length === 0) { setAiError("Please add at least one task first."); return; }
        setGenerating(true); setAiError(""); setSchedule(null);
        try {
            const prompt = buildPrompt(tasks, mood, profile);
            console.log("[AI Scheduler] Sending to Gemini. Profile:", profile);
            const raw = await callGemini(prompt);
            console.log("[AI Scheduler] Raw Gemini response:", raw);

            // Strip markdown code fences (Gemini often wraps JSON in ```json ... ```)
            let cleaned = raw
                .replace(/^```(?:json)?\s*/i, "")
                .replace(/\s*```\s*$/, "")
                .trim();

            // Extract first JSON object
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found in response");
            const parsed = JSON.parse(jsonMatch[0]);
            if (!parsed.schedule) throw new Error("Missing 'schedule' field in response");
            setSchedule(parsed);
            setStep("schedule");
            setTimeout(() => scheduleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
        } catch (e) {
            console.error("[AI Scheduler] Error:", e);
            if (e.message.includes("VITE_GEMINI_API_KEY")) {
                setAiError("⚠️ Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.");
            } else {
                setAiError(`❌ ${e.message}`);
            }
        } finally { setGenerating(false); }
    };

    // ─── Render helpers ───────────────────────────────────────────────────────

    const tabBtn = (t) => (
        <button onClick={() => setStep(t)} style={{
            padding: "10px 22px", borderRadius: 30, fontWeight: 700, fontSize: 13, border: "none",
            cursor: "pointer", transition: "all 0.2s",
            background: step === t ? ACCENT : "#F3F4F6",
            color: step === t ? "#fff" : "#6B7280",
            boxShadow: step === t ? "0 4px 14px rgba(59,91,219,0.3)" : "none",
        }}>{t === "tasks" ? "📝 My Tasks" : t === "mood" ? "😊 Mood Check-in" : "✨ AI Schedule"}</button>
    );

    if (loading) return (
        <DashboardLayout>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, flexDirection: "column", gap: 16 }}>
                <div style={{ width: 48, height: 48, border: "4px solid #E8EEFF", borderTop: `4px solid ${ACCENT}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <p style={{ color: "#888", fontWeight: 600 }}>Loading your tasks…</p>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: AI_GRAD, display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 22, flexShrink: 0,
                    }}>🧠</div>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1a1a2e", margin: 0 }}>AI Study Scheduler</h1>
                        <p style={{ color: "#888", fontSize: 14, margin: 0 }}>
                            Mood-aware scheduling powered by Gemini AI
                            {profile.name && ` · Hi, ${profile.name.split(" ")[0]}! 👋`}
                        </p>
                    </div>
                </div>

                {/* Profile chips */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                    {profile.class && <span style={{ padding: "4px 12px", borderRadius: 20, background: "#E8EEFF", color: ACCENT, fontSize: 12, fontWeight: 700 }}>🏫 {profile.class}</span>}
                    {profile.favSubject && <span style={{ padding: "4px 12px", borderRadius: 20, background: "#E6FCF5", color: "#0D9488", fontSize: 12, fontWeight: 700 }}>⭐ {profile.favSubject}</span>}
                    {profile.focusLevel && <span style={{ padding: "4px 12px", borderRadius: 20, background: "#F3F4F6", color: "#374151", fontSize: 12, fontWeight: 700 }}>🎯 {profile.focusLevel} Focus</span>}
                    {profile.studyPlan && <span style={{ padding: "4px 12px", borderRadius: 20, background: "#FFF9DB", color: "#854D0E", fontSize: 12, fontWeight: 700 }}>📋 {profile.studyPlan}</span>}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
                {tabBtn("tasks")}
                {tabBtn("mood")}
                {tabBtn("schedule")}
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                        padding: "8px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: tasks.length > 0 ? "#E8EEFF" : "#F3F4F6",
                        color: tasks.length > 0 ? ACCENT : "#9CA3AF",
                    }}>
                        {tasks.length} task{tasks.length !== 1 ? "s" : ""} queued
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
                .responsive-grid-tasks { display: grid; grid-template-columns: 1fr 1.4fr; gap: 24px; }
                .responsive-grid-mood { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
                .task-queue-container { flex: 1; overflow-y: auto; max-height: 600px; padding-right: 8px; }
                @media (max-width: 1024px) {
                    .responsive-grid-tasks, .responsive-grid-mood { display: flex; flex-direction: column; }
                    .task-queue-container { overflow-y: visible; max-height: none; padding-right: 0; }
                }
            `}</style>

            {/* ─── STEP 1: TASKS ─── */}
            {step === "tasks" && (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                    <div className="responsive-grid-tasks">

                        {/* Add Task Form */}
                        <div style={card()}>
                            <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 22 }}>➕ Add a Task</div>

                            <div style={{ marginBottom: 14 }}>
                                <label style={label()}>Task Name</label>
                                <input
                                    value={form.taskName}
                                    onChange={e => setF("taskName", e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && addTask()}
                                    placeholder="e.g. Solve journal entries ch.4"
                                    style={inputSt}
                                    onFocus={e => e.target.style.border = `2px solid ${ACCENT}`}
                                    onBlur={e => e.target.style.border = "2px solid #eee"}
                                />
                            </div>

                            <div style={{ marginBottom: 14 }}>
                                <label style={label()}>Priority</label>
                                <div style={{ display: "flex", gap: 8 }}>
                                    {PRIORITIES.map(p => (
                                        <button key={p.value} onClick={() => setF("priority", p.value)} style={{
                                            flex: 1, padding: "10px 4px", borderRadius: 12, fontWeight: 700, fontSize: 12,
                                            border: `2px solid ${form.priority === p.value ? p.color : "#eee"}`,
                                            background: form.priority === p.value ? p.bg : "#fafbff",
                                            color: form.priority === p.value ? p.color : "#888",
                                            cursor: "pointer", transition: "all 0.15s",
                                        }}>{p.emoji} {p.label}</button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: 14 }}>
                                <label style={label()}>Difficulty</label>
                                <div style={{ display: "flex", gap: 8 }}>
                                    {DIFFICULTIES.map(d => (
                                        <button key={d.label} onClick={() => setF("difficulty", d.label)} style={{
                                            flex: 1, padding: "10px 4px", borderRadius: 12, fontWeight: 700, fontSize: 12,
                                            border: `2px solid ${form.difficulty === d.label ? d.color : "#eee"}`,
                                            background: form.difficulty === d.label ? d.bg : "#fafbff",
                                            color: form.difficulty === d.label ? d.color : "#888",
                                            cursor: "pointer", transition: "all 0.15s",
                                        }}>{d.emoji} {d.label}</button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: 22 }}>
                                <label style={label()}>Estimated Time (hours)</label>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {["0.5", "1", "1.5", "2", "3"].map(h => (
                                        <button key={h} onClick={() => setF("timeRequired", h)} style={{
                                            padding: "9px 14px", borderRadius: 10, fontWeight: 700, fontSize: 13, border: "none",
                                            background: form.timeRequired === h ? ACCENT : "#F3F4F6",
                                            color: form.timeRequired === h ? "#fff" : "#555",
                                            cursor: "pointer", transition: "all 0.15s",
                                        }}>{h}h</button>
                                    ))}
                                    <input
                                        type="number" min="0.5" step="0.5"
                                        value={form.timeRequired}
                                        onChange={e => setF("timeRequired", e.target.value)}
                                        placeholder="custom"
                                        style={{ ...inputSt, width: 80, flex: "none", padding: "9px 10px" }}
                                        onFocus={e => e.target.style.border = `2px solid ${ACCENT}`}
                                        onBlur={e => e.target.style.border = "2px solid #eee"}
                                    />
                                </div>
                            </div>

                            <button onClick={addTask} disabled={adding || !form.taskName.trim()} style={{
                                width: "100%", padding: "13px", borderRadius: 14,
                                background: (!form.taskName.trim() || adding) ? "#E5E7EB" : ACCENT_GRAD,
                                color: (!form.taskName.trim() || adding) ? "#9CA3AF" : "#fff",
                                fontWeight: 800, fontSize: 14, border: "none",
                                cursor: (!form.taskName.trim() || adding) ? "not-allowed" : "pointer",
                                transition: "all 0.2s",
                            }}>
                                {adding ? "Adding…" : "Add Task ➕"}
                            </button>
                        </div>

                        {/* Task List */}
                        <div style={card({ minHeight: 300, display: "flex", flexDirection: "column" })}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e" }}>📋 Task Queue</div>
                                {tasks.length > 0 && (
                                    <button onClick={() => setStep("mood")} style={{
                                        padding: "9px 20px", borderRadius: 20, fontWeight: 800, fontSize: 13,
                                        background: ACCENT_GRAD, color: "#fff", border: "none", cursor: "pointer",
                                        boxShadow: "0 4px 14px rgba(59,91,219,0.3)",
                                    }}>Next: Mood Check →</button>
                                )}
                            </div>

                            {tasks.length === 0 ? (
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9CA3AF", textAlign: "center", padding: 40 }}>
                                    <div style={{ fontSize: 52, marginBottom: 14 }}>📝</div>
                                    <div style={{ fontWeight: 700, fontSize: 16, color: "#374151", marginBottom: 6 }}>No tasks yet</div>
                                    <div style={{ fontSize: 13 }}>Add your study tasks on the left to get started</div>
                                </div>
                            ) : (
                                <div className="task-queue-container">
                                    {tasks.map((t) => {
                                        const done = completedIds.has(t.id);
                                        return (
                                            <div key={t.id} style={{
                                                display: "flex", alignItems: "center", gap: 12,
                                                padding: "14px 16px", borderRadius: 16, marginBottom: 10,
                                                background: done ? "#F9FAFB" : "#fafbff",
                                                border: "1.5px solid #F3F4F6",
                                                opacity: done ? 0.5 : 1,
                                                transition: "all 0.4s",
                                            }}>
                                                <button onClick={() => markDone(t.id)} title="Mark complete" style={{
                                                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                                                    background: done ? "#20C997" : "#fff", border: `2.5px solid ${done ? "#20C997" : "#ddd"}`,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    cursor: "pointer", fontSize: 13, color: "#fff", transition: "all 0.2s",
                                                }}>{done ? "✓" : ""}</button>

                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e", textDecoration: done ? "line-through" : "none", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {t.taskName}
                                                    </div>
                                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                        <PriorityBadge value={t.priority} />
                                                        <DiffBadge value={t.difficulty} />
                                                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#E8EEFF", color: ACCENT }}>⏱ {t.timeRequired}h</span>
                                                    </div>
                                                </div>

                                                <button onClick={() => deleteTask(t.id)} title="Delete task" style={{
                                                    background: "none", border: "none", fontSize: 16, cursor: "pointer",
                                                    color: "#D1D5DB", padding: "4px", borderRadius: 8,
                                                    transition: "color 0.15s",
                                                }}
                                                    onMouseEnter={e => e.target.style.color = "#FF6B6B"}
                                                    onMouseLeave={e => e.target.style.color = "#D1D5DB"}
                                                >✕</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── STEP 2: MOOD ─── */}
            {step === "mood" && (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                    <div className="responsive-grid-mood">

                        {/* Mood sliders */}
                        <div style={card()}>
                            <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 6 }}>😊 How are you feeling right now?</div>
                            <div style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>This helps AI adapt the schedule to your current state</div>

                            {MOODS.map(m => (
                                <div key={m.key} style={{ marginBottom: 22 }}>
                                    <label style={label()}>{m.icon} {m.label}</label>
                                    <ToggleGroup
                                        options={m.options}
                                        colors={m.colors}
                                        value={mood[m.key]}
                                        onChange={v => setM(m.key, v)}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Session config */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                            <div style={card()}>
                                <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 22 }}>⏰ Session Setup</div>

                                <div style={{ marginBottom: 18 }}>
                                    <label style={label()}>Study Start Time</label>
                                    <input type="time" value={mood.startTime} onChange={e => setM("startTime", e.target.value)}
                                        style={{ ...inputSt, width: "100%" }}
                                        onFocus={e => e.target.style.border = `2px solid ${ACCENT}`}
                                        onBlur={e => e.target.style.border = "2px solid #eee"}
                                    />
                                </div>

                                <div>
                                    <label style={label()}>Planned Study Hours: <span style={{ color: ACCENT }}>{mood.hours}h</span></label>
                                    <input type="range" min="1" max="10" step="0.5" value={mood.hours}
                                        onChange={e => setM("hours", e.target.value)}
                                        style={{ width: "100%", accentColor: ACCENT }}
                                    />
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                                        <span>1h</span><span>5h</span><span>10h</span>
                                    </div>
                                </div>
                            </div>

                            {/* Profile summary card */}
                            <div style={{ ...card(), background: "linear-gradient(135deg,#1a1a2e,#2d2d5e)", color: "#fff" }}>
                                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14, opacity: 0.9 }}>🧬 AI Context from Your Profile</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                    {[
                                        ["Focus Type", profile.focusLevel || "—"],
                                        ["Study Style", profile.studyPlan || "—"],
                                        ["Best Time", profile.studyTime || "—"],
                                        ["Daily Hours", profile.dailyHours ? `${profile.dailyHours}h` : "—"],
                                        ["Fav Subject", profile.favSubject || "—"],
                                        ["Target", profile.targetAggregate ? `${profile.targetAggregate}%` : "—"],
                                    ].map(([k, v]) => (
                                        <div key={k} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "9px 12px" }}>
                                            <div style={{ fontSize: 10, opacity: 0.6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k}</div>
                                            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, opacity: v === "—" ? 0.4 : 1 }}>{v}</div>
                                        </div>
                                    ))}
                                </div>
                                {!profile.focusLevel && (
                                    <div style={{ marginTop: 12, fontSize: 11, opacity: 0.6, textAlign: "center" }}>
                                        💡 Complete your profile for smarter AI suggestions
                                    </div>
                                )}
                            </div>

                            {/* Generate button */}
                            <button onClick={generateSchedule} disabled={generating || tasks.length === 0} style={{
                                padding: "18px", borderRadius: 18, fontWeight: 900, fontSize: 16, border: "none",
                                background: generating ? "#E5E7EB" : AI_GRAD,
                                color: generating ? "#9CA3AF" : "#fff",
                                cursor: generating ? "not-allowed" : "pointer",
                                boxShadow: generating ? "none" : "0 8px 30px rgba(99,102,241,0.4)",
                                transition: "all 0.25s",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                            }}>
                                {generating ? (
                                    <>
                                        <div style={{ width: 20, height: 20, border: "3px solid rgba(255,255,255,0.3)", borderTop: "3px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                        Gemini is thinking…
                                    </>
                                ) : (
                                    <>🧠 Generate AI Schedule</>
                                )}
                            </button>

                            {aiError && (
                                <div style={{ padding: "12px 16px", borderRadius: 14, background: "#FFF0F0", border: "1px solid #FFC9C9", color: "#FF6B6B", fontSize: 13, fontWeight: 600 }}>
                                    {aiError}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── STEP 3: SCHEDULE ─── */}
            {step === "schedule" && (
                <div ref={scheduleRef} style={{ animation: "fadeIn 0.3s ease" }}>
                    {generating && (
                        <div style={{ ...card(), textAlign: "center", padding: 60 }}>
                            <div style={{ width: 56, height: 56, border: "5px solid #E8EEFF", borderTop: `5px solid ${ACCENT}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
                            <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a2e", marginBottom: 8 }}>Gemini is building your schedule…</div>
                            <div style={{ color: "#888", fontSize: 14 }}>Analysing your mood, profile, and tasks</div>
                        </div>
                    )}

                    {!generating && !schedule && (
                        <div style={{ ...card(), textAlign: "center", padding: 60 }}>
                            <div style={{ fontSize: 56, marginBottom: 16 }}>🧠</div>
                            <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a2e", marginBottom: 8 }}>No schedule yet</div>
                            <div style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Go to Mood Check-in and generate your AI schedule</div>
                            <button onClick={() => setStep("mood")} style={{ padding: "12px 28px", borderRadius: 14, background: ACCENT_GRAD, color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer" }}>
                                Go to Mood Check-in →
                            </button>
                        </div>
                    )}

                    {!generating && schedule && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                            {/* AI Summary header */}
                            <div style={{ ...card({ background: AI_GRAD, color: "#fff", padding: "28px 32px" }) }}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                                    <div style={{ fontSize: 36, flexShrink: 0 }}>✨</div>
                                    <div>
                                        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>Your Personalised Schedule is Ready</div>
                                        <div style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.7, marginBottom: 12 }}>{schedule.summary}</div>
                                        <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 16px", fontSize: 13, opacity: 0.95, lineHeight: 1.6 }}>
                                            💡 {schedule.insight}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
                                    <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 30, padding: "6px 16px", fontSize: 12, fontWeight: 700 }}>
                                        ⚡ Energy: {mood.energy}
                                    </div>
                                    <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 30, padding: "6px 16px", fontSize: 12, fontWeight: 700 }}>
                                        🎯 Focus: {mood.focus}
                                    </div>
                                    <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 30, padding: "6px 16px", fontSize: 12, fontWeight: 700 }}>
                                        🕐 {mood.hours}h planned
                                    </div>
                                    <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 30, padding: "6px 16px", fontSize: 12, fontWeight: 700 }}>
                                        📋 {schedule.schedule?.length || 0} tasks scheduled
                                    </div>
                                </div>
                            </div>

                            {/* Schedule Timeline */}
                            <div style={card()}>
                                <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 24 }}>📅 Today's Study Timeline</div>
                                <div style={{ position: "relative" }}>
                                    {/* Timeline line */}
                                    <div style={{
                                        position: "absolute", left: 23, top: 0, bottom: 0,
                                        width: 2, background: "linear-gradient(to bottom, #E8EEFF, transparent)",
                                    }} />

                                    {(schedule.schedule || []).map((item, i) => {
                                        const p = pri(item.priority);
                                        const d = dif(item.difficulty);
                                        return (
                                            <div key={i} style={{
                                                display: "flex", gap: 20, marginBottom: 20,
                                                animation: `fadeIn 0.3s ease ${i * 0.08}s both`,
                                            }}>
                                                {/* Dot */}
                                                <div style={{
                                                    width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                                                    background: p.bg, border: `3px solid ${p.color}`,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: 16, color: p.color, fontWeight: 900, zIndex: 1,
                                                }}>
                                                    {p.emoji}
                                                </div>

                                                {/* Content */}
                                                <div style={{
                                                    flex: 1, background: "#FAFBFF", borderRadius: 18,
                                                    padding: "16px 20px", border: "1.5px solid #F3F4F6",
                                                    transition: "box-shadow 0.2s",
                                                }}
                                                    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(59,91,219,0.1)"}
                                                    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                                                >
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                                                        <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a2e" }}>{item.taskName}</div>
                                                        <div style={{ fontWeight: 800, fontSize: 14, color: ACCENT, whiteSpace: "nowrap", background: "#E8EEFF", padding: "4px 12px", borderRadius: 20 }}>
                                                            🕐 {item.startTime} – {item.endTime}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                                                        <PriorityBadge value={item.priority} />
                                                        <DiffBadge value={item.difficulty} />
                                                        {item.breakAfter > 0 && (
                                                            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#F3F4F6", color: "#6B7280" }}>
                                                                ☕ {item.breakAfter}min break after
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5, marginBottom: item.tip ? 8 : 0 }}>
                                                        🤖 {item.reason}
                                                    </div>
                                                    {item.tip && (
                                                        <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 600, background: "#F5F3FF", borderRadius: 10, padding: "8px 12px" }}>
                                                            💜 Tip: {item.tip}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Skipped tasks */}
                            {schedule.skipped && schedule.skipped.length > 0 && (
                                <div style={card({ background: "#FFFBEB", border: "1px solid #FDE68A" })}>
                                    <div style={{ fontWeight: 800, fontSize: 14, color: "#92400E", marginBottom: 12 }}>⏭ Tasks Not Scheduled</div>
                                    <div style={{ fontSize: 13, color: "#78350F" }}>
                                        {typeof schedule.skipped[0] === "string"
                                            ? schedule.skipped.map((s, i) => <div key={i}>• {s}</div>)
                                            : schedule.skipped.map((s, i) => <div key={i}>• {s.taskName || s}: {s.reason || ""}</div>)
                                        }
                                    </div>
                                </div>
                            )}

                            {/* Regenerate */}
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                <button onClick={generateSchedule} disabled={generating} style={{
                                    padding: "13px 28px", borderRadius: 14, fontWeight: 800, fontSize: 14, border: "none",
                                    background: generating ? "#E5E7EB" : AI_GRAD,
                                    color: generating ? "#9CA3AF" : "#fff",
                                    cursor: generating ? "not-allowed" : "pointer",
                                    boxShadow: "0 6px 20px rgba(99,102,241,0.35)",
                                }}>
                                    🔄 Regenerate Schedule
                                </button>
                                <button onClick={() => setStep("mood")} style={{
                                    padding: "13px 24px", borderRadius: 14, fontWeight: 700, fontSize: 14,
                                    background: "#fff", border: "2px solid #E5E7EB", color: "#374151", cursor: "pointer",
                                }}>
                                    ← Adjust Mood
                                </button>
                                <button onClick={() => setStep("tasks")} style={{
                                    padding: "13px 24px", borderRadius: 14, fontWeight: 700, fontSize: 14,
                                    background: "#fff", border: "2px solid #E5E7EB", color: "#374151", cursor: "pointer",
                                }}>
                                    ← Edit Tasks
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </DashboardLayout>
    );
}
