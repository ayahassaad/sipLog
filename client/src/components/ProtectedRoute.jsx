import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="status-message" role="status">Loading...</p>;
  }

  if (!user) {
    // Remember where they were headed so LoginPage can send them straight
    // back after they log in, instead of always landing on the home feed.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;
