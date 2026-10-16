import React from 'react';
import { 
  Activity, 
  Navigation, 
  HeartPulse, 
  ShieldCheck, 
  Sliders, 
  Clock, 
  Zap, 
  Building2, 
  Siren, 
  MapPin 
} from 'lucide-react';
import type { AppState } from '../services/simulationEngine';
import { CITY_PRESETS } from '../data/cityPresets';

interface HeaderProps {
  state: AppState;
  onTabChange: (tab: AppState['activeTab']) => void;
  onSpeedChange: (speed: number) => void;
  onCityChange: (cityId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ state, onTabChange, onSpeedChange, onCityChange }) => {
  const activeAmbulances = state.ambulances.filter(a => a.status !== 'idle' && a.status !== 'out_of_service').length;
  const pendingEmergencies = state.emergencies.filter(e => e.status === 'dispatch_pending').length;
  const preemptedLights = state.trafficLights.filter(t => t.isPreempted).length;
  const totalOpenBeds = state.hospitals.reduce((acc, h) => acc + h.openBeds.er, 0);

  const cityOptions = [
    { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra' },
    { id: 'pune', name: 'Pune', state: 'Maharashtra' },
    { id: 'nagpur', name: 'Nagpur', state: 'Maharashtra' },
    { id: 'delhi', name: 'Delhi NCR', state: 'Delhi' },
    { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 text-slate-100 shadow-xl">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/50">
            <HeartPulse className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-amber-200 via-orange-300 to-rose-400 bg-clip-text text-transparent">
                PULSEROUTE 911 / 108
              </h1>
              <span className="bg-emerald-950 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-700/60 uppercase">
                LIVE EMS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Emergency Routing & V2X Signal Preemption System</p>
          </div>
        </div>

        {/* Clean, Non-Overlapping City Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-bold px-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-amber-400" /> City:
          </span>
          {cityOptions.map((city) => {
            const isSelected = city.id === state.selectedCityId;
            return (
              <button
                key={city.id}
                onClick={() => onCityChange(city.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-md shadow-orange-950/40 font-extrabold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{city.name}</span>
                <span className={`text-[10px] ${isSelected ? 'text-amber-950 font-bold' : 'text-slate-500'}`}>
                  ({city.state.substring(0, 2)})
                </span>
              </button>
            );
          })}
        </div>

        {/* Metric Gauges */}
        <div className="hidden xl:flex items-center gap-4 bg-slate-950/70 px-4 py-1.5 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <Siren className="w-4 h-4 text-rose-400" />
            <div>
              <div className="text-[10px] text-slate-400">Deployed</div>
              <div className="font-bold text-slate-200">{activeAmbulances} / {state.ambulances.length} Active</div>
            </div>
          </div>
          <div className="w-px h-6 bg-slate-800"></div>

          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400">Calls</div>
              <div className="font-bold text-amber-300">{pendingEmergencies} Priority</div>
            </div>
          </div>
          <div className="w-px h-6 bg-slate-800"></div>

          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400">Opticom V2X</div>
              <div className="font-bold text-emerald-400">{preemptedLights} Green</div>
            </div>
          </div>
          <div className="w-px h-6 bg-slate-800"></div>

          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-[10px] text-slate-400">ER Beds</div>
              <div className="font-bold text-sky-300">{totalOpenBeds} Open</div>
            </div>
          </div>
        </div>

        {/* Simulation Speed Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 px-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Speed:
            </span>
            {[1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => onSpeedChange(speed)}
                className={`px-2 py-0.5 rounded font-bold text-xs transition ${
                  state.simSpeedMultiplier === speed
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 flex items-center border-t border-slate-800/80 overflow-x-auto no-scrollbar">
        {[
          { id: 'dashboard', label: '1. Control Room Dispatch', icon: Activity },
          { id: 'navigator', label: '2. Smart Traffic Navigator (V2X)', icon: Navigation },
          { id: 'vitals', label: '3. Live Patient Telemetry', icon: HeartPulse },
          { id: 'compliance', label: '4. City Rules & Contract SLA', icon: ShieldCheck },
          { id: 'simulation', label: '5. Scenario Studio', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = state.activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as AppState['activeTab'])}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition ${
                isActive
                  ? 'border-rose-500 text-rose-400 bg-rose-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
