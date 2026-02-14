/**
 * WebSocket Hook for Real-time Features
 * Handles connections for chat, collaboration, and live updates
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { getToken } from '@/lib/auth';

type MessageHandler = (data: unknown) => void;

interface WebSocketOptions {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  send: (data: unknown) => void;
  lastMessage: unknown | null;
  connect: () => void;
  disconnect: () => void;
}

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
const derivedWsBaseUrl = configuredApiUrl
  ? configuredApiUrl
      .replace('/api/v1', '')
      .replace('/api', '')
      .replace(/^http:/, 'ws:')
      .replace(/^https:/, 'wss:')
  : null;

const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  derivedWsBaseUrl ||
  'wss://qadam-backend-production.up.railway.app';

/**
 * Generic WebSocket hook for real-time communication
 */
export function useWebSocket(
  path: string,
  handlers: Record<string, MessageHandler> = {},
  options: WebSocketOptions = {}
): UseWebSocketReturn {
  const {
    onOpen,
    onClose,
    onError,
    reconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<unknown | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const token = getToken() || localStorage.getItem('token');
    if (!token) {
      setIsConnected(false);
      return;
    }
    const url = `${WS_BASE_URL}${path}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    
    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      onOpen?.();
    };

    wsRef.current.onclose = (event) => {
      setIsConnected(false);
      onClose?.();

      const authCloseCode = event.code === 4001 || event.code === 1008;
      if (authCloseCode) {
        return;
      }

      // Attempt reconnection
      if (reconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, reconnectInterval);
      }
    };

    wsRef.current.onerror = (error) => {
      onError?.(error);
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);

        // Call type-specific handler if exists
        const messageType = data.type;
        if (messageType && handlers[messageType]) {
          handlers[messageType](data);
        }

        // Call default handler if exists
        if (handlers['*']) {
          handlers['*'](data);
        }
      } catch (e) {
        console.error('WebSocket message parse error:', e);
      }
    };
  }, [path, handlers, onOpen, onClose, onError, reconnect, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { isConnected, send, lastMessage, connect, disconnect };
}

/**
 * AI Chat WebSocket hook with streaming support
 */
export function useChatWebSocket(conversationId: string) {
  const [messages, setMessages] = useState<{ role: string; content: string; id: string }[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const currentMessageIdRef = useRef<string | null>(null);

  const handlers: Record<string, MessageHandler> = {
    ack: (data: any) => {
      currentMessageIdRef.current = data.message_id;
      setIsStreaming(true);
      setStreamingContent('');
    },
    token: (data: any) => {
      setStreamingContent((prev) => prev + data.content);
    },
    done: (data: any) => {
      setIsStreaming(false);
      setMessages((prev) => [
        ...prev,
        {
          id: data.message_id,
          role: 'assistant',
          content: data.full_content,
        },
      ]);
      setStreamingContent('');
      currentMessageIdRef.current = null;
    },
  };

  const ws = useWebSocket(`/ws/chat/${conversationId}`, handlers);

  const sendMessage = useCallback(
    (content: string, context?: Record<string, unknown>) => {
      // Add user message immediately
      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
      };
      setMessages((prev) => [...prev, userMessage]);

      // Send to WebSocket
      ws.send({
        type: 'message',
        content,
        context,
      });
    },
    [ws]
  );

  return {
    ...ws,
    messages,
    isStreaming,
    streamingContent,
    sendMessage,
  };
}

/**
 * Collaboration WebSocket hook for real-time code editing
 */
export function useCollaborationWebSocket(sessionId: string) {
  const [participants, setParticipants] = useState<
    { user_id: string; name: string; cursor_line?: number; cursor_column?: number }[]
  >([]);
  const [code, setCode] = useState('');
  const [messages, setMessages] = useState<{ user: string; content: string; timestamp: string }[]>([]);

  const handlers: Record<string, MessageHandler> = {
    participant_joined: (data: any) => {
      setParticipants((prev) => [...prev, data.participant]);
    },
    participant_left: (data: any) => {
      setParticipants((prev) => prev.filter((p) => p.user_id !== data.user_id));
    },
    code_update: (data: any) => {
      setCode(data.code);
    },
    cursor_update: (data: any) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.user_id === data.user_id
            ? { ...p, cursor_line: data.line, cursor_column: data.column }
            : p
        )
      );
    },
    chat_message: (data: any) => {
      setMessages((prev) => [...prev, data.message]);
    },
    sync: (data: any) => {
      setCode(data.code);
      setParticipants(data.participants);
    },
  };

  const ws = useWebSocket(`/ws/collab/${sessionId}`, handlers);

  const updateCode = useCallback(
    (newCode: string) => {
      setCode(newCode);
      ws.send({ type: 'code_update', code: newCode });
    },
    [ws]
  );

  const updateCursor = useCallback(
    (line: number, column: number) => {
      ws.send({ type: 'cursor_update', line, column });
    },
    [ws]
  );

  const sendChatMessage = useCallback(
    (content: string) => {
      ws.send({ type: 'chat_message', content });
    },
    [ws]
  );

  return {
    ...ws,
    participants,
    code,
    messages,
    updateCode,
    updateCursor,
    sendChatMessage,
  };
}

/**
 * Task-specific AI tutoring WebSocket
 */
export function useTaskTutoringWebSocket(taskId: string) {
  const [hints, setHints] = useState<string[]>([]);
  const [isGettingHint, setIsGettingHint] = useState(false);
  const [currentHint, setCurrentHint] = useState('');

  const handlers: Record<string, MessageHandler> = {
    ack: () => {
      setIsGettingHint(true);
      setCurrentHint('');
    },
    token: (data: any) => {
      setCurrentHint((prev) => prev + data.content);
    },
    done: (data: any) => {
      setIsGettingHint(false);
      setHints((prev) => [...prev, data.full_content]);
      setCurrentHint('');
    },
  };

  const ws = useWebSocket(`/ws/chat/task/${taskId}`, handlers);

  const askForHelp = useCallback(
    (question: string, currentCode: string) => {
      ws.send({
        type: 'message',
        content: question,
        code: currentCode,
      });
    },
    [ws]
  );

  const updateCode = useCallback(
    (code: string) => {
      ws.send({ type: 'code_update', code });
    },
    [ws]
  );

  return {
    ...ws,
    hints,
    isGettingHint,
    currentHint,
    askForHelp,
    updateCode,
  };
}

/**
 * Live notifications WebSocket
 */
export function useNotificationsWebSocket() {
  const [notifications, setNotifications] = useState<
    { id: string; type: string; message: string; timestamp: string }[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handlers: Record<string, MessageHandler> = {
    notification: (data: any) => {
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);
    },
    badge_earned: (data: any) => {
      setNotifications((prev) => [
        {
          id: data.badge_id,
          type: 'badge',
          message: `You earned the "${data.badge_name}" badge!`,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
    },
    level_up: (data: any) => {
      setNotifications((prev) => [
        {
          id: `level-${data.level}`,
          type: 'level',
          message: `Congratulations! You reached level ${data.level}!`,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
    },
  };

  const ws = useWebSocket('/ws/notifications', handlers);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    ...ws,
    notifications,
    unreadCount,
    markAsRead,
  };
}
