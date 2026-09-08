import { useContext } from "react";
import { SocketContext } from "./socketContextObject";

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used inside a SocketProvider");
  }
  return context;
}
