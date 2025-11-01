const WEATHER_BUTTON_TEMPLATE = `
  <link rel="stylesheet" href="./components/weather-button/weather-button.css">
  <button id="weatherButton">Weather</button>
  <div id="dropdown" class="dropdown"></div>
  <weather-modal id="weather-modal"></weather-modal>
`;

class WeatherButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.weatherData = null;
    this.dropdownOpen = false;
    this.updateInterval = null;
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.loadWeather = this.loadWeather.bind(this);
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = WEATHER_BUTTON_TEMPLATE;

    this.button = this.shadowRoot.getElementById('weatherButton');
    this.dropdown = this.shadowRoot.getElementById('dropdown');
    this.modal = this.shadowRoot.getElementById('weather-modal');

    if (!this.button) {
      throw new Error('weather-button template missing #weatherButton');
    }

    this.button.addEventListener('click', this.toggleDropdown);
  }

  disconnectedCallback() {
    this.button?.removeEventListener('click', this.toggleDropdown);
    document.removeEventListener('mousedown', this.handleOutsideClick);
    this.stopUpdating();
  }

  async loadWeather() {
    try {
      const response = await fetch('/api/weather');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      this.weatherData = data;
      this.renderDropdown();
    } catch (error) {
      console.error('Error loading weather:', error);
      this.dropdown.innerHTML = `<div class="error">Failed to load weather data.</div>`;
      this.stopUpdating();
    }
  }

  toggleDropdown(e) {
    e.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
    if (this.dropdownOpen) {
      this.loadWeather();
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
        this.loadWeather();
      }
    }, 300000); // Update every 5 minutes
  }

  stopUpdating() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  renderDropdown() {
    if (!this.dropdown || !this.weatherData) return;

    const { location, current, today } = this.weatherData;

    const html = `
      <div class="weather-section">
        <div class="section-title">${this.escapeHTML(location.name)}</div>
        <div class="current-temp">${Math.round(current.temperature)}°C</div>
        <div class="current-conditions">${this.escapeHTML(current.conditions)}</div>
        <div class="feels-like">Feels like ${Math.round(current.feelslike)}°C</div>
      </div>

      <div class="weather-section">
        <div class="info-row">
          <span class="label">High/Low:</span>
          <span class="value">${Math.round(today.temperature_max)}° / ${Math.round(today.temperature_min)}°</span>
        </div>
        <div class="info-row">
          <span class="label">Humidity:</span>
          <span class="value">${current.humidity}%</span>
        </div>
        <div class="info-row">
          <span class="label">Wind:</span>
          <span class="value">
            ${Math.round(current.wind.speed_kmh)} km/h
            <span style="display: inline-block; transform: rotate(${current.wind.direction}deg);">↑</span>
            ${this.getWindDirection(current.wind.direction)}
          </span>
        </div>
        <div class="info-row">
          <span class="label">Precipitation:</span>
          <span class="value">${today.precipitation_sum} mm</span>
        </div>
      </div>

      <button class="advanced-btn" id="advancedBtn">Detailed Forecast</button>
    `;

    this.dropdown.innerHTML = html;
    
    const advancedBtn = this.dropdown.querySelector('#advancedBtn');
    if (advancedBtn) {
      advancedBtn.addEventListener('click', () => {
        this.dropdown.classList.remove('active');
        this.dropdownOpen = false;
        document.removeEventListener('mousedown', this.handleOutsideClick);
        this.stopUpdating();
        this.modal.open(this.weatherData);
      });
    }
  }

  getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
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

customElements.define('weather-button', WeatherButton);