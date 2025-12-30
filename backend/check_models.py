import os
from google import genai
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

api_key = os.getenv('GOOGLE_API_KEY')
if not api_key:
    print("No API KEY found")
    exit()

client = genai.Client(api_key=api_key)

try:
    print("Listing available models...")
    # The new SDK might use a different way to list, but let's try the standard iterator
    # Note: In the new SDK, client.models.list() returns an iterator of Model objects
    for model in client.models.list():
        if "gemini" in model.name:
            print(f"- {model.name} ({model.display_name})")
except Exception as e:
    print(f"Error listing models: {e}")
