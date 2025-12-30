from fastapi import APIRouter, HTTPException, UploadFile, File
from app.models.schemas import GenerationRequest, GenerationResponse, AnalysisResponse
from app.logic.generator import generate_solo_xml
from app.services.gemini import analyze_score_image

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
