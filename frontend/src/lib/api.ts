const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
