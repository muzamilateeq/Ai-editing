import os
import urllib.request

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(MODELS_DIR, exist_ok=True)

MODEL_URLS = {
    "FSRCNN_x4.pb": "https://raw.githubusercontent.com/Saafke/FSRCNN_Tensorflow/master/models/FSRCNN_x4.pb",
    "EDSR_x4.pb": "https://github.com/Saafke/EDSR_Tensorflow/raw/master/models/EDSR_x4.pb",
    "LapSRN_x8.pb": "https://github.com/fss2019/LapSRN/raw/master/models/LapSRN_x8.pb"
}

for name, url in MODEL_URLS.items():
    dest = os.path.join(MODELS_DIR, name)
    if not os.path.exists(dest) or os.path.getsize(dest) < 1000:
        print(f"Downloading AI Super-Resolution Model: {name}...")
        try:
            urllib.request.urlretrieve(url, dest)
            print(f"Successfully downloaded {name} ({os.path.getsize(dest)} bytes)")
        except Exception as e:
            print(f"Failed to download {name}: {e}")
    else:
        print(f"Model {name} already present.")
