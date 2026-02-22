import google.generativeai as genai
from config import settings
import sys

def diagnose():
    print(f"--- Gemini Comprehensive Diagnosis ---")
    genai.configure(api_key=settings.GEMINI_API_KEY)
    
    models_to_test = [
        "gemini-flash-latest",
        "gemini-pro-latest",
        "gemini-2.0-flash",
        "gemini-2.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.0-pro"
    ]
    
    print("\n[1] Listing ALL accessible models...")
    try:
        all_models = [m.name for m in genai.list_models()]
        for m in all_models:
            print(f" - {m}")
    except Exception as e:
        print(f"Error listing models: {e}")
        return

    print("\n[2] Stress Testing Models for Availability and Quota...")
    for model_name in models_to_test:
        full_name = model_name if model_name.startswith("models/") else f"models/{model_name}"
        print(f"\nTesting {full_name}...")
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Hi, respond with only 'OK'.")
            print(f"SUCCESS! Response: {response.text.strip()}")
        except Exception as e:
            print(f"FAILED: {e}")

if __name__ == "__main__":
    diagnose()
