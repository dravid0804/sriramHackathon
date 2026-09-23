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

    // 3. Vulnerability Banner & Rationale
    const ciVulnLevel = document.getElementById('ci-vuln-level');
    const ciVulnRationale = document.getElementById('ci-vuln-rationale');
    if (ciVulnLevel) ciVulnLevel.textContent = `${(summary.vulnerability_tier || 'MODERATE').toUpperCase()} VULNERABILITY TERRAIN`;
    if (ciVulnRationale && impactData.vulnerability_layer) {
      ciVulnRationale.textContent = impactData.vulnerability_layer.rationale || 'Geospatial infrastructure density evaluation.';
    }

    // 4. Hospitals List with ICU Badges & Exposure Metrics
    const hospList = document.getElementById('ci-hospitals-list');
    if (hospList) {
      hospList.innerHTML = '';
      (facilities.hospitals || []).forEach(h => {
        const item = document.createElement('div');
        item.className = 'facility-item-row enhanced-facility-card';
        const distKm = h.distance_km != null ? h.distance_km : 1.0;
        item.innerHTML = `
          <div class="facility-info-meta">
            <div class="facility-title-row">
              <strong class="facility-name">${h.name}</strong>
              ${h.emergency_icu ? '<span class="badge-icu-active">🏥 ICU EMERGENCY ACTIVE</span>' : '<span class="badge-clinic">CLINIC</span>'}
            </div>
            <div class="facility-sub-detail">
              <span>🛏️ ${h.beds} Hospital Beds</span> · 
              <span>📍 ${distKm} km from epicenter</span>
            </div>
          </div>
          <div class="facility-status-col">
            <span class="facility-status-pill status-red">${h.status}</span>
          </div>
        `;
        hospList.appendChild(item);
      });
    }

    // 5. Schools List with Student Enrollment Badges
    const schoolsList = document.getElementById('ci-schools-list');
    if (schoolsList) {
      schoolsList.innerHTML = '';
      (facilities.schools || []).forEach(sc => {
        const item = document.createElement('div');
        item.className = 'facility-item-row enhanced-facility-card';
        const distKm = sc.distance_km != null ? sc.distance_km : 0.8;
        item.innerHTML = `
          <div class="facility-info-meta">
            <div class="facility-title-row">
              <strong class="facility-name">${sc.name}</strong>
              <span class="badge-students">🏫 ${sc.students} Students</span>
            </div>
            <div class="facility-sub-detail">
              <span>📍 Proximity Buffer: ${distKm} km</span>
            </div>
          </div>
          <div class="facility-status-col">
            <span class="facility-status-pill status-orange">${sc.status}</span>
          </div>
        `;
        schoolsList.appendChild(item);
      });
    }

    // 6. Roads & Transit Access Links
    const roadsList = document.getElementById('ci-roads-list');
    if (roadsList) {
      roadsList.innerHTML = '';
      (facilities.roads || []).forEach(r => {
        const item = document.createElement('div');
        item.className = 'facility-item-row enhanced-facility-card';
        item.innerHTML = `
          <div class="facility-info-meta">
            <div class="facility-title-row">
              <strong class="facility-name">${r.name}</strong>
              <span class="badge-transit">🛣️ ${r.type} (${r.lanes} Lanes)</span>
            </div>
            <div class="facility-sub-detail">
              <span>Transit Capacity & Evacuation Corridor</span>
            </div>
          </div>
          <div class="facility-status-col">
            <span class="facility-status-pill status-cyan">${r.status}</span>
          </div>
        `;
        roadsList.appendChild(item);
      });
    }

    // 7. Settlements & Population Clusters (if container exists or dynamically added)
    const settlementsList = document.getElementById('ci-settlements-list');
    if (settlementsList) {
      settlementsList.innerHTML = '';
      (facilities.settlements || []).forEach(s => {
        const item = document.createElement('div');
        item.className = 'facility-item-row enhanced-facility-card';
        item.innerHTML = `
          <div class="facility-info-meta">
            <div class="facility-title-row">
              <strong class="facility-name">${s.name}</strong>
              <span class="badge-population">👥 ${s.population.toLocaleString()} Residents</span>
            </div>
            <div class="facility-sub-detail">
              <span>📍 Distance: ${s.distance_km} km</span>
            </div>
          </div>
          <div class="facility-status-col">
            <span class="facility-status-pill status-purple">${s.status}</span>
          </div>
        `;
        settlementsList.appendChild(item);
      });
    }
  }
}

window.communityImpactModule = new CommunityImpactModule();
