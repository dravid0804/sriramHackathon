/**
 * EarthGuard AI — Mission Control Dashboard Logic
 * Features:
 * - Interactive Before/After Split Curtain Slider
 * - Leaflet Geospatial Satellite Map with ESRI Imagery & Geo-Vectors
 * - HTML5 Canvas Vector Overlay (Bounding boxes, polygons, spotlighting)
 * - Triage Queue with Urgency Gauges & Filter Tabs
 * - Confidence-Aware Transparency Badges
 * - Natural-Language Operational Briefings with Speech Synthesis Read-Aloud
 * - Custom Satellite Pair Upload & Executive Docket Generator
 */

// Application State
const state = {
  currentDatasetId: 'amazon_deforestation',
  datasetMetadata: null,
  analysisData: null,
  selectedZone: null,
  activeFilter: 'ALL',
  curtainPos: 50, // percentage (0 - 100)
  isDraggingCurtain: false,
  viewMode: 'curtain', // 'curtain' | 'leaflet'
  leafletMap: null,
  leafletLayers: [],
  radarScanning: false
};

// DOM Elements
const el = {
  datasetSelect: document.getElementById('dataset-select'),
  btnOpenUpload: document.getElementById('btn-open-upload'),
  btnExportDocket: document.getElementById('btn-export-docket'),
  
  hudSensor: document.getElementById('hud-sensor'),
  valCritical: document.getElementById('val-critical'),
  valModerate: document.getElementById('val-moderate'),
  valLow: document.getElementById('val-low'),
  
  tabCurtain: document.getElementById('tab-curtain'),
  tabLeaflet: document.getElementById('tab-leaflet'),
  chkHeatmap: document.getElementById('chk-heatmap'),
  rngHeatmapOpacity: document.getElementById('rng-heatmap-opacity'),
  chkVectors: document.getElementById('chk-vectors'),
  
  stageViewport: document.getElementById('stage-viewport'),
  radarScanner: document.getElementById('radar-scanner'),
  curtainView: document.getElementById('curtain-view'),
  curtainWrapper: document.getElementById('curtain-wrapper'),
  curtainAfterWrapper: document.getElementById('curtain-after-wrapper'),
  curtainHandle: document.getElementById('curtain-handle'),
  imgBefore: document.getElementById('img-before'),
  imgAfter: document.getElementById('img-after'),
  imgHeatmap: document.getElementById('img-heatmap'),
  vectorCanvas: document.getElementById('vector-canvas'),
  leafletMapContainer: document.getElementById('leaflet-map'),
  
  hudLocationTitle: document.getElementById('hud-location-title'),
  hudLocationCoords: document.getElementById('hud-location-coords'),
  tagBeforeDate: document.getElementById('tag-before-date'),
  tagAfterDate: document.getElementById('tag-after-date'),
  
  statHectares: document.getElementById('stat-hectares'),
  statChangePct: document.getElementById('stat-change-pct'),
  statMeanConf: document.getElementById('stat-mean-conf'),
  
  badgeTotalIncidents: document.getElementById('badge-total-incidents'),
  countAll: document.getElementById('count-all'),
  countCrit: document.getElementById('count-crit'),
  countMod: document.getElementById('count-mod'),
  countLow: document.getElementById('count-low'),
  incidentQueueList: document.getElementById('incident-queue-list'),
  filterPills: document.querySelectorAll('.filter-pill'),
  
  modalUpload: document.getElementById('modal-upload'),
  btnCloseUpload: document.getElementById('btn-close-upload'),
  formUpload: document.getElementById('form-upload'),
  dropzoneBefore: document.getElementById('dropzone-before'),
  dropzoneAfter: document.getElementById('dropzone-after'),
  fileBefore: document.getElementById('file-before'),
  fileAfter: document.getElementById('file-after'),
  previewBeforeName: document.getElementById('preview-before-name'),
  previewAfterName: document.getElementById('preview-after-name'),
  
  modalDocket: document.getElementById('modal-docket'),
  btnCloseDocket: document.getElementById('btn-close-docket'),
  docketContent: document.getElementById('docket-content'),
  btnCopyDocketJson: document.getElementById('btn-copy-docket-json')
};

// ==========================================
// INITIALIZATION
// ==========================================
async function initApp() {
  setupEventListeners();
  setupCurtainDivider();
  setupCanvas();
  await loadDataset(state.currentDatasetId);
}

// ==========================================
// DATA LOADING & PIPELINE EXECUTION
// ==========================================
async function loadDataset(datasetId) {
  state.currentDatasetId = datasetId;
  state.selectedZone = null;
  startRadarScan();

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset_id: datasetId })
    });

    if (!res.ok) throw new Error(`Analysis failed with status ${res.status}`);
    const data = await res.json();
    state.analysisData = data;
    state.datasetMetadata = data.dataset_metadata;

    updateUI(data);
  } catch (err) {
    console.error('Pipeline error:', err);
    alert('Failed to run satellite analysis pipeline. Check backend logs.');
  } finally {
    stopRadarScan();
  }
}

function startRadarScan() {
  state.radarScanning = true;
  el.radarScanner.classList.add('active');
}

function stopRadarScan() {
  state.radarScanning = false;
  el.radarScanner.classList.remove('active');
}

// ==========================================
// UI UPDATE
// ==========================================
function updateUI(data) {
  const meta = data.dataset_metadata || {};
  const telemetry = data.telemetry || {};

  // HUD & Telemetry
  el.hudSensor.textContent = meta.sensor || 'Sentinel-2 MSI (10m)';
  el.valCritical.textContent = telemetry.critical_count || 0;
  el.valModerate.textContent = telemetry.moderate_count || 0;
  el.valLow.textContent = telemetry.low_count || 0;

  el.statHectares.textContent = `${telemetry.total_hectares_impacted || 0} ha`;
  el.statChangePct.textContent = `${telemetry.total_change_pct || 0}%`;
  el.statMeanConf.textContent = `${telemetry.mean_confidence_pct || 95}%`;

  el.badgeTotalIncidents.textContent = `${telemetry.total_zones_detected || 0} FLAGGED`;
  el.countAll.textContent = telemetry.total_zones_detected || 0;
  el.countCrit.textContent = telemetry.critical_count || 0;
  el.countMod.textContent = telemetry.moderate_count || 0;
  el.countLow.textContent = telemetry.low_count || 0;

  el.hudLocationTitle.textContent = meta.title || 'Satellite Target Extent';
  const coords = meta.coordinates || { lat: 0, lon: 0 };
  el.hudLocationCoords.textContent = `LAT: ${coords.lat.toFixed(4)} | LON: ${coords.lon.toFixed(4)} | ${meta.location || ''}`;

  el.tagBeforeDate.textContent = `BEFORE: ${meta.date_before || 'BASELINE'}`;
  el.tagAfterDate.textContent = `AFTER: ${meta.date_after || 'OBSERVED'}`;

  // Image Layers
  el.imgBefore.src = data.before_image_url;
  el.imgAfter.src = data.after_image_url;
  el.imgHeatmap.src = data.heatmap_overlay;
  el.imgHeatmap.style.display = el.chkHeatmap.checked ? 'block' : 'none';
  el.imgHeatmap.style.opacity = el.rngHeatmapOpacity.value / 100;

  // Render Incident Cards
  renderIncidentCards(data.ranked_zones);

  // Redraw Vector Canvas
  resizeCanvas();
  drawVectors();

  // If in Leaflet mode, update map
  if (state.viewMode === 'leaflet') {
    updateLeafletMap();
  }
}

// ==========================================
// INCIDENT CARDS RENDERING (NOVELTY 1, 2, 3)
// ==========================================
function renderIncidentCards(zones = []) {
  el.incidentQueueList.innerHTML = '';

  const filtered = zones.filter(z => {
    if (state.activeFilter === 'ALL') return true;
    return z.tier === state.activeFilter;
  });

  if (filtered.length === 0) {
    el.incidentQueueList.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-dim); font-family: var(--font-mono);">
        No anomalies matching filter [${state.activeFilter}].
      </div>
    `;
    return;
  }

  filtered.forEach(zone => {
    const card = document.createElement('div');
    const isSelected = state.selectedZone && state.selectedZone.zone_id === zone.zone_id;
    card.className = `incident-card tier-${zone.tier.toLowerCase()} ${isSelected ? 'selected' : ''}`;
    card.dataset.zoneId = zone.zone_id;

    const conf = zone.confidence || {};
    const cls = zone.classification || {};
    const brief = zone.incident_brief || {};
    const breakdown = zone.breakdown || {};

    card.innerHTML = `
      <!-- Card Header -->
      <div class="card-header-row">
        <div class="zone-identifier">
          <span class="zone-id">${zone.zone_id}</span>
          <span class="tier-badge ${zone.tier.toLowerCase()}">${zone.tier}</span>
        </div>
        <div class="confidence-badge ${conf.tag_class || 'badge-high'}" title="${conf.reason || ''}">
          <span>●</span>
          <span>${conf.percentage || 95}% ${conf.level || 'High Conf'}</span>
        </div>
      </div>

      <!-- Classification Signature -->
      <div class="event-type-row">
        <span class="event-icon">${cls.icon || '🌐'}</span>
        <span>${cls.type || 'Environmental Shift'}</span>
        <span style="font-size: 0.72rem; font-family: var(--font-mono); color: var(--text-dim); margin-left: auto;">
          ${zone.hectares} ha
        </span>
      </div>

      <!-- Composite Urgency Score Gauge (Novelty 1) -->
      <div class="urgency-meter-box">
        <div class="meter-label-row">
          <span>COMPOSITE URGENCY SCORE</span>
          <span class="urgency-score-val" style="color: ${zone.tier_color};">
            ${zone.urgency_score} <span style="font-size: 0.7rem; color: var(--text-dim);">/ 100</span>
          </span>
        </div>
        <div class="urgency-bar-track">
          <div class="urgency-bar-fill" style="width: ${zone.urgency_score}%; background: ${zone.tier_color};"></div>
        </div>
        <div class="factor-breakdown-row">
          <span>Mag: ${breakdown.magnitude_factor || 0}%</span>
          <span>Community Prox: ${breakdown.proximity_factor || 0}%</span>
          <span>Contiguous: ${breakdown.area_factor || 0}%</span>
        </div>
      </div>

      <!-- Natural-Language AI Briefing (Novelty 3) -->
      <div class="ai-briefing-box">
        <div class="briefing-header">
          <span>AI INCIDENT BRIEFING</span>
          <span style="color: var(--text-dim);">${brief.timeline || 'Immediate'}</span>
        </div>
        <div class="briefing-body">
          ${brief.brief_text || 'Anomaly under active evaluation.'}
        </div>
        <div class="action-protocol-tag">
          <span>⚡</span>
          <span>${brief.recommended_action || 'Maintain observation.'}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="card-actions-row">
        <button class="btn-card-action btn-focus-zone" data-action="focus">
          <span>🎯 Spotlight on Map</span>
        </button>
        <button class="btn-card-action btn-speak" data-action="speak" title="Listen to AI Audio Briefing">
          <span>🔊 Read Aloud</span>
        </button>
        <button class="btn-card-action btn-dispatch" data-action="dispatch">
          <span>Dispatch Field Unit</span>
        </button>
      </div>
    `;

    // Click card to select
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-card-action')) return; // Handled by button listener
      selectZone(zone);
    });

    // Button interactions
    const btnFocus = card.querySelector('.btn-focus-zone');
    btnFocus.addEventListener('click', (e) => {
      e.stopPropagation();
      selectZone(zone);
      centerOnZone(zone);
    });

    const btnSpeak = card.querySelector('.btn-speak');
    btnSpeak.addEventListener('click', (e) => {
      e.stopPropagation();
      speakBrief(brief.brief_text || 'No briefing available.');
    });

    const btnDispatch = card.querySelector('.btn-dispatch');
    btnDispatch.addEventListener('click', (e) => {
      e.stopPropagation();
      btnDispatch.classList.add('dispatched');
      btnDispatch.innerHTML = '<span>✓ Dispatched / En Route</span>';
    });

    el.incidentQueueList.appendChild(card);
  });
}

function selectZone(zone) {
  state.selectedZone = zone;
  document.querySelectorAll('.incident-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.zoneId === zone.zone_id);
  });
  drawVectors();
}

function centerOnZone(zone) {
  if (state.viewMode === 'curtain') {
    // If curtain divider is covering the zone, move curtain to reveal it
    const bbox = zone.bbox;
    const imgW = state.analysisData?.image_dimensions?.width || 800;
    const zoneCenterPct = ((bbox[0] + bbox[2] / 2) / imgW) * 100;
    // Set curtain so that After view is revealed
    setCurtainPosition(Math.max(10, Math.min(90, zoneCenterPct - 25)));
  } else if (state.viewMode === 'leaflet' && state.leafletMap) {
    const meta = state.datasetMetadata;
    if (meta && meta.coordinates) {
      state.leafletMap.setView([meta.coordinates.lat, meta.coordinates.lon], 14, { animate: true });
    }
  }
}

// Browser Speech Synthesis for Audio Briefings (Winning Wow Factor)
function speakBrief(text) {
  if (!('speechSynthesis' in window)) {
    alert('Browser speech synthesis is not supported in this environment.');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

// ==========================================
// INTERACTIVE SPLIT CURTAIN SLIDER
// ==========================================
function setupCurtainDivider() {
  const onPointerMove = (e) => {
    if (!state.isDraggingCurtain) return;
    const rect = el.curtainWrapper.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    if (!clientX) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setCurtainPosition(pct);
  };

  const onPointerUp = () => {
    state.isDraggingCurtain = false;
  };

  el.curtainHandle.addEventListener('mousedown', (e) => {
    state.isDraggingCurtain = true;
    e.preventDefault();
  });
  el.curtainHandle.addEventListener('touchstart', (e) => {
    state.isDraggingCurtain = true;
  });

  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('touchmove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  window.addEventListener('touchend', onPointerUp);

  setCurtainPosition(50);
}

function setCurtainPosition(pct) {
  state.curtainPos = Math.max(0, Math.min(100, pct));
  el.curtainHandle.style.left = `${state.curtainPos}%`;
  // Clip the "After" image so it only shows to the right of the handle
  el.curtainAfterWrapper.style.clipPath = `polygon(${state.curtainPos}% 0, 100% 0, 100% 100%, ${state.curtainPos}% 100%)`;
}

// ==========================================
// HTML5 VECTOR CANVAS RENDERING
// ==========================================
function setupCanvas() {
  window.addEventListener('resize', () => {
    resizeCanvas();
    drawVectors();
  });

  el.vectorCanvas.addEventListener('click', (e) => {
    const rect = el.vectorCanvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const scaleX = el.vectorCanvas.width / rect.width;
    const scaleY = el.vectorCanvas.height / rect.height;

    const canvasX = clickX * scaleX;
    const canvasY = clickY * scaleY;

    if (!state.analysisData || !state.analysisData.ranked_zones) return;

    // Check hit test against zones
    for (const zone of state.analysisData.ranked_zones) {
      const [x, y, w, h] = zone.bbox;
      if (canvasX >= x && canvasX <= x + w && canvasY >= y && canvasY <= y + h) {
        selectZone(zone);
        // Scroll card into view
        const card = document.querySelector(`.incident-card[data-zone-id="${zone.zone_id}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return;
      }
    }
  });
}

function resizeCanvas() {
  const rect = el.curtainWrapper.getBoundingClientRect();
  const imgW = state.analysisData?.image_dimensions?.width || 800;
  const imgH = state.analysisData?.image_dimensions?.height || 800;
  
  el.vectorCanvas.width = imgW;
  el.vectorCanvas.height = imgH;
}

function drawVectors() {
  const ctx = el.vectorCanvas.getContext('2d');
  ctx.clearRect(0, 0, el.vectorCanvas.width, el.vectorCanvas.height);

  if (!el.chkVectors.checked) return;
  if (!state.analysisData || !state.analysisData.ranked_zones) return;

  const zones = state.analysisData.ranked_zones;
  const settlement = state.datasetMetadata?.settlement_center;

  // 1. Draw Settlement Anchor if available
  if (settlement && settlement.x && settlement.y) {
    ctx.save();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(settlement.x, settlement.y, settlement.radius || 80, 0, Math.PI * 2);
    ctx.stroke();

    // Settlement Center Point
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(settlement.x, settlement.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Settlement Label
    ctx.font = 'bold 12px "JetBrains Mono"';
    ctx.fillStyle = '#06b6d4';
    ctx.fillText(`⌖ ${settlement.name || 'Settlement Buffer'}`, settlement.x + 12, settlement.y + 4);
    ctx.restore();
  }

  // 2. Draw Zones (Bounding boxes and polygon perimeters)
  zones.forEach(zone => {
    const isSelected = state.selectedZone && state.selectedZone.zone_id === zone.zone_id;
    const [x, y, w, h] = zone.bbox;
    const color = zone.tier_color || '#ef4444';

    ctx.save();

    // Vector contour polygon
    if (zone.polygon && zone.polygon.length > 2) {
      ctx.beginPath();
      ctx.moveTo(zone.polygon[0][0], zone.polygon[0][1]);
      for (let i = 1; i < zone.polygon.length; i++) {
        ctx.lineTo(zone.polygon[i][0], zone.polygon[i][1]);
      }
      ctx.closePath();

      // Polygon fill
      ctx.fillStyle = isSelected ? `${color}44` : `${color}18`;
      ctx.fill();

      // Polygon stroke
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 3 : 1.5;
      if (isSelected) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
      }
      ctx.stroke();
    }

    // Outer Bounding Box
    ctx.strokeStyle = isSelected ? '#ffffff' : color;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(x, y, w, h);

    // Badge Label on top of bounding box
    const label = `${zone.zone_id} [${zone.urgency_score}]`;
    ctx.font = 'bold 11px "JetBrains Mono"';
    const textWidth = ctx.measureText(label).width;

    ctx.fillStyle = isSelected ? '#000' : color;
    ctx.fillRect(x, Math.max(0, y - 18), textWidth + 10, 18);

    ctx.fillStyle = isSelected ? color : '#ffffff';
    ctx.fillText(label, x + 5, Math.max(12, y - 5));

    // If selected, draw vector line to settlement
    if (isSelected && settlement && settlement.x) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y + h / 2);
      ctx.lineTo(settlement.x, settlement.y);
      ctx.stroke();
    }

    ctx.restore();
  });
}

// ==========================================
// GEOSPATIAL LEAFLET MAP VIEW
// ==========================================
function updateLeafletMap() {
  const meta = state.datasetMetadata;
  if (!meta || !meta.coordinates) return;

  const lat = meta.coordinates.lat;
  const lon = meta.coordinates.lon;
  const zoom = meta.coordinates.zoom || 13;

  if (!state.leafletMap) {
    state.leafletMap = L.map('leaflet-map', {
      zoomControl: true,
      attributionControl: true
    }).setView([lat, lon], zoom);

    // ESRI World Imagery Tile Layer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      attribution: 'Tiles &copy; Esri &mdash; EarthGuard Geospatial'
    }).addTo(state.leafletMap);
  } else {
    state.leafletMap.setView([lat, lon], zoom);
  }

  // Clear previous layers
  state.leafletLayers.forEach(l => state.leafletMap.removeLayer(l));
  state.leafletLayers = [];

  // Add Incident Markers
  if (state.analysisData && state.analysisData.ranked_zones) {
    state.analysisData.ranked_zones.forEach(zone => {
      // Map image pixel space to small GPS delta around center for realistic simulation
      const dLat = (zone.centroid[1] - 400) * -0.0001;
      const dLon = (zone.centroid[0] - 400) * 0.00015;
      const zLat = lat + dLat;
      const zLon = lon + dLon;

      const circle = L.circle([zLat, zLon], {
        radius: Math.max(80, Math.sqrt(zone.pixel_area) * 8),
        color: zone.tier_color,
        fillColor: zone.tier_color,
        fillOpacity: 0.35,
        weight: 2
      }).addTo(state.leafletMap);

      const popupContent = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #1e293b;">
          <strong style="color: ${zone.tier_color};">${zone.zone_id} [${zone.tier}]</strong><br>
          <b>Classification:</b> ${zone.classification?.type || 'Anomaly'}<br>
          <b>Urgency Score:</b> ${zone.urgency_score} / 100<br>
          <b>Area:</b> ${zone.hectares} ha<br>
          <b>Confidence:</b> ${zone.confidence?.percentage}%<br>
          <hr style="margin: 6px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #475569;">${zone.incident_brief?.recommended_action || ''}</p>
        </div>
      `;
      circle.bindPopup(popupContent);

      circle.on('click', () => {
        selectZone(zone);
        const card = document.querySelector(`.incident-card[data-zone-id="${zone.zone_id}"]`);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });

      state.leafletLayers.push(circle);
    });
  }
}

// ==========================================
// EVENT LISTENERS & WIRING
// ==========================================
function setupEventListeners() {
  // Dataset Selector
  el.datasetSelect.addEventListener('change', (e) => {
    loadDataset(e.target.value);
  });

  // View Mode Tabs
  el.tabCurtain.addEventListener('click', () => {
    state.viewMode = 'curtain';
    el.tabCurtain.classList.add('active');
    el.tabLeaflet.classList.remove('active');
    el.curtainView.style.display = 'flex';
    el.leafletMapContainer.style.display = 'none';
    resizeCanvas();
    drawVectors();
  });

  el.tabLeaflet.addEventListener('click', () => {
    state.viewMode = 'leaflet';
    el.tabLeaflet.classList.add('active');
    el.tabCurtain.classList.remove('active');
    el.curtainView.style.display = 'none';
    el.leafletMapContainer.style.display = 'block';
    setTimeout(() => {
      updateLeafletMap();
      state.leafletMap?.invalidateSize();
    }, 100);
  });

  // Layer Toggles
  el.chkHeatmap.addEventListener('change', (e) => {
    el.imgHeatmap.style.display = e.target.checked ? 'block' : 'none';
  });

  el.rngHeatmapOpacity.addEventListener('input', (e) => {
    el.imgHeatmap.style.opacity = e.target.value / 100;
  });

  el.chkVectors.addEventListener('change', () => {
    drawVectors();
  });

  // Triage Filter Pills
  el.filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      el.filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.activeFilter = pill.dataset.filter;
      if (state.analysisData) {
        renderIncidentCards(state.analysisData.ranked_zones);
      }
    });
  });

  // Upload Modal
  el.btnOpenUpload.addEventListener('click', () => {
    el.modalUpload.classList.add('open');
  });

  el.btnCloseUpload.addEventListener('click', () => {
    el.modalUpload.classList.remove('open');
  });

  el.dropzoneBefore.addEventListener('click', () => el.fileBefore.click());
  el.dropzoneAfter.addEventListener('click', () => el.fileAfter.click());

  el.fileBefore.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      el.previewBeforeName.textContent = `✓ Selected: ${e.target.files[0].name}`;
    }
  });

  el.fileAfter.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      el.previewAfterName.textContent = `✓ Selected: ${e.target.files[0].name}`;
    }
  });

  el.formUpload.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!el.fileBefore.files[0] || !el.fileAfter.files[0]) {
      alert('Please select both a Before and an After satellite image.');
      return;
    }

    const formData = new FormData();
    formData.append('before_file', el.fileBefore.files[0]);
    formData.append('after_file', el.fileAfter.files[0]);
    formData.append('title', document.getElementById('upload-title').value);

    el.modalUpload.classList.remove('open');
    startRadarScan();

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Upload processing failed');
      const data = await res.json();
      state.analysisData = data;
      state.datasetMetadata = data.dataset_metadata;
      updateUI(data);
    } catch (err) {
      console.error(err);
      alert('Failed to analyze uploaded satellite images.');
    } finally {
      stopRadarScan();
    }
  });

  // Export Executive Docket Modal
  el.btnExportDocket.addEventListener('click', async () => {
    if (!state.analysisData) return;

    try {
      const res = await fetch('/api/export-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.analysisData)
      });
      const docket = await res.json();
      renderDocket(docket);
      el.modalDocket.classList.add('open');
    } catch (err) {
      console.error('Docket generation failed:', err);
    }
  });

  el.btnCloseDocket.addEventListener('click', () => {
    el.modalDocket.classList.remove('open');
  });

  el.btnCopyDocketJson.addEventListener('click', () => {
    if (!state.analysisData) return;
    navigator.clipboard.writeText(JSON.stringify(state.analysisData, null, 2));
    alert('Executive docket JSON copied to clipboard!');
  });
}

function renderDocket(docket) {
  const s = docket.triage_summary || {};
  const items = docket.critical_action_items || [];

  let criticalListHtml = items.map(item => `
    <div style="background: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
      <div style="display: flex; justify-content: space-between; font-weight: bold; color: #ef4444; margin-bottom: 4px;">
        <span>${item.zone_id} // ${item.classification} (Urgency: ${item.urgency_score})</span>
        <span>Timeline: ${item.dispatch_window}</span>
      </div>
      <p style="margin: 0 0 6px 0; color: #cbd5e1;">${item.brief}</p>
      <div style="font-size: 11px; color: #f87171;"><strong>Protocol:</strong> ${item.action}</div>
    </div>
  `).join('');

  if (items.length === 0) {
    criticalListHtml = '<p style="color: #10b981;">No Critical Tier-1 threats currently active.</p>';
  }

  el.docketContent.innerHTML = `
    <h2>${docket.mission_title}</h2>
    <div style="margin-bottom: 14px; font-size: 12px; color: var(--text-dim);">
      DOCKET ID: <strong>${docket.report_id}</strong> | GENERATED: <strong>${docket.generated_timestamp}</strong><br>
      LOCATION: <strong>${docket.location}</strong>
    </div>

    <div class="report-triage-grid">
      <div class="report-box">
        <div style="font-size: 20px; font-weight: bold; color: #ef4444;">${s.critical_immediate_threats || 0}</div>
        <div style="font-size: 11px; color: var(--text-dim);">CRITICAL THREATS</div>
      </div>
      <div class="report-box">
        <div style="font-size: 20px; font-weight: bold; color: #f59e0b;">${s.moderate_surveillance || 0}</div>
        <div style="font-size: 11px; color: var(--text-dim);">MODERATE SURVEILLANCE</div>
      </div>
      <div class="report-box">
        <div style="font-size: 20px; font-weight: bold; color: #06b6d4;">${s.total_hectares_impacted || 0} ha</div>
        <div style="font-size: 11px; color: var(--text-dim);">IMPACTED AREA</div>
      </div>
    </div>

    <h3 style="color: #fff; margin: 16px 0 10px 0; font-size: 14px;">CRITICAL RESPONSE DIRECTIVES</h3>
    ${criticalListHtml}
  `;
}

// Launch application on DOM ready
document.addEventListener('DOMContentLoaded', initApp);
