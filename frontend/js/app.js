/**
 * EarthGuard AI — Mission Control Dashboard Logic
 * Modular Enterprise Aerospace Architecture
 * Views: Studio (Dual/Curtain), Geospatial Map, Priority Triage Queue, Analytics, Incident Docket
 */

// Application State
const state = {
  currentDatasetId: 'amazon_deforestation',
  datasetMetadata: null,
  analysisData: null,
  selectedZone: null,
  activeView: 'studio',        // 'studio' | 'map' | 'triage' | 'analytics' | 'docket'
  comparisonMode: 'dual',      // 'dual' | 'curtain' | 'diff'
  inspectorTab: 'tab-metrics', // 'tab-metrics' | 'tab-brief' | 'tab-dispatch' | 'tab-spectral'
  tableFilter: 'ALL',          // 'ALL' | 'CRITICAL' | 'MODERATE' | 'LOW'
  curtainPos: 50,
  isDraggingCurtain: false,
  leafletMap: null,
  fullscreenMap: null,
  mapMarkers: []
};

// DOM References
const dom = {
  // Sidebar
  navItems: document.querySelectorAll('.nav-item'),
  aoiSelect: document.getElementById('aoi-select'),
  btnSidebarUpload: document.getElementById('btn-sidebar-upload'),
  navBadgeCritical: document.getElementById('nav-badge-critical'),

  // Top Bar
  breadcrumbLocation: document.getElementById('breadcrumb-location'),
  breadcrumbSensor: document.getElementById('breadcrumb-sensor'),
  topValCritical: document.getElementById('top-val-critical'),
  topValModerate: document.getElementById('top-val-moderate'),
  topValLow: document.getElementById('top-val-low'),
  btnRescan: document.getElementById('btn-rescan'),
  btnExportDocketTop: document.getElementById('btn-export-docket-top'),

  // Views
  views: {
    studio: document.getElementById('view-studio'),
    map: document.getElementById('view-map'),
    triage: document.getElementById('view-triage'),
    analytics: document.getElementById('view-analytics'),
    docket: document.getElementById('view-docket')
  },

  // Studio Sub-Toolbar
  btnModeDual: document.getElementById('btn-mode-dual'),
  btnModeCurtain: document.getElementById('btn-mode-curtain'),
  btnModeDiff: document.getElementById('btn-mode-diff'),
  chkLayerHeatmap: document.getElementById('chk-layer-heatmap'),
  rngLayerOpacity: document.getElementById('rng-layer-opacity'),
  chkLayerVectors: document.getElementById('chk-layer-vectors'),

  // Studio Stage
  studioRadarLine: document.getElementById('studio-radar-line'),
  stageDualView: document.getElementById('stage-dual-view'),
  stageCurtainView: document.getElementById('stage-curtain-view'),
  stageAoiTitle: document.getElementById('stage-aoi-title'),
  stageAoiCoords: document.getElementById('stage-aoi-coords'),

  // Dual View Elements
  imgDualBefore: document.getElementById('img-dual-before'),
  imgDualAfter: document.getElementById('img-dual-after'),
  imgDualHeatmap: document.getElementById('img-dual-heatmap'),
  dualVectorCanvas: document.getElementById('dual-vector-canvas'),
  lblDualBeforeDate: document.getElementById('lbl-dual-before-date'),
  lblDualAfterDate: document.getElementById('lbl-dual-after-date'),

  // Curtain View Elements
  curtainStageWrapper: document.getElementById('curtain-stage-wrapper'),
  imgCurtainBefore: document.getElementById('img-curtain-before'),
  imgCurtainAfter: document.getElementById('img-curtain-after'),
  curtainClippedBox: document.getElementById('curtain-clipped-box'),
  imgCurtainHeatmap: document.getElementById('img-curtain-heatmap'),
  curtainVectorCanvas: document.getElementById('curtain-vector-canvas'),
  curtainDividerLine: document.getElementById('curtain-divider-line'),
  pillCurtainBefore: document.getElementById('pill-curtain-before'),
  pillCurtainAfter: document.getElementById('pill-curtain-after'),

  // Studio Bottom Bar
  statHaVal: document.getElementById('stat-ha-val'),
  statDeltaVal: document.getElementById('stat-delta-val'),
  statConfVal: document.getElementById('stat-conf-val'),

  // Right Inspector Pane
  inspZoneId: document.getElementById('insp-zone-id'),
  inspTierPill: document.getElementById('insp-tier-pill'),
  inspConfBadge: document.getElementById('insp-conf-badge'),
  inspTabBtns: document.querySelectorAll('.insp-tab-btn'),
  inspContentTabs: document.querySelectorAll('.insp-content-tab'),

  // Inspector Content Tab 1 (Metrics)
  inspTierLabel: document.getElementById('insp-tier-label'),
  inspScoreVal: document.getElementById('insp-score-val'),
  inspScoreBar: document.getElementById('insp-score-bar'),
  inspEventType: document.getElementById('insp-event-type'),
  inspAreaVal: document.getElementById('insp-area-val'),
  inspMagVal: document.getElementById('insp-mag-val'),
  inspSettleVal: document.getElementById('insp-settle-val'),
  inspConfPct: document.getElementById('insp-conf-pct'),
  inspConfReason: document.getElementById('insp-conf-reason'),

  // Inspector Content Tab 2 (Brief)
  inspBriefWindow: document.getElementById('insp-brief-window'),
  inspBriefText: document.getElementById('insp-brief-text'),
  inspActionPill: document.getElementById('insp-action-pill'),
  btnAudioBrief: document.getElementById('btn-audio-brief'),
  inspSignatureText: document.getElementById('insp-signature-text'),

  // Inspector Content Tab 3 (Dispatch)
  btnAuthorizeDispatch: document.getElementById('btn-authorize-dispatch'),

  // Quick Zone Carousel
  inspectorQuickZones: document.getElementById('inspector-quick-zones'),

  // View 2: Map
  fullscreenLeafletMap: document.getElementById('fullscreen-leaflet-map'),

  // View 3: Triage
  triageTableBody: document.getElementById('triage-table-body'),
  triageTableCount: document.getElementById('triage-table-count'),
  tableFilterBtns: document.querySelectorAll('[data-table-filter]'),

  // View 4: Analytics
  anHectares: document.getElementById('an-hectares'),
  anCriticalCount: document.getElementById('an-critical-count'),
  anConfPct: document.getElementById('an-conf-pct'),

  // View 5: Docket
  docketPrintableBox: document.getElementById('docket-printable-box'),

  // Upload Modal
  modalUploadBackdrop: document.getElementById('modal-upload-backdrop'),
  btnCloseModalUpload: document.getElementById('btn-close-modal-upload'),
  formCustomUpload: document.getElementById('form-custom-upload'),
  boxUploadBefore: document.getElementById('box-upload-before'),
  boxUploadAfter: document.getElementById('box-upload-after'),
  inputFileBefore: document.getElementById('input-file-before'),
  inputFileAfter: document.getElementById('input-file-after'),
  lblFileBeforeName: document.getElementById('lbl-file-before-name'),
  lblFileAfterName: document.getElementById('lbl-file-after-name'),
  inputMissionTitle: document.getElementById('input-mission-title')
};

// ==========================================
// INITIALIZATION
// ==========================================
async function init() {
  bindEvents();
  setupCurtainSlider();
  setupCanvases();
  await loadDataset(state.currentDatasetId);
}

// ==========================================
// DATA LOADING
// ==========================================
async function loadDataset(datasetId) {
  state.currentDatasetId = datasetId;
  startRadar();

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset_id: datasetId })
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const data = await res.json();
    state.analysisData = data;
    state.datasetMetadata = data.dataset_metadata;

    // Default to the first (highest urgency) zone
    if (data.ranked_zones && data.ranked_zones.length > 0) {
      state.selectedZone = data.ranked_zones[0];
    } else {
      state.selectedZone = null;
    }

    renderAllViews(data);
  } catch (err) {
    console.error('Data pipeline error:', err);
    alert('Pipeline execution error. Verify backend server is running.');
  } finally {
    stopRadar();
  }
}

function startRadar() {
  dom.studioRadarLine.classList.add('active');
}

function stopRadar() {
  dom.studioRadarLine.classList.remove('active');
}

// ==========================================
// MASTER RENDERER FOR ALL VIEWS
// ==========================================
function renderAllViews(data) {
  const meta = data.dataset_metadata || {};
  const t = data.telemetry || {};

  // 1. Top Header & Breadcrumbs
  dom.breadcrumbLocation.textContent = meta.location || meta.title || 'Target AOI';
  dom.breadcrumbSensor.textContent = meta.sensor || 'Sentinel-2 MSI';
  dom.topValCritical.textContent = t.critical_count || 0;
  dom.topValModerate.textContent = t.moderate_count || 0;
  dom.topValLow.textContent = t.low_count || 0;
  dom.navBadgeCritical.textContent = t.critical_count || 0;

  // 2. Mission Studio Stage
  dom.lblDualBeforeDate.textContent = meta.date_before || 'BASELINE';
  dom.lblDualAfterDate.textContent = meta.date_after || 'OBSERVED';
  dom.pillCurtainBefore.textContent = `BEFORE: ${meta.date_before || 'BASELINE'}`;
  dom.pillCurtainAfter.textContent = `AFTER: ${meta.date_after || 'OBSERVED'}`;
  dom.stageAoiTitle.textContent = meta.title || 'Observation Boundary';
  const coords = meta.coordinates || { lat: 0, lon: 0 };
  dom.stageAoiCoords.textContent = `LAT: ${coords.lat.toFixed(4)} | LON: ${coords.lon.toFixed(4)}`;

  // Images
  dom.imgDualBefore.src = data.before_image_url;
  dom.imgDualAfter.src = data.after_image_url;
  dom.imgDualHeatmap.src = data.heatmap_overlay;

  dom.imgCurtainBefore.src = data.before_image_url;
  dom.imgCurtainAfter.src = data.after_image_url;
  dom.imgCurtainHeatmap.src = data.heatmap_overlay;

  updateHeatmapVisibility();

  // Bottom Stats
  dom.statHaVal.textContent = `${t.total_hectares_impacted || 0} ha`;
  dom.statDeltaVal.textContent = `${t.total_change_pct || 0}%`;
  dom.statConfVal.textContent = `${t.mean_confidence_pct || 95}%`;

  // 3. Right Inspector
  if (state.selectedZone) {
    updateInspector(state.selectedZone);
  }
  renderQuickZoneChips(data.ranked_zones);

  // 4. Redraw Canvases
  resizeCanvases();
  drawAllCanvases();

  // 5. Geospatial Map
  updateMap(meta, data.ranked_zones);

  // 6. Triage Queue Table
  renderTriageTable(data.ranked_zones);

  // 7. Analytics View
  dom.anHectares.textContent = `${t.total_hectares_impacted || 0} ha`;
  dom.anCriticalCount.textContent = `${t.critical_count || 0} ZONES`;
  dom.anConfPct.textContent = `${t.mean_confidence_pct || 96}%`;

  // 8. Incident Docket View
  renderDocketView(data);
}

// ==========================================
// INSPECTOR UPDATER
// ==========================================
function updateInspector(zone) {
  if (!zone) return;

  const conf = zone.confidence || {};
  const cls = zone.classification || {};
  const brief = zone.incident_brief || {};
  const breakdown = zone.breakdown || {};

  // Header
  dom.inspZoneId.textContent = zone.zone_id;
  dom.inspTierPill.textContent = zone.tier;
  dom.inspTierPill.className = `inspector-tier-pill ${zone.tier.toLowerCase()}`;
  dom.inspConfBadge.textContent = `● ${conf.percentage || 95}% ${conf.level || 'High Conf'}`;
  dom.inspConfBadge.style.color = zone.tier_color;

  // Tab 1: Metrics
  dom.inspTierLabel.textContent = zone.tier_label || 'Priority Anomaly';
  dom.inspTierLabel.style.color = zone.tier_color;
  dom.inspScoreVal.textContent = zone.urgency_score;
  dom.inspScoreVal.style.color = zone.tier_color;
  dom.inspScoreBar.style.width = `${zone.urgency_score}%`;
  dom.inspScoreBar.style.background = zone.tier_color;

  dom.inspEventType.textContent = `${cls.icon || '🌐'} ${cls.type || 'Environmental Shift'}`;
  dom.inspAreaVal.textContent = `${zone.hectares} ha`;
  dom.inspMagVal.textContent = `${Math.round(zone.mean_magnitude * 100)}% Delta`;
  dom.inspSettleVal.textContent = zone.distance_to_settlement_px < 150 ? '< 1.5 km Buffer' : '< 4.2 km Perimeter';
  dom.inspConfPct.textContent = `${conf.percentage || 95}% RATING`;
  dom.inspConfReason.textContent = conf.reason || 'Atmospheric clarity optimal; verified spectral delta.';

  // Tab 2: AI Briefing
  dom.inspBriefWindow.textContent = brief.timeline || 'Immediate (0-48h)';
  dom.inspBriefText.textContent = brief.brief_text || 'Active environmental shift under automated surveillance.';
  dom.inspActionPill.innerHTML = `<strong>Directive:</strong> ${brief.recommended_action || 'Continue observation.'}`;
  dom.inspSignatureText.textContent = cls.signature || 'Spectral shift detected.';

  // Tab 3: Protocol
  dom.btnAuthorizeDispatch.classList.remove('dispatched');
  dom.btnAuthorizeDispatch.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
    <span>Authorize &amp; Dispatch Field Unit</span>
  `;

  // Highlight selected chip
  document.querySelectorAll('.quick-zone-chip').forEach(chip => {
    chip.classList.toggle('selected', chip.dataset.zoneId === zone.zone_id);
  });

  drawAllCanvases();
}

function selectZone(zone) {
  state.selectedZone = zone;
  updateInspector(zone);
}

function renderQuickZoneChips(zones = []) {
  dom.inspectorQuickZones.innerHTML = '';
  zones.forEach(zone => {
    const chip = document.createElement('div');
    const isSelected = state.selectedZone && state.selectedZone.zone_id === zone.zone_id;
    chip.className = `quick-zone-chip ${isSelected ? 'selected' : ''}`;
    chip.dataset.zoneId = zone.zone_id;
    chip.innerHTML = `<span style="color: ${zone.tier_color};">●</span> ${zone.zone_id} [${zone.urgency_score}]`;
    chip.addEventListener('click', () => {
      selectZone(zone);
    });
    dom.inspectorQuickZones.appendChild(chip);
  });
}

// ==========================================
// CANVASES (DUAL + CURTAIN)
// ==========================================
function setupCanvases() {
  window.addEventListener('resize', () => {
    resizeCanvases();
    drawAllCanvases();
  });

  // Click detection on Dual canvas
  dom.dualVectorCanvas.addEventListener('click', (e) => handleCanvasClick(e, dom.dualVectorCanvas));
  dom.curtainVectorCanvas.addEventListener('click', (e) => handleCanvasClick(e, dom.curtainVectorCanvas));
}

function handleCanvasClick(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const x = clickX * scaleX;
  const y = clickY * scaleY;

  if (!state.analysisData || !state.analysisData.ranked_zones) return;

  for (const zone of state.analysisData.ranked_zones) {
    const [bx, by, bw, bh] = zone.bbox;
    if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
      selectZone(zone);
      return;
    }
  }
}

function resizeCanvases() {
  const imgW = state.analysisData?.image_dimensions?.width || 800;
  const imgH = state.analysisData?.image_dimensions?.height || 800;
  
  dom.dualVectorCanvas.width = imgW;
  dom.dualVectorCanvas.height = imgH;

  dom.curtainVectorCanvas.width = imgW;
  dom.curtainVectorCanvas.height = imgH;
}

function drawAllCanvases() {
  drawCanvas(dom.dualVectorCanvas);
  drawCanvas(dom.curtainVectorCanvas);
}

function drawCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!dom.chkLayerVectors.checked) return;
  if (!state.analysisData || !state.analysisData.ranked_zones) return;

  const zones = state.analysisData.ranked_zones;
  const settlement = state.datasetMetadata?.settlement_center;

  // Settlement Anchor
  if (settlement && settlement.x) {
    ctx.save();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(settlement.x, settlement.y, settlement.radius || 80, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(settlement.x, settlement.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 12px "JetBrains Mono"';
    ctx.fillStyle = '#06b6d4';
    ctx.fillText(`⌖ ${settlement.name || 'Community'}`, settlement.x + 10, settlement.y + 4);
    ctx.restore();
  }

  // Draw Zones
  zones.forEach(zone => {
    const isSelected = state.selectedZone && state.selectedZone.zone_id === zone.zone_id;
    const [x, y, w, h] = zone.bbox;
    const color = zone.tier_color || '#ef4444';

    ctx.save();

    // Polygon
    if (zone.polygon && zone.polygon.length > 2) {
      ctx.beginPath();
      ctx.moveTo(zone.polygon[0][0], zone.polygon[0][1]);
      for (let i = 1; i < zone.polygon.length; i++) {
        ctx.lineTo(zone.polygon[i][0], zone.polygon[i][1]);
      }
      ctx.closePath();

      ctx.fillStyle = isSelected ? `${color}44` : `${color}18`;
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 3 : 1.5;
      if (isSelected) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 14;
      }
      ctx.stroke();
    }

    // Bounding Box
    ctx.strokeStyle = isSelected ? '#ffffff' : color;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(x, y, w, h);

    // Label
    const label = `${zone.zone_id} [${zone.urgency_score}]`;
    ctx.font = 'bold 11px "JetBrains Mono"';
    const textWidth = ctx.measureText(label).width;

    ctx.fillStyle = isSelected ? '#ffffff' : color;
    ctx.fillRect(x, Math.max(0, y - 18), textWidth + 8, 18);

    ctx.fillStyle = isSelected ? '#000000' : '#ffffff';
    ctx.fillText(label, x + 4, Math.max(12, y - 5));

    // Vector line to community if selected
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
// CURTAIN SLIDER
// ==========================================
function setupCurtainSlider() {
  const onMove = (e) => {
    if (!state.isDraggingCurtain) return;
    const rect = dom.curtainStageWrapper.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    if (!clientX) return;
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setCurtainPos(pct);
  };

  const onStop = () => {
    state.isDraggingCurtain = false;
  };

  dom.curtainDividerLine.addEventListener('mousedown', (e) => {
    state.isDraggingCurtain = true;
    e.preventDefault();
  });
  dom.curtainDividerLine.addEventListener('touchstart', (e) => {
    state.isDraggingCurtain = true;
  });

  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove);
  window.addEventListener('mouseup', onStop);
  window.addEventListener('touchend', onStop);

  setCurtainPos(50);
}

function setCurtainPos(pct) {
  state.curtainPos = pct;
  dom.curtainDividerLine.style.left = `${pct}%`;
  dom.curtainClippedBox.style.clipPath = `polygon(${pct}% 0, 100% 0, 100% 100%, ${pct}% 100%)`;
}

// ==========================================
// GEOSPATIAL MAP VIEW
// ==========================================
function updateMap(meta, zones = []) {
  if (!meta || !meta.coordinates) return;
  const lat = meta.coordinates.lat;
  const lon = meta.coordinates.lon;
  const zoom = meta.coordinates.zoom || 13;

  if (!state.fullscreenMap) {
    state.fullscreenMap = L.map('fullscreen-leaflet-map', {
      zoomControl: true
    }).setView([lat, lon], zoom);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      attribution: 'Tiles &copy; Esri &mdash; EarthGuard Geospatial'
    }).addTo(state.fullscreenMap);
  } else {
    state.fullscreenMap.setView([lat, lon], zoom);
  }

  // Clear markers
  state.mapMarkers.forEach(m => state.fullscreenMap.removeLayer(m));
  state.mapMarkers = [];

  // Add Zone Circles
  zones.forEach(zone => {
    const dLat = (zone.centroid[1] - 400) * -0.0001;
    const dLon = (zone.centroid[0] - 400) * 0.00015;
    const zLat = lat + dLat;
    const zLon = lon + dLon;

    const circle = L.circle([zLat, zLon], {
      radius: Math.max(100, Math.sqrt(zone.pixel_area) * 8),
      color: zone.tier_color,
      fillColor: zone.tier_color,
      fillOpacity: 0.38,
      weight: 2
    }).addTo(state.fullscreenMap);

    const popupHtml = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px;">
        <strong style="color: ${zone.tier_color};">${zone.zone_id} [${zone.tier}]</strong><br>
        <b>Type:</b> ${zone.classification?.type || 'Anomaly'}<br>
        <b>Urgency:</b> ${zone.urgency_score} / 100<br>
        <b>Area:</b> ${zone.hectares} ha | <b>Confidence:</b> ${zone.confidence?.percentage}%<br>
        <div style="margin-top: 6px; font-size: 12px; color: #475569;">${zone.incident_brief?.recommended_action || ''}</div>
      </div>
    `;
    circle.bindPopup(popupHtml);

    circle.on('click', () => {
      selectZone(zone);
      switchView('studio');
    });

    state.mapMarkers.push(circle);
  });
}

// ==========================================
// PRIORITY TRIAGE TABLE
// ==========================================
function renderTriageTable(zones = []) {
  dom.triageTableBody.innerHTML = '';

  const filtered = zones.filter(z => {
    if (state.tableFilter === 'ALL') return true;
    return z.tier === state.tableFilter;
  });

  dom.triageTableCount.textContent = `Showing ${filtered.length} Anomaly Records`;

  filtered.forEach(zone => {
    const tr = document.createElement('tr');
    tr.className = 'clickable';
    tr.innerHTML = `
      <td style="font-family: var(--font-mono); font-weight: 700;">#${zone.rank}</td>
      <td style="font-family: var(--font-mono); font-weight: 800; color: #fff;">${zone.zone_id}</td>
      <td>
        <span class="inspector-tier-pill ${zone.tier.toLowerCase()}">${zone.tier}</span>
      </td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-family: var(--font-mono); font-weight: 700; color: ${zone.tier_color};">${zone.urgency_score}</span>
          <div style="width: 60px; height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
            <div style="width: ${zone.urgency_score}%; height: 100%; background: ${zone.tier_color};"></div>
          </div>
        </div>
      </td>
      <td>${zone.classification?.icon || '🌐'} ${zone.classification?.type || 'Anomaly'}</td>
      <td style="font-family: var(--font-mono);">${zone.hectares} ha</td>
      <td style="font-family: var(--font-mono);">${zone.distance_to_settlement_px < 150 ? '< 1.5 km Buffer' : '< 4.2 km Perimeter'}</td>
      <td>
        <span style="color: ${zone.tier_color}; font-family: var(--font-mono); font-size: 0.72rem;">
          ● ${zone.confidence?.percentage || 95}%
        </span>
      </td>
      <td>
        <button class="filter-btn-chip btn-inspect-row" style="background: var(--cyan-soft); color: var(--cyan-primary); border-color: var(--cyan-primary);">
          Inspect
        </button>
      </td>
    `;

    tr.addEventListener('click', () => {
      selectZone(zone);
      switchView('studio');
    });

    dom.triageTableBody.appendChild(tr);
  });
}

// ==========================================
// EXECUTIVE DOCKET VIEW
// ==========================================
function renderDocketView(data) {
  const meta = data.dataset_metadata || {};
  const t = data.telemetry || {};
  const zones = data.ranked_zones || [];
  const criticals = zones.filter(z => z.tier === 'CRITICAL');

  dom.docketPrintableBox.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--border-medium); padding-bottom: 16px;">
      <div>
        <h1 style="font-size: 1.4rem; font-weight: 800; color: #fff;">EXECUTIVE INCIDENT DISPATCH BRIEFING</h1>
        <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 4px;">
          MISSION ID: <strong>EGUARD-DISPATCH-${Date.now().toString().slice(-6)}</strong> | SECURITY LEVEL: <strong>RESTRICTED</strong>
        </div>
      </div>
      <div style="text-align: right;">
        <button class="btn-header-action btn-accent" onclick="window.print()">Print / PDF</button>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0;">
      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 14px; border-radius: var(--radius-sm); text-align: center;">
        <div style="font-size: 1.8rem; font-weight: 800; color: var(--crimson-hazard);">${t.critical_count || 0}</div>
        <div style="font-size: 0.68rem; color: var(--text-dim);">CRITICAL THREATS</div>
      </div>
      <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 14px; border-radius: var(--radius-sm); text-align: center;">
        <div style="font-size: 1.8rem; font-weight: 800; color: var(--amber-warn);">${t.moderate_count || 0}</div>
        <div style="font-size: 0.68rem; color: var(--text-dim);">MODERATE SURVEILLANCE</div>
      </div>
      <div style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); padding: 14px; border-radius: var(--radius-sm); text-align: center;">
        <div style="font-size: 1.8rem; font-weight: 800; color: var(--cyan-primary);">${t.total_hectares_impacted || 0} ha</div>
        <div style="font-size: 0.68rem; color: var(--text-dim);">IMPACTED FOOTPRINT</div>
      </div>
    </div>

    <h2 style="font-size: 1rem; color: #fff; margin-top: 10px;">TARGET RECONNAISSANCE DIRECTIVES</h2>
    ${criticals.map(z => `
      <div style="background: rgba(255, 255, 255, 0.02); border-left: 3px solid var(--crimson-hazard); padding: 12px; border-radius: 4px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; color: var(--crimson-hazard); margin-bottom: 4px;">
          <span>${z.zone_id} // ${z.classification?.type} (Urgency: ${z.urgency_score})</span>
          <span>Window: ${z.incident_brief?.timeline}</span>
        </div>
        <p style="margin: 0 0 6px 0; font-size: 0.8rem; color: #cbd5e1; line-height: 1.5;">${z.incident_brief?.brief_text}</p>
        <div style="font-size: 0.75rem; color: #fca5a5;"><strong>Action:</strong> ${z.incident_brief?.recommended_action}</div>
      </div>
    `).join('')}
  `;
}

// ==========================================
// EVENT BINDINGS & VIEW SWITCHING
// ==========================================
function bindEvents() {
  // Left Navigation Menu View Switching
  dom.navItems.forEach(item => {
    item.addEventListener('click', () => {
      dom.navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const viewName = item.dataset.view;
      switchView(viewName);
    });
  });

  // AOI Dataset Selector
  dom.aoiSelect.addEventListener('change', (e) => {
    loadDataset(e.target.value);
  });

  // Top Bar Actions
  dom.btnRescan.addEventListener('click', () => {
    loadDataset(state.currentDatasetId);
  });

  dom.btnExportDocketTop.addEventListener('click', () => {
    switchView('docket');
    // Also select the docket nav item
    dom.navItems.forEach(i => i.classList.toggle('active', i.dataset.view === 'docket'));
  });

  // Studio Sub-Toolbar Comparison Modes
  dom.btnModeDual.addEventListener('click', () => setComparisonMode('dual'));
  dom.btnModeCurtain.addEventListener('click', () => setComparisonMode('curtain'));
  dom.btnModeDiff.addEventListener('click', () => setComparisonMode('diff'));

  // Studio Layer Toggles
  dom.chkLayerHeatmap.addEventListener('change', updateHeatmapVisibility);
  dom.rngLayerOpacity.addEventListener('input', updateHeatmapVisibility);
  dom.chkLayerVectors.addEventListener('change', drawAllCanvases);

  // Inspector Tabs
  dom.inspTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.inspTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      dom.inspContentTabs.forEach(content => {
        content.classList.toggle('active', content.id === tabId);
      });
    });
  });

  // Audio Speech Synthesis
  dom.btnAudioBrief.addEventListener('click', () => {
    if (!state.selectedZone) return;
    const text = state.selectedZone.incident_brief?.brief_text || 'No operational brief available.';
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.05;
      window.speechSynthesis.speak(u);
    } else {
      alert('Speech synthesis is not supported in this browser.');
    }
  });

  // Authorize Dispatch Button
  dom.btnAuthorizeDispatch.addEventListener('click', () => {
    dom.btnAuthorizeDispatch.classList.add('dispatched');
    dom.btnAuthorizeDispatch.innerHTML = '<span>✓ Dispatched / En Route</span>';
  });

  // Triage Table Filter Chips
  dom.tableFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.tableFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.tableFilter = btn.dataset.tableFilter;
      if (state.analysisData) {
        renderTriageTable(state.analysisData.ranked_zones);
      }
    });
  });

  // Upload Modal
  dom.btnSidebarUpload.addEventListener('click', () => {
    dom.modalUploadBackdrop.classList.add('open');
  });

  dom.btnCloseModalUpload.addEventListener('click', () => {
    dom.modalUploadBackdrop.classList.remove('open');
  });

  dom.boxUploadBefore.addEventListener('click', () => dom.inputFileBefore.click());
  dom.boxUploadAfter.addEventListener('click', () => dom.inputFileAfter.click());

  dom.inputFileBefore.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      dom.lblFileBeforeName.textContent = `✓ Selected: ${e.target.files[0].name}`;
    }
  });

  dom.inputFileAfter.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      dom.lblFileAfterName.textContent = `✓ Selected: ${e.target.files[0].name}`;
    }
  });

  dom.formCustomUpload.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!dom.inputFileBefore.files[0] || !dom.inputFileAfter.files[0]) {
      alert('Please upload both Before and After satellite imagery.');
      return;
    }

    const formData = new FormData();
    formData.append('before_file', dom.inputFileBefore.files[0]);
    formData.append('after_file', dom.inputFileAfter.files[0]);
    formData.append('title', dom.inputMissionTitle.value);

    dom.modalUploadBackdrop.classList.remove('open');
    startRadar();

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Upload analysis failed');
      const data = await res.json();
      state.analysisData = data;
      state.datasetMetadata = data.dataset_metadata;
      state.selectedZone = data.ranked_zones[0] || null;
      renderAllViews(data);
      switchView('studio');
    } catch (err) {
      console.error(err);
      alert('Custom upload triage failed.');
    } finally {
      stopRadar();
    }
  });
}

function switchView(viewName) {
  state.activeView = viewName;
  Object.keys(dom.views).forEach(key => {
    dom.views[key].classList.toggle('active', key === viewName);
  });

  if (viewName === 'map') {
    setTimeout(() => {
      state.fullscreenMap?.invalidateSize();
    }, 150);
  } else if (viewName === 'studio') {
    setTimeout(() => {
      resizeCanvases();
      drawAllCanvases();
    }, 100);
  }
}

function setComparisonMode(mode) {
  state.comparisonMode = mode;
  dom.btnModeDual.classList.toggle('active', mode === 'dual');
  dom.btnModeCurtain.classList.toggle('active', mode === 'curtain');
  dom.btnModeDiff.classList.toggle('active', mode === 'diff');

  if (mode === 'dual') {
    dom.stageDualView.style.display = 'flex';
    dom.stageCurtainView.style.display = 'none';
    dom.imgDualHeatmap.style.display = dom.chkLayerHeatmap.checked ? 'block' : 'none';
  } else if (mode === 'curtain') {
    dom.stageDualView.style.display = 'none';
    dom.stageCurtainView.style.display = 'block';
  } else if (mode === 'diff') {
    dom.stageDualView.style.display = 'flex';
    dom.stageCurtainView.style.display = 'none';
    dom.chkLayerHeatmap.checked = true;
    updateHeatmapVisibility();
  }

  resizeCanvases();
  drawAllCanvases();
}

function updateHeatmapVisibility() {
  const isVisible = dom.chkLayerHeatmap.checked;
  const opacity = dom.rngLayerOpacity.value / 100;

  dom.imgDualHeatmap.style.display = isVisible ? 'block' : 'none';
  dom.imgDualHeatmap.style.opacity = opacity;

  dom.imgCurtainHeatmap.style.display = isVisible ? 'block' : 'none';
  dom.imgCurtainHeatmap.style.opacity = opacity;
}

// Start App on Load
document.addEventListener('DOMContentLoaded', init);
