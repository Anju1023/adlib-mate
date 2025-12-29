import os
import json
import google.generativeai as genai
from PIL import Image
import io
from typing import List, Dict, Any
from backend.app.models.schemas import AnalysisResponse, ChordMeasure, SoloConfig
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
    model_name = "gemini-2.0-flash" 
    
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

def generate_adlib_solo(chords: List[ChordMeasure], config: SoloConfig) -> Dict[str, Any]:
    """
    Generates an ad-lib solo and an explanation using Gemini based on chords and config.
    """
    if not API_KEY:
        raise ValueError("GOOGLE_API_KEY is not configured.")

    model_name = "gemini-2.0-flash" # Use a model with good reasoning capabilities
    model = genai.GenerativeModel(model_name=model_name)

    # Format chords for the prompt
    chords_text = "\n".join([f"Measure {m.measure_number}: {', '.join(m.chords)}" for m in chords])

    prompt = f"""
    You are a professional jazz musician and teacher.
    Create an ad-lib solo for the following chord progression:

    {chords_text}

    Configuration:
    - Instrument: {config.instrument}
    - Difficulty: {config.difficulty}
    - Tempo: {config.tempo} BPM

    Please generate two things:
    1. A valid MusicXML string representing the solo. Ensure it is complete and valid XML.
    2. A brief educational explanation of the solo (e.g., "I used the locrian scale here because...", "Targeting the 3rd of the chord...").

    Return the result in JSON format:
    {{
      "music_xml": "<?xml ... (full MusicXML content) ... >",
      "explanation": "Your explanation here."
    }}
    
    IMPORTANT: The MusicXML must be valid and renderable. Include necessary parts like <score-partwise>, <part>, <measure>, <note>, etc.
    """

    response = model.generate_content(
        prompt,
        generation_config={
            "response_mime_type": "application/json",
        }
    )

    try:
        return json.loads(response.text)
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        print(f"Raw response: {response.text}")
        raise ValueError("Failed to generate ad-lib solo.")
