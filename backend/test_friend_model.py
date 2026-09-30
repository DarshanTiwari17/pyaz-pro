"""
Test script for friend's onion detection model API.
Usage: python test_friend_model.py
- Generates a test onion image
- Sends it to friend's model API
- Prints the response format
- Verifies it's compatible with PYAAZ backend
"""

import asyncio
import aiohttp
import cv2
import numpy as np
import json

# ============================================================
# CONFIGURATION: Replace with your friend's actual API URL
# ============================================================
FRIEND_MODEL_URL = "http://YOUR_FRIEND_COMPUTER_IP:8000/predict"

# For local testing, you can use:
# FRIEND_MODEL_URL = "http://127.0.0.1:8000/predict"  # if running locally


async def test_friend_model():
    """Test the friend's model API with a generated onion image."""
    
    # Step 1: Generate a test onion image
    print("=" * 60)
    print("Step 1: Generating test onion image...")
    
    # Create a realistic onion tray image with multiple bulbs
    img = np.full((1080, 1920, 3), (240, 243, 246), dtype=np.uint8)
    
    # Draw multiple onion bulbs with different classifications
    onion_positions = [
        # (x, y, color_bgr, class_name)
        (350, 350, (60, 80, 180), "Healthy"),      # Healthy bulb
        (700, 340, (65, 85, 190), "Healthy"),      # Healthy bulb  
        (1050, 360, (40, 140, 60), "Rotten"),      # Rotten bulb
        (1400, 330, (70, 90, 195), "Damaged"),     # Damaged bulb
        (360, 720, (60, 80, 180), "Sprouted"),     # Sprouted bulb
        (720, 730, (20, 30, 45), "Undersized"),    # Undersized bulb
        (1080, 710, (55, 75, 175), "Healthy"),     # Healthy bulb
        (1420, 740, (70, 90, 195), "Healthy"),    # Healthy bulb
    ]
    
    for x, y, color, class_name in onion_positions:
        cv2.circle(img, (x, y), 110, color, -1)
        cv2.circle(img, (x, y), 110, (40, 50, 60), 3)
    
    # Encode as JPEG
    success, buffer = cv2.imencode('.jpg', img)
    if not success:
        print("❌ Failed to encode image")
        return
    
    image_bytes = buffer.tobytes()
    print(f"   Generated image: {img.shape[1]}x{img.shape[0]} pixels")
    
    # Step 2: Send to friend's model API
    print("\nStep 2: Sending to friend's model API...")
    print(f"   URL: {FRIEND_MODEL_URL}")
    print(f"   Params: confidence=0.25, image_size=640, include_annotated=true")
    
    try:
        async with aiohttp.ClientSession() as session:
            # Multipart form data
            data = aiohttp.FormData()
            data.add_field(
                'file',
                image_bytes,
                filename='test_onion.jpg',
                content_type='image/jpeg'
            )
            # Optional parameters
            data.add_field('confidence', '0.25')
            data.add_field('image_size', '640')
            
            print("   POSTing image...")
            async with session.post(FRIEND_MODEL_URL, data=data) as resp:
                status = resp.status
                print(f"   Response status: {status}")
                
                if status == 200:
                    response_data = await resp.json()
                    print("\n" + "=" * 60)
                    print("Step 3: Friend's Model Response")
                    print("=" * 60)
                    
                    # Pretty print the key fields
                    print(f"\n📊 Summary:")
                    if "summary" in response_data:
                        summary = response_data["summary"]
                        print(f"   Total bulbs: {summary.get('total', 'N/A')}")
                        print(f"   Healthy: {summary.get('healthy', 'N/A')}")
                        print(f"   Rotten: {summary.get('rotten', 'N/A')}")
                        print(f"   Damaged: {summary.get('damaged', 'N/A')}")
                        print(f"   Sprouted: {summary.get('sprouted', 'N/A')}")
                        print(f"   Undersized: {summary.get('undersized', 'N/A')}")
                    
                    print(f"\n🎯 Grade Classification:")
                    if "recommended_grade" in response_data:
                        grade = response_data["recommended_grade"]
                        print(f"   Recommended: {grade}")
                    
                    if "grade_a_percentage" in response_data:
                        g_a = response_data["grade_a_percentage"]
                        print(f"   Grade A %: {g_a}%")
                    
                    if "urs_percentage" in response_data:
                        u_s = response_data["urs_percentage"]
                        print(f"   URS %: {u_s}%")
                    
                    print(f"\n🔍 Detections:")
                    if "detections" in response_data:
                        detections = response_data["detections"]
                        print(f"   Number of detections: {len(detections)}")
                        for i, det in enumerate(detections[:3]):  # Show first 3
                            cls = det.get("class_name", "N/A")
                            conf = det.get("confidence", "N/A")
                            bbox = det.get("bbox", "N/A")
                            diam = det.get("diameter_mm", "N/A")
                            print(f"   Bulb {i+1}: {cls} (conf={conf:.2f}, bbox={bbox}, diameter={diam}mm)")
                        
                        if len(detections) > 3:
                            print(f"   ... and {len(detections) - 3} more bulbs")
                    
                    print(f"\n📸 Image Quality:")
                    if "image_quality" in response_data:
                        q = response_data["image_quality"]
                        print(f"   Status: {q.get('status', 'N/A')}")
                        print(f"   Blur score: {q.get('blur_score', 'N/A')}")
                        print(f"   Brightness: {q.get('brightness_score', 'N/A')}")
                        print(f"   Exposure: {q.get('exposure_score', 'N/A')}")
                    
                    print(f"\n⏱️ Inference Time:")
                    if "inference_time_ms" in response_data:
                        print(f"   Time: {response_data['inference_time_ms']}ms")
                    
                    # ============================================================
                    # ✅ COMPATIBILITY CHECK: Verify PYAAZ format
                    # ============================================================
                    print("\n" + "=" * 60)
                    print("🔍 PYAAZ COMPATIBILITY CHECK")
                    print("=" * 60)
                    
                    compatibility = True
                    
                    # Check required fields
                    required_pyaaz = ["detections", "summary", "recommended_grade", 
                                     "grade_a_percentage", "urs_percentage", "image_quality"]
                    
                    for field in required_pyaaz:
                        if field in response_data:
                            print(f"   ✅ Has PYAAZ field: {field}")
                        else:
                            print(f"   ❌ Missing PYAAZ field: {field}")
                            compatibility = False
                    
                    # Check detection format
                    if "detections" in response_data:
                        det = response_data["detections"]
                        if det:
                            first_det = det[0]
                            det_fields = ["class_name", "confidence", "bbox", "diameter_mm"]
                            for f in det_fields:
                                if f in first_det:
                                    print(f"   ✅ Detection has field: {f}")
                                else:
                                    print(f"   ⚠️ Detection missing field: {f}")
                                    compatibility = False
                    
                    # Check image quality format
                    if "image_quality" in response_data:
                        q = response_data["image_quality"]
                        q_fields = ["status", "blur_score", "brightness_score", "exposure_score"]
                        for f in q_fields:
                            if f in q:
                                print(f"   ✅ Image quality has field: {f}")
                            else:
                                print(f"   ⚠️ Image quality missing field: {f}")
                    
                    if compatibility:
                        print("\n🎉 ALL CHECKS PASSED - Compatible with PYAAZ backend!")
                    else:
                        print("\n⚠️ Some fields missing - may need format adjustment")
                    
                    return response_data
                    
                else:
                    print(f"❌ Error: Status {status}")
                    error_text = await resp.text()
                    print(f"   Error details: {error_text[:200]}")
                    return None
    
    except aiohttp.ClientConnectorError as e:
        print(f"\n❌ Connection Error: Could not connect to {FRIEND_MODEL_URL}")
        print("   - Is friend's model API running?")
        print("   - Is the correct IP/port used?")
        print("   - Try: python -m uvicorn api:app --host 0.0.0.0 --port 8000")
        return None
    except Exception as e:
        print(f"\n❌ Unexpected error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("FRIEND'S MODEL API TEST")
    print("=" * 60 + "\n")
    
    # Show config
    print(f"Friend Model URL: {FRIEND_MODEL_URL}")
    print("(Replace this with your friend's actual API URL)\n")
    
    # Run the test
    result = asyncio.run(test_friend_model())
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Replace FRIEND_MODEL_URL with your friend's actual API URL")
    print("2. Run: python test_friend_model.py")
    print("3. If successful, integrate with PYAAZ using the pattern shown")
    print("4. Modify app/api/inspections.py to use external model")