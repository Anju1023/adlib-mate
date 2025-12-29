from fastapi import APIRouter, HTTPException, UploadFile, File, Response
from fastapi.responses import StreamingResponse
from backend.app.models.schemas import GenerationRequest, GenerationResponse, AnalysisResponse
from backend.app.logic.generator import generate_solo_xml
from backend.app.services.gemini import analyze_score_image
from backend.app.services.audio import synthesize_audio_from_xml
import io

router = APIRouter()

@router.post("/generate-solo", response_model=GenerationResponse)
async def generate_solo(request: GenerationRequest):
    try:
        # Call the logic layer
        xml_content, explanation = generate_solo_xml(request)
        
        return GenerationResponse(
            music_xml=xml_content,
            explanation=explanation
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-score", response_model=AnalysisResponse)
async def analyze_score(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")
    
    try:
        contents = await file.read()
        result = analyze_score_image(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AudioRequest(GenerationRequest):
    pass # Re-use generation request or create a simpler one with just XML

from pydantic import BaseModel
class SynthesisRequest(BaseModel):
    music_xml: str
    instrument: str = "Saxophone"

@router.post("/synthesize-audio")
async def synthesize_audio(request: SynthesisRequest):
    try:
        audio_bytes = synthesize_audio_from_xml(request.music_xml, request.instrument)
        
        return StreamingResponse(
            io.BytesIO(audio_bytes), 
            media_type="audio/mp3"
        )
    except Exception as e:
        print(f"Synthesis failed: {e}")
        # Return 503 if service is unavailable (e.g. model not found) so frontend can fallback
        raise HTTPException(status_code=503, detail="Audio synthesis unavailable, use local playback.")
