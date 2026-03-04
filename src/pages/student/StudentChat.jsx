import { useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db, storage } from "../../firebase";
import {
    collection, query, where, orderBy, onSnapshot,
    addDoc, getDocs, serverTimestamp, doc, updateDoc,
    writeBatch, getDoc, increment,
} from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import useIsMobile from "../../hooks/useIsMobile";

// Role colours
const ROLE_COLOR = { Admin: "#FF6B6B", Teacher: "#3B5BDB", Student: "#20C997" };
const ROLE_BG = { Admin: "#FFF0F0", Teacher: "#E8EEFF", Student: "#E6FCF5" };
const ROLE_BORDER = { Admin: "#FF6B6B", Teacher: "#3B5BDB", Student: "#20C997" };

// Students can chat with: Admins + Teachers
const MY_ROLE_COLOR = "#20C997"; // student accent

function Avatar({ name, role, size = 40 }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: "50%",
            background: ROLE_COLOR[role] || "#aaa",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: size * 0.4, flexShrink: 0,
        }}>
            {(name || "?")[0].toUpperCase()}
        </div>
    );
}

function RoleBadge({ role }) {
    return (
        <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
            background: ROLE_BG[role] || "#f0f0f0",
            color: ROLE_COLOR[role] || "#888",
            border: `1px solid ${ROLE_BORDER[role] || "#ddd"}`,
        }}>{role}</span>
    );
}

function Spinner() {
    return (
        <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{
                width: 40, height: 40, borderRadius: "50%",
                border: "4px solid #EEF2FF", borderTop: `4px solid ${MY_ROLE_COLOR}`,
                margin: "0 auto 14px", animation: "spin 0.8s linear infinite",
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ color: "#aaa", fontSize: 14 }}>Loading contacts…</div>
        </div>
    );
}

function formatLastMsgTime(ts) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatMsgTime(ts) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// Daily midnight cleanup (client-side, fire-and-forget)
async function runDailyCleanup(currentUserUid) {
    const todayStr = new Date().toISOString().split("T")[0];
    const key = `lastCleanupDate_${currentUserUid}`;
    if (localStorage.getItem(key) === todayStr) return;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    try {
        // Composite index needed: chats — participants (array-contains)
        const chatSnap = await getDocs(
            query(collection(db, "chats"), where("participants", "array-contains", currentUserUid))
        );
        for (const chatDoc of chatSnap.docs) {
            const msgsSnap = await getDocs(
                query(
                    collection(db, "chats", chatDoc.id, "messages"),
                    where("timestamp", "<", startOfToday)
                )
            );
            // Batch delete — Firestore max 500 per commit
            let batch = writeBatch(db);
            let count = 0;
            for (const msgDoc of msgsSnap.docs) {
                batch.delete(msgDoc.ref);
                count++;
                if (count === 500) {
                    await batch.commit();
                    batch = writeBatch(db);
                    count = 0;
                }
            }
            if (count > 0) await batch.commit();
        }
        localStorage.setItem(key, todayStr);
    } catch (e) {
        console.warn("Cleanup error:", e);
    }
}

export default function StudentChat() {
    const { user } = useAuth();
    const isMobile = useIsMobile(768);

    // Contacts
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Chat metadata map: { contactId -> { chatId, lastMessage, lastMessageTime, unreadCount } }
    const [chatMeta, setChatMeta] = useState({});

    const [selectedContactId, setSelectedContactId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [file, setFile] = useState(null);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterChip, setFilterChip] = useState("All"); // All | Admin | Teacher

    // Mobile panel: "list" | "chat"
    const [mobilePanel, setMobilePanel] = useState("list");

    const fileRef = useRef();
    const bottomRef = useRef();
    const chatUnsubRef = useRef(null);

    // 1. Run cleanup on mount (fire-and-forget)
    useEffect(() => {
        if (user?.uid) runDailyCleanup(user.uid);
    }, [user?.uid]);

    // 2. Fetch contacts (Teachers first — open read, then Admins — auth-gated)
    useEffect(() => {
        if (!user?.uid) return;
        let cancelled = false;
        setLoading(true);

        const loadContacts = async () => {
            try {
                // Teachers: open read — always fast
                const teachSnap = await getDocs(collection(db, "teachers"));
                if (cancelled) return;
                const teachers = teachSnap.docs.map(d => ({ id: d.id, ...d.data(), role: "Teacher" }));
                setContacts(teachers);
                setLoading(false);

                // Admins: requires auth — fetch separately so teachers show immediately
                try {
                    const adminSnap = await getDocs(collection(db, "admins"));
                    if (cancelled) return;
                    const admins = adminSnap.docs.map(d => ({ id: d.id, ...d.data(), role: "Admin" }));
                    setContacts(prev => [...admins, ...prev.filter(c => c.role !== "Admin")]);
                } catch (ae) {
                    console.warn("Could not load admin contacts:", ae);
                }
            } catch (e) {
                console.error("Failed to load contacts:", e);
                setLoading(false);
            }
        };

        loadContacts();
        return () => { cancelled = true; };
    }, [user?.uid]);

    // 3. Real-time listener on chats collection for this user → updates chatMeta for sidebar
    useEffect(() => {
        if (!user?.uid) return;
        // Composite index needed in Firebase console: chats — participants (array-contains), lastMessageTime (desc)
        const q = query(
            collection(db, "chats"),
            where("participants", "array-contains", user.uid)
        );
        const unsub = onSnapshot(q, snap => {
            const meta = {};
            snap.docs.forEach(d => {
                const data = d.data();
                const otherId = data.participants?.find(p => p !== user.uid);
                if (otherId) {
                    meta[otherId] = {
                        chatId: d.id,
                        lastMessage: data.lastMessage || "",
                        lastMessageTime: data.lastMessageTime || null,
                        unreadCount: data.unreadCount?.[user.uid] || 0,
                        lastSenderId: data.lastSenderId || null,
                    };
                }
            });
            setChatMeta(meta);
        });
        return () => unsub();
    }, [user?.uid]);

    // 4. Real-time messages for active chat
    useEffect(() => {
        if (chatUnsubRef.current) { chatUnsubRef.current(); chatUnsubRef.current = null; }
        if (!selectedContactId || !user?.uid) { setMessages([]); return; }

        const chatId = chatMeta[selectedContactId]?.chatId;
        if (!chatId) { setMessages([]); return; }

        // Composite index needed: chats/{id}/messages — timestamp (asc)
        const q = query(
            collection(db, "chats", chatId, "messages"),
            orderBy("timestamp", "asc")
        );

        const unsub = onSnapshot(q, async snap => {
            const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setMessages(msgs);

            // Mark messages as read + reset unread count
            const unreadMsgs = snap.docs.filter(d => {
                const data = d.data();
                return data.senderId !== user.uid && !(data.readBy || []).includes(user.uid);
            });
            if (unreadMsgs.length > 0) {
                const batch = writeBatch(db);
                unreadMsgs.forEach(d => {
                    batch.update(d.ref, { readBy: [...(d.data().readBy || []), user.uid] });
                });
                // Reset unread count for this user
                batch.update(doc(db, "chats", chatId), {
                    [`unreadCount.${user.uid}`]: 0,
                });
                try { await batch.commit(); } catch (e) { console.warn("Mark-read error:", e); }
            }
        });
        chatUnsubRef.current = unsub;
        return () => { if (chatUnsubRef.current) chatUnsubRef.current(); };
    }, [selectedContactId, chatMeta, user?.uid]);

    // 5. Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Create or reuse chat doc
    const getOrCreateChatId = useCallback(async (contactId) => {
        if (chatMeta[contactId]?.chatId) return chatMeta[contactId].chatId;
        const newChat = await addDoc(collection(db, "chats"), {
            participants: [user.uid, contactId],
            lastMessage: "",
            lastMessageTime: serverTimestamp(),
            lastSenderId: null,
            unreadCount: { [user.uid]: 0, [contactId]: 0 },
        });
        return newChat.id;
    }, [chatMeta, user?.uid]);

    const send = async () => {
        if (!input.trim() && !file) return;
        if (!selectedContactId || !user?.uid) return;
        setSending(true);
        try {
            const chatId = await getOrCreateChatId(selectedContactId);
            let fileURL = null, fileName = null;
            if (file) {
                const timestamp = Date.now();
                const sRef = storageRef(storage, `chats/${chatId}/${timestamp}_${file.name}`);
                const snap = await uploadBytes(sRef, file);
                fileURL = await getDownloadURL(snap.ref);
                fileName = file.name;
            }
            const msgText = input.trim() || null;
            const now = new Date();

            // Write message to subcollection
            await addDoc(collection(db, "chats", chatId, "messages"), {
                senderId: user.uid,
                text: msgText,
                fileURL: fileURL || null,
                fileName: fileName || null,
                timestamp: serverTimestamp(),
                readBy: [user.uid],
            });

            // Update chat metadata
            await updateDoc(doc(db, "chats", chatId), {
                lastMessage: fileURL ? `📎 ${fileName}` : msgText,
                lastMessageTime: serverTimestamp(),
                lastSenderId: user.uid,
                [`unreadCount.${selectedContactId}`]: increment(1),
            });

            setInput(""); setFile(null);
        } catch (e) {
            console.error("Send failed:", e);
        } finally {
            setSending(false);
        }
    };

    const handleSelectContact = (id) => {
        setSelectedContactId(id);
        setInput("");
        setFile(null);
        if (isMobile) setMobilePanel("chat");
    };

    // Sort contacts: active chats by lastMessageTime desc, then alphabetically
    const sortedContacts = [...contacts].sort((a, b) => {
        const aTime = chatMeta[a.id]?.lastMessageTime;
        const bTime = chatMeta[b.id]?.lastMessageTime;
        if (aTime && bTime) {
            const at = aTime.toDate ? aTime.toDate() : new Date(aTime);
            const bt = bTime.toDate ? bTime.toDate() : new Date(bTime);
            return bt - at;
        }
        if (aTime && !bTime) return -1;
        if (!aTime && bTime) return 1;
        return (a.name || "").localeCompare(b.name || "");
    });

    const CHIPS = ["All", "Admin", "Teacher"];

    const filteredContacts = sortedContacts.filter(c => {
        const matchChip = filterChip === "All" || c.role === filterChip;
        const q = searchQuery.toLowerCase();
        const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.role?.toLowerCase().includes(q);
        return matchChip && matchSearch;
    });

    const selectedContact = contacts.find(c => c.id === selectedContactId);

    // Read receipt indicator
    const ReadReceipt = ({ msg }) => {
        if (msg.senderId !== user.uid) return null;
        const isRead = Array.isArray(msg.readBy) && msg.readBy.some(uid => uid !== user.uid);
        return (
            <span style={{ fontSize: 11, marginLeft: 4, color: isRead ? MY_ROLE_COLOR : "#aaa" }}>
                {isRead ? "✓✓" : "✓"}
            </span>
        );
    };

    // Sidebar panel
    const SidebarPanel = (
        <div style={{
            width: isMobile ? "100%" : 280, background: "#fff", borderRadius: 20,
            padding: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
            flexShrink: 0, display: "flex", flexDirection: "column",
            height: isMobile ? "auto" : "100%",
        }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Contacts</div>

            {/* Search */}
            <input
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="🔍 Search contacts..."
                style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "2px solid #eee", fontSize: 13, outline: "none", marginBottom: 10, boxSizing: "border-box" }}
            />

            {/* Filter chips */}
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                {CHIPS.map(chip => (
                    <button key={chip} onClick={() => setFilterChip(chip)} style={{
                        padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                        border: "none", cursor: "pointer", transition: "all 0.15s",
                        background: filterChip === chip ? MY_ROLE_COLOR : "#f0f2ff",
                        color: filterChip === chip ? "#fff" : "#555",
                    }}>{chip}</button>
                ))}
            </div>

            {/* Contact list */}
            <div style={{ overflowY: "auto", flex: 1 }}>
                {loading ? <Spinner /> : filteredContacts.length === 0 ? (
                    <div style={{ color: "#aaa", fontSize: 13, textAlign: "center", paddingTop: 20 }}>No contacts found.</div>
                ) : filteredContacts.map(c => {
                    const meta = chatMeta[c.id];
                    const unread = meta?.unreadCount || 0;
                    const isSelected = selectedContactId === c.id;
                    // Subheading: teacher subject
                    const subheading = c.subject || null;
                    return (
                        <div key={c.id} onClick={() => handleSelectContact(c.id)} style={{
                            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                            borderRadius: 14, cursor: "pointer", marginBottom: 4, transition: "all 0.15s",
                            background: isSelected ? ROLE_BG[c.role] : "transparent",
                            border: `1.5px solid ${isSelected ? ROLE_BORDER[c.role] : "transparent"}`,
                        }}>
                            <Avatar name={c.name} role={c.role} size={40} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                                    {meta?.lastMessageTime && (
                                        <div style={{ fontSize: 10, color: "#bbb", flexShrink: 0 }}>{formatLastMsgTime(meta.lastMessageTime)}</div>
                                    )}
                                </div>
                                {subheading && (
                                    <div style={{ fontSize: 10, color: ROLE_COLOR[c.role], fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 1 }}>{subheading}</div>
                                )}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 1 }}>
                                    <div style={{ fontSize: 11, color: "#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>
                                        {meta?.lastMessage
                                            ? (meta.lastMessage.length > 35 ? meta.lastMessage.slice(0, 35) + "…" : meta.lastMessage)
                                            : <RoleBadge role={c.role} />
                                        }
                                    </div>
                                    {unread > 0 && (
                                        <div style={{ background: MY_ROLE_COLOR, color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 20, padding: "2px 7px", flexShrink: 0 }}>{unread}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // Chat panel
    const ChatPanel = (
        <div style={{ flex: 1, background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}>
            {selectedContact ? (
                <>
                    {/* Chat header */}
                    <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 12 }}>
                        {isMobile && (
                            <button onClick={() => setMobilePanel("list")} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: "0 6px 0 0", color: "#555" }}>‹</button>
                        )}
                        <Avatar name={selectedContact.name} role={selectedContact.role} size={42} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, color: "#1a1a2e", fontSize: 15 }}>{selectedContact.name}</div>
                            <RoleBadge role={selectedContact.role} />
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 10 }}>
                        {messages.length === 0 && (
                            <div style={{ textAlign: "center", color: "#aaa", fontSize: 14, marginTop: 60 }}>
                                <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                                <div style={{ fontWeight: 700, color: "#1a1a2e" }}>Start the conversation!</div>
                                <div style={{ fontSize: 12, marginTop: 6 }}>Say hello to {selectedContact.name} 👋</div>
                            </div>
                        )}
                        {messages.map(msg => {
                            const isMine = msg.senderId === user.uid;
                            return (
                                <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                                    <div style={{
                                        maxWidth: "72%", padding: "11px 16px",
                                        borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                        background: isMine ? MY_ROLE_COLOR : "#f4f6fb",
                                        color: isMine ? "#fff" : "#1a1a2e",
                                        fontSize: 14, lineHeight: 1.6,
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                    }}>
                                        {msg.fileURL
                                            ? <a href={msg.fileURL} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>📎 {msg.fileName || "Attachment"}</a>
                                            : msg.text
                                        }
                                        <div style={{ fontSize: 10, opacity: 0.65, marginTop: 4, textAlign: isMine ? "right" : "left", display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", alignItems: "center" }}>
                                            {formatMsgTime(msg.timestamp)}
                                            {isMine && <ReadReceipt msg={msg} />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input bar */}
                    <div style={{ padding: "14px 20px", borderTop: "1px solid #f0f0f0", display: "flex", gap: 10, alignItems: "flex-end", background: "#fff" }}>
                        {file && (
                            <div style={{ fontSize: 11, color: MY_ROLE_COLOR, fontWeight: 700, padding: "6px 12px", background: ROLE_BG.Student, borderRadius: 20, display: "flex", alignItems: "center", gap: 6 }}>
                                📎 {file.name}
                                <span onClick={() => setFile(null)} style={{ cursor: "pointer", opacity: 0.7 }}>✕</span>
                            </div>
                        )}
                        <input
                            value={input} onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                            placeholder="Type your message…"
                            style={{ flex: 1, padding: "13px 18px", borderRadius: 30, border: "2px solid #eee", fontSize: 14, outline: "none", fontFamily: "Inter, Poppins, sans-serif", transition: "border 0.2s" }}
                            onFocus={e => e.target.style.border = `2px solid ${MY_ROLE_COLOR}`}
                            onBlur={e => e.target.style.border = "2px solid #eee"}
                        />
                        <button onClick={() => fileRef.current.click()} style={{ width: 44, height: 44, borderRadius: "50%", background: "#f0f2ff", border: "none", cursor: "pointer", fontSize: 18, flexShrink: 0 }}>📎</button>
                        <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={e => { setFile(e.target.files[0]); e.target.value = ""; }} />
                        <button onClick={send} disabled={sending} style={{ width: 44, height: 44, borderRadius: "50%", background: MY_ROLE_COLOR, border: "none", cursor: sending ? "not-allowed" : "pointer", color: "#fff", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", opacity: sending ? 0.6 : 1, flexShrink: 0, transition: "opacity 0.2s" }}>
                            {sending ? "…" : "→"}
                        </button>
                    </div>
                </>
            ) : (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#aaa", textAlign: "center", padding: 40 }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a2e", marginBottom: 8 }}>Select a contact to start chatting</div>
                    <div style={{ fontSize: 14 }}>Choose a teacher or admin from the sidebar to begin.</div>
                </div>
            )}
        </div>
    );

    return (
        <DashboardLayout>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                <div>
                    <h1 style={{ fontFamily: "Inter, Poppins, sans-serif", fontSize: 28, fontWeight: 900, color: "#1a1a2e", marginBottom: 4 }}>Chat</h1>
                    <p style={{ color: "#888", margin: 0, fontSize: 14 }}>Ask doubts and get personalised help from teachers & admins.</p>
                </div>
                <div style={{ background: "#FFF3CD", color: "#856404", padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "1px solid #FFEEBA" }}>
                    ⏳ Chat history resets daily at 12:00 AM
                </div>
            </div>

            {/* Layout */}
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 16, height: isMobile ? "auto" : "calc(100vh - 180px)", minHeight: 500 }}>
                {isMobile ? (
                    mobilePanel === "list" ? SidebarPanel : ChatPanel
                ) : (
                    <>{SidebarPanel}{ChatPanel}</>
                )}
            </div>
        </DashboardLayout>
    );
}
