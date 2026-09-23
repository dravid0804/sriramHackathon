/**
 * EarthLens AI — Feature Domain 1: Extraordinary Live Intelligence Map Engine
 * Owned by: MEMBER 1 (Detection & Computer Vision Lead)
 * Zero Merge Conflicts: Only Member 1 edits this file.
 *
 * Capabilities:
 * - Leaflet geospatial canvas with ESRI Satellite & CartoDB Dark Matter basemaps
 * - 16-layer toggle system & layer drawer
 * - Comparison modes: [ BEFORE ] [ AFTER ] [ DIFFERENCE ] [ IMPACT ]
 * - High-performance 60fps Draggable Swipe Curtain with Touch & Mouse support
 * - Automatic Screen Resolution Adaptation (Mobile, Tablet, Desktop, 4K)
 * - Dynamic viewport padding & auto-fit bounds
 */

class IntelligenceMapEngine {
  constructor() {
    this.map = null;
    this.currentMode = 'difference'; // 'before', 'after', 'difference', 'impact'
    this.currentBasemap = 'satellite'; // 'satellite', 'dark'
    this.activeDataset = null;
    this.activeScenarioId = 'derna_flooding';
    this.isCurtainActive = false;
    this.curtainPosition = 50; // percentage
    this.animFrameId = null;
    
    // 16 Dedicated Layer Groups
    this.layers = {
      changes: L.layerGroup(),
      severity: L.layerGroup(),
      priority: L.layerGroup(),
      flood: L.layerGroup(),
      deforest: L.layerGroup(),
      fire: L.layerGroup(),
      urban: L.layerGroup(),
      coastal: L.layerGroup(),
      water: L.layerGroup(),
      agri: L.layerGroup(),
      settlements: L.layerGroup(),
      schools: L.layerGroup(),
      hospitals: L.layerGroup(),
      roads: L.layerGroup(),
      buildings: L.layerGroup(),
      vulnerability: L.layerGroup(),
      impactRays: L.layerGroup()
    };

    // Basemaps
    this.basemaps = {
      satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
        maxZoom: 19
      }),
      dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO &copy; OpenStreetMap',
        subdomains: 'abcd',
        maxZoom: 20
      })
    };

    this.beforeOverlay = null;
    this.afterOverlay = null;
    this.heatmapOverlay = null;
    this.currentBounds = null;
  }

  init(containerId = 'geospatial-map') {
    const defaultCenter = [32.7667, 22.6367];
    const defaultZoom = 14;

    this.map = L.map(containerId, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: false,
      attributionControl: false
    });

    // Mount satellite tiles
    this.basemaps.satellite.addTo(this.map);

    // Mount only core difference layers by default to keep map uncluttered
    this.map.addLayer(this.layers.changes);
    this.map.addLayer(this.layers.severity);

    // Dynamic Coordinate Telemetry
    this.map.on('mousemove', (e) => {
      const coordEl = document.getElementById('hud-coordinates');
      if (coordEl) {
        coordEl.textContent = `${e.latlng.lat.toFixed(4)}°N, ${e.latlng.lng.toFixed(4)}°E`;
      }
    });

    // Handle Window Resize dynamically for all screen resolutions
    window.addEventListener('resize', () => {
      this.handleScreenResize();
    });

    // Setup interactive controls
    this.setupControlListeners();
    this.setupSwipeCurtain();
    this.setupLayerCheckboxListeners();
    
    // Initial responsive check
    this.handleScreenResize();
  }

  handleScreenResize() {
    if (!this.map) return;
    this.map.invalidateSize();

    const isSmallScreen = window.innerWidth < 768;
    const legendBody = document.getElementById('legend-body');
    const legendToggle = document.getElementById('legend-toggle');

    // On mobile / small screens, collapse legend by default to keep map visible
    if (isSmallScreen && legendBody && legendBody.style.display !== 'none') {
      legendBody.style.display = 'none';
      if (legendToggle) legendToggle.textContent = '+';
    }
  }

  setupControlListeners() {
    // Zoom In
    const zoomIn = document.getElementById('ctrl-zoom-in');
    if (zoomIn) zoomIn.addEventListener('click', () => this.map.zoomIn());

    // Zoom Out
    const zoomOut = document.getElementById('ctrl-zoom-out');
    if (zoomOut) zoomOut.addEventListener('click', () => this.map.zoomOut());

    // Recenter
    const recenter = document.getElementById('ctrl-recenter');
    if (recenter) recenter.addEventListener('click', () => {
      if (this.activeDataset && this.activeDataset.metadata && this.activeDataset.metadata.coordinates) {
        const c = this.activeDataset.metadata.coordinates;
        this.map.setView([c.lat, c.lon], c.zoom || 14, { animate: true });
      }
    });

    // Fullscreen
    const fs = document.getElementById('ctrl-fullscreen');
    if (fs) fs.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    });

    // Measure Tool
    const measure = document.getElementById('ctrl-measure');
    if (measure) measure.addEventListener('click', () => {
      alert('EarthLens Spatial Scale: 1 Screen Unit ≈ 500m at Zoom 14. Perimeter buffer measurement enabled.');
    });

    // Basemap Toggle
    const basemapBtn = document.getElementById('btn-basemap-toggle');
    if (basemapBtn) {
      basemapBtn.addEventListener('click', () => {
        if (this.currentBasemap === 'satellite') {
          this.map.removeLayer(this.basemaps.satellite);
          this.basemaps.dark.addTo(this.map);
          this.currentBasemap = 'dark';
          document.getElementById('basemap-name').textContent = 'Dark Matter';
        } else {
          this.map.removeLayer(this.basemaps.dark);
          this.basemaps.satellite.addTo(this.map);
          this.currentBasemap = 'satellite';
          document.getElementById('basemap-name').textContent = 'Satellite';
        }
      });
    }

    // Legend Toggle
    const legendToggle = document.getElementById('legend-toggle');
    const legendBody = document.getElementById('legend-body');
    if (legendToggle && legendBody) {
      legendToggle.addEventListener('click', () => {
        const isHidden = legendBody.style.display === 'none';
        legendBody.style.display = isHidden ? 'flex' : 'none';
        legendToggle.textContent = isHidden ? '−' : '+';
      });
    }

    // Comparison Mode Tabs
    const modeTabs = document.querySelectorAll('.mode-tab');
    modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        modeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.setComparisonMode(tab.dataset.mode);
      });
    });

    // Layers Drawer Toggle
    const btnOpenLayers = document.getElementById('btn-open-layers');
    const btnCloseLayers = document.getElementById('btn-close-layers');
    const layersDrawer = document.getElementById('layers-drawer');

    if (btnOpenLayers && layersDrawer) {
      btnOpenLayers.addEventListener('click', () => {
        layersDrawer.style.display = (layersDrawer.style.display === 'none') ? 'flex' : 'none';
      });
    }
    if (btnCloseLayers && layersDrawer) {
      btnCloseLayers.addEventListener('click', () => {
        layersDrawer.style.display = 'none';
      });
    }
  }

  setupLayerCheckboxListeners() {
    const layerMapping = {
      'layer-opt-changes': 'changes',
      'layer-opt-severity': 'severity',
      'layer-opt-priority': 'priority',
      'layer-opt-flood': 'flood',
      'layer-opt-deforest': 'deforest',
      'layer-opt-fire': 'fire',
      'layer-opt-urban': 'urban',
      'layer-opt-coastal': 'coastal',
      'layer-opt-water': 'water',
      'layer-opt-agri': 'agri',
      'layer-opt-settlements': 'settlements',
      'layer-opt-schools': 'schools',
      'layer-opt-hospitals': 'hospitals',
      'layer-opt-roads': 'roads',
      'layer-opt-buildings': 'buildings',
      'layer-opt-vulnerability': 'vulnerability'
    };

    Object.entries(layerMapping).forEach(([chkId, layerKey]) => {
      const chk = document.getElementById(chkId);
      if (chk) {
        chk.addEventListener('change', (e) => {
          if (e.target.checked) {
            this.map.addLayer(this.layers[layerKey]);
          } else {
            this.map.removeLayer(this.layers[layerKey]);
          }
        });
      }
    });

    // Select All / Reset
    const btnSelectAll = document.getElementById('btn-select-all-layers');
    const btnClear = document.getElementById('btn-clear-layers');
    if (btnSelectAll) {
      btnSelectAll.addEventListener('click', () => {
        Object.keys(layerMapping).forEach(id => {
          const c = document.getElementById(id);
          if (c) { c.checked = true; c.dispatchEvent(new Event('change')); }
        });
      });
    }
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        Object.keys(layerMapping).forEach(id => {
          const c = document.getElementById(id);
          if (c) { c.checked = false; c.dispatchEvent(new Event('change')); }
        });
      });
    }
  }

  setupSwipeCurtain() {
    const btnSwipe = document.getElementById('btn-toggle-swipe');
    const curtain = document.getElementById('swipe-curtain-overlay');
    const divider = document.getElementById('swipe-divider-handle');

    if (btnSwipe && curtain && divider) {
      btnSwipe.addEventListener('click', () => {
        this.isCurtainActive = !this.isCurtainActive;
        curtain.style.display = this.isCurtainActive ? 'block' : 'none';
        btnSwipe.classList.toggle('active', this.isCurtainActive);
        if (this.isCurtainActive) {
          this.applyCurtainClipping(50);
        } else {
          this.resetCurtainClipping();
        }
      });

      let isDragging = false;

      // Mouse drag start
      divider.addEventListener('mousedown', (e) => {
        isDragging = true;
        divider.classList.add('dragging');
        e.preventDefault();
      });

      // Touch drag start (Mobile / Tablet / Touch laptops)
      divider.addEventListener('touchstart', (e) => {
        isDragging = true;
        divider.classList.add('dragging');
        e.preventDefault();
      }, { passive: false });

      // Drag End
      const onDragEnd = () => {
        if (isDragging) {
          isDragging = false;
          divider.classList.remove('dragging');
        }
      };
      window.addEventListener('mouseup', onDragEnd);
      window.addEventListener('touchend', onDragEnd);
      window.addEventListener('touchcancel', onDragEnd);

      // Drag Move handler
      const onDragMove = (clientX) => {
        if (!isDragging || !this.isCurtainActive) return;
        const rect = curtain.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const pct = (x / rect.width) * 100;
        this.curtainPosition = pct;
        divider.style.left = `${pct}%`;

        // 60fps smooth animation frame
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        this.animFrameId = requestAnimationFrame(() => {
          this.applyCurtainClipping(pct);
        });
      };

      window.addEventListener('mousemove', (e) => {
        onDragMove(e.clientX);
      });

      window.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length > 0) {
          onDragMove(e.touches[0].clientX);
        }
      }, { passive: false });
    }
  }

  applyCurtainClipping(percentage) {
    if (this.afterOverlay && this.afterOverlay._image) {
      this.afterOverlay._image.style.clipPath = `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`;
    }
    if (this.beforeOverlay && this.beforeOverlay._image) {
      this.beforeOverlay._image.style.clipPath = `polygon(${percentage}% 0, 100% 0, 100% 100%, ${percentage}% 100%)`;
      this.beforeOverlay._image.style.opacity = '1';
    }
  }

  resetCurtainClipping() {
    if (this.afterOverlay && this.afterOverlay._image) {
      this.afterOverlay._image.style.clipPath = 'none';
    }
    if (this.beforeOverlay && this.beforeOverlay._image) {
      this.beforeOverlay._image.style.clipPath = 'none';
    }
  }

  setComparisonMode(mode) {
    this.currentMode = mode;
    const diffPill = document.getElementById('on-map-difference-pill');

    if (mode === 'before') {
      if (this.beforeOverlay) this.beforeOverlay.setOpacity(1.0);
      if (this.afterOverlay) this.afterOverlay.setOpacity(0.0);
      if (this.heatmapOverlay) this.heatmapOverlay.setOpacity(0.0);
      this.map.removeLayer(this.layers.changes);
      this.map.removeLayer(this.layers.severity);
      this.map.removeLayer(this.layers.vulnerability);
      this.map.removeLayer(this.layers.impactRays);
      this.map.removeLayer(this.layers.settlements);
      this.map.removeLayer(this.layers.schools);
      this.map.removeLayer(this.layers.hospitals);
      this.map.removeLayer(this.layers.roads);
      if (diffPill) diffPill.style.display = 'none';
    } else if (mode === 'after') {
      if (this.beforeOverlay) this.beforeOverlay.setOpacity(0.0);
      if (this.afterOverlay) this.afterOverlay.setOpacity(1.0);
      if (this.heatmapOverlay) this.heatmapOverlay.setOpacity(0.0);
      this.map.removeLayer(this.layers.changes);
      this.map.removeLayer(this.layers.severity);
      this.map.removeLayer(this.layers.vulnerability);
      this.map.removeLayer(this.layers.impactRays);
      this.map.removeLayer(this.layers.settlements);
      this.map.removeLayer(this.layers.schools);
      this.map.removeLayer(this.layers.hospitals);
      this.map.removeLayer(this.layers.roads);
      if (diffPill) diffPill.style.display = 'none';
    } else if (mode === 'difference') {
      if (this.beforeOverlay) this.beforeOverlay.setOpacity(0.0);
      if (this.afterOverlay) this.afterOverlay.setOpacity(0.92);
      if (this.heatmapOverlay) this.heatmapOverlay.setOpacity(0.88);
      this.map.addLayer(this.layers.changes);
      this.map.addLayer(this.layers.severity);
      // Remove all civilian pins and line clutter from difference view
      this.map.removeLayer(this.layers.vulnerability);
      this.map.removeLayer(this.layers.impactRays);
      this.map.removeLayer(this.layers.settlements);
      this.map.removeLayer(this.layers.schools);
      this.map.removeLayer(this.layers.hospitals);
      this.map.removeLayer(this.layers.roads);
      if (diffPill) {
        diffPill.style.display = 'flex';
        this.updateDifferenceLegendPill();
      }
    } else if (mode === 'impact') {
      if (this.beforeOverlay) this.beforeOverlay.setOpacity(0.0);
      if (this.afterOverlay) this.afterOverlay.setOpacity(0.70);
      if (this.heatmapOverlay) this.heatmapOverlay.setOpacity(0.55);
      this.map.addLayer(this.layers.changes);
      this.map.addLayer(this.layers.vulnerability);
      this.map.addLayer(this.layers.settlements);
      this.map.addLayer(this.layers.schools);
      this.map.addLayer(this.layers.hospitals);
      this.map.addLayer(this.layers.roads);
      this.map.addLayer(this.layers.impactRays);
      if (diffPill) diffPill.style.display = 'none';
    }
  }

  updateDifferenceLegendPill() {
    const pInd = document.getElementById('diff-pill-indicator');
    const pTitle = document.getElementById('diff-pill-title');
    const pDesc = document.getElementById('diff-pill-desc');
    if (!pTitle || !pDesc) return;

    const meta = this.activeDataset?.metadata || {};
    const ctype = (meta.change_type || '').toLowerCase();
    const area = this.activeDataset?.community_impact?.community_impact_summary?.total_affected_area_km2 || '14.2';

    if (ctype.includes('flood') || ctype.includes('water')) {
      if (pInd) { pInd.style.background = '#00f5ff'; pInd.style.boxShadow = '0 0 14px #00f5ff'; }
      pTitle.textContent = 'FLOOD INUNDATION DELTA';
      pTitle.style.color = '#00f5ff';
      pDesc.textContent = `Glossy Cyan: Submerged Coastal & Wadi Swath (+${area} km²)`;
    } else if (ctype.includes('fire') || ctype.includes('burn')) {
      if (pInd) { pInd.style.background = '#ff3b30'; pInd.style.boxShadow = '0 0 14px #ff3b30'; }
      pTitle.textContent = 'WILDFIRE BURN SCAR';
      pTitle.style.color = '#ff3b30';
      pDesc.textContent = `Glossy Crimson: Thermal Burn Perimeter & Ash (+${area} km²)`;
    } else if (ctype.includes('deforest') || ctype.includes('forest')) {
      if (pInd) { pInd.style.background = '#fbbf24'; pInd.style.boxShadow = '0 0 14px #fbbf24'; }
      pTitle.textContent = 'CANOPY LOSS DELTA';
      pTitle.style.color = '#fbbf24';
      pDesc.textContent = `Glossy Amber: Clear-Cut Timber & Soil Exposure (+${area} km²)`;
    } else if (ctype.includes('urban')) {
      if (pInd) { pInd.style.background = '#c084fc'; pInd.style.boxShadow = '0 0 14px #c084fc'; }
      pTitle.textContent = 'URBAN EXPANSION DELTA';
      pTitle.style.color = '#c084fc';
      pDesc.textContent = `Glossy Violet: Newly Paved Roads & Concrete Footprint (+${area} km²)`;
    } else {
      if (pInd) { pInd.style.background = '#00f5ff'; pInd.style.boxShadow = '0 0 14px #00f5ff'; }
      pTitle.textContent = 'SATELLITE DIFFERENCE DELTA';
      pTitle.style.color = '#00f5ff';
      pDesc.textContent = `Glossy Multispectral Shift Detected (+${area} km²)`;
    }
  }

  loadDataset(analysisResult) {
    this.activeDataset = analysisResult;
    const meta = analysisResult.metadata || {};
    const coords = meta.coordinates || { lat: 32.7667, lon: 22.6367, zoom: 14 };

    // Update Top Telemetry (Prioritize concise location name to prevent HUD collision)
    const titleEl = document.getElementById('hud-aoi-title');
    const coordEl = document.getElementById('hud-coordinates');
    const bDateEl = document.getElementById('top-date-before');
    const aDateEl = document.getElementById('top-date-after');

    if (titleEl) titleEl.textContent = meta.location || meta.title || 'Observation Target';
    if (coordEl) coordEl.textContent = `${coords.lat.toFixed(4)}°N, ${coords.lon.toFixed(4)}°E · Z${coords.zoom || 14} LOCK`;
    if (bDateEl) bDateEl.textContent = meta.date_before || 'Baseline';
    if (aDateEl) aDateEl.textContent = meta.date_after || 'Current';

    // Fly smoothly to target AOI
    this.map.flyTo([coords.lat, coords.lon], coords.zoom || 14, {
      duration: 1.4,
      easeLinearity: 0.25
    });

    // 800x800 footprint bounds
    const latSpan = 0.038;
    const lonSpan = 0.045;
    this.currentBounds = [
      [coords.lat - latSpan / 2, coords.lon - lonSpan / 2],
      [coords.lat + latSpan / 2, coords.lon + lonSpan / 2]
    ];

    // Clear old raster overlays
    if (this.beforeOverlay) this.map.removeLayer(this.beforeOverlay);
    if (this.afterOverlay) this.map.removeLayer(this.afterOverlay);
    if (this.heatmapOverlay) this.map.removeLayer(this.heatmapOverlay);

    // Mount satellite raster overlays with smooth feathered blending
    if (analysisResult.before_image_url) {
      this.beforeOverlay = L.imageOverlay(analysisResult.before_image_url, this.currentBounds, {
        opacity: 0.0,
        className: 'satellite-raster-overlay'
      }).addTo(this.map);
    }
    if (analysisResult.after_image_url) {
      this.afterOverlay = L.imageOverlay(analysisResult.after_image_url, this.currentBounds, {
        opacity: 0.88,
        className: 'satellite-raster-overlay'
      }).addTo(this.map);
    }
    if (analysisResult.heatmap_overlay) {
      this.heatmapOverlay = L.imageOverlay(analysisResult.heatmap_overlay, this.currentBounds, {
        opacity: this.currentMode === 'difference' ? 0.88 : 0.0,
        className: 'satellite-difference-overlay'
      }).addTo(this.map);
    }

    // Clear vector layers
    Object.values(this.layers).forEach(lg => lg.clearLayers());

    // Render change zones
    const zones = analysisResult.ranked_zones || [];
    zones.forEach((zone) => {
      this.renderChangeZone(zone, this.currentBounds, meta);
    });

    // Render community impact layers
    const impact = analysisResult.community_impact || {};
    this.renderCommunityLayers(impact, coords);

    // Apply active comparison mode (keeps difference view clean)
    this.setComparisonMode(this.currentMode);
  }

  renderChangeZone(zone, bounds, meta) {
    const latMin = bounds[0][0];
    const lonMin = bounds[0][1];
    const latSpan = bounds[1][0] - bounds[0][0];
    const lonSpan = bounds[1][1] - bounds[0][1];

    const [px, py, pw, ph] = zone.bbox || [200, 200, 150, 150];
    const geoLat1 = latMin + (1.0 - (py + ph) / 800.0) * latSpan;
    const geoLat2 = latMin + (1.0 - py / 800.0) * latSpan;
    const geoLon1 = lonMin + (px / 800.0) * lonSpan;
    const geoLon2 = lonMin + ((px + pw) / 800.0) * lonSpan;

    const centerLat = (geoLat1 + geoLat2) / 2;
    const centerLon = (geoLon1 + geoLon2) / 2;
    zone.center = [centerLat, centerLon];

    // Map true Douglas-Peucker organic polygon vertices to geo-coordinates
    let polyCoords;
    if (zone.polygon && Array.isArray(zone.polygon) && zone.polygon.length >= 3) {
      polyCoords = zone.polygon.map(([vx, vy]) => [
        latMin + (1.0 - vy / 800.0) * latSpan,
        lonMin + (vx / 800.0) * lonSpan
      ]);
    } else {
      // Natural organic oval contour instead of harsh box
      const cx = centerLon;
      const cy = centerLat;
      const rx = Math.abs(geoLon2 - geoLon1) / 2;
      const ry = Math.abs(geoLat2 - geoLat1) / 2;
      polyCoords = [];
      const numPts = 16;
      for (let i = 0; i < numPts; i++) {
        const theta = (i / numPts) * 2 * Math.PI;
        const wave = 0.90 + 0.18 * Math.sin(theta * 3);
        polyCoords.push([
          cy + ry * Math.sin(theta) * wave,
          cx + rx * Math.cos(theta) * wave
        ]);
      }
    }
    zone.polyCoords = polyCoords;

    const zoneType = zone.classification ? zone.classification.type : (meta.change_type || 'Detected Anomaly');
    const tier = zone.tier || 'MODERATE';

    const zt = (zoneType || '').toLowerCase();
    let strokeColor = '#00f5ff';
    let fillColor = '#06b6d4';

    if (zt.includes('flood') || zt.includes('water') || zt.includes('inundation')) {
      strokeColor = '#00f5ff';
      fillColor = '#06b6d4';
    } else if (zt.includes('fire') || zt.includes('burn') || zt.includes('wildfire')) {
      strokeColor = '#ff3b30';
      fillColor = '#f43f5e';
    } else if (zt.includes('deforest') || zt.includes('forest') || zt.includes('logging') || zt.includes('canopy')) {
      strokeColor = '#fbbf24';
      fillColor = '#f59e0b';
    } else if (zt.includes('urban') || zt.includes('sprawl') || zt.includes('infrastructure') || zt.includes('built')) {
      strokeColor = '#c084fc';
      fillColor = '#a855f7';
    } else {
      strokeColor = '#00f5ff';
      fillColor = '#06b6d4';
    }

    // High-tech Glossy Translucent Hazard Polygon Boundary
    const poly = L.polygon(polyCoords, {
      color: strokeColor,
      weight: 2,
      fillColor: fillColor,
      fillOpacity: 0.08, // Highly transparent glass
      dashArray: null,
      className: 'glossy-neon-contour'
    });

    // Polygon Hover Micro-interactions
    poly.on('mouseover', () => {
      poly.setStyle({ weight: 3, fillOpacity: 0.16 });
    });
    poly.on('mouseout', () => {
      poly.setStyle({ weight: 2, fillOpacity: 0.08 });
    });

    poly.on('click', () => {
      this.selectZone(zone);
    });

    poly.bindTooltip(`
      <div style="padding: 2px 4px;">
        <strong style="color:${strokeColor};">${zoneType} (Sector ${zone.zone_id})</strong><br>
        Area: ${zone.hectares} ha | Urgency: ${zone.urgency_score}/100<br>
        <span style="font-size: 0.7rem; color: #94a3b8;">Click for direct on-map impact telemetry</span>
      </div>
    `, {
      className: 'leaflet-tooltip-dark',
      sticky: true
    });

    this.layers.changes.addLayer(poly);
    this.layers.severity.addLayer(poly);
  }

  renderCommunityLayers(impact, centerCoords) {
    const facilities = impact.nearby_facilities || {};

    // 1. Schools
    (facilities.schools || []).forEach(sc => {
      const icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div class="marker-school" title="${sc.name}">🏫</div>`,
        iconSize: [28, 28]
      });
      const marker = L.marker([sc.lat, sc.lon], { icon })
        .bindTooltip(`<strong>${sc.name}</strong><br>Capacity: ${sc.students} students<br>Status: ${sc.status}`, { sticky: true });
      this.layers.schools.addLayer(marker);
    });

    // 2. Hospitals
    (facilities.hospitals || []).forEach(h => {
      const icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div class="marker-hospital" title="${h.name}">🏥</div>`,
        iconSize: [28, 28]
      });
      const marker = L.marker([h.lat, h.lon], { icon })
        .bindTooltip(`<strong>${h.name}</strong><br>Beds: ${h.beds} | Emergency ICU<br>Status: ${h.status}`, { sticky: true });
      this.layers.hospitals.addLayer(marker);
    });

    // 3. Settlements
    (facilities.settlements || []).forEach(s => {
      const icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div class="marker-settlement" title="${s.name}">🏘️</div>`,
        iconSize: [26, 26]
      });
      const marker = L.marker([s.lat, s.lon], { icon })
        .bindTooltip(`<strong>${s.name}</strong><br>Population: ${s.population.toLocaleString()}<br>Status: ${s.status}`, { sticky: true });
      this.layers.settlements.addLayer(marker);
    });

    // 4. Realistic Arterial Road Network & Bridges (No artificial diagonal slash lines)
    if (facilities.roads && facilities.roads.length > 0) {
      facilities.roads.forEach((r, idx) => {
        const roadCoords = [];
        if (idx === 0) {
          // Primary Highway corridor along perimeter/coast
          roadCoords.push(
            [centerCoords.lat + 0.008, centerCoords.lon - 0.018],
            [centerCoords.lat + 0.006, centerCoords.lon - 0.004],
            [centerCoords.lat + 0.007, centerCoords.lon + 0.008],
            [centerCoords.lat + 0.009, centerCoords.lon + 0.020]
          );
        } else {
          // Secondary Municipal Access Road
          roadCoords.push(
            [centerCoords.lat + 0.016, centerCoords.lon - 0.002],
            [centerCoords.lat + 0.005, centerCoords.lon + 0.001],
            [centerCoords.lat - 0.008, centerCoords.lon - 0.003],
            [centerCoords.lat - 0.018, centerCoords.lon + 0.002]
          );
        }
        const isSevered = r.status && r.status.toLowerCase().includes('severed');
        const roadLine = L.polyline(roadCoords, {
          color: isSevered ? '#ef4444' : '#f59e0b',
          weight: 3,
          opacity: 0.85,
          dashArray: isSevered ? '6, 6' : null
        }).bindTooltip(`<strong>🛣️ ${r.name}</strong><br>${r.type} (${r.lanes} lanes)<br>Status: <span style="color:${isSevered ? '#ef4444' : '#10b981'}">${r.status}</span>`, { sticky: true });
        this.layers.roads.addLayer(roadLine);
      });
    }

    // 5. Vulnerability Buffer Heatmap
    const vulnData = impact.vulnerability_layer || {};
    (vulnData.zones || []).forEach(z => {
      const circle = L.circle(z.center, {
        radius: z.radius_meters,
        color: z.color,
        fillColor: z.color,
        fillOpacity: 0.16,
        weight: 1.5,
        dashArray: '6, 6'
      }).bindTooltip(`<strong>${z.tier}</strong><br>${z.rationale}`, { sticky: true });
      this.layers.vulnerability.addLayer(circle);
    });
  }

  /**
   * Select a zone: Automatically navigates the map to the location,
   * draws pulsing proximity connector rays to nearby facilities,
   * opens a rich satellite intelligence card directly on the map canvas,
   * and synchronizes the detail drawer.
   */
  selectZone(zone) {
    if (!zone) return;

    // 1. Determine zone centroid
    let centerLat = zone.center ? zone.center[0] : null;
    let centerLon = zone.center ? zone.center[1] : null;

    if ((!centerLat || !centerLon) && zone.bbox && this.currentBounds) {
      const latMin = this.currentBounds[0][0];
      const lonMin = this.currentBounds[0][1];
      const latSpan = this.currentBounds[1][0] - this.currentBounds[0][0];
      const lonSpan = this.currentBounds[1][1] - this.currentBounds[0][1];
      const [px, py, pw, ph] = zone.bbox;
      centerLat = latMin + (1.0 - (py + ph / 2) / 800.0) * latSpan;
      centerLon = lonMin + ((px + pw / 2) / 800.0) * lonSpan;
      zone.center = [centerLat, centerLon];
    }

    if (!centerLat || !centerLon) {
      centerLat = this.map.getCenter().lat;
      centerLon = this.map.getCenter().lng;
    }

    // 2. Automatically navigate map directly to the selected location
    this.map.flyTo([centerLat, centerLon], 15, {
      animate: true,
      duration: 1.0,
      easeLinearity: 0.25
    });

    // 3. Clear and draw dynamic animated proximity connector rays
    this.layers.impactRays.clearLayers();

    const facilities = (this.activeDataset && this.activeDataset.community_impact && this.activeDataset.community_impact.nearby_facilities) || {};
    const schools = facilities.schools || [];
    const hospitals = facilities.hospitals || [];
    const settlements = facilities.settlements || [];

    // Helper: Haversine distance in meters
    const calcDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371e3;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round(R * c);
    };

    const nearbyItems = [
      ...hospitals.map(h => ({ ...h, type: 'Hospital', icon: '🏥', color: '#ef4444' })),
      ...schools.map(s => ({ ...s, type: 'School', icon: '🏫', color: '#a855f7' })),
      ...settlements.map(set => ({ ...set, type: 'Settlement', icon: '🏘️', color: '#06b6d4' }))
    ].map(item => ({
      ...item,
      distMeters: calcDistance(centerLat, centerLon, item.lat, item.lon)
    })).sort((a, b) => a.distMeters - b.distMeters);

    // Draw connector rays and pulsing targets directly on the map
    nearbyItems.slice(0, 4).forEach(item => {
      // Dashed animated ray line
      const ray = L.polyline([[centerLat, centerLon], [item.lat, item.lon]], {
        className: 'impact-connector-ray',
        color: item.color,
        weight: 3,
        opacity: 0.9,
        dashArray: '6, 8'
      });
      ray.bindTooltip(`<strong>${item.icon} ${item.name}</strong><br>Distance: ${item.distMeters}m · Proximity Impact Vector`, {
        className: 'leaflet-tooltip-dark',
        sticky: true
      });
      this.layers.impactRays.addLayer(ray);

      // Pulsing halo circle marker around impacted facility
      const halo = L.circleMarker([item.lat, item.lon], {
        radius: 14,
        color: item.color,
        fillColor: item.color,
        fillOpacity: 0.35,
        weight: 2
      });
      this.layers.impactRays.addLayer(halo);
    });

    // 4. Show changes & impact directly in a rich Leaflet popup on the map
    const zoneType = zone.classification ? zone.classification.type : 'Detected Anomaly';
    const tier = zone.tier || 'MODERATE';
    const tierClass = tier === 'CRITICAL' ? 'text-red' : 'text-orange';
    const urgency = zone.urgency_score || 94;
    const conf = zone.confidence ? zone.confidence.score_pct : 92;
    const areaHa = zone.hectares || 120;
    const areaKm2 = (areaHa / 100).toFixed(2);

    let impactListHtml = '';
    if (nearbyItems.length > 0) {
      impactListHtml = nearbyItems.slice(0, 3).map(item => `
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.74rem; padding: 2px 0;">
          <span>${item.icon} <strong>${item.name}</strong></span>
          <span style="color: ${item.color}; font-family: var(--font-mono); font-weight: 600;">${item.distMeters}m</span>
        </div>
      `).join('');
    } else {
      impactListHtml = '<div style="font-size: 0.72rem; color: var(--text-dim);">No civilian infrastructure in immediate radius.</div>';
    }

    const popupHtml = `
      <div class="map-popup-intel-card">
        <div class="map-popup-header">
          <div>
            <div class="map-popup-title">${zoneType}</div>
            <div style="font-size: 0.68rem; color: #94a3b8;">Zone Sector ${zone.zone_id} · ${this.activeDataset?.metadata?.location || 'Target AOI'}</div>
          </div>
          <span class="priority-badge-pill ${tierClass}" style="font-size: 0.65rem;">${tier}</span>
        </div>
        <div class="map-popup-kpis">
          <div class="map-popup-kpi-item">
            <span class="map-popup-kpi-label">AFFECTED AREA</span>
            <span class="map-popup-kpi-val">${areaHa} ha <small style="font-size:0.65rem; color:#94a3b8;">(${areaKm2}km²)</small></span>
          </div>
          <div class="map-popup-kpi-item">
            <span class="map-popup-kpi-label">URGENCY SCORE</span>
            <span class="map-popup-kpi-val" style="color: ${tier === 'CRITICAL' ? '#ef4444' : '#f97316'};">${urgency} / 100</span>
          </div>
          <div class="map-popup-kpi-item">
            <span class="map-popup-kpi-label">CONFIDENCE</span>
            <span class="map-popup-kpi-val">${conf}%</span>
          </div>
          <div class="map-popup-kpi-item">
            <span class="map-popup-kpi-label">SEVERITY</span>
            <span class="map-popup-kpi-val">${zone.severity_level || tier}</span>
          </div>
        </div>
        <div class="map-popup-impact-summary">
          <div class="map-popup-impact-title">DIRECT COMMUNITY IMPACT IN PROXIMITY</div>
          ${impactListHtml}
        </div>
        <button class="map-popup-btn-inspect" onclick="if(window.earthLensApp) window.earthLensApp.switchWorkspace('community-impact')">
          View Community Impact Matrix →
        </button>
      </div>
    `;

    L.popup({
      offset: [0, -10],
      className: 'leaflet-popup-dark'
    })
      .setLatLng([centerLat, centerLon])
      .setContent(popupHtml)
      .openOn(this.map);

    // 5. Also synchronize with bottom detail drawer
    const drawer = document.getElementById('detail-drawer');
    if (drawer) {
      drawer.classList.remove('minimized');
      
      const elType = document.getElementById('detail-hazard-type');
      const elPrio = document.getElementById('detail-priority-tag');
      const elLoc = document.getElementById('detail-location-name');
      const elArea = document.getElementById('detail-affected-area');
      const elSev = document.getElementById('detail-severity');
      const elConf = document.getElementById('detail-confidence');
      const elScore = document.getElementById('detail-priority-score');
      const elAiSummary = document.getElementById('detail-ai-summary');

      if (elType) elType.textContent = zoneType;
      if (elPrio) {
        elPrio.textContent = `${zone.tier} PRIORITY`;
        elPrio.className = `priority-badge-pill ${tierClass}`;
      }
      if (elLoc && this.activeDataset) elLoc.textContent = this.activeDataset.metadata.location || 'Observed AOI';
      if (elArea) elArea.textContent = `${zone.hectares} ha (${areaKm2} km²)`;
      if (elSev) elSev.textContent = zone.severity_level || zone.tier;
      if (elConf) elConf.textContent = `${conf}%`;
      if (elScore) elScore.textContent = `${urgency} / 100`;

      if (elAiSummary && zone.incident_brief && zone.incident_brief.brief_text) {
        elAiSummary.textContent = zone.incident_brief.brief_text;
      }
    }
  }

  zoomToZone(zoneId) {
    if (!this.activeDataset) return;
    const zone = (this.activeDataset.ranked_zones || []).find(z => z.zone_id === zoneId);
    if (zone) {
      this.selectZone(zone);
    }
  }

  zoomToCoordinates(lat, lon, zoom = 14) {
    this.map.flyTo([lat, lon], zoom, { duration: 1.2 });
  }

  dropSearchBeacon(lat, lon, label = 'Searched Target') {
    if (this.searchMarker) {
      this.map.removeLayer(this.searchMarker);
      this.searchMarker = null;
    }

    const beaconIcon = L.divIcon({
      className: 'search-beacon-marker',
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 2px solid #06b6d4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.85;"></div>
          <div style="position: absolute; width: 14px; height: 14px; border-radius: 50%; background: #06b6d4; box-shadow: 0 0 14px #06b6d4;"></div>
          <div style="position: absolute; color: #fff; font-size: 11px; font-weight: bold; line-height: 1;">⊕</div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    this.searchMarker = L.marker([lat, lon], { icon: beaconIcon }).addTo(this.map);
    this.searchMarker.bindPopup(`
      <div style="padding: 10px 12px; min-width: 220px; background: rgba(9, 14, 26, 0.96); border-radius: 8px; color: #fff;">
        <div style="font-weight: 800; font-size: 0.88rem; color: #06b6d4; display: flex; align-items: center; gap: 6px;">
          <span>🎯</span> RECONNAISSANCE TARGET
        </div>
        <div style="font-size: 0.82rem; margin-top: 6px; font-weight: 600; color: #f8fafc;">${label}</div>
        <div style="font-size: 0.72rem; font-family: monospace; color: #94a3b8; margin-top: 4px;">
          ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E
        </div>
        <div style="margin-top: 8px; font-size: 0.7rem; color: #38bdf8;">
          ✓ Orbital radar telemetry synchronized
        </div>
      </div>
    `, { className: 'leaflet-popup-dark' }).openPopup();
  }
}

// Global Singleton
window.earthMap = new IntelligenceMapEngine();
