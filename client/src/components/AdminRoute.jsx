import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

// Same shape as ProtectedRoute, plus the admin check -- a logged-out
// visitor goes to /login, a logged-in non-admin quietly bounces to the
// home feed instead of seeing a 403-style message for a tab they were
// never meant to find.
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="status-message" role="status">Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
