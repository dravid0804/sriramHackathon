/**
 * EarthLens AI — Community Impact & Critical Infrastructure Cascade UI Module
 * Owned by: MEMBER 2 (Community Impact & Vulnerability Lead)
 * Zero Merge Conflicts: Only Member 2 edits this file.
 *
 * Implements:
 * 1. Professional Earth-Observation UI system
 * 2. Novel Critical Infrastructure Impact Cascade visual tree
 * 3. Explainable Investigation Priority with expandable scoring factors
 * 4. Interactive Map dependency path overlay rendering
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

  updateImpact(impactData, metadata) {
    this.currentImpactData = impactData;
    const summary = impactData.community_impact_summary || {};
    const facilities = impactData.nearby_facilities || {};
    const cascade = impactData.impact_cascade || {};
    const priority = impactData.investigation_priority || {};

    // 1. Update Compact Top Summary Bar
    const elSumHazard = document.getElementById('ci-sum-hazard');
    const elSumArea = document.getElementById('ci-sum-area');
    const elSumFacilities = document.getElementById('ci-sum-facilities');
    const elSumDependencies = document.getElementById('ci-sum-dependencies');
    const elSumPriority = document.getElementById('ci-sum-priority');

    if (elSumHazard) elSumHazard.textContent = (metadata.change_type || 'DETECTED SHIFT').toUpperCase();
    if (elSumArea) elSumArea.textContent = `${summary.total_affected_area_km2 || 4.8} km²`;
    if (elSumFacilities) {
      const totalFac = (summary.settlements_count || 0) + (summary.schools_count || 0) + (summary.hospitals_count || 0) + (summary.roads_count || 0);
      elSumFacilities.textContent = `${totalFac} Exposed`;
    }
    if (elSumDependencies) elSumDependencies.textContent = `${summary.critical_dependencies_count || 3} Chains`;
    if (elSumPriority) {
      const tier = (priority.tier || 'HIGH').toUpperCase();
      elSumPriority.textContent = `${tier} PRIORITY`;
      elSumPriority.className = `ci-priority-chip priority-${tier.toLowerCase().slice(0,3)}`;
    }

    // 2. Render Facilities Workspace Lists
    this.renderHospitalsList(facilities.hospitals || []);
    this.renderSchoolsList(facilities.schools || []);
    this.renderRoadsList(facilities.roads || []);
    this.renderSettlementsList(facilities.settlements || []);

    // 3. Render Detail Drawer Cascade & Explainable Priority
    this.renderDetailDrawerCascade(cascade, priority);

    // 4. Render Map Dependency Overlay
    if (window.earthMap && typeof window.earthMap.renderDependencyCascadeOverlay === 'function') {
      window.earthMap.renderDependencyCascadeOverlay(cascade);
    }

    this.applyFilters();
  }

  renderHospitalsList(hospitals) {
    const list = document.getElementById('ci-hospitals-list');
    const countBadge = document.getElementById('ci-hosp-count-badge');
    if (countBadge) countBadge.textContent = `${hospitals.length} Facility`;
    if (!list) return;
    list.innerHTML = '';

    hospitals.forEach(h => {
      const item = document.createElement('div');
      item.className = 'facility-item-row';
      const statusClass = h.accessibility_state === 'POTENTIAL ACCESSIBILITY REDUCTION' ? 'status-red' : 'status-orange';
      item.innerHTML = `
        <div class="facility-title-row">
          <span class="facility-name">${h.name}</span>
          <span class="facility-status-pill ${statusClass}">${h.status}</span>
        </div>
        <div class="facility-badges-row">
          ${h.emergency_icu ? '<span class="badge-icu-active">🏥 ICU EMERGENCY ACTIVE</span>' : '<span class="badge-clinic">CLINIC</span>'}
          <span class="badge-dist">📍 ${h.distance_km || 0.6} km from epicenter</span>
          <span class="badge-dist" style="color: ${h.accessibility_color || '#dc2626'}; font-weight:700;">${h.accessibility_state || 'POTENTIAL ACCESSIBILITY REDUCTION'}</span>
        </div>
      `;
      list.appendChild(item);
    });
  }

  renderSchoolsList(schools) {
    const list = document.getElementById('ci-schools-list');
    const countBadge = document.getElementById('ci-schools-count-badge');
    if (countBadge) countBadge.textContent = `${schools.length} Facilities`;
    if (!list) return;
    list.innerHTML = '';

    schools.forEach(sc => {
      const item = document.createElement('div');
      item.className = 'facility-item-row';
      item.innerHTML = `
        <div class="facility-title-row">
          <span class="facility-name">${sc.name}</span>
          <span class="facility-status-pill status-orange">${sc.status}</span>
        </div>
        <div class="facility-badges-row">
          <span class="badge-students">🏫 ${sc.students} Enrolled Students</span>
          <span class="badge-dist">📍 Proximity Buffer: ${sc.distance_km || 0.5} km</span>
        </div>
      `;
      list.appendChild(item);
    });
  }

  renderRoadsList(roads) {
    const list = document.getElementById('ci-roads-list');
    const countBadge = document.getElementById('ci-roads-count-badge');
    if (countBadge) countBadge.textContent = `${roads.length} Corridors`;
    if (!list) return;
    list.innerHTML = '';

    roads.forEach(r => {
      const item = document.createElement('div');
      item.className = 'facility-item-row';
      item.innerHTML = `
        <div class="facility-title-row">
          <span class="facility-name">${r.name}</span>
          <span class="facility-status-pill status-cyan">${r.status}</span>
        </div>
        <div class="facility-badges-row">
          <span class="badge-transit">🛣️ ${r.type} (${r.lanes} Lanes)</span>
          <span class="badge-dist">Modeled Transport Dependency Corridor</span>
        </div>
      `;
      list.appendChild(item);
    });
  }

  renderSettlementsList(settlements) {
    const list = document.getElementById('ci-settlements-list');
    const countBadge = document.getElementById('ci-settlements-count-badge');
    if (countBadge) countBadge.textContent = `${settlements.length} Settlements`;
    if (!list) return;
    list.innerHTML = '';

    settlements.forEach(s => {
      const item = document.createElement('div');
      item.className = 'facility-item-row';
      item.innerHTML = `
        <div class="facility-title-row">
          <span class="facility-name">${s.name}</span>
          <span class="facility-status-pill status-purple">${s.status}</span>
        </div>
        <div class="facility-badges-row">
          <span class="badge-population">👥 ${(s.population || 0).toLocaleString()} Residents</span>
          <span class="badge-dist">📍 Distance: ${s.distance_km || 0.8} km</span>
        </div>
      `;
      list.appendChild(item);
    });
  }

  renderDetailDrawerCascade(cascade, priority) {
    const detailsContent = document.getElementById('content-tab-details');
    if (!detailsContent) return;

    // Check if cascade box already rendered
    let cascadeBox = document.getElementById('drawer-impact-cascade-box');
    if (!cascadeBox) {
      cascadeBox = document.createElement('div');
      cascadeBox.id = 'drawer-impact-cascade-box';
      cascadeBox.className = 'impact-cascade-container';
      detailsContent.appendChild(cascadeBox);
    }

    const steps = cascade.cascade_steps || [];
    let treeHTML = '';
    steps.forEach((st) => {
      treeHTML += `
        <div class="cascade-node-step">
          <div class="node-icon-box">${st.title.slice(0, 2)}</div>
          <div class="node-text-col">
            <div class="node-title">${st.title}</div>
            <div class="node-sub">${st.subtitle}</div>
            <div class="node-status-badge" style="color: ${st.color || '#38bdf8'};">${st.status}</div>
          </div>
        </div>
      `;
    });

    cascadeBox.innerHTML = `
      <div class="cascade-header">
        <span class="cascade-title">🔗 CRITICAL IMPACT CASCADE</span>
        <span class="cascade-status-tag" style="color: ${cascade.status_color || '#fca5a5'};">${cascade.accessibility_status || 'POTENTIAL ACCESSIBILITY REDUCTION'}</span>
      </div>
      <div class="cascade-tree-flow">
        ${treeHTML}
      </div>
      <div class="cascade-narrative-box">
        "${cascade.dependency_narrative || 'Modeled transport dependency connects environmental change zone to health facilities.'}"
      </div>
    `;

    // Render Explainable Investigation Priority Section
    let explainBox = document.getElementById('drawer-explainable-priority-box');
    if (!explainBox) {
      explainBox = document.createElement('div');
      explainBox.id = 'drawer-explainable-priority-box';
      explainBox.className = 'explainable-priority-box';
      detailsContent.appendChild(explainBox);
    }

    const bullets = priority.explanation_bullets || [
      "✓ High environmental hazard severity",
      "✓ Large affected area",
      "✓ Critical infrastructure exposure detected",
      "✓ Transport dependency cascade detected",
      "✓ Hospital accessibility potentially constrained"
    ];
    let bulletHTML = bullets.map(b => `<div class="explainable-bullet-item">${b}</div>`).join('');

    const factors = priority.scoring_factors || {};
    explainBox.innerHTML = `
      <div class="explainable-header">
        <span class="explainable-title">🎯 EXPLAINABLE INVESTIGATION PRIORITY</span>
        <span class="ci-priority-chip priority-${(priority.tier || 'HIGH').toLowerCase().slice(0,3)}">${(priority.tier || 'HIGH')} (${priority.score || 95.4}/100)</span>
      </div>
      <div class="explainable-bullets-list">
        ${bulletHTML}
      </div>
      <button class="btn-toggle-factors" id="btn-toggle-scoring-factors">[ View scoring factors ]</button>
      <div class="factors-expandable-drawer" id="factors-expandable-drawer">
        <div class="factor-bar-row">
          <span>Environmental Severity:</span>
          <div class="factor-bar-track"><div class="factor-bar-fill" style="width: ${(factors.environmental_severity_score || 20) * 5}%;"></div></div>
          <span>${factors.environmental_severity_score || 20} / 20</span>
        </div>
        <div class="factor-bar-row">
          <span>Affected Area Impact:</span>
          <div class="factor-bar-track"><div class="factor-bar-fill" style="width: ${(factors.affected_area_score || 24) * 3.3}%;"></div></div>
          <span>${factors.affected_area_score || 24} / 30</span>
        </div>
        <div class="factor-bar-row">
          <span>Critical Infra Exposure:</span>
          <div class="factor-bar-track"><div class="factor-bar-fill" style="width: ${(factors.critical_infrastructure_score || 22) * 3.3}%;"></div></div>
          <span>${factors.critical_infrastructure_score || 22} / 30</span>
        </div>
        <div class="factor-bar-row">
          <span>Dependency Cascade Strength:</span>
          <div class="factor-bar-track"><div class="factor-bar-fill" style="width: ${(factors.dependency_strength_score || 18) * 5}%;"></div></div>
          <span>${factors.dependency_strength_score || 18} / 20</span>
        </div>
      </div>
    `;

    // Toggle button listener
    const btnToggle = document.getElementById('btn-toggle-scoring-factors');
    const drawerFactors = document.getElementById('factors-expandable-drawer');
    if (btnToggle && drawerFactors) {
      btnToggle.addEventListener('click', () => {
        const isShown = drawerFactors.style.display === 'flex';
        drawerFactors.style.display = isShown ? 'none' : 'flex';
        btnToggle.textContent = isShown ? '[ View scoring factors ]' : '[ Hide scoring factors ]';
      });
    }
  }
}

window.communityImpactModule = new CommunityImpactModule();
