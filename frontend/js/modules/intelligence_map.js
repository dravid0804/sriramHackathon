/**
 * EarthLens AI — Extraordinary Live Intelligence Map Engine
 * Manages Leaflet geospatial canvas, ESRI Satellite / Dark Matter basemaps,
 * 16 toggleable intelligence layers, comparison modes, and draggable swipe curtain.
 */

class IntelligenceMapEngine {
  constructor() {
    this.map = null;
    this.currentMode = 'difference'; // 'before', 'after', 'difference', 'impact'
    this.currentBasemap = 'satellite'; // 'satellite', 'dark'
    this.activeDataset = null;
    this.activeScenarioId = 'derna_flooding';
    this.activeLayers = {};
    this.isCurtainActive = false;
    this.curtainPosition = 50; // percentage
    
    // Layer Groups for all 16 layers
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

    // Basemap tile providers
    this.basemaps = {
      satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19
      }),
      dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      })
    };

    // Image overlay handles for before/after raster overlays
    this.beforeOverlay = null;
    this.afterOverlay = null;
  }

  init(containerId = 'geospatial-map') {
    const defaultCenter = [32.7667, 22.6367]; // Derna coordinates
    const defaultZoom = 14;

    this.map = L.map(containerId, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: false, // Custom floating controls used instead
      attributionControl: false
    });

    // Add initial basemap
    this.basemaps.satellite.addTo(this.map);

    // Add all layer groups to map
    Object.values(this.layers).forEach(lg => lg.addTo(this.map));

    // Bind map movement to update coordinates HUD
    this.map.on('mousemove', (e) => {
      const coordEl = document.getElementById('hud-coordinates');
      if (coordEl) {
        coordEl.textContent = `${e.latlng.lat.toFixed(4)}°N, ${e.latlng.lng.toFixed(4)}°E`;
      }
    });

    // Setup map control button listeners
    this.setupControlListeners();
    this.setupSwipeCurtain();
    this.setupLayerCheckboxListeners();
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

    // Measure tool (shows quick distance guide tooltip)
    const measure = document.getElementById('ctrl-measure');
    if (measure) measure.addEventListener('click', () => {
      alert('EarthLens Spatial Scale: 1 Screen Grid Unit ≈ 500m at Zoom 14. Perimeter buffer measurement enabled.');
    });

    // Basemap toggle
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

    // Legend Collapse Toggle
    const legendToggle = document.getElementById('legend-toggle');
    const legendBody = document.getElementById('legend-body');
    if (legendToggle && legendBody) {
      legendToggle.addEventListener('click', () => {
        if (legendBody.style.display === 'none') {
          legendBody.style.display = 'flex';
          legendToggle.textContent = '−';
        } else {
          legendBody.style.display = 'none';
          legendToggle.textContent = '+';
        }
      });
    }

    // Comparison Mode Tabs: [ BEFORE ] [ AFTER ] [ DIFFERENCE ] [ IMPACT ]
    const modeTabs = document.querySelectorAll('.mode-tab');
    modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        modeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.dataset.mode;
        this.setComparisonMode(mode);
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

    // Select All / Clear All buttons
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

      // Dragging logic
      let isDragging = false;
      divider.addEventListener('mousedown', (e) => {
        isDragging = true;
        e.preventDefault();
      });

      window.addEventListener('mouseup', () => { isDragging = false; });
      window.addEventListener('mousemove', (e) => {
        if (!isDragging || !this.isCurtainActive) return;
        const rect = curtain.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const pct = (x / rect.width) * 100;
        this.curtainPosition = pct;
        divider.style.left = `${pct}%`;
        this.applyCurtainClipping(pct);
      });
    }
  }

  applyCurtainClipping(percentage) {
    if (this.afterOverlay && this.afterOverlay._image) {
      // Clip after image to show from 0 to percentage%
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
    document.getElementById('hud-aoi-title').textContent = meta.title || meta.location;
    document.getElementById('hud-coordinates').textContent = `${coords.lat.toFixed(4)}°N, ${coords.lon.toFixed(4)}°E`;
    document.getElementById('top-date-before').textContent = meta.date_before || 'Baseline';
    document.getElementById('top-date-after').textContent = meta.date_after || 'Current';

    // Fly smoothly to target AOI
    this.map.flyTo([coords.lat, coords.lon], coords.zoom || 14, {
      duration: 1.4,
      easeLinearity: 0.25
    });

    // Calculate LatLng bounds corresponding to the 800x800 image footprint (~4km box)
    const latSpan = 0.038;
    const lonSpan = 0.045;
    const bounds = [
      [coords.lat - latSpan / 2, coords.lon - lonSpan / 2],
      [coords.lat + latSpan / 2, coords.lon + lonSpan / 2]
    ];

    // Clear existing image overlays
    if (this.beforeOverlay) this.map.removeLayer(this.beforeOverlay);
    if (this.afterOverlay) this.map.removeLayer(this.afterOverlay);

    // Add satellite raster overlays
    if (analysisResult.before_image_url) {
      this.beforeOverlay = L.imageOverlay(analysisResult.before_image_url, bounds, { opacity: 0.0 }).addTo(this.map);
    }
    if (analysisResult.after_image_url) {
      this.afterOverlay = L.imageOverlay(analysisResult.after_image_url, bounds, { opacity: 0.85 }).addTo(this.map);
    }

    // Clear all vector layers
    Object.values(this.layers).forEach(lg => lg.clearLayers());

    // 1. Render Detected Changes & Severity Polygons
    const zones = analysisResult.ranked_zones || [];
    zones.forEach((zone) => {
      this.renderChangeZone(zone, bounds, meta);
    });

    // 2. Render Community Impact Infrastructure
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

    // Convert pixel bbox [x, y, w, h] to geographic lat/lon polygon
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

    // Add Polygon to changes and severity layer
    const poly = L.polygon(polyCoords, {
      color: strokeColor,
      weight: 2.5,
      fillColor: fillColor,
      fillOpacity: 0.38,
      dashArray: tier === 'CRITICAL' ? null : '4, 4'
    });

    // Click handler to open right detail drawer
    poly.on('click', () => {
      this.selectZone(zone);
    });

    poly.bindTooltip(`<strong>${zone.classification ? zone.classification.type : 'Anomaly'} (Zone ${zone.zone_id})</strong><br>Area: ${zone.hectares} ha | Urgency: ${zone.urgency_score}/100`, {
      className: 'leaflet-tooltip-dark',
      sticky: true
    });

    this.layers.changes.addLayer(poly);
    this.layers.severity.addLayer(poly);

    // If critical, add pulsing marker
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

    // 1. Schools (Custom SVG Icon)
    const schools = facilities.schools || [];
    schools.forEach(sc => {
      const icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div class="marker-school" title="${sc.name}">🏫</div>`,
        iconSize: [28, 28]
      });
      const marker = L.marker([sc.lat, sc.lon], { icon })
        .bindTooltip(`<strong>${sc.name}</strong><br>Capacity: ${sc.students} students<br>Status: ${sc.status}`, { sticky: true });
      this.layers.schools.addLayer(marker);
    });

    // 2. Hospitals (Custom SVG Icon)
    const hospitals = facilities.hospitals || [];
    hospitals.forEach(h => {
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
    const settlements = facilities.settlements || [];
    settlements.forEach(s => {
      const icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div class="marker-settlement" title="${s.name}">🏘️</div>`,
        iconSize: [26, 26]
      });
      const marker = L.marker([s.lat, s.lon], { icon })
        .bindTooltip(`<strong>${s.name}</strong><br>Population: ${s.population.toLocaleString()}<br>Status: ${s.status}`, { sticky: true });
      this.layers.settlements.addLayer(marker);
    });

    // 4. Roads (Transit vectors)
    const roads = facilities.roads || [];
    roads.forEach((r, idx) => {
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

    // 5. Community Vulnerability Heatmap Buffers (Section 10)
    const vulnData = impact.vulnerability_layer || {};
    const zones = vulnData.zones || [];
    zones.forEach(z => {
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

  selectZone(zone) {
    // Open right detail drawer and populate with zone telemetry
    const drawer = document.getElementById('detail-drawer');
    if (drawer) {
      drawer.classList.remove('minimized');
      
      // Update Detail Drawer values
      document.getElementById('detail-hazard-type').textContent = zone.classification ? zone.classification.type : 'Detected Anomaly';
      document.getElementById('detail-priority-tag').textContent = `${zone.tier} PRIORITY`;
      document.getElementById('detail-priority-tag').className = `priority-badge-pill ${zone.tier === 'CRITICAL' ? 'text-red' : 'text-orange'}`;
      document.getElementById('detail-location-name').textContent = this.activeDataset.metadata.location || 'Observed AOI';
      document.getElementById('detail-affected-area').textContent = `${zone.hectares} ha`;
      document.getElementById('detail-severity').textContent = zone.severity_level || zone.tier;
      document.getElementById('detail-confidence').textContent = `${zone.confidence ? zone.confidence.score_pct : 92}%`;
      document.getElementById('detail-priority-score').textContent = `${zone.urgency_score || 94} / 100`;

      // AI Summary
      if (zone.incident_brief && zone.incident_brief.brief_text) {
        document.getElementById('detail-ai-summary').textContent = zone.incident_brief.brief_text;
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
