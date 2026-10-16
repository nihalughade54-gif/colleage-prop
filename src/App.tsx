import { useState, useEffect } from 'react';
import { CITY_PRESETS } from './data/cityPresets';
import { getDistanceMeters } from './services/simulationEngine';
import type { AppState } from './services/simulationEngine';
import { Header } from './components/Header';
import { ControlRoomDashboard } from './components/ControlRoomDashboard';
import { SmartTrafficNavigator } from './components/SmartTrafficNavigator';
import { LivePatientTracker } from './components/LivePatientTracker';
import { CityRulesCompliance } from './components/CityRulesCompliance';
import { SimulationControls } from './components/SimulationControls';
import type { EmergencyCall } from './types';
import { INITIAL_CITY_RULES, INITIAL_PATIENT_VITALS } from './data/mockData';

export function App() {
  const initialPreset = CITY_PRESETS['mumbai'];

  const [state, setState] = useState<AppState>({
    selectedCityId: 'mumbai',
    ambulances: initialPreset.ambulances,
    emergencies: initialPreset.emergencies,
    hospitals: initialPreset.hospitals,
    trafficLights: initialPreset.trafficLights,
    patientVitals: INITIAL_PATIENT_VITALS,
    cityRules: INITIAL_CITY_RULES,
    simSpeedMultiplier: 1,
    activeTab: 'dashboard',
    selectedEmergencyId: initialPreset.emergencies[0]?.id || null,
    selectedAmbulanceId: initialPreset.ambulances[0]?.id || null,
    selectedHospitalId: initialPreset.hospitals[0]?.id || null,
    simulationLog: [
      {
        timestamp: new Date().toLocaleTimeString(),
        message: 'System online. Opticom V2X Radio transceiver link established in Mumbai Metro.',
        type: 'success',
      },
    ],
  });

  // Helper log function
  const addLog = (message: string, type: 'info' | 'warning' | 'alert' | 'success' = 'info') => {
    setState((prev) => ({
      ...prev,
      simulationLog: [
        { timestamp: new Date().toLocaleTimeString(), message, type },
        ...prev.simulationLog.slice(0, 49),
      ],
    }));
  };

  // Handler: Switch City Preset (Mumbai, Pune, Nagpur, Delhi, Bengaluru)
  const handleCityChange = (cityId: string) => {
    const preset = CITY_PRESETS[cityId];
    if (!preset) return;

    setState((prev) => ({
      ...prev,
      selectedCityId: cityId,
      ambulances: preset.ambulances,
      emergencies: preset.emergencies,
      hospitals: preset.hospitals,
      trafficLights: preset.trafficLights,
      selectedEmergencyId: preset.emergencies[0]?.id || null,
      selectedAmbulanceId: preset.ambulances[0]?.id || null,
      selectedHospitalId: preset.hospitals[0]?.id || null,
    }));

    addLog(`Switched active EMS operational city to ${preset.name}, ${preset.state}. Map re-centered.`, 'success');
  };

  // Main Real-Time Simulation Tick Loop
  useEffect(() => {
    const intervalTime = 1000 / state.simSpeedMultiplier;

    const timer = setInterval(() => {
      setState((prev) => {
        // 1. Move Ambulances along route
        const updatedAmbulances = prev.ambulances.map((amb) => {
          if ((amb.status === 'en_route_patient' || amb.status === 'transporting') && amb.routePolyline && amb.routePolyline.length > 1) {
            const currentIndex = amb.routeIndex || 0;
            const nextIndex = (currentIndex + 1) % amb.routePolyline.length;
            const targetCoord = amb.routePolyline[nextIndex];

            // Interpolate position
            const step = 0.0004; // Movement speed delta
            const dLat = targetCoord[0] - amb.location.lat;
            const dLng = targetCoord[1] - amb.location.lng;
            const dist = Math.sqrt(dLat * dLat + dLng * dLng);

            if (dist < 0.001) {
              return {
                ...amb,
                routeIndex: nextIndex,
                location: { lat: targetCoord[0], lng: targetCoord[1] },
              };
            }

            return {
              ...amb,
              location: {
                lat: amb.location.lat + (dLat / dist) * step,
                lng: amb.location.lng + (dLng / dist) * step,
              },
            };
          }
          return amb;
        });

        // 2. Check Traffic Light V2X Preemption distance
        const activeUnits = updatedAmbulances.filter(a => a.status === 'en_route_patient' || a.status === 'transporting');
        
        const updatedLights = prev.trafficLights.map((light) => {
          let nearestDist = Infinity;
          let preemptingAmbId: string | undefined = undefined;

          activeUnits.forEach((amb) => {
            const dist = getDistanceMeters(amb.location.lat, amb.location.lng, light.location.lat, light.location.lng);
            if (dist < nearestDist) {
              nearestDist = dist;
              if (dist <= light.preemptionRadiusMeters) {
                preemptingAmbId = amb.id;
              }
            }
          });

          const isPreemptedNow = preemptingAmbId !== undefined;
          const lightState = isPreemptedNow ? 'GREEN' : light.currentState;

          return {
            ...light,
            isPreempted: isPreemptedNow,
            preemptedByAmbulanceId: preemptingAmbId,
            currentState: lightState,
            distanceToNearestAmbulanceMeters: Math.round(nearestDist),
          };
        });

        // 3. Fluctuate Patient Vitals slightly for live feeling
        const hrDelta = Math.floor(Math.random() * 3) - 1;
        const spo2Delta = Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        
        const newHR = Math.max(60, Math.min(180, prev.patientVitals.heartRate + hrDelta));
        const newSpO2 = Math.max(85, Math.min(100, prev.patientVitals.spo2 + spo2Delta));

        return {
          ...prev,
          ambulances: updatedAmbulances,
          trafficLights: updatedLights,
          patientVitals: {
            ...prev.patientVitals,
            heartRate: newHR,
            spo2: newSpO2,
          },
        };
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [state.simSpeedMultiplier]);

  // Handler: Dispatch Ambulance to Call
  const handleDispatchAmbulance = (emergencyId: string, ambulanceId: string, hospitalId: string) => {
    const amb = state.ambulances.find(a => a.id === ambulanceId);
    const emg = state.emergencies.find(e => e.id === emergencyId);
    const hosp = state.hospitals.find(h => h.id === hospitalId);

    if (!amb || !emg || !hosp) return;

    setState((prev) => ({
      ...prev,
      ambulances: prev.ambulances.map((a) =>
        a.id === ambulanceId
          ? {
              ...a,
              status: 'en_route_patient',
              currentEmergencyId: emergencyId,
              targetHospitalId: hospitalId,
              speedKmh: 72,
              routePolyline: [
                [a.location.lat, a.location.lng],
                [emg.location.lat, emg.location.lng],
                [hosp.location.lat, hosp.location.lng],
              ],
              routeIndex: 0,
            }
          : a
      ),
      emergencies: prev.emergencies.map((e) =>
        e.id === emergencyId
          ? {
              ...e,
              status: 'en_route',
              dispatchedAmbulanceId: ambulanceId,
              assignedHospitalId: hospitalId,
            }
          : e
      ),
    }));

    addLog(
      `Dispatched unit ${amb.callsign} to ticket ${emg.ticketNumber}. Target hospital: ${hosp.name}.`,
      'success'
    );
  };

  // Handler: Toggle manual preemption on traffic light
  const handleTogglePreemption = (trafficLightId: string) => {
    setState((prev) => {
      const updated = prev.trafficLights.map((tl) =>
        tl.id === trafficLightId
          ? { ...tl, isPreempted: !tl.isPreempted, currentState: !tl.isPreempted ? 'GREEN' : 'RED' }
          : tl
      );
      return { ...prev, trafficLights: updated as any };
    });
    addLog(`Manual Opticom V2X override toggled on Signal #${trafficLightId}.`, 'warning');
  };

  // Handler: Update vitals condition
  const handleUpdateVitalsCondition = (condition: string, triageLevel: any) => {
    setState((prev) => ({
      ...prev,
      patientVitals: {
        ...prev.patientVitals,
        ecgCondition: condition as any,
        triageCategory: triageLevel,
        heartRate: condition.includes('STEMI') ? 138 : condition.includes('Tachycardia') ? 165 : 74,
        bpSystolic: condition.includes('STEMI') ? 172 : 120,
      },
    }));
    addLog(`Patient ECG waveform condition changed to [${condition}]. ER alerted.`, 'alert');
  };

  // Handler: Run scenario preset
  const handleTriggerScenario = (scenarioId: string) => {
    if (scenarioId === 'stemi_cardiac') {
      const currentCity = CITY_PRESETS[state.selectedCityId] || CITY_PRESETS['mumbai'];
      const newCall: EmergencyCall = {
        id: `emg-${Date.now()}`,
        ticketNumber: `MEMS-108-${Math.floor(1000 + Math.random() * 9000)}`,
        callerName: 'Central Mall Security',
        phone: '+91 98201 88221',
        location: {
          lat: currentCity.center[0] + 0.01,
          lng: currentCity.center[1] + 0.01,
          address: `Central Commercial Hub, ${currentCity.name}, ${currentCity.state}`,
        },
        priority: 'P1_CRITICAL',
        chiefComplaint: 'Acute STEMI Heart Attack - Unresponsive Male 55 yrs',
        patientAge: 55,
        patientGender: 'M',
        reportedAt: Date.now(),
        slaDeadlineSec: 480,
        status: 'dispatch_pending',
      };

      setState((prev) => ({
        ...prev,
        emergencies: [newCall, ...prev.emergencies],
        selectedEmergencyId: newCall.id,
        activeTab: 'dashboard',
      }));

      addLog(`SCENARIO 1 TRIGGERED: High priority STEMI emergency call created in ${currentCity.name}.`, 'alert');
    } else if (scenarioId === 'traffic_gridlock') {
      addLog('SCENARIO 2 TRIGGERED: Peak Hour Gridlock simulated. V2X rerouting active.', 'warning');
      setState((prev) => ({ ...prev, activeTab: 'navigator' }));
    } else if (scenarioId === 'hospital_diversion') {
      setState((prev) => ({
        ...prev,
        hospitals: prev.hospitals.map((h, i) =>
          i === 0 ? { ...h, diversionStatus: 'diverting', openBeds: { er: 0, icu: 0, trauma: 0 } } : h
        ),
        activeTab: 'dashboard',
      }));
      addLog('SCENARIO 3 TRIGGERED: Primary Trauma Hospital entered DIVERSION mode. Auto-dispatcher updated.', 'warning');
    }
  };

  // Handler: Add custom call
  const handleAddCustomCall = (chiefComplaint: string, priority: any) => {
    const currentCity = CITY_PRESETS[state.selectedCityId] || CITY_PRESETS['mumbai'];
    const newCall: EmergencyCall = {
      id: `emg-${Date.now()}`,
      ticketNumber: `MEMS-108-${Math.floor(1000 + Math.random() * 9000)}`,
      callerName: 'Manual 108 Operator',
      phone: '+91 98110 88331',
      location: {
        lat: currentCity.center[0] - 0.008,
        lng: currentCity.center[1] + 0.005,
        address: `Main District Arterial Road, ${currentCity.name}, ${currentCity.state}`,
      },
      priority,
      chiefComplaint,
      patientAge: 42,
      patientGender: 'F',
      reportedAt: Date.now(),
      slaDeadlineSec: priority === 'P1_CRITICAL' ? 480 : priority === 'P2_URGENT' ? 900 : 1800,
      status: 'dispatch_pending',
    };

    setState((prev) => ({
      ...prev,
      emergencies: [newCall, ...prev.emergencies],
      selectedEmergencyId: newCall.id,
      activeTab: 'dashboard',
    }));

    addLog(`Custom 108 Call ticket ${newCall.ticketNumber} created in ${currentCity.name}.`, 'info');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        state={state}
        onTabChange={(tab) => setState((prev) => ({ ...prev, activeTab: tab }))}
        onSpeedChange={(speed) => setState((prev) => ({ ...prev, simSpeedMultiplier: speed }))}
        onCityChange={handleCityChange}
      />

      <main className="flex-1 overflow-y-auto">
        {state.activeTab === 'dashboard' && (
          <ControlRoomDashboard
            state={state}
            onSelectAmbulance={(id) => setState((prev) => ({ ...prev, selectedAmbulanceId: id }))}
            onSelectEmergency={(id) => setState((prev) => ({ ...prev, selectedEmergencyId: id }))}
            onSelectHospital={(id) => setState((prev) => ({ ...prev, selectedHospitalId: id }))}
            onDispatchAmbulance={handleDispatchAmbulance}
          />
        )}

        {state.activeTab === 'navigator' && (
          <SmartTrafficNavigator
            state={state}
            onTogglePreemption={handleTogglePreemption}
          />
        )}

        {state.activeTab === 'vitals' && (
          <LivePatientTracker
            state={state}
            onUpdateVitalsCondition={handleUpdateVitalsCondition}
            onConfirmHospitalNotification={() => addLog('Re-transmitted updated vitals telemetry stream to ER Bay.', 'success')}
          />
        )}

        {state.activeTab === 'compliance' && (
          <CityRulesCompliance state={state} />
        )}

        {state.activeTab === 'simulation' && (
          <SimulationControls
            state={state}
            onTriggerScenario={handleTriggerScenario}
            onAddCustomCall={handleAddCustomCall}
          />
        )}
      </main>
    </div>
  );
}

export default App;
