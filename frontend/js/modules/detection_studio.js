/**
 * EarthGuard AI — Feature 1 Frontend: Detection Studio & Visualizer
 * Owned by: MEMBER 1 (Satellite Change Detection & Observation Studio)
 * Handles: Side-by-Side Dual View, Curtain Swipe Slider, Canvases, Heatmap & Custom Upload
 */

export const DetectionStudio = {
  curtainPos: 50,
  isDraggingCurtain: false,
  comparisonMode: 'dual',

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.setupCanvases();
  },

  cacheDOM() {
    this.btnModeDual = document.getElementById('btn-mode-dual');
    this.btnModeCurtain = document.getElementById('btn-mode-curtain');
    this.btnModeDiff = document.getElementById('btn-mode-diff');
    this.chkLayerHeatmap = document.getElementById('chk-layer-heatmap');
    this.rngLayerOpacity = document.getElementById('rng-layer-opacity');
    this.chkLayerVectors = document.getElementById('chk-layer-vectors');

    this.stageDualView = document.getElementById('stage-dual-view');
    this.stageCurtainView = document.getElementById('stage-curtain-view');
    this.curtainStageWrapper = document.getElementById('curtain-stage-wrapper');
    this.curtainDividerLine = document.getElementById('curtain-divider-line');
    this.curtainClippedBox = document.getElementById('curtain-clipped-box');

    this.imgDualBefore = document.getElementById('img-dual-before');
    this.imgDualAfter = document.getElementById('img-dual-after');
    this.imgDualHeatmap = document.getElementById('img-dual-heatmap');
    this.dualVectorCanvas = document.getElementById('dual-vector-canvas');

    this.imgCurtainBefore = document.getElementById('img-curtain-before');
    this.imgCurtainAfter = document.getElementById('img-curtain-after');
    this.imgCurtainHeatmap = document.getElementById('img-curtain-heatmap');
    this.curtainVectorCanvas = document.getElementById('curtain-vector-canvas');

    this.lblDualBeforeDate = document.getElementById('lbl-dual-before-date');
    this.lblDualAfterDate = document.getElementById('lbl-dual-after-date');
    this.pillCurtainBefore = document.getElementById('pill-curtain-before');
    this.pillCurtainAfter = document.getElementById('pill-curtain-after');
    this.stageAoiTitle = document.getElementById('stage-aoi-title');
    this.stageAoiCoords = document.getElementById('stage-aoi-coords');
    this.studioRadarLine = document.getElementById('studio-radar-line');
  },

  bindEvents() {
    this.btnModeDual.addEventListener('click', () => this.setMode('dual'));
    this.btnModeCurtain.addEventListener('click', () => this.setMode('curtain'));
    this.btnModeDiff.addEventListener('click', () => this.setMode('diff'));

    this.chkLayerHeatmap.addEventListener('change', () => this.updateHeatmapVisibility());
    this.rngLayerOpacity.addEventListener('input', () => this.updateHeatmapVisibility());
    this.chkLayerVectors.addEventListener('change', () => this.drawCanvases());

    this.setupCurtainDragging();
  },

  setupCurtainDragging() {
    const onMove = (e) => {
      if (!this.isDraggingCurtain) return;
      const rect = this.curtainStageWrapper.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      if (!clientX) return;
      const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      this.setCurtainPos(pct);
    };

    const onStop = () => {
      this.isDraggingCurtain = false;
    };

    this.curtainDividerLine.addEventListener('mousedown', (e) => {
      this.isDraggingCurtain = true;
      e.preventDefault();
    });
    this.curtainDividerLine.addEventListener('touchstart', () => {
      this.isDraggingCurtain = true;
    });

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('mouseup', onStop);
    window.addEventListener('touchend', onStop);

    this.setCurtainPos(50);
  },

  setCurtainPos(pct) {
    this.curtainPos = pct;
    this.curtainDividerLine.style.left = `${pct}%`;
    this.curtainClippedBox.style.clipPath = `polygon(${pct}% 0, 100% 0, 100% 100%, ${pct}% 100%)`;
  },

  setMode(mode) {
    this.comparisonMode = mode;
    this.btnModeDual.classList.toggle('active', mode === 'dual');
    this.btnModeCurtain.classList.toggle('active', mode === 'curtain');
    this.btnModeDiff.classList.toggle('active', mode === 'diff');

    if (mode === 'dual') {
      this.stageDualView.style.display = 'flex';
      this.stageCurtainView.style.display = 'none';
      this.updateHeatmapVisibility();
    } else if (mode === 'curtain') {
      this.stageDualView.style.display = 'none';
      this.stageCurtainView.style.display = 'block';
    } else if (mode === 'diff') {
      this.stageDualView.style.display = 'flex';
      this.stageCurtainView.style.display = 'none';
      this.chkLayerHeatmap.checked = true;
      this.updateHeatmapVisibility();
    }

    this.resizeCanvases();
    this.drawCanvases();
  },

  updateHeatmapVisibility() {
    const isVisible = this.chkLayerHeatmap.checked;
    const opacity = this.rngLayerOpacity.value / 100;

    this.imgDualHeatmap.style.display = isVisible ? 'block' : 'none';
    this.imgDualHeatmap.style.opacity = opacity;

    this.imgCurtainHeatmap.style.display = isVisible ? 'block' : 'none';
    this.imgCurtainHeatmap.style.opacity = opacity;
  },

  setupCanvases() {
    window.addEventListener('resize', () => {
      this.resizeCanvases();
      this.drawCanvases();
    });

    const handleClick = (e, canvas) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = clickX * scaleX;
      const y = clickY * scaleY;

      const data = window.EarthGuardState?.analysisData;
      if (!data || !data.ranked_zones) return;

      for (const zone of data.ranked_zones) {
        const [bx, by, bw, bh] = zone.bbox;
        if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
          window.dispatchEvent(new CustomEvent('earthguard:zone-selected', { detail: zone }));
          return;
        }
      }
    };

    this.dualVectorCanvas.addEventListener('click', (e) => handleClick(e, this.dualVectorCanvas));
    this.curtainVectorCanvas.addEventListener('click', (e) => handleClick(e, this.curtainVectorCanvas));
  },

  resizeCanvases() {
    const data = window.EarthGuardState?.analysisData;
    const imgW = data?.image_dimensions?.width || 800;
    const imgH = data?.image_dimensions?.height || 800;
    
    this.dualVectorCanvas.width = imgW;
    this.dualVectorCanvas.height = imgH;
    this.curtainVectorCanvas.width = imgW;
    this.curtainVectorCanvas.height = imgH;
  },

  drawCanvases() {
    this.renderCanvas(this.dualVectorCanvas);
    this.renderCanvas(this.curtainVectorCanvas);
  },

  renderCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!this.chkLayerVectors.checked) return;
    const data = window.EarthGuardState?.analysisData;
    if (!data || !data.ranked_zones) return;

    const zones = data.ranked_zones;
    const settlement = data.dataset_metadata?.settlement_center;
    const selectedZone = window.EarthGuardState?.selectedZone;

    // Draw Settlement Anchor
    if (settlement && settlement.x) {
      ctx.save();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(settlement.x, settlement.y, settlement.radius || 80, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(settlement.x, settlement.y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 12px "JetBrains Mono"';
      ctx.fillStyle = '#06b6d4';
      ctx.fillText(`⌖ ${settlement.name || 'Community'}`, settlement.x + 10, settlement.y + 4);
      ctx.restore();
    }

    // Draw Contours and Bounding Boxes
    zones.forEach(zone => {
      const isSelected = selectedZone && selectedZone.zone_id === zone.zone_id;
      const [x, y, w, h] = zone.bbox;
      const color = zone.tier_color || '#ef4444';

      ctx.save();

      if (zone.polygon && zone.polygon.length > 2) {
        ctx.beginPath();
        ctx.moveTo(zone.polygon[0][0], zone.polygon[0][1]);
        for (let i = 1; i < zone.polygon.length; i++) {
          ctx.lineTo(zone.polygon[i][0], zone.polygon[i][1]);
        }
        ctx.closePath();

        ctx.fillStyle = isSelected ? `${color}44` : `${color}18`;
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = isSelected ? 3 : 1.5;
        if (isSelected) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 14;
        }
        ctx.stroke();
      }

      ctx.strokeStyle = isSelected ? '#ffffff' : color;
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(x, y, w, h);

      const label = `${zone.zone_id} [${zone.urgency_score}]`;
      ctx.font = 'bold 11px "JetBrains Mono"';
      const textWidth = ctx.measureText(label).width;

      ctx.fillStyle = isSelected ? '#ffffff' : color;
      ctx.fillRect(x, Math.max(0, y - 18), textWidth + 8, 18);

      ctx.fillStyle = isSelected ? '#000000' : '#ffffff';
      ctx.fillText(label, x + 4, Math.max(12, y - 5));

      if (isSelected && settlement && settlement.x) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h / 2);
        ctx.lineTo(settlement.x, settlement.y);
        ctx.stroke();
      }

      ctx.restore();
    });
  },

  renderDataset(data) {
    const meta = data.dataset_metadata || {};
    this.lblDualBeforeDate.textContent = meta.date_before || 'BASELINE';
    this.lblDualAfterDate.textContent = meta.date_after || 'OBSERVED';
    this.pillCurtainBefore.textContent = `BEFORE: ${meta.date_before || 'BASELINE'}`;
    this.pillCurtainAfter.textContent = `AFTER: ${meta.date_after || 'OBSERVED'}`;

    this.stageAoiTitle.textContent = meta.title || 'Observation Area';
    const coords = meta.coordinates || { lat: 0, lon: 0 };
    this.stageAoiCoords.textContent = `LAT: ${coords.lat.toFixed(4)} | LON: ${coords.lon.toFixed(4)}`;

    this.imgDualBefore.src = data.before_image_url;
    this.imgDualAfter.src = data.after_image_url;
    this.imgDualHeatmap.src = data.heatmap_overlay;

    this.imgCurtainBefore.src = data.before_image_url;
    this.imgCurtainAfter.src = data.after_image_url;
    this.imgCurtainHeatmap.src = data.heatmap_overlay;

    this.updateHeatmapVisibility();
    this.resizeCanvases();
    this.drawCanvases();
  }
};
