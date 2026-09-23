/**
 * EarthLens AI — Historical Timeline & Geographic Hotspots Module
 * Multi-year surveillance (2024 -> 2025 -> 2026), Chart.js trends, and clickable hotspot clusters.
 */

class HistoricalAnalyticsModule {
  constructor() {
    this.chartArea = null;
    this.chartCategory = null;
    this.chartPriority = null;
    this.historicalData = null;
  }

  async init() {
    try {
      const res = await fetch('/api/historical');
      if (!res.ok) throw new Error('Failed to fetch historical analytics');
      this.historicalData = await res.json();

      this.renderCharts(this.historicalData);
      this.renderHotspots(this.historicalData.hotspots || []);
      this.setupTimelineSlider();
    } catch (err) {
      console.warn('Historical module loading error:', err);
    }
  }

  setupTimelineSlider() {
    const slider = document.getElementById('timeline-slider');
    const label = document.getElementById('timeline-year-label');
    const ticks = document.querySelectorAll('.timeline-ticks .tick-label');

    if (slider && label) {
      slider.addEventListener('input', (e) => {
        const val = e.target.value;
        label.textContent = `Selected Year: ${val}`;
        
        ticks.forEach((tick, idx) => {
          const year = 2024 + idx;
          tick.classList.toggle('active', year === parseInt(val));
        });

        // Filter chart highlights if initialized
        if (this.chartArea) {
          const idx = parseInt(val) - 2024;
          const bgColors = ['rgba(6, 182, 212, 0.4)', 'rgba(6, 182, 212, 0.4)', 'rgba(6, 182, 212, 0.4)'];
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

    // Chart 1: Affected Area Over Time
    const years = (data.area_over_time || []).map(d => d.year);
    const totals = (data.area_over_time || []).map(d => d.total_area_km2);

    this.chartArea = new Chart(areaCanvas, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [{
          label: 'Total Area (km²)',
          data: totals,
          backgroundColor: ['rgba(6, 182, 212, 0.5)', 'rgba(6, 182, 212, 0.7)', '#06b6d4'],
          borderColor: '#06b6d4',
          borderWidth: 1.5,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
          y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } }
        }
      }
    });

    // Chart 2: Changes by Category
    const cats = data.category_distribution || [];
    this.chartCategory = new Chart(catCanvas, {
      type: 'doughnut',
      data: {
        labels: cats.map(c => c.category),
        datasets: [{
          data: cats.map(c => c.count),
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
            labels: { color: '#94a3b8', font: { size: 10 } }
          }
        }
      }
    });

    // Chart 3: Priority Trends Over Time
    const pTrends = data.priority_trends || [];
    this.chartPriority = new Chart(prioCanvas, {
      type: 'line',
      data: {
        labels: pTrends.map(p => p.year),
        datasets: [
          {
            label: 'Critical',
            data: pTrends.map(p => p.critical),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Moderate',
            data: pTrends.map(p => p.moderate),
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#94a3b8', font: { size: 10 } }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
          y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } }
        }
      }
    });
  }

  renderHotspots(hotspots) {
    const container = document.getElementById('hotspots-container');
    if (!container) return;
    container.innerHTML = '';

    hotspots.forEach(h => {
      const card = document.createElement('div');
      card.className = 'hotspot-card';
      card.innerHTML = `
        <div class="hotspot-top-badge">
          <span style="font-size: 0.7rem; font-family: monospace; color: ${h.color}; font-weight: 700;">${h.urgency} HOTSPOT</span>
          <span class="hotspot-metrics-pill">${h.total_area_km2} km² · ${h.detected_events} Events</span>
        </div>
        <div class="hotspot-name">${h.name}</div>
        <div style="font-size: 0.74rem; color: #94a3b8;">${h.region}</div>
        <div style="font-size: 0.76rem; color: #cbd5e1; margin-top: 4px;">Primary Hazard: <strong>${h.primary_hazard}</strong></div>
        <div style="font-size: 0.72rem; color: #06b6d4; font-family: monospace;">Trend: ${h.trend}</div>
        <div style="font-size: 0.72rem; color: #38bdf8; margin-top: 6px; font-weight: 600;">Click to Zoom Map →</div>
      `;

      card.addEventListener('click', () => {
        // Zoom map to hotspot coordinates and close workspace panel
        if (window.earthMap && h.coordinates) {
          window.earthMap.zoomToCoordinates(h.coordinates.lat, h.coordinates.lon, 13);
          // Hide panel
          const panel = document.getElementById('panel-historical-analysis');
          if (panel) panel.style.display = 'none';
          // Set live map tab active
          document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
          document.getElementById('nav-live-map').classList.add('active');
        }
      });

      container.appendChild(card);
    });
  }
}

window.historicalAnalyticsModule = new HistoricalAnalyticsModule();
