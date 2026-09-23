/**
 * EarthLens AI — Executive Investigation Reports Module
 * Generates and exports comprehensive investigation dossiers.
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

    if (elId) elId.textContent = report.report_id || 'ELENS-DOSSIER-1001';
    if (elTitle) elTitle.textContent = report.title;
    if (elLoc) elLoc.textContent = report.location;
    if (elDates) elDates.textContent = `${report.dates.before_date} → ${report.dates.after_date}`;
    if (elSensor) elSensor.textContent = report.sensor_platform;
    if (elHazard) elHazard.textContent = report.hazard_type;
    if (elArea) elArea.textContent = `${report.affected_area_km2} km²`;
    if (elPrio) elPrio.textContent = `${report.investigation_priority.tier} (${report.investigation_priority.score}/100)`;
    if (elComm) elComm.textContent = `${report.community_exposure.settlements_count} Settlements`;
    if (elNarrative) elNarrative.textContent = report.ai_narrative;

    // Infrastructure list table
    if (elTable) {
      elTable.innerHTML = '';
      const facilities = report.nearby_facilities || {};
      
      (facilities.hospitals || []).forEach(h => {
        const row = document.createElement('div');
        row.className = 'dossier-infra-row';
        row.innerHTML = `<span>🏥 <strong>${h.name}</strong></span><span style="color: #ef4444;">${h.status}</span>`;
        elTable.appendChild(row);
      });

      (facilities.schools || []).forEach(s => {
        const row = document.createElement('div');
        row.className = 'dossier-infra-row';
        row.innerHTML = `<span>🏫 <strong>${s.name}</strong></span><span style="color: #f97316;">${s.status}</span>`;
        elTable.appendChild(row);
      });

      (facilities.roads || []).forEach(r => {
        const row = document.createElement('div');
        row.className = 'dossier-infra-row';
        row.innerHTML = `<span>🛣️ <strong>${r.name}</strong></span><span style="color: #06b6d4;">${r.status}</span>`;
        elTable.appendChild(row);
      });
    }

    // Export button listener
    const btnExport = document.getElementById('btn-export-report-pdf');
    if (btnExport) {
      btnExport.onclick = () => {
        window.print();
      };
    }
  }
}

window.reportsGeneratorModule = new ReportsGeneratorModule();
