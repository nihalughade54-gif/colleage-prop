import React, { useState } from 'react';
import { 
  Sliders, 
  Siren, 
  AlertTriangle, 
  HeartPulse, 
  Zap, 
  Plus, 
  Building,
  Terminal
} from 'lucide-react';
import type { AppState } from '../services/simulationEngine';

interface SimulationControlsProps {
  state: AppState;
  onTriggerScenario: (scenarioId: string) => void;
  onAddCustomCall: (chiefComplaint: string, priority: any) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  state,
  onTriggerScenario,
  onAddCustomCall,
}) => {
  const [customComplaint, setCustomComplaint] = useState('');
  const [customPriority, setCustomPriority] = useState<'P1_CRITICAL' | 'P2_URGENT' | 'P3_STANDARD'>('P1_CRITICAL');

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/80 border border-sky-800/60 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border-2 border-sky-500/80 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-950/50">
            <Sliders className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h2 className="font-extrabold text-xl text-white">SIMULATION STUDIO & SYSTEM SCENARIOS</h2>
            <p className="text-xs text-slate-300 mt-1">
              Trigger real-time emergency events to evaluate V2X traffic preemption, vitals telemetry, and contract SLA tracking.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Scenario Presets (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-extrabold text-sm text-sky-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-400" /> Pre-Configured Test Scenarios
            </h3>

            <div className="space-y-3">
              {/* Scenario 1 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-600/80 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-sm text-rose-400 flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4" /> Scenario 1: Code Red STEMI Cardiac Emergency
                  </div>
                  <p className="text-xs text-slate-300">
                    Spawns critical P1 call, triggers automated dispatch of closest ALS unit, activates V2X green wave preemption, and transmits telemetry to Cardiac Institute.
                  </p>
                </div>
                <button
                  onClick={() => onTriggerScenario('stemi_cardiac')}
                  className="shrink-0 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-lg shadow-rose-950/50"
                >
                  Run Scenario 1
                </button>
              </div>

              {/* Scenario 2 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-600/80 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Scenario 2: Peak Hour Traffic Gridlock Bypass
                  </div>
                  <p className="text-xs text-slate-300">
                    Simulates major congestion on Market Street. Watch Smart Traffic Navigator dynamically recalculate route via 5th Ave saving 4.2 mins.
                  </p>
                </div>
                <button
                  onClick={() => onTriggerScenario('traffic_gridlock')}
                  className="shrink-0 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-lg shadow-amber-950/50"
                >
                  Run Scenario 2
                </button>
              </div>

              {/* Scenario 3 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-600/80 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-sm text-purple-400 flex items-center gap-1.5">
                    <Building className="w-4 h-4" /> Scenario 3: Hospital ER Bed Diversion Crunch
                  </div>
                  <p className="text-xs text-slate-300">
                    Simulates nearest General ER entering diversion. Auto-dispatcher reroutes ambulance to Level 1 Trauma Center with open beds.
                  </p>
                </div>
                <button
                  onClick={() => onTriggerScenario('hospital_diversion')}
                  className="shrink-0 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-lg shadow-purple-950/50"
                >
                  Run Scenario 3
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Custom Call Generator & Simulation Console (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Custom Call Generator */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-extrabold text-sm text-emerald-400 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" /> Create Custom 911 Emergency Ticket
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Chief Complaint:</label>
                <input
                  type="text"
                  placeholder="e.g. Severe Respiratory Distress, Anaphylaxis..."
                  value={customComplaint}
                  onChange={(e) => setCustomComplaint(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Priority Level:</label>
                <select
                  value={customPriority}
                  onChange={(e) => setCustomPriority(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="P1_CRITICAL">Priority 1 (Critical - 8m SLA)</option>
                  <option value="P2_URGENT">Priority 2 (Urgent - 15m SLA)</option>
                  <option value="P3_STANDARD">Priority 3 (Standard - 30m SLA)</option>
                </select>
              </div>

              <button
                onClick={() => {
                  if (customComplaint.trim()) {
                    onAddCustomCall(customComplaint, customPriority);
                    setCustomComplaint('');
                  }
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
              >
                <Siren className="w-4 h-4" /> Inject 911 Call into System
              </button>
            </div>
          </div>

          {/* Simulation System Event Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-400" /> Real-Time System Event Log
            </h3>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 h-44 overflow-y-auto space-y-2 font-mono text-[11px]">
              {state.simulationLog.length === 0 ? (
                <div className="text-slate-500 text-center py-8">Simulation log ready...</div>
              ) : (
                state.simulationLog.map((log, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 ${
                      log.type === 'alert' ? 'text-rose-400' :
                      log.type === 'warning' ? 'text-amber-400' :
                      log.type === 'success' ? 'text-emerald-400' : 'text-sky-300'
                    }`}
                  >
                    <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                    <span>{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
