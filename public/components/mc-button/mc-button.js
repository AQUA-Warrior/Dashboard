const MC_BUTTON_TEMPLATE = `
  <link rel="stylesheet" href="./components/mc-button/mc-button.css">
  <button id="mcButton">MC Servers</button>
  <div id="dropdown" class="dropdown"></div>
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
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = MC_BUTTON_TEMPLATE;

    this.button = this.shadowRoot.getElementById('mcButton');
    this.dropdown = this.shadowRoot.getElementById('dropdown');

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
      this.servers = data;
      this.button.textContent = `MC Servers (${data.length} online)`;
      this.renderDropdown();
    } catch (error) {
      this.button.textContent = 'MC Servers (Error)';
      this.dropdown.innerHTML = `<div class="error">Failed to load server data.</div>`;
    }
  }

  async toggleDropdown(e) {
    e.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
    if (this.dropdownOpen) {
      await this.loadServers();
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
    const html = this.servers.map(server => {
      const { pid, screenSession, directory, ports } = server;
      return `
        <div class="server-item">
          <div class="server-title">${directory}</div>
          <div>PID: ${pid}</div>
          <div>Screen Session: ${screenSession}</div>
          <div>Ports: ${ports && ports.length ? ports.join(', ') : 'N/A'}</div>
        </div>
      `;
    }).join('');
    this.dropdown.innerHTML = html;
  }
}

customElements.define('mc-button', MCButton);