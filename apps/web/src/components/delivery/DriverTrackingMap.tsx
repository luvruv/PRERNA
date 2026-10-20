'use client';

import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

type Props = {
  driverId: string;
  orderId: string;
};

export const DriverTrackingMap: React.FC<Props> = ({ driverId, orderId }) => {
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [customerPos, setCustomerPos] = useState<{ lat: number; lng: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const leafletModuleRef = useRef<any>(null);

  // Connect socket and listen for driver location
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const s = io(socketUrl);
    s.emit('driver:join', { driverId });
    s.on('driver:location', (data: { latitude: number; longitude: number }) => {
      if (typeof data?.latitude === 'number' && typeof data?.longitude === 'number') {
        setDriverPos({ lat: data.latitude, lng: data.longitude });
      }
    });
    return () => {
      s.disconnect();
    };
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

  // Initialize Leaflet map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;
      leafletModuleRef.current = L;

      // Import css safely on client
      await import('leaflet/dist/leaflet.css' as any).catch(() => {});

      if (!isMounted) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const defaultCenter = driverPos || customerPos || { lat: 28.4595, lng: 77.0266 };
      const map = L.map(mapContainerRef.current, {
        center: [defaultCenter.lat, defaultCenter.lng],
        zoom: 13,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapInstanceRef.current = map;

      // Create Driver Marker if pos known
      if (driverPos) {
        const dIcon = L.divIcon({
          className: 'custom-driver-icon',
          html: `<div style="background-color: #D9700F; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);">🚚</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        driverMarkerRef.current = L.marker([driverPos.lat, driverPos.lng], { icon: dIcon })
          .addTo(map)
          .bindPopup('<b>🚚 Delivery Partner</b>');
      }

      // Create Customer Marker if pos known
      if (customerPos) {
        const cIcon = L.divIcon({
          className: 'custom-customer-icon',
          html: `<div style="background-color: #059669; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);">🏠</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        customerMarkerRef.current = L.marker([customerPos.lat, customerPos.lng], { icon: cIcon })
          .addTo(map)
          .bindPopup('<b>🏠 Customer Location</b>');
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Driver Marker position dynamically
  useEffect(() => {
    if (!driverPos || !mapInstanceRef.current || !leafletModuleRef.current) return;
    const L = leafletModuleRef.current;
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([driverPos.lat, driverPos.lng]);
    } else {
      const dIcon = L.divIcon({
        className: 'custom-driver-icon',
        html: `<div style="background-color: #D9700F; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);">🚚</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      driverMarkerRef.current = L.marker([driverPos.lat, driverPos.lng], { icon: dIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('<b>🚚 Delivery Partner</b>');
    }
  }, [driverPos]);

  // Update Customer Marker position dynamically
  useEffect(() => {
    if (!customerPos || !mapInstanceRef.current || !leafletModuleRef.current) return;
    const L = leafletModuleRef.current;
    if (customerMarkerRef.current) {
      customerMarkerRef.current.setLatLng([customerPos.lat, customerPos.lng]);
    } else {
      const cIcon = L.divIcon({
        className: 'custom-customer-icon',
        html: `<div style="background-color: #059669; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);">🏠</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      customerMarkerRef.current = L.marker([customerPos.lat, customerPos.lng], { icon: cIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('<b>🏠 Customer Location</b>');
    }
  }, [customerPos]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height: '300px', width: '100%' }}
      className="rounded-xl shadow-md border border-[#F0DEC8] relative overflow-hidden"
    />
  );
};
