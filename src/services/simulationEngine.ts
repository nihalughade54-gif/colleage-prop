import type { Ambulance, EmergencyCall, Hospital, TrafficLight, PatientVitals, CityContractRules } from '../types';

export interface AppState {
  selectedCityId: string; // 'mumbai' | 'pune' | 'nagpur' | 'delhi' | 'bengaluru'
  ambulances: Ambulance[];
  emergencies: EmergencyCall[];
  hospitals: Hospital[];
  trafficLights: TrafficLight[];
  patientVitals: PatientVitals;
  cityRules: CityContractRules;
  simSpeedMultiplier: number; // 1x, 2x, 5x
  activeTab: 'dashboard' | 'navigator' | 'vitals' | 'compliance' | 'simulation';
  selectedEmergencyId: string | null;
  selectedAmbulanceId: string | null;
  selectedHospitalId: string | null;
  simulationLog: { timestamp: string; message: string; type: 'info' | 'warning' | 'alert' | 'success' }[];
}

// Distance calculation between two lat/lng points in meters
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate ECG waveform points (P-QRS-T complex) based on HR and condition
export function generateEcgWaveform(length = 200, heartRate = 75, condition = 'Normal Sinus Rhythm'): number[] {
  const points: number[] = [];
  const beatPeriod = Math.floor(60 / (heartRate / 60) * 10); // samples per beat
  
  for (let i = 0; i < length; i++) {
    const phase = (i % beatPeriod) / beatPeriod;
    let val = 0;

    if (condition === 'ST-Elevation (STEMI)') {
      if (phase >= 0.10 && phase <= 0.16) {
        val = 0.15 * Math.sin((phase - 0.10) / 0.06 * Math.PI);
      } else if (phase >= 0.20 && phase <= 0.24) {
        val = -0.2 * (phase - 0.20) / 0.04;
      } else if (phase >= 0.24 && phase <= 0.28) {
        val = 1.4 * Math.sin((phase - 0.24) / 0.04 * Math.PI);
      } else if (phase >= 0.28 && phase <= 0.32) {
        val = -0.3;
      } else if (phase >= 0.32 && phase <= 0.55) {
        val = 0.55 + 0.15 * Math.sin((phase - 0.32) / 0.23 * Math.PI);
      } else {
        val = 0.02 * (Math.random() - 0.5);
      }
    } else if (condition === 'Ventricular Tachycardia') {
      val = 0.9 * Math.sin(phase * Math.PI * 4) + 0.1 * (Math.random() - 0.5);
    } else {
      if (phase >= 0.12 && phase <= 0.18) {
        val = 0.15 * Math.sin((phase - 0.12) / 0.06 * Math.PI);
      } else if (phase >= 0.22 && phase <= 0.24) {
        val = -0.15;
      } else if (phase >= 0.24 && phase <= 0.28) {
        val = 1.2 * Math.sin((phase - 0.24) / 0.04 * Math.PI);
      } else if (phase >= 0.28 && phase <= 0.32) {
        val = -0.25;
      } else if (phase >= 0.40 && phase <= 0.52) {
        val = 0.3 * Math.sin((phase - 0.40) / 0.12 * Math.PI);
      } else {
        val = 0.02 * (Math.random() - 0.5);
      }
    }
    points.push(val);
  }

  return points;
}

// Smart Dispatch Recommendation Algorithm
export function recommendOptimalAmbulance(
  emergency: EmergencyCall,
  ambulances: Ambulance[],
  hospitals: Hospital[]
): {
  recommendedAmbulance: Ambulance | null;
  recommendedHospital: Hospital | null;
  reason: string;
  estimatedEtaSec: number;
} {
  const idleAmbulances = ambulances.filter(a => a.status === 'idle');
  if (idleAmbulances.length === 0) {
    return {
      recommendedAmbulance: null,
      recommendedHospital: null,
      reason: 'No available idle ambulances in district',
      estimatedEtaSec: 9999,
    };
  }

  let bestAmb: Ambulance | null = null;
  let bestScore = Infinity;
  let bestEtaSec = 0;

  for (const amb of idleAmbulances) {
    const distMeters = getDistanceMeters(
      amb.location.lat,
      amb.location.lng,
      emergency.location.lat,
      emergency.location.lng
    );

    const etaSeconds = Math.round(distMeters / 15);
    let score = etaSeconds;

    if (emergency.priority === 'P1_CRITICAL' && amb.type.startsWith('ALS')) {
      score -= 60;
    }
    if (emergency.chiefComplaint.toLowerCase().includes('cardiac') && amb.type === 'ALS_CARDIAC') {
      score -= 90;
    }
    if (emergency.patientAge < 14 && amb.type === 'PEDIATRIC_ICU') {
      score -= 120;
    }

    if (score < bestScore) {
      bestScore = score;
      bestAmb = amb;
      bestEtaSec = etaSeconds;
    }
  }

  let targetHosp: Hospital | null = null;
  let maxHospitalScore = -1;

  for (const hosp of hospitals) {
    if (hosp.diversionStatus === 'diverting') continue;

    let hospScore = hosp.openBeds.er + hosp.openBeds.icu * 2;
    if (emergency.chiefComplaint.toLowerCase().includes('cardiac') && hosp.type === 'Comprehensive Cardiac') {
      hospScore += 50;
    }
    if (emergency.chiefComplaint.toLowerCase().includes('trauma') && hosp.type === 'Level 1 Trauma') {
      hospScore += 50;
    }

    if (hospScore > maxHospitalScore) {
      maxHospitalScore = hospScore;
      targetHosp = hosp;
    }
  }

  const reason = bestAmb 
    ? `Closest unit (${(getDistanceMeters(bestAmb.location.lat, bestAmb.location.lng, emergency.location.lat, emergency.location.lng) / 1000).toFixed(1)}km, ETA ~${Math.ceil(bestEtaSec / 60)} min). Equipment matches ${emergency.priority} priority.`
    : 'No optimal unit found';

  return {
    recommendedAmbulance: bestAmb,
    recommendedHospital: targetHosp || hospitals[0],
    reason,
    estimatedEtaSec: bestEtaSec,
  };
}
