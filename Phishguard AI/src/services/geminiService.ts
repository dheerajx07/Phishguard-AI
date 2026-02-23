import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface PhishingAnalysis {
  isPhishing: boolean;
  confidence: number;
  reasons: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendation: string;
}

export const analyzeUrl = async (url: string, content: string): Promise<PhishingAnalysis> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following URL and page content for phishing characteristics. 
    URL: ${url}
    Content: ${content.substring(0, 2000)}`,
    config: {
      systemInstruction: "You are a world-class cybersecurity expert specializing in phishing detection. Analyze the provided URL and content for signs of deception, credential harvesting, or malicious intent. Return a structured JSON response.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isPhishing: { type: Type.BOOLEAN },
          confidence: { type: Type.NUMBER },
          reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
          riskLevel: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
          recommendation: { type: Type.STRING }
        },
        required: ["isPhishing", "confidence", "reasons", "riskLevel", "recommendation"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};
