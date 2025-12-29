from fastapi import APIRouter, HTTPException
from backend.app.models.schemas import GenerationRequest, GenerationResponse
from backend.app.logic.generator import generate_solo_xml

router = APIRouter()

@router.post("/generate-solo", response_model=GenerationResponse)
async def generate_solo(request: GenerationRequest):
    try:
        # Call the logic layer
        xml_content = generate_solo_xml(request)
        
        return GenerationResponse(
            music_xml=xml_content,
            explanation="Generated based on root notes for beginner difficulty."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
