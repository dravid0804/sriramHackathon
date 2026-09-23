/**
 * EarthLens AI — Community Impact & Vulnerability UI Module
 * Answers: "Who and what could be affected by this environmental change?"
 */

class CommunityImpactModule {
  constructor() {
    this.currentImpactData = null;
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

    // 2. Update Community Impact Dedicated Panel
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

    // Vulnerability Tier
    const ciVulnLevel = document.getElementById('ci-vuln-level');
    const ciVulnRationale = document.getElementById('ci-vuln-rationale');
    if (ciVulnLevel) ciVulnLevel.textContent = `${(summary.vulnerability_tier || 'MODERATE').toUpperCase()} VULNERABILITY TERRAIN`;
    if (ciVulnRationale && impactData.vulnerability_layer) {
      ciVulnRationale.textContent = impactData.vulnerability_layer.rationale || 'Geospatial infrastructure density evaluation.';
    }

    // Hospitals List
    const hospList = document.getElementById('ci-hospitals-list');
    if (hospList) {
      hospList.innerHTML = '';
      (facilities.hospitals || []).forEach(h => {
        const item = document.createElement('div');
        item.className = 'facility-item-row';
        item.innerHTML = `
          <div>
            <strong>${h.name}</strong>
            <div style="font-size: 0.72rem; color: #94a3b8;">${h.beds} Beds · ${h.emergency_icu ? 'Emergency ICU Active' : 'Clinic'}</div>
          </div>
          <span style="color: #ef4444; font-weight: 600; font-size: 0.72rem;">${h.status}</span>
        `;
        hospList.appendChild(item);
      });
    }

    // Schools List
    const schoolsList = document.getElementById('ci-schools-list');
    if (schoolsList) {
      schoolsList.innerHTML = '';
      (facilities.schools || []).forEach(sc => {
        const item = document.createElement('div');
        item.className = 'facility-item-row';
        item.innerHTML = `
          <div>
            <strong>${sc.name}</strong>
            <div style="font-size: 0.72rem; color: #94a3b8;">${sc.students} Students Enrolled</div>
          </div>
          <span style="color: #f97316; font-weight: 600; font-size: 0.72rem;">${sc.status}</span>
        `;
        schoolsList.appendChild(item);
      });
    }

    // Roads List
    const roadsList = document.getElementById('ci-roads-list');
    if (roadsList) {
      roadsList.innerHTML = '';
      (facilities.roads || []).forEach(r => {
        const item = document.createElement('div');
        item.className = 'facility-item-row';
        item.innerHTML = `
          <div>
            <strong>${r.name}</strong>
            <div style="font-size: 0.72rem; color: #94a3b8;">${r.type} (${r.lanes} Lanes)</div>
          </div>
          <span style="color: #06b6d4; font-weight: 600; font-size: 0.72rem;">${r.status}</span>
        `;
        roadsList.appendChild(item);
      });
    }
  }
}

window.communityImpactModule = new CommunityImpactModule();
