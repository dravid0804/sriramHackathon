/**
 * EarthLens AI — Grounded AI Investigation Assistant Module
 * Provides real-time natural language answers grounded in verified mission telemetry.
 */

class InvestigationAssistantModule {
  constructor() {
    this.chatFeed = null;
    this.input = null;
    this.form = null;
    this.activeDatasetId = 'derna_flooding';
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

    // Prompt pills listeners
    const pills = document.querySelectorAll('.prompt-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        const q = pill.dataset.query;
        if (q) this.handleQuery(q);
      });
    });

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
  }

  setActiveDataset(datasetId) {
    this.activeDatasetId = datasetId;
  }

  async handleQuery(queryText) {
    // 1. Append User Message
    this.appendMessage('user', queryText);

    // 2. Append Loading Placeholder
    const loadingId = 'loading-' + Date.now();
    this.appendMessage('bot', '<em>Analyzing verified spectral telemetry and geospatial layers...</em>', loadingId);

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
        loadingEl.innerHTML = this.formatMarkdown(data.response);
        if (data.citations && data.citations.length) {
          const cites = document.createElement('div');
          cites.style.fontSize = '0.7rem';
          cites.style.color = '#06b6d4';
          cites.style.fontFamily = 'monospace';
          cites.style.marginTop = '6px';
          cites.textContent = `Sources: ${data.citations.join(' · ')}`;
          loadingEl.appendChild(cites);
        }
      }
    } catch (err) {
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) {
        loadingEl.textContent = 'Unable to reach EarthLens Copilot engine. Please check connection.';
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
    // Simple fast markdown parser for clean bullet points and bolding
    let parsed = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n•/g, '<br>•')
      .replace(/\n  -/g, '<br>&nbsp;&nbsp;•');
    return parsed;
  }
}

window.investigationAssistantModule = new InvestigationAssistantModule();
