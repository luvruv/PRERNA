'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Props {
  driverId: string;
}

export const DriverLocationTracker: React.FC<Props> = ({ driverId }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const s = io(socketUrl);
    s.emit('driver:join', { driverId });
    setSocket(s);

    // Watch position and emit updates
    if (typeof window !== 'undefined' && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          s.emit('driver:location', { latitude, longitude });
        },
        (err) => {
          console.error('Geolocation error', err);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
      return () => {
        navigator.geolocation.clearWatch(watchId);
        s.disconnect();
      };
    }
    return () => {
      s.disconnect();
    };
  }, [driverId]);

  // UI can be minimal – just a status indicator
  return (
    <div className="text-xs text-[#8C6D53] mb-2">
      Live GPS tracking active for driver {driverId}
    </div>
  );
};
