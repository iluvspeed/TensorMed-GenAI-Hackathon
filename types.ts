
export interface LabMarker {
  name: string;
  value: string | number;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'low' | 'high' | 'critical';
  interpretation: string;
  context?: string; // New field to link marker to potential issues
}

export interface HealthAnalysis {
  id: string;
  timestamp: number;
  reportDate?: string;
  reportType: string;
  patientName?: string;
  patientAge?: string;
  patientGender?: string;
  urgency: 'RED ALERT' | 'YELLOW' | 'GREEN';
  keyFinding: string;
  summary: string;
  markers: LabMarker[];
  potentialIssues: string[];
  patterns: string;
  dietaryRecommendations: string[];
  correctiveMeasures: string[];
  recommendedSpecialist: string;
  riskTrajectoryScore?: number; // 1 to 10 score
}

export interface Specialist {
  title: string;
  uri: string;
}

export interface AuthData {
  name: string;
  mobile?: string;
  abhaId?: string;
}

export interface PatientRecord {
  id: string; // This will be the unique key (mobile_name hash or abha_name hash)
  name: string;
  mobile?: string;
  abhaId?: string;
  age?: string;
  gender?: string;
  history: HealthAnalysis[];
}

export type UploadMode = 'text' | 'image';
export type AppView = 'dashboard' | 'records';
