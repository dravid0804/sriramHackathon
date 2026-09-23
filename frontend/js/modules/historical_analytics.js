/**
 * EarthLens AI — Historical Timeline & Geographic Hotspots Module
 * Owned by: MEMBER 3 (Intelligence Operations, Analytics & Copilot Lead)
 * Multi-year surveillance (2024 -> 2025 -> 2026), interactive Chart.js trends with YoY deltas,
 * timeline scrubber reactive metrics, and clickable hotspot clusters.
 */

class HistoricalAnalyticsModule {
  constructor() {
    this.chartArea = null;
    this.chartCategory = null;
    this.chartPriority = null;
    this.historicalData = null;
    this.selectedYear = '2026';
  }

  async init() {
    try {
      const res = await fetch('/api/historical');
      if (!res.ok) throw new Error('Failed to fetch historical analytics');
      this.historicalData = await res.json();

      this.renderYearlyMetricsBanner(this.selectedYear);
      this.renderCharts(this.historicalData);
      this.renderHotspots(this.historicalData.hotspots || [], this.selectedYear);
      this.setupTimelineSlider();
    } catch (err) {
      console.warn('Historical module loading error:', err);
    }
  }

  renderYearlyMetricsBanner(year) {
    const scrubberCard = document.querySelector('.timeline-scrubber-card');
    if (!scrubberCard || !this.historicalData) return;

    let banner = document.getElementById('historical-yearly-kpi-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'historical-yearly-kpi-banner';
      banner.className = 'historical-kpi-banner';
      scrubberCard.appendChild(banner);
    }

    const summaries = this.historicalData.yearly_summaries || {};
    const summary = summaries[year] || {
      total_area_km2: 104.9,
      yoy_growth_percent: 53.4,
      critical_count: 19,
      moderate_count: 34,
      dominant_hazard: 'Compound Multi-Hazard',
      status_headline: '4 persistent hotspots actively monitored across multispectral bands.'
    };

    const yoyBadge = year === '2024' 
      ? '<span class="hist-kpi-badge baseline-badge">BASELINE BENCHMARK</span>'
      : `<span class="hist-kpi-badge growth-badge">+${summary.yoy_growth_percent}% YoY GROWTH</span>`;

    banner.innerHTML = `
      <div class="hist-kpi-grid">
        <div class="hist-kpi-item">
          <span class="hist-kpi-label">TOTAL IMPACT FOOTPRINT</span>
          <div class="hist-kpi-val-row">
            <span class="hist-kpi-val text-cyan">${summary.total_area_km2} km²</span>
            ${yoyBadge}
          </div>
        </div>
        <div class="hist-kpi-item">
          <span class="hist-kpi-label">CRITICAL THREAT EVENTS</span>
          <div class="hist-kpi-val-row">
            <span class="hist-kpi-val text-red">${summary.critical_count} Urgent</span>
            <span class="hist-kpi-sub">+${summary.moderate_count} Moderate</span>
          </div>
        </div>
        <div class="hist-kpi-item">
          <span class="hist-kpi-label">PRIMARY REGIONAL DRIVER</span>
          <div class="hist-kpi-val-row">
            <span class="hist-kpi-val text-yellow" style="font-size: 0.95rem;">${summary.dominant_hazard}</span>
          </div>
        </div>
      </div>
      <div class="hist-kpi-narrative">
        <span class="hist-pulse-beacon"></span>
        <span>${summary.status_headline}</span>
      </div>
    `;
  }

  setupTimelineSlider() {
    const slider = document.getElementById('timeline-slider');
    const label = document.getElementById('timeline-year-label');
    const ticks = document.querySelectorAll('.timeline-ticks .tick-label');

    if (slider && label) {
      slider.addEventListener('input', (e) => {
        const val = e.target.value;
        this.selectedYear = val;
        
        const yoyText = val === '2024' ? 'Baseline' : (val === '2025' ? '+60.6% YoY' : '+53.4% YoY');
        label.textContent = `Selected Year: ${val} (${yoyText})`;
        
        ticks.forEach((tick, idx) => {
          const year = 2024 + idx;
          tick.classList.toggle('active', year === parseInt(val));
        });

        // 1. Update dynamic KPI banner
        this.renderYearlyMetricsBanner(val);

        // 2. Filter/highlight Hotspots for active year
        if (this.historicalData && this.historicalData.hotspots) {
          this.renderHotspots(this.historicalData.hotspots, val);
        }

        // 3. Highlight active bar in Area Chart
        if (this.chartArea) {
          const idx = parseInt(val) - 2024;
          const bgColors = ['rgba(6, 182, 212, 0.35)', 'rgba(6, 182, 212, 0.35)', 'rgba(6, 182, 212, 0.35)'];
          bgColors[idx] = '#06b6d4';
          this.chartArea.data.datasets[0].backgroundColor = bgColors;
          this.chartArea.update();
        }
      });
    }
  }

  renderCharts(data) {
    const areaCanvas = document.getElementById('chart-area-time');
    const catCanvas = document.getElementById('chart-categories');
    const prioCanvas = document.getElementById('chart-priority-time');

    if (!areaCanvas || !window.Chart) return;

    // Destroy existing instances if present
    if (this.chartArea) this.chartArea.destroy();
    if (this.chartCategory) this.chartCategory.destroy();
    if (this.chartPriority) this.chartPriority.destroy();

    const areaDataList = data.area_over_time || [];
    const years = areaDataList.map(d => d.year);
    const totals = areaDataList.map(d => d.total_area_km2);

    // -------------------------------------------------------------
    // CHART 1: Affected Area Over Time with YoY Percentage Tooltips
    // -------------------------------------------------------------
    this.chartArea = new Chart(areaCanvas, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [{
          label: 'Total Transformed Area (km²)',
          data: totals,
          backgroundColor: ['rgba(6, 182, 212, 0.45)', 'rgba(6, 182, 212, 0.65)', '#06b6d4'],
          borderColor: '#06b6d4',
          borderWidth: 1.5,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(14, 21, 38, 0.95)',
            titleColor: '#06b6d4',
            titleFont: { size: 13, weight: 'bold' },
            bodyColor: '#f8fafc',
            bodyFont: { size: 12 },
            borderColor: 'rgba(6, 182, 212, 0.4)',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              title: (items) => `Temporal Milestone: Year ${items[0].label}`,
              label: (item) => {
                const raw = areaDataList[item.dataIndex];
                if (!raw) return `Area: ${item.raw} km²`;
                const yoy = raw.yoy_growth_percent > 0 
                  ? `▲ +${raw.yoy_growth_percent}% YoY (+${raw.yoy_delta_km2} km²)`
                  : '● Baseline Observation Year';
                return [
                  `Total Area: ${raw.total_area_km2} km²`,
                  `Annual Growth: ${yoy}`,
                  `Dominant Hazard: ${raw.dominant_hazard}`
                ];
              },
              afterBody: (items) => {
                const raw = areaDataList[items[0].dataIndex];
                if (!raw) return '';
                return [
                  '',
                  'Multispectral Hazard Composition:',
                  ` • Flooding: ${raw.flood_km2} km²`,
                  ` • Deforestation: ${raw.deforest_km2} km²`,
                  ` • Urban Growth: ${raw.urban_km2} km²`,
                  ` • Wildfire Scars: ${raw.fire_km2} km²`
                ];
              }
            }
          }
        },
        scales: {
          x: { 
            grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
            ticks: { color: '#94a3b8', font: { weight: '600' } } 
          },
          y: { 
            grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
            ticks: { 
              color: '#94a3b8',
              callback: (val) => `${val} km²`
            } 
          }
        }
      }
    });

    // -------------------------------------------------------------
    // CHART 2: Changes by Category Distribution with Area Share
    // -------------------------------------------------------------
    const cats = data.category_distribution || [];
    this.chartCategory = new Chart(catCanvas, {
      type: 'doughnut',
      data: {
        labels: cats.map(c => c.category),
        datasets: [{
          data: cats.map(c => c.area_km2),
          backgroundColor: cats.map(c => c.color),
          borderWidth: 2,
          borderColor: '#0e1526'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { 
              color: '#cbd5e1', 
              font: { size: 11, family: 'Plus Jakarta Sans' },
              padding: 12
            }
          },
          tooltip: {
            backgroundColor: 'rgba(14, 21, 38, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (item) => {
                const cat = cats[item.dataIndex];
                return [
                  ` Area: ${cat.area_km2} km² (${cat.percentage_share}% Share)`,
                  ` Recorded Incidents: ${cat.count} Events`
                ];
              }
            }
          }
        }
      }
    });

    // -------------------------------------------------------------
    // CHART 3: Priority Trends Over Time with YoY Threat Acceleration
    // -------------------------------------------------------------
    const pTrends = data.priority_trends || [];
    this.chartPriority = new Chart(prioCanvas, {
      type: 'line',
      data: {
        labels: pTrends.map(p => p.year),
        datasets: [
          {
            label: 'Critical Threats',
            data: pTrends.map(p => p.critical),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.25)',
            tension: 0.35,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: '#ef4444'
          },
          {
            label: 'Moderate Warnings',
            data: pTrends.map(p => p.moderate),
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.12)',
            tension: 0.35,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: '#f97316'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#cbd5e1', font: { size: 11 } }
          },
          tooltip: {
            backgroundColor: 'rgba(14, 21, 38, 0.95)',
            borderColor: 'rgba(239, 68, 68, 0.4)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (item) => {
                const pt = pTrends[item.dataIndex];
                if (item.datasetIndex === 0) {
                  const yoy = pt.critical_yoy_growth > 0 ? ` (+${pt.critical_yoy_growth}% YoY)` : ' (Baseline)';
                  return `Critical Threats: ${item.raw} events${yoy}`;
                } else {
                  const yoy = pt.moderate_yoy_growth > 0 ? ` (+${pt.moderate_yoy_growth}% YoY)` : ' (Baseline)';
                  return `Moderate Warnings: ${item.raw} events${yoy}`;
                }
              }
            }
          }
        },
        scales: {
          x: { 
            grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
            ticks: { color: '#94a3b8' } 
          },
          y: { 
            grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
            ticks: { color: '#94a3b8' } 
          }
        }
      }
    });
  }

  renderHotspots(hotspots, filterYear = '2026') {
    const container = document.getElementById('hotspots-container');
    if (!container) return;
    container.innerHTML = '';

    const currentYearInt = parseInt(filterYear);

    hotspots.forEach(h => {
      const activeSinceInt = parseInt(h.active_since || '2024');
      const isHistoricalMatch = activeSinceInt <= currentYearInt;

      const card = document.createElement('div');
      card.className = `hotspot-card ${isHistoricalMatch ? 'active-temporal' : 'dimmed-temporal'}`;
      
      const badgeStyle = h.urgency === 'CRITICAL'
        ? 'background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4);'
        : 'background: rgba(249, 115, 22, 0.15); color: #f97316; border: 1px solid rgba(249, 115, 22, 0.4);';

      card.innerHTML = `
        <div class="hotspot-top-badge">
          <span style="font-size: 0.68rem; font-family: 'JetBrains Mono', monospace; font-weight: 700; padding: 2px 8px; border-radius: 4px; ${badgeStyle}">
            ${h.urgency} HOTSPOT
          </span>
          <span class="hotspot-metrics-pill">${h.total_area_km2} km² · ${h.detected_events} Events</span>
        </div>
        <div class="hotspot-name">${h.name}</div>
        <div style="font-size: 0.74rem; color: #94a3b8;">${h.region} · Tracked Since ${h.active_since || '2024'}</div>
        <div style="font-size: 0.76rem; color: #cbd5e1; margin-top: 4px;">Primary Hazard: <strong>${h.primary_hazard}</strong></div>
        <div style="font-size: 0.72rem; color: #06b6d4; font-family: monospace;">Trend: ${h.trend}</div>
        <div style="font-size: 0.72rem; color: #cbd5e1; font-style: italic; margin-top: 4px; border-left: 2px solid rgba(6, 182, 212, 0.4); padding-left: 6px;">
          ${h.critical_infrastructure_risk || 'Proximity exposure under investigation.'}
        </div>
        
        <div class="hotspot-action-row" style="margin-top: 10px; display: flex; gap: 8px;">
          <button class="btn-hotspot-zoom" style="flex: 1; padding: 6px 10px; background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.4); border-radius: 6px; color: #06b6d4; font-size: 0.72rem; font-weight: 600; cursor: pointer;">
            Zoom Map ↗
          </button>
          <button class="btn-hotspot-copilot" style="flex: 1; padding: 6px 10px; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.4); border-radius: 6px; color: #c084fc; font-size: 0.72rem; font-weight: 600; cursor: pointer;">
            Copilot Audit ✦
          </button>
        </div>
      `;

      // Zoom Map Button
      const zoomBtn = card.querySelector('.btn-hotspot-zoom');
      if (zoomBtn) {
        zoomBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (h.linked_dataset && window.earthLensApp) {
            window.earthLensApp.triggerScenario(h.linked_dataset);
          }
          if (window.earthMap && h.coordinates) {
            window.earthMap.zoomToCoordinates(h.coordinates.lat, h.coordinates.lon, 13);
            const panel = document.getElementById('panel-historical-analysis');
            if (panel) panel.style.display = 'none';
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            const mapBtn = document.getElementById('nav-live-map');
            if (mapBtn) mapBtn.classList.add('active');
          }
        });
      }

      // Copilot Audit Button
      const copilotBtn = card.querySelector('.btn-hotspot-copilot');
      if (copilotBtn) {
        copilotBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (h.linked_dataset && window.earthLensApp) {
            window.earthLensApp.triggerScenario(h.linked_dataset);
          }
          // Switch to map view & open drawer AI assistant
          const panel = document.getElementById('panel-historical-analysis');
          if (panel) panel.style.display = 'none';
          document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
          const mapBtn = document.getElementById('nav-live-map');
          if (mapBtn) mapBtn.classList.add('active');

          const drawer = document.getElementById('detail-drawer');
          if (drawer) drawer.classList.remove('minimized');
          const assistantTab = document.getElementById('tab-btn-assistant');
          if (assistantTab) assistantTab.click();

          if (window.investigationAssistantModule) {
            window.investigationAssistantModule.handleQuery(`Provide an investigation briefing for ${h.name} (${h.region}).`);
          }
        });
      }

      container.appendChild(card);
    });
  }
}

window.historicalAnalyticsModule = new HistoricalAnalyticsModule();
