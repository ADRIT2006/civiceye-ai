import os
import re
import base64
import uuid
import numpy as np
import cv2
from PIL import Image
import io

from datetime import datetime

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
BEFORE_DIR = os.path.join(UPLOAD_DIR, "before")
AFTER_DIR = os.path.join(UPLOAD_DIR, "after")
HEATMAP_DIR = os.path.join(UPLOAD_DIR, "heatmaps")
ISSUES_DIR = os.path.join(UPLOAD_DIR, "issues")

os.makedirs(BEFORE_DIR, exist_ok=True)
os.makedirs(AFTER_DIR, exist_ok=True)
os.makedirs(HEATMAP_DIR, exist_ok=True)
os.makedirs(ISSUES_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB

def detect_image_extension(data: bytes, fallback_filename: str = "") -> str:
    """Detects clean extension from file magic bytes or PIL format."""
    ext = os.path.splitext(fallback_filename.lower())[1]
    if ext in ALLOWED_EXTENSIONS:
        return ".jpg" if ext == ".jpeg" else ext

    # Magic bytes check
    if data.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    elif data.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    elif data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        return ".webp"

    try:
        with Image.open(io.BytesIO(data)) as img:
            fmt = img.format.lower()
            if fmt == "jpeg":
                return ".jpg"
            elif fmt in ["png", "webp"]:
                return f".{fmt}"
    except Exception:
        pass

    raise ValueError("Invalid file format. Supported image types: .jpg, .jpeg, .png, .webp")

def save_uploaded_photo(file_bytes: bytes, original_filename: str = "upload.jpg") -> str:
    """
    Validates and securely stores an uploaded issue photo in uploads/issues/{year}/{uuid}.{ext}.
    Returns relative URL reference (e.g. /uploads/issues/2026/uuid.jpg).
    """
    if not file_bytes:
        raise ValueError("Uploaded file is empty.")

    if len(file_bytes) > MAX_FILE_SIZE:
        raise ValueError("File size exceeds 15 MB limit.")

    ext = detect_image_extension(file_bytes, original_filename)

    year = datetime.utcnow().year
    year_dir = os.path.join(ISSUES_DIR, str(year))
    os.makedirs(year_dir, exist_ok=True)

    filename = f"{uuid.uuid4().hex[:16]}{ext}"
    file_path = os.path.join(year_dir, filename)

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    return f"/uploads/issues/{year}/{filename}"

def save_base64_image(base64_str: str, folder: str = "issues") -> str:
    """Decodes a base64 image data URL and saves it to disk, returning the relative URL."""
    if not base64_str:
        return ""
    
    inferred_ext = ".jpg"
    if "data:image/png" in base64_str:
        inferred_ext = ".png"
    elif "data:image/webp" in base64_str:
        inferred_ext = ".webp"

    # Remove header if present (e.g. data:image/jpeg;base64,)
    if "," in base64_str:
        base64_str = base64_str.split(",", 1)[1]
        
    try:
        img_data = base64.b64decode(base64_str)
    except Exception as e:
        raise ValueError("Failed to decode base64 image data.") from e

    if len(img_data) > MAX_FILE_SIZE:
        raise ValueError("Image data exceeds 15 MB limit.")

    try:
        ext = detect_image_extension(img_data, f"photo{inferred_ext}")
    except ValueError:
        ext = inferred_ext

    year = datetime.utcnow().year
    if folder == "issues":
        target_dir = os.path.join(ISSUES_DIR, str(year))
        os.makedirs(target_dir, exist_ok=True)
        filename = f"{uuid.uuid4().hex[:16]}{ext}"
        file_path = os.path.join(target_dir, filename)
        with open(file_path, "wb") as f:
            f.write(img_data)
        return f"/uploads/issues/{year}/{filename}"
    else:
        target_dir = BEFORE_DIR if folder == "before" else (AFTER_DIR if folder == "after" else HEATMAP_DIR)
        os.makedirs(target_dir, exist_ok=True)
        filename = f"{uuid.uuid4().hex[:12]}{ext}"
        file_path = os.path.join(target_dir, filename)
        with open(file_path, "wb") as f:
            f.write(img_data)
        return f"/uploads/{folder}/{filename}"

def load_image_cv2(image_path_or_url: str):
    """Loads an image into OpenCV format from relative URL or file path."""
    if not image_path_or_url:
        return None
    
    if image_path_or_url.startswith("/uploads/"):
        # relative url
        rel_path = image_path_or_url.lstrip("/")
        base_backend = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        full_path = os.path.join(base_backend, rel_path)
    else:
        full_path = image_path_or_url
        
    if not os.path.exists(full_path):
        return None
        
    return cv2.imread(full_path)

def compute_dhash(image, hash_size=8) -> int:
    """Computes difference hash (dHash) for an OpenCV image."""
    if image is None:
        return 0
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    resized = cv2.resize(gray, (hash_size + 1, hash_size))
    diff = resized[:, 1:] > resized[:, :-1]
    return sum([2 ** i for (i, v) in enumerate(diff.flatten()) if v])

def dhash_similarity(hash1: int, hash2: int, hash_size=8) -> float:
    """Returns 0.0 to 1.0 similarity between two hashes based on Hamming distance."""
    if hash1 == 0 or hash2 == 0:
        return 0.0
    max_bits = hash_size * hash_size
    diff_bits = bin(hash1 ^ hash2).count('1')
    return max(0.0, 1.0 - (diff_bits / max_bits))
