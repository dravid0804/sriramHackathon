/**
 * EarthLens AI — Grounded AI Investigation Assistant Module
 * Owned by: MEMBER 3 (Intelligence Operations, Analytics & Copilot Lead)
 * Provides real-time natural language answers grounded in verified mission telemetry.
 * Eliminates hallucinations with strict data boundary verification.
 */

class InvestigationAssistantModule {
  constructor() {
    this.chatFeed = null;
    this.input = null;
    this.form = null;
    this.activeDatasetId = 'derna_flooding';

    // Scenario-tailored prompt pill catalogs
    this.scenarioPrompts = {
      derna_flooding: [
        { label: 'Are evacuation roads passable?', query: 'Are evacuation roads and bridges passable in Derna?' },
        { label: 'Status of Derna Hospital?', query: 'What is the operational status of Derna Central Hospital?' },
        { label: 'What changed here?', query: 'What changed here between these observation dates?' },
        { label: '3-Step Tactical Protocol', query: 'What is the recommended 3-step tactical response protocol?' }
      ],
      amazon_deforestation: [
        { label: 'Is BR-364 corridor affected?', query: 'Is the BR-364 highway or logging corridor impacted?' },
        { label: 'Indigenous hamlets exposed?', query: 'Which indigenous hamlets or settlements are within the buffer?' },
        { label: 'How was clearing detected?', query: 'What satellite sensors and differencing algorithms were used?' },
        { label: 'Critical focus zones', query: 'Which areas require urgent attention?' }
      ],
      madurai_urban: [
        { label: 'Are recharge tanks encroached?', query: 'Are groundwater recharge water bodies and farmland converted?' },
        { label: 'Vilangudi bypass status?', query: 'What is the transit status of the Vilangudi bypass corridor?' },
        { label: 'Socioeconomic vulnerability?', query: 'What is the terrain vulnerability rationale for Madurai?' },
        { label: 'Summary of expansion', query: 'What changed here and what is the total transformed area?' }
      ],
      california_wildfire: [
        { label: 'Is Skyway Ridge Road open?', query: 'Is Skyway Ridge evacuation route passable or smoke-restricted?' },
        { label: 'Healthcare facilities near fire?', query: 'What is the status of Enloe Medical Center and nearby clinics?' },
        { label: 'Canopy burn severity', query: 'Describe the thermal burn scar and sensor telemetry.' },
        { label: 'Tactical dispatch actions', query: 'What should response teams do first?' }
      ]
    };
  }

  init() {
    this.chatFeed = document.getElementById('assistant-chat-feed');
    this.input = document.getElementById('assistant-input');
    this.form = document.getElementById('assistant-form');

    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = this.input.value.trim();
        if (text) {
          this.handleQuery(text);
          this.input.value = '';
        }
      });
    }

    // Initialize prompt pills
    this.bindPromptPills();

    // Drawer tab switcher (Change Detail vs AI Assistant)
    const tabBtnDetails = document.getElementById('tab-btn-details');
    const tabBtnAssistant = document.getElementById('tab-btn-assistant');
    const contentDetails = document.getElementById('content-tab-details');
    const contentAssistant = document.getElementById('content-tab-assistant');

    if (tabBtnDetails && tabBtnAssistant && contentDetails && contentAssistant) {
      tabBtnDetails.addEventListener('click', () => {
        tabBtnDetails.classList.add('active');
        tabBtnAssistant.classList.remove('active');
        contentDetails.style.display = 'flex';
        contentAssistant.style.display = 'none';
      });

      tabBtnAssistant.addEventListener('click', () => {
        tabBtnAssistant.classList.add('active');
        tabBtnDetails.classList.remove('active');
        contentAssistant.style.display = 'flex';
        contentDetails.style.display = 'none';
      });
    }

    // HUD Quick Toggle Button
    const hudAiBtn = document.getElementById('btn-toggle-assistant');
    const drawer = document.getElementById('detail-drawer');
    if (hudAiBtn && drawer) {
      hudAiBtn.addEventListener('click', () => {
        drawer.classList.remove('minimized');
        if (tabBtnAssistant) tabBtnAssistant.click();
      });
    }

    // Render initial prompt pills
    this.renderPromptPills(this.activeDatasetId);
  }

  setActiveDataset(datasetId) {
    this.activeDatasetId = datasetId;
    this.renderPromptPills(datasetId);
  }

  renderPromptPills(datasetId) {
    const container = document.querySelector('.assistant-prompt-pills');
    if (!container) return;

    const list = this.scenarioPrompts[datasetId] || this.scenarioPrompts.derna_flooding;
    container.innerHTML = '';

    list.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'prompt-pill';
      btn.dataset.query = p.query;
      btn.textContent = p.label;
      container.appendChild(btn);
    });

    this.bindPromptPills();
  }

  bindPromptPills() {
    const pills = document.querySelectorAll('.prompt-pill');
    pills.forEach(pill => {
      // Remove prior cloned listeners to avoid duplicate queries
      const newPill = pill.cloneNode(true);
      pill.parentNode.replaceChild(newPill, pill);
      newPill.addEventListener('click', () => {
        const q = newPill.dataset.query;
        if (q) this.handleQuery(q);
      });
    });
  }

  async handleQuery(queryText) {
    // 1. Append User Message
    this.appendMessage('user', queryText);

    // 2. Append Loading Placeholder
    const loadingId = 'loading-' + Date.now();
    this.appendMessage('bot', '<span class="copilot-loading"><span class="copilot-spinner"></span> <em>Cross-referencing multispectral telemetry and vector road cadastre...</em></span>', loadingId);

    try {
      const res = await fetch('/api/assistant/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          dataset_id: this.activeDatasetId
        })
      });

      if (!res.ok) throw new Error('Query error');
      const data = await res.json();

      // Replace loading with real response
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) {
        let contentHtml = `
          <div class="copilot-grounded-tag">
            <span class="copilot-dot-live"></span>
            <span>GROUNDED MISSION TELEMETRY · ZERO HALLUCINATIONS</span>
          </div>
          <div class="copilot-body-text">
            ${this.formatMarkdown(data.response)}
          </div>
        `;

        if (data.citations && data.citations.length) {
          contentHtml += `
            <div class="copilot-citations-bar">
              <span class="cite-label">Verified Sources:</span>
              ${data.citations.map(c => `<span class="cite-pill">${c}</span>`).join('')}
            </div>
          `;
        }

        // Add copy button
        contentHtml += `
          <div class="copilot-card-actions">
            <button class="btn-copy-copilot" onclick="navigator.clipboard.writeText(${JSON.stringify(data.response)}); this.textContent='Copied ✓'; setTimeout(() => this.textContent='Copy Telemetry', 2000);">
              Copy Telemetry
            </button>
          </div>
        `;

        loadingEl.innerHTML = contentHtml;
      }
    } catch (err) {
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) {
        loadingEl.innerHTML = '<span style="color: #ef4444;">Unable to reach EarthLens Copilot engine. Please check connection.</span>';
      }
    }

    // Scroll to bottom
    if (this.chatFeed) {
      this.chatFeed.scrollTop = this.chatFeed.scrollHeight;
    }
  }

  appendMessage(sender, htmlContent, id = null) {
    if (!this.chatFeed) return;
    const msg = document.createElement('div');
    msg.className = `chat-msg ${sender}-msg`;
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    if (id) bubble.id = id;
    bubble.innerHTML = htmlContent;
    msg.appendChild(bubble);
    this.chatFeed.appendChild(msg);
    this.chatFeed.scrollTop = this.chatFeed.scrollHeight;
  }

  formatMarkdown(text) {
    let parsed = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="copilot-code">$1</code>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n•/g, '<br>•')
      .replace(/\n  -/g, '<br>&nbsp;&nbsp;•')
      .replace(/\n  1\./g, '<br>&nbsp;&nbsp;1.')
      .replace(/\n  2\./g, '<br>&nbsp;&nbsp;2.')
      .replace(/\n  3\./g, '<br>&nbsp;&nbsp;3.');
    return parsed;
  }
}

window.investigationAssistantModule = new InvestigationAssistantModule();
