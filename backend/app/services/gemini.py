import os
import json
from google import genai
from google.genai import types
from PIL import Image
import io
from typing import List, Dict, Any
from app.models.schemas import AnalysisResponse, ChordMeasure, SoloConfig
from dotenv import load_dotenv
from pathlib import Path

# Debugging: Print current working directory and expected .env path
print(f'Current working directory: {os.getcwd()}')
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
print(f'Looking for .env at: {env_path}')
print(f'Does .env exist? {env_path.exists()}')

load_dotenv(dotenv_path=env_path)

# Configure Gemini API
API_KEY = os.getenv('GOOGLE_API_KEY')

if API_KEY:
    masked_key = API_KEY[:4] + '...' + API_KEY[-4:] if len(API_KEY) > 8 else '****'
    print(f'Gemini API configured successfully. Key: {masked_key}')
    client = genai.Client(api_key=API_KEY)
else:
    print(
        f'CRITICAL WARNING: GOOGLE_API_KEY not found in env variables or .env file at {env_path}'
    )
    client = None


def analyze_score_image(image_bytes: bytes) -> AnalysisResponse:
    """
    Analyzes a music score image using Gemini-3-flash-preview and extracts chord progressions.
    """
    if not client:
        raise ValueError('GOOGLE_API_KEY is not configured.')

    # Use the latest vision model
    model_name = 'gemini-3-flash-preview'
    print(f'DEBUG: analyze_score_image using model: {model_name}')

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

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=[prompt, image],
            config=types.GenerateContentConfig(
                response_mime_type='application/json',
            ),
        )
        
        data = json.loads(response.text)
        return AnalysisResponse(**data)
    except Exception as e:
        print(f'Error parsing Gemini response: {e}')
        # print(f'Raw response: {response.text}')
        raise ValueError('Failed to analyze the score image correctly.')


def generate_adlib_solo(
    chords: List[ChordMeasure], config: SoloConfig
) -> Dict[str, Any]:
    """
    Generates an ad-lib solo and an explanation using Gemini based on chords and config.
    """
    if not client:
        raise ValueError('GOOGLE_API_KEY is not configured.')

    # Use the latest reasoning model
    model_name = 'gemini-3-flash-preview'
    print(f'DEBUG: generate_adlib_solo using model: {model_name}')

    # Format chords for the prompt
    chords_text = '\n'.join(
        [f'Measure {m.measure_number}: {", ".join(m.chords)}' for m in chords]
    )

    prompt = f"""
    You are a professional jazz musician and teacher.
    Create an ad-lib solo for the following chord progression:

    {chords_text}

    Configuration:
    - Instrument: {config.instrument}
    - Difficulty: {config.difficulty}
    - Tempo: {config.tempo} BPM

    Please generate two things:
    1. A valid MusicXML string representing the solo. 
       - **CRITICAL:** Do NOT just use whole notes or half notes. Use a mix of quarter notes, eighth notes, and rests to create a rhythmic, syncopated, and interesting jazz solo.
       - Use appropriate scales (Dorian, Mixolydian, etc.) and approach notes.
       - Ensure the XML is complete and valid.
    2. A brief educational explanation of the solo in **JAPANESE**.
       - Explain why you chose these notes (e.g., "Used the 3rd and 7th to outline the chord...", "Added a bebop enclosure...").
       - Keep the tone encouraging and professional.

    Return the result in JSON format:
    {{
      "music_xml": "<?xml ... (full MusicXML content) ... >",
      "explanation": "ここに日本語の解説が入ります。"
    }}
    
    IMPORTANT: The MusicXML must be valid and renderable. Include necessary parts like <score-partwise>, <part>, <measure>, <note>, <attributes>, <clef>, <time>, etc.
    """

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type='application/json',
            ),
        )
        print('DEBUG: Gemini response received.')

        return json.loads(response.text)
    except Exception as e:
        print(f'Error in generate_adlib_solo: {e}')
        raise ValueError('Failed to generate ad-lib solo.')

    # Format chords for the prompt
    chords_text = '\n'.join(
        [f'Measure {m.measure_number}: {", ".join(m.chords)}' for m in chords]
    )

    prompt = f"""
    You are a professional jazz musician and teacher.
    Create an ad-lib solo for the following chord progression:

    {chords_text}

    Configuration:
    - Instrument: {config.instrument}
    - Difficulty: {config.difficulty}
    - Tempo: {config.tempo} BPM

    Please generate two things:
    1. A valid MusicXML string representing the solo. 
       - **CRITICAL:** Do NOT just use whole notes or half notes. Use a mix of quarter notes, eighth notes, and rests to create a rhythmic, syncopated, and interesting jazz solo.
       - Use appropriate scales (Dorian, Mixolydian, etc.) and approach notes.
       - Ensure the XML is complete and valid.
    2. A brief educational explanation of the solo in **JAPANESE**.
       - Explain why you chose these notes (e.g., "Used the 3rd and 7th to outline the chord...", "Added a bebop enclosure...").
       - Keep the tone encouraging and professional.

    Return the result in JSON format:
    {{
      "music_xml": "<?xml ... (full MusicXML content) ... >",
      "explanation": "ここに日本語の解説が入ります。"
    }}
    
    IMPORTANT: The MusicXML must be valid and renderable. Include necessary parts like <score-partwise>, <part>, <measure>, <note>, <attributes>, <clef>, <time>, etc.
    """

    try:
        response = model.generate_content(
            prompt,
            generation_config={
                'response_mime_type': 'application/json',
            },
        )
        print('DEBUG: Gemini response received.')
        # print(f"DEBUG: Raw response text: {response.text[:200]}...") # Print first 200 chars for check

        return json.loads(response.text)
    except Exception as e:
        print(f'Error in generate_adlib_solo: {e}')
        if 'response' in locals() and hasattr(response, 'text'):
            print(f'Full failed response text: {response.text}')
        raise ValueError('Failed to generate ad-lib solo.')
