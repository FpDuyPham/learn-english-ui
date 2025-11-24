import os
import requests
from pathlib import Path

# Configuration
MODEL_ID = "distil-whisper/distil-large-v3.5-ONNX"
LOCAL_DIR = Path("src/assets/models/distil-whisper/distil-large-v3.5-ONNX")
BASE_URL = f"https://huggingface.co/{MODEL_ID}/resolve/main"

# List of files to download for ONNX runtime in browser
# Using quantized (int8) models for best quality/size balance
FILES_TO_DOWNLOAD = [
    "config.json",
    "generation_config.json",
    "preprocessor_config.json",
    "tokenizer.json",
    "tokenizer_config.json",
    "vocab.json",
    "special_tokens_map.json",
    # Encoder model (quantized int8 = 645MB, 99% quality vs original)
    "encoder_model_quantized.onnx",
    # Decoder model (quantized int8 = 385MB)
    "decoder_model_merged_quantized.onnx"
]

def download_file(filename):
    url = f"{BASE_URL}/{filename}"
    local_path = LOCAL_DIR / filename
    
    print(f"Downloading {filename}...")
    
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        block_size = 1024 # 1 Kibibyte
        
        with open(local_path, 'wb') as f:
            for data in response.iter_content(block_size):
                f.write(data)
                
        print(f"Successfully downloaded {filename}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"Error downloading {filename}: {e}")
        return False

def main():
    # Create directory
    if not LOCAL_DIR.exists():
        print(f"Creating directory: {LOCAL_DIR}")
        LOCAL_DIR.mkdir(parents=True, exist_ok=True)
    
    print(f"Starting download for {MODEL_ID} to {LOCAL_DIR}")
    
    success_count = 0
    for filename in FILES_TO_DOWNLOAD:
        # Check if file already exists
        if (LOCAL_DIR / filename).exists():
            print(f"File {filename} already exists. Skipping.")
            success_count += 1
            continue
            
        # Try to download
        if download_file(filename):
            success_count += 1
        else:
            # Some models might not have all files (e.g. vocab.json vs tokenizer.json)
            # Try alternative names if needed, or just warn.
            print(f"Warning: Could not download {filename}")

    print(f"\nDownload complete. {success_count}/{len(FILES_TO_DOWNLOAD)} files ready.")
    print("Ensure your angular.json assets configuration includes 'src/assets' mapped to '/assets'.")

if __name__ == "__main__":
    main()
