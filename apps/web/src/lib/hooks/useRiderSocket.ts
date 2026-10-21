'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface RiderLocationPayload {
  orderId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

interface UseRiderSocketOptions {
  orderId: string | undefined | null;
  onAck?: (res: { success: boolean }) => void;
}

interface UseRiderSocketReturn {
  isConnected: boolean;
  emitLocation: (payload: Omit<RiderLocationPayload, 'orderId'>) => void;
  statusLabel: string;
  lastPing: string | null;
}

const getSocketUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:4001';
  return (process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')) || 'http://localhost:4001';
};

export function useRiderSocket({ orderId, onAck }: UseRiderSocketOptions): UseRiderSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastPing, setLastPing] = useState<string | null>(null);
  const onAckRef = useRef(onAck);
  onAckRef.current = onAck;

  useEffect(() => {
    if (!orderId || typeof window === 'undefined') return;

    const token = localStorage.getItem('prerna_access_token') ?? undefined;

    const socket = io(`${getSocketUrl()}/tracking`, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnectionAttempts: 8,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 8000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('joinOrderTracking', { orderId, token });
    });

    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', () => setIsConnected(false));

    return () => {
      socket.emit('leaveOrderTracking', { orderId });
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [orderId]);

  const emitLocation = useCallback(
    ({ latitude, longitude, heading, speed }: Omit<RiderLocationPayload, 'orderId'>) => {
      if (!socketRef.current?.connected || !orderId) return;
      socketRef.current.emit(
        'updateRiderLocation',
        { orderId, latitude, longitude, heading, speed },
        (res: { success: boolean }) => {
          if (res?.success) setLastPing(new Date().toISOString());
          onAckRef.current?.(res);
        },
      );
    },
    [orderId],
  );

  const statusLabel = isConnected ? 'Socket Live' : orderId ? 'Reconnecting...' : 'No Active Order';

  return { isConnected, emitLocation, statusLabel, lastPing };
}