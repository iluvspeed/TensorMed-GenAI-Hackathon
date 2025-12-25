
import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import { HealthAnalysis, LabMarker } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeReport = async (
  contents: (string | { data: string; mimeType: string })[],
  history: string = "None"
): Promise<HealthAnalysis[]> => {
  const model = 'gemini-3-pro-preview';
  
  const systemInstruction = `
    You are Medic-AI-d, a senior clinical diagnostic architect. 
    Your mission is to perform deep-set analysis on medical documents.

    CRITICAL EXTRACTION RULES:
    1. EXHAUSTIVE MARKERS: Extract EVERY SINGLE biomarker, lab result, or clinical value found in the report.
    2. CLINICAL CONTEXT: For EVERY marker, generate a "context" string that explains how its current value and status relate to the 'potentialIssues' identified.
    3. IDENTIFY DISTINCT EVENTS: Create separate analysis objects for each distinct test date.
    4. RISK TRAJECTORY: Calculate a 'risk_trajectory_score' from 1 to 10.
    5. STANDARDIZED NAMING: Use universal clinical names for markers.
    6. VERNACULAR: Translate medical terms from Hindi/Hinglish to standard English.

    OUTPUT STRUCTURE:
    Return JSON with "reports" (array) and "risk_trajectory_score" (integer 1-10).
  `;

  const reportSchema = {
    type: Type.OBJECT,
    properties: {
      patientName: { type: Type.STRING },
      patientAge: { type: Type.STRING },
      patientGender: { type: Type.STRING },
      reportDate: { type: Type.STRING },
      urgency: { type: Type.STRING },
      keyFinding: { type: Type.STRING },
      reportType: { type: Type.STRING },
      summary: { type: Type.STRING },
      markers: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            value: { type: Type.STRING },
            unit: { type: Type.STRING },
            referenceRange: { type: Type.STRING },
            status: { type: Type.STRING },
            interpretation: { type: Type.STRING },
            context: { type: Type.STRING }
          },
          required: ["name", "value", "unit", "status", "context"]
        }
      },
      potentialIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
      patterns: { type: Type.STRING },
      correctiveMeasures: { type: Type.ARRAY, items: { type: Type.STRING } },
      dietaryRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
      recommendedSpecialist: { type: Type.STRING }
    },
    required: ["reportDate", "urgency", "keyFinding", "reportType", "summary", "markers", "correctiveMeasures", "dietaryRecommendations", "recommendedSpecialist"]
  };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      reports: { type: Type.ARRAY, items: reportSchema },
      risk_trajectory_score: { type: Type.INTEGER }
    },
    required: ["reports"]
  };

  const parts: any[] = [];
  contents.forEach((item, index) => {
    if (typeof item === 'string') parts.push({ text: `Document Part ${index + 1}: ${item}` });
    else parts.push({ inlineData: item });
  });

  parts.push({ text: `Historical Baseline: ${history}` });

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
      thinkingConfig: { thinkingBudget: 4000 }
    }
  });

  const parsed = JSON.parse(response.text || '{"reports":[]}');
  return (parsed.reports || []).map((analysis: any) => ({
    ...analysis,
    id: crypto.randomUUID(),
    timestamp: analysis.reportDate ? Date.parse(analysis.reportDate) : Date.now(),
    riskTrajectoryScore: parsed.risk_trajectory_score
  }));
};

export const startChatSession = (context: string): Chat => {
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `You are the Medic-AI-d Clinical Assistant. Use context of patient history to answer. disclaim medical diagnosis.`,
    },
  });
};

export const findSpecialists = async (
  specialty: string, 
  issues: string[],
  location?: { lat: number; lng: number } | string
) => {
  const model = 'gemini-2.5-flash';
  
  let searchContext = "";
  let latLng = undefined;

  if (typeof location === 'string') {
    searchContext = `Search strictly within the suburb of ${location}.`;
  } else if (location && 'lat' in location) {
    searchContext = `Search strictly within a 5km radius of coordinates: ${location.lat}, ${location.lng}.`;
    latLng = { latitude: location.lat, longitude: location.lng };
  }

  const prompt = `
    TASK: Find top-rated ${specialty} specialists and hospitals.
    LOCATION CONSTRAINT: ${searchContext} 
    STRICT GEOGRAPHIC RULE: DO NOT return results from the USA, Texas, California, or other countries if the specified area is in India or a different specific region.
    FORMAT: Every result MUST be exactly: "Name | Full Suburb, City, Country".
    ADDRESS REQUIREMENT: YOU MUST INCLUDE THE FULL DETAILED LOCALITY AND ADDRESS FOR EVERY SINGLE ITEM.
    TOPIC: Patient has issues: ${issues.join(', ')}.
    USE GOOGLE MAPS GROUNDING TO VERIFY ADDRESSES AND PROXIMITY.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { 
      tools: [{ googleMaps: {} }],
      ...(latLng && {
        toolConfig: {
          retrievalConfig: { latLng }
        }
      })
    }
  });

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return {
    text: response.text,
    links: chunks.filter((c: any) => c.maps).map((c: any) => ({ 
      title: c.maps.title, 
      uri: c.maps.uri 
    }))
  };
};