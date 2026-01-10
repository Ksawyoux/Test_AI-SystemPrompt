import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

models_to_test = ["gemini-1.5-flash", "models/gemini-1.5-flash", "gemini-pro", "gemini-1.5-pro"]

print("Testing models...")

for m in models_to_test:
    print(f"\n--- Testing {m} ---")
    try:
        model = genai.GenerativeModel(m)
        response = model.generate_content("Hi")
        print(f"✅ SUCCESS: {m}")
        print(f"Response: {response.text}")
        break 
    except Exception as e:
        print(f"❌ FAILED: {m}")
        print(f"Error: {e}")
