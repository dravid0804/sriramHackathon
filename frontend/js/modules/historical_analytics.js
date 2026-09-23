/**
 * EarthLens AI — Historical Surveillance & Earth Change Investigation Module
 * Owned by: MEMBER 3 (Intelligence Operations, Analytics & Copilot Lead)
 * Branch: prakash
 *
 * Core Features:
 * 1. Medium-Size Pic-to-Pic Temporal Progression Matrix (2024 Baseline ➔ 2025 Mid-Term ➔ 2026 Current)
 * 2. Multi-Year Analytics Charts (Area Over Time bar, Category Distribution donut, Priority Trends line)
 * 3. Expanded Multi-Year / Decade Timeline Scrubber + Playback Controller (2024 -> 2025 -> 2026)
 * 4. Hotspot Investigation (01 Derna, 02 Amazon, 03 Madurai, 04 California) with Footprint Evolution
 * 5. Selected Change Investigation & Potential Community Impact Auditing
 * 6. Evidence Snapshot Shelf & Executive Dossier Generation
 * 7. High-Resolution Detail Inspect Modal for Medium Cards
 */

class HistoricalAnalyticsModule {
  constructor() {
    this.historicalData = null;
    this.activeHotspotId = 'hotspot-charlie'; // Default: Madurai Peri-Urban Corridor
    this.activeYear = '2026';
    this.comparisonMode = 'gallery'; // 'gallery', 'difference', 'impact'
    this.isPlaying = false;
    this.playInterval = null;
    this.savedEvidence = [];

    // Chart.js instances
    this.chartArea = null;
    this.chartCategories = null;
    this.chartPriority = null;
  }

  async init() {
    try {
      const res = await fetch('/api/historical');
      if (!res.ok) throw new Error('Failed to fetch historical analytics data');
      this.historicalData = await res.json();

      // 1. Initialize Subsystems
      this.setupPicToPicGallery();
      this.setupModeSwitcher();
      this.setupTimelineController();
      this.setupHotspotsList();
      this.setupEvidenceActions();
      this.setupInspectModal();
      this.restoreEvidenceShelf();

      // 2. Render Interactive Charts (Bar, Donut, Line)
      this.initCharts(this.historicalData);

      // 3. Load Initial Hotspot State (Madurai)
      this.loadHotspot(this.activeHotspotId);

      console.log('Historical Surveillance & Pic-to-Pic Matrix initialized on branch prakash.');
    } catch (err) {
      console.warn('Historical module loading error:', err);
    }
  }

  /* =========================================================================
     FEATURE 1: MEDIUM-SIZE PIC-TO-PIC TEMPORAL PROGRESSION MATRIX
     ========================================================================= */
  setupPicToPicGallery() {
    // Clicking on any card focuses that epoch
    ['2024', '2025', '2026'].forEach(year => {
      const card = document.getElementById(`pic-card-${year}`);
      if (card) {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.btn-pic-inspect')) return; // Handled by inspect modal
          this.setTimelineYear(year);
        });
      }
    });

    // Inspect buttons on each card
    document.querySelectorAll('.btn-pic-inspect').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetImgId = btn.dataset.target;
        const epoch = btn.dataset.epoch;
        this.openInspectModal(targetImgId, epoch);
      });
    });
  }

  updatePicGallery(hs) {
    if (!hs) return;

    // 1. Images
    const imgBefore = document.getElementById('hist-img-before');
    const imgMid = document.getElementById('hist-img-mid');
    const imgAfter = document.getElementById('hist-img-after');

    if (imgBefore && hs.sample_before_image) imgBefore.src = hs.sample_before_image;
    if (imgMid && hs.sample_mid_image) imgMid.src = hs.sample_mid_image;
    if (imgAfter && hs.sample_after_image) imgAfter.src = hs.sample_after_image;

    // 2. Dates from timeline events
    const date2024 = document.getElementById('pic-date-2024');
    const date2025 = document.getElementById('pic-date-2025');
    const date2026 = document.getElementById('pic-date-2026');

    const ev24 = hs.timeline_events?.find(e => e.year === '2024');
    const ev25 = hs.timeline_events?.find(e => e.year === '2025');
    const ev26 = hs.timeline_events?.find(e => e.year === '2026');

    if (date2024) date2024.textContent = ev24?.date || '2024-02-15';
    if (date2025) date2025.textContent = ev25?.date || '2025-06-12';
    if (date2026) date2026.textContent = ev26?.date || '2026-09-18';

    // 3. Footprint Evolution numbers & radii
    const fe = hs.footprint_evolution || {};
    const fp2024 = document.getElementById('pic-footprint-2024');
    const fp2025 = document.getElementById('pic-footprint-2025');
    const fp2026 = document.getElementById('pic-footprint-2026');
    const rad2024 = document.getElementById('pic-radius-2024');
    const rad2025 = document.getElementById('pic-radius-2025');
    const rad2026 = document.getElementById('pic-radius-2026');

    if (fe['2024']) {
      if (fp2024) fp2024.textContent = `${fe['2024'].area_km2} km²`;
      if (rad2024) rad2024.textContent = `${fe['2024'].boundary_radius_m}m`;
    }
    if (fe['2025']) {
      if (fp2025) fp2025.textContent = `${fe['2025'].area_km2} km²`;
      if (rad2025) rad2025.textContent = `${fe['2025'].boundary_radius_m}m`;
    }
    if (fe['2026']) {
      if (fp2026) fp2026.textContent = `${fe['2026'].area_km2} km²`;
      if (rad2026) rad2026.textContent = `${fe['2026'].boundary_radius_m}m`;
    }

    // 4. Growth deltas in connectors
    const delta1 = document.getElementById('connector-delta-1');
    const delta2 = document.getElementById('connector-delta-2');
    const growth2026 = document.getElementById('pic-growth-2026');

    if (fe['2024'] && fe['2025']) {
      const g1 = (((fe['2025'].area_km2 - fe['2024'].area_km2) / fe['2024'].area_km2) * 100).toFixed(1);
      if (delta1) delta1.innerHTML = `<span class="c-arrow">➔</span><span class="c-val">+${g1}% YoY</span>`;
    }
    if (fe['2025'] && fe['2026']) {
      const g2 = (((fe['2026'].area_km2 - fe['2025'].area_km2) / fe['2025'].area_km2) * 100).toFixed(1);
      if (delta2) delta2.innerHTML = `<span class="c-arrow">➔</span><span class="c-val">+${g2}% YoY</span>`;
    }
    if (growth2026) {
      growth2026.textContent = `+${hs.footprint_expansion_percent || 96.3}% NET`;
    }
  }

  /* =========================================================================
     FEATURE 2: INTERACTIVE CHARTS (AREA BAR, CATEGORIES DONUT, PRIORITY LINE)
     ========================================================================= */
  initCharts(data) {
    if (!data) return;

    const areaCanvas = document.getElementById('chart-area-time');
    const catCanvas = document.getElementById('chart-categories');
    const prioCanvas = document.getElementById('chart-priority-time');

    if (!areaCanvas || !catCanvas || !prioCanvas) return;
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js library is not loaded');
      return;
    }

    // Destroy existing instances if present
    if (this.chartArea) this.chartArea.destroy();
    if (this.chartCategories) this.chartCategories.destroy();
    if (this.chartPriority) this.chartPriority.destroy();

    // -------------------------------------------------------------
    // CHART 1: Affected Area Over Time (km²) - Bar Chart
    // -------------------------------------------------------------
    const areaData = data.area_over_time || [];
    const years = areaData.map(a => a.year);
    const areas = areaData.map(a => a.total_area_km2);

    this.chartArea = new Chart(areaCanvas, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [{
          label: 'Total Affected Area (km²)',
          data: areas,
          backgroundColor: years.map(y => y === this.activeYear ? '#00e5ff' : 'rgba(0, 197, 229, 0.45)'),
          borderColor: years.map(y => y === this.activeYear ? '#ffffff' : '#00c5e5'),
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 56
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const clickedYear = years[index];
            this.setTimelineYear(clickedYear);
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(7, 10, 18, 0.95)',
            borderColor: '#00e5ff',
            borderWidth: 1,
            padding: 10,
            titleFont: { size: 12, weight: 'bold', family: 'Plus Jakarta Sans' },
            bodyFont: { size: 11, family: 'JetBrains Mono' },
            callbacks: {
              label: (ctx) => {
                const item = areaData[ctx.dataIndex];
                const yoy = item.yoy_growth_percent > 0 ? ` (+${item.yoy_growth_percent}% YoY)` : ' (Baseline)';
                return [
                  ` Total Area: ${item.total_area_km2} km²${yoy}`,
                  ` Dominant: ${item.dominant_hazard}`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#94a3b8',
              font: { family: 'JetBrains Mono', size: 11, weight: '600' }
            }
          },
          y: {
            min: 0,
            max: 120,
            ticks: {
              stepSize: 20,
              color: '#94a3b8',
              font: { family: 'JetBrains Mono', size: 10 },
              callback: (val) => `${val} km²`
            },
            grid: { color: 'rgba(255, 255, 255, 0.06)' }
          }
        }
      }
    });

    // -------------------------------------------------------------
    // CHART 2: Changes by Category Distribution - Donut Chart
    // -------------------------------------------------------------
    const cats = data.category_distribution || [];
    this.chartCategories = new Chart(catCanvas, {
      type: 'doughnut',
      data: {
        labels: cats.map(c => c.category),
        datasets: [{
          data: cats.map(c => c.percentage_share),
          backgroundColor: [
            '#00b4d8', // Flooding / Water Bodies (cyan)
            '#10b981', // Deforestation / Clearing (emerald)
            '#a855f7', // Urban Expansion (purple)
            '#ff4d4f'  // Wildfire & Thermal Scar (coral red)
          ],
          hoverBackgroundColor: [
            '#38bdf8',
            '#34d399',
            '#c084fc',
            '#f87171'
          ],
          borderWidth: 2,
          borderColor: '#0b1120'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#cbd5e1',
              font: { size: 10.5, family: 'Plus Jakarta Sans', weight: '500' },
              padding: 10,
              boxWidth: 12,
              boxHeight: 12,
              usePointStyle: false
            }
          },
          tooltip: {
            backgroundColor: 'rgba(7, 10, 18, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (item) => {
                const cat = cats[item.dataIndex];
                return [
                  ` Share: ${cat.percentage_share}% (${cat.area_km2} km²)`,
                  ` Incidents: ${cat.count} recorded events`
                ];
              }
            }
          }
        }
      }
    });

    // -------------------------------------------------------------
    // CHART 3: Priority Changes Over Time - Line & Area Chart
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
            backgroundColor: 'rgba(239, 68, 68, 0.35)',
            tension: 0.35,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            borderWidth: 2.5
          },
          {
            label: 'Moderate Warnings',
            data: pTrends.map(p => p.moderate),
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.08)',
            tension: 0.35,
            fill: false,
            pointRadius: 4.5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#f97316',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            borderWidth: 2.2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const clickedYear = pTrends[index].year;
            this.setTimelineYear(clickedYear);
          }
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: '#cbd5e1',
              font: { size: 10, family: 'Plus Jakarta Sans', weight: '600' },
              boxWidth: 12,
              padding: 10
            }
          },
          tooltip: {
            backgroundColor: 'rgba(7, 10, 18, 0.95)',
            borderColor: '#ef4444',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (item) => {
                const pt = pTrends[item.dataIndex];
                if (item.datasetIndex === 0) {
                  const yoy = pt.critical_yoy_growth > 0 ? ` (+${pt.critical_yoy_growth}% YoY)` : ' (Baseline)';
                  return ` Critical Threats: ${item.raw} events${yoy}`;
                } else {
                  const yoy = pt.moderate_yoy_growth > 0 ? ` (+${pt.moderate_yoy_growth}% YoY)` : ' (Baseline)';
                  return ` Moderate Warnings: ${item.raw} events${yoy}`;
                }
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#94a3b8',
              font: { family: 'JetBrains Mono', size: 11, weight: '600' }
            }
          },
          y: {
            min: 0,
            max: 40,
            ticks: {
              stepSize: 5,
              color: '#94a3b8',
              font: { family: 'JetBrains Mono', size: 10 }
            },
            grid: { color: 'rgba(255, 255, 255, 0.06)' }
          }
        }
      }
    });
  }

  updateChartsActiveYear(year) {
    if (!this.chartArea) return;
    const years = ['2024', '2025', '2026'];

    if (year === 'all') {
      this.chartArea.data.datasets[0].backgroundColor = years.map(() => '#00c5e5');
      this.chartArea.data.datasets[0].borderColor = years.map(() => '#ffffff');
    } else {
      this.chartArea.data.datasets[0].backgroundColor = years.map(y => y === year ? '#00e5ff' : 'rgba(0, 197, 229, 0.3)');
      this.chartArea.data.datasets[0].borderColor = years.map(y => y === year ? '#ffffff' : '#00c5e5');
    }
    this.chartArea.update();
  }

  /* =========================================================================
     FEATURE 3: EXPANDED MULTI-YEAR / DECADE TIMELINE SCRUBBER + PLAYBACK
     ========================================================================= */
  setupTimelineController() {
    const rangeInput = document.getElementById('hist-timeline-range');
    const playBtn = document.getElementById('btn-timeline-play');

    if (rangeInput) {
      rangeInput.addEventListener('input', (e) => {
        this.setTimelineYear(e.target.value);
      });
    }

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.togglePlayback();
      });
    }

    // Epoch chip buttons (2024, 2025, 2026, all)
    ['2024', '2025', '2026', 'all'].forEach(key => {
      const chip = document.getElementById(`t-label-${key}`);
      if (chip) {
        chip.addEventListener('click', () => {
          this.setTimelineYear(key);
        });
      }
    });
  }

  setTimelineYear(year) {
    this.activeYear = String(year);

    const rangeInput = document.getElementById('hist-timeline-range');
    const activeYearNum = document.getElementById('hist-active-year-num');
    const activeYearSub = document.getElementById('hist-active-year-sub');
    const progressBar = document.getElementById('hist-playback-progress');

    if (rangeInput && year !== 'all') rangeInput.value = year;
    if (activeYearNum) activeYearNum.textContent = year === 'all' ? 'ALL' : year;

    // 1. Update chip buttons
    ['2024', '2025', '2026', 'all'].forEach(k => {
      const chip = document.getElementById(`t-label-${k}`);
      if (chip) chip.classList.toggle('active', k === String(year));
    });

    // 2. Update progress bar
    let progressPct = 100;
    if (year === '2024') progressPct = 0;
    else if (year === '2025') progressPct = 50;
    else if (year === '2026') progressPct = 100;
    else if (year === 'all') progressPct = 100;
    if (progressBar) progressBar.style.width = `${progressPct}%`;

    // 3. Highlight active pic-to-pic card
    ['2024', '2025', '2026'].forEach(y => {
      const card = document.getElementById(`pic-card-${y}`);
      if (card) {
        if (year === 'all') {
          card.classList.add('active-card');
        } else {
          card.classList.toggle('active-card', y === String(year));
        }
      }
    });

    // 4. Update stats HUD & Selected Change
    const hs = this.historicalData?.hotspots?.find(h => h.id === this.activeHotspotId);
    if (hs && hs.footprint_evolution) {
      const targetKey = year === 'all' ? '2026' : year;
      const fe = hs.footprint_evolution[targetKey];
      if (fe && activeYearSub) {
        if (year === 'all') {
          activeYearSub.textContent = `3-Year Multi-Temporal Sequence (2024 → 2026)`;
        } else {
          activeYearSub.textContent = `${fe.area_km2} km² · ${fe.label}`;
        }
      }

      this.updateSelectedChange({
        type: hs.primary_hazard,
        period: year === 'all' ? '2024 → 2026' : `2024 → ${year}`,
        area: fe?.area_km2 || hs.total_area_km2,
        severity: year === '2024' ? 'BASELINE' : (year === '2025' ? 'MODERATE' : hs.urgency),
        confidence: '94%',
        velocity: hs.change_velocity || 'Rapid',
        description: year === 'all'
          ? `Complete multi-year trajectory shows ${hs.footprint_expansion_percent || 96.3}% terrain expansion across 3 epochs.`
          : `Surveyed footprint in ${year}: ${fe?.area_km2 || hs.total_area_km2} km² (${fe?.boundary_radius_m || 1400}m perimeter). ${fe?.label || ''}.`
      });
    }

    // 5. Update chart highlighting
    this.updateChartsActiveYear(year);

    // 6. Refresh vector difference / impact overlays if active
    if (this.comparisonMode === 'difference' || this.comparisonMode === 'impact') {
      this.renderDifferenceLayer();
      if (this.comparisonMode === 'impact') this.renderImpactLayer();
    }
  }

  togglePlayback() {
    this.isPlaying = !this.isPlaying;
    const playIcon = document.getElementById('hist-play-icon');
    const playText = document.getElementById('hist-play-text');

    if (this.isPlaying) {
      if (playIcon) playIcon.textContent = '⏸';
      if (playText) playText.textContent = 'PAUSE';

      const sequence = ['2024', '2025', '2026'];
      let currentIdx = sequence.indexOf(this.activeYear);
      if (currentIdx === -1) currentIdx = 0;

      this.playInterval = setInterval(() => {
        currentIdx = (currentIdx + 1) % sequence.length;
        this.setTimelineYear(sequence[currentIdx]);
      }, 1500);
    } else {
      if (playIcon) playIcon.textContent = '▶';
      if (playText) playText.textContent = 'PLAY TIMELINE';
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
  }

  /* =========================================================================
     FEATURE 4: MODE SWITCHER (PIC-TO-PIC, DIFFERENCE, IMPACT)
     ========================================================================= */
  setupModeSwitcher() {
    const modeBtns = document.querySelectorAll('.hist-mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setComparisonMode(btn.dataset.mode);
      });
    });

    const btnInspectImpact = document.getElementById('btn-inspect-view-impact');
    if (btnInspectImpact) {
      btnInspectImpact.addEventListener('click', () => {
        const impactBtn = document.getElementById('hist-btn-mode-impact');
        if (impactBtn) impactBtn.click();
      });
    }
  }

  setComparisonMode(mode) {
    this.comparisonMode = mode;

    const diffOverlay = document.getElementById('hist-difference-overlay');
    const impactOverlay = document.getElementById('hist-impact-overlay');
    const legend = document.getElementById('hist-semantic-legend');

    if (mode === 'gallery') {
      if (diffOverlay) diffOverlay.style.display = 'none';
      if (impactOverlay) impactOverlay.style.display = 'none';
      if (legend) legend.style.display = 'none';
    } else if (mode === 'difference') {
      if (diffOverlay) diffOverlay.style.display = 'block';
      if (impactOverlay) impactOverlay.style.display = 'none';
      if (legend) legend.style.display = 'flex';
      this.renderDifferenceLayer();
    } else if (mode === 'impact') {
      if (diffOverlay) diffOverlay.style.display = 'block';
      if (impactOverlay) impactOverlay.style.display = 'block';
      if (legend) legend.style.display = 'flex';
      this.renderDifferenceLayer();
      this.renderImpactLayer();
    }
  }

  renderDifferenceLayer() {
    const svg = document.getElementById('hist-diff-svg');
    if (!svg || !this.historicalData) return;
    svg.innerHTML = '';

    const hs = this.historicalData.hotspots.find(h => h.id === this.activeHotspotId);
    if (!hs) return;

    const polygons = this.getPolygonsForHotspot(this.activeHotspotId);

    polygons.forEach((poly) => {
      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      pathEl.setAttribute('points', poly.points);
      pathEl.setAttribute('fill', poly.fill);
      pathEl.setAttribute('stroke', poly.stroke);
      pathEl.setAttribute('stroke-width', '2');
      pathEl.setAttribute('stroke-dasharray', poly.dash || 'none');
      pathEl.style.cursor = 'pointer';
      pathEl.style.transition = 'all 0.2s';

      pathEl.addEventListener('mouseenter', () => {
        pathEl.setAttribute('stroke-width', '3');
        pathEl.setAttribute('fill-opacity', '0.6');
      });

      pathEl.addEventListener('mouseleave', () => {
        pathEl.setAttribute('stroke-width', '2');
        pathEl.setAttribute('fill-opacity', '0.35');
      });

      pathEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.updateSelectedChange({
          type: poly.label,
          period: '2024 → 2026',
          area: poly.area,
          severity: poly.severity,
          confidence: '95.4%',
          velocity: hs.change_velocity || 'Rapid',
          description: poly.description
        });
      });

      svg.appendChild(pathEl);
    });
  }

  getPolygonsForHotspot(id) {
    if (id === 'hotspot-alpha') {
      return [
        {
          points: '120,80 340,110 520,290 410,480 210,460 90,260',
          fill: 'rgba(6, 182, 212, 0.35)',
          stroke: '#06b6d4',
          label: 'Primary Inundation Fan (Wadi Derna Surge)',
          area: '24.2 km²',
          severity: 'CRITICAL',
          description: 'Catastrophic river surge channel overflowing primary earth retaining wall.'
        },
        {
          points: '510,280 720,220 890,380 780,510 580,450',
          fill: 'rgba(239, 68, 68, 0.4)',
          stroke: '#ef4444',
          label: 'Urban Residential Structural Scour',
          area: '14.4 km²',
          severity: 'CRITICAL',
          description: 'High-velocity flow eroded multi-story municipal blocks and access bridges.'
        }
      ];
    } else if (id === 'hotspot-bravo') {
      return [
        {
          points: '160,50 480,90 420,380 120,340',
          fill: 'rgba(16, 185, 129, 0.35)',
          stroke: '#10b981',
          label: 'Fishbone Secondary Logging Track Alpha',
          area: '28.1 km²',
          severity: 'CRITICAL',
          description: 'Commercial logging lateral cuts penetrating indigenous buffer boundary.'
        },
        {
          points: '490,140 840,180 790,520 450,470',
          fill: 'rgba(249, 115, 22, 0.35)',
          stroke: '#f97316',
          label: 'Clear-Cut Agricultural Pasture Conversion',
          area: '16.1 km²',
          severity: 'MODERATE',
          description: 'Secondary burning and clear-felling for cattle ranching.'
        }
      ];
    } else if (id === 'hotspot-delta') {
      return [
        {
          points: '200,120 540,160 620,440 280,490 150,310',
          fill: 'rgba(239, 68, 68, 0.45)',
          stroke: '#ef4444',
          label: 'Canopy Crown Burn Scar (High Severity)',
          area: '12.8 km²',
          severity: 'CRITICAL',
          description: 'Complete timber canopy consumption threatening mountain ridge settlement.'
        },
        {
          points: '550,170 880,240 820,530 590,460',
          fill: 'rgba(249, 115, 22, 0.35)',
          stroke: '#f97316',
          label: 'Understory Heat Plume & Spotting Buffer',
          area: '7.0 km²',
          severity: 'MODERATE',
          description: 'Radiative embers driven by canyon wind gusts along Highway 70.'
        }
      ];
    } else {
      // Madurai default (hotspot-charlie)
      return [
        {
          points: '220,140 560,120 640,360 380,440 190,320',
          fill: 'rgba(168, 85, 247, 0.35)',
          stroke: '#a855f7',
          label: 'Bypass Expressway Commercial Corridor',
          area: '12.8 km²',
          severity: 'MODERATE',
          description: 'Conversion of agricultural wetlands to asphalt logistics and bypass corridors.'
        },
        {
          points: '580,220 860,260 810,510 520,460',
          fill: 'rgba(249, 115, 22, 0.35)',
          stroke: '#f97316',
          label: 'Groundwater Catchment Percolation Loss',
          area: '8.6 km²',
          severity: 'MODERATE',
          description: 'Paddy field filling reducing local groundwater aquifer recharge.'
        }
      ];
    }
  }

  renderImpactLayer() {
    const pinsContainer = document.getElementById('hist-impact-pins');
    if (!pinsContainer || !this.historicalData) return;
    pinsContainer.innerHTML = '';

    const facilities = [
      { id: 'f-1', name: 'Settlement Alpha', type: 'settlement', icon: '🏘️', x: 28, y: 35, status: 'Potentially Affected' },
      { id: 'f-2', name: 'Primary School 04', type: 'school', icon: '🏫', x: 42, y: 55, status: 'Potentially Affected' },
      { id: 'f-3', name: 'Regional Clinic', type: 'hospital', icon: '🏥', x: 65, y: 40, status: 'Potentially Affected' },
      { id: 'f-4', name: 'Bypass Bridge Link', type: 'road', icon: '🛣️', x: 74, y: 68, status: 'Potentially Affected' }
    ];

    facilities.forEach(f => {
      const pin = document.createElement('div');
      pin.className = 'impact-facility-pin';
      pin.style.left = `${f.x}%`;
      pin.style.top = `${f.y}%`;
      pin.title = `${f.name} — ${f.status}`;
      pin.innerHTML = `
        <span class="pin-symbol">${f.icon}</span>
        <span class="pin-tooltip">${f.name}<br><em>${f.status}</em></span>
      `;

      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        this.updateSelectedChange({
          type: `Nearby Asset: ${f.name}`,
          period: '2024 → 2026',
          area: '2.5 km perimeter',
          severity: 'POTENTIALLY AFFECTED',
          confidence: '95%',
          velocity: 'Monitored',
          description: `${f.name} (${f.status}) identified within spatial buffer via GIS heuristics.`
        });
      });

      pinsContainer.appendChild(pin);
    });
  }

  /* =========================================================================
     FEATURE 5: HOTSPOT INVESTIGATION & SYNCHRONIZATION
     ========================================================================= */
  setupHotspotsList() {
    const select = document.getElementById('hist-region-select');
    if (select) {
      select.addEventListener('change', (e) => {
        this.loadHotspot(e.target.value);
      });
    }

    const items = document.querySelectorAll('.hotspot-clean-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const hsId = item.dataset.hotspot;
        if (hsId) {
          this.loadHotspot(hsId);
          if (select) select.value = hsId;
        }
      });
    });
  }

  loadHotspot(hotspotId) {
    if (!this.historicalData || !this.historicalData.hotspots) return;
    const hs = this.historicalData.hotspots.find(h => h.id === hotspotId);
    if (!hs) return;

    this.activeHotspotId = hotspotId;

    // 1. Update Title & Header
    const titleEl = document.getElementById('hist-header-title');
    const subEl = document.getElementById('hist-header-sub');
    if (titleEl) titleEl.textContent = hs.name;
    if (subEl) subEl.textContent = `2024 → 2026 · ${hs.region} · Tracked Since ${hs.active_since || '2024'}`;

    // 2. Update Pic-to-Pic Gallery Images & Metrics
    this.updatePicGallery(hs);

    // 3. Update Hotspots Clean List Active Class
    document.querySelectorAll('.hotspot-clean-item').forEach(item => {
      item.classList.toggle('active', item.dataset.hotspot === hotspotId);
    });

    // 4. Update Footprint Evolution Data in Column 1
    const fpGrowth = document.getElementById('hs-footprint-growth');
    const fp2024 = document.getElementById('fp-val-2024');
    const fp2025 = document.getElementById('fp-val-2025');
    const fp2026 = document.getElementById('fp-val-2026');
    const rad2024 = document.getElementById('fp-rad-2024');
    const rad2025 = document.getElementById('fp-rad-2025');
    const rad2026 = document.getElementById('fp-rad-2026');

    const fe = hs.footprint_evolution || {};
    if (fpGrowth) fpGrowth.textContent = `Footprint change: +${hs.footprint_expansion_percent || 96.3}%`;

    if (fe['2024']) {
      if (fp2024) fp2024.textContent = `${fe['2024'].area_km2} km²`;
      if (rad2024) rad2024.textContent = `${fe['2024'].boundary_radius_m}m radius`;
    }
    if (fe['2025']) {
      if (fp2025) fp2025.textContent = `${fe['2025'].area_km2} km²`;
      if (rad2025) rad2025.textContent = `${fe['2025'].boundary_radius_m}m radius`;
    }
    if (fe['2026']) {
      if (fp2026) fp2026.textContent = `${fe['2026'].area_km2} km²`;
      if (rad2026) rad2026.textContent = `${fe['2026'].boundary_radius_m}m radius`;
    }

    // 5. Update Selected Change Card
    this.updateSelectedChange({
      type: hs.primary_hazard,
      period: '2024 → 2026',
      area: hs.total_area_km2,
      severity: hs.urgency,
      confidence: '94.2%',
      velocity: hs.change_velocity || 'Rapid',
      description: hs.critical_infrastructure_risk || 'Multispectral change detection confirms rapid land-cover transformation.'
    });

    // 6. Update Potential Impact Card
    const hci = hs.historical_community_impact || {};
    const imp2026 = hci['2026'] || { settlements: 4, schools: 2, hospitals: 1, roads: 5 };

    const countSettlements = document.getElementById('imp-count-settlements');
    const countSchools = document.getElementById('imp-count-schools');
    const countHospitals = document.getElementById('imp-count-hospitals');
    const countRoads = document.getElementById('imp-count-roads');
    const countAgri = document.getElementById('imp-count-agri');

    if (countSettlements) countSettlements.textContent = imp2026.settlements || 4;
    if (countSchools) countSchools.textContent = imp2026.schools || 2;
    if (countHospitals) countHospitals.textContent = imp2026.hospitals || 1;
    if (countRoads) countRoads.textContent = imp2026.roads || 5;
    if (countAgri) countAgri.textContent = `${(hs.total_area_km2 * 0.22).toFixed(1)} km²`;

    // 7. Refresh overlays
    this.setComparisonMode(this.comparisonMode);
  }

  updateSelectedChange(info) {
    const typeEl = document.getElementById('sel-change-type');
    const periodEl = document.getElementById('sel-change-period');
    const areaEl = document.getElementById('sel-change-area');
    const sevEl = document.getElementById('sel-change-severity');
    const confEl = document.getElementById('sel-change-confidence');
    const velEl = document.getElementById('sel-change-velocity');
    const descEl = document.getElementById('sel-change-description');

    if (typeEl && info.type) typeEl.textContent = info.type;
    if (periodEl && info.period) periodEl.textContent = `Observation Period: ${info.period}`;
    if (areaEl && info.area) areaEl.textContent = typeof info.area === 'number' ? `${info.area} km²` : info.area;
    if (sevEl && info.severity) {
      sevEl.textContent = info.severity;
      sevEl.className = `m-val ${info.severity === 'CRITICAL' ? 'text-red' : (info.severity === 'BASELINE' ? 'text-cyan' : 'text-orange')}`;
    }
    if (confEl && info.confidence) confEl.textContent = info.confidence;
    if (velEl && info.velocity) velEl.textContent = info.velocity;
    if (descEl && info.description) descEl.textContent = info.description;
  }

  /* =========================================================================
     FEATURE 6: EVIDENCE SNAPSHOT & EXECUTIVE DOSSIER
     ========================================================================= */
  setupEvidenceActions() {
    const btnSaveTop = document.getElementById('btn-hist-save-evidence');
    const btnSaveAlt = document.getElementById('btn-save-evidence-alt');
    const btnDossierTop = document.getElementById('btn-hist-open-dossier');
    const btnDossierCta = document.getElementById('btn-generate-dossier-primary');

    if (btnSaveTop) btnSaveTop.addEventListener('click', () => this.saveEvidenceSnapshot());
    if (btnSaveAlt) btnSaveAlt.addEventListener('click', () => this.saveEvidenceSnapshot());

    if (btnDossierTop) btnDossierTop.addEventListener('click', () => this.generateExecutiveDossier());
    if (btnDossierCta) btnDossierCta.addEventListener('click', () => this.generateExecutiveDossier());
  }

  saveEvidenceSnapshot() {
    const hs = this.historicalData?.hotspots?.find(h => h.id === this.activeHotspotId);
    if (!hs) return;

    const snapshot = {
      id: Math.floor(1000 + Math.random() * 9000),
      timestamp: new Date().toISOString(),
      hotspotId: this.activeHotspotId,
      location: hs.name,
      region: hs.region,
      period: '2024 → 2026',
      hazard: hs.primary_hazard,
      area_km2: hs.total_area_km2,
      severity: hs.urgency,
      confidence: '95.4%',
      beforeImg: hs.sample_before_image,
      midImg: hs.sample_mid_image,
      afterImg: hs.sample_after_image,
      year: this.activeYear
    };

    this.savedEvidence.unshift(snapshot);
    localStorage.setItem('earthlens_saved_evidence', JSON.stringify(this.savedEvidence));
    this.renderEvidenceShelf();

    // Visual feedback
    const btn = document.getElementById('btn-hist-save-evidence');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '<span>✓ Snapshot Saved</span>';
      btn.style.background = 'rgba(16, 185, 129, 0.4)';
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.style.background = '';
      }, 1500);
    }
  }

  restoreEvidenceShelf() {
    try {
      const saved = localStorage.getItem('earthlens_saved_evidence');
      if (saved) {
        this.savedEvidence = JSON.parse(saved);
        this.renderEvidenceShelf();
      }
    } catch (e) {
      this.savedEvidence = [];
    }
  }

  renderEvidenceShelf() {
    const container = document.getElementById('evidence-shelf-items');
    const badge = document.getElementById('evidence-shelf-count');
    if (!container) return;

    if (badge) badge.textContent = `${this.savedEvidence.length} Captured`;

    if (this.savedEvidence.length === 0) {
      container.innerHTML = '<div class="shelf-empty-hint">No snapshots captured yet.<br>Click "Save Evidence" to record current satellite findings.</div>';
      return;
    }

    container.innerHTML = '';
    this.savedEvidence.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'evidence-item-card';
      card.innerHTML = `
        <img src="${item.afterImg || item.beforeImg}" alt="Evidence Thumbnail" class="ev-thumb">
        <div class="ev-info">
          <div class="ev-loc">${item.location}</div>
          <div class="ev-sub">${item.period} · ${item.hazard}</div>
        </div>
        <button class="ev-btn-del" title="Remove snapshot">✕</button>
      `;

      card.querySelector('.ev-btn-del').addEventListener('click', (e) => {
        e.stopPropagation();
        this.savedEvidence.splice(idx, 1);
        localStorage.setItem('earthlens_saved_evidence', JSON.stringify(this.savedEvidence));
        this.renderEvidenceShelf();
      });

      container.appendChild(card);
    });
  }

  generateExecutiveDossier() {
    const datasetMap = {
      'hotspot-alpha': 'derna_flooding',
      'hotspot-bravo': 'amazon_deforestation',
      'hotspot-charlie': 'madurai_urban',
      'hotspot-delta': 'california_wildfire'
    };
    const datasetId = datasetMap[this.activeHotspotId] || 'madurai_urban';

    if (window.reportsGeneratorModule) {
      window.reportsGeneratorModule.generateReport(datasetId, []);
    }

    // Switch view to Executive Reports Panel
    const reportNavBtn = document.querySelector('[data-nav="reports"]');
    if (reportNavBtn) {
      reportNavBtn.click();
    } else {
      const panels = document.querySelectorAll('.workspace-overlay-panel');
      panels.forEach(p => p.style.display = 'none');
      const repPanel = document.getElementById('panel-reports');
      if (repPanel) repPanel.style.display = 'block';
    }
  }

  /* =========================================================================
     FEATURE 7: HIGH-RESOLUTION INSPECT LIGHTBOX MODAL
     ========================================================================= */
  setupInspectModal() {
    const modal = document.getElementById('hist-inspect-modal');
    const backdrop = document.getElementById('hist-inspect-backdrop');
    const closeBtn = document.getElementById('btn-inspect-close');
    const saveBtn = document.getElementById('btn-modal-save-evidence');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeInspectModal());
    }
    if (backdrop) {
      backdrop.addEventListener('click', () => this.closeInspectModal());
    }
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveEvidenceSnapshot();
        this.closeInspectModal();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
        this.closeInspectModal();
      }
    });
  }

  openInspectModal(targetImgId, epoch) {
    const modal = document.getElementById('hist-inspect-modal');
    const modalImg = document.getElementById('hist-modal-img');
    const modalEpoch = document.getElementById('modal-epoch-badge');
    const modalTitle = document.getElementById('modal-title');
    const modalMeta = document.getElementById('modal-meta-info');
    const modalCaption = document.getElementById('modal-caption');

    const sourceImg = document.getElementById(targetImgId);
    const hs = this.historicalData?.hotspots?.find(h => h.id === this.activeHotspotId);

    if (!modal || !modalImg || !sourceImg || !hs) return;

    modalImg.src = sourceImg.src;
    if (modalEpoch) modalEpoch.textContent = `${epoch} OBSERVATION EPOCH`;
    if (modalTitle) modalTitle.textContent = `${hs.name} (${epoch})`;

    const sensors = {
      '2024': 'Sentinel-2 MSI (10m Optical) · Multi-Spectral Level-2A',
      '2025': 'Landsat-9 OLI-2 (15m Pan-Sharpened) · Surface Reflectance',
      '2026': 'Sentinel-2 MSI (10m Optical) · High-Revisit Multi-Band Surveillance'
    };
    if (modalMeta) modalMeta.textContent = sensors[epoch] || 'Copernicus Sentinel-2';

    const fe = hs.footprint_evolution?.[epoch];
    if (modalCaption && fe) {
      modalCaption.textContent = `Footprint: ${fe.area_km2} km² · Radius: ${fe.boundary_radius_m}m · ${fe.label}`;
    }

    modal.style.display = 'flex';
  }

  closeInspectModal() {
    const modal = document.getElementById('hist-inspect-modal');
    if (modal) modal.style.display = 'none';
  }
}

// Instantiate global module instance
window.historicalAnalyticsModule = new HistoricalAnalyticsModule();
