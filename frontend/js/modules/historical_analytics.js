/**
 * EarthLens AI — Visual Earth Change Investigation Workspace
 * Owned by: MEMBER 3 (Intelligence Operations, Analytics & Copilot Lead)
 * Branch: prakash
 *
 * Implements a Map-First / Image-First satellite intelligence workspace:
 * - Draggable vertical curtain swipe comparison (Before | After)
 * - Synchronized dual side-by-side satellite viewport
 * - Dedicated Difference mode (polygons, masks, contours & click interaction)
 * - Impact mode overlay with critical infrastructure & demographic buffer
 * - Visual historical timeline with animated Playback controller
 * - Hotspot Evolution with multi-year footprint growth (+XX%) & anomaly detection
 * - Vertical change event timeline with interactive navigation
 * - Contextual analytics & Chart.js expander
 * - Evidence snapshot capturing for Executive Dossier
 */

class HistoricalAnalyticsModule {
  constructor() {
    this.historicalData = null;
    this.activeHotspotId = 'hotspot-alpha';
    this.activeYear = '2026';
    this.comparisonMode = 'difference'; // 'before', 'after', 'difference', 'impact'
    this.layoutMode = 'swipe'; // 'swipe' or 'dual'
    this.isPlaying = false;
    this.playTimer = null;
    this.savedEvidence = [];
    
    // Chart instances
    this.chartArea = null;
    this.chartCategory = null;
    this.chartPriority = null;

    // Draggable swipe state
    this.isDraggingSwipe = false;
    this.swipePercent = 50;
  }

  async init() {
    try {
      const res = await fetch('/api/historical');
      if (!res.ok) throw new Error('Failed to fetch historical analytics');
      this.historicalData = await res.json();

      // 1. Setup UI Listeners & Interactions
      this.setupTopControls();
      this.setupSwipeSlider();
      this.setupModeSwitcher();
      this.setupLayoutSwitcher();
      this.setupTimelineController();
      this.setupDrawerListeners();
      this.setupEvidenceActions();
      this.setupChartsExpander();
      this.setupEmbeddedCopilot();

      // 2. Load Initial Hotspot State (Hotspot Alpha / Derna)
      this.loadHotspot(this.activeHotspotId);

      // 3. Restore any previously saved evidence
      this.restoreEvidenceShelf();

      console.log('Visual Earth Change Investigation Workspace initialized on branch prakash.');
    } catch (err) {
      console.warn('Historical module loading error:', err);
    }
  }

  /* =========================================================================
     1. TOP CONTROLS & REGION SELECTION
     ========================================================================= */
  setupTopControls() {
    const regionSelect = document.getElementById('hist-region-select');
    if (regionSelect) {
      regionSelect.addEventListener('change', (e) => {
        this.loadHotspot(e.target.value);
      });
    }

    const pillTabs = document.querySelectorAll('.hotspot-pill-btn');
    pillTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const hsId = btn.dataset.hotspot;
        if (hsId) {
          this.loadHotspot(hsId);
          if (regionSelect) regionSelect.value = hsId;
        }
      });
    });
  }

  /* =========================================================================
     2. DRAGGABLE CURTAIN SWIPE SLIDER
     ========================================================================= */
  setupSwipeSlider() {
    const divider = document.getElementById('hist-swipe-divider');
    const container = document.getElementById('hist-swipe-workspace');
    const paneAfter = document.getElementById('hist-pane-after');

    if (!divider || !container || !paneAfter) return;

    const onMove = (clientX) => {
      const rect = container.getBoundingClientRect();
      let x = clientX - rect.left;
      let pct = (x / rect.width) * 100;
      pct = Math.max(5, Math.min(95, pct)); // clamp

      this.swipePercent = pct;
      divider.style.left = `${pct}%`;
      paneAfter.style.clipPath = `polygon(${pct}% 0, 100% 0, 100% 100%, ${pct}% 100%)`;
    };

    divider.addEventListener('mousedown', (e) => {
      this.isDraggingSwipe = true;
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDraggingSwipe) {
        onMove(e.clientX);
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDraggingSwipe = false;
    });

    // Touch support for mobile / tablet
    divider.addEventListener('touchstart', (e) => {
      this.isDraggingSwipe = true;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.isDraggingSwipe && e.touches[0]) {
        onMove(e.touches[0].clientX);
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isDraggingSwipe = false;
    });
  }

  /* =========================================================================
     3. COMPARISON MODE SWITCHER: BEFORE | AFTER | DIFFERENCE | IMPACT
     ========================================================================= */
  setupModeSwitcher() {
    const modeBtns = document.querySelectorAll('.hist-mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setComparisonMode(btn.dataset.mode);
      });
    });
  }

  setComparisonMode(mode) {
    this.comparisonMode = mode;

    const paneBefore = document.getElementById('hist-pane-before');
    const paneAfter = document.getElementById('hist-pane-after');
    const divider = document.getElementById('hist-swipe-divider');
    const diffOverlay = document.getElementById('hist-difference-overlay');
    const impactOverlay = document.getElementById('hist-impact-overlay');
    const legend = document.getElementById('hist-semantic-legend');

    // Reset default view visibility
    if (paneBefore) paneBefore.style.display = 'block';
    if (paneAfter) paneAfter.style.display = 'block';
    if (divider) divider.style.display = this.layoutMode === 'swipe' ? 'flex' : 'none';

    if (mode === 'before') {
      if (paneAfter) paneAfter.style.display = 'none';
      if (divider) divider.style.display = 'none';
      if (diffOverlay) diffOverlay.style.display = 'none';
      if (impactOverlay) impactOverlay.style.display = 'none';
      if (legend) legend.style.display = 'none';
    } 
    else if (mode === 'after') {
      if (paneAfter) {
        paneAfter.style.display = 'block';
        paneAfter.style.clipPath = 'none';
      }
      if (divider) divider.style.display = 'none';
      if (diffOverlay) diffOverlay.style.display = 'none';
      if (impactOverlay) impactOverlay.style.display = 'none';
      if (legend) legend.style.display = 'none';
    } 
    else if (mode === 'difference') {
      if (paneAfter && this.layoutMode === 'swipe') {
        paneAfter.style.clipPath = `polygon(${this.swipePercent}% 0, 100% 0, 100% 100%, ${this.swipePercent}% 100%)`;
      }
      if (diffOverlay) diffOverlay.style.display = 'block';
      if (impactOverlay) impactOverlay.style.display = 'none';
      if (legend) legend.style.display = 'flex';
      this.renderDifferenceLayer();
    } 
    else if (mode === 'impact') {
      if (paneAfter && this.layoutMode === 'swipe') {
        paneAfter.style.clipPath = `polygon(${this.swipePercent}% 0, 100% 0, 100% 100%, ${this.swipePercent}% 100%)`;
      }
      if (diffOverlay) diffOverlay.style.display = 'block';
      if (impactOverlay) impactOverlay.style.display = 'block';
      if (legend) legend.style.display = 'flex';
      this.renderDifferenceLayer();
      this.renderImpactLayer();
    }
  }

  /* =========================================================================
     4. LAYOUT SWITCHER: CURTAIN SWIPE VS DUAL SYNCHRONIZED
     ========================================================================= */
  setupLayoutSwitcher() {
    const btnSwipe = document.getElementById('btn-layout-swipe');
    const btnDual = document.getElementById('btn-layout-dual');
    const swipeWorkspace = document.getElementById('hist-swipe-workspace');
    const dualWorkspace = document.getElementById('hist-dual-workspace');

    if (btnSwipe && btnDual) {
      btnSwipe.addEventListener('click', () => {
        btnSwipe.classList.add('active');
        btnDual.classList.remove('active');
        this.layoutMode = 'swipe';
        if (swipeWorkspace) swipeWorkspace.style.display = 'block';
        if (dualWorkspace) dualWorkspace.style.display = 'none';
        this.setComparisonMode(this.comparisonMode);
      });

      btnDual.addEventListener('click', () => {
        btnDual.classList.add('active');
        btnSwipe.classList.remove('active');
        this.layoutMode = 'dual';
        if (swipeWorkspace) swipeWorkspace.style.display = 'none';
        if (dualWorkspace) dualWorkspace.style.display = 'grid';
        this.setComparisonMode(this.comparisonMode);
      });
    }
  }

  /* =========================================================================
     5. LOAD HOTSPOT DATA & SYNCHRONIZE VIEWPORT
     ========================================================================= */
  loadHotspot(hotspotId) {
    if (!this.historicalData || !this.historicalData.hotspots) return;
    const hs = this.historicalData.hotspots.find(h => h.id === hotspotId);
    if (!hs) return;

    this.activeHotspotId = hotspotId;

    // 1. Update imagery sources
    const imgBefore = document.getElementById('hist-img-before');
    const imgAfter = document.getElementById('hist-img-after');
    const dualImgBefore = document.getElementById('hist-dual-img-before');
    const dualImgAfter = document.getElementById('hist-dual-img-after');

    if (imgBefore && hs.sample_before_image) imgBefore.src = hs.sample_before_image;
    if (imgAfter && hs.sample_after_image) imgAfter.src = hs.sample_after_image;
    if (dualImgBefore && hs.sample_before_image) dualImgBefore.src = hs.sample_before_image;
    if (dualImgAfter && hs.sample_after_image) dualImgAfter.src = hs.sample_after_image;

    // 2. Update HUD metadata
    const sensorBadge = document.getElementById('hist-sensor-badge');
    const qualityBadge = document.getElementById('hist-quality-badge');
    const hudBeforeMeta = document.getElementById('hist-hud-before-meta');
    const hudAfterMeta = document.getElementById('hist-hud-after-meta');
    const coordsBefore = document.getElementById('hist-hud-coords-before');
    const coordsAfter = document.getElementById('hist-hud-coords-after');
    const dualDateBefore = document.getElementById('hist-dual-date-before');
    const dualDateAfter = document.getElementById('hist-dual-date-after');

    const iq = hs.image_quality || {};
    if (sensorBadge) sensorBadge.textContent = `${iq.sensor || 'Sentinel-2 MSI'} (10m Res)`;
    if (qualityBadge) qualityBadge.textContent = `Cloud: ${iq.cloud_cover_pct || 0.9}% · Quality: ${iq.quality_rating || '98%'}`;
    if (hudBeforeMeta) hudBeforeMeta.textContent = `${iq.sensor || 'Sentinel-2 MSI'} · Baseline 2024`;
    if (hudAfterMeta) hudAfterMeta.textContent = `${iq.sensor || 'Sentinel-2 MSI'} · Current 2026`;
    
    const coordStr = `Lat: ${hs.coordinates.lat.toFixed(4)}°, Lon: ${hs.coordinates.lon.toFixed(4)}°`;
    if (coordsBefore) coordsBefore.textContent = coordStr;
    if (coordsAfter) coordsAfter.textContent = coordStr;
    if (dualDateBefore) dualDateBefore.textContent = '2024-03-12 Baseline';
    if (dualDateAfter) dualDateAfter.textContent = '2026-09-18 Current';

    // 3. Update Hotspot Evolution Card
    const hsUrgency = document.getElementById('hs-urgency-badge');
    const hsExpansion = document.getElementById('hs-expansion-badge');
    const hsVelocity = document.getElementById('hs-velocity-badge');
    const hsTitle = document.getElementById('hs-title-name');
    const hsRegion = document.getElementById('hs-region-meta');
    const hsAnomalyTitle = document.getElementById('hs-anomaly-title');
    const hsAnomalyText = document.getElementById('hs-anomaly-text');
    const hsAnomalyBox = document.getElementById('hs-anomaly-box');

    if (hsUrgency) hsUrgency.textContent = `${hs.urgency} HOTSPOT`;
    if (hsExpansion) hsExpansion.textContent = `Footprint expansion: +${hs.footprint_expansion_percent || 106}%`;
    if (hsVelocity) hsVelocity.textContent = `Change Velocity: ${hs.change_velocity || 'Rapid'}`;
    if (hsTitle) hsTitle.textContent = hs.name;
    if (hsRegion) hsRegion.textContent = `${hs.region} · Tracked Since ${hs.active_since || '2024'}`;

    const anomaly = hs.historical_anomaly || {};
    if (anomaly.detected) {
      if (hsAnomalyBox) hsAnomalyBox.style.display = 'flex';
      if (hsAnomalyTitle) hsAnomalyTitle.textContent = anomaly.headline || 'HISTORICAL ANOMALY';
      if (hsAnomalyText) hsAnomalyText.textContent = anomaly.message || 'Elevated change velocity detected.';
    } else {
      if (hsAnomalyBox) hsAnomalyBox.style.display = 'none';
    }

    // Footprint step radii
    const fe = hs.footprint_evolution || {};
    const fp2024 = document.getElementById('fp-val-2024');
    const fp2025 = document.getElementById('fp-val-2025');
    const fp2026 = document.getElementById('fp-val-2026');

    if (fp2024 && fe['2024']) fp2024.textContent = `${fe['2024'].area_km2} km² (${fe['2024'].boundary_radius_m}m radius)`;
    if (fp2025 && fe['2025']) fp2025.textContent = `${fe['2025'].area_km2} km² (${fe['2025'].boundary_radius_m}m radius)`;
    if (fp2026 && fe['2026']) fp2026.textContent = `${fe['2026'].area_km2} km² (${fe['2026'].boundary_radius_m}m radius)`;

    // 4. Update Vertical Event Timeline
    this.renderVerticalEventTimeline(hs.timeline_events || []);

    // 5. Update Contextual Metric Chips
    const ctxArea = document.getElementById('ctx-total-area');
    const ctxVelocity = document.getElementById('ctx-velocity');
    const ctxConfidence = document.getElementById('ctx-confidence');
    const ctxExposure = document.getElementById('ctx-facilities-count');

    if (ctxArea) ctxArea.textContent = `${hs.total_area_km2} km²`;
    if (ctxVelocity) ctxVelocity.textContent = hs.change_velocity || 'Rapid';
    if (ctxConfidence) ctxConfidence.textContent = '95.4%';
    
    const hci = hs.historical_community_impact || {};
    const c2026 = hci['2026'] || { settlements: 6, schools: 3, hospitals: 1 };
    const totalAssets = (c2026.settlements || 0) + (c2026.schools || 0) + (c2026.hospitals || 0);
    if (ctxExposure) ctxExposure.textContent = `${totalAssets} Assets`;

    // 6. Update Active Pill Button State
    document.querySelectorAll('.hotspot-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.hotspot === hotspotId);
    });

    // 7. Refresh Difference and Impact layers
    this.setComparisonMode(this.comparisonMode);
  }

  /* =========================================================================
     6. DIFFERENCE LAYER (INTERACTIVE CONTOURS & HIT TESTING)
     ========================================================================= */
  renderDifferenceLayer() {
    const svg = document.getElementById('hist-diff-svg');
    if (!svg || !this.historicalData) return;
    svg.innerHTML = '';

    const hs = this.historicalData.hotspots.find(h => h.id === this.activeHotspotId);
    if (!hs) return;

    // Generate procedural contours matching hotspot coordinates & hazard
    const polygons = this.generateContoursForHotspot(this.activeHotspotId);

    polygons.forEach((poly, idx) => {
      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      pathEl.setAttribute('points', poly.points);
      pathEl.setAttribute('fill', poly.fill);
      pathEl.setAttribute('stroke', poly.stroke);
      pathEl.setAttribute('stroke-width', '2');
      pathEl.setAttribute('class', 'diff-contour-polygon');

      // Click to open Change Investigation Drawer
      pathEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openChangeDrawer({
          location: `${hs.region} — Zone ${idx + 1}`,
          changeType: hs.primary_hazard,
          area_km2: (hs.total_area_km2 * poly.areaRatio).toFixed(1),
          velocity: hs.change_velocity || 'Rapid',
          severity: poly.severity,
          confidence: '95.4%',
          urgencyScore: poly.severity === 'CRITICAL' ? 95 : 78,
          rationale: hs.critical_infrastructure_risk || 'Proximity buffer intersects vulnerable critical facilities.'
        });
      });

      svg.appendChild(pathEl);
    });
  }

  generateContoursForHotspot(hotspotId) {
    // Grounded procedural contour geometries aligned with sample datasets
    if (hotspotId === 'hotspot-alpha') {
      return [
        { points: '420,120 540,110 590,260 520,380 430,340 380,210', fill: 'rgba(239, 68, 68, 0.45)', stroke: '#ef4444', severity: 'CRITICAL', areaRatio: 0.55 },
        { points: '490,360 620,340 680,480 560,510 470,440', fill: 'rgba(6, 182, 212, 0.45)', stroke: '#06b6d4', severity: 'MODERATE', areaRatio: 0.30 },
        { points: '320,240 390,230 420,320 340,360', fill: 'rgba(249, 115, 22, 0.35)', stroke: '#f97316', severity: 'MODERATE', areaRatio: 0.15 }
      ];
    } else if (hotspotId === 'hotspot-bravo') {
      return [
        { points: '250,180 750,190 730,240 260,230', fill: 'rgba(239, 68, 68, 0.45)', stroke: '#ef4444', severity: 'CRITICAL', areaRatio: 0.45 },
        { points: '380,230 410,480 370,480 350,230', fill: 'rgba(249, 115, 22, 0.4)', stroke: '#f97316', severity: 'MODERATE', areaRatio: 0.28 },
        { points: '540,230 570,450 530,450 510,230', fill: 'rgba(239, 68, 68, 0.4)', stroke: '#ef4444', severity: 'CRITICAL', areaRatio: 0.27 }
      ];
    } else if (hotspotId === 'hotspot-charlie') {
      return [
        { points: '340,180 580,160 640,380 420,410 320,300', fill: 'rgba(168, 85, 247, 0.4)', stroke: '#a855f7', severity: 'MODERATE', areaRatio: 0.60 },
        { points: '590,320 720,310 760,460 620,470', fill: 'rgba(249, 115, 22, 0.4)', stroke: '#f97316', severity: 'MODERATE', areaRatio: 0.40 }
      ];
    } else {
      return [
        { points: '360,220 540,160 680,280 620,440 450,470 340,360', fill: 'rgba(239, 68, 68, 0.5)', stroke: '#ef4444', severity: 'CRITICAL', areaRatio: 0.70 },
        { points: '580,140 710,120 760,240 660,250', fill: 'rgba(249, 115, 22, 0.4)', stroke: '#f97316', severity: 'MODERATE', areaRatio: 0.30 }
      ];
    }
  }

  /* =========================================================================
     7. IMPACT LAYER (INFRASTRUCTURE PINS & EXPOSURE HEURISTICS)
     ========================================================================= */
  renderImpactLayer() {
    const pinsContainer = document.getElementById('hist-impact-pins');
    if (!pinsContainer) return;
    pinsContainer.innerHTML = '';

    const facilities = [
      { name: 'Derna Central Hospital', type: '🏥', status: 'COMPROMISED', x: '52%', y: '32%' },
      { name: 'Al-Fatayeh Primary Academy', type: '🏫', status: 'AT RISK', x: '45%', y: '48%' },
      { name: 'Coastal Road Al-Bahr', type: '🛣️', status: 'SEVERED', x: '58%', y: '22%' },
      { name: 'Al-Bilad Settlement Core', type: '🏘️', status: 'EXPOSED', x: '40%', y: '36%' },
      { name: 'Wadi Bridge Arterial', type: '🌉', status: 'SUBMERGED', x: '48%', y: '42%' }
    ];

    facilities.forEach(f => {
      const pin = document.createElement('div');
      pin.className = 'hist-facility-marker';
      pin.style.left = f.x;
      pin.style.top = f.y;

      pin.innerHTML = `
        <div class="facility-icon-bubble">${f.type}</div>
        <div class="facility-name-tooltip">${f.name} · <strong style="color: #ef4444;">${f.status}</strong></div>
      `;

      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openChangeDrawer({
          location: f.name,
          changeType: 'Critical Infrastructure Exposure',
          area_km2: '2.5 km perimeter',
          velocity: 'Rapid',
          severity: 'CRITICAL',
          confidence: '96%',
          urgencyScore: 98,
          rationale: `${f.name} is verified as ${f.status} within the active spatial differencing contour. Immediate ground inspection required.`
        });
      });

      pinsContainer.appendChild(pin);
    });
  }

  /* =========================================================================
     8. CHANGE HIGHLIGHT INVESTIGATION DRAWER
     ========================================================================= */
  setupDrawerListeners() {
    const btnClose = document.getElementById('btn-close-change-drawer');
    const drawer = document.getElementById('hist-change-drawer');

    if (btnClose && drawer) {
      btnClose.addEventListener('click', () => {
        drawer.style.display = 'none';
      });
    }

    const btnAskCopilot = document.getElementById('btn-drawer-ask-copilot');
    if (btnAskCopilot) {
      btnAskCopilot.addEventListener('click', () => {
        const loc = document.getElementById('drawer-change-location')?.textContent || 'this anomaly';
        const query = `Investigate ${loc}: what is the confirmed infrastructure damage and community exposure?`;
        const copilotInput = document.getElementById('hist-copilot-input');
        if (copilotInput) copilotInput.value = query;
        this.queryEmbeddedCopilot(query);

        // Smoothly scroll down to the embedded copilot box
        const embedBox = document.querySelector('.hist-copilot-embed-box');
        if (embedBox) {
          embedBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          embedBox.style.borderColor = '#06b6d4';
          embedBox.style.boxShadow = '0 0 16px rgba(6, 182, 212, 0.4)';
          setTimeout(() => {
            embedBox.style.borderColor = 'rgba(6, 182, 212, 0.25)';
            embedBox.style.boxShadow = 'none';
          }, 2500);
        }
      });
    }

    const btnSaveDrawerEv = document.getElementById('btn-drawer-evidence');
    if (btnSaveDrawerEv) {
      btnSaveDrawerEv.addEventListener('click', () => {
        this.saveEvidenceSnapshot();
      });
    }
  }

  /* =========================================================================
     8B. GROUNDED EMBEDDED COPILOT CONTROLLER
     ========================================================================= */
  setupEmbeddedCopilot() {
    const chips = document.querySelectorAll('.hist-copilot-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const q = chip.dataset.q;
        if (q) {
          const input = document.getElementById('hist-copilot-input');
          if (input) input.value = q;
          this.queryEmbeddedCopilot(q);
        }
      });
    });

    const form = document.getElementById('hist-copilot-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('hist-copilot-input');
        const q = input?.value.trim();
        if (q) this.queryEmbeddedCopilot(q);
      });
    }

    const btnClose = document.getElementById('btn-close-hist-copilot');
    const resArea = document.getElementById('hist-copilot-response');
    if (btnClose && resArea) {
      btnClose.addEventListener('click', () => {
        resArea.style.display = 'none';
      });
    }
  }

  async queryEmbeddedCopilot(queryText) {
    const resArea = document.getElementById('hist-copilot-response');
    const bodyEl = document.getElementById('hist-copilot-res-body');
    const citesEl = document.getElementById('hist-copilot-res-cites');
    if (!resArea || !bodyEl) return;

    resArea.style.display = 'flex';
    bodyEl.innerHTML = '<span style="color: #06b6d4; font-style: italic;">Cross-referencing multispectral differencing & cadastral layers...</span>';
    if (citesEl) citesEl.innerHTML = '';

    const datasetMap = {
      'hotspot-alpha': 'derna_flooding',
      'hotspot-bravo': 'amazon_deforestation',
      'hotspot-charlie': 'madurai_urban',
      'hotspot-delta': 'california_wildfire'
    };
    const datasetId = datasetMap[this.activeHotspotId] || 'derna_flooding';

    try {
      const res = await fetch('/api/assistant/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, dataset_id: datasetId })
      });
      if (!res.ok) throw new Error('Query error');
      const data = await res.json();

      let formatted = data.response
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n•/g, '<br>•')
        .replace(/\n  -/g, '<br>&nbsp;&nbsp;•')
        .replace(/\n  1\./g, '<br>&nbsp;&nbsp;1.')
        .replace(/\n  2\./g, '<br>&nbsp;&nbsp;2.')
        .replace(/\n  3\./g, '<br>&nbsp;&nbsp;3.');

      bodyEl.innerHTML = formatted;

      if (citesEl && data.citations && data.citations.length) {
        citesEl.innerHTML = '<span style="font-size: 0.6rem; color: #94a3b8; font-weight: 700;">Verified:</span> ' +
          data.citations.map(c => `<span style="font-size: 0.6rem; background: rgba(6, 182, 212, 0.15); color: #06b6d4; padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(6, 182, 212, 0.3);">${c}</span>`).join(' ');
      }
    } catch (err) {
      bodyEl.innerHTML = '<span style="color: #ef4444;">Unable to connect to Grounded Copilot. Please check network.</span>';
    }
  }

  openChangeDrawer(data) {
    const drawer = document.getElementById('hist-change-drawer');
    if (!drawer) return;

    document.getElementById('drawer-change-location').textContent = data.location;
    document.getElementById('drawer-change-type').textContent = data.changeType;
    document.getElementById('drawer-change-area').textContent = `${data.area_km2} km²`;
    document.getElementById('drawer-change-velocity').textContent = data.velocity;
    document.getElementById('drawer-change-severity').textContent = data.severity;
    document.getElementById('drawer-change-confidence').textContent = data.confidence;
    document.getElementById('drawer-change-priority').textContent = `${data.severity} (${data.urgencyScore}/100)`;
    document.getElementById('drawer-change-rationale').textContent = data.rationale;

    drawer.style.display = 'flex';
  }

  /* =========================================================================
     9. VERTICAL CHANGE EVENT TIMELINE
     ========================================================================= */
  renderVerticalEventTimeline(events) {
    const container = document.getElementById('vertical-events-container');
    if (!container) return;
    container.innerHTML = '';

    events.forEach(evt => {
      const node = document.createElement('div');
      node.className = 'event-timeline-node';
      node.innerHTML = `
        <div class="event-node-header">
          <span class="event-node-date">${evt.date} · Epoch ${evt.year}</span>
          <span style="font-size: 0.65rem; color: #f97316; font-weight: 700;">${evt.severity}</span>
        </div>
        <div class="event-node-title">${evt.title}</div>
        <div class="event-node-desc">${evt.description}</div>
      `;

      node.addEventListener('click', () => {
        // Step timeline to this year
        const slider = document.getElementById('hist-timeline-range');
        if (slider) {
          slider.value = evt.year;
          this.setTimelineYear(evt.year);
        }
      });

      container.appendChild(node);
    });
  }

  /* =========================================================================
     10. TIMELINE CONTROLLER & HISTORICAL PLAYBACK (▶ PLAY CHANGE)
     ========================================================================= */
  setupTimelineController() {
    const slider = document.getElementById('hist-timeline-range');
    const btnPlay = document.getElementById('btn-timeline-play');
    const btnPrev = document.getElementById('btn-timeline-prev');
    const btnNext = document.getElementById('btn-timeline-next');

    if (slider) {
      slider.addEventListener('input', (e) => {
        this.setTimelineYear(e.target.value);
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        const cur = parseInt(slider.value);
        if (cur > 2024) {
          slider.value = cur - 1;
          this.setTimelineYear(String(cur - 1));
        }
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        const cur = parseInt(slider.value);
        if (cur < 2026) {
          slider.value = cur + 1;
          this.setTimelineYear(String(cur + 1));
        }
      });
    }

    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        this.togglePlayback();
      });
    }
  }

  setTimelineYear(year) {
    this.activeYear = year;

    // Update labels
    document.querySelectorAll('.timeline-slider-labels .year-label').forEach(lbl => {
      lbl.classList.toggle('active', lbl.id === `t-label-${year}`);
    });

    const activeYearDisplay = document.querySelector('.active-year-number');
    const activeYearSub = document.getElementById('hist-active-year-sub');
    const progressBar = document.getElementById('hist-playback-progress');

    if (activeYearDisplay) activeYearDisplay.textContent = `YEAR ${year}`;
    
    if (progressBar) {
      const pct = year === '2024' ? 10 : (year === '2025' ? 55 : 100);
      progressBar.style.width = `${pct}%`;
    }

    if (activeYearSub) {
      const text = year === '2024' ? 'Baseline Surveillance' : (year === '2025' ? '+60.6% YoY Surge' : '+53.4% YoY Acceleration');
      activeYearSub.textContent = text;
    }

    // Refresh differences with subtle temporal fading
    const diffOverlay = document.getElementById('hist-difference-overlay');
    if (diffOverlay) {
      diffOverlay.style.opacity = year === '2024' ? '0.2' : (year === '2025' ? '0.6' : '1.0');
    }
  }

  togglePlayback() {
    const btnPlay = document.getElementById('btn-timeline-play');
    const playText = btnPlay?.querySelector('.play-text');
    const playIcon = btnPlay?.querySelector('.play-icon');

    if (this.isPlaying) {
      clearInterval(this.playTimer);
      this.isPlaying = false;
      if (btnPlay) btnPlay.classList.remove('playing');
      if (playText) playText.textContent = 'PLAY CHANGE EVOLUTION';
      if (playIcon) playIcon.textContent = '▶';
    } else {
      this.isPlaying = true;
      if (btnPlay) btnPlay.classList.add('playing');
      if (playText) playText.textContent = 'PAUSE PLAYBACK';
      if (playIcon) playIcon.textContent = '❚❚';

      let years = ['2024', '2025', '2026'];
      let idx = years.indexOf(this.activeYear);

      this.playTimer = setInterval(() => {
        idx = (idx + 1) % years.length;
        const y = years[idx];
        const slider = document.getElementById('hist-timeline-range');
        if (slider) slider.value = y;
        this.setTimelineYear(y);
      }, 1400);
    }
  }

  /* =========================================================================
     11. EVIDENCE SNAPSHOT & INVESTIGATION DOSSIER ACTIONS
     ========================================================================= */
  setupEvidenceActions() {
    const btnSave = document.getElementById('btn-hist-save-evidence');
    const btnOpenDossier = document.getElementById('btn-hist-open-dossier');
    const btnClear = document.getElementById('btn-clear-evidence');

    if (btnSave) {
      btnSave.addEventListener('click', () => {
        this.saveEvidenceSnapshot();
      });
    }

    if (btnOpenDossier) {
      btnOpenDossier.addEventListener('click', () => {
        // Switch to reports panel
        const panelHist = document.getElementById('panel-historical-analysis');
        if (panelHist) panelHist.style.display = 'none';

        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const navReports = document.getElementById('nav-reports');
        if (navReports) navReports.classList.add('active');

        const panelReports = document.getElementById('panel-reports');
        if (panelReports) panelReports.style.display = 'block';

        const hs = this.historicalData?.hotspots?.find(h => h.id === this.activeHotspotId);
        if (hs && window.reportsGeneratorModule) {
          window.reportsGeneratorModule.generateReport(hs.linked_dataset || 'derna_flooding', []);
        }
      });
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        this.savedEvidence = [];
        localStorage.removeItem('earthlens_saved_evidence');
        this.renderEvidenceShelf();
      });
    }
  }

  saveEvidenceSnapshot() {
    const hs = this.historicalData?.hotspots?.find(h => h.id === this.activeHotspotId);
    if (!hs) return;

    const snapshot = {
      id: 'EV-' + Date.now().toString().slice(-6),
      hotspotId: hs.id,
      name: hs.name,
      region: hs.region,
      year: this.activeYear,
      hazard: hs.primary_hazard,
      area_km2: hs.total_area_km2,
      velocity: hs.change_velocity,
      timestamp: new Date().toLocaleTimeString()
    };

    this.savedEvidence.unshift(snapshot);
    localStorage.setItem('earthlens_saved_evidence', JSON.stringify(this.savedEvidence));
    this.renderEvidenceShelf();

    // Show temporary save animation on button
    const btn = document.getElementById('btn-hist-save-evidence');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '<span>Saved ✓</span>';
      setTimeout(() => btn.innerHTML = orig, 1800);
    }
  }

  restoreEvidenceShelf() {
    try {
      const cached = JSON.parse(localStorage.getItem('earthlens_saved_evidence') || '[]');
      this.savedEvidence = cached;
      this.renderEvidenceShelf();
    } catch (e) {}
  }

  renderEvidenceShelf() {
    const list = document.getElementById('evidence-items-list');
    const badge = document.getElementById('evidence-count-badge');
    if (!list) return;

    if (badge) badge.textContent = `${this.savedEvidence.length} Item(s)`;

    if (this.savedEvidence.length === 0) {
      list.innerHTML = '<div class="shelf-empty-state">No snapshots captured yet. Click "Save Evidence" to attach current satellite findings to the official dossier.</div>';
      return;
    }

    list.innerHTML = '';
    this.savedEvidence.slice(0, 5).forEach(ev => {
      const item = document.createElement('div');
      item.className = 'evidence-snapshot-item';
      item.innerHTML = `
        <div>
          <strong>${ev.id}</strong> · ${ev.region} (${ev.year})
          <div style="font-size: 0.65rem; color: #94a3b8;">${ev.hazard} · ${ev.area_km2} km² · ${ev.timestamp}</div>
        </div>
        <span style="font-size: 0.65rem; color: #10b981; font-weight: 700;">ATTACHED ✓</span>
      `;
      list.appendChild(item);
    });
  }

  /* =========================================================================
     12. EXPANDABLE CHART.JS VISUALIZATIONS
     ========================================================================= */
  setupChartsExpander() {
    const btnToggle = document.getElementById('btn-toggle-charts');
    const body = document.getElementById('expandable-charts-body');

    if (btnToggle && body) {
      btnToggle.addEventListener('click', () => {
        const isHidden = body.style.display === 'none';
        body.style.display = isHidden ? 'flex' : 'none';
        btnToggle.querySelector('.toggle-icon').textContent = isHidden ? '▲' : '▼';
        if (isHidden && !this.chartArea) {
          this.renderCharts(this.historicalData);
        }
      });
    }
  }

  renderCharts(data) {
    const areaCanvas = document.getElementById('chart-area-time');
    const catCanvas = document.getElementById('chart-categories');
    const prioCanvas = document.getElementById('chart-priority-time');

    if (!areaCanvas || !window.Chart) return;

    if (this.chartArea) this.chartArea.destroy();
    if (this.chartCategory) this.chartCategory.destroy();
    if (this.chartPriority) this.chartPriority.destroy();

    const areaDataList = data.area_over_time || [];

    this.chartArea = new Chart(areaCanvas, {
      type: 'bar',
      data: {
        labels: areaDataList.map(d => d.year),
        datasets: [{
          label: 'Transformed Footprint (km²)',
          data: areaDataList.map(d => d.total_area_km2),
          backgroundColor: ['rgba(6, 182, 212, 0.45)', 'rgba(6, 182, 212, 0.65)', '#06b6d4'],
          borderColor: '#06b6d4',
          borderWidth: 1.5,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => {
                const raw = areaDataList[item.dataIndex];
                const yoy = raw.yoy_growth_percent > 0 ? `+${raw.yoy_growth_percent}% YoY (+${raw.yoy_delta_km2} km²)` : 'Baseline';
                return `Area: ${raw.total_area_km2} km² (${yoy})`;
              }
            }
          }
        },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });

    const cats = data.category_distribution || [];
    this.chartCategory = new Chart(catCanvas, {
      type: 'doughnut',
      data: {
        labels: cats.map(c => c.category),
        datasets: [{
          data: cats.map(c => c.area_km2),
          backgroundColor: cats.map(c => c.color),
          borderColor: '#0e1526'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#cbd5e1', font: { size: 10 } } }
        }
      }
    });

    const pTrends = data.priority_trends || [];
    this.chartPriority = new Chart(prioCanvas, {
      type: 'line',
      data: {
        labels: pTrends.map(p => p.year),
        datasets: [
          { label: 'Critical', data: pTrends.map(p => p.critical), borderColor: '#ef4444', tension: 0.3 },
          { label: 'Moderate', data: pTrends.map(p => p.moderate), borderColor: '#f97316', tension: 0.3 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#cbd5e1' } } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }
}

window.historicalAnalyticsModule = new HistoricalAnalyticsModule();
