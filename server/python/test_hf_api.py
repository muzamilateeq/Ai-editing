import requests
import json

# Public Hugging Face Free Inference Models for Super-Resolution
HF_MODELS = [
    "caidas/swin2SR-classical-sr-x4-64",
    "eugenesiow/super-resolution",
    "stabilityai/stable-diffusion-x4-upscaler"
]

print("Testing Hugging Face Free Inference Models...")
for model in HF_MODELS:
    url = f"https://api-inference.huggingface.co/models/{model}"
    try:
        r = requests.get(url, timeout=5)
        print(f"Model {model}: HTTP Status {r.status_code}")
    except Exception as e:
        print(f"Model {model} test error: {e}")
