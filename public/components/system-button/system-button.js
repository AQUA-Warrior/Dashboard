const SYSTEM_BUTTON_TEMPLATE = `
  <link rel="stylesheet" href="./components/system-button/system-button.css">
  <button id="systemButton">System Info</button>
  <div id="dropdown" class="dropdown"></div>
  <system-modal id="system-modal"></system-modal>
`;

class SystemButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.systemData = null;
    this.dropdownOpen = false;
    this.updateInterval = null;
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.loadSystemInfo = this.loadSystemInfo.bind(this);
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = SYSTEM_BUTTON_TEMPLATE;

    this.button = this.shadowRoot.getElementById('systemButton');
    this.dropdown = this.shadowRoot.getElementById('dropdown');
    this.modal = this.shadowRoot.getElementById('system-modal');

    if (!this.button) {
      throw new Error('system-button template missing #systemButton');
    }

    this.button.addEventListener('click', this.toggleDropdown);
  }

  disconnectedCallback() {
    this.button?.removeEventListener('click', this.toggleDropdown);
    document.removeEventListener('mousedown', this.handleOutsideClick);
    this.stopUpdating();
  }

  async loadSystemInfo() {
    try {
      const response = await fetch('/api/system-info');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      this.systemData = data;
      this.renderDropdown();
    } catch (error) {
      console.error('Error loading system info:', error);
      this.dropdown.innerHTML = `<div class="error">Failed to load system data.</div>`;
      this.stopUpdating();
    }
  }

  toggleDropdown(e) {
    e.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
    if (this.dropdownOpen) {
      this.loadSystemInfo();
      this.dropdown.classList.add('active');
      document.addEventListener('mousedown', this.handleOutsideClick);
      this.startUpdating();
    } else {
      this.dropdown.classList.remove('active');
      document.removeEventListener('mousedown', this.handleOutsideClick);
      this.stopUpdating();
    }
  }

  handleOutsideClick(e) {
    if (!this.contains(e.target) && !this.shadowRoot.contains(e.target)) {
      this.dropdown.classList.remove('active');
      this.dropdownOpen = false;
      document.removeEventListener('mousedown', this.handleOutsideClick);
      this.stopUpdating();
    }
  }

  startUpdating() {
    this.updateInterval = setInterval(() => {
      if (this.dropdownOpen) {
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

  renderDropdown() {
    if (!this.dropdown || !this.systemData) return;

    const { system, cpu, memory, uptime } = this.systemData;

    const html = `
      <div class="system-section">
        <div class="section-title">System</div>
        <div class="info-row">
          <span class="label">Hostname:</span>
          <span class="value">${this.escapeHTML(system.hostname)}</span>
        </div>
        <div class="info-row">
          <span class="label">OS:</span>
          <span class="value">${this.escapeHTML(system.os.name)}</span>
        </div>
        <div class="info-row">
          <span class="label">Uptime:</span>
          <span class="value">${this.escapeHTML(uptime.formatted)}</span>
        </div>
      </div>

      <div class="system-section">
        <div class="section-title">CPU</div>
        <div class="info-row">
          <span class="label">Cores:</span>
          <span class="value">${cpu.cores} @ ${cpu.speedMHz} MHz</span>
        </div>
        ${cpu.usagePercent !== null ? `
        <div class="info-row">
          <span class="label">Usage:</span>
          <span class="value">${cpu.usagePercent}%</span>
        </div>
        <div class="info-row full-width">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${cpu.usagePercent}%"></div>
          </div>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="label">Load:</span>
          <span class="value">${cpu.loadAverage.oneMin}, ${cpu.loadAverage.fiveMin}, ${cpu.loadAverage.fifteenMin}</span>
        </div>
      </div>

      <div class="system-section">
        <div class="section-title">Memory</div>
        <div class="info-row">
          <span class="label">Used:</span>
          <span class="value">${this.formatBytes(memory.usedBytes)} / ${this.formatBytes(memory.totalBytes)}</span>
        </div>
        <div class="info-row">
          <span class="label">Usage:</span>
          <span class="value">${memory.usagePercent}%</span>
        </div>
        <div class="info-row full-width">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${memory.usagePercent}%"></div>
          </div>
        </div>
      </div>

      <button class="advanced-btn" id="advancedBtn">Advanced Info</button>
    `;

    this.dropdown.innerHTML = html;
    
    const advancedBtn = this.dropdown.querySelector('#advancedBtn');
    if (advancedBtn) {
      advancedBtn.addEventListener('click', () => {
        this.dropdown.classList.remove('active');
        this.dropdownOpen = false;
        document.removeEventListener('mousedown', this.handleOutsideClick);
        this.stopUpdating();
        this.modal.open(this.systemData);
      });
    }
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

customElements.define('system-button', SystemButton);