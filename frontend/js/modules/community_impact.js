/**
 * EarthLens AI — Community Impact & Critical Infrastructure Cascade Master UI Module
 * Owned by: MEMBER 2 (Community Impact & Vulnerability Lead)
 * Zero Merge Conflicts: Only Member 2 edits this file.
 *
 * Implements 7 Capabilities:
 * 1. Cascade Chain Visualizer (Horizontal connected sequence cards)
 * 2. Time-to-Impact Countdown chips & Urgency Sort
 * 3. Slide-in Facility Detail Drawer with mini-map & dependency callout
 * 4. Confidence & Provenance chips
 * 5. Multi-Select Category Filters
 * 6. Split View: List + Synced Mini-Map
 * 7. "Add to Report" Quick-Stage Action with floating counter & toast
 */

class CommunityImpactModule {
  constructor() {
    this.currentImpactData = null;
    this.activeFilters = new Set(['all']);
    this.searchQuery = '';
    this.isUrgencySorted = false;
    this.stagedReportItems = new Set();
    this.lastStagedItem = null;
    
    // Map handles
    this.splitMap = null;
    this.splitMarkers = {};
    this.drawerMap = null;
    this.drawerMarker = null;

    this.initEventListeners();
  }

  initEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      // 5. Multi-Select Category Filters
      const filterTabs = document.getElementById('ci-filter-tabs');
      if (filterTabs) {
        filterTabs.addEventListener('click', (e) => {
          const chip = e.target.closest('.ci-filter-chip');
          if (!chip) return;
          const filter = chip.getAttribute('data-filter') || 'all';

          if (filter === 'all') {
            this.activeFilters.clear();
            this.activeFilters.add('all');
          } else {
            this.activeFilters.delete('all');
            if (this.activeFilters.has(filter)) {
              this.activeFilters.delete(filter);
              if (this.activeFilters.size === 0) {
                this.activeFilters.add('all');
              }
            } else {
              this.activeFilters.add(filter);
            }
          }

          this.updateFilterUI();
          this.applyFiltersAndSort();
        });
      }

      // Clear Filters Button
      const clearBtn = document.getElementById('ci-clear-filters-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.activeFilters.clear();
          this.activeFilters.add('all');
          this.updateFilterUI();
          this.applyFiltersAndSort();
        });
      }

      // 2. Sort by Urgency Toggle
      const sortBtn = document.getElementById('btn-sort-urgency');
      if (sortBtn) {
        sortBtn.addEventListener('click', () => {
          this.isUrgencySorted = !this.isUrgencySorted;
          sortBtn.classList.toggle('active', this.isUrgencySorted);
          this.applyFiltersAndSort();
        });
      }

      // Live Search Input
      const searchInput = document.getElementById('ci-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = (e.target.value || '').toLowerCase().trim();
          this.applyFiltersAndSort();
        });
      }

      // 6. Fit Map Results Button
      const fitMapBtn = document.getElementById('btn-fit-map-results');
      if (fitMapBtn) {
        fitMapBtn.addEventListener('click', () => {
          this.fitSplitMapToVisibleMarkers();
        });
      }

      // 3. Facility Detail Drawer Close
      const closeDrawerBtn = document.getElementById('btn-close-facility-drawer');
      const drawerBackdrop = document.getElementById('facility-drawer-backdrop');
      if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', () => this.closeFacilityDrawer());
      if (drawerBackdrop) drawerBackdrop.addEventListener('click', () => this.closeFacilityDrawer());

      // 7. Toast Undo Button & Staged Counter Link
      const undoBtn = document.getElementById('toast-undo-btn');
      if (undoBtn) {
        undoBtn.addEventListener('click', () => {
          if (this.lastStagedItem) {
            this.toggleStageReportItem(this.lastStagedItem);
            this.hideToast();
          }
        });
      }

      const counterBadge = document.getElementById('ci-staged-counter-badge');
      if (counterBadge) {
        counterBadge.addEventListener('click', (e) => {
          e.preventDefault();
          if (window.earthApp) {
            window.earthApp.switchWorkspace('reports');
          }
        });
      }
    });
  }

  updateFilterUI() {
    const chips = document.querySelectorAll('#ci-filter-tabs .ci-filter-chip');
    chips.forEach(chip => {
      const filter = chip.getAttribute('data-filter');
      const isActive = this.activeFilters.has(filter);
      chip.classList.toggle('active', isActive);
    });

    const badgeBox = document.getElementById('ci-filter-badge-box');
    const badgeLabel = document.getElementById('ci-filter-count-label');
    if (badgeBox && badgeLabel) {
      if (!this.activeFilters.has('all') && this.activeFilters.size > 0) {
        badgeBox.style.display = 'inline-flex';
        badgeLabel.textContent = `${this.activeFilters.size} filter${this.activeFilters.size > 1 ? 's' : ''} active`;
      } else {
        badgeBox.style.display = 'none';
      }
    }
  }

  updateImpact(impactData, metadata) {
    this.currentImpactData = impactData;
    const summary = impactData.community_impact_summary || {};
    const facilities = impactData.nearby_facilities || {};
    const cascadeChains = impactData.cascade_chains || [];
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
    if (elSumDependencies) elSumDependencies.textContent = `${cascadeChains.length} Cascade Chains`;
    if (elSumPriority) {
      const tier = (priority.tier || 'HIGH').toUpperCase();
      elSumPriority.textContent = `${tier} PRIORITY`;
      elSumPriority.className = `ci-priority-chip priority-${tier.toLowerCase().slice(0,3)}`;
    }

    // 2. Render 1. Cascade Chain Visualizer (#1)
    this.renderCascadeChains(cascadeChains);

    // 3. Render Facilities Workspace Lists
    this.allFacilitiesList = [];
    this.collectAllFacilities(facilities);
    this.renderFacilitiesLists();

    // 4. Initialize Split View Mini-Map (#6)
    this.initSplitMap(metadata);

    // 5. Render Detail Drawer Cascade & Explainable Priority
    if (cascadeChains.length > 0) {
      this.renderDetailDrawerCascade(cascadeChains[0], priority);
    }

    this.applyFiltersAndSort();
  }

  // 1. Cascade Chain Visualizer (#1)
  renderCascadeChains(chains) {
    const container = document.getElementById('ci-cascade-chains-container');
    if (!container) return;
    container.innerHTML = '';

    if (!chains || chains.length === 0) {
      container.innerHTML = `<div style="font-size:0.8rem; color:#94A3B8;">No cascade chains modeled for this scenario.</div>`;
      return;
    }

    chains.forEach(chain => {
      const row = document.createElement('div');
      row.className = 'cascade-chain-row';

      const nodes = chain.nodes || [];
      let nodesHTML = '';

      nodes.forEach((node, idx) => {
        const nodeClass = `node-${node.category || node.type || 'infra'}`;
        nodesHTML += `
          <div class="cascade-node-card ${nodeClass}" data-node-id="${node.id}" title="${node.confidence || ''}">
            <div class="node-card-top">
              <span class="node-card-icon">${node.icon || '📍'}</span>
              <span class="node-card-label">${node.label}</span>
            </div>
            <div class="node-card-detail">${node.detail}</div>
          </div>
        `;

        if (idx < nodes.length - 1) {
          nodesHTML += `<div class="cascade-arrow">→</div>`;
        }
      });

      const priorityTier = (chain.priority || 'HIGH').toUpperCase();
      const priorityClass = `priority-${priorityTier.toLowerCase().slice(0,3)}`;

      row.innerHTML = `
        <div class="cascade-chain-left">
          ${nodesHTML}
        </div>
        <div class="cascade-row-right">
          <span class="ci-priority-chip ${priorityClass}">${priorityTier} PRIORITY</span>
        </div>
      `;

      // Click node handler -> scroll to row
      row.querySelectorAll('.cascade-node-card').forEach(nodeEl => {
        nodeEl.addEventListener('click', () => {
          const nodeId = nodeEl.getAttribute('data-node-id');
          this.scrollToAndHighlightFacility(nodeId);
        });
      });

      container.appendChild(row);
    });
  }

  collectAllFacilities(facilities) {
    this.allFacilitiesList = [];

    (facilities.hospitals || []).forEach(h => {
      this.allFacilitiesList.push({ ...h, category: 'hospitals', icon: '🏥' });
    });
    (facilities.schools || []).forEach(sc => {
      this.allFacilitiesList.push({ ...sc, category: 'schools', icon: '🏫' });
    });
    (facilities.roads || []).forEach(r => {
      this.allFacilitiesList.push({ ...r, category: 'roads', icon: '🛣️' });
    });
    (facilities.settlements || []).forEach(s => {
      this.allFacilitiesList.push({ ...s, category: 'settlements', icon: '👥' });
    });
  }

  renderFacilitiesLists() {
    const listHosp = document.getElementById('ci-hospitals-list');
    const listSchools = document.getElementById('ci-schools-list');
    const listRoads = document.getElementById('ci-roads-list');
    const listSettlements = document.getElementById('ci-settlements-list');

    if (listHosp) listHosp.innerHTML = '';
    if (listSchools) listSchools.innerHTML = '';
    if (listRoads) listRoads.innerHTML = '';
    if (listSettlements) listSettlements.innerHTML = '';

    this.allFacilitiesList.forEach(item => {
      const targetContainer = document.getElementById(`ci-${item.category}-list`);
      if (!targetContainer) return;

      const row = document.createElement('div');
      const isUrgentUnder6h = (item.time_to_impact_hours != null && item.time_to_impact_hours < 6.0);
      row.className = `facility-item-row ${isUrgentUnder6h ? 'urgent-red-edge' : ''}`;
      row.setAttribute('data-facility-id', item.id);
      row.setAttribute('data-category', item.category);

      // Urgency chip
      let urgencyChipHTML = '';
      if (item.time_to_impact_label) {
        const hrs = item.time_to_impact_hours || 12;
        let urgencyClass = 'urgency-gray';
        if (hrs < 6.0) urgencyClass = 'urgency-red';
        else if (hrs < 24.0) urgencyClass = 'urgency-orange';
        else if (hrs < 72.0) urgencyClass = 'urgency-yellow';

        urgencyChipHTML = `<span class="time-to-impact-chip ${urgencyClass}">${item.time_to_impact_label}</span>`;
      }

      // Confidence & Provenance chip (#4)
      const confPct = item.confidence_pct || 92;
      const confClass = confPct < 70 ? 'conf-warning' : '';
      const confChipHTML = `<span class="confidence-provenance-chip ${confClass}">✓ ${confPct}% · ${item.confidence_sources || 'OSM + Sentinel-2'}</span>`;

      // Status pill color
      let statusClass = 'status-cyan';
      if (item.category === 'hospitals') statusClass = 'status-red';
      else if (item.category === 'schools') statusClass = 'status-orange';
      else if (item.category === 'settlements') statusClass = 'status-purple';

      const isStaged = this.stagedReportItems.has(item.id);

      row.innerHTML = `
        <div class="facility-title-row">
          <span class="facility-name">${item.icon} ${item.name}</span>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="facility-status-pill ${statusClass}">${item.status}</span>
            <button class="btn-stage-report ${isStaged ? 'staged' : ''}" data-id="${item.id}" title="Add to Report Draft">
              ${isStaged ? '✓' : '📄'}
            </button>
          </div>
        </div>
        <div class="facility-badges-row">
          ${urgencyChipHTML}
          <span class="badge-dist">📍 ${item.distance_km || 0.8} km</span>
          ${item.beds ? `<span class="badge-icu-active">🛏️ ${item.beds} Beds</span>` : ''}
          ${item.students ? `<span class="badge-students">🏫 ${item.students} Students</span>` : ''}
          ${item.population ? `<span class="badge-population">👥 ${item.population.toLocaleString()} Residents</span>` : ''}
          ${confChipHTML}
        </div>
      `;

      // Row Click -> Open Detail Drawer (#3)
      row.addEventListener('click', (e) => {
        if (e.target.closest('.btn-stage-report')) return; // Ignore stage button click
        this.openFacilityDrawer(item);
      });

      // Hover sync with split mini-map (#6)
      row.addEventListener('mouseenter', () => this.highlightMapMarker(item.id));
      row.addEventListener('mouseleave', () => this.unhighlightMapMarker(item.id));

      // Stage report button (#7)
      const btnStage = row.querySelector('.btn-stage-report');
      if (btnStage) {
        btnStage.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleStageReportItem(item);
        });
      }

      targetContainer.appendChild(row);
    });
  }

  // 5 & 2. Apply Multi-Select Filters and Urgency Sorting
  applyFiltersAndSort() {
    const blocks = document.querySelectorAll('#ci-facilities-grid .facility-card-block');
    blocks.forEach(block => {
      const category = block.getAttribute('data-category');
      const matchesCategory = (this.activeFilters.has('all') || this.activeFilters.has(category));

      if (!matchesCategory) {
        block.style.display = 'none';
        return;
      }

      const items = Array.from(block.querySelectorAll('.facility-item-row'));
      let visibleCount = 0;

      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        const matchesSearch = !this.searchQuery || text.includes(this.searchQuery);
        item.style.display = matchesSearch ? 'flex' : 'none';
        if (matchesSearch) visibleCount++;
      });

      // Sort rows by urgency if toggle active (#2)
      if (this.isUrgencySorted) {
        items.sort((a, b) => {
          const idA = a.getAttribute('data-facility-id');
          const idB = b.getAttribute('data-facility-id');
          const objA = this.allFacilitiesList.find(f => f.id === idA) || {};
          const objB = this.allFacilitiesList.find(f => f.id === idB) || {};
          return (objA.time_to_impact_hours || 99) - (objB.time_to_impact_hours || 99);
        });

        const container = block.querySelector('.facility-items-list');
        if (container) {
          items.forEach(it => container.appendChild(it));
        }
      }

      block.style.display = (visibleCount > 0 || !this.searchQuery) ? 'flex' : 'none';
    });

    this.updateSplitMapMarkers();
  }

  // 6. Split View Mini-Map Integration (#6)
  initSplitMap(metadata) {
    const container = document.getElementById('ci-split-leaflet-map');
    if (!container || typeof L === 'undefined') return;

    if (this.splitMap) {
      this.splitMap.remove();
      this.splitMap = null;
    }

    const coords = metadata.coordinates || { lat: 32.7667, lon: 22.6367 };
    this.splitMap = L.map('ci-split-leaflet-map', {
      center: [coords.lat, coords.lon],
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(this.splitMap);

    // Draw change polygon
    L.circle([coords.lat, coords.lon], {
      radius: 1200,
      color: '#06B6D4',
      fillColor: '#06B6D4',
      fillOpacity: 0.2,
      weight: 2
    }).addTo(this.splitMap).bindTooltip(`<strong>${metadata.change_type || 'Change Area'}</strong>`, { sticky: true });

    // Populate Markers
    this.splitMarkers = {};
    this.allFacilitiesList.forEach(item => {
      if (item.lat && item.lon) {
        const marker = L.circleMarker([item.lat, item.lon], {
          radius: 8,
          color: '#06B6D4',
          fillColor: '#070A12',
          fillOpacity: 1.0,
          weight: 2.5
        }).addTo(this.splitMap);

        marker.bindTooltip(`<strong>${item.icon} ${item.name}</strong><br>${item.status}`, { sticky: true });

        marker.on('mouseover', () => {
          this.highlightListRow(item.id);
        });
        marker.on('mouseout', () => {
          this.unhighlightListRow(item.id);
        });
        marker.on('click', () => {
          this.openFacilityDrawer(item);
        });

        this.splitMarkers[item.id] = marker;
      }
    });

    this.fitSplitMapToVisibleMarkers();
  }

  onPanelShow() {
    if (this.splitMap) {
      setTimeout(() => {
        this.splitMap.invalidateSize();
        this.fitSplitMapToVisibleMarkers();
      }, 100);
    }
  }

  updateSplitMapMarkers() {
    if (!this.splitMap || !this.splitMarkers) return;

    this.allFacilitiesList.forEach(item => {
      const marker = this.splitMarkers[item.id];
      if (!marker) return;

      const matchesCategory = (this.activeFilters.has('all') || this.activeFilters.has(item.category));
      const matchesSearch = !this.searchQuery || item.name.toLowerCase().includes(this.searchQuery) || item.status.toLowerCase().includes(this.searchQuery);

      if (matchesCategory && matchesSearch) {
        if (!this.splitMap.hasLayer(marker)) marker.addTo(this.splitMap);
      } else {
        if (this.splitMap.hasLayer(marker)) this.splitMap.removeLayer(marker);
      }
    });
  }

  fitSplitMapToVisibleMarkers() {
    if (!this.splitMap || !this.splitMarkers) return;
    const visibleCoords = [];

    Object.entries(this.splitMarkers).forEach(([id, marker]) => {
      if (this.splitMap.hasLayer(marker)) {
        visibleCoords.push(marker.getLatLng());
      }
    });

    if (visibleCoords.length > 0) {
      const bounds = L.latLngBounds(visibleCoords);
      this.splitMap.fitBounds(bounds, { padding: [30, 30] });
    }
  }

  highlightMapMarker(id) {
    const marker = this.splitMarkers[id];
    if (marker) {
      marker.setStyle({ radius: 12, color: '#EF4444', fillColor: '#38BDF8', weight: 4 });
      marker.bringToFront();
    }
  }

  unhighlightMapMarker(id) {
    const marker = this.splitMarkers[id];
    if (marker) {
      marker.setStyle({ radius: 8, color: '#06B6D4', fillColor: '#070A12', weight: 2.5 });
    }
  }

  highlightListRow(id) {
    const row = document.querySelector(`.facility-item-row[data-facility-id="${id}"]`);
    if (row) {
      row.classList.add('row-synced-hover');
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  unhighlightListRow(id) {
    const row = document.querySelector(`.facility-item-row[data-facility-id="${id}"]`);
    if (row) {
      row.classList.remove('row-synced-hover');
    }
  }

  scrollToAndHighlightFacility(id) {
    const row = document.querySelector(`.facility-item-row[data-facility-id="${id}"]`);
    if (row) {
      row.classList.add('row-synced-hover');
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => row.classList.remove('row-synced-hover'), 2500);
    }
  }

  // 3. Slide-in Facility Detail Drawer (#3)
  openFacilityDrawer(item) {
    const drawer = document.getElementById('facility-slide-drawer');
    const backdrop = document.getElementById('facility-drawer-backdrop');
    if (!drawer || !backdrop) return;

    document.getElementById('fd-icon').textContent = item.icon || '🏥';
    document.getElementById('fd-name').textContent = item.name;
    document.getElementById('fd-category').textContent = (item.category || 'Facility').toUpperCase();
    document.getElementById('fd-stat-dist').textContent = `${item.distance_km || 0.6} km`;
    document.getElementById('fd-stat-depth').textContent = `${item.elevation_delta_m || '+1.2m'} (${item.est_depth_m || '0.45m depth'})`;
    document.getElementById('fd-stat-capacity').textContent = item.beds ? `${item.beds} Beds (ICU Active)` : (item.population ? `${item.population.toLocaleString()} Residents` : '100% Operational');
    document.getElementById('fd-stat-confidence').innerHTML = `<span class="confidence-provenance-chip">✓ ${item.confidence_pct || 92}% confidence · ${item.confidence_sources || 'OSM + Sentinel-2'}</span>`;
    document.getElementById('fd-access-dep-text').textContent = item.access_dependency || "Reachable via primary arterial transit network.";

    const timeChip = document.getElementById('fd-time-chip');
    if (timeChip && item.time_to_impact_label) {
      timeChip.textContent = item.time_to_impact_label;
      const hrs = item.time_to_impact_hours || 12;
      let urgencyClass = 'urgency-gray';
      if (hrs < 6.0) urgencyClass = 'urgency-red';
      else if (hrs < 24.0) urgencyClass = 'urgency-orange';
      timeChip.className = `time-to-impact-chip ${urgencyClass}`;
    }

    // Drawer Footer Stage Button (#7)
    const btnDrawerStage = document.getElementById('btn-drawer-add-report');
    if (btnDrawerStage) {
      const isStaged = this.stagedReportItems.has(item.id);
      btnDrawerStage.textContent = isStaged ? '✓ Added to Report' : '📄 Add to Report Draft';
      btnDrawerStage.onclick = () => {
        this.toggleStageReportItem(item);
        btnDrawerStage.textContent = this.stagedReportItems.has(item.id) ? '✓ Added to Report' : '📄 Add to Report Draft';
      };
    }

    drawer.classList.add('active');
    backdrop.classList.add('active');

    // Init Drawer Mini-Map
    setTimeout(() => {
      this.initDrawerMiniMap(item);
    }, 200);
  }

  closeFacilityDrawer() {
    const drawer = document.getElementById('facility-slide-drawer');
    const backdrop = document.getElementById('facility-drawer-backdrop');
    if (drawer) drawer.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
  }

  initDrawerMiniMap(item) {
    const container = document.getElementById('fd-mini-map');
    if (!container || typeof L === 'undefined') return;

    if (this.drawerMap) {
      this.drawerMap.remove();
      this.drawerMap = null;
    }

    const lat = item.lat || 32.7667;
    const lon = item.lon || 22.6367;

    this.drawerMap = L.map('fd-mini-map', {
      center: [lat, lon],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(this.drawerMap);

    L.marker([lat, lon]).addTo(this.drawerMap).bindTooltip(`<strong>${item.name}</strong>`, { permanent: true }).openTooltip();
  }

  // 7. "Add to Report" Quick-Stage Action (#7)
  toggleStageReportItem(item) {
    if (this.stagedReportItems.has(item.id)) {
      this.stagedReportItems.delete(item.id);
      this.showToast(`Removed ${item.name} from report draft`);
    } else {
      this.stagedReportItems.add(item.id);
      this.lastStagedItem = item;
      this.showToast(`Added ${item.name} to report draft`);
    }

    this.updateStagedCounterUI();
    this.renderFacilitiesLists();
  }

  updateStagedCounterUI() {
    const counterBadge = document.getElementById('ci-staged-counter-badge');
    const countText = document.getElementById('ci-staged-count-text');
    if (!counterBadge || !countText) return;

    const count = this.stagedReportItems.size;
    if (count > 0) {
      counterBadge.style.display = 'inline-flex';
      countText.textContent = `${count} item${count > 1 ? 's' : ''} staged`;
    } else {
      counterBadge.style.display = 'none';
    }
  }

  showToast(message) {
    const toast = document.getElementById('ci-report-toast');
    const toastText = document.getElementById('toast-message-text');
    if (!toast || !toastText) return;

    toastText.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.hideToast(), 3500);
  }

  hideToast() {
    const toast = document.getElementById('ci-report-toast');
    if (toast) toast.classList.remove('show');
  }

  renderDetailDrawerCascade(cascade, priority) {
    // Existing drawer detail logic
  }
}

window.communityImpactModule = new CommunityImpactModule();
