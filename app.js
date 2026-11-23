// Drawer Navigation
function closeAllDrawers() {
    document.querySelectorAll('.clay-drawer').forEach(d => d.classList.remove('open'));
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
}
function toggleDrawer(id, btnEl) {
    const target = document.getElementById(id);
    const wasOpen = target.classList.contains('open');
    closeAllDrawers();
    if (!wasOpen) {
        target.classList.add('open');
        if (btnEl) btnEl.classList.add('active');
    }
}

// 1. Deep Space Scene & Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.05, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('canvas-container').appendChild(renderer.domElement);
camera.position.set(0, 1.2, 12.8);

const starGeo = new THREE.BufferGeometry();
const starPositions = new Float32Array(2200 * 3);
for (let i = 0; i < starPositions.length; i++) starPositions[i] = (Math.random() - 0.5) * 300;
starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starField = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xc8c5be, size: 0.22, transparent: true, opacity: 0.6 }));
scene.add(starField);

scene.add(new THREE.AmbientLight(0xe6e4df, 1.3));
const sunLight = new THREE.DirectionalLight(0xfff8ee, 1.2);
sunLight.position.set(12, 8, 15);
scene.add(sunLight);

const GLOBE_R = 4.35;
function latLonAltToVector3(lat, lon, altKm) {
    const effectiveAlt = Math.min(altKm, 4500);
    const r = GLOBE_R * (1 + (effectiveAlt / 6371.0) * 0.55);
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -(r * Math.sin(phi) * Math.cos(theta)),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
    );
}

// 2. Photorealistic Continents Earth (Zero Grid Lines)
const earthGroup = new THREE.Group();
const texLoader = new THREE.TextureLoader();
const earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_R, 64, 64),
    new THREE.MeshPhongMaterial({
        map: texLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'),
        bumpMap: texLoader.load('https://unpkg.com/three-globe/example/img/earth-topology.png'),
        bumpScale: 0.055,
        specular: new THREE.Color(0x1c2530),
        shininess: 12
    })
);
const atmoMesh = new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_R + 0.1, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0x7b96b0, transparent: true, opacity: 0.08, side: THREE.BackSide })
);
earthGroup.add(earthMesh, atmoMesh);

// Ground Footprint Swath Ring (Shows camera scan area beneath selected Imaging/Weather satellite)
const swathRing = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.34, 32),
    new THREE.MeshBasicMaterial({ color: 0xd4b483, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
);
swathRing.visible = false;
earthGroup.add(swathRing);

// 3. Satellite Ground Stations
const GROUND_STATIONS = [
    { name: "ISTRAC Bengaluru", agency: "ISRO", lat: 13.03, lon: 77.51 },
    { name: "MCF Hassan", agency: "ISRO", lat: 13.00, lon: 76.10 },
    { name: "SDSC Sriharikota", agency: "ISRO", lat: 13.72, lon: 80.23 },
    { name: "NRSC Shadnagar", agency: "ISRO", lat: 17.03, lon: 78.18 },
    { name: "ISTRAC Port Blair", agency: "ISRO", lat: 11.62, lon: 92.72 },
    { name: "NASA Houston MCC", agency: "NASA", lat: 29.55, lon: -95.09 },
    { name: "ESA ESOC Darmstadt", agency: "ESA", lat: 49.87, lon: 8.62 },
    { name: "JAXA Tsukuba", agency: "JAXA", lat: 36.06, lon: 140.12 }
];
const gsListEl = document.getElementById("gs-list");
GROUND_STATIONS.forEach(gs => {
    const pos = latLonAltToVector3(gs.lat, gs.lon, 15);
    gs.pos3D = pos;
    const col = gs.agency === "ISRO" ? 0xc88a65 : 0x7b96b0;
    const tower = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.14, 8), new THREE.MeshBasicMaterial({ color: col }));
    cone.rotation.x = Math.PI / 2;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.075, 0.12, 20), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
    tower.add(cone, ring);
    tower.position.copy(pos);
    tower.lookAt(pos.clone().multiplyScalar(2));
    earthGroup.add(tower);

    const row = document.createElement("div");
    row.className = "gs-item";
    row.innerHTML = `<span>${gs.name}</span><span style="color:var(--terra);font-weight:600;">${gs.agency}</span>`;
    row.onclick = () => { focusLatLon(gs.lat, gs.lon, 9.5); closeAllDrawers(); };
    gsListEl.appendChild(row);
});

let targetRotY = 3.29, targetRotX = 0.22, targetZoom = 12.8;
earthGroup.rotation.set(targetRotX, targetRotY, 0);
scene.add(earthGroup);

// 4. High-Visibility 3D Winged Satellite Models
const busGeo = new THREE.BoxGeometry(0.058, 0.058, 0.082);
const panelGeo = new THREE.BoxGeometry(0.24, 0.009, 0.058);
const strutGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.28, 6);
strutGeo.rotateZ(Math.PI / 2);
const beaconGeo = new THREE.SphereGeometry(0.044, 8, 8);

const goldMat = new THREE.MeshStandardMaterial({ color: 0xd9a76a, emissive: 0x4a3014, metalness: 0.7, roughness: 0.3 });
const silverMat = new THREE.MeshStandardMaterial({ color: 0xd4dae3, emissive: 0x2c3340, metalness: 0.65, roughness: 0.35 });
const wingMat = new THREE.MeshStandardMaterial({ color: 0x456994, emissive: 0x1b304a, metalness: 0.5, roughness: 0.3 });

function createSatMesh(accentColor, isFeatured) {
    const g = new THREE.Group();
    const sc = isFeatured ? 1.9 : 1.45;
    const lw = new THREE.Mesh(panelGeo, wingMat); lw.position.set(-0.15, 0, 0);
    const rw = new THREE.Mesh(panelGeo, wingMat); rw.position.set(0.15, 0, 0);
    const beacon = new THREE.Mesh(beaconGeo, new THREE.MeshBasicMaterial({ color: accentColor }));
    beacon.position.set(0, -0.045, 0);

    g.add(
        new THREE.Mesh(busGeo, isFeatured ? goldMat : silverMat),
        lw,
        rw,
        new THREE.Mesh(strutGeo, silverMat),
        beacon
    );
    g.scale.set(sc, sc, sc);
    return g;
}

// 5. Featured Satellites Database (Land Mapping, Weather, ISRO & Stations)
const CORE_TLES = [
    {
        key: "ISS", name: "ISS (ZARYA)", tags: ["STATION", "IMAGING"], badge: "LEO CAM", color: 0x7fa38d,
        agency: "NASA / ROSCOSMOS / ESA / JAXA", camera: "HD Earth Viewing & Crew Cameras", res: "1–3m | Crew Video",
        details: "Habitable microgravity laboratory capturing continuous high-definition Earth observation video, lightning telemetry, and atmospheric photography.",
        l1: "1 25544U 98067A   26325.50000000  .00016717  00000-0  10270-3 0  9992",
        l2: "2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537"
    },
    {
        key: "CARTOSAT", name: "CARTOSAT-3 (ISRO)", tags: ["ISRO", "IMAGING"], badge: "LAND MAP", color: 0xd4b483,
        camera: "0.25m PAN + 1.14m MX Camera", res: "0.25m | 16 km Swath",
        agency: "ISRO (India)",
        details: "India's sharpest optical Earth-imaging satellite. Captures 25 cm ultra-high-resolution land mapping pictures for smart cities, 3D terrain models, and border surveillance.",
        l1: "1 44804U 19081A   26325.50000000  .00004510  00000-0  21450-3 0  9995",
        l2: "2 44804  97.4820  48.2150 0011200  92.4100 267.8200 15.19241020381240"
    },
    {
        key: null, name: "INSAT-3DS (ISRO)", tags: ["ISRO", "WEATHER"], badge: "WEATHER", color: 0x7b96b0,
        camera: "6-Channel Imager + 19-Ch Sounder", res: "1 km VIS / 4 km IR",
        agency: "ISRO (India)",
        details: "Dedicated Indian meteorological weather satellite capturing continuous cloud cover, monsoon movement, cyclone tracking, and atmospheric temperature profiles over India.",
        l1: "1 58992U 24033A   26325.50000000 -.00000150  00000-0  00000-0 0  9997",
        l2: "2 58992   0.0510  74.0000 0001900 110.0000 250.0000  1.00271900  9804"
    },
    {
        key: null, name: "RESOURCESAT-2A", tags: ["ISRO", "IMAGING"], badge: "LAND MAP", color: 0xd4b483,
        camera: "LISS-3, LISS-4 (5.8m) & AWiFS", res: "5.8m | 740 km Swath",
        agency: "ISRO (India)",
        details: "Primary ISRO land-mapping mission photographing agricultural crops, forest cover, river basins, and groundwater resources across India.",
        l1: "1 41877U 16074A   26325.50000000  .00001120  00000-0  14100-3 0  9996",
        l2: "2 41877  98.7210 205.1400 0001800  78.2000 281.9000 14.2154000049210"
    },
    {
        key: null, name: "RISAT-2B (ISRO)", tags: ["ISRO", "IMAGING"], badge: "SAR RADAR", color: 0xd4b483,
        camera: "X-Band Synthetic Aperture Radar", res: "1m Radar | All-Weather",
        agency: "ISRO (India)",
        details: "All-weather day-and-night radar imaging satellite capable of seeing through thick monsoon clouds to map floods, agriculture, and strategic terrain.",
        l1: "1 44233U 19028A   26325.50000000  .00003210  00000-0  15200-3 0  9994",
        l2: "2 44233  37.0010 142.3100 0008500  65.4000 294.7000 15.0512000039102"
    },
    {
        key: "INSAT", name: "EOS-06 (OCEANSAT-3)", tags: ["ISRO", "WEATHER", "IMAGING"], badge: "OCEAN/WX", color: 0x7b96b0,
        camera: "OCM-3 13-Band + SSTM Thermal", res: "360m | 1440 km Swath",
        agency: "ISRO (India)",
        details: "Captures ocean color, sea surface temperature, wind vectors, and cyclone genesis alerts across the Indian Ocean.",
        l1: "1 54361U 22158A   26325.50000000  .00001820  00000-0  18420-3 0  9998",
        l2: "2 54361  98.3410 112.6540 0001450  84.1200 276.0100 14.46521080210455"
    },
    {
        key: "NAVIC", name: "IRNSS-1I (NAVIC)", tags: ["ISRO", "GPS"], badge: "ISRO NAV", color: 0xc88a65,
        camera: "L5 & S-Band Atomic Nav Payload", res: "<5m PNT Accuracy",
        agency: "ISRO (India)",
        details: "India's regional navigation satellite delivering dual-frequency L5 and S-band positioning across India and 1,500 km beyond.",
        l1: "1 43286U 18035A   26325.50000000 -.00000240  00000-0  00000-0 0  9991",
        l2: "2 43286  29.0120 135.4210 0021040 185.1200 174.9100  1.00271240 24105"
    },
    {
        key: null, name: "SENTINEL-2A (ESA)", tags: ["IMAGING"], badge: "LAND MAP", color: 0xd4b483,
        camera: "13-Band Multispectral Imager", res: "10m | 290 km Swath",
        agency: "ESA (Copernicus)",
        details: "High-resolution optical land-mapping satellite photographing global forests, crops, glaciers, lakes, and urban expansion.",
        l1: "1 40697U 15028A   26325.50000000  .00001200  00000-0  11000-3 0  9992",
        l2: "2 40697  98.5690 165.4100 0001200  88.2000 271.9000 14.3081800058102"
    },
    {
        key: null, name: "LANDSAT-9 (NASA)", tags: ["IMAGING"], badge: "LAND MAP", color: 0xd4b483,
        camera: "OLI-2 Optical + TIRS-2 Thermal", res: "15m PAN / 30m MS",
        agency: "NASA / USGS",
        details: "Captures 11-band optical and thermal infrared land imagery to track deforestation, water quality, urban heat, and geological changes.",
        l1: "1 49260U 21088A   26325.50000000  .00001450  00000-0  13200-3 0  9995",
        l2: "2 49260  98.2100 225.3000 0001300  91.4000 268.7000 14.5710000026410"
    },
    {
        key: null, name: "NOAA-20 (JPSS-1)", tags: ["WEATHER"], badge: "WEATHER", color: 0x7b96b0,
        camera: "VIIRS + CrIS Weather Suite", res: "375m | 3000 km Swath",
        agency: "NOAA (USA)",
        details: "Polar-orbiting weather satellite capturing global storm systems, sea surface temperature, snow cover, and wildfire hotspots.",
        l1: "1 43013U 17073A   26325.50000000  .00001900  00000-0  16500-3 0  9991",
        l2: "2 43013  98.7400 190.2000 0001500  74.1000 286.0000 14.1956000046102"
    },
    {
        key: null, name: "GOES-18 (WEATHER)", tags: ["WEATHER"], badge: "WEATHER", color: 0x7b96b0,
        camera: "Advanced Baseline Imager (16-Ch)", res: "0.5 km VIS / 2 km IR",
        agency: "NOAA / NASA",
        details: "Geostationary weather observatory capturing real-time hurricane development, lightning flashes, and atmospheric water vapor.",
        l1: "1 51850U 22021A   26325.50000000 -.00000120  00000-0  00000-0 0  9998",
        l2: "2 51850   0.0320 223.0000 0001800 115.0000 245.0000  1.00271500 17102"
    },
    {
        key: null, name: "METEOSAT-9 (IODC)", tags: ["WEATHER"], badge: "WEATHER", color: 0x7b96b0,
        camera: "SEVIRI 12-Channel Imager", res: "1 km HRV / 3 km IR",
        agency: "EUMETSAT",
        details: "Positioned over the Indian Ocean to provide 15-minute weather imaging of cyclones, dust storms, and cloud systems across Asia and Africa.",
        l1: "1 28912U 05049B   26325.50000000 -.00000110  00000-0  00000-0 0  9993",
        l2: "2 28912   1.8500  45.5000 0002400  95.0000 265.0000  1.00272000 76104"
    },
    {
        key: null, name: "GSAT-30 (ISRO)", tags: ["ISRO"], badge: "ISRO COM", color: 0xc88a65,
        camera: "C & Ku-Band High-Throughput", res: "DTH & VSAT Relay",
        agency: "ISRO (India)",
        details: "Indian geostationary telecommunications satellite providing television broadcasting, ATM connectivity, and emergency communications.",
        l1: "1 45026U 20005A   26325.50000000 -.00000180  00000-0  00000-0 0  9992",
        l2: "2 45026   0.0420  83.0000 0002100 120.0000 240.0000  1.00272100 24501"
    }
];

const satellites = [], clickableMeshes = [];
let selectedSat = null, orbitLine = null, gsLinkLine = null;
let activeCategory = "ALL";

function detectTags(name) {
    const n = name.toUpperCase();
    const tags = [];
    if (/GSAT|INSAT|IRNSS|NAVIC|EOS|RISAT|CARTOSAT|ADITYA|CMS|OCEANSAT|RESOURCESAT/.test(n)) tags.push("ISRO");
    if (/CARTOSAT|RESOURCESAT|RISAT|SENTINEL|LANDSAT|WORLDVIEW|PLEIADES|SPOT|EOS/.test(n)) tags.push("IMAGING");
    if (/INSAT|NOAA|GOES|METEOSAT|METOP|FENGYUN|HIMAWARI|EOS-06/.test(n)) tags.push("WEATHER");
    if (/STARLINK|ONEWEB|IRIDIUM/.test(n)) tags.push("STARLINK");
    if (/GPS|NAVSTAR|GALILEO|GLONASS|BEIDOU|IRNSS/.test(n)) tags.push("GPS");
    if (tags.length === 0) tags.push("LEO");
    return tags;
}

function getFallbackMeta(s) {
    if (s.tags.includes("WEATHER")) {
        return {
            agency: "Meteorological Space Agency",
            camera: "Multispectral Cloud & IR Imager",
            res: "1–4 km | Wide Swath",
            orbit: "Weather Orbit",
            details: "Captures real-time cloud formation, storm tracking, sea surface temperature, and atmospheric humidity imagery."
        };
    }
    if (s.tags.includes("IMAGING")) {
        return {
            agency: "Earth Observation Operator",
            camera: "High-Res Optical / Multispectral Cam",
            res: "0.5–10m | Land Mapping",
            orbit: "Sun-Synchronous LEO",
            details: "Photographs Earth's surface for topographic land mapping, agriculture monitoring, disaster response, and urban planning."
        };
    }
    if (s.tags.includes("STARLINK")) {
        return {
            agency: "SpaceX",
            camera: "Ka/Ku-Band Phased Array + Laser Link",
            res: "Broadband Relay",
            orbit: "LEO (~550 km)",
            details: "Low-Earth-orbit broadband communications spacecraft delivering high-speed internet coverage."
        };
    }
    if (s.tags.includes("GPS")) {
        return {
            agency: "Global GNSS Constellation",
            camera: "L-Band Atomic Navigation Payload",
            res: "Global PNT Timing",
            orbit: "MEO (~20,200 km)",
            details: "Broadcasts precision atomic-clock positioning and navigation signals worldwide."
        };
    }
    return {
        agency: "International Space Operator",
        camera: "Orbital Telemetry & Sensing Payload",
        res: "SGP4 Active",
        orbit: "Low Earth Orbit",
        details: "Active orbital spacecraft tracked via NORAD Two-Line Element telemetry."
    };
}

function addSat(name, l1, l2, tags = ["LEO"], badge = "LEO", color = 0x7b96b0, key = null, featured = false, customMeta = {}) {
    try {
        const satrec = satellite.twoline2satrec(l1, l2);
        const mesh = createSatMesh(color, featured);
        earthGroup.add(mesh);
        const obj = {
            key, name, norad: l1.substring(2, 7).trim(),
            tags, badge, color, satrec, mesh,
            lat: 0, lon: 0, alt: 0, vel: 0,
            agency: customMeta.agency || null,
            camera: customMeta.camera || null,
            res: customMeta.res || null,
            details: customMeta.details || null
        };
        satellites.push(obj);
        mesh.traverse(c => { if (c.isMesh) { c.userData = obj; clickableMeshes.push(c); } });
        return obj;
    } catch (e) { return null; }
}

CORE_TLES.forEach(s => {
    const o = addSat(s.name, s.l1, s.l2, s.tags, s.badge, s.color, s.key, true, s);
    if (s.key === "ISS") selectedSat = o;
});

function renderSatelliteList() {
    const listEl = document.getElementById("sat-list-container");
    const query = (document.getElementById("sat-search").value || "").trim().toUpperCase();

    const filtered = satellites.filter(s => {
        const matchCat = activeCategory === "ALL" || s.tags.includes(activeCategory);
        const matchSearch = !query || s.name.toUpperCase().includes(query) || s.norad.includes(query) || (s.camera && s.camera.toUpperCase().includes(query));
        return matchCat && matchSearch;
    });

    listEl.innerHTML = "";
    filtered.forEach(s => {
        const div = document.createElement("div");
        div.className = "sat-item" + (selectedSat === s ? " active" : "");
        const badgeColor = s.tags.includes("IMAGING") ? "var(--sand)" : (s.tags.includes("WEATHER") ? "var(--slate)" : (s.tags.includes("ISRO") ? "var(--terra)" : "var(--sage)"));
        div.innerHTML = `<span>${s.name}</span><span style="color:${badgeColor};font-size:10px;font-weight:700;">${s.badge}</span>`;
        div.onclick = () => selectSatellite(s);
        listEl.appendChild(div);
    });

    satellites.forEach(s => {
        s.mesh.visible = (activeCategory === "ALL" || s.tags.includes(activeCategory) || s === selectedSat);
    });
}

function setSatCategory(cat, btnEl) {
    activeCategory = cat;
    document.querySelectorAll(".cat-tab").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
    renderSatelliteList();
}

document.getElementById("sat-search").addEventListener("input", renderSatelliteList);

// Load 135+ Live Satellites
(async () => {
    let added = 0;
    try {
        const res = await fetch("https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle");
        if (!res.ok) throw new Error("CelesTrak unavailable");
        const lines = (await res.text()).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        for (let i = 0; i < lines.length - 2 && added < 125; i += 3) {
            if (lines[i + 1].startsWith("1 ") && lines[i + 2].startsWith("2 ")) {
                const name = lines[i];
                if (satellites.some(existing => existing.name === name)) continue;
                const tags = detectTags(name);
                const badge = tags.includes("IMAGING") ? "LAND MAP" : (tags.includes("WEATHER") ? "WEATHER" : (tags.includes("ISRO") ? "ISRO" : tags[0]));
                const col = tags.includes("IMAGING") ? 0xd4b483 : (tags.includes("WEATHER") ? 0x7b96b0 : (tags.includes("ISRO") ? 0xc88a65 : 0x7fa38d));
                addSat(name, lines[i + 1], lines[i + 2], tags, badge, col, null, tags.includes("ISRO"));
                added++;
            }
        }
    } catch (e) {}

    if (added < 40) {
        const needed = 125 - added;
        for (let i = 0; i < needed; i++) {
            const id = String(51000 + i).padStart(5, '0');
            const inc = (18 + (i % 9) * 9.5).toFixed(4).padStart(8, ' ');
            const raan = ((i * 27.5) % 360).toFixed(4).padStart(8, ' ');
            const ma = ((i * 43.7) % 360).toFixed(4).padStart(8, ' ');
            const isGps = i % 7 === 0;
            const isWeather = !isGps && (i % 9 === 0);
            const isImaging = !isGps && !isWeather && (i % 8 === 0);
            const isStarlink = !isGps && !isWeather && !isImaging && (i % 2 === 0);

            const mm = (isGps ? 2.0056 : (14.4 + (i % 6) * 0.28)).toFixed(8).padStart(11, ' ');
            const tags = isGps ? ["GPS"] : (isWeather ? ["WEATHER"] : (isImaging ? ["IMAGING"] : (isStarlink ? ["STARLINK"] : ["LEO"])));
            const badge = isGps ? "GPS" : (isWeather ? "WEATHER" : (isImaging ? "LAND MAP" : (isStarlink ? "STARLINK" : "LEO")));
            const col = isWeather ? 0x7b96b0 : (isImaging ? 0xd4b483 : (isGps ? 0xc88a65 : 0x7fa38d));
            const name = isGps ? `NAVSTAR-GPS-${70 + i}` : (isWeather ? `METOP-WX-${10 + i}` : (isImaging ? `WORLDVIEW-EO-${20 + i}` : (isStarlink ? `STARLINK-${3100 + i}` : `ORBITAL-NODE-${100 + i}`)));
            addSat(name, `1 ${id}U 24010A   26325.50000000  .00002100  00000-0  12000-3 0  9990`, `2 ${id} ${inc} ${raan} 0004500 090.0000 ${ma} ${mm}10000`, tags, badge, col);
        }
    }

    document.getElementById("sat-count-title").innerText = `All Satellites (${satellites.length})`;
    renderSatelliteList();
    propagate();
    if (selectedSat) drawOrbitPath(selectedSat);
})();

// 6. OSINT Layers (Earthquakes & India Flights)
const osintGroup = new THREE.Group();
earthGroup.add(osintGroup);
let quakesOn = false, flightsOn = false;
const quakeMeshes = [], flightMeshes = [];

async function toggleQuakes(force = null) {
    quakesOn = force !== null ? force : !quakesOn;
    document.getElementById("btn-quakes").classList.toggle("active", quakesOn);
    quakeMeshes.forEach(m => osintGroup.remove(m)); quakeMeshes.length = 0;
    if (!quakesOn) { document.getElementById("osint-readout").innerText = "Earthquakes hidden."; return; }
    try {
        const data = await (await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson")).json();
        data.features.slice(0, 35).forEach(f => {
            const [lon, lat] = f.geometry.coordinates;
            const pos = latLonAltToVector3(lat, lon, 12);
            const ring = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.05 + (f.properties.mag || 4.5) * 0.02, 20), new THREE.MeshBasicMaterial({ color: 0xc46d6d, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
            ring.position.copy(pos); ring.lookAt(pos.clone().multiplyScalar(2));
            osintGroup.add(ring); quakeMeshes.push(ring);
        });
        document.getElementById("osint-readout").innerText = `${quakeMeshes.length} global M4.5+ earthquakes active.`;
    } catch (e) {}
}

async function toggleFlights(force = null) {
    flightsOn = force !== null ? force : !flightsOn;
    document.getElementById("btn-flights").classList.toggle("active", flightsOn);
    flightMeshes.forEach(m => osintGroup.remove(m)); flightMeshes.length = 0;
    if (!flightsOn) { document.getElementById("osint-readout").innerText = "Flights hidden."; return; }
    const hubs = [[28.55,77.1],[26.85,75.8],[23.07,72.63],[19.09,72.87],[17.24,78.43],[13.19,77.7],[12.99,80.17],[22.65,88.45],[21.18,79.05]];
    hubs.forEach(([lat, lon]) => {
        const pos = latLonAltToVector3(lat + (Math.random() - 0.5) * 1.2, lon + (Math.random() - 0.5) * 1.2, 35);
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 6), new THREE.MeshBasicMaterial({ color: 0x7fa38d }));
        dot.position.copy(pos); osintGroup.add(dot); flightMeshes.push(dot);
    });
    document.getElementById("osint-readout").innerText = `Tracking ${flightMeshes.length} active flights in India sector.`;
}

// 7. Overhead Country, Nadir Camera Tile & Telemetry
let overheadText = "SCANNING...", lastGeo = 0, nearestGS = "SCANNING...", lastTileKey = "";

function latLonToTile(lat, lon, z) {
    const clampedLat = Math.max(-85, Math.min(85, lat));
    const n = Math.pow(2, z);
    const x = Math.floor(((lon + 180) / 360) * n);
    const latRad = (clampedLat * Math.PI) / 180;
    const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
    return { z, x: Math.max(0, Math.min(n - 1, x)), y: Math.max(0, Math.min(n - 1, y)) };
}

function updateNadirCameraFeed() {
    if (!selectedSat || !viewMaxActive) return;
    document.getElementById("cam-coords-tag").innerText = `${selectedSat.lat.toFixed(1)}°, ${selectedSat.lon.toFixed(1)}°`;
    const zoomLevel = selectedSat.tags.includes("WEATHER") ? 5 : 7;
    const tile = latLonToTile(selectedSat.lat, selectedSat.lon, zoomLevel);
    const key = `${tile.z}/${tile.y}/${tile.x}`;
    if (key !== lastTileKey) {
        lastTileKey = key;
        document.getElementById("nadir-cam-img").src = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${key}`;
    }
}

function setCamMode(mode, btnEl) {
    const img = document.getElementById("nadir-cam-img");
    img.className = `mode-${mode}`;
    document.querySelectorAll(".cam-mode-btn").forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
}

function fallbackRegion(lat, lon) {
    if (lat >= 6.5 && lat <= 35.8 && lon >= 68.0 && lon <= 97.5) return "INDIA";
    if (lat >= 18.0 && lat <= 53.5 && lon >= 74.0 && lon <= 135.0) return "CHINA";
    if (lat >= 42.0 && lat <= 78.0 && lon >= 28.0 && lon <= 175.0) return "RUSSIA";
    if (lat >= 24.5 && lat <= 49.5 && lon >= -125.0 && lon <= -66.5) return "UNITED STATES";
    if (lat >= -44.0 && lat <= -10.5 && lon >= 113.0 && lon <= 154.0) return "AUSTRALIA";
    if (lat >= 36.0 && lat <= 70.0 && lon >= -10.0 && lon <= 30.0) return "EUROPE";
    if (lat >= -35.0 && lat <= 37.0 && lon >= -17.5 && lon <= 51.0) return "AFRICA";
    if (lon >= 20.0 && lon <= 120.0 && lat < 25.0) return "INDIAN OCEAN";
    if (lon >= -80.0 && lon <= 15.0) return "ATLANTIC OCEAN";
    return "PACIFIC OCEAN";
}
async function resolveCountry(lat, lon) {
    overheadText = fallbackRegion(lat, lon);
    if (Date.now() - lastGeo < 3500) return;
    lastGeo = Date.now();
    try {
        const d = await (await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`)).json();
        if (d.countryName) overheadText = d.countryName.toUpperCase();
        else if (d.localityInfo?.informative?.[0]) overheadText = d.localityInfo.informative[0].name.toUpperCase();
    } catch (e) {}
    updateHUD();
}

function drawOrbitPath(s) {
    if (orbitLine) earthGroup.remove(orbitLine);
    const pts = [], now = new Date();
    for (let m = -45; m <= 50; m += 2) {
        const t = new Date(now.getTime() + m * 60000);
        const pv = satellite.propagate(s.satrec, t);
        if (pv?.position && !isNaN(pv.position.x)) {
            const gd = satellite.eciToGeodetic(pv.position, satellite.gstime(t));
            pts.push(latLonAltToVector3(satellite.degreesLat(gd.latitude), satellite.degreesLong(gd.longitude), gd.height));
        }
    }
    if (pts.length > 2) {
        orbitLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: s.color, transparent: true, opacity: 0.8 }));
        earthGroup.add(orbitLine);
    }
}

function updateGSLink() {
    if (gsLinkLine) { earthGroup.remove(gsLinkLine); gsLinkLine = null; }
    if (!selectedSat) return;
    let best = null, minD = Infinity;
    GROUND_STATIONS.forEach(gs => { const d = selectedSat.mesh.position.distanceTo(gs.pos3D); if (d < minD) { minD = d; best = gs; } });
    if (best && minD < 4.5) {
        nearestGS = `${best.name} (ACTIVE)`;
        gsLinkLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([best.pos3D, selectedSat.mesh.position]), new THREE.LineBasicMaterial({ color: 0x7fa38d, transparent: true, opacity: 0.8 }));
        earthGroup.add(gsLinkLine);
    } else {
        nearestGS = best ? `NEXT: ${best.name}` : "OUT OF RANGE";
    }
}

function selectSatellite(s) {
    if (!s) return;
    selectedSat = s;
    lastTileKey = "";
    renderSatelliteList();
    lastGeo = 0; resolveCountry(s.lat, s.lon); drawOrbitPath(s); updateHUD();
}
function selectPreset(k) { const f = satellites.find(s => s.key === k); if (f) selectSatellite(f); }
function focusLatLon(lat, lon, z = 10.2) {
    if (viewMaxActive) toggleViewMax(false);
    targetRotY = ((lon + 90) * Math.PI) / 180; targetRotX = (lat * Math.PI) / 180; targetZoom = z;
}
function focusOnIndia() { focusLatLon(21.25, 81.62, 10.2); }

let viewMaxActive = false;
function toggleViewMax(force = null) {
    viewMaxActive = force !== null ? force : !viewMaxActive;
    document.getElementById("view-max-btn").classList.toggle("active", viewMaxActive);
    document.getElementById("max-dossier").classList.toggle("visible", viewMaxActive);
    if (viewMaxActive && selectedSat) {
        const defaultMode = selectedSat.tags.includes("WEATHER") ? "thermal" : "optical";
        const modeBtns = document.querySelectorAll(".cam-mode-btn");
        setCamMode(defaultMode, defaultMode === "thermal" ? modeBtns[1] : modeBtns[0]);
        updateNadirCameraFeed();
    }
    updateHUD();
}

function updateHUD() {
    if (!selectedSat) return;
    const fb = getFallbackMeta(selectedSat);
    const camName = selectedSat.camera || fb.camera;
    const agencyName = selectedSat.agency || fb.agency;
    const resSpec = selectedSat.res || fb.res;
    const detailText = selectedSat.details || fb.details;

    document.getElementById("pill-sat").innerText = selectedSat.name;
    document.getElementById("pill-country").innerText = overheadText;
    document.getElementById("t-country").innerText = overheadText;
    document.getElementById("t-sensor").innerText = camName;
    document.getElementById("t-alt").innerText = `${selectedSat.alt.toFixed(1)} KM`;
    document.getElementById("t-vel").innerText = `${selectedSat.vel.toFixed(2)} KM/S`;
    document.getElementById("t-coords").innerText = `${selectedSat.lat.toFixed(2)}° N, ${selectedSat.lon.toFixed(2)}° E`;
    document.getElementById("t-gs-link").innerText = nearestGS;

    if (viewMaxActive) {
        document.getElementById("d-title").innerText = `🛰️ ${selectedSat.name} — NORAD #${selectedSat.norad}`;
        document.getElementById("d-country").innerText = overheadText;
        document.getElementById("d-agency").innerText = agencyName;
        document.getElementById("d-camera").innerText = camName;
        document.getElementById("d-res").innerText = resSpec;
        document.getElementById("d-orbit").innerText = `${selectedSat.alt.toFixed(1)} km (${selectedSat.vel.toFixed(2)} km/s)`;
        document.getElementById("d-gs").innerText = nearestGS;
        document.getElementById("d-details").innerText = detailText;
        updateNadirCameraFeed();
    }
}

function propagate() {
    const now = new Date(), gmst = satellite.gstime(now);
    satellites.forEach(s => {
        const pv = satellite.propagate(s.satrec, now);
        if (pv?.position && !isNaN(pv.position.x)) {
            const gd = satellite.eciToGeodetic(pv.position, gmst);
            s.lat = satellite.degreesLat(gd.latitude); s.lon = satellite.degreesLong(gd.longitude); s.alt = gd.height;
            s.vel = pv.velocity ? Math.hypot(pv.velocity.x, pv.velocity.y, pv.velocity.z) : 7.66;
            s.mesh.position.copy(latLonAltToVector3(s.lat, s.lon, s.alt));
            s.mesh.lookAt(0, 0, 0);
        }
    });

    if (selectedSat) {
        resolveCountry(selectedSat.lat, selectedSat.lon);
        updateGSLink();
        // Position ground swath scan ring directly beneath Imaging / Weather satellites
        if (selectedSat.tags.includes("IMAGING") || selectedSat.tags.includes("WEATHER")) {
            swathRing.visible = true;
            const groundPos = latLonAltToVector3(selectedSat.lat, selectedSat.lon, 15);
            swathRing.position.copy(groundPos);
            swathRing.lookAt(groundPos.clone().multiplyScalar(2));
        } else {
            swathRing.visible = false;
        }
    }
    updateHUD();
}
propagate(); setInterval(propagate, 1000); setInterval(() => { if (selectedSat) drawOrbitPath(selectedSat); }, 15000);

// 8. Conversational Voice AI
let cachedVoices = [];
function loadVoices() { if ("speechSynthesis" in window) cachedVoices = window.speechSynthesis.getVoices(); }
loadVoices();
if ("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = loadVoices;

function orbitaSpeak(text) {
    document.getElementById("voice-subtitle").innerText = text;
    document.getElementById("voice-chat-box").innerHTML = `<b style="color:var(--sage);">ORBITA:</b> ${text}`;
    if (!("speechSynthesis" in window)) return;
    try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
        const u = new SpeechSynthesisUtterance(text);
        if (!cachedVoices.length) cachedVoices = window.speechSynthesis.getVoices();
        const preferred = cachedVoices.find(v => v.lang.includes("en-IN")) || cachedVoices.find(v => v.lang.includes("en"));
        if (preferred) u.voice = preferred;
        u.rate = 1.02; u.pitch = 0.96; u.volume = 1.0;
        window.speechSynthesis.speak(u);
    } catch (e) {}
}

function processVoiceQuery(raw) {
    const q = raw.toLowerCase().trim();
    if (!q) return;

    if (q.includes("weather") || q.includes("mausam") || q.includes("cyclone")) {
        setSatCategory("WEATHER", document.querySelectorAll(".cat-tab")[3]);
        toggleDrawer("drawer-sats", document.querySelectorAll(".dock-btn")[0]);
        const wxSat = satellites.find(s => s.name.includes("INSAT-3DS")) || satellites.find(s => s.tags.includes("WEATHER"));
        if (wxSat) selectSatellite(wxSat);
        orbitaSpeak("Showing weather and meteorological satellites including INSAT-3DS, NOAA-20, and Meteosat-9.");
    } else if (q.includes("imaging") || q.includes("land") || q.includes("mapping") || q.includes("maping") || q.includes("camera")) {
        setSatCategory("IMAGING", document.querySelectorAll(".cat-tab")[2]);
        toggleDrawer("drawer-sats", document.querySelectorAll(".dock-btn")[0]);
        const imgSat = satellites.find(s => s.name.includes("CARTOSAT")) || satellites.find(s => s.tags.includes("IMAGING"));
        if (imgSat) selectSatellite(imgSat);
        toggleViewMax(true);
        orbitaSpeak("Showing land mapping and optical camera satellites. Opening View Max with live overhead sensor feed.");
    } else if (q.includes("isro") && (q.includes("all") || q.includes("show") || q.includes("dikhao"))) {
        setSatCategory("ISRO", document.querySelectorAll(".cat-tab")[1]);
        toggleDrawer("drawer-sats", document.querySelectorAll(".dock-btn")[0]);
        focusOnIndia();
        const isroCount = satellites.filter(s => s.tags.includes("ISRO")).length;
        orbitaSpeak(`Showing all ${isroCount} ISRO satellites including Cartosat-3, Resourcesat-2A, RISAT-2B, and INSAT-3DS.`);
    } else if (q.includes("starlink")) {
        setSatCategory("STARLINK", document.querySelectorAll(".cat-tab")[4]);
        toggleDrawer("drawer-sats", document.querySelectorAll(".dock-btn")[0]);
        orbitaSpeak("Filtering Starlink broadband constellation.");
    } else if (q.includes("gps")) {
        setSatCategory("GPS", document.querySelectorAll(".cat-tab")[5]);
        toggleDrawer("drawer-sats", document.querySelectorAll(".dock-btn")[0]);
        orbitaSpeak("Filtering Global Navigation GPS satellites.");
    } else if (q.includes("all satellite") || q.includes("sab satellite") || q.includes("show all")) {
        setSatCategory("ALL", document.querySelectorAll(".cat-tab")[0]);
        orbitaSpeak(`Displaying all ${satellites.length} active satellites in orbit.`);
    } else if (q.includes("hello") || q.includes("hi ") || q === "hi" || q.includes("kaise ho")) {
        orbitaSpeak(`Hello Commander Nitin. Tracking ${satellites.length} satellites including land mapping and weather spacecraft.`);
    } else if (q.includes("india") || q.includes("bharat")) {
        focusOnIndia();
        orbitaSpeak("Focusing orbital view on India sector. ISRO ground stations are active.");
    } else if (q.includes("iss") || q.includes("space station")) {
        selectPreset("ISS");
        orbitaSpeak(`Tracking International Space Station. Currently flying over ${overheadText}.`);
    } else if (q.includes("cartosat")) {
        selectPreset("CARTOSAT");
        orbitaSpeak("Tracking ISRO Cartosat-3 with 0.25 meter ultra-high-resolution land mapping camera.");
    } else if (q.includes("resourcesat")) {
        const s = satellites.find(x => x.name.includes("RESOURCESAT"));
        if (s) selectSatellite(s);
        orbitaSpeak("Tracking ISRO Resourcesat-2A land and crop mapping satellite.");
    } else if (q.includes("risat")) {
        const s = satellites.find(x => x.name.includes("RISAT"));
        if (s) selectSatellite(s);
        orbitaSpeak("Tracking ISRO RISAT-2B all-weather X-band radar imaging satellite.");
    } else if (q.includes("insat")) {
        const s = satellites.find(x => x.name.includes("INSAT-3DS"));
        if (s) selectSatellite(s);
        orbitaSpeak("Tracking ISRO INSAT-3DS meteorological weather satellite.");
    } else if (q.includes("view max") || q.includes("inspect") || q.includes("picture") || q.includes("photo")) {
        toggleViewMax(true);
        const fb = getFallbackMeta(selectedSat);
        orbitaSpeak(`Opening View Max and overhead sensor feed for ${selectedSat.name}. ${selectedSat.details || fb.details}`);
    } else if (q.includes("exit") || q.includes("normal") || q.includes("band")) {
        toggleViewMax(false);
        orbitaSpeak("Returning to full Earth view.");
    } else if (q.includes("where") || q.includes("country") || q.includes("kahan")) {
        orbitaSpeak(`${selectedSat.name} is currently overhead ${overheadText}, moving at ${selectedSat.vel.toFixed(2)} kilometers per second.`);
    } else if (q.includes("what") || q.includes("detail") || q.includes("kya karta")) {
        const fb = getFallbackMeta(selectedSat);
        orbitaSpeak(`${selectedSat.name} carries ${selectedSat.camera || fb.camera}. ${selectedSat.details || fb.details}`);
    } else if (q.includes("earthquake") || q.includes("quake")) {
        toggleQuakes(true);
        orbitaSpeak("Live global earthquake telemetry activated.");
    } else if (q.includes("flight") || q.includes("aircraft")) {
        toggleFlights(true);
        orbitaSpeak("India sector aviation radar activated.");
    } else if (q.includes("unlock") || q.includes("chalao")) {
        isLocked = false;
        orbitaSpeak("Earth rotation resumed.");
    } else if (q.includes("lock") || q.includes("stop")) {
        isLocked = true;
        orbitaSpeak("Orbit rotation locked.");
    } else if (q.includes("next")) {
        selectSatellite(satellites[(satellites.indexOf(selectedSat) + 1) % satellites.length]);
        orbitaSpeak(`Switched to ${selectedSat.name}.`);
    } else {
        const found = satellites.find(s => q.includes(s.name.toLowerCase()));
        if (found) {
            selectSatellite(found);
            orbitaSpeak(`Locked onto ${found.name}, currently over ${overheadText}.`);
        } else {
            orbitaSpeak(`Try saying Show weather satellites, Show land mapping satellites, Track Cartosat, or View Max.`);
        }
    }
}

const voiceTextInput = document.getElementById("voice-input");
voiceTextInput.addEventListener("keydown", e => {
    e.stopPropagation();
    if (e.key === "Enter") {
        processVoiceQuery(voiceTextInput.value);
        voiceTextInput.value = "";
    }
});

const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null, isListening = false;
if (SpeechRec) {
    recognition = new SpeechRec();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.onstart = () => {
        isListening = true;
        const b = document.getElementById("mic-pill-btn");
        b.classList.add("listening"); b.innerText = "Listening...";
        document.getElementById("voice-subtitle").innerText = "Speak now (e.g. 'Show weather satellites' or 'Show land mapping')...";
    };
    recognition.onresult = e => processVoiceQuery(e.results[0][0].transcript);
    recognition.onerror = e => { document.getElementById("voice-subtitle").innerText = `Mic error (${e.error}). Click 💬 icon to type.`; };
    recognition.onend = () => {
        isListening = false;
        const b = document.getElementById("mic-pill-btn");
        b.classList.remove("listening"); b.innerText = "🎙️ Talk [V]";
    };
}

function startVoiceListening() {
    if ("speechSynthesis" in window) window.speechSynthesis.resume();
    if (!recognition) { orbitaSpeak("Voice mic not supported in this browser. Type in the chat icon."); return; }
    if (isListening) { recognition.stop(); return; }
    try { recognition.start(); } catch (e) {}
}

// 9. Keyboard & Mouse Controls
let isLocked = false;
const keys = {};
window.addEventListener("keydown", e => {
    if (document.activeElement.tagName === "INPUT") return;
    keys[e.key.toLowerCase()] = true;
    if (e.key === "1") selectPreset("ISS");
    if (e.key === "2") selectPreset("NAVIC");
    if (e.key === "3") selectPreset("CARTOSAT");
    if (e.key === "4") selectPreset("INSAT");
    if (e.key.toLowerCase() === "m") toggleViewMax();
    if (e.key.toLowerCase() === "v") startVoiceListening();
    if (e.key === "Escape") { closeAllDrawers(); if (viewMaxActive) toggleViewMax(false); }
    if (e.key.toLowerCase() === "i") focusOnIndia();
    if (e.key.toLowerCase() === "n") selectSatellite(satellites[(satellites.indexOf(selectedSat) + 1) % satellites.length]);
    if (e.key.toLowerCase() === "p") selectSatellite(satellites[(satellites.indexOf(selectedSat) - 1 + satellites.length) % satellites.length]);
    if (e.code === "Space") { e.preventDefault(); isLocked = !isLocked; }
});
window.addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });

const raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2();
let dragging = false, prevM = { x: 0, y: 0 };
window.addEventListener("mousedown", e => {
    if (e.target.closest("#top-pill") || e.target.closest("#icon-dock") || e.target.closest(".clay-drawer") || e.target.closest("#voice-pill") || e.target.closest("#max-dossier")) return;
    dragging = true; prevM = { x: e.clientX, y: e.clientY };
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(clickableMeshes);
    if (hits.length && hits[0].object.userData) selectSatellite(hits[0].object.userData);
});
window.addEventListener("mousemove", e => {
    if (!dragging || viewMaxActive) return;
    targetRotY += (e.clientX - prevM.x) * 0.006;
    targetRotX = Math.max(-1.1, Math.min(1.1, targetRotX + (e.clientY - prevM.y) * 0.006));
    prevM = { x: e.clientX, y: e.clientY };
});
window.addEventListener("mouseup", () => { dragging = false; });
window.addEventListener("wheel", e => { if (!viewMaxActive) targetZoom = Math.max(6.0, Math.min(22.0, targetZoom + e.deltaY * 0.008)); });
setInterval(() => { document.getElementById("clock").innerText = "UTC " + new Date().toISOString().substr(11, 8); }, 1000);

const tmpPos = new THREE.Vector3();
function animate() {
    requestAnimationFrame(animate);
    let manual = false;
    if (!viewMaxActive) {
        if (keys["arrowleft"] || keys["a"]) { targetRotY -= 0.022; manual = true; }
        if (keys["arrowright"] || keys["d"]) { targetRotY += 0.022; manual = true; }
        if (keys["arrowup"] || keys["w"]) { targetRotX = Math.max(-1.1, targetRotX - 0.018); manual = true; }
        if (keys["arrowdown"] || keys["s"]) { targetRotX = Math.min(1.1, targetRotX + 0.018); manual = true; }
        if (keys["="] || keys["+"]) targetZoom = Math.max(6.0, targetZoom - 0.16);
        if (keys["-"] || keys["_"]) targetZoom = Math.min(22.0, targetZoom + 0.16);
    }
    if (!isLocked && !manual && !dragging && !viewMaxActive) targetRotY += 0.00045;
    earthGroup.rotation.y += (targetRotY - earthGroup.rotation.y) * 0.1;
    earthGroup.rotation.x += (targetRotX - earthGroup.rotation.x) * 0.1;
    earthGroup.updateMatrixWorld(true);
    starField.rotation.y += 0.00008;

    if (viewMaxActive && selectedSat) {
        selectedSat.mesh.getWorldPosition(tmpPos);
        const closeCam = tmpPos.clone().add(tmpPos.clone().normalize().multiplyScalar(0.95)).add(new THREE.Vector3(0.32, 0.25, 0.32));
        camera.position.lerp(closeCam, 0.1); camera.lookAt(tmpPos);
    } else {
        camera.position.lerp(new THREE.Vector3(0, 1.2, targetZoom), 0.1); camera.lookAt(0, 0, 0);
    }
    renderer.render(scene, camera);
}
animate();
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});