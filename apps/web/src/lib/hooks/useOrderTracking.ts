'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface RiderLiveEvent {
  orderId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  /** 'SIMULATION' = clearly-labelled virtual demo rider, 'GPS' = real device location. */
  source?: 'GPS' | 'SIMULATION';
  progress?: number;
  remainingMeters?: number;
  stage?: string;
  updatedAt?: string;
}

export interface OrderAcceptedEvent {
  orderId: string;
  title: string;
  message: string;
  subMessage?: string;
  acceptedAt?: string;
  rider?: { name?: string; phone?: string | null; vehicleType?: string | null; vehicleNumber?: string | null };
}

interface UseOrderTrackingOptions {
  orderId: string | undefined | null;
  /** Called on acceptance / status events so the page can refetch the persisted order. */
  onOrderChanged?: () => void;
}

const getSocketUrl = () =>
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4001';

/**
 * Customer-side Socket.IO subscription for ONE order room.
 * The server only lets the order's own customer join, and never emits rider
 * location before a delivery partner has accepted the order.
 */
export function useOrderTracking({ orderId, onOrderChanged }: UseOrderTrackingOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [acceptedEvent, setAcceptedEvent] = useState<OrderAcceptedEvent | null>(null);
  const [riderEvent, setRiderEvent] = useState<RiderLiveEvent | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);

  const changedRef = useRef(onOrderChanged);
  changedRef.current = onOrderChanged;

  useEffect(() => {
    if (!orderId || typeof window === 'undefined') return;

    const token = localStorage.getItem('prerna_access_token') ?? undefined;
    const socket: Socket = io(`${getSocketUrl()}/tracking`, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnectionAttempts: 8,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 8000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('joinOrderTracking', { orderId, token }, (res: any) => {
        if (res && res.success === false) {
          setJoinError(res.message || 'Unable to join live tracking');
          return;
        }
        setJoinError(null);
        if (res?.latestLocation) {
          setRiderEvent((prev) =>
            prev ?? {
              orderId,
              latitude: res.latestLocation.latitude,
              longitude: res.latestLocation.longitude,
            },
          );
        }
        // Re-sync persisted order after (re)connecting so nothing is missed while offline
        changedRef.current?.();
      });
    });

    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', () => setIsConnected(false));

    socket.on('orderAccepted', (data: OrderAcceptedEvent) => {
      if (data?.orderId !== orderId) return;
      setAcceptedEvent(data);
      changedRef.current?.();
    });

    socket.on('orderStatusUpdated', (data: { orderId: string; status: string }) => {
      if (data?.orderId !== orderId) return;
      setLiveStatus(data.status);
      changedRef.current?.();
    });

    socket.on('riderLocationUpdated', (data: RiderLiveEvent) => {
      if (
        data?.orderId === orderId &&
        typeof data.latitude === 'number' &&
        typeof data.longitude === 'number'
      ) {
        setRiderEvent(data);
      }
    });

    return () => {
      socket.emit('leaveOrderTracking', { orderId });
      socket.removeAllListeners();
      socket.disconnect();
      setIsConnected(false);
    };
  }, [orderId]);

  return { isConnected, joinError, acceptedEvent, riderEvent, liveStatus };
}
