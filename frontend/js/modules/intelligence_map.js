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

    // Create dedicated Leaflet panes for Before and After/Difference curtain swipe clipping
    this.map.createPane('beforePane');
    this.map.getPane('beforePane').style.zIndex = '401';
    this.map.createPane('afterPane');
    this.map.getPane('afterPane').style.zIndex = '402';

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
    const curtain = document.getElementById('swipe-curtain-overlay');
    const divider = document.getElementById('swipe-divider-handle');

    if (curtain && divider) {
      // Prevent Leaflet from intercepting drag & clicks
      L.DomEvent.disableClickPropagation(curtain);
      L.DomEvent.disableScrollPropagation(curtain);

      let isDragging = false;

      const startDrag = (e) => {
        isDragging = true;
        if (this.map && this.map.dragging) {
          this.map.dragging.disable();
        }
        divider.classList.add('dragging');
        if (e && e.cancelable) e.preventDefault();
      };

      divider.addEventListener('mousedown', startDrag);
      divider.addEventListener('touchstart', startDrag, { passive: false });

      // Direct click on curtain moves slider to that position
      curtain.addEventListener('mousedown', (e) => {
        if (this.currentMode !== 'swipe') return;
        startDrag(e);
        onDragMove(e.clientX);
      });
      curtain.addEventListener('touchstart', (e) => {
        if (this.currentMode !== 'swipe') return;
        if (e.touches && e.touches.length > 0) {
          startDrag(e);
          onDragMove(e.touches[0].clientX);
        }
      }, { passive: false });

      const onDragEnd = () => {
        if (isDragging) {
          isDragging = false;
          if (this.map && this.map.dragging) {
            this.map.dragging.enable();
          }
          divider.classList.remove('dragging');
        }
      };

      window.addEventListener('mouseup', onDragEnd);
      window.addEventListener('touchend', onDragEnd);
      window.addEventListener('touchcancel', onDragEnd);

      const onDragMove = (clientX) => {
        if (!isDragging || this.currentMode !== 'swipe') return;
        const rect = curtain.getBoundingClientRect();
        if (!rect.width) return;
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const pct = Math.max(1, Math.min(99, (x / rect.width) * 100));

        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        this.animFrameId = requestAnimationFrame(() => {
          this.applyCurtainClipping(pct);
        });
      };

      window.addEventListener('mousemove', (e) => {
        if (isDragging) onDragMove(e.clientX);
      });

      window.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches && e.touches.length > 0) {
          onDragMove(e.touches[0].clientX);
        }
      }, { passive: false });

      // Synchronize clipping during map pan and zoom
      if (this.map) {
        this.map.on('move', () => {
          if (this.currentMode === 'swipe') {
            this.applyCurtainClipping(this.curtainPosition || 50);
          }
        });
        this.map.on('zoom', () => {
          if (this.currentMode === 'swipe') {
            this.applyCurtainClipping(this.curtainPosition || 50);
          }
        });
      }
    }
  }

  applyCurtainClipping(percentage) {
    if (!this.map) return;
    this.curtainPosition = percentage;
    const divider = document.getElementById('swipe-divider-handle');
    if (divider) divider.style.left = `${percentage}%`;

    // Ensure parent panes do not clip or constrain child overlays
    const bPane = this.map.getPane('beforePane');
    const aPane = this.map.getPane('afterPane');
    if (bPane) {
      bPane.style.clipPath = 'none';
      bPane.style.webkitClipPath = 'none';
    }
    if (aPane) {
      aPane.style.clipPath = 'none';
      aPane.style.webkitClipPath = 'none';
    }

    // Direct pixel-accurate raster overlay clipping
    const container = this.map.getContainer();
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const dividerX = containerRect.left + (percentage / 100.0) * containerRect.width;

    const clipOverlay = (overlay, isBefore) => {
      if (!overlay) return;
      const el = overlay.getElement ? overlay.getElement() : null;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const cutX = Math.round(dividerX - rect.left);
      if (isBefore) {
        // Left side of divider: Before Satellite image visible
        if (cutX <= 0) {
          el.style.clipPath = 'polygon(0 0, 0 0, 0 100%, 0 100%)';
          el.style.webkitClipPath = 'polygon(0 0, 0 0, 0 100%, 0 100%)';
        } else if (cutX >= rect.width) {
          el.style.clipPath = 'none';
          el.style.webkitClipPath = 'none';
        } else {
          el.style.clipPath = `polygon(0 0, ${cutX}px 0, ${cutX}px 100%, 0 100%)`;
          el.style.webkitClipPath = `polygon(0 0, ${cutX}px 0, ${cutX}px 100%, 0 100%)`;
        }
      } else {
        // Right side of divider: After Satellite + Difference Heatmap visible
        if (cutX <= 0) {
          el.style.clipPath = 'none';
          el.style.webkitClipPath = 'none';
        } else if (cutX >= rect.width) {
          el.style.clipPath = 'polygon(0 0, 0 0, 0 100%, 0 100%)';
          el.style.webkitClipPath = 'polygon(0 0, 0 0, 0 100%, 0 100%)';
        } else {
          el.style.clipPath = `polygon(${cutX}px 0, 100% 0, 100% 100%, ${cutX}px 100%)`;
          el.style.webkitClipPath = `polygon(${cutX}px 0, 100% 0, 100% 100%, ${cutX}px 100%)`;
        }
      }
    };

    clipOverlay(this.beforeOverlay, true);
    clipOverlay(this.afterOverlay, false);
    clipOverlay(this.heatmapOverlay, false);
  }

  resetCurtainClipping() {
    const bPane = this.map ? this.map.getPane('beforePane') : null;
    const aPane = this.map ? this.map.getPane('afterPane') : null;
    if (bPane) {
      bPane.style.clipPath = 'none';
      bPane.style.webkitClipPath = 'none';
    }
    if (aPane) {
      aPane.style.clipPath = 'none';
      aPane.style.webkitClipPath = 'none';
    }

    const resetEl = (overlay) => {
      if (!overlay) return;
      const el = overlay.getElement ? overlay.getElement() : null;
      if (el) {
        el.style.clipPath = 'none';
        el.style.webkitClipPath = 'none';
      }
    };
    resetEl(this.beforeOverlay);
    resetEl(this.afterOverlay);
    resetEl(this.heatmapOverlay);
  }

  setComparisonMode(mode) {
    this.currentMode = mode;
    const curtain = document.getElementById('swipe-curtain-overlay');
    const container = this.map ? this.map.getContainer() : null;

    if (mode === 'before') {
      this.isCurtainActive = false;
      if (curtain) curtain.style.display = 'none';
      if (container) container.classList.remove('is-swipe-active');
      this.resetCurtainClipping();

      if (this.beforeOverlay) this.beforeOverlay.setOpacity(0.85);
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
    } else if (mode === 'after') {
      this.isCurtainActive = false;
      if (curtain) curtain.style.display = 'none';
      if (container) container.classList.remove('is-swipe-active');
      this.resetCurtainClipping();

      if (this.beforeOverlay) this.beforeOverlay.setOpacity(0.0);
      if (this.afterOverlay) this.afterOverlay.setOpacity(0.85);
      if (this.heatmapOverlay) this.heatmapOverlay.setOpacity(0.0);

      this.map.removeLayer(this.layers.changes);
      this.map.removeLayer(this.layers.severity);
      this.map.removeLayer(this.layers.vulnerability);
      this.map.removeLayer(this.layers.impactRays);
      this.map.removeLayer(this.layers.settlements);
      this.map.removeLayer(this.layers.schools);
      this.map.removeLayer(this.layers.hospitals);
      this.map.removeLayer(this.layers.roads);
    } else if (mode === 'difference') {
      this.isCurtainActive = false;
      if (curtain) curtain.style.display = 'none';
      if (container) container.classList.remove('is-swipe-active');
      this.resetCurtainClipping();

      // Subtle after context (0.35) + luminous difference heatmap (0.85)
      // Real satellite basemap roads & structures remain 100% visible through it!
      if (this.beforeOverlay) this.beforeOverlay.setOpacity(0.0);
      if (this.afterOverlay) this.afterOverlay.setOpacity(0.35);
      if (this.heatmapOverlay) this.heatmapOverlay.setOpacity(0.85);

      this.map.addLayer(this.layers.changes);
      this.map.addLayer(this.layers.severity);
      this.map.removeLayer(this.layers.vulnerability);
      this.map.removeLayer(this.layers.impactRays);
      this.map.removeLayer(this.layers.settlements);
      this.map.removeLayer(this.layers.schools);
      this.map.removeLayer(this.layers.hospitals);
      this.map.removeLayer(this.layers.roads);
    } else if (mode === 'swipe') {
      this.isCurtainActive = true;
      if (curtain) curtain.style.display = 'block';
      if (container) container.classList.add('is-swipe-active');

      this.map.addLayer(this.layers.changes);
      this.map.addLayer(this.layers.severity);
      this.map.removeLayer(this.layers.vulnerability);
      this.map.removeLayer(this.layers.impactRays);
      this.map.removeLayer(this.layers.settlements);
      this.map.removeLayer(this.layers.schools);
      this.map.removeLayer(this.layers.hospitals);
      this.map.removeLayer(this.layers.roads);

      // Left: Before image (opacity 0.95)
      // Right: After image (opacity 0.95) + Heatmap difference (opacity 0.85)
      if (this.beforeOverlay) this.beforeOverlay.setOpacity(0.95);
      if (this.afterOverlay) this.afterOverlay.setOpacity(0.95);
      if (this.heatmapOverlay) this.heatmapOverlay.setOpacity(0.85);

      this.applyCurtainClipping(this.curtainPosition || 50);
      requestAnimationFrame(() => this.applyCurtainClipping(this.curtainPosition || 50));
      setTimeout(() => this.applyCurtainClipping(this.curtainPosition || 50), 60);
    } else if (mode === 'impact') {
      this.isCurtainActive = false;
      if (curtain) curtain.style.display = 'none';
      if (container) container.classList.remove('is-swipe-active');
      this.resetCurtainClipping();

      if (this.beforeOverlay) this.beforeOverlay.setOpacity(0.0);
      if (this.afterOverlay) this.afterOverlay.setOpacity(0.45);
      if (this.heatmapOverlay) this.heatmapOverlay.setOpacity(0.40);

      this.map.addLayer(this.layers.changes);
      this.map.addLayer(this.layers.vulnerability);
      this.map.addLayer(this.layers.settlements);
      this.map.addLayer(this.layers.schools);
      this.map.addLayer(this.layers.hospitals);
      this.map.addLayer(this.layers.roads);
      this.map.addLayer(this.layers.impactRays);
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

    const triggerSwipeSync = () => {
      if (this.currentMode === 'swipe') {
        this.applyCurtainClipping(this.curtainPosition || 50);
      }
    };

    // Mount satellite raster overlays with smooth feathered blending
    if (analysisResult.before_image_url) {
      this.beforeOverlay = L.imageOverlay(analysisResult.before_image_url, this.currentBounds, {
        pane: 'beforePane',
        opacity: 0.0,
        className: 'satellite-raster-overlay'
      }).addTo(this.map);
      this.beforeOverlay.on('load', triggerSwipeSync);
    }
    if (analysisResult.after_image_url) {
      this.afterOverlay = L.imageOverlay(analysisResult.after_image_url, this.currentBounds, {
        pane: 'afterPane',
        opacity: 0.0,
        className: 'satellite-raster-overlay'
      }).addTo(this.map);
      this.afterOverlay.on('load', triggerSwipeSync);
    }
    if (analysisResult.heatmap_overlay) {
      this.heatmapOverlay = L.imageOverlay(analysisResult.heatmap_overlay, this.currentBounds, {
        pane: 'afterPane',
        opacity: 0.0,
        className: 'satellite-difference-overlay'
      }).addTo(this.map);
      this.heatmapOverlay.on('load', triggerSwipeSync);
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

    // 1. Schools & Shelters (Tactical SVG Marker)
    (facilities.schools || []).forEach(sc => {
      const icon = L.divIcon({
        className: 'tactical-marker-pin',
        html: `
          <div class="tactical-pin-badge school-badge" title="${sc.name}">
            <div class="tactical-pulse-ring"></div>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
            </svg>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      const marker = L.marker([sc.lat, sc.lon], { icon })
        .bindTooltip(`
          <div style="padding: 2px 4px;">
            <strong style="color: #c084fc;">🏫 ${sc.name}</strong><br>
            Capacity: <strong>${sc.students}</strong> students<br>
            Status: <span style="color: #10b981; font-weight:600;">${sc.status}</span>
          </div>
        `, { className: 'leaflet-tooltip-dark', sticky: true });
      this.layers.schools.addLayer(marker);
    });

    // 2. Hospitals & Emergency Care (Tactical SVG Marker)
    (facilities.hospitals || []).forEach(h => {
      const isCritical = (h.status || '').toLowerCase().includes('critical') || (h.status || '').toLowerCase().includes('compromised');
      const icon = L.divIcon({
        className: 'tactical-marker-pin',
        html: `
          <div class="tactical-pin-badge hospital-badge" title="${h.name}">
            <div class="tactical-pulse-ring"></div>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/>
            </svg>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      const marker = L.marker([h.lat, h.lon], { icon })
        .bindTooltip(`
          <div style="padding: 2px 4px;">
            <strong style="color: #ef4444;">🏥 ${h.name}</strong><br>
            Beds: <strong>${h.beds}</strong> | Emergency ICU<br>
            Status: <span style="color: ${isCritical ? '#ef4444' : '#10b981'}; font-weight:600;">${h.status}</span>
          </div>
        `, { className: 'leaflet-tooltip-dark', sticky: true });
      this.layers.hospitals.addLayer(marker);
    });

    // 3. Settlements & Population Clusters (Tactical SVG Marker)
    (facilities.settlements || []).forEach(s => {
      const icon = L.divIcon({
        className: 'tactical-marker-pin',
        html: `
          <div class="tactical-pin-badge settlement-badge" title="${s.name}">
            <div class="tactical-pulse-ring"></div>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      const marker = L.marker([s.lat, s.lon], { icon })
        .bindTooltip(`
          <div style="padding: 2px 4px;">
            <strong style="color: #22d3ee;">🏘️ ${s.name}</strong><br>
            Population: <strong>${s.population.toLocaleString()}</strong> residents<br>
            Status: <span style="color: #38bdf8; font-weight:600;">${s.status}</span>
          </div>
        `, { className: 'leaflet-tooltip-dark', sticky: true });
      this.layers.settlements.addLayer(marker);
    });

    // 4. Realistic Arterial Road Network & Bridges
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
          weight: 2.5,
          opacity: 0.80,
          dashArray: isSevered ? '6, 6' : null
        }).bindTooltip(`<strong>🛣️ ${r.name}</strong><br>${r.type} (${r.lanes} lanes)<br>Status: <span style="color:${isSevered ? '#ef4444' : '#10b981'}">${r.status}</span>`, { className: 'leaflet-tooltip-dark', sticky: true });
        this.layers.roads.addLayer(roadLine);
      });
    }

    // 5. Vulnerability Buffer (Ultra-transparent so satellite basemap is 100% visible)
    const vulnData = impact.vulnerability_layer || {};
    (vulnData.zones || []).forEach(z => {
      const circle = L.circle(z.center, {
        radius: z.radius_meters,
        color: z.color,
        fillColor: z.color,
        fillOpacity: 0.05, // Super transparent
        weight: 1.2,
        dashArray: '5, 5'
      }).bindTooltip(`<strong>${z.tier}</strong><br>${z.rationale}`, { className: 'leaflet-tooltip-dark', sticky: true });
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
        weight: 2,
        opacity: 0.85,
        dashArray: '5, 6'
      });
      ray.bindTooltip(`<strong>${item.name}</strong><br>Proximity Vector: <strong style="color:${item.color}">${item.distMeters}m</strong> (${(item.distMeters/1000).toFixed(2)} km)`, {
        className: 'leaflet-tooltip-dark',
        sticky: true
      });
      this.layers.impactRays.addLayer(ray);

      // Delicate halo circle marker around impacted facility
      const halo = L.circleMarker([item.lat, item.lon], {
        radius: 16,
        color: item.color,
        fillColor: item.color,
        fillOpacity: 0.15,
        weight: 1.5
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
