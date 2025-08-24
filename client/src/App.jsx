import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/services/auth-context.jsx";
import ProtectedRoute from "@/services/ProtectedRoute.jsx";

// Layouts
import Layout from "./Layout";
import ClientLayout from "./client/ClientLayout";

// Pages
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";

// Admin Pages
import AdminDashboard from "./admin/Dashboard";
import Employees from "./admin/Employees";
import Projects from "./admin/Projects";
import Attendance from "./admin/Attendance";

// Client Pages
import ClientDashboard from "./client/ClientDashboard";
import ClientTasks from "./client/Tasks";
import ClientLeaves from "./client/Leaves";
import AttendanceCalander from "./client/AttendanceCalander";
import ClientProfile from "./client/ClientProfile";
import LeavesPage from "./client/Leaves";
import Assignment from "./admin/Assignment";
import AdminLeaves from "./admin/AdminLeaves";
import ClientProject from "./client/ClientProject";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<Layout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="projects" element={<Projects />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leaves" element={<AdminLeaves />} />
            <Route path='assignments' element={<Assignment/>}/>
            
          </Route>
        </Route>
        {/* Client Routes */}
        // In your main router configuration
        <Route element={<ProtectedRoute allowedRoles={["client"]} />}>
          <Route path="/client" element={<ClientLayout />}>
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="profile" element={<ClientProfile />} />
            <Route path="tasks" element={<ClientTasks />} />
            <Route path="attendance" element={<AttendanceCalander />} />
            <Route path="leaves" element={<ClientLeaves />} />
            <Route path='projects' element={<ClientProject/>}/>
          </Route>
        </Route>
        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
