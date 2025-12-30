from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

class Difficulty(str, Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"

class Instrument(str, Enum):
    SAXOPHONE = "Saxophone"
    TRUMPET = "Trumpet"
    PIANO = "Piano"

class ModelMode(str, Enum):
    SPEED = "speed"   # gemini-3-flash-preview
    QUALITY = "quality" # gemini-3-pro-preview

class ChordMeasure(BaseModel):
    measure_number: int
    chords: List[str]  # e.g., ["Dm7", "G7"]

class SoloConfig(BaseModel):
    difficulty: Difficulty = Difficulty.BEGINNER
    instrument: Instrument = Instrument.SAXOPHONE
    tempo: int = 120
    model_mode: ModelMode = ModelMode.SPEED # Default to Speed

class GenerationRequest(BaseModel):
    chords: List[ChordMeasure]
    config: SoloConfig

class GenerationResponse(BaseModel):
    music_xml: str
    explanation: Optional[str] = None

class AnalysisResponse(BaseModel):
    title: Optional[str] = None
    key: Optional[str] = None
    chords: List[ChordMeasure]
