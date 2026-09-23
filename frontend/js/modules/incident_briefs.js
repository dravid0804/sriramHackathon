/**
 * EarthGuard AI — Feature 3 Frontend: Confidence Transparency & AI Incident Briefings
 * Owned by: MEMBER 3 (Confidence Transparency & AI Incident Response Briefings)
 * Handles: AI Briefing card, Voice Speech Synthesis (Read Aloud), Field Checklist & Executive Docket
 */

export const IncidentBriefs = {
  init() {
    this.cacheDOM();
    this.bindEvents();
  },

  cacheDOM() {
    this.inspConfBadge = document.getElementById('insp-conf-badge');
    this.inspConfPct = document.getElementById('insp-conf-pct');
    this.inspConfReason = document.getElementById('insp-conf-reason');

    this.inspBriefWindow = document.getElementById('insp-brief-window');
    this.inspBriefText = document.getElementById('insp-brief-text');
    this.inspActionPill = document.getElementById('insp-action-pill');
    this.btnAudioBrief = document.getElementById('btn-audio-brief');
    this.inspSignatureText = document.getElementById('insp-signature-text');

    this.btnAuthorizeDispatch = document.getElementById('btn-authorize-dispatch');
    this.docketPrintableBox = document.getElementById('docket-printable-box');
  },

  bindEvents() {
    this.btnAudioBrief.addEventListener('click', () => {
      const zone = window.EarthGuardState?.selectedZone;
      if (!zone) return;
      const text = zone.incident_brief?.brief_text || 'No operational brief available.';
      this.speakBrief(text);
    });

    this.btnAuthorizeDispatch.addEventListener('click', () => {
      this.btnAuthorizeDispatch.classList.add('dispatched');
      this.btnAuthorizeDispatch.innerHTML = '<span>✓ Dispatched / En Route</span>';
    });
  },

  speakBrief(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.05;
      u.pitch = 1.0;
      window.speechSynthesis.speak(u);
    } else {
      alert('Browser speech synthesis is not supported in this environment.');
    }
  },

  renderZoneBriefing(zone) {
    if (!zone) return;

    const conf = zone.confidence || {};
    const brief = zone.incident_brief || {};
    const cls = zone.classification || {};

    // Confidence
    this.inspConfBadge.textContent = `● ${conf.percentage || 95}% ${conf.level || 'High Conf'}`;
    this.inspConfBadge.style.color = zone.tier_color;
    this.inspConfPct.textContent = `${conf.percentage || 95}% RATING`;
    this.inspConfReason.textContent = conf.reason || 'Atmospheric clarity optimal; verified spectral delta.';

    // Briefing
    this.inspBriefWindow.textContent = brief.timeline || 'Immediate (0-48h)';
    this.inspBriefText.textContent = brief.brief_text || 'Operational brief under generation.';
    this.inspActionPill.innerHTML = `<strong>Directive:</strong> ${brief.recommended_action || 'Continue observation.'}`;
    this.inspSignatureText.textContent = cls.signature || 'Spectral shift detected.';

    // Reset dispatch button
    this.btnAuthorizeDispatch.classList.remove('dispatched');
    this.btnAuthorizeDispatch.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
      <span>Authorize &amp; Dispatch Field Unit</span>
    `;
  },

  renderDocket(data) {
    const meta = data.dataset_metadata || {};
    const t = data.telemetry || {};
    const zones = data.ranked_zones || [];
    const criticals = zones.filter(z => z.tier === 'CRITICAL');

    this.docketPrintableBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--border-medium); padding-bottom: 16px;">
        <div>
          <h1 style="font-size: 1.4rem; font-weight: 800; color: #fff;">EXECUTIVE INCIDENT DISPATCH BRIEFING</h1>
          <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 4px;">
            MISSION ID: <strong>EGUARD-DISPATCH-${Date.now().toString().slice(-6)}</strong> | SECURITY LEVEL: <strong>RESTRICTED</strong>
          </div>
        </div>
        <div style="text-align: right;">
          <button class="btn-header-action btn-accent" onclick="window.print()">Print / PDF</button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0;">
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 14px; border-radius: var(--radius-sm); text-align: center;">
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--crimson-hazard);">${t.critical_count || 0}</div>
          <div style="font-size: 0.68rem; color: var(--text-dim);">CRITICAL THREATS</div>
        </div>
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 14px; border-radius: var(--radius-sm); text-align: center;">
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--amber-warn);">${t.moderate_count || 0}</div>
          <div style="font-size: 0.68rem; color: var(--text-dim);">MODERATE SURVEILLANCE</div>
        </div>
        <div style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); padding: 14px; border-radius: var(--radius-sm); text-align: center;">
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--cyan-primary);">${t.total_hectares_impacted || 0} ha</div>
          <div style="font-size: 0.68rem; color: var(--text-dim);">IMPACTED FOOTPRINT</div>
        </div>
      </div>

      <h2 style="font-size: 1rem; color: #fff; margin-top: 10px;">TARGET RECONNAISSANCE DIRECTIVES</h2>
      ${criticals.map(z => `
        <div style="background: rgba(255, 255, 255, 0.02); border-left: 3px solid var(--crimson-hazard); padding: 12px; border-radius: 4px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; color: var(--crimson-hazard); margin-bottom: 4px;">
            <span>${z.zone_id} // ${z.classification?.type} (Urgency: ${z.urgency_score})</span>
            <span>Window: ${z.incident_brief?.timeline}</span>
          </div>
          <p style="margin: 0 0 6px 0; font-size: 0.8rem; color: #cbd5e1; line-height: 1.5;">${z.incident_brief?.brief_text}</p>
          <div style="font-size: 0.75rem; color: #fca5a5;"><strong>Action:</strong> ${z.incident_brief?.recommended_action}</div>
        </div>
      `).join('')}
    `;
  }
};
