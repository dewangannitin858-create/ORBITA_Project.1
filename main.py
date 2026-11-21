import cv2
import mediapipe as mp
import math
import threading
import asyncio
import os
import time
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse, StreamingResponse

app = FastAPI()
current_gesture = "STANDBY"
latest_frame = None

def get_distance(p1, p2):
    return math.hypot(p1.x - p2.x, p1.y - p2.y)

def is_l_shape(lm):
    return (lm[8].y < lm[6].y) and (lm[12].y > lm[10].y) and (lm[16].y > lm[14].y) and (lm[20].y > lm[18].y)

def is_open_palm(lm):
    return (lm[8].y < lm[6].y) and (lm[12].y < lm[10].y) and (lm[16].y < lm[14].y) and (lm[20].y < lm[18].y)

def is_fist(lm):
    return (lm[8].y > lm[6].y) and (lm[12].y > lm[10].y) and (lm[16].y > lm[14].y) and (lm[20].y > lm[18].y)

def camera_loop():
    global current_gesture, latest_frame
    print("\n[SYSTEM LOG] Starting ORBITA AR Vision Engine...")
    try:
        mp_hands = mp.solutions.hands
        mp_drawing = mp.solutions.drawing_utils
        hands = mp_hands.Hands(max_num_hands=2, min_detection_confidence=0.7)
        cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

        if not cap.isOpened():
            print("[CRITICAL ERROR] Camera open nahi hua! Privacy shutter ya dusra app check karo.")
            return

        print("[SYSTEM LOG] AR Camera Stream ONLINE! (Browser mein dikhega)\n")
        pinch_threshold = 0.045

        while True:
            success, img = cap.read()
            if not success:
                continue

            img = cv2.flip(img, 1)
            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb_img)

            detected = "STANDBY"

            if results.multi_hand_landmarks:
                # Haath par halki cyan Sci-Fi lines draw karo
                for hand_landmarks in results.multi_hand_landmarks:
                    mp_drawing.draw_landmarks(
                        img, hand_landmarks, mp_hands.HAND_CONNECTIONS,
                        mp_drawing.DrawingSpec(color=(255, 255, 0), thickness=2, circle_radius=2),
                        mp_drawing.DrawingSpec(color=(255, 200, 0), thickness=1)
                    )

                # 1. Two-Hand Zoom Controls
                if len(results.multi_hand_landmarks) == 2:
                    lm1 = results.multi_hand_landmarks[0].landmark
                    lm2 = results.multi_hand_landmarks[1].landmark
                    hands_dist = get_distance(lm1[0], lm2[0])

                    if is_l_shape(lm1) and is_l_shape(lm2) and hands_dist > 0.32:
                        detected = "ZOOM_IN"
                    elif is_open_palm(lm1) and is_open_palm(lm2) and hands_dist < 0.35:
                        detected = "ZOOM_OUT"

                # 2. Single-Hand Controls
                if detected == "STANDBY":
                    lm = results.multi_hand_landmarks[0].landmark
                    thumb = lm[4]

                    if is_fist(lm):
                        detected = "LOCK"
                    elif get_distance(thumb, lm[8]) < pinch_threshold:
                        detected = "SAT_ISS"
                    elif get_distance(thumb, lm[12]) < pinch_threshold:
                        detected = "SAT_NAVIC"
                    elif get_distance(thumb, lm[16]) < pinch_threshold:
                        detected = "SAT_CARTOSAT"
                    elif get_distance(thumb, lm[20]) < pinch_threshold:
                        detected = "SAT_INSAT"

            current_gesture = detected

            # Frame ko JPEG mein convert karke browser stream ke liye save karo
            ret, buffer = cv2.imencode('.jpg', img, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            if ret:
                latest_frame = buffer.tobytes()

        cap.release()
    except Exception as e:
        print(f"[CRITICAL THREAD ERROR] {e}")

def generate_frames():
    while True:
        if latest_frame is not None:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + latest_frame + b'\r\n')
        time.sleep(0.03)

@app.on_event("startup")
async def startup_event():
    threading.Thread(target=camera_loop, daemon=True).start()

@app.get("/video_feed")
async def video_feed():
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/")
async def get():
    for path in ("index.html", "static/index.html"):
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return HTMLResponse(f.read())
    return HTMLResponse("<h1 style='color:red;'>index.html not found!</h1>")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_text(current_gesture)
            await asyncio.sleep(0.05)
    except:
        pass