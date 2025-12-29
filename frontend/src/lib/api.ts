const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface GenerationRequest {
  chords: { measure_number: number; chords: string[] }[];
  config: {
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    instrument: "Saxophone" | "Trumpet" | "Piano";
    tempo: number;
  };
}

export interface GenerationResponse {
  music_xml: string;
  explanation: string;
}

export interface AnalysisResponse {
  title?: string;
  key?: string;
  chords: { measure_number: number; chords: string[] }[];
}

export async function generateSolo(request: GenerationRequest): Promise<GenerationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/generate-solo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to generate solo");
  }

  return response.json();
}

export async function analyzeScore(file: File): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/v1/analyze-score`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to analyze score");
  }

  return response.json();
}
