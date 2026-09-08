import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./useAuth";
import { SocketContext } from "./socketContextObject";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
// Socket.IO connects to the server's origin directly, not the REST API's
// /api path -- strip that suffix off the same base URL the rest of the app
// already uses instead of introducing a second env var just for this.
const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

// Holds one live Socket.IO connection for the whole app, created once
// someone's logged in and torn down on logout -- chat hooks (useConversations,
// useChatThread) read it via useSocket() to listen for incoming messages.
export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    // withCredentials sends the same httpOnly session cookie the REST API
    // uses -- the server's socket middleware verifies it the same way
    // requireAuth does, so there's no separate socket login step.
    const connection = io(SOCKET_URL, { withCredentials: true });
    setSocket(connection);

    return () => {
      connection.disconnect();
      setSocket(null);
    };
  }, [user]);

  const value = useMemo(() => ({ socket }), [socket]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
