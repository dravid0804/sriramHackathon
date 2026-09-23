/**
 * EarthLens AI — Community Impact & Vulnerability UI Module
 * Owned by: MEMBER 2 (Community Impact & Vulnerability Lead)
 * Zero Merge Conflicts: Only Member 2 edits this file.
 * Answers: "Who and what could be affected by this environmental change?"
 */

class CommunityImpactModule {
  constructor() {
    this.currentImpactData = null;
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.initEventListeners();
  }

  initEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      // Category Filter Tabs
      const filterTabs = document.getElementById('ci-filter-tabs');
      if (filterTabs) {
        filterTabs.addEventListener('click', (e) => {
          const btn = e.target.closest('.ci-filter-btn');
          if (!btn) return;
          filterTabs.querySelectorAll('.ci-filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.activeFilter = btn.getAttribute('data-filter') || 'all';
          this.applyFilters();
        });
      }

      // Live Search Input
      const searchInput = document.getElementById('ci-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = (e.target.value || '').toLowerCase().trim();
          this.applyFilters();
        });
      }
    });
  }

  applyFilters() {
    const blocks = document.querySelectorAll('.facility-card-block');
    blocks.forEach(block => {
      const category = block.getAttribute('data-category');
      const matchesCategory = (this.activeFilter === 'all' || this.activeFilter === category);

      if (!matchesCategory) {
        block.style.display = 'none';
        return;
      }

      // Filter individual items inside block by search query
      const items = block.querySelectorAll('.facility-item-row');
      let visibleCount = 0;
      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        const matchesSearch = !this.searchQuery || text.includes(this.searchQuery);
        item.style.display = matchesSearch ? 'flex' : 'none';
        if (matchesSearch) visibleCount++;
      });

      block.style.display = (visibleCount > 0 || !this.searchQuery) ? 'flex' : 'none';
    });
  }

  calculateThreatPercentage(distKm, maxDistKm = 3.0) {
    if (distKm <= 0.3) return 96;
    if (distKm >= maxDistKm) return 15;
    const ratio = 1 - (distKm / maxDistKm);
    return Math.max(18, Math.min(95, Math.round(ratio * 100)));
  }

  updateImpact(impactData, metadata) {
    this.currentImpactData = impactData;
    const summary = impactData.community_impact_summary || {};
    const facilities = impactData.nearby_facilities || {};

    // 1. Update Right-Side Detail Drawer Quick Stats
    const elSettlements = document.getElementById('detail-settlements-count');
    const elSchools = document.getElementById('detail-schools-count');
    const elHospitals = document.getElementById('detail-hospitals-count');
    const elRoads = document.getElementById('detail-roads-count');
    const elAgri = document.getElementById('detail-agri-land');

    if (elSettlements) elSettlements.textContent = summary.settlements_count || 0;
    if (elSchools) elSchools.textContent = summary.schools_count || 0;
    if (elHospitals) elHospitals.textContent = summary.hospitals_count || 0;
    if (elRoads) elRoads.textContent = summary.roads_count || 0;
    if (elAgri) elAgri.textContent = `${summary.agricultural_land_km2 || 0} km²`;

    // 2. Update Community Impact Dedicated Panel Quick Stats
    const ciSettlements = document.getElementById('ci-settlements-count');
    const ciSchools = document.getElementById('ci-schools-count');
    const ciHospitals = document.getElementById('ci-hospitals-count');
    const ciRoads = document.getElementById('ci-roads-count');
    const ciAgri = document.getElementById('ci-agri-land');

    if (ciSettlements) ciSettlements.textContent = summary.settlements_count || 0;
    if (ciSchools) ciSchools.textContent = summary.schools_count || 0;
    if (ciHospitals) ciHospitals.textContent = summary.hospitals_count || 0;
    if (ciRoads) ciRoads.textContent = summary.roads_count || 0;
    if (ciAgri) ciAgri.textContent = `${summary.agricultural_land_km2 || 0} km²`;

    // Count Badges on Card Header
    const bHosp = document.getElementById('ci-hosp-count-badge');
    const bSchools = document.getElementById('ci-schools-count-badge');
    const bRoads = document.getElementById('ci-roads-count-badge');
    const bSettlements = document.getElementById('ci-settlements-count-badge');

    if (bHosp) bHosp.textContent = `${(facilities.hospitals || []).length} Facilities`;
    if (bSchools) bSchools.textContent = `${(facilities.schools || []).length} Facilities`;
    if (bRoads) bRoads.textContent = `${(facilities.roads || []).length} Corridors`;
    if (bSettlements) bSettlements.textContent = `${(facilities.settlements || []).length} Settlements`;

    // 3. Vulnerability Banner & Rationale
    const ciVulnLevel = document.getElementById('ci-vuln-level');
    const ciVulnRationale = document.getElementById('ci-vuln-rationale');
    if (ciVulnLevel) ciVulnLevel.textContent = `${(summary.vulnerability_tier || 'MODERATE').toUpperCase()} VULNERABILITY TERRAIN`;
    if (ciVulnRationale && impactData.vulnerability_layer) {
      ciVulnRationale.textContent = impactData.vulnerability_layer.rationale || 'Geospatial infrastructure density evaluation.';
    }

    // 4. Hospitals List with ICU Badges & Proximity Threat Meter
    const hospList = document.getElementById('ci-hospitals-list');
    if (hospList) {
      hospList.innerHTML = '';
      (facilities.hospitals || []).forEach(h => {
        const distKm = h.distance_km != null ? h.distance_km : 0.8;
        const threatPct = this.calculateThreatPercentage(distKm, 2.5);
        const item = document.createElement('div');
        item.className = 'facility-item-row';
        item.innerHTML = `
          <div class="facility-title-row">
            <span class="facility-name">${h.name}</span>
            <span class="facility-status-pill status-red">${h.status}</span>
          </div>
          <div class="facility-badges-row">
            ${h.emergency_icu ? '<span class="badge-icu-active">🏥 ICU EMERGENCY ACTIVE</span>' : '<span class="badge-clinic">CLINIC</span>'}
            <span class="badge-icu-active" style="background: rgba(239,68,68,0.12); color:#fca5a5;">🛏️ ${h.beds} Hospital Beds</span>
            <span class="badge-dist">📍 ${distKm} km from epicenter</span>
          </div>
          <div class="threat-meter-container">
            <span class="threat-meter-label">Proximity Risk:</span>
            <div class="threat-meter-bar-wrapper">
              <div class="threat-meter-fill fill-red" style="width: ${threatPct}%;"></div>
            </div>
            <span class="threat-meter-val" style="color: #ef4444;">${threatPct}% Exposure</span>
          </div>
        `;
        hospList.appendChild(item);
      });
    }

    // 5. Schools List with Student Enrollment Badges & Proximity Threat Meter
    const schoolsList = document.getElementById('ci-schools-list');
    if (schoolsList) {
      schoolsList.innerHTML = '';
      (facilities.schools || []).forEach(sc => {
        const distKm = sc.distance_km != null ? sc.distance_km : 0.7;
        const threatPct = this.calculateThreatPercentage(distKm, 2.5);
        const item = document.createElement('div');
        item.className = 'facility-item-row';
        item.innerHTML = `
          <div class="facility-title-row">
            <span class="facility-name">${sc.name}</span>
            <span class="facility-status-pill status-orange">${sc.status}</span>
          </div>
          <div class="facility-badges-row">
            <span class="badge-students">🏫 ${sc.students} Enrolled Students</span>
            <span class="badge-dist">📍 Proximity Buffer: ${distKm} km</span>
          </div>
          <div class="threat-meter-container">
            <span class="threat-meter-label">Proximity Risk:</span>
            <div class="threat-meter-bar-wrapper">
              <div class="threat-meter-fill fill-orange" style="width: ${threatPct}%;"></div>
            </div>
            <span class="threat-meter-val" style="color: #f97316;">${threatPct}% Exposure</span>
          </div>
        `;
        schoolsList.appendChild(item);
      });
    }

    // 6. Roads & Transit Access Corridors
    const roadsList = document.getElementById('ci-roads-list');
    if (roadsList) {
      roadsList.innerHTML = '';
      (facilities.roads || []).forEach(r => {
        const item = document.createElement('div');
        item.className = 'facility-item-row';
        item.innerHTML = `
          <div class="facility-title-row">
            <span class="facility-name">${r.name}</span>
            <span class="facility-status-pill status-cyan">${r.status}</span>
          </div>
          <div class="facility-badges-row">
            <span class="badge-transit">🛣️ ${r.type} (${r.lanes} Lanes)</span>
            <span class="badge-dist">Transit Capacity & Evacuation Corridor</span>
          </div>
        `;
        roadsList.appendChild(item);
      });
    }

    // 7. Settlements & Population Clusters
    const settlementsList = document.getElementById('ci-settlements-list');
    if (settlementsList) {
      settlementsList.innerHTML = '';
      (facilities.settlements || []).forEach(s => {
        const distKm = s.distance_km != null ? s.distance_km : 1.2;
        const threatPct = this.calculateThreatPercentage(distKm, 3.0);
        const item = document.createElement('div');
        item.className = 'facility-item-row';
        item.innerHTML = `
          <div class="facility-title-row">
            <span class="facility-name">${s.name}</span>
            <span class="facility-status-pill status-purple">${s.status}</span>
          </div>
          <div class="facility-badges-row">
            <span class="badge-population">👥 ${(s.population || 0).toLocaleString()} Residents</span>
            <span class="badge-dist">📍 Distance: ${distKm} km</span>
          </div>
          <div class="threat-meter-container">
            <span class="threat-meter-label">Proximity Risk:</span>
            <div class="threat-meter-bar-wrapper">
              <div class="threat-meter-fill fill-purple" style="width: ${threatPct}%;"></div>
            </div>
            <span class="threat-meter-val" style="color: #a855f7;">${threatPct}% Exposure</span>
          </div>
        `;
        settlementsList.appendChild(item);
      });
    }

    this.applyFilters();
  }
}

window.communityImpactModule = new CommunityImpactModule();
