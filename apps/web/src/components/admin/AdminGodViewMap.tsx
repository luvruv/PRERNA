'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Store,
  Bike,
  Navigation,
  Layers,
  Shield,
  Activity,
  Radio,
  Search,
} from 'lucide-react';

interface AdminGodViewMapProps {
  stores: any[];
  deliveryPartners: any[];
  orders: any[];
}

export function AdminGodViewMap({
  stores = [],
  deliveryPartners = [],
  orders = [],
}: AdminGodViewMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'STORES' | 'RIDERS' | 'ORDERS'>('ALL');
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  // Default coordinate center (Gurugram NCR Hub)
  const defaultCenter = [28.4595, 77.0266];

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [defaultCenter[0], defaultCenter[1]],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;

      renderEntities(L, map, markersGroup);
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

  // Re-render markers and geofence circles whenever filter or datasets update
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    import('leaflet').then((LModule) => {
      const L = LModule.default;
      renderEntities(L, mapInstanceRef.current, markersGroupRef.current);
    });
  }, [stores, deliveryPartners, orders, filterMode]);

  const renderEntities = (L: any, map: any, group: any) => {
    group.clearLayers();
    const latLngBounds: any[] = [];

    // 1. Render Stores and Delivery Radius Coverage Circles
    if (filterMode === 'ALL' || filterMode === 'STORES') {
      stores.forEach((store) => {
        const sLat = store.latitude || 28.4595;
        const sLng = store.longitude || 77.0266;
        const radiusMeters = (store.deliveryRadiusKm || 10.0) * 1000;

        // Coverage circle
        const circle = L.circle([sLat, sLng], {
          radius: radiusMeters,
          color: '#D9700F',
          fillColor: '#D9700F',
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: '4, 4',
        }).addTo(group);

        circle.bindTooltip(`<b>${store.name}</b> Coverage Zone (${store.deliveryRadiusKm || 10} km)`, {
          sticky: true,
        });

        // Store Pin Icon
        const storeIcon = L.divIcon({
          className: 'store-godview-icon',
          html: `
            <div style="
              display: flex; flex-direction: column; align-items: center;
              transform: translate(-50%, -100%);
            ">
              <div style="
                background: #6B3A0A; color: white; padding: 6px 8px; border-radius: 12px;
                box-shadow: 0 4px 10px rgba(107, 58, 10, 0.4); border: 2px solid white;
                display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 800;
              ">
                <span>🏪 ${store.name}</span>
              </div>
              <div style="border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #6B3A0A;"></div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        });

        const marker = L.marker([sLat, sLng], { icon: storeIcon }).addTo(group);
        marker.on('click', () => {
          setSelectedEntity({ type: 'STORE', data: store });
        });

        latLngBounds.push([sLat, sLng]);
      });
    }

    // 2. Render Delivery Partners with Dynamic Status Colors
    // Green = Available (idle), Orange = Picking up / Assigned, Blue = Out for delivery
    if (filterMode === 'ALL' || filterMode === 'RIDERS') {
      deliveryPartners.forEach((dp) => {
        const rLat = dp.currentLat || 28.4612 + (Math.random() - 0.5) * 0.02;
        const rLng = dp.currentLng || 77.0305 + (Math.random() - 0.5) * 0.02;

        const hasActiveDeliveries = dp.assignments?.some(
          (a: any) => a.status === 'ASSIGNED' || a.status === 'PICKED_UP' || a.status === 'OUT_FOR_DELIVERY'
        );
        const isOutForDelivery = dp.assignments?.some((a: any) => a.status === 'OUT_FOR_DELIVERY');

        let statusColor = '#059669'; // Green = Available
        let statusLabel = 'Available';
        if (isOutForDelivery) {
          statusColor = '#2563EB'; // Blue = En Route to Customer
          statusLabel = 'En Route to Customer';
        } else if (hasActiveDeliveries) {
          statusColor = '#D9700F'; // Orange = En Route to Store
          statusLabel = 'En Route to Store';
        }

        const riderIcon = L.divIcon({
          className: 'rider-godview-icon',
          html: `
            <div style="
              display: flex; flex-direction: column; align-items: center;
              transform: translate(-50%, -50%); position: relative;
            ">
              <span style="
                position: absolute; width: 36px; height: 36px; border-radius: 50%;
                background: ${statusColor}; opacity: 0.3; animation: ping 1.8s infinite;
              "></span>
              <div style="
                width: 32px; height: 32px; border-radius: 10px;
                background: ${statusColor}; color: white; display: flex; align-items: center;
                justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.25);
                border: 2px solid white; position: relative; z-index: 5;
              ">
                🛵
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([rLat, rLng], { icon: riderIcon }).addTo(group);
        marker.on('click', () => {
          setSelectedEntity({
            type: 'RIDER',
            data: { ...dp, statusLabel, statusColor, lat: rLat, lng: rLng },
          });
        });

        latLngBounds.push([rLat, rLng]);
      });
    }

    // 3. Render Active Orders (Unassigned or pending drop points)
    if (filterMode === 'ALL' || filterMode === 'ORDERS') {
      orders.forEach((ord) => {
        if (!ord.address?.latitude || !ord.address?.longitude) return;
        const oLat = ord.address.latitude;
        const oLng = ord.address.longitude;

        const isUnassigned = !ord.deliveryAssignment;

        const orderIcon = L.divIcon({
          className: 'order-godview-icon',
          html: `
            <div style="
              display: flex; flex-direction: column; align-items: center;
              transform: translate(-50%, -100%);
            ">
              <div style="
                background: ${isUnassigned ? '#DC2626' : '#7C3AED'}; color: white;
                padding: 4px 6px; border-radius: 8px; font-size: 10px; font-weight: 900;
                border: 1.5px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.2);
              ">
                📦 #${ord.orderNumber.slice(-4)}
              </div>
              <div style="border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid ${isUnassigned ? '#DC2626' : '#7C3AED'};"></div>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        });

        const marker = L.marker([oLat, oLng], { icon: orderIcon }).addTo(group);
        marker.on('click', () => {
          setSelectedEntity({ type: 'ORDER', data: ord });
        });

        latLngBounds.push([oLat, oLng]);
      });
    }

    if (latLngBounds.length > 0 && map) {
      try {
        const bounds = L.latLngBounds(latLngBounds);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } catch {}
    }
  };

  return (
    <div className="space-y-4">
      {/* Map Control Bar */}
      <div className="bg-white p-4 rounded-3xl border border-[#F0DEC8] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#D9700F] flex items-center justify-center border border-orange-200">
            <Radio className="w-5 h-5 animate-pulse text-[#D9700F]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#6B3A0A] flex items-center gap-2">
              <span>Hyperlocal Fleet & Store Coverage God-View</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Real-Time Telemetry
              </span>
            </h3>
            <p className="text-[11px] text-[#8C6D53]">
              Visualizing registered merchant geofences, active delivery riders, and drop locations
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-[#FAF3EB] p-1 rounded-2xl border border-[#F0DEC8] overflow-x-auto text-xs font-bold">
          {(['ALL', 'STORES', 'RIDERS', 'ORDERS'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterMode === mode
                  ? 'bg-[#D9700F] text-white shadow-sm'
                  : 'text-[#6B3A0A] hover:text-[#D9700F]'
              }`}
            >
              {mode === 'ALL' && 'All Layers'}
              {mode === 'STORES' && `Stores (${stores.length})`}
              {mode === 'RIDERS' && `Riders (${deliveryPartners.length})`}
              {mode === 'ORDERS' && `Orders (${orders.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Map Canvas and Inspect Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 bg-white rounded-3xl border border-[#F0DEC8] shadow-card overflow-hidden relative">
          <div ref={mapContainerRef} className="w-full h-[520px] z-10" />

          {/* Interactive Legend Badge */}
          <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-[#F0DEC8] shadow-lg text-[11px] space-y-1.5">
            <div className="font-black text-[#6B3A0A] text-xs">Live Map Indicators</div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#059669] inline-block" />
              <span className="text-gray-700">Available Rider (Idle)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#D9700F] inline-block" />
              <span className="text-gray-700">En Route to Store (Pickup)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#2563EB] inline-block" />
              <span className="text-gray-700">En Route to Doorstep (Delivery)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-[#6B3A0A] inline-block" />
              <span className="text-gray-700">Store Pin & Delivery Radius Circle</span>
            </div>
          </div>
        </div>

        {/* Selected Entity Inspector Panel */}
        <div className="bg-white rounded-3xl p-5 border border-[#F0DEC8] shadow-card space-y-4">
          <h4 className="text-xs font-black uppercase text-[#6B3A0A] tracking-wider border-b border-[#F0DEC8] pb-2">
            Entity Inspector
          </h4>

          {selectedEntity ? (
            <div className="space-y-3 text-xs">
              {selectedEntity.type === 'STORE' && (
                <>
                  <div className="p-3 bg-orange-50 rounded-2xl border border-orange-200">
                    <span className="text-[10px] font-bold text-[#D9700F] block">MERCHANT STORE</span>
                    <h5 className="font-black text-sm text-[#6B3A0A]">{selectedEntity.data.name}</h5>
                    <p className="text-[11px] text-[#8C6D53] mt-0.5">{selectedEntity.data.address}</p>
                  </div>
                  <div className="space-y-1 text-[#6B3A0A]">
                    <div><b>Coverage Radius:</b> {selectedEntity.data.deliveryRadiusKm || 10} km</div>
                    <div><b>Coordinates:</b> {selectedEntity.data.latitude?.toFixed(4)}, {selectedEntity.data.longitude?.toFixed(4)}</div>
                    <div><b>Status:</b> {selectedEntity.data.isActive ? 'Active & Open' : 'Closed'}</div>
                  </div>
                </>
              )}

              {selectedEntity.type === 'RIDER' && (
                <>
                  <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200">
                    <span className="text-[10px] font-bold text-purple-700 block">DELIVERY PARTNER</span>
                    <h5 className="font-black text-sm text-[#6B3A0A]">{selectedEntity.data.user?.name}</h5>
                    <p className="text-[11px] text-[#8C6D53] mt-0.5">{selectedEntity.data.vehicleNumber || 'Motorcycle'}</p>
                  </div>
                  <div className="space-y-1 text-[#6B3A0A]">
                    <div><b>Live Status:</b> <span className="font-bold" style={{ color: selectedEntity.data.statusColor }}>{selectedEntity.data.statusLabel}</span></div>
                    <div><b>Phone:</b> {selectedEntity.data.user?.phone || '+91 98100 12345'}</div>
                    <div><b>Current GPS:</b> {selectedEntity.data.lat?.toFixed(4)}°N, {selectedEntity.data.lng?.toFixed(4)}°E</div>
                  </div>
                </>
              )}

              {selectedEntity.type === 'ORDER' && (
                <>
                  <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                    <span className="text-[10px] font-bold text-blue-700 block">CUSTOMER ORDER</span>
                    <h5 className="font-black text-sm text-[#6B3A0A]">#{selectedEntity.data.orderNumber}</h5>
                    <p className="text-[11px] text-[#8C6D53] mt-0.5">{selectedEntity.data.customer?.name}</p>
                  </div>
                  <div className="space-y-1 text-[#6B3A0A]">
                    <div><b>Status:</b> {selectedEntity.data.status}</div>
                    <div><b>Order Amount:</b> ₹{selectedEntity.data.total}</div>
                    <div><b>Delivery Address:</b> {selectedEntity.data.address?.street}</div>
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => setSelectedEntity(null)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-[#6B3A0A] font-bold rounded-xl text-xs transition"
              >
                Clear Selection
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-[#8C6D53] space-y-2">
              <MapPin className="w-8 h-8 text-[#D9700F] mx-auto opacity-50" />
              <p className="text-xs">
                Click on any store pin, delivery partner rider icon, or drop point on the map to inspect live metrics and details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
