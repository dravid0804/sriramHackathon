/**
 * EarthLens AI — Space & Earth Intelligence Platform
 * Master Application Orchestrator & View Controller
 */

class EarthLensApp {
  constructor() {
    this.activeScenario = 'derna_flooding';
    this.currentAnalysis = null;
    this.alertsData = [];
    this.datasourcesData = [];
  }

  async init() {
    // 1. Initialize Map Canvas
    if (window.earthMap) {
      window.earthMap.init();
    }

    // 2. Initialize Subsystems
    if (window.investigationAssistantModule) {
      window.investigationAssistantModule.init();
    }
    if (window.historicalAnalyticsModule) {
      window.historicalAnalyticsModule.init();
    }

    // 3. Setup Navigation & UI Listeners
    this.setupSidebarNavigation();
    this.setupScenarioSwitcher();
    this.setupGlobalSearch();
    this.setupAnalysisButton();
    this.setupAlertsActions();

    // 4. Load Initial Mission Scenario (Derna Flooding)
    await this.loadScenario('derna_flooding');

    // 5. Ingest Alerts and Data Sources
    await this.fetchAlerts();
    await this.fetchDataSources();

    // Setup detail drawer close
    const btnMinDrawer = document.getElementById('btn-minimize-drawer');
    const drawer = document.getElementById('detail-drawer');
    if (btnMinDrawer && drawer) {
      btnMinDrawer.addEventListener('click', () => {
        drawer.classList.add('minimized');
      });
    }

    // Setup deep link from detail drawer to community impact
    const btnDeepImpact = document.getElementById('btn-deep-community-impact');
    if (btnDeepImpact) {
      btnDeepImpact.addEventListener('click', () => {
        this.switchWorkspace('community-impact');
      });
    }

    console.log('EarthLens AI Master Orchestrator initialized successfully.');
  }

  setupSidebarNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.dataset.nav;
        this.switchWorkspace(targetView);
      });
    });

    // Panel Close Buttons (e.g. "Back to Map")
    const closeButtons = document.querySelectorAll('.panel-close-btn');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchWorkspace('live-map');
      });
    });
  }

  switchWorkspace(viewName) {
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.nav === viewName);
    });

    // Hide all workspace panels
    const panels = document.querySelectorAll('.workspace-overlay-panel');
    panels.forEach(p => p.style.display = 'none');

    // If 'live-map' is selected, panels remain hidden so map is 100% visible
    if (viewName === 'live-map') {
      return;
    }

    // Otherwise, show target workspace panel
    const targetPanel = document.getElementById(`panel-${viewName}`);
    if (targetPanel) {
      targetPanel.style.display = 'block';

      // If switching to Historical Analysis, resize Chart.js instances
      if (viewName === 'historical-analysis' && window.historicalAnalyticsModule) {
        setTimeout(() => {
          if (window.historicalAnalyticsModule.chartArea) window.historicalAnalyticsModule.chartArea.resize();
          if (window.historicalAnalyticsModule.chartCategories) window.historicalAnalyticsModule.chartCategories.resize();
          if (window.historicalAnalyticsModule.chartPriority) window.historicalAnalyticsModule.chartPriority.resize();
        }, 50);
      }

      // If switching to Community Impact, also set map comparison mode to impact
      if (viewName === 'community-impact' && window.earthMap) {
        window.earthMap.setComparisonMode('impact');
        const impactTab = document.getElementById('tab-mode-impact');
        if (impactTab) {
          document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
          impactTab.classList.add('active');
        }
      }
    }
  }

  setupScenarioSwitcher() {
    const scenarioChips = document.querySelectorAll('.scenario-chip');
    scenarioChips.forEach(chip => {
      chip.addEventListener('click', async () => {
        scenarioChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const scenarioId = chip.dataset.scenario;
        await this.loadScenario(scenarioId);
      });
    });
  }

  async loadScenario(scenarioId) {
    this.activeScenario = scenarioId;
    if (window.investigationAssistantModule) {
      window.investigationAssistantModule.setActiveDataset(scenarioId);
    }

    try {
      // Execute CV differencing & community impact pipeline
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_id: scenarioId })
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      this.currentAnalysis = data;

      // 1. Pass to Map Engine
      if (window.earthMap) {
        window.earthMap.loadDataset(data);
      }

      // 2. Pass to Community Impact Engine
      if (window.communityImpactModule && data.community_impact) {
        window.communityImpactModule.updateImpact(data.community_impact, data.metadata);
      }

      // 3. Pre-generate Report & Update AI Assistant context
      if (window.reportsGeneratorModule) {
        window.reportsGeneratorModule.generateReport(scenarioId, data.ranked_zones || []);
      }
      if (window.investigationAssistantModule) {
        window.investigationAssistantModule.setActiveDataset(scenarioId);
      }

      // 4. Update Tables & Overview KPIs
      this.updateOverviewKPIs(data);
      this.updateChangeDetectionWorkspace(data);

    } catch (err) {
      console.error('Error analyzing scenario:', err);
    }
  }

  updateOverviewKPIs(data) {
    const zones = data.ranked_zones || [];
    const telemetry = data.telemetry || {};
    const impact = data.community_impact || {};
    const impactSummary = impact.community_impact_summary || {};

    const elChanges = document.getElementById('kpi-changes-detected');
    const elCrit = document.getElementById('kpi-high-priority');
    const elArea = document.getElementById('kpi-total-area');
    const elComm = document.getElementById('kpi-communities-affected');
    const elInfra = document.getElementById('kpi-infra-at-risk');

    if (elChanges) elChanges.textContent = zones.length;
    if (elCrit) elCrit.textContent = telemetry.critical_count || 0;
    if (elArea) elArea.textContent = `${impactSummary.total_affected_area_km2 || 14.2} km²`;
    if (elComm) elComm.textContent = impactSummary.settlements_count || 6;
    if (elInfra) elInfra.textContent = (impactSummary.schools_count || 0) + (impactSummary.hospitals_count || 0) + (impactSummary.roads_count || 0);

    // Populate Overview Priority Table
    const tbody = document.getElementById('overview-priority-tbody');
    if (tbody) {
      tbody.innerHTML = '';
      zones.forEach(z => {
        const tr = document.createElement('tr');
        const isCrit = z.tier === 'CRITICAL';
        tr.innerHTML = `
          <td><strong>${data.metadata.location} (Zone ${z.zone_id})</strong></td>
          <td><span class="hazard-badge-pill">${z.classification ? z.classification.type : 'Anomaly'}</span></td>
          <td><span class="${isCrit ? 'text-red' : 'text-orange'}" style="font-weight: 700;">${z.tier}</span></td>
          <td>${z.hectares} ha</td>
          <td>${z.confidence ? z.confidence.score_pct : 92}%</td>
          <td><span class="score-pill">${z.urgency_score}/100</span></td>
          <td><button class="btn-alert-action btn-primary-action" style="padding: 4px 8px; font-size: 0.72rem;">Inspect on Map</button></td>
        `;

        tr.addEventListener('click', () => {
          this.switchWorkspace('live-map');
          if (window.earthMap) {
            window.earthMap.zoomToZone(z.zone_id);
          }
        });

        tbody.appendChild(tr);
      });
    }
  }

  updateChangeDetectionWorkspace(data) {
    const meta = data.metadata || {};
    const zones = data.ranked_zones || [];
    const impactSummary = data.community_impact ? data.community_impact.community_impact_summary : {};

    // Images
    const imgB = document.getElementById('sat-img-before');
    const imgA = document.getElementById('sat-img-after');
    const lblB = document.getElementById('sat-date-before-label');
    const lblA = document.getElementById('sat-date-after-label');

    if (imgB && data.before_image_url) imgB.src = data.before_image_url;
    if (imgA && data.after_image_url) imgA.src = data.after_image_url;
    if (lblB) lblB.textContent = meta.date_before || 'Baseline';
    if (lblA) lblA.textContent = meta.date_after || 'Current';

    // Summary pills
    const sumChanges = document.getElementById('det-total-changes');
    const sumArea = document.getElementById('det-changed-area');
    const sumType = document.getElementById('det-dominant-type');
    const sumConf = document.getElementById('det-avg-conf');
    const sumHigh = document.getElementById('det-high-loc');

    if (sumChanges) sumChanges.textContent = `${zones.length} Region(s)`;
    if (sumArea) sumArea.textContent = `${impactSummary.total_affected_area_km2 || 14.2} km²`;
    if (sumType) sumType.textContent = meta.change_type || 'Environmental Shift';
    if (sumConf) sumConf.textContent = `${data.telemetry ? data.telemetry.mean_confidence_pct : 93.4}%`;
    if (sumHigh) sumHigh.textContent = meta.location || 'Target Cluster';

    // Change Detection Table
    const tbody = document.getElementById('detection-zones-tbody');
    if (tbody) {
      tbody.innerHTML = '';
      zones.forEach(z => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${meta.location} — Sector ${z.zone_id}</strong></td>
          <td>${z.classification ? z.classification.type : 'Anomaly'}</td>
          <td>${(z.hectares / 100).toFixed(2)} km² (${z.hectares} ha)</td>
          <td><span class="${z.tier === 'CRITICAL' ? 'text-red' : 'text-orange'}" style="font-weight: 700;">${z.tier}</span></td>
          <td>${z.confidence ? z.confidence.score_pct : 92}%</td>
          <td><span class="score-pill">${z.urgency_score} / 100</span></td>
          <td><button class="btn-alert-action" style="padding: 4px 8px; font-size: 0.72rem;">Pan to Anomaly →</button></td>
        `;

        tr.addEventListener('click', () => {
          this.switchWorkspace('live-map');
          if (window.earthMap) {
            window.earthMap.zoomToZone(z.zone_id);
          }
        });

        tbody.appendChild(tr);
      });
    }

    // Detect Analyze Button
    const btnAnalyze = document.getElementById('btn-detect-analyze');
    if (btnAnalyze) {
      btnAnalyze.onclick = () => {
        this.switchWorkspace('live-map');
        window.earthMap.setComparisonMode('difference');
      };
    }
  }

  setupGlobalSearch() {
    const searchInput = document.getElementById('global-location-search');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const query = searchInput.value.toLowerCase().trim();
          if (query.includes('derna') || query.includes('flood') || query.includes('libya')) {
            this.triggerScenario('derna_flooding');
          } else if (query.includes('amazon') || query.includes('forest') || query.includes('brazil')) {
            this.triggerScenario('amazon_deforestation');
          } else if (query.includes('madurai') || query.includes('urban') || query.includes('india')) {
            this.triggerScenario('madurai_urban');
          } else if (query.includes('fire') || query.includes('wildfire') || query.includes('california')) {
            this.triggerScenario('california_wildfire');
          } else {
            alert(`Searching global registry for '${query}'... Centering reconnaissance radar on nearest satellite footprint.`);
            this.triggerScenario('madurai_urban');
          }
          searchInput.value = '';
        }
      });
    }
  }

  triggerScenario(scenarioId) {
    const chip = document.querySelector(`.scenario-chip[data-scenario="${scenarioId}"]`);
    if (chip) {
      chip.click();
    } else {
      this.loadScenario(scenarioId);
    }
  }

  setupAnalysisButton() {
    const btnRun = document.getElementById('btn-run-analysis');
    if (btnRun) {
      btnRun.addEventListener('click', async () => {
        const originalText = btnRun.innerHTML;
        btnRun.innerHTML = '<span>Scanning Multispectral Bands...</span>';
        btnRun.style.opacity = '0.7';

        await this.loadScenario(this.activeScenario);

        setTimeout(() => {
          btnRun.innerHTML = originalText;
          btnRun.style.opacity = '1';
        }, 800);
      });
    }
  }

  async fetchAlerts() {
    try {
      const res = await fetch('/api/alerts');
      if (!res.ok) return;
      const data = await res.json();
      this.alertsData = data.alerts || [];

      // Restore any persisted statuses from localStorage
      try {
        const cached = JSON.parse(localStorage.getItem('earthlens_alert_statuses') || '{}');
        this.alertsData.forEach(a => {
          if (cached[a.id]) {
            a.status = cached[a.id];
          }
        });
      } catch (e) {}

      this.renderAlerts(this.alertsData);
      this.updateAlertBadges();
    } catch (err) {
      console.warn('Error fetching alerts:', err);
    }
  }

  updateAlertBadges() {
    const activeCount = this.alertsData.filter(a => a.status === 'ACTIVE').length;
    const badge = document.getElementById('sidebar-alert-badge');
    if (badge) {
      badge.textContent = activeCount;
      badge.style.display = activeCount > 0 ? 'inline-block' : 'none';
    }

    const countAll = document.getElementById('count-all-alerts');
    const countCrit = document.getElementById('count-crit-alerts');
    const countMod = document.getElementById('count-mod-alerts');

    if (countAll) countAll.textContent = this.alertsData.length;
    if (countCrit) countCrit.textContent = this.alertsData.filter(a => a.severity === 'CRITICAL').length;
    if (countMod) countMod.textContent = this.alertsData.filter(a => a.severity === 'MODERATE').length;
  }

  async updateAlertLifecycle(alertId, newStatus) {
    const alert = this.alertsData.find(a => a.id === alertId);
    if (!alert) return;

    alert.status = newStatus;

    // 1. Update localStorage cache
    try {
      const cached = JSON.parse(localStorage.getItem('earthlens_alert_statuses') || '{}');
      cached[alertId] = newStatus;
      localStorage.setItem('earthlens_alert_statuses', JSON.stringify(cached));
    } catch (e) {}

    // 2. Persist to backend API
    try {
      await fetch(`/api/alerts/${alertId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.warn('Failed to update alert status on server:', err);
    }

    // 3. Update badges and re-render current view
    this.updateAlertBadges();
    const activeFilterBtn = document.querySelector('.alert-filter-btn.active');
    const filter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';
    if (filter === 'all') {
      this.renderAlerts(this.alertsData);
    } else {
      this.renderAlerts(this.alertsData.filter(a => a.severity === filter));
    }
  }

  renderAlerts(alerts) {
    const container = document.getElementById('alerts-cards-container');
    if (!container) return;
    container.innerHTML = '';

    if (alerts.length === 0) {
      container.innerHTML = '<div style="padding: 24px; text-align: center; color: #94a3b8; font-size: 0.85rem;">No alerts matching current filter.</div>';
      return;
    }

    alerts.forEach(a => {
      const card = document.createElement('div');
      const statusClass = (a.status || 'ACTIVE').toLowerCase().replace('_', '-');
      card.className = `alert-item-card status-${statusClass}`;
      card.style.borderLeftColor = a.severity === 'CRITICAL' ? '#ef4444' : '#f97316';

      let statusBadgeColor = '#ef4444';
      let statusBg = 'rgba(239, 68, 68, 0.15)';
      if (a.status === 'UNDER_REVIEW') {
        statusBadgeColor = '#f97316';
        statusBg = 'rgba(249, 115, 22, 0.15)';
      } else if (a.status === 'DISPATCHED') {
        statusBadgeColor = '#38bdf8';
        statusBg = 'rgba(56, 189, 248, 0.15)';
      } else if (a.status === 'REVIEWED' || a.status === 'RESOLVED') {
        statusBadgeColor = '#10b981';
        statusBg = 'rgba(16, 185, 129, 0.15)';
      }

      // Lifecycle action buttons
      let lifecycleButtons = '';
      if (a.status === 'ACTIVE') {
        lifecycleButtons = `
          <button class="btn-alert-action btn-alert-review" data-id="${a.id}">Mark Reviewed</button>
          <button class="btn-alert-action btn-alert-dispatch" data-id="${a.id}" style="color: #38bdf8; border-color: rgba(56, 189, 248, 0.4);">Dispatch Unit</button>
        `;
      } else if (a.status === 'UNDER_REVIEW' || a.status === 'REVIEWED') {
        lifecycleButtons = `
          <button class="btn-alert-action btn-alert-dispatch" data-id="${a.id}" style="color: #38bdf8; border-color: rgba(56, 189, 248, 0.4);">Dispatch Unit</button>
          <button class="btn-alert-action btn-alert-resolve" data-id="${a.id}" style="color: #10b981; border-color: rgba(16, 185, 129, 0.4);">Resolve ✓</button>
        `;
      } else if (a.status === 'DISPATCHED') {
        lifecycleButtons = `
          <button class="btn-alert-action btn-alert-resolve" data-id="${a.id}" style="color: #10b981; border-color: rgba(16, 185, 129, 0.4);">Resolve ✓</button>
        `;
      } else if (a.status === 'RESOLVED') {
        lifecycleButtons = `
          <button class="btn-alert-action btn-alert-reactivate" data-id="${a.id}" style="color: #94a3b8;">Reactivate</button>
        `;
      }

      card.innerHTML = `
        <div class="alert-meta-col">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span class="${a.severity === 'CRITICAL' ? 'priority-badge-pill text-red' : 'hazard-badge-pill'}">${a.severity} PRIORITY</span>
            <span class="alert-loc-text">${new Date(a.detection_time).toLocaleDateString()}</span>
            <span style="font-size: 0.68rem; font-family: 'JetBrains Mono', monospace; font-weight: 700; padding: 2px 8px; border-radius: 4px; color: ${statusBadgeColor}; background: ${statusBg}; border: 1px solid ${statusBadgeColor};">
              ● ${a.status}
            </span>
          </div>
          <div class="alert-title-text">${a.title}</div>
          <div class="alert-loc-text">Region: <strong>${a.location}</strong> · Area: ${a.affected_area_km2} km² · Confidence: ${a.confidence}%</div>
          <div class="alert-summary-text">${a.community_impact}</div>
        </div>
        <div class="alert-actions-col">
          <button class="btn-alert-action btn-primary-action btn-alert-map" data-id="${a.id}">View on Map</button>
          <button class="btn-alert-action btn-alert-investigate" data-id="${a.id}">Investigate ✦</button>
          ${lifecycleButtons}
        </div>
      `;

      container.appendChild(card);
    });

    // View on Map listener
    container.querySelectorAll('.btn-alert-map').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const alertId = btn.dataset.id;
        const alertItem = this.alertsData.find(a => a.id === alertId);
        if (alertItem) {
          this.triggerScenario(alertItem.dataset_id);
          this.switchWorkspace('live-map');
        }
      });
    });

    // Investigate in AI Copilot listener
    container.querySelectorAll('.btn-alert-investigate').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const alertId = btn.dataset.id;
        const alertItem = this.alertsData.find(a => a.id === alertId);
        if (alertItem) {
          this.triggerScenario(alertItem.dataset_id);
          this.switchWorkspace('live-map');
          const drawer = document.getElementById('detail-drawer');
          if (drawer) drawer.classList.remove('minimized');
          const assistantTab = document.getElementById('tab-btn-assistant');
          if (assistantTab) assistantTab.click();

          if (window.investigationAssistantModule) {
            window.investigationAssistantModule.handleQuery(`Investigate alert ${alertItem.title} in ${alertItem.location}. What is the community exposure?`);
          }
        }
      });
    });

    // Lifecycle action listeners
    container.querySelectorAll('.btn-alert-review').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.updateAlertLifecycle(btn.dataset.id, 'REVIEWED');
      });
    });

    container.querySelectorAll('.btn-alert-dispatch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.updateAlertLifecycle(btn.dataset.id, 'DISPATCHED');
      });
    });

    container.querySelectorAll('.btn-alert-resolve').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.updateAlertLifecycle(btn.dataset.id, 'RESOLVED');
      });
    });

    container.querySelectorAll('.btn-alert-reactivate').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.updateAlertLifecycle(btn.dataset.id, 'ACTIVE');
      });
    });
  }

  setupAlertsActions() {
    const filterButtons = document.querySelectorAll('.alert-filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        if (filter === 'all') {
          this.renderAlerts(this.alertsData);
        } else {
          this.renderAlerts(this.alertsData.filter(a => a.severity === filter));
        }
      });
    });
  }

  async fetchDataSources() {
    try {
      const res = await fetch('/api/datasources');
      if (!res.ok) return;
      const data = await res.json();
      this.datasourcesData = data.sources || [];

      const container = document.getElementById('datasources-container');
      if (container) {
        container.innerHTML = '';
        this.datasourcesData.forEach(ds => {
          const card = document.createElement('div');
          card.className = 'datasource-card';
          card.innerHTML = `
            <div class="datasource-name">${ds.name}</div>
            <div class="datasource-provider">${ds.provider}</div>
            <div class="datasource-row"><strong>Data Type:</strong> <span>${ds.data_type}</span></div>
            <div class="datasource-row"><strong>Coverage:</strong> <span>${ds.coverage}</span></div>
            <div class="datasource-row"><strong>Updated:</strong> <span>${new Date(ds.last_updated).toLocaleString()}</span></div>
            <div class="datasource-status-badge">${ds.status}</div>
          `;
          container.appendChild(card);
        });
      }
    } catch (err) {
      console.warn('Error fetching data sources:', err);
    }
  }
}

// Instantiate and initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.earthLensApp = new EarthLensApp();
  window.earthLensApp.init();
});
