import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Task } from './types';
import { getAccessToken } from './api';

const getSocketUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  const { protocol, hostname } = window.location;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${hostname}:3000`;
  }
  
  return 'http://localhost:3000';
};

const API_URL = getSocketUrl();

interface TaskEvents {
  'task:created': (data: { task: Task }) => void;
  'task:updated': (data: { task: Task }) => void;
  'task:deleted': (data: { taskId: string }) => void;
  'task:claimed': (data: { task: Task; agentId: string }) => void;
  'task:completed': (data: { task: Task; agentId: string }) => void;
  'task:blocked': (data: { task: Task; agentId: string; reason: string }) => void;
}

export function useSocket(handlers: Partial<TaskEvents>) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    const token = getAccessToken();
    
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error.message);
      setConnected(false);
    });

    const events: (keyof TaskEvents)[] = [
      'task:created',
      'task:updated', 
      'task:deleted',
      'task:claimed',
      'task:completed',
      'task:blocked',
    ];

    events.forEach((event) => {
      socket.on(event, (data: unknown) => {
        const handler = handlersRef.current[event];
        if (handler) {
          (handler as (data: unknown) => void)(data);
        }
      });
    });
  }, []);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [connect]);

  return { connected, reconnect };
}
