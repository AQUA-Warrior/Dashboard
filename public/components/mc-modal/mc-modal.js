const MC_MODAL_TEMPLATE = `
  <link rel="stylesheet" href="./components/mc-modal/mc-modal.css">
  <div id="overlay" class="overlay">
    <div id="modalContent" class="modal-content">
      <div class="modal-header">
        <h2 id="serverTitle">Server Details</h2>
        <button id="closeBtn" class="close-btn">&times;</button>
      </div>
      <div id="serverData" class="server-data">
        <div class="loading">Loading server information...</div>
      </div>
    </div>
  </div>
`;

class MCModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isOpen = false;
    this.updateInterval = null;
    this.serverData = null;
    this.close = this.close.bind(this);
    this.handleOverlayClick = this.handleOverlayClick.bind(this);
    this.loadServerInfo = this.loadServerInfo.bind(this);
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = MC_MODAL_TEMPLATE;

    this.overlay = this.shadowRoot.getElementById('overlay');
    this.closeBtn = this.shadowRoot.getElementById('closeBtn');
    this.serverTitle = this.shadowRoot.getElementById('serverTitle');
    this.dataContainer = this.shadowRoot.getElementById('serverData');

    this.closeBtn.addEventListener('click', this.close);
    this.overlay.addEventListener('click', this.handleOverlayClick);
  }

  disconnectedCallback() {
    this.closeBtn?.removeEventListener('click', this.close);
    this.overlay?.removeEventListener('click', this.handleOverlayClick);
    this.stopUpdating();
  }

  open(serverData) {
    this.isOpen = true;
    this.overlay.classList.add('active');
    if (serverData) {
      this.serverData = serverData;
      this.serverTitle.textContent = `Server: ${serverData.directory}`;
    }
    this.loadServerInfo();
    this.startUpdating();
  }

  close() {
    this.isOpen = false;
    this.overlay.classList.remove('active');
    this.stopUpdating();
  }

  handleOverlayClick(e) {
    if (e.target === this.overlay) {
      this.close();
    }
  }

  startUpdating() {
    this.updateInterval = setInterval(() => {
      if (this.isOpen) {
        this.loadServerInfo();
      }
    }, 1000);
  }

  stopUpdating() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async loadServerInfo() {
    if (!this.serverData) return;

    try {
      const response = await fetch(`/api/mc-server/${this.serverData.pid}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      this.render(data);
    } catch (error) {
      console.error('Error loading server info:', error);
      this.dataContainer.innerHTML = '<div class="error">Failed to load server information.</div>';
      this.stopUpdating();
    }
  }

  render(data) {
    if (!this.serverData) return;

    // Parse memory allocation from command
    let allocatedMemory = null;
    if (this.serverData.command) {
      const xmxMatch = this.serverData.command.match(/-Xmx(\d+)([MG])/i);
      if (xmxMatch) {
        const value = parseInt(xmxMatch[1]);
        const unit = xmxMatch[2].toUpperCase();
        allocatedMemory = unit === 'G' ? value * 1024 * 1024 * 1024 : value * 1024 * 1024;
      }
    }

    // Use allocated memory if found, otherwise use total system memory
    const totalMem = allocatedMemory || (data.resources.memory?.totalBytes || require('os').totalmem());

    const html = `
      <div class="info-grid">
        <div class="info-section">
          <h3>Server Information</h3>
          <div class="info-item">
            <span class="label">PID:</span>
            <span class="value">${this.escapeHTML(String(this.serverData.pid))}</span>
          </div>
          <div class="info-item">
            <span class="label">Directory:</span>
            <span class="value">${this.escapeHTML(this.serverData.directory)}</span>
          </div>
          <div class="info-item">
            <span class="label">Screen Session:</span>
            <span class="value">${this.escapeHTML(this.serverData.screenSession)}</span>
          </div>
          <div class="info-item">
            <span class="label">Ports:</span>
            <span class="value">${this.serverData.ports && this.serverData.ports.length ? this.escapeHTML(this.serverData.ports.map(String).join(', ')) : 'N/A'}</span>
          </div>
          ${this.serverData.command ? `<div class="info-item">
            <span class="label">Start Command:</span>
            <span class="value" style="word-break: break-all;">${this.escapeHTML(this.serverData.command)}</span>
          </div>` : ''}
        </div>

        ${data.resources ? `
        <div class="info-section">
          <h3>Resource Usage</h3>
          ${data.resources.cpu !== null ? `
          <div class="info-item">
            <span class="label">CPU:</span>
            <span class="value">
              ${data.resources.cpu}%
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(data.resources.cpu, 100)}%"></div>
              </div>
            </span>
          </div>
          ` : ''}
          ${data.resources.memory ? `
          <div class="info-item">
            <span class="label">Memory:</span>
            <span class="value">
              ${this.formatBytes(data.resources.memory.usedBytes)} / ${this.formatBytes(totalMem)}
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min((data.resources.memory.usedBytes / totalMem) * 100, 100)}%"></div>
              </div>
            </span>
          </div>
          <div class="info-item">
            <span class="label">Memory Usage:</span>
            <span class="value">${Math.round((data.resources.memory.usedBytes / totalMem) * 100)}%</span>
          </div>
          ` : ''}
        </div>
        ` : ''}
      </div>
    `;

    this.dataContainer.innerHTML = html;
  }

  escapeHTML(str) {
    str = String(str);
    return str.replace(/[&<>"'`=\/]/g, function (s) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;',
      })[s];
    });
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

customElements.define('mc-modal', MCModal);