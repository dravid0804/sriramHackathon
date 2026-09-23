/**
 * EarthLens AI — Government Multi-Tenant & Operational Action Module
 * Handles Tenant Switching, Government Portal Dashboard, Action Center,
 * Response Case Lifecycle, and Map Synchronization.
 */

class GovernmentPortalModule {
  constructor() {
    this.activeTenantId = 'org-sdma';
    this.activeDepartmentId = 'dept-sdma-dm';
    this.activeRegionId = 'reg-derna-01';
    this.tenants = [];
    this.activeTenant = null;
    this.cases = [];
    this.actionCenterData = null;
    this.notifications = [];
  }

  async init() {
    await this.loadTenants();
    this.setupOrgSwitcher();
    this.setupNotificationCenter();
    this.setupDrawerResponseIntegration();
    this.setupFilters();
    this.setupInternalTabs();

    // Load initial views
    await this.renderPortalDashboard();
    await this.renderActionCenter();
    await this.renderResponseCases();
    await this.loadNotifications();

    console.log('Government Multi-Tenant Module initialized successfully.');
  }

  setupInternalTabs() {
    const tabs = document.querySelectorAll('.gov-internal-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const key = tab.dataset.govtab;
        this.switchInternalGovTab(key);
      });
    });

    document.getElementById('gov-btn-open-live-map')?.addEventListener('click', () => {
      if (window.earthLensApp) {
        window.earthLensApp.switchWorkspace('live-map');
      }
    });
  }

  switchInternalGovTab(tabKey) {
    document.querySelectorAll('.gov-internal-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.govtab === tabKey);
    });

    const subviews = {
      'action': document.getElementById('gov-subview-action'),
      'cases': document.getElementById('gov-subview-cases')
    };

    Object.keys(subviews).forEach(k => {
      if (subviews[k]) {
        subviews[k].style.display = (k === tabKey) ? 'block' : 'none';
      }
    });

    if (tabKey === 'action') {
      this.renderActionCenter();
    } else if (tabKey === 'cases') {
      this.renderResponseCases();
    }
  }

  // 1. Tenant Loading & Switching
  async loadTenants() {
    try {
      const res = await fetch('/api/v1/government/tenants');
      if (res.ok) {
        this.tenants = await res.json();
        this.activeTenant = this.tenants.find(t => t.id === this.activeTenantId) || this.tenants[0];
        if (this.activeTenant) {
          this.activeTenantId = this.activeTenant.id;
          if (this.activeTenant.departments && this.activeTenant.departments.length > 0) {
            this.activeDepartmentId = this.activeTenant.departments[0].id;
          }
          if (this.activeTenant.regions && this.activeTenant.regions.length > 0) {
            this.activeRegionId = this.activeTenant.regions[0].id;
          }
        }
        this.updateHeaderBadge();
        this.renderOrgSwitcherMenu();
      }
    } catch (err) {
      console.error('Failed to load tenants:', err);
    }
  }

  setupOrgSwitcher() {
    const btn = document.getElementById('org-switcher-trigger');
    const menu = document.getElementById('org-switcher-dropdown');

    if (btn && menu) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
      });

      document.addEventListener('click', () => {
        menu.style.display = 'none';
      });
    }
  }

  renderOrgSwitcherMenu() {
    const menu = document.getElementById('org-switcher-dropdown');
    const titleEl = document.getElementById('sidebar-org-title');
    const subEl = document.getElementById('sidebar-org-sub');
    const iconEl = document.getElementById('sidebar-org-icon');

    if (this.activeTenant) {
      if (titleEl) titleEl.textContent = this.activeTenant.name;
      if (subEl) subEl.textContent = this.activeTenant.badge_label;
      if (iconEl) iconEl.textContent = this.activeTenant.logo_icon;
    }

    if (!menu) return;

    let html = `<div class="org-dropdown-header">SWITCH GOVERNMENT WORKSPACE</div>`;
    this.tenants.forEach(t => {
      const isActive = t.id === this.activeTenantId;
      html += `
        <div class="org-option-item ${isActive ? 'active' : ''}" data-org="${t.id}">
          <div class="org-switcher-content">
            <span class="org-icon-badge">${t.logo_icon}</span>
            <div class="org-text-stack">
              <span class="org-title">${t.name}</span>
              <span class="org-type-sub">${t.type}</span>
            </div>
          </div>
          ${isActive ? '<span style="color: var(--color-water); font-size: 0.8rem;">✓</span>' : ''}
        </div>
      `;
    });
    menu.innerHTML = html;

    menu.querySelectorAll('.org-option-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        const orgId = item.dataset.org;
        if (orgId && orgId !== this.activeTenantId) {
          await this.switchTenant(orgId);
        }
      });
    });
  }

  async switchTenant(orgId) {
    this.activeTenantId = orgId;
    this.activeTenant = this.tenants.find(t => t.id === orgId);
    if (this.activeTenant) {
      if (this.activeTenant.departments && this.activeTenant.departments.length > 0) {
        this.activeDepartmentId = this.activeTenant.departments[0].id;
      }
      if (this.activeTenant.regions && this.activeTenant.regions.length > 0) {
        this.activeRegionId = this.activeTenant.regions[0].id;
      }
    }
    this.renderOrgSwitcherMenu();
    this.updateHeaderBadge();

    // Refresh all government views
    await this.renderPortalDashboard();
    await this.renderActionCenter();
    await this.renderResponseCases();
    await this.loadNotifications();

    // If active region has a linked scenario, auto-load that on map
    if (this.activeTenant && this.activeTenant.regions && this.activeTenant.regions[0]) {
      const linked = this.activeTenant.regions[0].dataset_link;
      if (linked && window.earthLensApp) {
        window.earthLensApp.loadScenario(linked);
      }
    }
  }

  updateHeaderBadge() {
    const badgeName = document.getElementById('header-org-name');
    const badgeDept = document.getElementById('header-org-dept');
    if (this.activeTenant) {
      if (badgeName) badgeName.textContent = `${this.activeTenant.logo_icon} ${this.activeTenant.name}`;
      if (badgeDept) {
        const d = this.activeTenant.departments.find(dept => dept.id === this.activeDepartmentId);
        badgeDept.textContent = d ? `· ${d.name}` : '';
      }
    }
  }

  // 2. Government Portal Dashboard View
  async renderPortalDashboard() {
    const kpiAlerts = document.getElementById('gov-kpi-alerts');
    const kpiHigh = document.getElementById('gov-kpi-high');
    const kpiArea = document.getElementById('gov-kpi-area');
    const kpiSettlements = document.getElementById('gov-kpi-settlements');
    const kpiInfra = document.getElementById('gov-kpi-infra');
    const regionSelect = document.getElementById('gov-region-select');

    try {
      const res = await fetch(`/api/v1/government/regional-intelligence?org_id=${this.activeTenantId}&region_id=${this.activeRegionId}`);
      if (res.ok) {
        const data = await res.json();
        const m = data.metrics || {};
        if (kpiAlerts) kpiAlerts.textContent = m.active_alerts || 0;
        if (kpiHigh) kpiHigh.textContent = m.high_priority_changes || 0;
        if (kpiArea) kpiArea.textContent = `${m.total_affected_area_km2 || 14.2} km²`;
        if (kpiSettlements) kpiSettlements.textContent = m.communities_potentially_affected || 8;
        if (kpiInfra) kpiInfra.textContent = m.critical_infrastructure_at_risk || 6;

        // Populate region select dropdown
        if (regionSelect && data.regions_list) {
          regionSelect.innerHTML = data.regions_list.map(r => 
            `<option value="${r.id}" ${r.id === this.activeRegionId ? 'selected' : ''}>${r.name} (${r.type})</option>`
          ).join('');
        }

        // Render category bars
        const catContainer = document.getElementById('gov-category-bars');
        if (catContainer && data.category_distribution) {
          catContainer.innerHTML = data.category_distribution.map(c => `
            <div class="factor-bar-row" style="margin-bottom: 8px;">
              <span class="factor-name" style="width: 140px;">${c.category}:</span>
              <div class="factor-bar" style="flex: 1;"><div class="factor-fill" style="width: ${c.percentage}%;"></div></div>
              <span class="factor-val" style="width: 80px; text-align: right;">${c.area_km2} km² (${c.percentage}%)</span>
            </div>
          `).join('');
        }

        const ctxOrg = document.getElementById('gov-context-org');
        if (ctxOrg && this.activeTenant) {
          ctxOrg.textContent = `${this.activeTenant.logo_icon} ${this.activeTenant.name}`;
        }
        const profOrg = document.getElementById('profile-org-name');
        if (profOrg && this.activeTenant) {
          profOrg.textContent = this.activeTenant.name;
        }
      }
    } catch (err) {
      console.error('Error rendering portal dashboard:', err);
    }
  }

  // 3. Action Center ("Requires Attention")
  async renderActionCenter() {
    const grid = document.getElementById('action-center-cards-grid');
    if (!grid) return;

    try {
      const res = await fetch(`/api/v1/government/action-center?org_id=${this.activeTenantId}`);
      if (res.ok) {
        this.actionCenterData = await res.json();
        const cases = this.actionCenterData.urgent_cases || [];

        if (cases.length === 0) {
          grid.innerHTML = `<div style="grid-column: 1/-1; padding: 30px; text-align: center; color: var(--text-dim);">No urgent events requiring immediate action in this jurisdiction. All systems operational.</div>`;
          return;
        }

        grid.innerHTML = cases.map(c => {
          const impact = c.potential_community_impact || {};
          const isCrit = c.priority === 'Critical';
          return `
            <div class="action-card" data-case-id="${c.id}" data-dataset="${c.related_dataset_id}">
              <div class="action-card-top">
                <span class="priority-tag ${isCrit ? 'crit' : 'high'}">${isCrit ? '🔴 CRITICAL PRIORITY' : '🟠 HIGH PRIORITY'}</span>
                <span style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-dim);">${c.case_code}</span>
              </div>
              <div class="action-card-title">${c.title}</div>
              <div style="font-size: 0.72rem; color: var(--color-water); font-family: var(--font-mono);">📍 ${c.location_name}</div>
              <div class="action-card-metrics">
                <div class="ac-metric-cell">
                  <span class="ac-metric-label">AFFECTED</span>
                  <span class="ac-metric-val">${c.affected_area_km2} km²</span>
                </div>
                <div class="ac-metric-cell">
                  <span class="ac-metric-label">SETTLEMENTS</span>
                  <span class="ac-metric-val text-orange">${impact.settlements_nearby || 0}</span>
                </div>
                <div class="ac-metric-cell">
                  <span class="ac-metric-label">INFRASTRUCTURE</span>
                  <span class="ac-metric-val text-cyan">${(impact.schools_nearby || 0) + (impact.hospitals_nearby || 0)}</span>
                </div>
              </div>
              <div class="action-card-footer">
                <span class="ac-status-badge">Status: ${c.status}</span>
                <div class="ac-buttons-group">
                  <button class="btn-ac-action btn-view-on-map" data-case-id="${c.id}" data-dataset="${c.related_dataset_id}">📍 View on Map</button>
                  <button class="btn-ac-action primary btn-open-case" data-case-id="${c.id}">📋 Open Case</button>
                </div>
              </div>
            </div>
          `;
        }).join('');

        // Wire up buttons
        grid.querySelectorAll('.btn-view-on-map').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const dataset = btn.dataset.dataset;
            if (dataset && window.earthLensApp) {
              window.earthLensApp.loadScenario(dataset);
              window.earthLensApp.switchWorkspace('live-map');
            }
          });
        });

        grid.querySelectorAll('.btn-open-case').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.switchInternalGovTab('cases');
          });
        });
      }
    } catch (err) {
      console.error('Error rendering action center:', err);
    }
  }

  // 4. Response Cases Management View
  async renderResponseCases() {
    const tbody = document.getElementById('response-cases-tbody');
    const countBadge = document.getElementById('cases-count-badge');
    const tabCasesCount = document.getElementById('tab-cases-count');
    if (!tbody) return;

    try {
      const res = await fetch(`/api/v1/government/cases?org_id=${this.activeTenantId}`);
      if (res.ok) {
        this.cases = await res.json();
        if (countBadge) countBadge.textContent = `${this.cases.length} Total Cases`;
        if (tabCasesCount) tabCasesCount.textContent = this.cases.length;

        if (this.cases.length === 0) {
          tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 30px;">No response cases logged for this organization.</td></tr>`;
          return;
        }

        tbody.innerHTML = this.cases.map(c => {
          const statusClass = c.status.toLowerCase().replace(/\s+/g, '_');
          return `
            <tr data-case-id="${c.id}">
              <td style="font-family: var(--font-mono); font-weight: 700; color: var(--color-water);">${c.case_code}</td>
              <td>
                <div style="font-weight: 700; color: #fff;">${c.location_name}</div>
                <div style="font-size: 0.70rem; color: var(--text-dim);">${c.title}</div>
              </td>
              <td><span class="hazard-badge-pill">${c.change_type}</span></td>
              <td style="font-family: var(--font-mono); font-weight: 600;">${c.affected_area_km2} km²</td>
              <td>${c.department_name}</td>
              <td><span class="case-status-pill ${statusClass}">${c.status}</span></td>
              <td>
                <button class="btn-ac-action btn-inspect-case" data-case-id="${c.id}">Inspect →</button>
              </td>
            </tr>
          `;
        }).join('');

        tbody.querySelectorAll('.btn-inspect-case').forEach(btn => {
          btn.addEventListener('click', () => {
            const caseId = btn.dataset.caseId;
            this.showCaseDetailsModal(caseId);
          });
        });
      }
    } catch (err) {
      console.error('Error rendering cases:', err);
    }
  }

  // 5. Change Detail Drawer Integration
  setupDrawerResponseIntegration() {
    const btnCreateCase = document.getElementById('btn-gov-create-case-drawer');
    if (btnCreateCase) {
      btnCreateCase.addEventListener('click', async () => {
        await this.handleCreateCaseFromDrawer();
      });
    }
  }

  async handleCreateCaseFromDrawer() {
    const currentAnalysis = window.earthLensApp ? window.earthLensApp.currentAnalysis : null;
    const meta = currentAnalysis ? (currentAnalysis.metadata || {}) : {};
    const coords = meta.coordinates || { lat: 32.7667, lon: 22.6367 };
    const impact = currentAnalysis ? (currentAnalysis.community_impact || {}) : {};
    const impactSum = impact.community_impact_summary || {};

    const statusEl = document.getElementById('drawer-gov-status');
    const deptEl = document.getElementById('drawer-gov-dept');
    const officerEl = document.getElementById('drawer-gov-officer');
    const priorityEl = document.getElementById('drawer-gov-priority');
    const notesEl = document.getElementById('drawer-gov-notes');

    const payload = {
      organization_id: this.activeTenantId,
      department_id: deptEl ? deptEl.value : this.activeDepartmentId,
      region_id: this.activeRegionId,
      related_dataset_id: window.earthLensApp ? window.earthLensApp.activeScenario : 'derna_flooding',
      title: `${meta.change_type || 'Environmental Anomaly'} Investigation Case`,
      location_name: meta.location || 'Observation Zone',
      coordinates: coords,
      change_type: meta.change_type || 'Flooding',
      severity: meta.severity || 'CRITICAL',
      priority: priorityEl ? priorityEl.value : 'High',
      affected_area_km2: impactSum.total_affected_area_km2 || 14.2,
      confidence_pct: 93.0,
      potential_community_impact: {
        settlements_nearby: impactSum.settlements_count || 6,
        schools_nearby: impactSum.schools_count || 3,
        hospitals_nearby: impactSum.hospitals_count || 1,
        roads_affected: impactSum.roads_count || 6,
        agricultural_km2: impactSum.agricultural_area_km2 || 3.6
      },
      assigned_officer_name: officerEl ? officerEl.value : 'Government Analyst',
      initial_note: notesEl ? notesEl.value : 'Initial government response case initiated from live satellite change anomaly.'
    };

    try {
      const res = await fetch('/api/v1/government/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        alert(`Response Case ${created.case_code} successfully created and dispatched to ${created.department_name}!`);
        if (notesEl) notesEl.value = '';
        await this.renderActionCenter();
        await this.renderResponseCases();
        await this.loadNotifications();
      }
    } catch (err) {
      console.error('Failed to create case:', err);
    }
  }

  // 6. Case Details & SITREP Modal
  async showCaseDetailsModal(caseId) {
    const theCase = this.cases.find(c => c.id === caseId);
    if (!theCase) return;

    const modal = document.getElementById('gov-case-modal');
    if (!modal) return;

    const codeEl = document.getElementById('modal-case-code');
    const titleEl = document.getElementById('modal-case-title');
    const bodyEl = document.getElementById('modal-case-body');

    if (codeEl) codeEl.textContent = theCase.case_code;
    if (titleEl) titleEl.textContent = theCase.title;

    let notesHtml = (theCase.notes || []).map(n => `
      <div style="background: rgba(0,0,0,0.3); border-radius: 6px; padding: 8px 12px; margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--text-dim);">
          <strong style="color: var(--color-water);">${n.author_name} (${n.department})</strong>
          <span>${n.timestamp}</span>
        </div>
        <div style="font-size: 0.74rem; color: #fff; margin-top: 4px;">${n.content}</div>
      </div>
    `).join('') || '<div style="color: var(--text-dim); font-size: 0.74rem;">No notes recorded yet.</div>';

    if (bodyEl) {
      bodyEl.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
          <div><span style="color: var(--text-dim); font-size: 0.7rem;">LOCATION:</span> <strong style="color: #fff;">${theCase.location_name}</strong></div>
          <div><span style="color: var(--text-dim); font-size: 0.7rem;">HAZARD TYPE:</span> <strong style="color: var(--color-warning);">${theCase.change_type}</strong></div>
          <div><span style="color: var(--text-dim); font-size: 0.7rem;">AFFECTED AREA:</span> <strong style="color: #fff;">${theCase.affected_area_km2} km²</strong></div>
          <div><span style="color: var(--text-dim); font-size: 0.7rem;">DEPARTMENT:</span> <strong style="color: #fff;">${theCase.department_name}</strong></div>
          <div><span style="color: var(--text-dim); font-size: 0.7rem;">STATUS:</span> <strong style="color: var(--color-stable);">${theCase.status}</strong></div>
          <div><span style="color: var(--text-dim); font-size: 0.7rem;">OFFICER:</span> <strong style="color: #fff;">${theCase.assigned_officer_name || 'Unassigned'}</strong></div>
        </div>

        <h4 style="font-size: 0.78rem; font-weight: 700; color: #fff; margin-bottom: 6px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 4px;">INVESTIGATION NOTES LOG</h4>
        <div style="max-height: 140px; overflow-y: auto; margin-bottom: 14px;">${notesHtml}</div>

        <div style="display: flex; gap: 8px;">
          <input type="text" id="modal-new-note" placeholder="Add operational note or verification update..." style="flex: 1; background: #060914; border: 1px solid rgba(255,255,255,0.14); border-radius: 4px; padding: 6px 10px; color: #fff; font-size: 0.74rem;">
          <button id="modal-btn-add-note" class="btn-ac-action primary">Add Note</button>
          <button id="modal-btn-sitrep" class="btn-ac-action" style="background: #2563eb; color: #fff;">Export Situation Report</button>
        </div>
      `;

      document.getElementById('modal-btn-add-note')?.addEventListener('click', async () => {
        const inp = document.getElementById('modal-new-note');
        if (inp && inp.value.trim()) {
          await fetch(`/api/v1/government/cases/${caseId}?org_id=${this.activeTenantId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ new_note: inp.value.trim() })
          });
          inp.value = '';
          await this.renderResponseCases();
          this.showCaseDetailsModal(caseId);
        }
      });

      document.getElementById('modal-btn-sitrep')?.addEventListener('click', async () => {
        const res = await fetch(`/api/v1/government/reports/situation-report/${caseId}?org_id=${this.activeTenantId}`, { method: 'POST' });
        if (res.ok) {
          const sitrep = await res.json();
          const blob = new Blob([JSON.stringify(sitrep, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${sitrep.report_id}.json`;
          a.click();
          alert(`Government Situation Report ${sitrep.report_id} generated and exported!`);
        }
      });
    }

    modal.style.display = 'flex';
  }

  // 7. Top Notification Center
  setupNotificationCenter() {
    const bellBtn = document.getElementById('btn-top-notif');
    const menu = document.getElementById('top-notif-menu');
    const markReadBtn = document.getElementById('btn-mark-all-read');

    if (bellBtn && menu) {
      bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
      });

      document.addEventListener('click', () => {
        menu.style.display = 'none';
      });
    }

    if (markReadBtn) {
      markReadBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await fetch(`/api/v1/government/notifications/read?org_id=${this.activeTenantId}`, { method: 'POST' });
        await this.loadNotifications();
      });
    }
  }

  async loadNotifications() {
    const list = document.getElementById('top-notif-list');
    const badge = document.getElementById('top-notif-badge');
    if (!list) return;

    try {
      const res = await fetch(`/api/v1/government/notifications?org_id=${this.activeTenantId}`);
      if (res.ok) {
        this.notifications = await res.json();
        const unreadCount = this.notifications.filter(n => !n.read).length;
        if (badge) {
          badge.textContent = unreadCount;
          badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }

        if (this.notifications.length === 0) {
          list.innerHTML = `<div style="padding: 18px; text-align: center; color: var(--text-dim); font-size: 0.72rem;">No operational notices logged.</div>`;
          return;
        }

        list.innerHTML = this.notifications.map(n => `
          <div class="notif-item ${!n.read ? 'unread' : ''}">
            <div class="notif-item-title">${n.title}</div>
            <div class="notif-item-msg">${n.message}</div>
            <div class="notif-item-time">${n.timestamp}</div>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  }

  setupFilters() {
    const regionSelect = document.getElementById('gov-region-select');
    if (regionSelect) {
      regionSelect.addEventListener('change', async (e) => {
        this.activeRegionId = e.target.value;
        await this.renderPortalDashboard();
      });
    }

    const modalClose = document.getElementById('btn-close-case-modal');
    const modal = document.getElementById('gov-case-modal');
    if (modalClose && modal) {
      modalClose.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }
  }
}

// Instantiate global module
window.governmentPortalModule = new GovernmentPortalModule();
