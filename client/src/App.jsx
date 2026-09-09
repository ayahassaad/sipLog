import { useEffect, useRef } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import JournalPage from "./pages/JournalPage";
import CommunityPage from "./pages/CommunityPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import UserProfilePage from "./pages/UserProfilePage";
import AdminPage from "./pages/AdminPage";
import ChatPage from "./pages/ChatPage";
import NotificationsPage from "./pages/NotificationsPage";
import { recordVisit } from "./services/analyticsService";

function App() {
  // Once per app load, logged in or not -- the site-wide visit counter
  // shown on the admin tab. Fire-and-forget (see analyticsService), so
  // nothing here waits on it or reacts to whether it succeeded. The ref
  // guard is what actually makes this "once": React 18 StrictMode runs a
  // mount effect, its cleanup, and the effect again in development, and
  // without the guard that double-fire counted every dev page load as 2
  // visits instead of 1 (a dev-only quirk -- the ref survives StrictMode's
  // replay because it's the same component instance throughout).
  const hasRecordedVisit = useRef(false);
  useEffect(() => {
    if (hasRecordedVisit.current) {
      return;
    }
    hasRecordedVisit.current = true;
    recordVisit();
  }, []);

  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          {/* Community is the public home page -- anyone can browse it,
              logged in or not. My Journal is personal, so it stays gated. */}
          <Route path="/" element={<CommunityPage />} />
          <Route
            path="/journal"
            element={
              <ProtectedRoute>
                <JournalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          {/* Public -- anyone can view a profile by username, logged in or
              not, same as Community itself. */}
          <Route path="/users/:username" element={<UserProfilePage />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          {/* :username is optional in spirit -- /chat/:username (from a
              profile's Message button) resolves to a conversation and
              redirects to the plain /chat, which is also the inbox itself. */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:username"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
