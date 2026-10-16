export type AmbulanceStatus = 
  | 'idle'
  | 'en_route_patient'
  | 'at_scene'
  | 'transporting'
  | 'at_hospital'
  | 'out_of_service';

export type AmbulanceType = 'ALS_CARDIAC' | 'ALS_TRAUMA' | 'BLS_STANDARD' | 'PEDIATRIC_ICU';

export interface Ambulance {
  id: string;
  callsign: string;
  type: AmbulanceType;
  driverName: string;
  medicName: string;
  status: AmbulanceStatus;
  location: { lat: number; lng: number };
  heading: number; // degrees
  speedKmh: number;
  batteryLevel: number; // %
  currentEmergencyId?: string;
  targetHospitalId?: string;
  routePolyline?: [number, number][]; // lat, lng points
  routeIndex?: number;
  assignedAt?: number;
}

export type EmergencyPriority = 'P1_CRITICAL' | 'P2_URGENT' | 'P3_STANDARD' | 'P4_LOW';

export interface EmergencyCall {
  id: string;
  ticketNumber: string;
  callerName: string;
  phone: string;
  location: { lat: number; lng: number; address: string };
  priority: EmergencyPriority;
  chiefComplaint: string;
  patientAge: number;
  patientGender: 'M' | 'F' | 'Other';
  reportedAt: number; // timestamp
  slaDeadlineSec: number; // contract response time allowed (e.g., 480s for 8min)
  dispatchedAmbulanceId?: string;
  assignedHospitalId?: string;
  status: 'dispatch_pending' | 'en_route' | 'on_scene' | 'in_transit' | 'completed';
  responseTimeSec?: number;
  slaBreached?: boolean;
}

export interface Hospital {
  id: string;
  name: string;
  location: { lat: number; lng: number; address: string };
  type: 'Level 1 Trauma' | 'Comprehensive Cardiac' | 'General ER' | 'Stroke Center';
  openBeds: {
    er: number;
    icu: number;
    trauma: number;
  };
  totalBeds: {
    er: number;
    icu: number;
    trauma: number;
  };
  diversionStatus: 'accepting' | 'busy_warning' | 'diverting';
  estimatedErWaitMin: number;
  incomingAmbulancesCount: number;
  telemetryActive: boolean;
}

export interface TrafficLight {
  id: string;
  name: string;
  intersection: string;
  location: { lat: number; lng: number };
  currentState: 'RED' | 'YELLOW' | 'GREEN';
  isPreempted: boolean;
  preemptedByAmbulanceId?: string;
  preemptionRadiusMeters: number;
  distanceToNearestAmbulanceMeters?: number;
}

export interface PatientVitals {
  heartRate: number; // bpm
  bpSystolic: number; // mmHg
  bpDiastolic: number; // mmHg
  spo2: number; // %
  respRate: number; // breaths/min
  temperatureC: number; // °C
  etco2: number; // mmHg
  gcsScore: number; // 3-15
  triageCategory: 'CODE_RED_STEMI' | 'CODE_RED_TRAUMA' | 'CODE_YELLOW' | 'CODE_GREEN';
  ecgCondition: 'Normal Sinus Rhythm' | 'ST-Elevation (STEMI)' | 'Ventricular Tachycardia' | 'Sinus Bradycardia';
  hospitalNotified: boolean;
  hospitalPreppedAt?: number;
}

export interface CityContractRules {
  contractName: string;
  cityName: string;
  complianceTargetPct: number; // e.g. 95%
  penalties: {
    p1BreachPerMin: number; // e.g. $500/min breach
    p2BreachPerMin: number; // e.g. $250/min breach
    p3BreachPerMin: number; // e.g. $100/min breach
  };
  slaLimitsSec: {
    P1_CRITICAL: number; // 480s (8 min)
    P2_URGENT: number; // 900s (15 min)
    P3_STANDARD: number; // 1800s (30 min)
    P4_LOW: number; // 3600s (60 min)
  };
  monthToDate: {
    totalCalls: number;
    metCalls: number;
    breachedCalls: number;
    totalPenalties: number;
    performancePct: number;
  };
}
