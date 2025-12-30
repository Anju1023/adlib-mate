import os
import json
from google import genai
from google.genai import types
from PIL import Image
import io
from typing import List, Dict, Any
from app.models.schemas import AnalysisResponse, ChordMeasure, SoloConfig, ModelMode
from dotenv import load_dotenv
from pathlib import Path

# デバッグ用: 現在の作業ディレクトリと .env の期待されるパスを表示するよ
print(f'現在の作業ディレクトリ: {os.getcwd()}')
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
print(f'.env を探している場所: {env_path}')
print(f'.env は存在してる？: {env_path.exists()}')

load_dotenv(dotenv_path=env_path)

# Gemini API の設定
API_KEY = os.getenv('GOOGLE_API_KEY')

if API_KEY:
    masked_key = API_KEY[:4] + '...' + API_KEY[-4:] if len(API_KEY) > 8 else '****'
    print(f'Gemini API の設定に成功したよ！ Key: {masked_key}')
    client = genai.Client(api_key=API_KEY)
else:
    print(f'重大な警告: {env_path} または環境変数に GOOGLE_API_KEY が見つからないよ！')
    client = None


def analyze_score_image(image_bytes: bytes) -> AnalysisResponse:
    """
    Gemini-3-flash-preview を使って楽譜画像を解析し、コード進行を抽出するよ。
    """
    if not client:
        raise ValueError('GOOGLE_API_KEY が設定されていないよ。')

    # 最新の Vision モデルを使用
    model_name = 'gemini-3-flash-preview'
    print(f'デバッグ: analyze_score_image で使用中のモデル: {model_name}')

    # バイトデータを PIL Image に変換
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
    コード進行と設定に基づいて、Gemini を使ってアドリブソロと解説を生成するよ。
    """
    if not client:
        raise ValueError('GOOGLE_API_KEY が設定されていないよ。')

    # 設定に基づいてモデルを選択するよ
    # Speed モードなら Flash (速い！)、Quality モードなら Pro (賢い！)
    if config.model_mode == ModelMode.QUALITY:
        model_name = 'gemini-3-pro-preview'
    else:
        model_name = 'gemini-3-flash-preview'
    
    print(f'デバッグ: generate_adlib_solo で使用中のモデル: {model_name} (モード: {config.model_mode})')

    # プロンプト用にコード進行をフォーマット
    chords_text = '\n'.join(
        [f'小節 {m.measure_number}: {", ".join(m.chords)}' for m in chords]
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
