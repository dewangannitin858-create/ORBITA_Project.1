import cv2
import mediapipe as mp
import math

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(max_num_hands=2, min_detection_confidence=0.7)
cap = cv2.VideoCapture(0)
window_name = "ORBITA - Final Core Gestures"

print("ORBITA VISION ONLINE: L-Shape = Zoom In | Open Palms = Zoom Out | Fist = Select")

def get_distance(p1, p2):
    return math.hypot(p1.x - p2.x, p1.y - p2.y)

# 1. L-Shape चेक (तर्जनी खड़ी, बाकी 3 उंगलियां मुड़ी हुई)
def is_l_shape(lm):
    return (lm[8].y < lm[6].y) and (lm[12].y > lm[10].y) and (lm[16].y > lm[14].y) and (lm[20].y > lm[18].y)

# 2. Open Palm चेक (चारों उंगलियां खड़ी / खुली हुई)
def is_open_palm(lm):
    return (lm[8].y < lm[6].y) and (lm[12].y < lm[10].y) and (lm[16].y < lm[14].y) and (lm[20].y < lm[18].y)

# 3. Fist चेक (मुट्ठी बंद - चारों उंगलियां मुड़ी हुई)
def is_fist(lm):
    return (lm[8].y > lm[6].y) and (lm[12].y > lm[10].y) and (lm[16].y > lm[14].y) and (lm[20].y > lm[18].y)

while True:
    success, img = cap.read()
    if not success:
        break

    img = cv2.flip(img, 1)
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb_img)

    black_color = (0, 0, 0) # सॉलिड ब्लैक टेक्स्ट
    global_action = None

    if results.multi_hand_landmarks:
        # अगर 2 हाथ स्क्रीन पर हैं (Zoom In / Zoom Out के लिए)
        if len(results.multi_hand_landmarks) == 2:
            lm1 = results.multi_hand_landmarks[0].landmark
            lm2 = results.multi_hand_landmarks[1].landmark
            
            # दोनों हाथों के बीच की दूरी (कलाई के पास वाले पॉइंट से नाप रहे हैं)
            hands_distance = get_distance(lm1[0], lm2[0])

            # कंडीशन A: दोनों हाथ L-Shape में हैं
            if is_l_shape(lm1) and is_l_shape(lm2):
                if hands_distance > 0.35: # हाथ दूर जा रहे हैं
                    global_action = "ZOOM IN (L-SHAPE EXPAND)"
                else:
                    global_action = "L-SHAPE DETECTED (READY TO ZOOM IN)"
                    
            # कंडीशन B: दोनों हाथ Open Palm (खुले) हैं
            elif is_open_palm(lm1) and is_open_palm(lm2):
                if hands_distance < 0.35: # हाथ पास आ रहे हैं
                    global_action = "ZOOM OUT (PALMS CLOSING)"
                else:
                    global_action = "OPEN PALMS DETECTED (READY TO ZOOM OUT)"

            # अगर कोई ग्लोबल टू-हैंड एक्शन हो रहा है, तो स्क्रीन पर दिखाओ
            if global_action:
                cv2.putText(img, global_action, (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, black_color, 3)

        # सिंगल हाथ वाले एक्शन्स (Select / Scan) - हर हाथ के लिए अलग-अलग
        for i, hand_landmarks in enumerate(results.multi_hand_landmarks):
            mp_drawing.draw_landmarks(img, hand_landmarks, mp_hands.HAND_CONNECTIONS)
            lm = hand_landmarks.landmark
            
            # अगर ग्लोबल ज़ूम चल रहा है, तो सिंगल हाथ वाले कमांड छुप जाएंगे
            if global_action:
                continue
                
            gesture = "SCANNING..."
            
            # कंडीशन C: मुट्ठी बंद है (Select)
            if is_fist(lm):
                gesture = "FIST: SELECT / ACTION"
            
            text_y = 50 + (i * 40)
            cv2.putText(img, f"Hand {i+1}: {gesture}", (20, text_y), cv2.FONT_HERSHEY_SIMPLEX, 0.8, black_color, 2)

    cv2.imshow(window_name, img)

    # बाहर निकलने के लिए
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
    if cv2.getWindowProperty(window_name, cv2.WND_PROP_VISIBLE) < 1:
        break

cap.release()
cv2.destroyAllWindows()