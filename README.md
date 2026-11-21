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

## 🚧 Ongoing Project Status & Roadmap

This project is **currently under active development**.

- [x] Real-time Hand Gesture Recognition (OpenCV + MediaPipe)
- [x] FastAPI WebSocket Bridge to 3D Three.js Globe
- [x] AR Camera Background Overlay
- [x] Live ISS API Integration & India Sector Satellites
- [ ] Full TLE (Two-Line Element) Live Orbit Calculation for 100+ Satellites
- [ ] Voice Command Integration (JARVIS-style assistant)
- [ ] Cloud Deployment & Performance Optimization

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
