import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

key = os.environ.get("GEMINI_API_KEY")
print(f"Testing Gemini Key: {key[:5]}...{key[-5:] if key else ''}")

if not key:
    print("❌ No API key found")
    exit(1)

genai.configure(api_key=key)
model = genai.GenerativeModel("gemini-1.5-flash")

try:
    print("Sending test request to Gemini...")
    response = model.generate_content("Say 'Hello world' if this works.")
    print(f"✅ Gemini Response: {response.text}")
except Exception as e:
    print(f"❌ Gemini Error: {e}")
