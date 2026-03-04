import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/shared/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { db, storage } from "../../firebase";
import {
    collection, query, where, orderBy, onSnapshot,
    addDoc, getDocs, serverTimestamp, doc, updateDoc, writeBatch, getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import useIsMobile from "../../hooks/useIsMobile";

export default function StudentChat() {
    const { user } = useAuth();
    const isMobile = useIsMobile(900);
    const [contacts, setContacts] = useState([]);
    const [chats, setChats] = useState({});        // { contactId: chatId }
    const [selectedContactId, setSelectedContactId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [file, setFile] = useState(null);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const fileRef = useRef();
    const bottomRef = useRef();

    // Fetch approved teachers AND admins
    useEffect(() => {
        const init = async () => {
            // 1. Fetch Teachers
            const teachSnap = await getDocs(query(collection(db, "teachers"), where("status", "==", "approved")));
            const teachList = teachSnap.docs.map(d => ({ id: d.id, ...d.data(), type: "Teacher" }));

            // 2. Fetch Admins
            const adminSnap = await getDocs(query(collection(db, "admins")));
            const adminList = adminSnap.docs.map(d => ({ id: d.id, ...d.data(), type: "Admin" }));

            const allContacts = [...adminList, ...teachList];
            setContacts(allContacts);
            if (allContacts.length > 0) setSelectedContactId(allContacts[0].id);
        };
        init();
    }, []);

    const filteredContacts = contacts.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Load or find existing chats for this student
    useEffect(() => {
        if (!user?.uid) return;
        getDocs(query(collection(db, "chats"), where("participants", "array-contains", user.uid)))
            .then(snap => {
                const map = {};
                snap.docs.forEach(d => {
                    const data = d.data();
                    const otherId = data.participants.find(p => p !== user.uid);
                    if (otherId) map[otherId] = d.id;
                });
                setChats(map);
            });
    }, [user?.uid]);

    // Real-time message listener for active chat (Only from today)
    useEffect(() => {
        const chatId = selectedContactId ? chats[selectedContactId] : null;
        if (!chatId) { setMessages([]); return; }

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const q = query(
            collection(db, "messages"),
            where("chatId", "==", chatId),
            where("timestamp", ">=", startOfToday),
            orderBy("timestamp", "asc")
        );

        const unsub = onSnapshot(q, async snap => {
            const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setMessages(msgs);
            // Mark unread messages as read
            const batch = writeBatch(db);
            snap.docs.forEach(d => {
                if (d.data().receiverId === user.uid && !d.data().read) {
                    batch.update(doc(db, "messages", d.id), { read: true });
                }
            });
            await batch.commit();
        }, e => console.error(e));
        return () => unsub();
    }, [selectedContactId, chats, user?.uid]);

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const getOrCreateChat = async (contactId) => {
        if (chats[contactId]) return chats[contactId];
        const newChat = await addDoc(collection(db, "chats"), {
            participants: [user.uid, contactId],
            createdAt: serverTimestamp(),
        });
        setChats(p => ({ ...p, [contactId]: newChat.id }));
        return newChat.id;
    };

    const send = async () => {
        if (!input.trim() && !file) return;
        if (!selectedContactId || !user?.uid) return;
        setSending(true);
        try {
            const chatId = await getOrCreateChat(selectedContactId);
            let fileURL = null;
            let fileName = null;
            if (file) {
                const storageRef = ref(storage, `chats/${chatId}/${file.name}`);
                const snap = await uploadBytes(storageRef, file);
                fileURL = await getDownloadURL(snap.ref);
                fileName = file.name;
            }
            await addDoc(collection(db, "messages"), {
                chatId, senderId: user.uid, receiverId: selectedContactId,
                text: input.trim() || null, fileURL, fileName,
                timestamp: serverTimestamp(), read: false,
            });
            setInput(""); setFile(null);
        } catch (e) {
            console.error("Send failed:", e);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (ts) => {
        if (!ts) return "";
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    };

    const selectedContact = contacts.find(t => t.id === selectedContactId);

    return (
        <DashboardLayout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "#1a1a2e", marginBottom: 6 }}>Chat with Teachers & Admins</h1>
                    <p style={{ color: "#888", margin: 0 }}>Ask doubts and get personalised help.</p>
                </div>
                <div style={{ background: "#FFF3CD", color: "#856404", padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1px solid #FFEEBA", maxWidth: 400 }}>
                    ⏳ For data conservation, chat sessions are stored for a maximum of 24 hours. History is reset every day at 12:00 AM.
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 20, height: isMobile ? "auto" : "calc(100vh - 200px)", minHeight: isMobile ? "auto" : 500 }}>
                {/* Contact list */}
                <div style={{ width: isMobile ? "100%" : 260, background: "#fff", borderRadius: 20, padding: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", flexShrink: 0, display: "flex", flexDirection: "column", maxHeight: isMobile ? 260 : "none" }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Your Contacts</div>

                    <input
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        placeholder="🔍 Search contacts..."
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "2px solid #eee", fontSize: 13, outline: "none", marginBottom: 12, boxSizing: "border-box" }}
                    />

                    <div style={{ overflowY: "auto", flex: 1 }}>
                        {contacts.length === 0 ? (
                            <div style={{ color: "#aaa", fontSize: 13 }}>No contacts available.</div>
                        ) : filteredContacts.length === 0 ? (
                            <div style={{ color: "#aaa", fontSize: 13 }}>No matches found.</div>
                        ) : null}

                        {filteredContacts.map(c => (
                            <div key={c.id} onClick={() => setSelectedContactId(c.id)} style={{
                                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                                borderRadius: 14, cursor: "pointer", marginBottom: 6, transition: "all 0.2s",
                                background: selectedContactId === c.id ? "#E8EEFF" : "transparent",
                                border: selectedContactId === c.id ? "1.5px solid #3B5BDB" : "1.5px solid transparent",
                            }}>
                                <div style={{ position: "relative" }}>
                                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: c.type === "Admin" ? "#FF6B6B" : "#3B5BDB", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16 }}>
                                        {(c.name || "U")[0].toUpperCase()}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>{c.name}</div>
                                    <div style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>{c.type === "Teacher" ? (c.subject || c.subjects?.join(", ")) : "Admin"}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat panel */}
                <div style={{ flex: 1, background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", overflow: "hidden", minHeight: isMobile ? 420 : "auto" }}>
                    {selectedContact ? (
                        <>
                            <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: selectedContact.type === "Admin" ? "#FF6B6B" : "#3B5BDB", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800 }}>
                                    {(selectedContact.name || "U")[0].toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, color: "#1a1a2e" }}>{selectedContact.name}</div>
                                    <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600 }}>{selectedContact.type === "Teacher" ? (selectedContact.subject || selectedContact.subjects?.join(", ")) : "Administrator"}</div>
                                </div>
                            </div>

                            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                                {messages.length === 0 && (
                                    <div style={{ textAlign: "center", color: "#aaa", fontSize: 14, marginTop: 40 }}>
                                        No messages today. Say hello! 👋<br /><br />
                                        <span style={{ fontSize: 12, opacity: 0.7 }}>Chat history older than 12:00 AM has been cleared.</span>
                                    </div>
                                )}
                                {messages.map(msg => (
                                    <div key={msg.id} style={{ display: "flex", justifyContent: msg.senderId === user.uid ? "flex-end" : "flex-start" }}>
                                        <div style={{
                                            maxWidth: "70%", padding: "12px 18px",
                                            borderRadius: msg.senderId === user.uid ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                            background: msg.senderId === user.uid ? "#3B5BDB" : "#f4f6fb",
                                            color: msg.senderId === user.uid ? "#fff" : "#1a1a2e",
                                            fontSize: 14, lineHeight: 1.6, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                        }}>
                                            {msg.fileURL ? (
                                                <a href={msg.fileURL} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>📎 {msg.fileName || "Attachment"}</a>
                                            ) : msg.text}
                                            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: msg.senderId === user.uid ? "right" : "left" }}>
                                                {formatTime(msg.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={bottomRef} />
                            </div>

                            <div style={{ padding: "16px 24px", borderTop: "1px solid #f0f0f0", display: "flex", gap: 10, alignItems: "flex-end" }}>
                                {file && <div style={{ fontSize: 11, color: "#3B5BDB", fontWeight: 700, padding: "6px 12px", background: "#E8EEFF", borderRadius: 20 }}>📎 {file.name}</div>}
                                <input value={input} onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                                    placeholder="Type your message…"
                                    style={{ flex: 1, padding: "13px 18px", borderRadius: 30, border: "2px solid #eee", fontSize: 14, outline: "none", fontFamily: "var(--font-body)" }}
                                    onFocus={e => e.target.style.border = "2px solid #3B5BDB"}
                                    onBlur={e => e.target.style.border = "2px solid #eee"}
                                />
                                <button onClick={() => fileRef.current.click()} style={{ width: 44, height: 44, borderRadius: "50%", background: "#f0f2ff", border: "none", cursor: "pointer", fontSize: 18 }}>📎</button>
                                <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
                                <button onClick={send} disabled={sending} style={{ width: 44, height: 44, borderRadius: "50%", background: "#3B5BDB", border: "none", cursor: "pointer", color: "#fff", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", opacity: sending ? 0.6 : 1 }}>→</button>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa" }}>Select a contact to start chatting</div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
