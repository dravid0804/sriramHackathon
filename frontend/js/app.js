/**
 * EarthGuard AI — Master Application Hub & Modular Orchestrator
 * Integrates:
 * - Feature 1: DetectionStudio (Member 1)
 * - Feature 2: TriageMap (Member 2)
 * - Feature 3: IncidentBriefs (Member 3)
 */

import { DetectionStudio } from './modules/detection_studio.js';
import { TriageMap } from './modules/triage_map.js';
import { IncidentBriefs } from './modules/incident_briefs.js';

// Global Shared State Container
window.EarthGuardState = {
  currentDatasetId: 'amazon_deforestation',
  datasetMetadata: null,
  analysisData: null,
  selectedZone: null,
  activeView: 'studio'
};

const App = {
  init() {
    this.cacheDOM();
    this.bindEvents();

    // Initialize the 3 modular features
    DetectionStudio.init();
    TriageMap.init();
    IncidentBriefs.init();

    // Load initial dataset
    this.loadDataset(window.EarthGuardState.currentDatasetId);
  },

  cacheDOM() {
    this.navItems = document.querySelectorAll('.nav-item');
    this.aoiSelect = document.getElementById('aoi-select');
    this.btnSidebarUpload = document.getElementById('btn-sidebar-upload');
    this.navBadgeCritical = document.getElementById('nav-badge-critical');

    this.breadcrumbLocation = document.getElementById('breadcrumb-location');
    this.breadcrumbSensor = document.getElementById('breadcrumb-sensor');
    this.topValCritical = document.getElementById('top-val-critical');
    this.topValModerate = document.getElementById('top-val-moderate');
    this.topValLow = document.getElementById('top-val-low');

    this.btnRescan = document.getElementById('btn-rescan');
    this.btnExportDocketTop = document.getElementById('btn-export-docket-top');

    this.views = {
      studio: document.getElementById('view-studio'),
      map: document.getElementById('view-map'),
      triage: document.getElementById('view-triage'),
      analytics: document.getElementById('view-analytics'),
      docket: document.getElementById('view-docket')
    };

    this.statHaVal = document.getElementById('stat-ha-val');
    this.statDeltaVal = document.getElementById('stat-delta-val');
    this.statConfVal = document.getElementById('stat-conf-val');

    this.anHectares = document.getElementById('an-hectares');
    this.anCriticalCount = document.getElementById('an-critical-count');
    this.anConfPct = document.getElementById('an-conf-pct');

    this.inspTabBtns = document.querySelectorAll('.insp-tab-btn');
    this.inspContentTabs = document.querySelectorAll('.insp-content-tab');

    // Upload Modal
    this.modalUploadBackdrop = document.getElementById('modal-upload-backdrop');
    this.btnCloseModalUpload = document.getElementById('btn-close-modal-upload');
    this.formCustomUpload = document.getElementById('form-custom-upload');
    this.boxUploadBefore = document.getElementById('box-upload-before');
    this.boxUploadAfter = document.getElementById('box-upload-after');
    this.inputFileBefore = document.getElementById('input-file-before');
    this.inputFileAfter = document.getElementById('input-file-after');
    this.lblFileBeforeName = document.getElementById('lbl-file-before-name');
    this.lblFileAfterName = document.getElementById('lbl-file-after-name');
    this.inputMissionTitle = document.getElementById('input-mission-title');
  },

  bindEvents() {
    // Navigation Menu Item Clicking
    this.navItems.forEach(item => {
      item.addEventListener('click', () => {
        this.navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this.switchView(item.dataset.view);
      });
    });

    // AOI Dataset Selector
    this.aoiSelect.addEventListener('change', (e) => {
      this.loadDataset(e.target.value);
    });

    // Top Re-scan Button
    this.btnRescan.addEventListener('click', () => {
      this.loadDataset(window.EarthGuardState.currentDatasetId);
    });

    // Top Export Docket Button
    this.btnExportDocketTop.addEventListener('click', () => {
      this.switchView('docket');
      this.navItems.forEach(i => i.classList.toggle('active', i.dataset.view === 'docket'));
    });

    // Inspector Tabs Switching
    this.inspTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.inspTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        this.inspContentTabs.forEach(content => {
          content.classList.toggle('active', content.id === tabId);
        });
      });
    });

    // Custom Event Bus Listeners
    window.addEventListener('earthguard:zone-selected', (e) => {
      const zone = e.detail;
      window.EarthGuardState.selectedZone = zone;
      
      // Update Feature 1 visual canvas
      DetectionStudio.drawCanvases();
      // Update Feature 2 metrics & quick chips
      TriageMap.renderZoneMetrics(zone);
      TriageMap.renderQuickChips(window.EarthGuardState.analysisData?.ranked_zones, zone);
      // Update Feature 3 briefing & checklist
      IncidentBriefs.renderZoneBriefing(zone);
    });

    window.addEventListener('earthguard:view-switch', (e) => {
      const view = e.detail;
      this.switchView(view);
      this.navItems.forEach(i => i.classList.toggle('active', i.dataset.view === view));
    });

    // Custom Imagery Upload Handlers
    this.btnSidebarUpload.addEventListener('click', () => {
      this.modalUploadBackdrop.classList.add('open');
    });

    this.btnCloseModalUpload.addEventListener('click', () => {
      this.modalUploadBackdrop.classList.remove('open');
    });

    this.boxUploadBefore.addEventListener('click', () => this.inputFileBefore.click());
    this.boxUploadAfter.addEventListener('click', () => this.inputFileAfter.click());

    this.inputFileBefore.addEventListener('change', (e) => {
      if (e.target.files[0]) this.lblFileBeforeName.textContent = `✓ Selected: ${e.target.files[0].name}`;
    });

    this.inputFileAfter.addEventListener('change', (e) => {
      if (e.target.files[0]) this.lblFileAfterName.textContent = `✓ Selected: ${e.target.files[0].name}`;
    });

    this.formCustomUpload.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.inputFileBefore.files[0] || !this.inputFileAfter.files[0]) {
        alert('Please select both a Before and an After satellite observation.');
        return;
      }

      const formData = new FormData();
      formData.append('before_file', this.inputFileBefore.files[0]);
      formData.append('after_file', this.inputFileAfter.files[0]);
      formData.append('title', this.inputMissionTitle.value);

      this.modalUploadBackdrop.classList.remove('open');
      document.getElementById('studio-radar-line')?.classList.add('active');

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload processing failed');
        const data = await res.json();
        this.applyAnalysisData(data);
        this.switchView('studio');
      } catch (err) {
        console.error(err);
        alert('Custom upload triage failed.');
      } finally {
        document.getElementById('studio-radar-line')?.classList.remove('active');
      }
    });
  },

  async loadDataset(datasetId) {
    window.EarthGuardState.currentDatasetId = datasetId;
    document.getElementById('studio-radar-line')?.classList.add('active');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_id: datasetId })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.applyAnalysisData(data);
    } catch (err) {
      console.error('Failed to load dataset:', err);
    } finally {
      document.getElementById('studio-radar-line')?.classList.remove('active');
    }
  },

  applyAnalysisData(data) {
    window.EarthGuardState.analysisData = data;
    window.EarthGuardState.datasetMetadata = data.dataset_metadata;
    window.EarthGuardState.selectedZone = data.ranked_zones && data.ranked_zones.length > 0 ? data.ranked_zones[0] : null;

    const meta = data.dataset_metadata || {};
    const t = data.telemetry || {};

    // Update Top Telemetry
    this.breadcrumbLocation.textContent = meta.location || meta.title || 'Target AOI';
    this.breadcrumbSensor.textContent = meta.sensor || 'Sentinel-2 MSI';
    this.topValCritical.textContent = t.critical_count || 0;
    this.topValModerate.textContent = t.moderate_count || 0;
    this.topValLow.textContent = t.low_count || 0;
    this.navBadgeCritical.textContent = t.critical_count || 0;

    // Bottom Stats
    this.statHaVal.textContent = `${t.total_hectares_impacted || 0} ha`;
    this.statDeltaVal.textContent = `${t.total_change_pct || 0}%`;
    this.statConfVal.textContent = `${t.mean_confidence_pct || 95}%`;

    // Analytics Stats
    this.anHectares.textContent = `${t.total_hectares_impacted || 0} ha`;
    this.anCriticalCount.textContent = `${t.critical_count || 0} ZONES`;
    this.anConfPct.textContent = `${t.mean_confidence_pct || 96}%`;

    // 🟢 Delegate to Feature 1 (Member 1)
    DetectionStudio.renderDataset(data);

    // 🔵 Delegate to Feature 2 (Member 2)
    TriageMap.updateLeafletMap(meta, data.ranked_zones);
    TriageMap.renderTriageTable(data.ranked_zones);
    if (window.EarthGuardState.selectedZone) {
      TriageMap.renderZoneMetrics(window.EarthGuardState.selectedZone);
      TriageMap.renderQuickChips(data.ranked_zones, window.EarthGuardState.selectedZone);
    }

    // 🟣 Delegate to Feature 3 (Member 3)
    if (window.EarthGuardState.selectedZone) {
      IncidentBriefs.renderZoneBriefing(window.EarthGuardState.selectedZone);
    }
    IncidentBriefs.renderDocket(data);
  },

  switchView(viewName) {
    window.EarthGuardState.activeView = viewName;
    Object.keys(this.views).forEach(key => {
      this.views[key].classList.toggle('active', key === viewName);
    });

    if (viewName === 'map') {
      setTimeout(() => {
        TriageMap.leafletMap?.invalidateSize();
      }, 150);
    } else if (viewName === 'studio') {
      setTimeout(() => {
        DetectionStudio.resizeCanvases();
        DetectionStudio.drawCanvases();
      }, 100);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
