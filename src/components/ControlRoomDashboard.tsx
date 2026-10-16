import React, { useState } from 'react';
import { 
  Siren, 
  Building2, 
  CheckCircle2, 
  Send, 
  Check,
  Fuel,
  Activity,
  Search,
  Filter,
  MapPin,
  HeartPulse,
  Navigation,
  Compass
} from 'lucide-react';
import type { AppState } from '../services/simulationEngine';
import { recommendOptimalAmbulance, getDistanceMeters } from '../services/simulationEngine';
import { CityMap } from './CityMap';
import type { EmergencyCall } from '../types';

interface ControlRoomDashboardProps {
  state: AppState;
  onSelectAmbulance: (id: string) => void;
  onSelectEmergency: (id: string) => void;
  onSelectHospital: (id: string) => void;
  onDispatchAmbulance: (emergencyId: string, ambulanceId: string, hospitalId: string) => void;
}

export const ControlRoomDashboard: React.FC<ControlRoomDashboardProps> = ({
  state,
  onSelectAmbulance,
  onSelectEmergency,
  onSelectHospital,
  onDispatchAmbulance,
}) => {
  const [dispatchModalEmergency, setDispatchModalEmergency] = useState<EmergencyCall | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('ALL');
  const [filterOnlyAccepting, setFilterOnlyAccepting] = useState<boolean>(false);
  const [filterIcuAvailable, setFilterIcuAvailable] = useState<boolean>(false);

  // Selected Emergency or Ambulance for Nearest Hospital Calculation
  const selectedEmg = state.emergencies.find(e => e.id === state.selectedEmergencyId) || state.emergencies[0];
  const selectedAmb = state.ambulances.find(a => a.id === state.selectedAmbulanceId);

  // Selected emergency for dispatch modal
  const recommendation = dispatchModalEmergency
    ? recommendOptimalAmbulance(dispatchModalEmergency, state.ambulances, state.hospitals)
    : null;

  // Filter & Sort Hospitals by Proximity (Nearest to Selected Emergency/Ambulance)
  const filteredHospitals = state.hospitals.filter((hosp) => {
    const matchesSearch = hosp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          hosp.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          hosp.location.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpec = selectedSpecialization === 'ALL' || hosp.type === selectedSpecialization;
    const matchesAccepting = !filterOnlyAccepting || hosp.diversionStatus === 'accepting';
    const matchesIcu = !filterIcuAvailable || hosp.openBeds.icu > 0;

    return matchesSearch && matchesSpec && matchesAccepting && matchesIcu;
  });

  // Calculate distances & sort hospitals by nearest distance
  const nearestHospitals = filteredHospitals.map((hosp) => {
    let distMeters = 0;
    if (selectedEmg) {
      distMeters = getDistanceMeters(
        selectedEmg.location.lat,
        selectedEmg.location.lng,
        hosp.location.lat,
        hosp.location.lng
      );
    } else if (selectedAmb) {
      distMeters = getDistanceMeters(
        selectedAmb.location.lat,
        selectedAmb.location.lng,
        hosp.location.lat,
        hosp.location.lng
      );
    }
    const distKm = (distMeters / 1000).toFixed(1);
    const estDriveMin = Math.max(1, Math.ceil(distMeters / 500)); // approx 30 km/h urban speed

    return {
      ...hosp,
      distMeters,
      distKm,
      estDriveMin,
    };
  }).sort((a, b) => a.distMeters - b.distMeters);

  // Filtered Emergency Queue based on Search
  const filteredPendingEmergencies = state.emergencies.filter(e => e.status === 'dispatch_pending').filter(emg =>
    searchQuery === '' ||
    emg.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emg.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emg.location.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeEmergencies = state.emergencies.filter(e => e.status !== 'dispatch_pending' && e.status !== 'completed');

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-3">
      {/* Top Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Search Input Box */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search hospital name, address, ambulance unit, or emergency ticket..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Specialization Quick Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[10px] text-slate-400 font-semibold px-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-sky-400" /> Filter ER:
          </span>
          {[
            { id: 'ALL', label: 'All Hospitals' },
            { id: 'Level 1 Trauma', label: 'Trauma L1' },
            { id: 'Comprehensive Cardiac', label: 'Cardiac Institute' },
            { id: 'Stroke Center', label: 'Stroke Center' },
            { id: 'General ER', label: 'General ER' },
          ].map((spec) => (
            <button
              key={spec.id}
              onClick={() => setSelectedSpecialization(spec.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedSpecialization === spec.id
                  ? 'bg-sky-600 text-white shadow'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {spec.label}
            </button>
          ))}
        </div>

        {/* Bed Status Toggles */}
        <div className="flex items-center gap-2 text-[11px]">
          <button
            onClick={() => setFilterOnlyAccepting(!filterOnlyAccepting)}
            className={`px-2.5 py-1 rounded-lg font-bold border transition flex items-center gap-1 ${
              filterOnlyAccepting
                ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Accepting Only
          </button>
          <button
            onClick={() => setFilterIcuAvailable(!filterIcuAvailable)}
            className={`px-2.5 py-1 rounded-lg font-bold border transition flex items-center gap-1 ${
              filterIcuAvailable
                ? 'bg-purple-950 text-purple-300 border-purple-600'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <HeartPulse className="w-3 h-3 text-purple-400" /> ICU Bed Open
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-190px)] min-h-[580px]">
        {/* Left Panel: Emergency Call Queue & Dispatch Engine (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-3 overflow-y-auto pr-1">
          {/* Pending Emergency Call List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h2 className="text-xs font-extrabold uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
                <Siren className="w-4 h-4 text-rose-500 animate-pulse" /> Pending Emergency Queue ({filteredPendingEmergencies.length})
              </h2>
            </div>

            {filteredPendingEmergencies.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mb-1" />
                {searchQuery ? 'No matching emergency calls found.' : 'All calls dispatched! Monitoring active fleet.'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPendingEmergencies.map((emg) => {
                  const isSelected = emg.id === state.selectedEmergencyId;
                  const rec = recommendOptimalAmbulance(emg, state.ambulances, state.hospitals);

                  return (
                    <div
                      key={emg.id}
                      onClick={() => onSelectEmergency(emg.id)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/40'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-slate-200 mb-1">
                        <span className="text-rose-400">🚨 {emg.ticketNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          emg.priority === 'P1_CRITICAL' ? 'bg-rose-900 text-rose-200 border border-rose-600' : 'bg-amber-900 text-amber-200'
                        }`}>
                          {emg.priority}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-100">{emg.chiefComplaint}</p>
                      <p className="text-[11px] text-slate-400 mt-1">📍 {emg.location.address}</p>

                      {/* Recommendation Snippet */}
                      {rec.recommendedAmbulance && (
                        <div className="mt-2 bg-slate-900/90 border border-emerald-800/60 p-1.5 rounded text-[10px] text-emerald-300 flex items-center justify-between">
                          <span>Best Match: <strong>{rec.recommendedAmbulance.callsign}</strong></span>
                          <span>ETA ~{Math.ceil(rec.estimatedEtaSec / 60)}m</span>
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDispatchModalEmergency(emg);
                        }}
                        className="mt-2.5 w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold py-1.5 px-3 rounded flex items-center justify-center gap-1 shadow-md transition"
                      >
                        <Send className="w-3 h-3" /> Dispatch Optimal Unit
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active En-Route & In-Transit Calls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xl flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h2 className="text-xs font-extrabold uppercase text-sky-400 tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-sky-400" /> Active Operations ({activeEmergencies.length})
              </h2>
            </div>

            <div className="space-y-2">
              {activeEmergencies.map((emg) => {
                const amb = state.ambulances.find(a => a.id === emg.dispatchedAmbulanceId);
                const hosp = state.hospitals.find(h => h.id === emg.assignedHospitalId);
                const elapsedSec = Math.floor((Date.now() - emg.reportedAt) / 1000);
                const remainingSlaSec = emg.slaDeadlineSec - elapsedSec;
                const isBreached = remainingSlaSec <= 0;

                return (
                  <div
                    key={emg.id}
                    onClick={() => onSelectEmergency(emg.id)}
                    className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs hover:border-slate-700 cursor-pointer"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-200">🚨 {emg.ticketNumber}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${
                        emg.status === 'in_transit' ? 'bg-sky-950 text-sky-300 border border-sky-700' : 'bg-emerald-950 text-emerald-300'
                      }`}>
                        {emg.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 truncate">{emg.chiefComplaint}</p>
                    
                    {/* Assigned Unit & Target Hospital */}
                    <div className="mt-2 text-[10px] space-y-1 text-slate-400 bg-slate-900 p-1.5 rounded">
                      <div className="flex justify-between">
                        <span>Assigned Unit:</span>
                        <span className="text-sky-300 font-bold">{amb?.callsign || 'Unassigned'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Target Hospital:</span>
                        <span className="text-emerald-300 font-bold truncate max-w-[120px]">{hosp?.name.split(' ')[0] || 'TBD'}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-800 pt-1">
                        <span>SLA Timer (8m limit):</span>
                        <span className={`font-mono font-bold ${isBreached ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {isBreached ? `BREACH (+${Math.abs(remainingSlaSec)}s)` : `${Math.floor(remainingSlaSec / 60)}m ${remainingSlaSec % 60}s left`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Panel: Interactive Live City Map (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-3 min-h-[450px]">
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-1 shadow-2xl relative min-h-[400px]">
            <CityMap
              selectedCityId={state.selectedCityId}
              ambulances={state.ambulances}
              emergencies={state.emergencies}
              hospitals={state.hospitals}
              trafficLights={state.trafficLights}
              selectedAmbulanceId={state.selectedAmbulanceId}
              selectedEmergencyId={state.selectedEmergencyId}
              selectedHospitalId={state.selectedHospitalId}
              onSelectAmbulance={onSelectAmbulance}
              onSelectEmergency={onSelectEmergency}
              onSelectHospital={onSelectHospital}
            />
          </div>

          {/* Fleet Status Bar below map */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {state.ambulances.map((amb) => {
              const isSelected = amb.id === state.selectedAmbulanceId;
              return (
                <div
                  key={amb.id}
                  onClick={() => onSelectAmbulance(amb.id)}
                  className={`p-2 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? 'bg-sky-950/60 border-sky-500'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-200">🚑 {amb.callsign}</span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                      <Fuel className="w-2.5 h-2.5" /> {amb.batteryLevel}%
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 capitalize flex justify-between">
                    <span>{amb.status.replace(/_/g, ' ')}</span>
                    <span className="text-amber-300 font-mono">{amb.speedKmh} km/h</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Nearest Hospitals List (Sorted by Proximity) (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-3 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xl flex-1">
            {/* Header with Proximity Indicator */}
            <div className="flex flex-col mb-3 border-b border-slate-800 pb-2 gap-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-400" /> Nearest ER Hospitals ({nearestHospitals.length})
                </h2>
                <span className="text-[9px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-700/60">
                  SORTED BY PROXIMITY
                </span>
              </div>

              {selectedEmg && (
                <div className="text-[10px] text-slate-400 bg-slate-950 p-1.5 rounded border border-slate-800 flex items-center justify-between">
                  <span>Target Emergency: <strong className="text-rose-400">🚨 {selectedEmg.ticketNumber}</strong></span>
                  <span className="text-emerald-400 font-semibold">Nearest Top</span>
                </div>
              )}
            </div>

            {nearestHospitals.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No hospitals match the search filters. Try clearing your search or filters.
              </div>
            ) : (
              <div className="space-y-2.5">
                {nearestHospitals.map((hosp, index) => {
                  const isSelected = hosp.id === state.selectedHospitalId;
                  const isNearest = index === 0;
                  const erPct = Math.round((hosp.openBeds.er / hosp.totalBeds.er) * 100);

                  return (
                    <div
                      key={hosp.id}
                      onClick={() => onSelectHospital(hosp.id)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition relative ${
                        isNearest
                          ? 'bg-gradient-to-r from-emerald-950/70 to-slate-950 border-emerald-500/90 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                          : isSelected
                          ? 'bg-sky-950/70 border-sky-500 shadow-md shadow-sky-950/50'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Nearest Recommended ER Badge */}
                      {isNearest && (
                        <div className="absolute -top-2 right-3 bg-emerald-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full shadow flex items-center gap-1 uppercase tracking-wider">
                          ⭐ Nearest Recommended ER
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-1 pt-1">
                        <div>
                          <div className="font-bold text-slate-100 flex items-center gap-1">
                            🏥 {hosp.name}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{hosp.type}</p>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                          hosp.diversionStatus === 'accepting' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                          hosp.diversionStatus === 'busy_warning' ? 'bg-amber-950 text-amber-300' : 'bg-rose-950 text-rose-300'
                        }`}>
                          {hosp.diversionStatus.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Distance & Est Drive Time Badge */}
                      <div className="mt-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded flex items-center justify-between text-[11px]">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-emerald-400" /> {hosp.distKm} km distance
                        </span>
                        <span className="text-amber-300 font-mono font-bold flex items-center gap-1">
                          <Compass className="w-3 h-3 text-amber-400" /> ~{hosp.estDriveMin} min drive
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-sky-400 shrink-0" /> {hosp.location.address}
                      </p>

                      {/* Bed Stats Bar */}
                      <div className="mt-2 space-y-1.5">
                        <div>
                          <div className="flex justify-between text-[10px] mb-0.5">
                            <span className="text-slate-400">ER Open Beds:</span>
                            <span className="font-bold text-emerald-400">{hosp.openBeds.er} / {hosp.totalBeds.er}</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all"
                              style={{ width: `${erPct}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[10px] bg-slate-900 p-1.5 rounded text-slate-300">
                          <div>ICU Beds: <strong className="text-purple-400">{hosp.openBeds.icu}</strong></div>
                          <div>Trauma Bays: <strong className="text-amber-400">{hosp.openBeds.trauma}</strong></div>
                          <div>Wait Time: <strong className="text-sky-300">{hosp.estimatedErWaitMin}m</strong></div>
                          <div>Incoming: <strong className="text-rose-400">🚑 {hosp.incomingAmbulancesCount}</strong></div>
                        </div>

                        <div className="mt-2 flex justify-between items-center pt-1 border-t border-slate-900">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedEmg) {
                                setDispatchModalEmergency(selectedEmg);
                              }
                            }}
                            className="text-[10px] bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-bold px-2 py-1 rounded border border-emerald-700/60"
                          >
                            Route Here →
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectHospital(hosp.id);
                            }}
                            className="text-[10px] text-sky-400 hover:text-sky-200 font-bold flex items-center gap-1"
                          >
                            <MapPin className="w-3 h-3" /> Focus Map →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dispatch Execution Modal */}
      {dispatchModalEmergency && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Siren className="w-6 h-6 text-rose-500 animate-pulse" />
                <h3 className="font-extrabold text-base text-slate-100">
                  Smart Dispatch Matrix & Route Optimizer
                </h3>
              </div>
              <button
                onClick={() => setDispatchModalEmergency(null)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Emergency Details */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between font-bold text-rose-400">
                <span>Ticket: {dispatchModalEmergency.ticketNumber}</span>
                <span>Priority: {dispatchModalEmergency.priority}</span>
              </div>
              <p className="font-semibold text-slate-200">{dispatchModalEmergency.chiefComplaint}</p>
              <p className="text-slate-400">📍 Location: {dispatchModalEmergency.location.address}</p>
            </div>

            {/* Recommendation Analysis */}
            {recommendation && (
              <div className="bg-emerald-950/40 border border-emerald-700/60 p-3.5 rounded-xl text-xs space-y-2">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" /> Automated System Recommendation:
                </div>
                <p className="text-slate-300 text-[11px]">{recommendation.reason}</p>

                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-emerald-800/60">
                  <div className="bg-slate-900 p-2 rounded border border-emerald-900">
                    <span className="text-[10px] text-slate-400 block">Recommended Unit</span>
                    <span className="font-bold text-sky-400 text-xs">
                      🚑 {recommendation.recommendedAmbulance?.callsign} ({recommendation.recommendedAmbulance?.type})
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-emerald-900">
                    <span className="text-[10px] text-slate-400 block">Target Hospital</span>
                    <span className="font-bold text-emerald-400 text-xs truncate block">
                      🏥 {recommendation.recommendedHospital?.name}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDispatchModalEmergency(null)}
                className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (recommendation?.recommendedAmbulance && recommendation?.recommendedHospital) {
                    onDispatchAmbulance(
                      dispatchModalEmergency.id,
                      recommendation.recommendedAmbulance.id,
                      recommendation.recommendedHospital.id
                    );
                    setDispatchModalEmergency(null);
                  }
                }}
                className="w-1/2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50"
              >
                <Send className="w-4 h-4" /> Confirm & Activate Route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
