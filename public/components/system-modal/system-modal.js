const SYSTEM_MODAL_TEMPLATE = `
  <link rel="stylesheet" href="./components/system-modal/system-modal.css">
  <div id="overlay" class="overlay">
    <div id="modalContent" class="modal-content">
      <div class="modal-header">
        <h2>System Information</h2>
        <button id="closeBtn" class="close-btn">&times;</button>
      </div>
      <div id="systemData" class="system-data">
        <div class="loading">Loading system information...</div>
      </div>
    </div>
  </div>
`;

class SystemModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isOpen = false;
    this.updateInterval = null;
    this.systemData = null;
    this.close = this.close.bind(this);
    this.handleOverlayClick = this.handleOverlayClick.bind(this);
    this.loadSystemInfo = this.loadSystemInfo.bind(this);
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = SYSTEM_MODAL_TEMPLATE;

    this.overlay = this.shadowRoot.getElementById('overlay');
    this.closeBtn = this.shadowRoot.getElementById('closeBtn');
    this.dataContainer = this.shadowRoot.getElementById('systemData');

    this.closeBtn.addEventListener('click', this.close);
    this.overlay.addEventListener('click', this.handleOverlayClick);
  }

  disconnectedCallback() {
    this.closeBtn?.removeEventListener('click', this.close);
    this.overlay?.removeEventListener('click', this.handleOverlayClick);
    this.stopUpdating();
  }

  open(systemData) {
    this.isOpen = true;
    this.overlay.classList.add('active');
    if (systemData) {
      this.systemData = systemData;
      this.render();
    }
    this.loadSystemInfo();
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
        this.loadSystemInfo();
      }
    }, 1000);
  }

  stopUpdating() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async loadSystemInfo() {
    try {
      const response = await fetch('/api/system-info');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      this.systemData = data;
      this.render();
    } catch (error) {
      console.error('Error loading system info:', error);
      this.dataContainer.innerHTML = '<div class="error">Failed to load system information.</div>';
      this.stopUpdating();
    }
  }

  render() {
    if (!this.systemData) return;

    const { system, cpu, memory, disk, network, uptime } = this.systemData;

    const html = `
      <div class="info-grid">
        <!-- System Section -->
        <div class="info-section">
          <h3>System</h3>
          <div class="info-item">
            <span class="label">Hostname:</span>
            <span class="value">${this.escapeHTML(system.hostname)}</span>
          </div>
          <div class="info-item">
            <span class="label">OS:</span>
            <span class="value">${this.escapeHTML(system.os.name)} ${this.escapeHTML(system.os.version)}</span>
          </div>
          <div class="info-item">
            <span class="label">OS ID:</span>
            <span class="value">${this.escapeHTML(system.os.id || 'N/A')}</span>
          </div>
          <div class="info-item">
            <span class="label">Platform:</span>
            <span class="value">${this.escapeHTML(system.platform)} (${this.escapeHTML(system.arch)})</span>
          </div>
          <div class="info-item">
            <span class="label">Uptime:</span>
            <span class="value">${this.escapeHTML(uptime.formatted)}</span>
          </div>
          <div class="info-item">
            <span class="label">Uptime (seconds):</span>
            <span class="value">${uptime.seconds}</span>
          </div>
        </div>

        <!-- CPU Section -->
        <div class="info-section">
          <h3>CPU</h3>
          <div class="info-item">
            <span class="label">Model:</span>
            <span class="value">${this.escapeHTML(cpu.model)}</span>
          </div>
          <div class="info-item">
            <span class="label">Cores:</span>
            <span class="value">${cpu.cores}</span>
          </div>
          <div class="info-item">
            <span class="label">Speed:</span>
            <span class="value">${cpu.speedMHz} MHz</span>
          </div>
          ${cpu.usagePercent !== null ? `
          <div class="info-item">
            <span class="label">Usage:</span>
            <span class="value">
              ${cpu.usagePercent}%
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${cpu.usagePercent}%"></div>
              </div>
            </span>
          </div>
          ` : ''}
          <div class="info-item">
            <span class="label">Load Avg (1m):</span>
            <span class="value">${cpu.loadAverage.oneMin}</span>
          </div>
          <div class="info-item">
            <span class="label">Load Avg (5m):</span>
            <span class="value">${cpu.loadAverage.fiveMin}</span>
          </div>
          <div class="info-item">
            <span class="label">Load Avg (15m):</span>
            <span class="value">${cpu.loadAverage.fifteenMin}</span>
          </div>
        </div>

        <!-- Memory Section -->
        <div class="info-section">
          <h3>Memory</h3>
          <div class="info-item">
            <span class="label">Total:</span>
            <span class="value">${this.formatBytes(memory.totalBytes)}</span>
          </div>
          <div class="info-item">
            <span class="label">Used:</span>
            <span class="value">${this.formatBytes(memory.usedBytes)}</span>
          </div>
          <div class="info-item">
            <span class="label">Free:</span>
            <span class="value">${this.formatBytes(memory.freeBytes)}</span>
          </div>
          <div class="info-item">
            <span class="label">Available:</span>
            <span class="value">${this.formatBytes(memory.availableBytes)}</span>
          </div>
          <div class="info-item">
            <span class="label">Buffers:</span>
            <span class="value">${this.formatBytes(memory.buffersBytes)}</span>
          </div>
          <div class="info-item">
            <span class="label">Cached:</span>
            <span class="value">${this.formatBytes(memory.cachedBytes)}</span>
          </div>
          <div class="info-item">
            <span class="label">Usage:</span>
            <span class="value">
              ${memory.usagePercent}%
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${memory.usagePercent}%"></div>
              </div>
            </span>
          </div>
          ${memory.swap.totalBytes > 0 ? `
          <div class="info-item">
            <span class="label">Swap Total:</span>
            <span class="value">${this.formatBytes(memory.swap.totalBytes)}</span>
          </div>
          <div class="info-item">
            <span class="label">Swap Used:</span>
            <span class="value">${this.formatBytes(memory.swap.usedBytes)}</span>
          </div>
          <div class="info-item">
            <span class="label">Swap Free:</span>
            <span class="value">${this.formatBytes(memory.swap.freeBytes)}</span>
          </div>
          <div class="info-item">
            <span class="label">Swap Usage:</span>
            <span class="value">
              ${memory.swap.usagePercent}%
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${memory.swap.usagePercent}%"></div>
              </div>
            </span>
          </div>
          ` : ''}
        </div>

        <!-- Disk Section -->
        ${Array.isArray(disk) ? `
        <div class="info-section full-width">
          <h3>Disk</h3>
          ${disk.map(d => `
            <div class="disk-item">
              <div class="info-item">
                <span class="label">Filesystem:</span>
                <span class="value">${this.escapeHTML(d.filesystem)}</span>
              </div>
              <div class="info-item">
                <span class="label">Mount Point:</span>
                <span class="value">${this.escapeHTML(d.mountPoint)}</span>
              </div>
              <div class="info-item">
                <span class="label">Type:</span>
                <span class="value">${this.escapeHTML(d.type)}</span>
              </div>
              <div class="info-item">
                <span class="label">Size:</span>
                <span class="value">${this.formatBytes(d.sizeBytes)}</span>
              </div>
              <div class="info-item">
                <span class="label">Used:</span>
                <span class="value">${this.formatBytes(d.usedBytes)}</span>
              </div>
              <div class="info-item">
                <span class="label">Available:</span>
                <span class="value">${this.formatBytes(d.availableBytes)}</span>
              </div>
              <div class="info-item">
                <span class="label">Usage:</span>
                <span class="value">
                  ${d.usagePercent}%
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${d.usagePercent}%"></div>
                  </div>
                </span>
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Network Section -->
        ${Array.isArray(network) ? `
        <div class="info-section full-width">
          <h3>Network</h3>
          ${network.map(iface => `
            <div class="network-item">
              <div class="info-item">
                <span class="label">Interface:</span>
                <span class="value"><strong>${this.escapeHTML(iface.name)}</strong></span>
              </div>
              ${iface.addresses.map(addr => `
                <div class="info-item sub-item">
                  <span class="label">${addr.family}:</span>
                  <span class="value">${this.escapeHTML(addr.address)}</span>
                </div>
                <div class="info-item sub-item">
                  <span class="label">MAC:</span>
                  <span class="value">${this.escapeHTML(addr.mac)}</span>
                </div>
                <div class="info-item sub-item">
                  <span class="label">Internal:</span>
                  <span class="value">${addr.internal ? 'Yes' : 'No'}</span>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
    `;

    this.dataContainer.innerHTML = html;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
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
}

customElements.define('system-modal', SystemModal);