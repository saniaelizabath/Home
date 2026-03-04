import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useIsMobile from "../../hooks/useIsMobile";

const STUDENT_NAV = [
  { icon: "🏠", label: "Dashboard", to: "/student/dashboard" },
  { icon: "👤", label: "Profile", to: "/student/profile" },
  { icon: "📅", label: "Class Dashboard", to: "/student/classes" },
  { icon: "📈", label: "Progress", to: "/student/progress" },
  { icon: "💬", label: "Chat", to: "/student/chat" },
  { icon: "✅", label: "Task Scheduler", to: "/student/tasks" },
  { icon: "📋", label: "Attendance", to: "/student/attendance" },
];

const TEACHER_NAV = [
  { icon: "🏠", label: "Dashboard", to: "/teacher/dashboard" },
  { icon: "👤", label: "Profile", to: "/teacher/profile" },
  { icon: "📅", label: "Class Management", to: "/teacher/classes" },
  { icon: "📁", label: "Academic Content", to: "/teacher/content" },
  { icon: "📝", label: "Evaluation", to: "/teacher/evaluation" },
  { icon: "💬", label: "Chat", to: "/teacher/chat" },
  { icon: "📚", label: "Syllabus", to: "/teacher/syllabus" },
  { icon: "📋", label: "Attendance", to: "/teacher/attendance" },
];

const ADMIN_NAV = [
  { icon: "🏠", label: "Dashboard", to: "/admin/dashboard" },
  { icon: "🎓", label: "Students", to: "/admin/students" },
  { icon: "👩‍🏫", label: "Teachers", to: "/admin/teachers" },
  { icon: "📅", label: "Scheduling", to: "/admin/scheduling" },
  { icon: "📚", label: "Courses", to: "/admin/courses" },
  { icon: "💬", label: "Chat", to: "/admin/chat" },
  { icon: "📊", label: "Reports", to: "/admin/reports" },
  { icon: "📢", label: "Announcements", to: "/admin/announcements" },
];

const NAV_MAP = { student: STUDENT_NAV, teacher: TEACHER_NAV, admin: ADMIN_NAV };
const ROLE_COLORS = {
  student: { accent: "#3B5BDB", light: "#E8EEFF", label: "Student Portal" },
  teacher: { accent: "#20C997", light: "#E6FCF5", label: "Teacher Dashboard" },
  admin: { accent: "#FF6B6B", light: "#FFF0F0", label: "Admin Dashboard" },
};

export default function DashboardLayout({ children }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile(900);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const nav = NAV_MAP[role] ?? [];
  const colors = ROLE_COLORS[role] ?? ROLE_COLORS.student;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6fb", fontFamily: "var(--font-body)" }}>
      {isMobile && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 98,
          }}
        />
      )}

      <aside
        style={{
          width: isMobile ? 270 : (collapsed ? 72 : 260),
          background: "linear-gradient(180deg, #1a1a2e 0%, #0d1117 100%)",
          display: "flex",
          flexDirection: "column",
          transition: isMobile ? "transform 0.25s ease" : "width 0.3s cubic-bezier(.4,0,.2,1)",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
          boxShadow: "4px 0 24px rgba(0,0,0,0.18)",
          overflow: "hidden",
          transform: isMobile ? (mobileMenuOpen ? "translateX(0)" : "translateX(-100%)") : "translateX(0)",
        }}
      >
        <div
          style={{
            padding: "24px 20px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            minHeight: 80,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              flexShrink: 0,
              background: colors.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            L
          </div>
          {(!collapsed || isMobile) && (
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, fontFamily: "var(--font-display)" }}>
                LedgerLearn
              </div>
              <div
                style={{
                  color: colors.accent,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {colors.label}
              </div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: "16px 10px", overflowY: "auto" }}>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                if (isMobile) setMobileMenuOpen(false);
              }}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 14px",
                borderRadius: 12,
                marginBottom: 4,
                textDecoration: "none",
                transition: "all 0.2s",
                background: isActive ? `${colors.accent}22` : "transparent",
                color: isActive ? colors.accent : "rgba(255,255,255,0.65)",
                fontWeight: isActive ? 700 : 500,
                fontSize: 14,
                borderLeft: isActive ? `3px solid ${colors.accent}` : "3px solid transparent",
                whiteSpace: "nowrap",
              })}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {(!collapsed || isMobile) && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: "16px 10px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {(!collapsed || isMobile) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: colors.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div
                  style={{
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user?.name ?? "User"}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>{role}</div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 10,
              background: "rgba(255,107,107,0.12)",
              color: "#FF6B6B",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: (collapsed && !isMobile) ? "center" : "flex-start",
              gap: 8,
            }}
          >
            <span>🚪</span>
            {(!collapsed || isMobile) && "Logout"}
          </button>
        </div>

        {!isMobile && (
          <button
            onClick={() => setCollapsed((p) => !p)}
            style={{
              position: "absolute",
              top: 24,
              right: -14,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: colors.accent,
              border: "2px solid #1a1a2e",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              zIndex: 101,
            }}
          >
            {collapsed ? ">" : "<"}
          </button>
        )}
      </aside>

      <div
        style={{
          marginLeft: isMobile ? 0 : (collapsed ? 72 : 260),
          flex: 1,
          transition: "margin-left 0.3s cubic-bezier(.4,0,.2,1)",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <header
          style={{
            background: "#fff",
            padding: isMobile ? "0 14px" : "0 32px",
            height: 64,
            display: "flex",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 90,
            boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                type="button"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#1a1a2e",
                }}
              >
                =
              </button>
            )}
            <div
              style={{
                color: "#1a1a2e",
                fontWeight: 700,
                fontSize: isMobile ? 14 : 16,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Welcome back, <span style={{ color: colors.accent }}>{user?.name ?? "User"} 👋</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 10 }}>
            <div
              style={{
                background: colors.light,
                color: colors.accent,
                padding: isMobile ? "5px 10px" : "6px 16px",
                borderRadius: 30,
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                whiteSpace: "nowrap",
              }}
            >
              {isMobile ? role : colors.label}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: isMobile ? "16px" : "32px", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
