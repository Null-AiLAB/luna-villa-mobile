import google.generativeai as genai
from config import settings
import sys

def diagnose():
    print(f"--- Gemini Diagnosis ---")
    print(f"API Key (first 5 chars): {settings.GEMINI_API_KEY[:5]}...")
    
    genai.configure(api_key=settings.GEMINI_API_KEY)
    
    print("\n[1] Listing Available Models...")
    try:
        models = genai.list_models()
        found_20 = False
        found_15 = False
        for m in models:
            print(f" - {m.name}")
            if "gemini-2.0-flash" in m.name:
                found_20 = True
            if "gemini-1.5-flash" in m.name:
                found_15 = True
        
        print(f"\ngemini-2.0-flash found: {found_20}")
        print(f"gemini-1.5-flash found: {found_15}")
        
    except Exception as e:
        print(f"Error listing models: {e}")
        return

    print("\n[2] Testing gemini-1.5-flash (Simple Prompt)...")
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content("Hello, respond with 'OK' if you can hear me.")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error with gemini-1.5-flash: {e}")

    print("\n[3] Testing gemini-2.0-flash (Simple Prompt)...")
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content("Hello, respond with 'OK' if you can hear me.")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error with gemini-2.0-flash: {e}")

if __name__ == "__main__":
    diagnose()
