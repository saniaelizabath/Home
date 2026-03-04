import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import PrivateRoute from "./components/shared/PrivateRoute";

// Auth
import RoleSelectModal from "./pages/auth/RoleSelectModal";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";

// Student
import StudentRegister from "./pages/student/StudentRegister";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentProfile from "./pages/student/StudentProfile";
import ClassDashboard from "./pages/student/ClassDashboard";
import ProgressDashboard from "./pages/student/ProgressDashboard";
import StudentChat from "./pages/student/StudentChat";
import TaskScheduler from "./pages/student/TaskScheduler";
import StudentAttendance from "./pages/student/Attendance";

// Teacher
import TeacherRegister from "./pages/teacher/TeacherRegister";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherProfile from "./pages/teacher/TeacherProfile";
import ClassManagement from "./pages/teacher/ClassManagement";
import AcademicContent from "./pages/teacher/AcademicContent";
import Evaluation from "./pages/teacher/Evaluation";
import TeacherChat from "./pages/teacher/TeacherChat";
import Syllabus from "./pages/teacher/Syllabus";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentManagement from "./pages/admin/StudentManagement";
import TeacherManagement from "./pages/admin/TeacherManagement";
import ClassScheduling from "./pages/admin/ClassScheduling";
import CourseManagement from "./pages/admin/CourseManagement";
import AdminChat from "./pages/admin/AdminChat";
import Reports from "./pages/admin/Reports";
import Announcements from "./pages/admin/Announcements";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/select-role" element={<RoleSelectModal />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Student */}
        <Route path="/student/register" element={<StudentRegister />} />
        <Route path="/student/dashboard" element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />
        <Route path="/student/profile" element={<PrivateRoute role="student"><StudentProfile /></PrivateRoute>} />
        <Route path="/student/classes" element={<PrivateRoute role="student"><ClassDashboard /></PrivateRoute>} />
        <Route path="/student/progress" element={<PrivateRoute role="student"><ProgressDashboard /></PrivateRoute>} />
        <Route path="/student/chat" element={<PrivateRoute role="student"><StudentChat /></PrivateRoute>} />
        <Route path="/student/tasks" element={<PrivateRoute role="student"><TaskScheduler /></PrivateRoute>} />
        <Route path="/student/attendance" element={<PrivateRoute role="student"><StudentAttendance /></PrivateRoute>} />

        {/* Teacher */}
        <Route path="/teacher/register" element={<TeacherRegister />} />
        <Route path="/teacher/dashboard" element={<PrivateRoute role="teacher"><TeacherDashboard /></PrivateRoute>} />
        <Route path="/teacher/profile" element={<PrivateRoute role="teacher"><TeacherProfile /></PrivateRoute>} />
        <Route path="/teacher/classes" element={<PrivateRoute role="teacher"><ClassManagement /></PrivateRoute>} />
        <Route path="/teacher/content" element={<PrivateRoute role="teacher"><AcademicContent /></PrivateRoute>} />
        <Route path="/teacher/evaluation" element={<PrivateRoute role="teacher"><Evaluation /></PrivateRoute>} />
        <Route path="/teacher/chat" element={<PrivateRoute role="teacher"><TeacherChat /></PrivateRoute>} />
        <Route path="/teacher/syllabus" element={<PrivateRoute role="teacher"><Syllabus /></PrivateRoute>} />
        <Route path="/teacher/attendance" element={<PrivateRoute role="teacher"><TeacherAttendance /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/students" element={<PrivateRoute role="admin"><StudentManagement /></PrivateRoute>} />
        <Route path="/admin/teachers" element={<PrivateRoute role="admin"><TeacherManagement /></PrivateRoute>} />
        <Route path="/admin/scheduling" element={<PrivateRoute role="admin"><ClassScheduling /></PrivateRoute>} />
        <Route path="/admin/courses" element={<PrivateRoute role="admin"><CourseManagement /></PrivateRoute>} />
        <Route path="/admin/chat" element={<PrivateRoute role="admin"><AdminChat /></PrivateRoute>} />
        <Route path="/admin/reports" element={<PrivateRoute role="admin"><Reports /></PrivateRoute>} />
        <Route path="/admin/announcements" element={<PrivateRoute role="admin"><Announcements /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
