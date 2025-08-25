const MC_BUTTON_TEMPLATE = `
  <link rel="stylesheet" href="./components/mc-button/mc-button.css">
  <button id="mcButton">MC Servers</button>
  <div id="dropdown" class="dropdown"></div>
  <mc-modal id="server-modal"></mc-modal>
`;

class MCButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.servers = [];
    this.dropdownOpen = false;
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.loadServers = this.loadServers.bind(this);
    this.openServerModal = this.openServerModal.bind(this);
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = MC_BUTTON_TEMPLATE;

    this.button = this.shadowRoot.getElementById('mcButton');
    this.dropdown = this.shadowRoot.getElementById('dropdown');
    this.modal = this.shadowRoot.getElementById('server-modal');

    if (!this.button) {
      throw new Error('mc-button template missing #mcButton');
    }

    this.button.addEventListener('click', this.toggleDropdown);
    this.loadServers();
  }

  disconnectedCallback() {
    this.button?.removeEventListener('click', this.toggleDropdown);
    document.removeEventListener('mousedown', this.handleOutsideClick);
  }

  async loadServers() {
    try {
      const response = await fetch('/api/mc-servers');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      this.servers = Array.isArray(data) ? data : [];
      this.button.textContent = `MC Servers (${this.servers.length} online)`;
      this.renderDropdown();
    } catch (error) {
      console.error('Error loading MC servers:', error);
      this.button.textContent = 'MC Servers (Error)';
      this.dropdown.innerHTML = `<div class="error">Failed to load server data.</div>`;
    }
  }

  toggleDropdown(e) {
    e.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
    if (this.dropdownOpen) {
      this.renderDropdown();
      this.dropdown.classList.add('active');
      document.addEventListener('mousedown', this.handleOutsideClick);
    } else {
      this.dropdown.classList.remove('active');
      document.removeEventListener('mousedown', this.handleOutsideClick);
    }
  }

  handleOutsideClick(e) {
    if (!this.contains(e.target) && !this.shadowRoot.contains(e.target)) {
      this.dropdown.classList.remove('active');
      this.dropdownOpen = false;
      document.removeEventListener('mousedown', this.handleOutsideClick);
    }
  }

  renderDropdown() {
    if (!this.dropdown) return;
    if (this.servers.length === 0) {
      this.dropdown.innerHTML = '<div>No servers online.</div>';
      return;
    }
    const html = this.servers
      .map((server, index) => {
        const { pid, screenSession, directory, ports } = server;
        return `
          <div class="server-item" data-index="${index}">
            <div class="server-title">${this.escapeHTML(directory)}</div>
            <div>PID: ${this.escapeHTML(pid)}</div>
            <div>Screen Session: ${this.escapeHTML(screenSession)}</div>
            <div>Ports: ${ports && ports.length ? this.escapeHTML(ports.map(String).join(', ')) : 'N/A'}</div>
          </div>
        `;
      })
      .join('');
    this.dropdown.innerHTML = html;
    
    // Add click event listeners to server items
    this.dropdown.querySelectorAll('.server-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.getAttribute('data-index'));
        this.openServerModal(this.servers[index]);
      });
    });
  }

  openServerModal(serverData) {
    this.dropdown.classList.remove('active');
    this.dropdownOpen = false;
    document.removeEventListener('mousedown', this.handleOutsideClick);
    this.modal.open(serverData);
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

customElements.define('mc-button', MCButton);