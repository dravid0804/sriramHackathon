/**
 * EarthGuard AI — Feature 2 Frontend: Prioritization & Geospatial Triage
 * Owned by: MEMBER 2 (Severity-Ranked Prioritization & Geospatial Triage)
 * Handles: Fullscreen Leaflet Satellite Map, Priority Triage Queue Table, Urgency Gauge
 */

export const TriageMap = {
  leafletMap: null,
  mapMarkers: [],
  activeFilter: 'ALL',

  init() {
    this.cacheDOM();
    this.bindEvents();
  },

  cacheDOM() {
    this.fullscreenMapContainer = document.getElementById('fullscreen-leaflet-map');
    this.triageTableBody = document.getElementById('triage-table-body');
    this.triageTableCount = document.getElementById('triage-table-count');
    this.tableFilterBtns = document.querySelectorAll('[data-table-filter]');

    this.inspZoneId = document.getElementById('insp-zone-id');
    this.inspTierPill = document.getElementById('insp-tier-pill');
    this.inspTierLabel = document.getElementById('insp-tier-label');
    this.inspScoreVal = document.getElementById('insp-score-val');
    this.inspScoreBar = document.getElementById('insp-score-bar');
    this.inspEventType = document.getElementById('insp-event-type');
    this.inspAreaVal = document.getElementById('insp-area-val');
    this.inspMagVal = document.getElementById('insp-mag-val');
    this.inspSettleVal = document.getElementById('insp-settle-val');
    this.inspectorQuickZones = document.getElementById('inspector-quick-zones');
  },

  bindEvents() {
    this.tableFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.tableFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.dataset.tableFilter;
        const data = window.EarthGuardState?.analysisData;
        if (data) this.renderTriageTable(data.ranked_zones);
      });
    });
  },

  updateLeafletMap(meta, zones = []) {
    if (!meta || !meta.coordinates) return;
    const lat = meta.coordinates.lat;
    const lon = meta.coordinates.lon;
    const zoom = meta.coordinates.zoom || 13;

    if (!this.leafletMap) {
      this.leafletMap = L.map('fullscreen-leaflet-map', {
        zoomControl: true
      }).setView([lat, lon], zoom);

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
        attribution: 'Tiles &copy; Esri &mdash; EarthGuard Geospatial'
      }).addTo(this.leafletMap);
    } else {
      this.leafletMap.setView([lat, lon], zoom);
    }

    this.mapMarkers.forEach(m => this.leafletMap.removeLayer(m));
    this.mapMarkers = [];

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
      }).addTo(this.leafletMap);

      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px;">
          <strong style="color: ${zone.tier_color};">${zone.zone_id} [${zone.tier}]</strong><br>
          <b>Type:</b> ${zone.classification?.type || 'Anomaly'}<br>
          <b>Urgency Score:</b> ${zone.urgency_score} / 100<br>
          <b>Area:</b> ${zone.hectares} ha | <b>Confidence:</b> ${zone.confidence?.percentage}%<br>
          <div style="margin-top: 6px; font-size: 12px; color: #475569;">${zone.incident_brief?.recommended_action || ''}</div>
        </div>
      `;
      circle.bindPopup(popupHtml);

      circle.on('click', () => {
        window.dispatchEvent(new CustomEvent('earthguard:zone-selected', { detail: zone }));
        window.dispatchEvent(new CustomEvent('earthguard:view-switch', { detail: 'studio' }));
      });

      this.mapMarkers.push(circle);
    });
  },

  renderTriageTable(zones = []) {
    this.triageTableBody.innerHTML = '';

    const filtered = zones.filter(z => {
      if (this.activeFilter === 'ALL') return true;
      return z.tier === this.activeFilter;
    });

    this.triageTableCount.textContent = `Showing ${filtered.length} Anomaly Records`;

    filtered.forEach(zone => {
      const tr = document.createElement('tr');
      tr.className = 'clickable';
      tr.innerHTML = `
        <td style="font-family: var(--font-mono); font-weight: 700;">#${zone.rank}</td>
        <td style="font-family: var(--font-mono); font-weight: 800; color: #fff;">${zone.zone_id}</td>
        <td><span class="inspector-tier-pill ${zone.tier.toLowerCase()}">${zone.tier}</span></td>
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
        window.dispatchEvent(new CustomEvent('earthguard:zone-selected', { detail: zone }));
        window.dispatchEvent(new CustomEvent('earthguard:view-switch', { detail: 'studio' }));
      });

      this.triageTableBody.appendChild(tr);
    });
  },

  renderZoneMetrics(zone) {
    if (!zone) return;
    this.inspZoneId.textContent = zone.zone_id;
    this.inspTierPill.textContent = zone.tier;
    this.inspTierPill.className = `inspector-tier-pill ${zone.tier.toLowerCase()}`;
    this.inspTierLabel.textContent = zone.tier_label || 'Priority Anomaly';
    this.inspTierLabel.style.color = zone.tier_color;

    this.inspScoreVal.textContent = zone.urgency_score;
    this.inspScoreVal.style.color = zone.tier_color;
    this.inspScoreBar.style.width = `${zone.urgency_score}%`;
    this.inspScoreBar.style.background = zone.tier_color;

    const cls = zone.classification || {};
    this.inspEventType.textContent = `${cls.icon || '🌐'} ${cls.type || 'Environmental Shift'}`;
    this.inspAreaVal.textContent = `${zone.hectares} ha`;
    this.inspMagVal.textContent = `${Math.round(zone.mean_magnitude * 100)}% Delta`;
    this.inspSettleVal.textContent = zone.distance_to_settlement_px < 150 ? '< 1.5 km Buffer' : '< 4.2 km Perimeter';
  },

  renderQuickChips(zones = [], selectedZone = null) {
    this.inspectorQuickZones.innerHTML = '';
    zones.forEach(zone => {
      const chip = document.createElement('div');
      const isSelected = selectedZone && selectedZone.zone_id === zone.zone_id;
      chip.className = `quick-zone-chip ${isSelected ? 'selected' : ''}`;
      chip.dataset.zoneId = zone.zone_id;
      chip.innerHTML = `<span style="color: ${zone.tier_color};">●</span> ${zone.zone_id} [${zone.urgency_score}]`;
      chip.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('earthguard:zone-selected', { detail: zone }));
      });
      this.inspectorQuickZones.appendChild(chip);
    });
  }
};
