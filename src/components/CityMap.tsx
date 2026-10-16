import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Ambulance, EmergencyCall, Hospital, TrafficLight } from '../types';
import { CITY_PRESETS } from '../data/cityPresets';
import { getDistanceMeters } from '../services/simulationEngine';
import { Crosshair } from 'lucide-react';

interface CityMapProps {
  selectedCityId: string;
  ambulances: Ambulance[];
  emergencies: EmergencyCall[];
  hospitals: Hospital[];
  trafficLights: TrafficLight[];
  selectedAmbulanceId: string | null;
  selectedEmergencyId: string | null;
  selectedHospitalId: string | null;
  onSelectAmbulance: (id: string) => void;
  onSelectEmergency: (id: string) => void;
  onSelectHospital: (id: string) => void;
}

// Controller for map resizing and smooth flying
function AutoResizeMapController({
  center,
  cityId,
}: {
  center: [number, number];
  cityId: string;
}) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
    };
  }, [map, cityId]);

  useEffect(() => {
    map.flyTo(center, 13, { duration: 1.0 });
    map.invalidateSize();
  }, [center, map]);

  return null;
}

export const CityMap: React.FC<CityMapProps> = ({
  selectedCityId,
  ambulances,
  emergencies,
  hospitals,
  trafficLights,
  selectedAmbulanceId,
  selectedEmergencyId,
  selectedHospitalId,
  onSelectAmbulance,
  onSelectEmergency,
  onSelectHospital,
}) => {
  const currentCityPreset = CITY_PRESETS[selectedCityId] || CITY_PRESETS['mumbai'];
  const defaultCenter: [number, number] = currentCityPreset.center;

  // Selected Emergency & Active Ambulance
  const selectedEmg = emergencies.find(e => e.id === selectedEmergencyId) || emergencies[0];
  const activeAmbulance = ambulances.find(a => a.status === 'en_route_patient' || a.status === 'transporting') || ambulances[0];

  // Find Nearest Hospital to Selected Emergency
  let nearestHosp: Hospital | null = null;
  let minDistMeters = Infinity;

  if (selectedEmg && hospitals.length > 0) {
    hospitals.forEach(h => {
      const d = getDistanceMeters(selectedEmg.location.lat, selectedEmg.location.lng, h.location.lat, h.location.lng);
      if (d < minDistMeters) {
        minDistMeters = d;
        nearestHosp = h;
      }
    });
  }

  // Focus center
  let focusCenter = defaultCenter;
  if (selectedAmbulanceId) {
    const amb = ambulances.find(a => a.id === selectedAmbulanceId);
    if (amb) focusCenter = [amb.location.lat, amb.location.lng];
  } else if (selectedEmergencyId && selectedEmg) {
    focusCenter = [selectedEmg.location.lat, selectedEmg.location.lng];
  } else if (selectedHospitalId) {
    const hosp = hospitals.find(h => h.id === selectedHospitalId);
    if (hosp) focusCenter = [hosp.location.lat, hosp.location.lng];
  }

  // --- 1. Clean, Clear Ambulance Marker ---
  const createAmbulanceIcon = (amb: Ambulance, isSelected: boolean) => {
    const isMoving = amb.status === 'en_route_patient' || amb.status === 'transporting';
    const statusBg = isMoving ? '#dc2626' : '#0284c7';

    return L.divIcon({
      className: 'clean-ambulance-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;">
          <!-- Floating Name Tag -->
          <div style="
            position: absolute;
            top: -24px;
            white-space: nowrap;
            background: #0f172a;
            border: 2px solid ${statusBg};
            color: #ffffff;
            padding: 1px 7px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            gap: 4px;
            z-index: 10;
          ">
            <span>🚑 ${amb.callsign}</span>
            ${amb.speedKmh > 0 ? `<span style="color: #facc15; font-family: monospace;">(${amb.speedKmh} km/h)</span>` : ''}
          </div>

          <!-- Ambulance Badge -->
          <div style="
            width: 38px;
            height: 38px;
            background: ${statusBg};
            border: 3px solid #ffffff;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.6);
            ${isSelected ? 'outline: 3px solid #38bdf8; outline-offset: 2px; transform: scale(1.15);' : ''}
          ">
            🚑
          </div>
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });
  };

  // --- 2. Clean, Clear Hospital Marker ---
  const createHospitalIcon = (hosp: Hospital, isSelected: boolean, isNearest: boolean) => {
    return L.divIcon({
      className: 'clean-hospital-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;">
          <!-- Floating Hospital Tag -->
          <div style="
            position: absolute;
            top: -24px;
            white-space: nowrap;
            background: ${isNearest ? '#047857' : '#1e293b'};
            border: 2px solid ${isNearest ? '#10b981' : '#38bdf8'};
            color: #ffffff;
            padding: 2px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            z-index: 10;
          ">
            ${isNearest ? '⭐ NEAREST: ' : '🏥 '}${hosp.name.split(' ')[0]} (${hosp.openBeds.er} Beds)
          </div>

          <!-- Hospital Badge -->
          <div style="
            width: 38px;
            height: 38px;
            background: ${isNearest ? '#059669' : '#0284c7'};
            border: 3px solid #ffffff;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.6);
            ${isSelected || isNearest ? 'outline: 3px solid #10b981; outline-offset: 2px; transform: scale(1.15);' : ''}
          ">
            🏥
          </div>
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });
  };

  // --- 3. Clean Emergency Call Marker ---
  const createEmergencyIcon = (emg: EmergencyCall, isSelected: boolean) => {
    return L.divIcon({
      className: 'clean-emergency-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;">
          <!-- Floating Ticket Tag -->
          <div style="
            position: absolute;
            top: -24px;
            white-space: nowrap;
            background: #991b1b;
            border: 2px solid #ef4444;
            color: #ffffff;
            padding: 2px 7px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 800;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            z-index: 10;
          ">
            🚨 ${emg.ticketNumber} (${emg.priority.split('_')[0]})
          </div>

          <!-- Pulsing Red Emergency Marker -->
          <div style="
            width: 36px;
            height: 36px;
            background: #dc2626;
            border: 3px solid #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: 0 0 16px rgba(220, 38, 38, 0.8);
            ${isSelected ? 'outline: 3px solid #fde047; outline-offset: 2px; transform: scale(1.2);' : ''}
          ">
            🚨
          </div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });
  };

  // --- 4. Clean Traffic Light Marker ---
  const createTrafficLightIcon = (tl: TrafficLight) => {
    const isGreen = tl.currentState === 'GREEN' || tl.isPreempted;
    const lightColor = isGreen ? '#16a34a' : '#dc2626';

    return L.divIcon({
      className: 'clean-traffic-light-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          ${tl.isPreempted ? `
            <div style="
              position: absolute;
              top: -18px;
              white-space: nowrap;
              background: #14532d;
              border: 1px solid #22c55e;
              color: #86efac;
              padding: 1px 5px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 800;
              z-index: 10;
            ">
              ⚡ GREEN WAVE
            </div>
          ` : ''}

          <div style="
            width: 28px;
            height: 28px;
            background: #0f172a;
            border: 2px solid ${lightColor};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5);
          ">
            🚦
          </div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  return (
    <div className="relative w-full h-full min-h-[440px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Top Floating Follow Action Button */}
      <button
        onClick={() => {
          if (activeAmbulance) onSelectAmbulance(activeAmbulance.id);
        }}
        title="Center map on active moving ambulance"
        className="absolute top-3 right-3 z-[1000] bg-slate-900/90 hover:bg-slate-800 text-sky-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700 shadow-xl transition flex items-center gap-1.5 text-xs font-bold"
      >
        <Crosshair className="w-3.5 h-3.5 text-sky-400" /> Center on Ambulance 🚑
      </button>

      {/* Main Map Container */}
      <MapContainer
        key={selectedCityId}
        center={defaultCenter}
        zoom={currentCityPreset.zoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '440px' }}
      >
        <AutoResizeMapController center={focusCenter} cityId={selectedCityId} />
        
        {/* Crystal Clear, Standard OpenStreetMap Tile Layer (100% Free, Zero API Keys, Easy to Understand) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 1. Nearest Hospital Direct Route (Clear Emerald Dashed Line) */}
        {selectedEmg && nearestHosp && (
          <Polyline
            key={`nearest-route-${selectedEmg.id}-${(nearestHosp as Hospital).id}`}
            positions={[
              [selectedEmg.location.lat, selectedEmg.location.lng],
              [(nearestHosp as Hospital).location.lat, (nearestHosp as Hospital).location.lng],
            ]}
            pathOptions={{
              color: '#059669',
              weight: 4,
              opacity: 0.95,
              dashArray: '8, 8',
            }}
          />
        )}

        {/* 2. Ambulance Active Dispatch Route (Clear Bold Line) */}
        {ambulances.map((amb) => {
          if (!amb.routePolyline || amb.routePolyline.length < 2) return null;
          const isMoving = amb.status === 'en_route_patient' || amb.status === 'transporting';
          if (!isMoving) return null;

          return (
            <Polyline
              key={`route-${amb.id}`}
              positions={amb.routePolyline}
              pathOptions={{
                color: amb.status === 'en_route_patient' ? '#dc2626' : '#2563eb',
                weight: 5,
                opacity: 0.85,
              }}
            />
          );
        })}

        {/* 3. Traffic Lights */}
        {trafficLights.map((tl) => (
          <Marker
            key={`tl-${tl.id}`}
            position={[tl.location.lat, tl.location.lng]}
            icon={createTrafficLightIcon(tl)}
          >
            <Popup>
              <div className="p-1 max-w-xs text-slate-900">
                <div className="font-bold text-xs text-emerald-700 flex items-center gap-1">
                  🚦 {tl.name}
                </div>
                <p className="text-[11px] text-slate-700 mt-1">{tl.intersection}</p>
                <div className="mt-2 text-xs flex items-center justify-between border-t border-slate-200 pt-1">
                  <span>Current Signal:</span>
                  <span className={`font-bold ${tl.currentState === 'GREEN' || tl.isPreempted ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {tl.isPreempted ? 'GREEN (V2X Preempted)' : tl.currentState}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 4. Hospitals */}
        {hospitals.map((hosp) => {
          const isNearest = nearestHosp ? hosp.id === (nearestHosp as Hospital).id : false;

          return (
            <Marker
              key={`hosp-${hosp.id}`}
              position={[hosp.location.lat, hosp.location.lng]}
              icon={createHospitalIcon(hosp, hosp.id === selectedHospitalId, isNearest)}
              eventHandlers={{
                click: () => onSelectHospital(hosp.id),
              }}
            >
              <Popup>
                <div className="p-1 min-w-[210px] text-slate-900">
                  <div className="font-bold text-sm text-sky-700 flex items-center gap-1">
                    🏥 {hosp.name}
                  </div>
                  {isNearest && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase block mt-1">
                      ⭐ Nearest Hospital ({(minDistMeters / 1000).toFixed(1)} km away)
                    </span>
                  )}
                  <p className="text-[11px] text-slate-600 mt-1">📍 {hosp.location.address}</p>
                  <div className="mt-2 space-y-1 text-xs border-t border-slate-200 pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">ER Open Beds:</span>
                      <span className="font-bold text-emerald-700">{hosp.openBeds.er} / {hosp.totalBeds.er}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">ICU Beds:</span>
                      <span className="font-bold text-purple-700">{hosp.openBeds.icu}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Wait Time:</span>
                      <span className="font-bold text-slate-800">{hosp.estimatedErWaitMin} mins</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 5. Emergency Calls */}
        {emergencies.map((emg) => (
          <Marker
            key={`emg-${emg.id}`}
            position={[emg.location.lat, emg.location.lng]}
            icon={createEmergencyIcon(emg, emg.id === selectedEmergencyId)}
            eventHandlers={{
              click: () => onSelectEmergency(emg.id),
            }}
          >
            <Popup>
              <div className="p-1 min-w-[210px] text-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-700">🚨 {emg.ticketNumber}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                    {emg.priority}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800 mt-1">{emg.chiefComplaint}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">📍 {emg.location.address}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 6. Ambulances */}
        {ambulances.map((amb) => (
          <Marker
            key={`amb-${amb.id}`}
            position={[amb.location.lat, amb.location.lng]}
            icon={createAmbulanceIcon(amb, amb.id === selectedAmbulanceId)}
            eventHandlers={{
              click: () => onSelectAmbulance(amb.id),
            }}
          >
            <Popup>
              <div className="p-1 min-w-[200px] text-slate-900">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">🚑 {amb.callsign}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                    {amb.type}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-xs border-t border-slate-200 pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Status:</span>
                    <span className="font-bold text-emerald-700 capitalize">{amb.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Speed:</span>
                    <span className="font-mono font-bold text-amber-700">{amb.speedKmh} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Driver:</span>
                    <span className="text-slate-800">{amb.driverName}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Clean Bottom Legend Bar */}
      <div className="absolute bottom-2 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 shadow-xl flex items-center gap-3 text-[11px] text-slate-200">
        <div className="flex items-center gap-1 font-semibold">
          <span className="text-rose-400">🚑</span> Ambulance
        </div>
        <div className="w-px h-3 bg-slate-700"></div>
        <div className="flex items-center gap-1 font-semibold">
          <span className="text-rose-400">🚨</span> Emergency
        </div>
        <div className="w-px h-3 bg-slate-700"></div>
        <div className="flex items-center gap-1 font-semibold">
          <span className="text-sky-400">🏥</span> Hospital ER
        </div>
        <div className="w-px h-3 bg-slate-700"></div>
        <div className="flex items-center gap-1 font-semibold">
          <span className="text-emerald-400">🚦</span> Green Wave Signal
        </div>
      </div>
    </div>
  );
};
