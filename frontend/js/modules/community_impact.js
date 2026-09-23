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
    this.allFacilitiesList = [];
    
    // Map handles
    this.splitMap = null;
    this.splitMarkers = {};
    this.drawerMap = null;
    this.drawerMarker = null;

    this.initEventListeners();

    // Load default rich dataset immediately to prevent empty states
    const defaultData = this.getDefaultImpactData();
    const defaultMeta = { change_type: 'Flood Inundation', location: 'Derna Coastal District, Libya' };
    this.updateImpact(defaultData, defaultMeta);
  }

  getDefaultImpactData() {
    return {
      community_impact_summary: {
        total_affected_area_km2: 4.8,
        settlements_count: 3,
        schools_count: 2,
        hospitals_count: 2,
        roads_count: 2,
        water_count: 1,
        agri_count: 1
      },
      investigation_priority: {
        tier: 'HIGH',
        score: 92,
        factors: ['Critical ICU access risk', 'Single bridge choke point', '3 downstream settlements exposed']
      },
      cascade_chains: [
        {
          id: 'chain-hospitals',
          category: 'hospitals',
          title: 'Healthcare Emergency Cascade',
          priority: 'HIGH',
          nodes: [
            { id: 'c1-1', category: 'water', icon: '🌊', label: 'Flood Surge', detail: 'Wadi Derna Inundation', confidence: '96% · Sentinel-2' },
            { id: 'b1', category: 'transit', icon: '🌉', label: 'Bridge 2 Cut', detail: 'Overtopped (choke point)', confidence: '97% · OSM' },
            { id: 'r1', category: 'transit', icon: '🛣️', label: 'Highway N-7 Submerged', detail: 'Ambulance detour +18 min', confidence: '96% · OSM' },
            { id: 'h1', category: 'hospitals', icon: '🏥', label: 'Al-Jala Hospital', detail: 'Substation #4 engaged (12h diesel)', confidence: '95% · OSM + Sentinel-2' },
            { id: 'h2', category: 'human', icon: '👥', label: 'ICU Capacity Shift', detail: 'Regional transfer to Tobruk', confidence: '92% · Model' }
          ]
        },
        {
          id: 'chain-schools',
          category: 'schools',
          title: 'Education & Emergency Shelter Cascade',
          priority: 'MODERATE',
          nodes: [
            { id: 'c2-1', category: 'water', icon: '🌊', label: 'Wadi Overflow', detail: 'Perimeter expansion 300m', confidence: '94% · Sentinel-1 SAR' },
            { id: 'sc1', category: 'schools', icon: '🏫', label: 'Al-Wahda Academy', detail: 'Inundated (Classes suspended)', confidence: '93% · OSM' },
            { id: 'sc2', category: 'schools', icon: '🏫', label: 'Evacuation Center', detail: 'Gymnasium shelter conversion', confidence: '90% · Field Data' }
          ]
        },
        {
          id: 'chain-transit',
          category: 'transit',
          title: 'Arterial Transit & Logistics Cascade',
          priority: 'HIGH',
          nodes: [
            { id: 'c3-1', category: 'water', icon: '🌊', label: 'Flash Runoff', detail: 'Velocity surge 2.4 m/s', confidence: '95% · DEM' },
            { id: 'r2', category: 'transit', icon: '🛣️', label: 'Wadi Transit Link', detail: '1.4m wash out depth', confidence: '94% · Sentinel-2' },
            { id: 'r3', category: 'infra', icon: '🚚', label: 'Port Supply Cut', detail: 'Heavy freight detour +42km', confidence: '91% · Model' }
          ]
        },
        {
          id: 'chain-water',
          category: 'water',
          title: 'Clean Water & Sanitation Cascade',
          priority: 'CRITICAL',
          nodes: [
            { id: 'c4-1', category: 'water', icon: '🌊', label: 'Reservoir Surge', detail: 'Upstream breach risk', confidence: '97% · Sentinel-2' },
            { id: 'w1', category: 'water', icon: '💧', label: 'Pumping Station #2', detail: 'Submerged (Substation tripmode)', confidence: '95% · OSM' },
            { id: 's1', category: 'human', icon: '🚰', label: 'Municipal Water Cut', detail: '28.4k residents on tanker protocol', confidence: '93% · Model' }
          ]
        }
      ],
      nearby_facilities: {
        hospitals: [
          {
            id: 'h1',
            name: 'Al-Jala Emergency & Trauma Hospital',
            category: 'hospitals',
            icon: '🏥',
            beds: 160,
            lat: 32.7672,
            lon: 22.6342,
            distance_km: 0.45,
            status: 'POTENTIAL ACCESSIBILITY IMPACT',
            time_to_impact_hours: 4.5,
            time_to_impact_label: '⏱ Est. 4–6 hrs to access loss',
            confidence_pct: 95,
            confidence_sources: 'OSM + Sentinel-2 + HDX',
            access_dependency: 'Reachable only via Central Bridge 2 — single bridge choke point at high risk.',
            elevation_delta_m: '+1.2m',
            est_depth_m: '0.45m depth',
            subsequent_changes: [
              '⚡ Power Grid: Emergency Substation 4 tripped → Backup diesel generator engaged (12h fuel supply)',
              '⚡ Transit Logistics: Primary ambulance access cut → Detour via Secondary Arterial (+18 min)',
              '⚡ Regional Capacity: Secondary trauma triage transferred to Tobruk Regional Hospital'
            ]
          },
          {
            id: 'h2',
            name: 'Derna Specialty Health Center',
            category: 'hospitals',
            icon: '🏥',
            beds: 65,
            lat: 32.7631,
            lon: 22.6398,
            distance_km: 0.78,
            status: 'MONITORING — PERIMETER RUNOFF',
            time_to_impact_hours: 14.0,
            time_to_impact_label: '⏱ Est. 12–16 hrs watch',
            confidence_pct: 91,
            confidence_sources: 'OSM + Copernicus DEM',
            access_dependency: 'Feeder road access constrained by wadi runoff channel.',
            elevation_delta_m: '+2.8m',
            est_depth_m: '0.15m depth',
            subsequent_changes: [
              '⚡ Cold-Chain Storage: Vaccines moved to battery-backed emergency refrigeration',
              '⚡ Patient Routing: Outpatient consultations rerouted to South Ward Clinic'
            ]
          }
        ],
        schools: [
          {
            id: 'sc1',
            name: 'Al-Wahda Primary Academy',
            category: 'schools',
            icon: '🏫',
            students: 620,
            lat: 32.7685,
            lon: 22.6321,
            distance_km: 0.35,
            status: 'POTENTIALLY AFFECTED — INUNDATED PERIMETER',
            time_to_impact_hours: 3.5,
            time_to_impact_label: '⏱ Est. 3–5 hrs perimeter reach',
            confidence_pct: 93,
            confidence_sources: 'OSM + Sentinel-2',
            access_dependency: 'Primary school access link intersects wadi catchment boundary.',
            elevation_delta_m: '+0.8m',
            est_depth_m: '0.60m depth',
            subsequent_changes: [
              '⚡ Academic Closure: Classes suspended; facility converted to Emergency Evacuation Stage',
              '⚡ Bus Transport: Bus routes N-1 through N-4 diverted to High-Ground staging'
            ]
          },
          {
            id: 'sc2',
            name: 'Derna Central Secondary Boys High School',
            category: 'schools',
            icon: '🏫',
            students: 840,
            lat: 32.7612,
            lon: 22.6415,
            distance_km: 0.62,
            status: 'EVACUATION STAGING CENTER',
            time_to_impact_hours: 18.0,
            time_to_impact_label: '⏱ Est. 18–24 hrs monitoring',
            confidence_pct: 89,
            confidence_sources: 'OSM',
            access_dependency: 'Feeder street access constrained by wadi runoff.',
            elevation_delta_m: '+3.1m',
            est_depth_m: '0.10m depth',
            subsequent_changes: [
              '⚡ Humanitarian Relief: Gymnasium staged for emergency food package distribution (2,500 rations)'
            ]
          }
        ],
        roads: [
          {
            id: 'r1',
            name: 'Coastal Arterial Highway N-7',
            category: 'roads',
            icon: '🛣️',
            type: 'National Highway (4 Lanes)',
            lat: 32.7691,
            lon: 22.6385,
            distance_km: 0.25,
            status: 'POTENTIALLY SUBMERGED',
            time_to_impact_hours: 2.0,
            time_to_impact_label: '⏱ Est. 2–3 hrs submergence',
            confidence_pct: 97,
            confidence_sources: 'OSM + Sentinel-2',
            access_dependency: 'Primary arterial highway linking eastern coastal ports to city center.',
            elevation_delta_m: '+0.3m',
            est_depth_m: '1.10m depth',
            subsequent_changes: [
              '⚡ Supply Route Severed: Commercial cargo transit delayed 6+ hours',
              '⚡ Emergency Logistics: Heavy vehicles rerouted via Southern Bypass +14km detour'
            ]
          },
          {
            id: 'r2',
            name: 'Wadi Derna Central Transit Bridge 2',
            category: 'roads',
            icon: '🌉',
            type: 'Bridge (4 Lanes)',
            lat: 32.7661,
            lon: 22.6351,
            distance_km: 0.18,
            status: 'STRUCTURAL SURGE RISK',
            time_to_impact_hours: 1.5,
            time_to_impact_label: '⏱ Est. 1–2 hrs overtopping',
            confidence_pct: 98,
            confidence_sources: 'OSM + Sentinel-1 SAR',
            access_dependency: 'Single-point-of-failure bridge connecting northern wards to hospital.',
            elevation_delta_m: '+0.1m',
            est_depth_m: '1.45m depth',
            subsequent_changes: [
              '⚡ City Isolation: North-South city traffic severed',
              '⚡ Pedestrian Access: Structural inspection team deployed for bridge stability monitor'
            ]
          }
        ],
        settlements: [
          {
            id: 's1',
            name: 'Al-Bilad Central Residential Ward',
            category: 'settlements',
            icon: '👥',
            population: 28400,
            lat: 32.7695,
            lon: 22.6335,
            distance_km: 0.40,
            status: 'HIGH VULNERABILITY INUNDATION ZONE',
            time_to_impact_hours: 4.0,
            time_to_impact_label: '⏱ Est. 4–6 hrs access loss',
            confidence_pct: 94,
            confidence_sources: 'OSM + Sentinel-2',
            access_dependency: 'Reachable only via Bridge 2; dense multi-family residential structures.',
            elevation_delta_m: '+1.2m',
            est_depth_m: '0.85m depth',
            subsequent_changes: [
              '⚡ Evacuation Demand: 4,200 households in Immediate High-Risk Zone',
              '⚡ Grid Shutdown: Power sector 4 isolated to prevent electrical short-circuit hazard',
              '⚡ Drinking Water: Water main pressure drop requires emergency tanker delivery'
            ]
          },
          {
            id: 's2',
            name: 'Al-Makarim Neighborhood',
            category: 'settlements',
            icon: '👥',
            population: 14200,
            lat: 32.7618,
            lon: 22.6410,
            distance_km: 0.70,
            status: 'EVACUATION ROUTE COMPROMISED',
            time_to_impact_hours: 10.0,
            time_to_impact_label: '⏱ Est. 10–14 hrs route cut',
            confidence_pct: 91,
            confidence_sources: 'OSM + Sentinel-1 SAR',
            access_dependency: 'Evacuation corridor depends on Al-Bilad Avenue feeder road.',
            elevation_delta_m: '+2.4m',
            est_depth_m: '0.35m depth',
            subsequent_changes: [
              '⚡ Secondary Evacuation: Families directed to East Ridge High Ground',
              '⚡ Communication: Cell tower B-2 switching to solar battery backup'
            ]
          },
          {
            id: 's3',
            name: 'Wadi Coastal District Wards',
            category: 'settlements',
            icon: '👥',
            population: 9800,
            lat: 32.7745,
            lon: 22.6358,
            distance_km: 0.90,
            status: 'FLASH SURGE BUFFER WATCH',
            time_to_impact_hours: 36.0,
            time_to_impact_label: '⏱ Est. 24–48 hrs monitoring',
            confidence_pct: 88,
            confidence_sources: 'Copernicus DEM',
            access_dependency: 'Coastal high ground — secondary surge watch active.',
            elevation_delta_m: '+4.1m',
            est_depth_m: '0.10m depth',
            subsequent_changes: [
              '⚡ Coastal Buffer: Storm drain channels cleared to prevent localized back-pooling'
            ]
          }
        ],
        water: [
          {
            id: 'w1',
            name: 'Derna Municipal Pumping Station #2',
            category: 'water',
            icon: '💧',
            type: 'Clean Water Distribution Plant',
            lat: 32.7655,
            lon: 22.6328,
            distance_km: 0.30,
            status: 'POTENTIALLY SUBMERGED — INUNDATION CHANNEL',
            time_to_impact_hours: 2.8,
            time_to_impact_label: '⏱ Est. 2–4 hrs plant submergence',
            confidence_pct: 95,
            confidence_sources: 'OSM + Sentinel-2',
            access_dependency: 'Located directly inside lower wadi flood plain.',
            elevation_delta_m: '+0.4m',
            est_depth_m: '1.20m depth',
            subsequent_changes: [
              '⚡ Water Supply Cut: Supply pressure dropped 65% across 28,400 residents in Al-Bilad',
              '⚡ Sanitation Hazard: Flooding around pump intake triggers municipal boil-water advisory'
            ]
          }
        ],
        agri: [
          {
            id: 'ag1',
            name: 'Wadi Delta Date Palm & Crop Zone',
            category: 'agri',
            icon: '🌾',
            type: 'Agricultural Topsoil Zone (45 ha)',
            lat: 32.7715,
            lon: 22.6388,
            distance_km: 0.85,
            status: 'SOIL EROSION & INUNDATION RISK',
            time_to_impact_hours: 8.0,
            time_to_impact_label: '⏱ Est. 8–12 hrs topsoil erosion',
            confidence_pct: 92,
            confidence_sources: 'Sentinel-2 NDVI differencing',
            access_dependency: 'Adjacent to lower wadi agricultural runoff channel.',
            elevation_delta_m: '+0.6m',
            est_depth_m: '0.40m depth',
            subsequent_changes: [
              '⚡ Agricultural Loss: Severe topsoil erosion across 45 hectares of active cropland',
              '⚡ Economic Impact: Local farmer co-operative yield reduction estimated at 35%'
            ]
          }
        ]
      }
    };
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
    if (!impactData || Object.keys(impactData).length === 0) {
      impactData = this.getDefaultImpactData();
    }
    this.currentImpactData = impactData;
    metadata = metadata || { change_type: 'Flood Inundation', location: 'Derna Coastal District' };

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
      const totalFac = (summary.settlements_count || 3) + (summary.schools_count || 2) + (summary.hospitals_count || 2) + (summary.roads_count || 2) + (summary.water_count || 1) + (summary.agri_count || 1);
      elSumFacilities.textContent = `${totalFac} Exposed`;
    }
    if (elSumDependencies) elSumDependencies.textContent = `${cascadeChains.length} Cascade Chains`;
    if (elSumPriority) {
      const tier = (priority.tier || 'HIGH').toUpperCase();
      elSumPriority.textContent = `${tier} PRIORITY`;
      elSumPriority.className = `ci-priority-chip priority-${tier.toLowerCase().slice(0,3)}`;
    }

    // 2. Render Cascade Chain Visualizer (#1)
    this.renderCascadeChains(cascadeChains);

    // 3. Render Facilities Workspace Lists with Subsequent Changes
    this.collectAllFacilities(facilities);
    this.renderFacilitiesLists();

    // 4. Initialize Split View Mini-Map (#6)
    this.initSplitMap(metadata);

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
      row.setAttribute('data-category', chain.category || 'infra');

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

    const categories = [
      { key: 'hospitals', icon: '🏥' },
      { key: 'schools', icon: '🏫' },
      { key: 'roads', icon: '🛣️' },
      { key: 'settlements', icon: '👥' },
      { key: 'water', icon: '💧' },
      { key: 'agri', icon: '🌾' }
    ];

    categories.forEach(cat => {
      (facilities[cat.key] || []).forEach(item => {
        this.allFacilitiesList.push({
          ...item,
          category: cat.key,
          icon: item.icon || cat.icon,
          subsequent_changes: item.subsequent_changes || [
            `⚡ Secondary Impact: Service area accessibility constrained`,
            `⚡ Cascade: Emergency response buffer time increased`
          ]
        });
      });
    });
  }

  renderFacilitiesLists() {
    const listContainers = {
      hospitals: document.getElementById('ci-hospitals-list'),
      schools: document.getElementById('ci-schools-list'),
      roads: document.getElementById('ci-roads-list'),
      settlements: document.getElementById('ci-settlements-list'),
      water: document.getElementById('ci-water-list'),
      agri: document.getElementById('ci-agri-list')
    };

    Object.values(listContainers).forEach(c => { if (c) c.innerHTML = ''; });

    this.allFacilitiesList.forEach(item => {
      const targetContainer = listContainers[item.category];
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

      // Render Subsequent Cascade Changes Pills
      let subsequentHTML = '';
      if (item.subsequent_changes && item.subsequent_changes.length > 0) {
        let pills = item.subsequent_changes.map(sc => `<span class="ci-subsequent-pill">${sc}</span>`).join('');
        subsequentHTML = `
          <div class="ci-subsequent-changes-container">
            <div class="ci-subsequent-title">⚡ Subsequent Cascade Changes</div>
            <div class="ci-subsequent-list">
              ${pills}
            </div>
          </div>
        `;
      }

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
        ${subsequentHTML}
      `;

      // Row Click -> Open Detail Drawer (#3)
      row.addEventListener('click', (e) => {
        if (e.target.closest('.btn-stage-report')) return;
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

    this.updateCategoryBadgeCounts();
  }

  updateCategoryBadgeCounts() {
    const counts = {};
    this.allFacilitiesList.forEach(f => {
      counts[f.category] = (counts[f.category] || 0) + 1;
    });

    const setBadge = (id, count, labelSingular, labelPlural) => {
      const el = document.getElementById(id);
      if (el) el.textContent = `${count} ${count === 1 ? labelSingular : labelPlural}`;
    };

    setBadge('ci-hosp-count-badge', counts['hospitals'] || 0, 'Facility', 'Facilities');
    setBadge('ci-schools-count-badge', counts['schools'] || 0, 'Facility', 'Facilities');
    setBadge('ci-roads-count-badge', counts['roads'] || 0, 'Corridor', 'Corridors');
    setBadge('ci-settlements-count-badge', counts['settlements'] || 0, 'Settlement', 'Settlements');
    setBadge('ci-water-count-badge', counts['water'] || 0, 'Facility', 'Facilities');
    setBadge('ci-agri-count-badge', counts['agri'] || 0, 'Zone', 'Zones');
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

      block.style.display = matchesCategory ? 'flex' : 'none';
    });

    // Also filter top Cascade Chain Visualizer to highlight category-specific cascade!
    const cascadeRows = document.querySelectorAll('#ci-cascade-chains-container .cascade-chain-row');
    cascadeRows.forEach(row => {
      const cat = row.getAttribute('data-category');
      const matches = (this.activeFilters.has('all') || this.activeFilters.has(cat));
      row.style.opacity = matches ? '1' : '0.4';
      row.style.borderColor = matches ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255, 255, 255, 0.06)';
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

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics'
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

    // Populate Subsequent Changes Preview in Drawer
    const cascadePreview = document.getElementById('fd-cascade-preview');
    if (cascadePreview) {
      if (item.subsequent_changes && item.subsequent_changes.length > 0) {
        const listHTML = item.subsequent_changes.map(sc => `<div style="margin-top:4px; padding:4px 8px; background:rgba(6,182,212,0.1); border-left:3px solid #06B6D4; border-radius:4px; font-size:0.75rem; color:#F8FAFC;">${sc}</div>`).join('');
        cascadePreview.innerHTML = `<strong>⚡ Subsequent Impact Sequence:</strong>${listHTML}`;
      } else {
        cascadePreview.textContent = `${item.name} is part of the Primary Infrastructure Vulnerability Matrix.`;
      }
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

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri, Maxar'
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
}

window.communityImpactModule = new CommunityImpactModule();
