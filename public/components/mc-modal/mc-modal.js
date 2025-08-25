const MC_MODAL_TEMPLATE = `
  <link rel="stylesheet" href="./components/mc-modal/mc-modal.css">
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <h2 id="server-title">Server Details</h2>
        <button id="close-button">&times;</button>
      </div>
      <div class="modal-content">
        <div id="server-details"></div>
      </div>
    </div>
  </div>
`;

class MCModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.serverData = null;
    this.handleClose = this.handleClose.bind(this);
    this.handleOverlayClick = this.handleOverlayClick.bind(this);
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = MC_MODAL_TEMPLATE;
    
    this.modalOverlay = this.shadowRoot.querySelector('.modal-overlay');
    this.closeButton = this.shadowRoot.getElementById('close-button');
    this.serverTitle = this.shadowRoot.getElementById('server-title');
    this.serverDetails = this.shadowRoot.getElementById('server-details');
    
    this.closeButton.addEventListener('click', this.handleClose);
    this.modalOverlay.addEventListener('click', this.handleOverlayClick);
    
    // Initially hide the modal
    this.modalOverlay.style.display = 'none';
  }

  disconnectedCallback() {
    this.closeButton.removeEventListener('click', this.handleClose);
    this.modalOverlay.removeEventListener('click', this.handleOverlayClick);
  }

  open(serverData) {
    this.serverData = serverData;
    this.serverTitle.textContent = `Server: ${serverData.directory}`;
    this.loadServerDetails();
    this.modalOverlay.style.display = 'flex';
  }

  handleClose() {
    this.modalOverlay.style.display = 'none';
  }

  handleOverlayClick(e) {
    if (e.target === this.modalOverlay) {
      this.handleClose();
    }
  }

  async loadServerDetails() {
    if (!this.serverData) return;
    
    try {
      // Fetch detailed server information
      const response = await fetch(`/api/mc-server/${this.serverData.pid}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      this.renderServerDetails(data);
    } catch (error) {
      console.error('Error loading server details:', error);
      this.serverDetails.innerHTML = '<div class="error">Failed to load server details.</div>';
    }
  }

  renderServerDetails(data) {
    // Render the server details in the modal
    let html = `
      <div class="detail-row">
        <span class="detail-label">PID:</span>
        <span class="detail-value">${this.escapeHTML(this.serverData.pid)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Directory:</span>
        <span class="detail-value">${this.escapeHTML(this.serverData.directory)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Screen Session:</span>
        <span class="detail-value">${this.escapeHTML(this.serverData.screenSession)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Ports:</span>
        <span class="detail-value">${this.serverData.ports && this.serverData.ports.length ? this.escapeHTML(this.serverData.ports.map(String).join(', ')) : 'N/A'}</span>
      </div>
    `;
    
    if (data.resources) {
      html += `
        <h3>Resource Usage</h3>
        <div class="detail-row">
          <span class="detail-label">CPU Usage:</span>
          <span class="detail-value">${data.resources.cpu ? `${data.resources.cpu}%` : 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Memory Usage:</span>
          <span class="detail-value">${data.resources.memory ? `${this.formatBytes(data.resources.memory.usedBytes)} / ${this.formatBytes(data.resources.memory.totalBytes)} (${data.resources.memory.usagePercent}%)` : 'N/A'}</span>
        </div>
      `;
    }
    
    this.serverDetails.innerHTML = html;
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