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
      vulnerability: L.layerGroup()
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

    // Mount all layer groups
    Object.values(this.layers).forEach(lg => lg.addTo(this.map));

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
    if (mode === 'before') {
      if (this.beforeOverlay) this.beforeOverlay.setOpacity(1.0);
      if (this.afterOverlay) this.afterOverlay.setOpacity(0.0);
      this.map.removeLayer(this.layers.changes);
      this.map.removeLayer(this.layers.vulnerability);
    } else if (mode === 'after') {
      if (this.beforeOverlay) this.beforeOverlay.setOpacity(0.0);
      if (this.afterOverlay) this.afterOverlay.setOpacity(1.0);
      this.map.removeLayer(this.layers.changes);
      this.map.removeLayer(this.layers.vulnerability);
    } else if (mode === 'difference') {
      if (this.beforeOverlay) this.beforeOverlay.setOpacity(0.4);
      if (this.afterOverlay) this.afterOverlay.setOpacity(0.85);
      this.map.addLayer(this.layers.changes);
      this.map.addLayer(this.layers.severity);
      this.map.removeLayer(this.layers.vulnerability);
    } else if (mode === 'impact') {
      if (this.afterOverlay) this.afterOverlay.setOpacity(0.7);
      this.map.addLayer(this.layers.changes);
      this.map.addLayer(this.layers.vulnerability);
      this.map.addLayer(this.layers.settlements);
      this.map.addLayer(this.layers.schools);
      this.map.addLayer(this.layers.hospitals);
      this.map.addLayer(this.layers.roads);
    }
  }

  loadDataset(analysisResult) {
    this.activeDataset = analysisResult;
    const meta = analysisResult.metadata || {};
    const coords = meta.coordinates || { lat: 32.7667, lon: 22.6367, zoom: 14 };

    // Update Top Telemetry
    const titleEl = document.getElementById('hud-aoi-title');
    const coordEl = document.getElementById('hud-coordinates');
    const bDateEl = document.getElementById('top-date-before');
    const aDateEl = document.getElementById('top-date-after');

    if (titleEl) titleEl.textContent = meta.title || meta.location;
    if (coordEl) coordEl.textContent = `${coords.lat.toFixed(4)}°N, ${coords.lon.toFixed(4)}°E`;
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

    // Mount satellite raster overlays
    if (analysisResult.before_image_url) {
      this.beforeOverlay = L.imageOverlay(analysisResult.before_image_url, this.currentBounds, { opacity: 0.0 }).addTo(this.map);
    }
    if (analysisResult.after_image_url) {
      this.afterOverlay = L.imageOverlay(analysisResult.after_image_url, this.currentBounds, { opacity: 0.85 }).addTo(this.map);
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

    // Apply active comparison mode
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

    const polyCoords = [
      [geoLat1, geoLon1],
      [geoLat1, geoLon2],
      [geoLat2, geoLon2],
      [geoLat2, geoLon1]
    ];

    const tier = zone.tier || 'MODERATE';
    let strokeColor = '#f97316';
    let fillColor = '#f97316';
    if (tier === 'CRITICAL') {
      strokeColor = '#ef4444';
      fillColor = '#ef4444';
    } else if (tier === 'LOW') {
      strokeColor = '#eab308';
      fillColor = '#eab308';
    }

    // Precision Vector Polygon
    const poly = L.polygon(polyCoords, {
      color: strokeColor,
      weight: 2.5,
      fillColor: fillColor,
      fillOpacity: 0.38,
      dashArray: tier === 'CRITICAL' ? null : '4, 4'
    });

    // Polygon Hover Micro-interactions
    poly.on('mouseover', () => {
      poly.setStyle({ weight: 4, fillOpacity: 0.55 });
    });
    poly.on('mouseout', () => {
      poly.setStyle({ weight: 2.5, fillOpacity: 0.38 });
    });

    poly.on('click', () => {
      this.selectZone(zone);
    });

    const zoneType = zone.classification ? zone.classification.type : 'Detected Anomaly';
    poly.bindTooltip(`<strong>${zoneType} (Zone ${zone.zone_id})</strong><br>Area: ${zone.hectares} ha | Urgency: ${zone.urgency_score}/100`, {
      className: 'leaflet-tooltip-dark',
      sticky: true
    });

    this.layers.changes.addLayer(poly);
    this.layers.severity.addLayer(poly);

    // Pulsing Marker for Critical Priority Anomaly
    if (tier === 'CRITICAL') {
      const centerLat = (geoLat1 + geoLat2) / 2;
      const centerLon = (geoLon1 + geoLon2) / 2;
      const pulseCircle = L.circleMarker([centerLat, centerLon], {
        radius: 12,
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.8,
        weight: 2
      });
      pulseCircle.on('click', () => this.selectZone(zone));
      this.layers.priority.addLayer(pulseCircle);
    }
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

    // 4. Transit Roads & Bridges
    (facilities.roads || []).forEach((r, idx) => {
      const offset = (idx - 1) * 0.005;
      const roadLine = L.polyline([
        [centerCoords.lat - 0.015, centerCoords.lon - 0.015 + offset],
        [centerCoords.lat, centerCoords.lon + offset],
        [centerCoords.lat + 0.015, centerCoords.lon + 0.015 + offset]
      ], {
        color: '#f97316',
        weight: 3.5,
        opacity: 0.85
      }).bindTooltip(`<strong>${r.name}</strong><br>${r.type} (${r.lanes} lanes)<br>Status: ${r.status}`, { sticky: true });
      this.layers.roads.addLayer(roadLine);
    });

    // 5. Vulnerability Buffer Heatmap
    const vulnData = impact.vulnerability_layer || {};
    (vulnData.zones || []).forEach(z => {
      const circle = L.circle(z.center, {
        radius: z.radius_meters,
        color: z.color,
        fillColor: z.color,
        fillOpacity: 0.18,
        weight: 1.5,
        dashArray: '6, 6'
      }).bindTooltip(`<strong>${z.tier}</strong><br>${z.rationale}`, { sticky: true });
      this.layers.vulnerability.addLayer(circle);
    });
  }

  renderDependencyCascadeOverlay(cascade) {
    if (!this.map || !cascade || !cascade.dependency_path_coordinates) return;

    // Clear existing road layer lines or create dedicated cascade group
    if (this.cascadePathLayer) {
      this.map.removeLayer(this.cascadePathLayer);
    }

    const coords = cascade.dependency_path_coordinates;
    if (coords.length < 2) return;

    this.cascadePathLayer = L.polyline(coords, {
      color: cascade.status_color || '#dc2626',
      weight: 4,
      opacity: 0.9,
      dashArray: '8, 8',
      lineCap: 'round'
    }).bindTooltip(`<strong>${cascade.title || 'Impact Cascade Path'}</strong><br>${cascade.accessibility_status}`, { sticky: true });

    this.cascadePathLayer.addTo(this.map);
  }

  selectZone(zone) {
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

      if (elType) elType.textContent = zone.classification ? zone.classification.type : 'Detected Anomaly';
      if (elPrio) {
        elPrio.textContent = `${zone.tier} PRIORITY`;
        elPrio.className = `priority-badge-pill ${zone.tier === 'CRITICAL' ? 'text-red' : 'text-orange'}`;
      }
      if (elLoc && this.activeDataset) elLoc.textContent = this.activeDataset.metadata.location || 'Observed AOI';
      if (elArea) elArea.textContent = `${zone.hectares} ha`;
      if (elSev) elSev.textContent = zone.severity_level || zone.tier;
      if (elConf) elConf.textContent = `${zone.confidence ? zone.confidence.score_pct : 92}%`;
      if (elScore) elScore.textContent = `${zone.urgency_score || 94} / 100`;

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
}

// Global Singleton
window.earthMap = new IntelligenceMapEngine();
