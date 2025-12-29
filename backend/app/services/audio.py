import os
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path
import io

# Get the path to the .env file in the backend directory
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

API_KEY = os.getenv("GOOGLE_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

def synthesize_audio_from_xml(music_xml: str, instrument: str = "Saxophone") -> bytes:
    """
    Synthesizes realistic audio from MusicXML using Lyria (or capable Gemini model).
    Returns raw audio bytes.
    """
    if not API_KEY:
        raise ValueError("GOOGLE_API_KEY is not configured.")

    # In 2025 context, we use the specialized Lyria model
    model_name = "lyria-realtime-exp"
    
    # Fallback/Alternative check: In reality, we might use a Gemini model capable of audio gen
    # model_name = "gemini-3.0-pro-preview" 

    print(f"DEBUG: synthesize_audio using model: {model_name}")
    model = genai.GenerativeModel(model_name=model_name)

    prompt = f"""
    Generate a high-quality, realistic audio recording of a jazz solo based on this MusicXML data.
    
    Instrument: {instrument}
    Style: Jazz Ad-lib
    
    The audio should sound like a real human performance with dynamic expression, 
    articulation, and natural phrasing.
    
    Input MusicXML:
    ```xml
    {music_xml}
    ```
    """

    try:
        # Request audio output
        # Note: This is a hypothetical API structure for audio generation in 'google-generativeai'
        # In a real scenario, this might return a blob or a uri.
        response = model.generate_content(
            prompt,
            generation_config={
                "response_mime_type": "audio/mp3" 
            }
        )
        
        # Check if response contains binary data directly or needs processing
        if hasattr(response, 'parts'):
             for part in response.parts:
                 if part.inline_data:
                     return part.inline_data.data
        
        # If the API returns bytes directly in a specific way (hypothetical)
        if hasattr(response, 'blob'):
            return response.blob
            
        # Fallback for text-based response (error case)
        print(f"DEBUG: Unexpected response format from Lyria: {response.text[:100]}")
        raise ValueError("Model did not return audio data.")

    except Exception as e:
        print(f"Error in synthesize_audio: {e}")
        # For MVP stability: If Lyria fails (e.g. model not found), 
        # we might want to return None to signal the frontend to use Tone.js
        raise e
