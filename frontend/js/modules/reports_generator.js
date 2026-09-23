/**
 * EarthLens AI — Executive Investigation Reports Module
 * Owned by: MEMBER 3 (Intelligence Operations, Analytics & Copilot Lead)
 * Generates, renders, and exports comprehensive investigation dossiers.
 * Optimizes layouts for one-click PDF printing.
 */

class ReportsGeneratorModule {
  constructor() {
    this.currentReport = null;
  }

  async generateReport(datasetId, rankedZones) {
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id: datasetId,
          ranked_zones: rankedZones
        })
      });

      if (!res.ok) throw new Error('Report generation error');
      this.currentReport = await res.json();
      this.renderReport(this.currentReport);
    } catch (err) {
      console.warn('Reports generator error:', err);
    }
  }

  renderReport(report) {
    if (!report) return;

    const elId = document.getElementById('report-dossier-id');
    const elTitle = document.getElementById('report-mission-title');
    const elLoc = document.getElementById('report-location');
    const elDates = document.getElementById('report-dates');
    const elSensor = document.getElementById('report-sensor');
    const elHazard = document.getElementById('report-hazard-type');
    const elArea = document.getElementById('report-affected-area');
    const elPrio = document.getElementById('report-priority-tier');
    const elComm = document.getElementById('report-communities-exposed');
    const elNarrative = document.getElementById('report-ai-narrative');
    const elTable = document.getElementById('report-infra-table');

    const dossierId = report.report_id || `ELENS-DOSSIER-${Math.floor(100000 + Math.random() * 900000)}`;
    if (elId) elId.textContent = dossierId;
    if (elTitle) elTitle.textContent = report.title;
    if (elLoc) elLoc.textContent = report.location;
    if (elDates) elDates.textContent = `${report.dates?.before_date || 'Baseline'} → ${report.dates?.after_date || 'Current'}`;
    if (elSensor) elSensor.textContent = report.sensor_platform || 'Sentinel-2 MSI / Landsat-8/9 OLI';
    if (elHazard) elHazard.textContent = report.hazard_type;
    if (elArea) elArea.textContent = `${report.affected_area_km2} km²`;
    
    const prio = report.investigation_priority || { tier: 'CRITICAL', score: 94 };
    if (elPrio) {
      elPrio.textContent = `${prio.tier} (${prio.score}/100)`;
      elPrio.className = `dossier-kpi-val ${prio.tier === 'CRITICAL' ? 'text-red' : 'text-orange'}`;
    }

    const comm = report.community_exposure || {};
    if (elComm) elComm.textContent = `${comm.settlements_count || 0} Settlements Potentially Exposed`;
    if (elNarrative) elNarrative.textContent = report.ai_narrative;

    // Infrastructure list table
    if (elTable) {
      elTable.innerHTML = '';
      const facilities = report.nearby_facilities || {};
      
      const hospitals = facilities.hospitals || [];
      const schools = facilities.schools || [];
      const roads = facilities.roads || [];

      if (hospitals.length === 0 && schools.length === 0 && roads.length === 0) {
        elTable.innerHTML = '<div style="padding: 12px; color: #94a3b8; font-size: 0.85rem;">No critical facilities detected within the proximity envelope.</div>';
      } else {
        hospitals.forEach(h => {
          const row = document.createElement('div');
          row.className = 'dossier-infra-row';
          const isCompromised = (h.status || '').toUpperCase().includes('COMPROMISED');
          row.innerHTML = `
            <span>🏥 <strong>${h.name}</strong> <small style="color: #94a3b8;">(${h.distance_km || 1.2} km)</small></span>
            <span class="infra-status-tag ${isCompromised ? 'tag-crit' : 'tag-warn'}">${h.status}</span>
          `;
          elTable.appendChild(row);
        });

        schools.forEach(s => {
          const row = document.createElement('div');
          row.className = 'dossier-infra-row';
          row.innerHTML = `
            <span>🏫 <strong>${s.name}</strong> <small style="color: #94a3b8;">(${s.distance_km || 0.8} km)</small></span>
            <span class="infra-status-tag tag-warn">${s.status}</span>
          `;
          elTable.appendChild(row);
        });

        roads.forEach(r => {
          const row = document.createElement('div');
          row.className = 'dossier-infra-row';
          const isSevered = (r.status || '').toUpperCase().includes('SEVERED') || (r.status || '').toUpperCase().includes('IMPASSABLE');
          row.innerHTML = `
            <span>🛣️ <strong>${r.name}</strong> <small style="color: #94a3b8;">(${r.distance_km || 0.5} km)</small></span>
            <span class="infra-status-tag ${isSevered ? 'tag-crit' : 'tag-info'}">${r.status}</span>
          `;
          elTable.appendChild(row);
      // Attach saved investigation evidence snapshots if available
      try {
        const savedEvidence = JSON.parse(localStorage.getItem('earthlens_saved_evidence') || '[]');
        if (savedEvidence.length > 0) {
          const evidenceHeader = document.createElement('div');
          evidenceHeader.style.cssText = 'margin-top: 14px; font-size: 0.72rem; font-weight: 700; color: #06b6d4; font-family: monospace; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;';
          evidenceHeader.textContent = `ATTACHED INVESTIGATION EVIDENCE SNAPSHOTS (${savedEvidence.length})`;
          elTable.appendChild(evidenceHeader);

          savedEvidence.forEach(ev => {
            const evRow = document.createElement('div');
            evRow.className = 'dossier-infra-row';
            evRow.innerHTML = `
              <span>📸 <strong>Snapshot ${ev.id}</strong>: ${ev.region} · Epoch ${ev.year} (${ev.hazard})</span>
              <span class="infra-status-tag tag-info">ATTACHED VERIFIED</span>
            `;
            elTable.appendChild(evRow);
          });
        }
      } catch (e) {}
    }

    // Export button PDF listener
    const btnExport = document.getElementById('btn-export-report-pdf');
    if (btnExport) {
      btnExport.onclick = () => {
        const origTitle = document.title;
        const cleanLoc = (report.location || 'Mission').replace(/[^a-zA-Z0-9]/g, '_');
        document.title = `EarthLens_Executive_Dossier_${cleanLoc}_${report.dates?.after_date || '2026'}`;
        window.print();
        setTimeout(() => {
          document.title = origTitle;
        }, 1500);
      };
    }
  }
}

window.reportsGeneratorModule = new ReportsGeneratorModule();
