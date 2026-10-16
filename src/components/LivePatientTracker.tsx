import React, { useEffect, useRef } from 'react';
import { 
  HeartPulse, 
  Activity, 
  Thermometer, 
  Wind, 
  CheckCircle2, 
  Radio, 
  Send, 
  Hospital,
  Stethoscope,
  Clock
} from 'lucide-react';
import type { AppState } from '../services/simulationEngine';
import { generateEcgWaveform } from '../services/simulationEngine';

interface LivePatientTrackerProps {
  state: AppState;
  onUpdateVitalsCondition: (condition: string, triageLevel: any) => void;
  onConfirmHospitalNotification: () => void;
}

export const LivePatientTracker: React.FC<LivePatientTrackerProps> = ({
  state,
  onUpdateVitalsCondition,
  onConfirmHospitalNotification,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const vitals = state.patientVitals;
  const activeAmbulance = state.ambulances.find(a => a.status === 'transporting' || a.status === 'en_route_patient') || state.ambulances[0];
  const targetHospital = state.hospitals.find(h => h.id === activeAmbulance.targetHospitalId) || state.hospitals[0];

  // Animated 60fps Canvas ECG Waveform Sweep Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let offset = 0;
    const points = generateEcgWaveform(300, vitals.heartRate, vitals.ecgCondition);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.fillStyle = '#050b14';
      ctx.fillRect(0, 0, width, height);

      // Draw Grid lines
      ctx.strokeStyle = '#0f2942';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw ECG Line
      ctx.strokeStyle = vitals.ecgCondition.includes('STEMI') ? '#ef4444' : '#10b981';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = vitals.ecgCondition.includes('STEMI') ? '#ef4444' : '#10b981';
      ctx.shadowBlur = 8;

      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const pointIdx = Math.floor((x + offset) % points.length);
        const y = centerY - points[pointIdx] * (height * 0.35);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Sweep Cursor line
      const cursorX = offset % width;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cursorX, 0, 3, height);

      offset += 3;
      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [vitals.heartRate, vitals.ecgCondition]);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      {/* Top Telemetry Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/80 border border-rose-800/60 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border-2 border-rose-500/80 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/50">
            <HeartPulse className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-xl text-white">ONBOARD TELEMETRY & ER HOSPITAL AUTO-NOTIFIER</h2>
              <span className="bg-rose-950 text-rose-300 font-bold text-xs px-2.5 py-0.5 rounded-full border border-rose-600 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-rose-400 animate-ping" /> Live Transmitting
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Onboard Unit: <strong className="text-sky-300 font-mono">{activeAmbulance.callsign}</strong> • Patient: <strong>Male, 58 yrs</strong> (STEMI Suspect)
            </p>
          </div>
        </div>

        {/* Condition Switcher Presets */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 px-2 font-semibold">Simulate Condition:</span>
          <button
            onClick={() => onUpdateVitalsCondition('Normal Sinus Rhythm', 'CODE_GREEN')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              vitals.ecgCondition === 'Normal Sinus Rhythm' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Normal Sinus
          </button>
          <button
            onClick={() => onUpdateVitalsCondition('ST-Elevation (STEMI)', 'CODE_RED_STEMI')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              vitals.ecgCondition === 'ST-Elevation (STEMI)' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Code Red (STEMI)
          </button>
          <button
            onClick={() => onUpdateVitalsCondition('Ventricular Tachycardia', 'CODE_RED_TRAUMA')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              vitals.ecgCondition === 'Ventricular Tachycardia' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            V-Tach Alert
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Live 60fps ECG Waveform & Vitals Gauges (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* ECG Waveform Monitor */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
                <h3 className="font-extrabold text-sm text-slate-100">Live 12-Lead ECG Sweep Waveform</h3>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                vitals.ecgCondition.includes('STEMI') ? 'bg-rose-950 text-rose-300 border border-rose-600' : 'bg-emerald-950 text-emerald-300'
              }`}>
                {vitals.ecgCondition}
              </span>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-inner">
              <canvas
                ref={canvasRef}
                width={640}
                height={180}
                className="w-full h-44 bg-slate-950 block"
              />
              <div className="absolute top-2 right-3 font-mono text-[11px] text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                SWEEP SPEED: 25mm/s
              </div>
            </div>
          </div>

          {/* Vitals Gauges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Heart Rate */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/60 flex items-center justify-center text-rose-400">
                <HeartPulse className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">HEART RATE</div>
                <div className="font-mono font-extrabold text-xl text-rose-400">{vitals.heartRate} <span className="text-xs">BPM</span></div>
              </div>
            </div>

            {/* Blood Pressure */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/60 flex items-center justify-center text-sky-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">BLOOD PRESSURE</div>
                <div className="font-mono font-extrabold text-xl text-sky-300">{vitals.bpSystolic}/{vitals.bpDiastolic} <span className="text-xs">mmHg</span></div>
              </div>
            </div>

            {/* SpO2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">OXYGEN (SpO2)</div>
                <div className="font-mono font-extrabold text-xl text-emerald-400">{vitals.spo2}% <span className="text-xs">O2</span></div>
              </div>
            </div>

            {/* Respiratory Rate */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/60 flex items-center justify-center text-purple-400">
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">RESP. RATE</div>
                <div className="font-mono font-extrabold text-xl text-purple-300">{vitals.respRate} <span className="text-xs">/min</span></div>
              </div>
            </div>

            {/* Body Temp */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/60 flex items-center justify-center text-amber-400">
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">BODY TEMP</div>
                <div className="font-mono font-extrabold text-xl text-amber-300">{vitals.temperatureC}°C</div>
              </div>
            </div>

            {/* GCS Coma Scale */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/60 flex items-center justify-center text-indigo-400">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">GCS SCORE</div>
                <div className="font-mono font-extrabold text-xl text-indigo-300">{vitals.gcsScore} <span className="text-xs">/ 15</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hospital ER Auto-Preemption Terminal (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-emerald-400 flex items-center gap-2">
                  <Hospital className="w-5 h-5 text-emerald-400" /> Target Hospital ER Telemetry Receiver
                </h3>
                <p className="text-xs text-slate-400">Receiving station: <strong>{targetHospital.name}</strong></p>
              </div>
              <span className="text-xs bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-600 font-bold">
                CONNECTED
              </span>
            </div>

            {/* Auto-Prepared ER Checklist */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Hospital Pre-Arrival Ticket</span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" /> ETA ~4 mins
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2 rounded bg-slate-900 border border-emerald-800/60 flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cardiac Catheterization Lab (Cath Lab #2) Prepped</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-emerald-800/60 flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>2 Units O-Negative Blood Packets Reserved</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-emerald-800/60 flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Attending Cardiologist Dr. Aris Thorne On-Site at ER Bay 3</span>
                </div>
              </div>

              <button
                onClick={onConfirmHospitalNotification}
                className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition"
              >
                <Send className="w-4 h-4" /> Re-Transmit Updated Vitals Stream
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
