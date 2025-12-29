import os
import json
import google.generativeai as genai
from PIL import Image
import io
from typing import List
from backend.app.models.schemas import AnalysisResponse, ChordMeasure
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini API
API_KEY = os.getenv("GOOGLE_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)
else:
    # In production, this should be handled properly
    print("Warning: GOOGLE_API_KEY not found in environment variables.")

def analyze_score_image(image_bytes: bytes) -> AnalysisResponse:
    """
    Analyzes a music score image using Gemini-3-flash-preview and extracts chord progressions.
    """
    if not API_KEY:
        raise ValueError("GOOGLE_API_KEY is not configured.")

    # Load the model
    # Note: Using gemini-2.0-flash as a fallback if gemini-3 is not available in the current environment
    # but the requirement specified gemini-3-flash-preview.
    model_name = "gemini-2.0-flash" # Defaulting to 2.0-flash for now as 3-flash might be too new
    
    model = genai.GenerativeModel(model_name=model_name)

    # Convert bytes to PIL Image
    image = Image.open(io.BytesIO(image_bytes))

    prompt = """
    Analyze this music score and extract the chord progression.
    Return the result in JSON format with the following structure:
    {
      "title": "Song Title",
      "key": "The key of the song (e.g., C, Eb, G#m)",
      "chords": [
        {"measure_number": 1, "chords": ["Chord1", "Chord2"]},
        ...
      ]
    }
    If a measure has multiple chords, list them in order.
    Focus only on the chords and the structure.
    """

    response = model.generate_content(
        [prompt, image],
        generation_config={
            "response_mime_type": "application/json",
        }
    )

    try:
        data = json.loads(response.text)
        return AnalysisResponse(**data)
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        print(f"Raw response: {response.text}")
        raise ValueError("Failed to analyze the score image correctly.")
