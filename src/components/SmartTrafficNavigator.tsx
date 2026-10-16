import React from 'react';
import { 
  Navigation, 
  Zap, 
  Clock, 
  AlertTriangle, 
  Compass, 
  Gauge, 
  TrendingDown
} from 'lucide-react';
import type { AppState } from '../services/simulationEngine';

interface SmartTrafficNavigatorProps {
  state: AppState;
  onTogglePreemption: (trafficLightId: string) => void;
}

export const SmartTrafficNavigator: React.FC<SmartTrafficNavigatorProps> = ({ state, onTogglePreemption }) => {
  // Find active moving ambulance (e.g., amb-101 or amb-102)
  const activeAmbulance = state.ambulances.find(a => a.status === 'en_route_patient' || a.status === 'transporting') || state.ambulances[0];

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      {/* Driver HUD Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/80 border border-emerald-800/60 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/80 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50">
            <Navigation className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl text-white">DRIVER IN-CAB NAVIGATOR</span>
              <span className="bg-emerald-950 text-emerald-300 font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-600 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" /> Opticom V2X Active
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Active Vehicle: <strong className="text-sky-300 font-mono">{activeAmbulance.callsign}</strong> ({activeAmbulance.driverName})
            </p>
          </div>
        </div>

        {/* Speed & Heading Gauge */}
        <div className="flex items-center gap-6 bg-slate-950/80 px-5 py-2.5 rounded-xl border border-slate-800">
          <div className="text-center">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Gauge className="w-3 h-3 text-amber-400" /> SPEED
            </div>
            <div className="font-mono font-extrabold text-2xl text-amber-400">{activeAmbulance.speedKmh} <span className="text-xs">km/h</span></div>
          </div>
          <div className="w-px h-8 bg-slate-800"></div>
          <div className="text-center">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Compass className="w-3 h-3 text-sky-400" /> HEADING
            </div>
            <div className="font-mono font-bold text-lg text-sky-300">{activeAmbulance.heading}° NE</div>
          </div>
          <div className="w-px h-8 bg-slate-800"></div>
          <div className="text-center">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400" /> EST. ETA
            </div>
            <div className="font-mono font-extrabold text-xl text-emerald-400">4.5 <span className="text-xs">mins</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Green Wave Signal Corridor (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-emerald-400 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-400" /> Smart Traffic Light Preemption Corridor
                </h3>
                <p className="text-xs text-slate-400">V2X Radio Transceiver automatically turns signals green within 400 meters</p>
              </div>
              <span className="text-xs bg-emerald-950 text-emerald-300 px-3 py-1 rounded-full border border-emerald-700/60 font-bold">
                5 Signals Preempted
              </span>
            </div>

            {/* Signal Corridor Flow Visualization */}
            <div className="space-y-3">
              {state.trafficLights.map((tl, index) => {
                const distanceMeters = tl.distanceToNearestAmbulanceMeters || Math.round(150 + index * 220);
                const isWithinRange = distanceMeters <= tl.preemptionRadiusMeters;

                return (
                  <div
                    key={tl.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      tl.isPreempted
                        ? 'bg-gradient-to-r from-emerald-950/60 to-slate-900 border-emerald-500/80 shadow-lg shadow-emerald-950/30'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Light Status Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow ${
                          tl.isPreempted || tl.currentState === 'GREEN'
                            ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/40 animate-pulse'
                            : 'bg-rose-500 text-white shadow-rose-500/40'
                        }`}>
                          🚦
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                            {tl.name}
                            {tl.isPreempted && (
                              <span className="bg-emerald-900/80 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                Preempted Green
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{tl.intersection}</p>
                        </div>
                      </div>

                      {/* Distance & Action */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">Distance</div>
                          <div className={`font-mono font-bold text-sm ${isWithinRange ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {distanceMeters}m
                          </div>
                        </div>

                        <button
                          onClick={() => onTogglePreemption(tl.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            tl.isPreempted
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" /> {tl.isPreempted ? 'GREEN (Preempted)' : 'Force Preempt'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Traffic Avoidance & Turn-By-Turn (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Traffic Congestion Bypass Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-extrabold text-sm text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> AI Traffic Congestion Bypass
              </h3>
              <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-700">
                SAVED 4.2 MINS
              </span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Standard Route (Market St Gridlock):</span>
                <span className="font-mono text-rose-400 font-bold line-through">8.7 mins</span>
              </div>
              <div className="flex justify-between items-center text-emerald-400 font-bold">
                <span className="flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" /> PulseRoute Smart Bypass (5th Ave):
                </span>
                <span className="font-mono text-base text-emerald-400">4.5 mins</span>
              </div>
              <p className="text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                ⚡ Automatically diverted away from 4-car pileup at 6th St Intersection using live city camera feeds.
              </p>
            </div>
          </div>

          {/* Turn-by-Turn Guidance */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="font-extrabold text-sm text-sky-400 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-sky-400" /> Turn-by-Turn Tactical Routing
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-600/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center font-bold text-base">
                  ⬆
                </div>
                <div>
                  <div className="font-bold text-sky-200">Head East on Market Street</div>
                  <div className="text-[11px] text-sky-400">300 meters • Signal #102 GREEN Preempted</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 text-slate-300">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-base">
                  ↗
                </div>
                <div>
                  <div className="font-semibold text-slate-200">Slight Right onto Medical Center Way</div>
                  <div className="text-[11px] text-slate-400">1.2 kilometers • Approaching Hospital ER Bay 2</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
