import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default icon paths for Leaflet in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
  iconUrl: '/leaflet/images/marker-icon.png',
  shadowUrl: '/leaflet/images/marker-shadow.png',
});

type Props = {
  driverId: string;
  orderId: string;
};

export const DriverTrackingMap: React.FC<Props> = ({ driverId, orderId }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [customerPos, setCustomerPos] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  // Connect socket and listen for driver location
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const s = io(socketUrl); // API server URL
    s.emit('driver:join', { driverId });
    s.on('driver:location', (data) => {
      setDriverPos({ lat: data.latitude, lng: data.longitude });
    });
    setSocket(s);
    return () => s.disconnect();
  }, [driverId]);

  // Fetch order address (customer location) once
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/v1/orders/${orderId}`);
        if (!res.ok) return;
        const order = await res.json();
        const addr = order.address;
        if (addr?.latitude && addr?.longitude) {
          setCustomerPos({ lat: addr.latitude, lng: addr.longitude });
        }
      } catch (e) {
        console.error('Failed to fetch order', e);
      }
    };
    fetchOrder();
  }, [orderId]);

  // Choose centre: driver if known, else customer, else a generic centre
  const centre = driverPos ?? customerPos ?? { lat: 0, lng: 0 };

  return (
    <MapContainer
      center={[centre.lat, centre.lng]}
      zoom={13}
      style={{ height: '300px', width: '100%' }}
      className="rounded-md shadow-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {driverPos && (
        <Marker position={[driverPos.lat, driverPos.lng]}>
          <Popup>🚚 Delivery partner</Popup>
        </Marker>
      )}
      {customerPos && (
        <Marker position={[customerPos.lat, customerPos.lng]}>
          <Popup>🏠 Customer location</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};
