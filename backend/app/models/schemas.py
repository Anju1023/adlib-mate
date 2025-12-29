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

class ChordMeasure(BaseModel):
    measure_number: int
    chords: List[str]  # e.g., ["Dm7", "G7"]

class SoloConfig(BaseModel):
    difficulty: Difficulty = Difficulty.BEGINNER
    instrument: Instrument = Instrument.SAXOPHONE
    tempo: int = 120

class GenerationRequest(BaseModel):
    chords: List[ChordMeasure]
    config: SoloConfig

class GenerationResponse(BaseModel):
    music_xml: str
    explanation: Optional[str] = None
