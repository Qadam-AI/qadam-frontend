"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";

export type WebSocketMessage = {
  type: string;
  data: Record<string, unknown>;
  timestamp?: string;
};

export type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket({
  url,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  reconnect = true,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
}: UseWebSocketOptions) {
  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { token } = useAuthStore();

  const connect = useCallback(() => {
    if (!token) {
      console.warn("WebSocket: No auth token available");
      return;
    }

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      setStatus("connecting");
      
      // Add token to URL as query param for auth
      const wsUrl = `${url}?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setStatus("connected");
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error("WebSocket: Failed to parse message", error);
        }
      };

      ws.onclose = () => {
        setStatus("disconnected");
        onDisconnect?.();

        // Attempt reconnection
        if (reconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`WebSocket: Reconnecting... (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        setStatus("error");
        onError?.(error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("WebSocket: Connection failed", error);
      setStatus("error");
    }
  }, [url, token, onMessage, onConnect, onDisconnect, onError, reconnect, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setStatus("disconnected");
    reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent auto-reconnect
  }, [maxReconnectAttempts]);

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket: Cannot send - not connected");
    }
  }, []);

  // Connect on mount if token available
  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  return {
    status,
    lastMessage,
    connect,
    disconnect,
    send,
    isConnected: status === "connected",
  };
}

// Specialized hook for progress updates
export function useProgressWebSocket(userId: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const wsUrl = apiUrl.replace(/^http/, "ws") + `/ws/progress/${userId}`;
  
  const [progressUpdates, setProgressUpdates] = useState<WebSocketMessage[]>([]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === "progress_update") {
      setProgressUpdates((prev) => [...prev.slice(-9), message]);
    }
  }, []);

  const ws = useWebSocket({
    url: wsUrl,
    onMessage: handleMessage,
  });

  return {
    ...ws,
    progressUpdates,
    clearUpdates: () => setProgressUpdates([]),
  };
}

// Specialized hook for course updates (for instructors)
export function useCourseWebSocket(courseId: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const wsUrl = apiUrl.replace(/^http/, "ws") + `/ws/course/${courseId}`;
  
  const [enrollmentUpdates, setEnrollmentUpdates] = useState<WebSocketMessage[]>([]);
  const [attemptUpdates, setAttemptUpdates] = useState<WebSocketMessage[]>([]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case "new_enrollment":
        setEnrollmentUpdates((prev) => [...prev.slice(-9), message]);
        break;
      case "attempt_completed":
        setAttemptUpdates((prev) => [...prev.slice(-9), message]);
        break;
    }
  }, []);

  const ws = useWebSocket({
    url: wsUrl,
    onMessage: handleMessage,
  });

  return {
    ...ws,
    enrollmentUpdates,
    attemptUpdates,
    clearEnrollmentUpdates: () => setEnrollmentUpdates([]),
    clearAttemptUpdates: () => setAttemptUpdates([]),
  };
}
