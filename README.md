<p align="center">
  <img src="logo.svg" width="84" alt="ORBITA Logo" />
</p>

# 🛰️ Project ORBITA — 3D Orbital Command & Voice Satellite Inspector

![Live App](https://img.shields.io/badge/Live%20App-Vercel%20Production-7fa38d?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-v3.3%20Clay%20HUD-c88a65?style=for-the-badge)
![Engine](https://img.shields.io/badge/Engine-Three.js%20%7C%20SGP4%20%7C%20Web%20Speech%20AI-181b22?style=for-the-badge)

> **Live App:** **[orbitaproject1.vercel.app](https://orbitaproject1.vercel.app)**  
> **Project ORBITA** is an interactive, distraction-free 3D satellite tracking and orbital intelligence command center built with a matte dark Claymorphism UI, SGP4 orbital mechanics, live OSINT feeds, and a two-way conversational Voice AI assistant.

---

## 🖥️ Interface & How It Works

- **Clean Space Canvas:** Opens directly to a photorealistic 3D Earth with real continents, 8 active Ground Stations (ISRO, NASA, ESA, JAXA), and 135+ 3D solar-winged satellites orbiting in real time—with zero screen clutter.
- **Collapsible Side Clay Icon Dock:** All controls stay neatly tucked into 5 tactile icons on the left (`🛰️`, `📡`, `🌐`, `💬`, `⌨️`). Click any icon to open its drawer, and click again (or press `Esc`) to close it.

---

## 🎙️ Voice AI Talking Commands (`🎙️ Talk [V]`)

Click **`🎙️ Talk [V]`** at the bottom-left (or open the **`💬`** chat drawer to type) and speak naturally in **English or Hinglish**:

| Category | Voice / Chat Commands (Say or Type) | What ORBITA Does |
| :--- | :--- | :--- |
| **Greetings** | *"Hello Orbita"*, *"Hi"*, *"Kaise ho"* | Greets you and reports the total number of live satellites tracked |
| **Filter Constellations** | *"Show all ISRO satellites"*, *"ISRO dikhao"*, *"Show Starlink"*, *"Show GPS"*, *"Show all satellites"* | Filters satellites both in the drawer list and on the 3D globe |
| **Track Satellites** | *"Track ISS"*, *"Track NavIC"*, *"Track Cartosat"*, *"Track Oceansat"*, or say any satellite name | Locks onto the satellite and highlights its 90-minute orbit trajectory |
| **Live Location** | *"Where is ISS?"*, *"ISS kahan hai?"*, *"Which country is it over?"* | Speaks the exact country or ocean currently overhead and its speed |
| **Mission Details** | *"What does it do?"*, *"Satellite details"*, *"Ye satellite kya karta hai?"* | Explains the operating agency and payload capabilities |
| **`VIEW MAX` & Camera** | *"View Max"*, *"Inspect"*, *"Close up"*, *"Exit"* | Flies camera up close to the 3D satellite and opens its intelligence dossier |
| **Navigation & Lock** | *"Focus on India"*, *"India dikhao"*, *"Next satellite"*, *"Lock orbit"*, *"Unlock orbit"* | Centers the globe on India, cycles targets, or freezes/resumes rotation |
| **Live OSINT Layers** | *"Show earthquakes"*, *"Bhukamp dikhao"*, *"Show flights"* | Overlays live USGS M4.5+ earthquakes or India sector air traffic |

---

## 🧭 Step-by-Step User Guide

1. **Filter & Search Satellites (`🛰️` Icon):**
   - Click the top **`🛰️`** icon on the left dock and use the **`ALL`**, **`ISRO`**, **`STARLINK`**, or **`GPS`** tabs to filter constellations, or search by satellite name / NORAD ID.
2. **Select a Satellite & Check Live Location:**
   - Click any 3D satellite directly on the globe (or from the list) to view its **Overhead Country/Ocean**, **Altitude (km)**, **Velocity (km/s)**, **Coordinates**, and active **Ground Station RF Link**.
3. **3D Close-Up Inspection (`VIEW MAX`):**
   - Click **`⛶ VIEW MAX (3D INSPECT)`** or press **`M`** to zoom right beside the spacecraft in orbit and read its complete technical dossier.

---

## ⌨️ Keyboard & Mouse Shortcuts

- **360° Rotate Earth:** `W` `A` `S` `D` / Arrow Keys / Mouse Drag
- **Zoom In / Out:** `+` / `-` / Mouse Scroll
- **Quick Satellites:** `1` (ISS), `2` (NavIC), `3` (Cartosat-3), `4` (EOS-06)
- **Cycle Targets:** `N` (Next) / `P` (Previous) / Click 3D Satellite
- **Focus India:** `I` | **`VIEW MAX`:** `M` | **Voice AI:** `V` | **Lock Orbit:** `Space`

---

## 📁 Project Files

```text
ORBITA_Project/
├── index.html      # Modular HUD & collapsible Clay drawer layout
├── style.css       # Matte dark Claymorphism & deep space styling
├── app.js          # Three.js globe, SGP4 orbital mechanics, Voice AI & OSINT
├── logo.svg        # Custom vector emblem & browser favicon
├── vercel.json     # Vercel production routing configuration
└── README.md       # Project documentation, voice commands & user guide
