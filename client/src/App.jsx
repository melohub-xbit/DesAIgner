import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import ProjectSettings from "./pages/ProjectSettings";
import About from "./pages/About";

const RootRedirect = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/home" replace />
  );
};

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1f2937",
            color: "#fff",
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor/:projectId"
          element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/settings"
          element={
            <ProtectedRoute>
              <ProjectSettings />
            </ProtectedRoute>
          }
        />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/" element={<RootRedirect />} />
      </Routes>
    </Router>
  );
}

export default App;
