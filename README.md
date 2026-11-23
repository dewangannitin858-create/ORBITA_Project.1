# 🛰️ Project ORBITA — AR Holographic Satellite Command & OSINT HUD

![Status](https://img.shields.io/badge/Status-Ongoing%20%2F%20In%20Development-00f0ff?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-FastAPI%20%7C%20OpenCV%20%7C%20MediaPipe-blue?style=for-the-badge)
![Frontend](https://img.shields.io/badge/Frontend-Three.js%20%7C%20WebSockets-black?style=for-the-badge)

> **Project ORBITA** is an interactive, Iron Man–inspired Augmented Reality (AR) 3D satellite tracking and OSINT interface controlled completely through real-time hand gestures.

---

## 🎯 Project Target & Vision

The goal of **Project ORBITA** is to bridge Computer Vision, 3D Web Graphics, and real-time orbital telemetry into a single touchless command interface:
- **Touchless AR Interaction:** Overlay a 3D holographic Earth directly onto a live camera feed, controlled via hand gestures (Zoom In/Out, Orbit Lock, and Satellite Switching).
- **Real-Time Satellite Tracking:** Track live orbital assets including the **International Space Station (ISS)** via live API, alongside Indian regional satellites (**NAVIC-1G**, **CARTOSAT-3**, **INSAT-3D**) and LEO constellations.
- **Tactical HUD Experience:** Provide a clean, dark-themed telemetry dashboard displaying live coordinates, altitude, velocity, and tracking status.

---

## 🛠️ Tech Stack

- **Backend & Vision Engine:** Python, FastAPI, Uvicorn, OpenCV, MediaPipe (Hands)
- **Real-Time Communication:** WebSockets (`/ws`) & MJPEG Live Video Streaming (`/video_feed`)
- **Frontend & 3D Rendering:** HTML5, CSS3, JavaScript, Three.js
- **Live Data:** Where The ISS At? API

---

## 🖐️ Gesture Controls

| Gesture | Action |
| :--- | :--- |
| **Two-Hand L-Shape (Move Apart)** | Zoom In |
| **Two-Hand Open Palms (Move Close)** | Zoom Out |
| **Closed Fist** | Lock / Unlock Earth Rotation |
| **Thumb + Finger Pinch (1–4)** | Switch Active Satellite (`ISS`, `NAVIC`, `CARTOSAT`, `INSAT`) |
| **Keyboard Backup (`1-4`, `+`, `-`, `Space`)** | Manual Presentation Control |

---

## 🗺️ Project Roadmap & Upgrade Phases

| Phase       | Focus Area                                    | Version | Status        |
| :---        | :---                                          | :---    | :---          |
| **Phase 1** | Core Foundation, Vision Engine & AR Prototype | `v1.0`  | ✅ Completed |
| **Phase 2** | Real Orbital TLE Data & 360° Hand Controls    | `v2.0`  | 🚧 Up Next   |
| **Phase 3** | JARVIS Voice Commands & Live OSINT Feeds      | `v3.0`  | ⏳ Planned   |
| **Phase 4** | Zero-Lag Browser Vision & Public Deployment   | `v4.0`  | ⏳ Planned   |

---

### ✅ Phase 1: Core Foundation & AR Prototype (`v1.0`)
- [x] Real-time Hand Gesture Recognition (OpenCV + MediaPipe)
- [x] FastAPI WebSocket Bridge (`/ws`) to 3D Three.js Globe
- [x] Live AR Camera Background Overlay (`/video_feed`)
- [x] Live ISS API Integration & India Sector Satellites (`NAVIC-1G`, `CARTOSAT-3`, `INSAT-3D`)
- [x] Gesture Controls (Zoom In/Out, Orbit Lock, Satellite Switching) + Keyboard Backup

### 🚧 Phase 2: Real Orbital Data & Smart Tracking (`v2.0`)
- [ ] Integrate real-time TLE data (`satellite.js` + CelesTrak) for 100+ live satellites (ISRO, Starlink, GPS)
- [ ] Highlight active satellite's live orbit path & ground track on the globe
- [ ] Add 360° hand-rotation gesture to spin the Earth freely
- [ ] Add quick "Focus on India" gesture & smooth camera transitions

### ⏳ Phase 3: JARVIS Voice & Live OSINT Feeds (`v3.0`)
- [ ] Browser-based Voice Commands (Web Speech API — e.g., *"Orbita, track ISS"*, *"Lock Orbit"*)
- [ ] Toggleable live OSINT layers (USGS Earthquake Alerts / OpenSky Live Flights)
- [ ] Interactive search & filter HUD for satellites and countries

### ⏳ Phase 4: Zero-Lag Architecture & Public Deployment (`v4.0`)
- [ ] Migrate Hand Tracking from Python to Frontend (MediaPipe JS) for zero-lag browser webcam access
- [ ] Performance optimization for low-end/CPU-only devices
- [ ] Live public deployment on Vercel / GitHub Pages

---

## 🚀 How to Run Locally

```bash
# 1. Clone the repository
git clone [https://github.com/dewangannitin858-create/ORBITA_Project.1.git](https://github.com/dewangannitin858-create/ORBITA_Project.1.git)
cd ORBITA_Project.1

# 2. Create & activate virtual environment
python -m venv venv
.\venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the server
python -m uvicorn main:app --host 127.0.0.1 --port 8000
