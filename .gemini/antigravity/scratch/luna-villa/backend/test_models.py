import google.generativeai as genai
from config import settings

def test_models():
    genai.configure(api_key=settings.GEMINI_API_KEY)
    models = [
        "gemini-2.5-flash",
        "gemini-flash-latest",
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.0-pro"
    ]
    
    for m in models:
        print(f"Testing {m}...")
        try:
            model = genai.GenerativeModel(m)
            response = model.generate_content("Respond with 'OK'")
            print(f"  Result: SUCCESS -> {response.text.strip()}")
        except Exception as e:
            print(f"  Result: FAILED -> {e}")

if __name__ == "__main__":
    test_models()
