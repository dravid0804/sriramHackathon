/**
 * EarthLens AI — Earth Change Investigation Workspace
 * Owned by: MEMBER 3 (Intelligence Operations, Analytics & Surveillance)
 * Branch: prakash
 *
 * Implements ONLY the 6 core features:
 * 1. Before vs After Satellite Comparison (65-75% viewport, drag divider, synchronized zoom/pan)
 * 2. Difference / Change Visualization ([BEFORE] [AFTER] [DIFFERENCE] [IMPACT], transparent polygons, legend, click-to-inspect)
 * 3. Community & Infrastructure Impact (verified facilities overlay, non-speculative labeling)
 * 4. Historical Timeline + Playback (2024 -> 2025 -> 2026 scrubber + Play button)
 * 5. Hotspot Investigation (Numbered 01-04 list, footprint evolution 2024->2026, +XX% growth)
 * 6. Evidence Snapshot + Dossier (Save Evidence, Evidence Shelf, Generate Executive Dossier)
 */

class HistoricalAnalyticsModule {
  constructor() {
    this.historicalData = null;
    this.activeHotspotId = 'hotspot-charlie'; // Default: Madurai Peri-Urban Corridor
    this.activeYear = '2026';
    this.comparisonMode = 'difference'; // 'before', 'after', 'difference', 'impact'
    this.isPlaying = false;
    this.playInterval = null;
    this.savedEvidence = [];

    // Drag-to-compare state
    this.isDraggingDivider = false;
    this.dividerPercent = 50;

    // Synchronized Zoom & Pan state
    this.zoomScale = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.startX = 0;
    this.startY = 0;
  }

  async init() {
    try {
      const res = await fetch('/api/historical');
      if (!res.ok) throw new Error('Failed to fetch historical analytics data');
      this.historicalData = await res.json();

      // Setup Subsystem Listeners
      this.setupDividerSwipe();
      this.setupModeSwitcher();
      this.setupZoomPanControls();
      this.setupTimelineController();
      this.setupHotspotsList();
      this.setupEvidenceActions();
      this.restoreEvidenceShelf();

      // Load Initial Hotspot State (Madurai)
      this.loadHotspot(this.activeHotspotId);

      console.log('Earth Change Investigation Workspace initialized on branch prakash.');
    } catch (err) {
      console.warn('Historical module loading error:', err);
    }
  }

  /* =========================================================================
     FEATURE 1: BEFORE vs AFTER SATELLITE COMPARISON (DRAG & ZOOM/PAN)
     ========================================================================= */
  setupDividerSwipe() {
    const divider = document.getElementById('hist-swipe-divider');
    const container = document.getElementById('hist-swipe-workspace');
    const paneAfter = document.getElementById('hist-pane-after');

    if (!divider || !container || !paneAfter) return;

    const onMove = (clientX) => {
      const rect = container.getBoundingClientRect();
      let x = clientX - rect.left;
      let pct = (x / rect.width) * 100;
      pct = Math.max(3, Math.min(97, pct)); // Clamp within bounds

      this.dividerPercent = pct;
      divider.style.left = `${pct}%`;
      paneAfter.style.clipPath = `polygon(${pct}% 0, 100% 0, 100% 100%, ${pct}% 100%)`;
    };

    divider.addEventListener('mousedown', (e) => {
      this.isDraggingDivider = true;
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDraggingDivider) {
        onMove(e.clientX);
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDraggingDivider = false;
    });

    // Touch support for tablets & mobile
    divider.addEventListener('touchstart', (e) => {
      this.isDraggingDivider = true;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.isDraggingDivider && e.touches[0]) {
        onMove(e.touches[0].clientX);
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isDraggingDivider = false;
    });
  }

  setupZoomPanControls() {
    const btnZoomIn = document.getElementById('hist-btn-zoom-in');
    const btnZoomOut = document.getElementById('hist-btn-zoom-out');
    const btnReset = document.getElementById('hist-btn-zoom-reset');
    const btnToggleGrid = document.getElementById('hist-btn-toggle-grid');
    const container = document.getElementById('hist-swipe-workspace');

    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => {
        this.zoomScale = Math.min(2.5, this.zoomScale + 0.25);
        this.applySynchronizedTransform();
      });
    }

    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => {
        this.zoomScale = Math.max(1.0, this.zoomScale - 0.25);
        if (this.zoomScale === 1.0) {
          this.panX = 0;
          this.panY = 0;
        }
        this.applySynchronizedTransform();
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.zoomScale = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.applySynchronizedTransform();
      });
    }

    if (btnToggleGrid) {
      let gridActive = false;
      btnToggleGrid.addEventListener('click', () => {
        gridActive = !gridActive;
        btnToggleGrid.style.background = gridActive ? '#06b6d4' : '';
        btnToggleGrid.style.color = gridActive ? '#070a12' : '';
        const canvas = document.getElementById('hist-investigation-canvas');
        if (canvas) {
          canvas.style.backgroundImage = gridActive
            ? 'linear-gradient(rgba(6, 182, 212, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.12) 1px, transparent 1px)'
            : 'none';
          canvas.style.backgroundSize = '40px 40px';
        }
      });
    }

    // Pan via mouse drag when zoomed in
    if (container) {
      container.addEventListener('mousedown', (e) => {
        if (this.zoomScale > 1.0 && e.target.id !== 'hist-swipe-divider' && !e.target.closest('#hist-swipe-divider')) {
          this.isPanning = true;
          this.startX = e.clientX - this.panX;
          this.startY = e.clientY - this.panY;
          container.style.cursor = 'grabbing';
        }
      });

      window.addEventListener('mousemove', (e) => {
        if (this.isPanning) {
          this.panX = e.clientX - this.startX;
          this.panY = e.clientY - this.startY;
          this.applySynchronizedTransform();
        }
      });

      window.addEventListener('mouseup', () => {
        if (this.isPanning) {
          this.isPanning = false;
          container.style.cursor = 'default';
        }
      });
    }
  }

  applySynchronizedTransform() {
    const transformStr = `scale(${this.zoomScale}) translate(${this.panX / this.zoomScale}px, ${this.panY / this.zoomScale}px)`;
    
    // Apply synchronously to both Before and After image frames
    const imgBefore = document.getElementById('hist-img-before');
    const imgAfter = document.getElementById('hist-img-after');
    const diffSvg = document.getElementById('hist-diff-svg');
    const impactPins = document.getElementById('hist-impact-pins');

    if (imgBefore) imgBefore.style.transform = transformStr;
    if (imgAfter) imgAfter.style.transform = transformStr;
    if (diffSvg) diffSvg.style.transform = transformStr;
    if (impactPins) impactPins.style.transform = transformStr;
  }

  /* =========================================================================
     FEATURE 2: DIFFERENCE / CHANGE VISUALIZATION & MODES
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

    const btnInspectImpact = document.getElementById('btn-inspect-view-impact');
    if (btnInspectImpact) {
      btnInspectImpact.addEventListener('click', () => {
        const impactBtn = document.getElementById('hist-btn-mode-impact');
        if (impactBtn) impactBtn.click();
      });
    }
  }

  setComparisonMode(mode) {
    this.comparisonMode = mode;

    const paneBefore = document.getElementById('hist-pane-before');
    const paneAfter = document.getElementById('hist-pane-after');
    const divider = document.getElementById('hist-swipe-divider');
    const diffOverlay = document.getElementById('hist-difference-overlay');
    const impactOverlay = document.getElementById('hist-impact-overlay');
    const legend = document.getElementById('hist-semantic-legend');

    if (mode === 'before') {
      if (paneBefore) paneBefore.style.display = 'block';
      if (paneAfter) paneAfter.style.display = 'none';
      if (divider) divider.style.display = 'none';
      if (diffOverlay) diffOverlay.style.display = 'none';
      if (impactOverlay) impactOverlay.style.display = 'none';
      if (legend) legend.style.display = 'none';
    } 
    else if (mode === 'after') {
      if (paneBefore) paneBefore.style.display = 'none';
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
      if (paneBefore) paneBefore.style.display = 'block';
      if (paneAfter) {
        paneAfter.style.display = 'block';
        paneAfter.style.clipPath = `polygon(${this.dividerPercent}% 0, 100% 0, 100% 100%, ${this.dividerPercent}% 100%)`;
      }
      if (divider) divider.style.display = 'flex';
      if (diffOverlay) diffOverlay.style.display = 'block';
      if (impactOverlay) impactOverlay.style.display = 'none';
      if (legend) legend.style.display = 'flex';
      this.renderDifferenceLayer();
    } 
    else if (mode === 'impact') {
      if (paneBefore) paneBefore.style.display = 'block';
      if (paneAfter) {
        paneAfter.style.display = 'block';
        paneAfter.style.clipPath = `polygon(${this.dividerPercent}% 0, 100% 0, 100% 100%, ${this.dividerPercent}% 100%)`;
      }
      if (divider) divider.style.display = 'flex';
      if (diffOverlay) diffOverlay.style.display = 'block';
      if (impactOverlay) impactOverlay.style.display = 'block';
      if (legend) legend.style.display = 'flex';
      this.renderDifferenceLayer();
      this.renderImpactLayer();
    }
  }

  renderDifferenceLayer() {
    const svg = document.getElementById('hist-diff-svg');
    if (!svg || !this.historicalData) return;
    svg.innerHTML = '';

    const hs = this.historicalData.hotspots.find(h => h.id === this.activeHotspotId);
    if (!hs) return;

    const polygons = this.getPolygonsForHotspot(this.activeHotspotId);

    polygons.forEach((poly, idx) => {
      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      pathEl.setAttribute('points', poly.points);
      pathEl.setAttribute('fill', poly.fill);
      pathEl.setAttribute('stroke', poly.stroke);
      pathEl.setAttribute('stroke-width', '2');
      pathEl.setAttribute('class', 'diff-contour-polygon');

      // Click on polygon updates Selected Change inspection panel
      pathEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.updateSelectedChange({
          type: poly.zoneTitle || hs.primary_hazard,
          period: '2024 → 2026',
          area: (hs.total_area_km2 * poly.areaRatio).toFixed(1),
          severity: poly.severity,
          confidence: `${poly.confidence || 93}%`,
          velocity: hs.change_velocity || 'Rapid',
          description: poly.description || hs.critical_infrastructure_risk
        });
      });

      svg.appendChild(pathEl);
    });
  }

  getPolygonsForHotspot(hotspotId) {
    if (hotspotId === 'hotspot-charlie') {
      // Madurai Peri-Urban Farmland Conversion
      return [
        {
          points: '340,160 590,140 680,360 480,410 320,310',
          fill: 'rgba(249, 115, 22, 0.42)',
          stroke: '#f97316',
          severity: 'MODERATE',
          areaRatio: 0.62,
          confidence: 94,
          zoneTitle: 'Outer Bypass Farmland Conversion',
          description: 'Topsoil removal and impervious asphalt replacement over 13.2 km² of traditional agricultural wetland.'
        },
        {
          points: '610,310 740,290 810,460 660,490',
          fill: 'rgba(234, 179, 8, 0.40)',
          stroke: '#eab308',
          severity: 'MINOR',
          areaRatio: 0.38,
          confidence: 91,
          zoneTitle: 'Commercial Logistics Corridor',
          description: 'Grading of agricultural recharge basin along NH-44 interchange.'
        }
      ];
    } else if (hotspotId === 'hotspot-alpha') {
      // Derna Flash Flooding
      return [
        {
          points: '420,110 560,90 620,270 540,390 420,330 370,190',
          fill: 'rgba(239, 68, 68, 0.50)',
          stroke: '#ef4444',
          severity: 'CRITICAL',
          areaRatio: 0.65,
          confidence: 96,
          zoneTitle: 'Wadi Derna Urban Dam Inundation',
          description: 'Catastrophic breach of secondary dam inundating central municipal residential grid.'
        },
        {
          points: '490,370 630,350 710,510 570,530 460,450',
          fill: 'rgba(6, 182, 212, 0.45)',
          stroke: '#06b6d4',
          severity: 'CRITICAL',
          areaRatio: 0.35,
          confidence: 95,
          zoneTitle: 'Coastal Discharge Channel',
          description: 'High-velocity storm surge severed Coastal Road Al-Bahr and swept through coastal settlements.'
        }
      ];
    } else if (hotspotId === 'hotspot-bravo') {
      // Amazon Fishbone Logging
      return [
        {
          points: '220,170 780,180 750,240 230,230',
          fill: 'rgba(239, 68, 68, 0.48)',
          stroke: '#ef4444',
          severity: 'CRITICAL',
          areaRatio: 0.50,
          confidence: 93,
          zoneTitle: 'Primary Arterial Clear-Cut Trunk',
          description: 'Direct penetration into indigenous conservation buffer along 24km illegal trunk road.'
        },
        {
          points: '370,230 410,490 360,490 330,230',
          fill: 'rgba(249, 115, 22, 0.42)',
          stroke: '#f97316',
          severity: 'MODERATE',
          areaRatio: 0.25,
          confidence: 91,
          zoneTitle: 'West Lateral Fishbone Spoke',
          description: 'Perpendicular feeder logging corridor encroaching on traditional forest trails.'
        },
        {
          points: '540,230 580,470 530,470 500,230',
          fill: 'rgba(239, 68, 68, 0.45)',
          stroke: '#ef4444',
          severity: 'CRITICAL',
          areaRatio: 0.25,
          confidence: 92,
          zoneTitle: 'East Lateral Logging Spoke',
          description: 'Canopy breach within 1.1km of Nova Esperança indigenous hamlet.'
        }
      ];
    } else {
      // Butte County Wildfire
      return [
        {
          points: '340,200 560,150 710,270 630,450 440,480 320,350',
          fill: 'rgba(239, 68, 68, 0.52)',
          stroke: '#ef4444',
          severity: 'CRITICAL',
          areaRatio: 0.72,
          confidence: 95,
          zoneTitle: 'Crown Fire Burn Scar Corridor',
          description: 'High-wind crown fire run through conifer canopy crossing Skyway evacuation ridge.'
        },
        {
          points: '580,130 730,110 780,240 670,260',
          fill: 'rgba(249, 115, 22, 0.40)',
          stroke: '#f97316',
          severity: 'MODERATE',
          areaRatio: 0.28,
          confidence: 92,
          zoneTitle: 'Understory Canyon Fire Scorch',
          description: 'Thermal radiative intensity detected along north canyon timber interface.'
        }
      ];
    }
  }

  updateSelectedChange(data) {
    const elType = document.getElementById('sel-change-type');
    const elPeriod = document.getElementById('sel-change-period');
    const elArea = document.getElementById('sel-change-area');
    const elSev = document.getElementById('sel-change-severity');
    const elConf = document.getElementById('sel-change-confidence');
    const elVel = document.getElementById('sel-change-velocity');
    const elDesc = document.getElementById('sel-change-description');

    if (elType) elType.textContent = data.type;
    if (elPeriod) elPeriod.textContent = `Observation Period: ${data.period}`;
    if (elArea) elArea.textContent = `${data.area} km²`;
    if (elSev) {
      elSev.textContent = data.severity;
      elSev.className = `m-val ${data.severity === 'CRITICAL' ? 'text-red' : 'text-orange'}`;
    }
    if (elConf) elConf.textContent = data.confidence;
    if (elVel) elVel.textContent = data.velocity;
    if (elDesc) elDesc.textContent = data.description;
  }

  /* =========================================================================
     FEATURE 3: COMMUNITY & INFRASTRUCTURE IMPACT
     ========================================================================= */
  renderImpactLayer() {
    const pinsContainer = document.getElementById('hist-impact-pins');
    if (!pinsContainer) return;
    pinsContainer.innerHTML = '';

    const facilitiesMap = {
      'hotspot-charlie': [
        { name: 'Vilangudi Bypass Junction', type: '🛣️', status: 'Transit Link', x: '58%', y: '42%' },
        { name: 'Fatima Higher Secondary Academy', type: '🏫', status: 'Nearby Facility', x: '46%', y: '48%' },
        { name: 'Samayanallur Rural Clinic', type: '🏥', status: 'Primary Health Center', x: '38%', y: '32%' },
        { name: 'Paravai Agricultural Settlement', type: '🏘️', status: 'Potentially Affected', x: '51%', y: '28%' }
      ],
      'hotspot-alpha': [
        { name: 'Derna Central Hospital', type: '🏥', status: 'Emergency Access Compromised', x: '52%', y: '33%' },
        { name: 'Al-Fatayeh Primary School', type: '🏫', status: 'Facility Inundated', x: '45%', y: '49%' },
        { name: 'Coastal Road Al-Bahr', type: '🛣️', status: 'Transit Corridor Severed', x: '58%', y: '23%' },
        { name: 'Al-Bilad Settlement Core', type: '🏘️', status: '6 Settlements Exposed', x: '41%', y: '37%' }
      ],
      'hotspot-bravo': [
        { name: 'BR-364 Highway Access', type: '🛣️', status: 'Logging Corridor', x: '62%', y: '20%' },
        { name: 'Nova Esperança Indigenous Hamlet', type: '🏘️', status: 'Buffer Breached within 1.1km', x: '44%', y: '45%' },
        { name: 'Reserve Boundary Post School', type: '🏫', status: 'Surveillance Perimeter', x: '35%', y: '30%' },
        { name: 'Frontier Medical Outpost', type: '🏥', status: 'Remote Clinic', x: '55%', y: '38%' }
      ],
      'hotspot-delta': [
        { name: 'Skyway Ridge Evacuation Route', type: '🛣️', status: 'Smoke Impassable', x: '54%', y: '35%' },
        { name: 'Ridgeview Community Clinic', type: '🏥', status: 'Emergency Evacuation', x: '42%', y: '40%' },
        { name: 'Paradise Pines Elementary', type: '🏫', status: 'WUI Perimeter', x: '48%', y: '48%' },
        { name: 'Upper Canyon Residential Pocket', type: '🏘️', status: 'Potentially Affected', x: '36%', y: '28%' }
      ]
    };

    const facilities = facilitiesMap[this.activeHotspotId] || facilitiesMap['hotspot-charlie'];

    facilities.forEach(f => {
      const pin = document.createElement('div');
      pin.className = 'hist-facility-marker';
      pin.style.left = f.x;
      pin.style.top = f.y;

      pin.innerHTML = `
        <div class="facility-icon-bubble">${f.type}</div>
        <div class="facility-name-tooltip"><strong>${f.name}</strong><br><span style="color: #cbd5e1;">${f.status}</span></div>
      `;

      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        this.updateSelectedChange({
          type: `Nearby Infrastructure: ${f.name}`,
          period: '2024 → 2026',
          area: '2.5 km perimeter',
          severity: 'POTENTIALLY AFFECTED',
          confidence: '95%',
          velocity: 'Monitored',
          description: `${f.name} (${f.status}) is located within the active spatial differencing buffer. Tactical field inspection recommended.`
        });
      });

      pinsContainer.appendChild(pin);
    });
  }

  /* =========================================================================
     FEATURE 4: HISTORICAL TIMELINE + PLAYBACK
     ========================================================================= */
  setupTimelineController() {
    const rangeInput = document.getElementById('hist-timeline-range');
    const playBtn = document.getElementById('btn-timeline-play');

    if (rangeInput) {
      rangeInput.addEventListener('input', (e) => {
        this.setTimelineYear(e.target.value);
      });
    }

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.togglePlayback();
      });
    }
  }

  setTimelineYear(year) {
    this.activeYear = String(year);

    const rangeInput = document.getElementById('hist-timeline-range');
    const activeYearNum = document.getElementById('hist-active-year-num');
    const activeYearSub = document.getElementById('hist-active-year-sub');
    const progressBar = document.getElementById('hist-playback-progress');

    if (rangeInput) rangeInput.value = year;
    if (activeYearNum) activeYearNum.textContent = year;

    // Update active label styling
    ['2024', '2025', '2026'].forEach(y => {
      const lbl = document.getElementById(`t-label-${y}`);
      if (lbl) lbl.classList.toggle('active', y === String(year));
    });

    const progressPct = year === '2024' ? 0 : (year === '2025' ? 50 : 100);
    if (progressBar) progressBar.style.width = `${progressPct}%`;

    // Dynamic stats update based on year
    const hs = this.historicalData?.hotspots?.find(h => h.id === this.activeHotspotId);
    if (hs && hs.footprint_evolution && hs.footprint_evolution[year]) {
      const fe = hs.footprint_evolution[year];
      if (activeYearSub) activeYearSub.textContent = `${fe.area_km2} km² · ${fe.label}`;

      // Update Selected Change card with the year's evolution
      this.updateSelectedChange({
        type: hs.primary_hazard,
        period: `2024 → ${year}`,
        area: fe.area_km2,
        severity: year === '2024' ? 'BASELINE' : (year === '2025' ? 'MODERATE' : hs.urgency),
        confidence: '94%',
        velocity: hs.change_velocity || 'Rapid',
        description: `Surveyed footprint in ${year}: ${fe.area_km2} km² (${fe.boundary_radius_m}m perimeter). ${fe.label}.`
      });
    }

    // Refresh overlays
    if (this.comparisonMode === 'difference' || this.comparisonMode === 'impact') {
      this.renderDifferenceLayer();
      if (this.comparisonMode === 'impact') this.renderImpactLayer();
    }
  }

  togglePlayback() {
    this.isPlaying = !this.isPlaying;
    const playIcon = document.getElementById('hist-play-icon');
    const playText = document.getElementById('hist-play-text');

    if (this.isPlaying) {
      if (playIcon) playIcon.textContent = '⏸';
      if (playText) playText.textContent = 'PAUSE';

      const sequence = ['2024', '2025', '2026'];
      let currentIdx = sequence.indexOf(this.activeYear);

      this.playInterval = setInterval(() => {
        currentIdx = (currentIdx + 1) % sequence.length;
        this.setTimelineYear(sequence[currentIdx]);
      }, 1600);
    } else {
      if (playIcon) playIcon.textContent = '▶';
      if (playText) playText.textContent = 'PLAY CHANGE';
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
  }

  /* =========================================================================
     FEATURE 5: HOTSPOT INVESTIGATION
     ========================================================================= */
  setupHotspotsList() {
    // Dropdown in top header
    const select = document.getElementById('hist-region-select');
    if (select) {
      select.addEventListener('change', (e) => {
        this.loadHotspot(e.target.value);
      });
    }

    // Clickable hotspot items in Column 1
    const items = document.querySelectorAll('.hotspot-clean-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const hsId = item.dataset.hotspot;
        if (hsId) {
          this.loadHotspot(hsId);
          if (select) select.value = hsId;
        }
      });
    });
  }

  loadHotspot(hotspotId) {
    if (!this.historicalData || !this.historicalData.hotspots) return;
    const hs = this.historicalData.hotspots.find(h => h.id === hotspotId);
    if (!hs) return;

    this.activeHotspotId = hotspotId;

    // Reset zoom and pan on hotspot switch
    this.zoomScale = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.applySynchronizedTransform();

    // 1. Update Title & Header
    const titleEl = document.getElementById('hist-header-title');
    const subEl = document.getElementById('hist-header-sub');
    if (titleEl) titleEl.textContent = hs.name;
    if (subEl) subEl.textContent = `2024 → 2026 · ${hs.region} · Tracked Since ${hs.active_since || '2024'}`;

    // 2. Update Satellite Images
    const imgBefore = document.getElementById('hist-img-before');
    const imgAfter = document.getElementById('hist-img-after');
    if (imgBefore && hs.sample_before_image) imgBefore.src = hs.sample_before_image;
    if (imgAfter && hs.sample_after_image) imgAfter.src = hs.sample_after_image;

    // 3. Update Floating Metadata HUD
    const metaSensor = document.getElementById('hud-meta-sensor');
    const metaDates = document.getElementById('hud-meta-dates');
    const metaCloud = document.getElementById('hud-meta-cloud');
    const metaCoords = document.getElementById('hud-meta-coords');

    const iq = hs.image_quality || {};
    if (metaSensor) metaSensor.textContent = iq.sensor || 'Sentinel-2 MSI (10m)';
    if (metaDates) metaDates.textContent = '2024-03-12 → 2026-09-18';
    if (metaCloud) metaCloud.textContent = `${iq.cloud_cover_pct || 0.8}% (Optimal)`;
    if (metaCoords && hs.coordinates) {
      metaCoords.textContent = `${hs.coordinates.lat.toFixed(4)}° N, ${hs.coordinates.lon.toFixed(4)}° E`;
    }

    // 4. Update Hotspot List active class
    document.querySelectorAll('.hotspot-clean-item').forEach(item => {
      item.classList.toggle('active', item.dataset.hotspot === hotspotId);
    });

    // 5. Update Footprint Evolution Data
    const fpGrowth = document.getElementById('hs-footprint-growth');
    const fp2024 = document.getElementById('fp-val-2024');
    const fp2025 = document.getElementById('fp-val-2025');
    const fp2026 = document.getElementById('fp-val-2026');
    const rad2024 = document.getElementById('fp-rad-2024');
    const rad2025 = document.getElementById('fp-rad-2025');
    const rad2026 = document.getElementById('fp-rad-2026');

    const fe = hs.footprint_evolution || {};
    if (fpGrowth) fpGrowth.textContent = `Footprint change: +${hs.footprint_expansion_percent || 96.3}%`;

    if (fe['2024']) {
      if (fp2024) fp2024.textContent = `${fe['2024'].area_km2} km²`;
      if (rad2024) rad2024.textContent = `${fe['2024'].boundary_radius_m}m radius`;
    }
    if (fe['2025']) {
      if (fp2025) fp2025.textContent = `${fe['2025'].area_km2} km²`;
      if (rad2025) rad2025.textContent = `${fe['2025'].boundary_radius_m}m radius`;
    }
    if (fe['2026']) {
      if (fp2026) fp2026.textContent = `${fe['2026'].area_km2} km²`;
      if (rad2026) rad2026.textContent = `${fe['2026'].boundary_radius_m}m radius`;
    }

    // 6. Update Selected Change Card
    this.updateSelectedChange({
      type: hs.primary_hazard,
      period: '2024 → 2026',
      area: hs.total_area_km2,
      severity: hs.urgency,
      confidence: '94.2%',
      velocity: hs.change_velocity || 'Rapid',
      description: hs.critical_infrastructure_risk || 'Multispectral change detection confirms rapid land-cover transformation.'
    });

    // 7. Update Potential Impact Card
    const hci = hs.historical_community_impact || {};
    const imp2026 = hci['2026'] || { settlements: 4, schools: 2, hospitals: 1, roads: 5 };

    const countSettlements = document.getElementById('imp-count-settlements');
    const countSchools = document.getElementById('imp-count-schools');
    const countHospitals = document.getElementById('imp-count-hospitals');
    const countRoads = document.getElementById('imp-count-roads');
    const countAgri = document.getElementById('imp-count-agri');

    if (countSettlements) countSettlements.textContent = imp2026.settlements || 4;
    if (countSchools) countSchools.textContent = imp2026.schools || 2;
    if (countHospitals) countHospitals.textContent = imp2026.hospitals || 1;
    if (countRoads) countRoads.textContent = imp2026.roads || 5;
    if (countAgri) countAgri.textContent = `${(hs.total_area_km2 * 0.22).toFixed(1)} km²`;

    // 8. Refresh Overlays
    this.setComparisonMode(this.comparisonMode);
  }

  /* =========================================================================
     FEATURE 6: EVIDENCE SNAPSHOT + DOSSIER
     ========================================================================= */
  setupEvidenceActions() {
    const btnSaveTop = document.getElementById('btn-hist-save-evidence');
    const btnSaveAlt = document.getElementById('btn-save-evidence-alt');
    const btnDossierTop = document.getElementById('btn-hist-open-dossier');
    const btnDossierCta = document.getElementById('btn-generate-dossier-primary');

    if (btnSaveTop) btnSaveTop.addEventListener('click', () => this.saveEvidenceSnapshot());
    if (btnSaveAlt) btnSaveAlt.addEventListener('click', () => this.saveEvidenceSnapshot());

    if (btnDossierTop) btnDossierTop.addEventListener('click', () => this.generateExecutiveDossier());
    if (btnDossierCta) btnDossierCta.addEventListener('click', () => this.generateExecutiveDossier());
  }

  saveEvidenceSnapshot() {
    const hs = this.historicalData?.hotspots?.find(h => h.id === this.activeHotspotId);
    if (!hs) return;

    const snapshot = {
      id: Math.floor(1000 + Math.random() * 9000),
      timestamp: new Date().toISOString(),
      hotspotId: this.activeHotspotId,
      location: hs.name,
      region: hs.region,
      period: '2024 → 2026',
      hazard: hs.primary_hazard,
      area_km2: hs.total_area_km2,
      severity: hs.urgency,
      confidence: '95.4%',
      beforeImg: hs.sample_before_image,
      afterImg: hs.sample_after_image,
      year: this.activeYear,
      mode: this.comparisonMode
    };

    this.savedEvidence.unshift(snapshot);
    localStorage.setItem('earthlens_saved_evidence', JSON.stringify(this.savedEvidence));
    this.renderEvidenceShelf();

    // Visual button feedback
    const btn = document.getElementById('btn-hist-save-evidence');
    if (btn) {
      const origText = btn.innerHTML;
      btn.innerHTML = '<span>✓ Snapshot Saved</span>';
      btn.style.background = 'rgba(16, 185, 129, 0.4)';
      setTimeout(() => {
        btn.innerHTML = origText;
        btn.style.background = '';
      }, 1500);
    }
  }

  restoreEvidenceShelf() {
    try {
      const saved = localStorage.getItem('earthlens_saved_evidence');
      if (saved) {
        this.savedEvidence = JSON.parse(saved);
        this.renderEvidenceShelf();
      }
    } catch (e) {
      this.savedEvidence = [];
    }
  }

  renderEvidenceShelf() {
    const container = document.getElementById('evidence-shelf-items');
    const badge = document.getElementById('evidence-shelf-count');
    if (!container) return;

    if (badge) badge.textContent = `${this.savedEvidence.length} Captured`;

    if (this.savedEvidence.length === 0) {
      container.innerHTML = '<div class="shelf-empty-hint">No snapshots captured yet.<br>Click "Save Evidence" to record current satellite findings.</div>';
      return;
    }

    container.innerHTML = '';
    this.savedEvidence.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'evidence-item-card';
      card.innerHTML = `
        <img src="${item.afterImg || item.beforeImg}" alt="Evidence Thumbnail" class="ev-thumb">
        <div class="ev-info">
          <div class="ev-loc">${item.location}</div>
          <div class="ev-sub">${item.period} · ${item.hazard}</div>
        </div>
        <button class="ev-btn-del" title="Remove snapshot">✕</button>
      `;

      card.querySelector('.ev-btn-del').addEventListener('click', (e) => {
        e.stopPropagation();
        this.savedEvidence.splice(idx, 1);
        localStorage.setItem('earthlens_saved_evidence', JSON.stringify(this.savedEvidence));
        this.renderEvidenceShelf();
      });

      container.appendChild(card);
    });
  }

  generateExecutiveDossier() {
    const hs = this.historicalData?.hotspots?.find(h => h.id === this.activeHotspotId);
    const datasetMap = {
      'hotspot-alpha': 'derna_flooding',
      'hotspot-bravo': 'amazon_deforestation',
      'hotspot-charlie': 'madurai_urban',
      'hotspot-delta': 'california_wildfire'
    };
    const datasetId = datasetMap[this.activeHotspotId] || 'madurai_urban';

    if (window.reportsGeneratorModule) {
      window.reportsGeneratorModule.generateReport(datasetId, []);
    }

    // Switch view to Executive Reports Panel
    const reportNavBtn = document.querySelector('[data-nav="reports"]');
    if (reportNavBtn) {
      reportNavBtn.click();
    } else {
      const panels = document.querySelectorAll('.workspace-overlay-panel');
      panels.forEach(p => p.style.display = 'none');
      const repPanel = document.getElementById('panel-reports');
      if (repPanel) repPanel.style.display = 'block';
    }
  }
}

// Instantiate global module instance
window.historicalAnalyticsModule = new HistoricalAnalyticsModule();
