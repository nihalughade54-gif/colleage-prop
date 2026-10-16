import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  TrendingUp, 
  FileText, 
  Calculator
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';
import type { AppState } from '../services/simulationEngine';

interface CityRulesComplianceProps {
  state: AppState;
}

export const CityRulesCompliance: React.FC<CityRulesComplianceProps> = ({ state }) => {
  const rules = state.cityRules;
  const [calcResponseMin, setCalcResponseMin] = useState(10);
  const [calcPriority, setCalcPriority] = useState<'P1_CRITICAL' | 'P2_URGENT' | 'P3_STANDARD'>('P1_CRITICAL');

  // Chart data: Monthly Response Time SLA Trends
  const slaTrendData = [
    { month: 'May', compliancePct: 94.2, penalties: 580000 },
    { month: 'Jun', compliancePct: 95.8, penalties: 410000 },
    { month: 'Jul', compliancePct: 96.1, penalties: 395000 },
    { month: 'Aug', compliancePct: 95.4, penalties: 480000 },
    { month: 'Sep (MTD)', compliancePct: rules.monthToDate.performancePct, penalties: rules.monthToDate.totalPenalties },
  ];

  // Distribution chart data
  const responseDistData = [
    { timeRange: '< 4 mins', calls: 980 },
    { timeRange: '4 - 6 mins', calls: 820 },
    { timeRange: '6 - 8 mins (SLA)', calls: 598 },
    { timeRange: '8 - 10 mins (Breach)', calls: 64 },
    { timeRange: '> 10 mins (Severe)', calls: 20 },
  ];

  // Dynamic Calculator Result
  const limitMin = calcPriority === 'P1_CRITICAL' ? 8 : calcPriority === 'P2_URGENT' ? 15 : 30;
  const isBreached = calcResponseMin > limitMin;
  const breachMinutes = Math.max(0, calcResponseMin - limitMin);
  const penaltyPerMin = calcPriority === 'P1_CRITICAL' ? rules.penalties.p1BreachPerMin : calcPriority === 'P2_URGENT' ? rules.penalties.p2BreachPerMin : rules.penalties.p3BreachPerMin;
  const calculatedPenalty = breachMinutes * penaltyPerMin;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      {/* Top Contract Summary Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/80 border border-purple-800/60 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border-2 border-purple-500/80 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-950/50">
            <ShieldCheck className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h2 className="font-extrabold text-xl text-white">{rules.contractName}</h2>
            <p className="text-xs text-slate-300 mt-1">
              District: <strong>{rules.cityName}</strong> • Target SLA Compliance: <strong className="text-emerald-400">{rules.complianceTargetPct}%</strong>
            </p>
          </div>
        </div>

        {/* High Level KPI Badges */}
        <div className="flex items-center gap-4 bg-slate-950/80 px-5 py-2.5 rounded-xl border border-slate-800 text-xs">
          <div>
            <div className="text-[10px] text-slate-400">Total 108 Calls MTD</div>
            <div className="font-extrabold text-lg text-slate-100">{rules.monthToDate.totalCalls}</div>
          </div>
          <div className="w-px h-8 bg-slate-800"></div>
          <div>
            <div className="text-[10px] text-slate-400">Compliance %</div>
            <div className="font-extrabold text-lg text-emerald-400">{rules.monthToDate.performancePct}%</div>
          </div>
          <div className="w-px h-8 bg-slate-800"></div>
          <div>
            <div className="text-[10px] text-slate-400">Penalties Incurred</div>
            <div className="font-extrabold text-lg text-rose-400">₹{rules.monthToDate.totalPenalties.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Recharts Trends & Distribution (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Monthly SLA Trend Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="font-extrabold text-sm text-purple-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" /> Monthly SLA Compliance % vs Financial Penalty Trend (INR ₹)
            </h3>

            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={slaTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[90, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  />
                  <Line type="monotone" dataKey="compliancePct" stroke="#c084fc" strokeWidth={3} name="Compliance %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Response Time Distribution Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="font-extrabold text-sm text-sky-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" /> Response Time Bracket Distribution (Priority 1 - Maharashtra District)
            </h3>

            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={responseDistData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="timeRange" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  />
                  <Bar dataKey="calls" fill="#38bdf8" radius={[6, 6, 0, 0]} name="Total Calls" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Contract Penalty Calculator & Rules (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Interactive Calculator */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-extrabold text-sm text-emerald-400 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" /> Liquidated Damages Penalty Calculator (MEMS Contract)
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Emergency Priority Level:</label>
                <select
                  value={calcPriority}
                  onChange={(e) => setCalcPriority(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="P1_CRITICAL">Priority 1 (Critical - 8 min SLA)</option>
                  <option value="P2_URGENT">Priority 2 (Urgent - 15 min SLA)</option>
                  <option value="P3_STANDARD">Priority 3 (Standard - 30 min SLA)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 font-semibold mb-1">
                  <span>Simulated Response Time:</span>
                  <span className="font-mono text-amber-300 font-bold">{calcResponseMin} mins</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={calcResponseMin}
                  onChange={(e) => setCalcResponseMin(Number(e.target.value))}
                  className="w-full accent-purple-500 bg-slate-950 cursor-pointer"
                />
              </div>

              {/* Result Box */}
              <div className={`p-4 rounded-xl border ${
                isBreached ? 'bg-rose-950/40 border-rose-600/80 text-rose-300' : 'bg-emerald-950/40 border-emerald-600/80 text-emerald-300'
              }`}>
                <div className="flex items-center justify-between font-bold text-sm">
                  <span>{isBreached ? '🚨 SLA BREACH DETECTED' : '✅ CONTRACT COMPLIANT'}</span>
                  <span className="font-mono text-base">
                    {isBreached ? `-₹${calculatedPenalty.toLocaleString('en-IN')}` : '₹0 Penalty'}
                  </span>
                </div>
                <p className="text-[11px] mt-1 text-slate-300">
                  {isBreached
                    ? `Response exceeded contract limit of ${limitMin} mins by ${breachMinutes} mins. Penalty rate: ₹${penaltyPerMin.toLocaleString('en-IN')}/min.`
                    : `Arrival within ${limitMin} minute contract SLA threshold.`}
                </p>
              </div>
            </div>
          </div>

          {/* City Rules Summary Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="font-extrabold text-sm text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" /> Official MEMS 108 SLA Thresholds
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-bold text-rose-400">Priority 1 (Life-Threatening)</span>
                  <span className="text-[10px] text-slate-400 block">SLA Limit: 8 mins (480s)</span>
                </div>
                <span className="font-mono text-rose-300 font-bold">₹5,000 / min breach</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-bold text-amber-400">Priority 2 (Urgent Care)</span>
                  <span className="text-[10px] text-slate-400 block">SLA Limit: 15 mins (900s)</span>
                </div>
                <span className="font-mono text-amber-300 font-bold">₹2,500 / min breach</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-bold text-sky-400">Priority 3 (Standard Transport)</span>
                  <span className="text-[10px] text-slate-400 block">SLA Limit: 30 mins (1800s)</span>
                </div>
                <span className="font-mono text-sky-300 font-bold">₹1,000 / min breach</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
