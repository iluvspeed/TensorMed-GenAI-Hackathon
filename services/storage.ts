
import { PatientRecord, HealthAnalysis } from '../types';

/**
 * STRATEGY FOR MONGODB INTEGRATION:
 * 
 * To connect to your MongoDB:
 * 1. Create a REST/GraphQL API using Node.js/Express.
 * 2. In this file, replace localStorage calls with fetch() or axios calls to your API endpoints.
 * 3. Use the Patient ID (e.g., 'patient_default') as a key in your MongoDB collection.
 * 4. Ensure your API handles CORS if hosted on a different domain.
 */

const STORAGE_KEY = 'tensormed_patient_data';

export const saveToHistory = async (patient: PatientRecord) => {
  // Current: LocalStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patient));
  
  // Future MongoDB Integration Example:
  /*
  await fetch('/api/save-patient', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patient)
  });
  */
};

export const loadHistory = async (): Promise<PatientRecord | null> => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  return JSON.parse(data);
  
  // Future MongoDB Integration Example:
  /*
  const response = await fetch('/api/get-patient?id=patient_default');
  return response.json();
  */
};
