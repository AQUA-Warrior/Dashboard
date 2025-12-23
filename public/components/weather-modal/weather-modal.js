const WEATHER_MODAL_TEMPLATE = `
  <link rel="stylesheet" href="./components/weather-modal/weather-modal.css">
  <div id="overlay" class="overlay">
    <div id="modalContent" class="modal-content">
      <div class="modal-header">
        <h2>Weather Forecast</h2>
        <button id="closeBtn" class="close-btn">&times;</button>
      </div>
      <div id="weatherData" class="weather-data">
        <div class="loading">Loading weather information...</div>
      </div>
    </div>
  </div>
`;

class WeatherModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isOpen = false;
    this.updateInterval = null;
    this.weatherData = null;
    this.close = this.close.bind(this);
    this.handleOverlayClick = this.handleOverlayClick.bind(this);
    this.loadWeather = this.loadWeather.bind(this);
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = WEATHER_MODAL_TEMPLATE;

    this.overlay = this.shadowRoot.getElementById('overlay');
    this.closeBtn = this.shadowRoot.getElementById('closeBtn');
    this.dataContainer = this.shadowRoot.getElementById('weatherData');

    this.closeBtn.addEventListener('click', this.close);
    this.overlay.addEventListener('click', this.handleOverlayClick);
  }

  disconnectedCallback() {
    this.closeBtn?.removeEventListener('click', this.close);
    this.overlay?.removeEventListener('click', this.handleOverlayClick);
    this.stopUpdating();
  }

  open(weatherData) {
    this.isOpen = true;
    this.overlay.classList.add('active');
    if (weatherData) {
      this.weatherData = weatherData;
      this.render();
    }
    this.loadWeather();
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

  async loadWeather() {
    try {
      const response = await fetch('/api/weather');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      this.weatherData = data;
      this.render();
    } catch (error) {
      console.error('Error loading weather:', error);
      this.dataContainer.innerHTML = '<div class="error">Failed to load weather information.</div>';
      this.stopUpdating();
    }
  }

  render() {
    if (!this.weatherData) return;

    const { location, current, today, forecast } = this.weatherData;

    const html = `
      <div class="weather-grid">
        <div class="weather-section current-section">
          <h3>Current Conditions</h3>
          <div class="location">${this.escapeHTML(location.name)}</div>
          <div class="big-temp">${Math.round(current.temperature)}°C</div>
          <div class="conditions">${this.escapeHTML(current.conditions)}</div>
          <div class="feels-like">Feels like ${Math.round(current.feelslike)}°C</div>
          
          <div class="current-details">
            <div class="detail-item">
              <span class="label">Humidity:</span>
              <span class="value">${current.humidity}%</span>
            </div>
            <div class="detail-item">
              <span class="label">Pressure:</span>
              <span class="value">${current.pressure} hPa</span>
            </div>
            <div class="detail-item">
              <span class="label">Cloud Cover:</span>
              <span class="value">${current.cloud_cover}%</span>
            </div>
            <div class="detail-item">
              <span class="label">Wind Speed:</span>
              <span class="value">${Math.round(current.wind.speed_kmh)} km/h</span>
            </div>
            <div class="detail-item">
              <span class="label">Wind Direction:</span>
              <span class="value">
                ${current.wind.direction}° (${this.getWindDirection(current.wind.direction)})
                <span style="display: inline-block; transform: rotate(${current.wind.direction}deg);">↑</span>
              </span>
            </div>
            <div class="detail-item">
              <span class="label">Wind Gusts:</span>
              <span class="value">${Math.round(current.wind.gusts_kmh)} km/h</span>
            </div>
          </div>
        </div>

        <div class="weather-section">
          <h3>Today's Forecast</h3>
          <div class="detail-item">
            <span class="label">High:</span>
            <span class="value">${Math.round(today.temperature_max)}°C</span>
          </div>
          <div class="detail-item">
            <span class="label">Low:</span>
            <span class="value">${Math.round(today.temperature_min)}°C</span>
          </div>
          <div class="detail-item">
            <span class="label">Feels High:</span>
            <span class="value">${Math.round(today.apparent_temperature_max)}°C</span>
          </div>
          <div class="detail-item">
            <span class="label">Feels Low:</span>
            <span class="value">${Math.round(today.apparent_temperature_min)}°C</span>
          </div>
          <div class="detail-item">
            <span class="label">Precipitation:</span>
            <span class="value">${today.precipitation_sum} mm</span>
          </div>
          <div class="detail-item">
            <span class="label">Rain:</span>
            <span class="value">${today.rain_sum} mm</span>
          </div>
          ${today.rain_range ? `<div class="detail-item">
            <span class="label">Rain Range:</span>
            <span class="value">${today.rain_range}</span>
          </div>` : ''}
          <div class="detail-item">
            <span class="label">Snow:</span>
            <span class="value">${today.snowfall_sum} cm</span>
          </div>
          ${today.snow_range ? `<div class="detail-item">
            <span class="label">Snow Range:</span>
            <span class="value">${today.snow_range}</span>
          </div>` : ''}
          <div class="detail-item">
            <span class="label">Precip Hours:</span>
            <span class="value">${today.precipitation_hours}h</span>
          </div>
          <div class="detail-item">
            <span class="label">Precip Chance:</span>
            <span class="value">${today.precipitation_probability_max}%</span>
          </div>
          <div class="detail-item">
            <span class="label">UV Index:</span>
            <span class="value">${today.uv_index_max}</span>
          </div>
          ${today.humidity_avg !== null ? `<div class="detail-item">
            <span class="label">Avg Humidity:</span>
            <span class="value">${today.humidity_avg}%</span>
          </div>` : ''}
          ${today.visibility_min !== null ? `<div class="detail-item">
            <span class="label">Min Visibility:</span>
            <span class="value">${(today.visibility_min / 1000).toFixed(1)} km</span>
          </div>` : ''}
          ${today.pressure_avg !== null ? `<div class="detail-item">
            <span class="label">Avg Pressure:</span>
            <span class="value">${today.pressure_avg} hPa</span>
          </div>` : ''}
          <div class="detail-item">
            <span class="label">Sunrise:</span>
            <span class="value">${this.formatTime(today.sunrise)}</span>
          </div>
          <div class="detail-item">
            <span class="label">Sunset:</span>
            <span class="value">${this.formatTime(today.sunset)}</span>
          </div>
          <div class="detail-item">
            <span class="label">Daylight:</span>
            <span class="value">${this.formatDuration(today.daylight_duration)}</span>
          </div>
          ${(today.sunshine_duration && today.sunshine_duration > 0) ? `<div class="detail-item">
            <span class="label">Sunshine:</span>
            <span class="value">${this.formatDuration(today.sunshine_duration)}</span>
          </div>` : ''}
        </div>

        <div class="weather-section full-width">
          <h3>7 Day Forecast</h3>
          <div class="forecast-grid">
            ${forecast.daily.map(day => `
              <div class="forecast-day">
                <div class="day-name">${this.formatDate(day.date)}</div>
                <div class="day-conditions">${this.escapeHTML(day.weather_text)}</div>
                <div class="day-temp">${Math.round(day.temperature_max)}° / ${Math.round(day.temperature_min)}°</div>
                ${(day.rain_sum || 0) > 0 ? `<div class="day-detail">🌧️ Rain: ${day.rain_sum}mm</div>` : ''}
                ${(day.snowfall_sum || 0) > 0 ? `<div class="day-detail">❄️ Snow: ${day.snowfall_sum}cm</div>` : ''}
                <div class="day-detail">💨 ${Math.round(day.wind_speed_max)} km/h</div>
                <div class="day-detail">UV ${day.uv_index_max}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="weather-section full-width">
          <h3>Hourly Forecast</h3>
          <div class="hourly-scroll">
            ${forecast.hourly.map(hour => `
              <div class="hourly-item">
                <div class="hour-time">${this.formatHour(hour.time)}</div>
                <div class="hour-temp">${Math.round(hour.temperature)}°</div>
                <div class="hour-conditions">${this.escapeHTML(hour.weather_text)}</div>
                <div class="hour-detail">Feels like ${Math.round(hour.apparent_temperature)}°C</div>
                <div class="hour-detail">${this.renderHourlyPrecip(hour)}</div>
                <div class="hour-detail">
                  💨 ${Math.round(hour.wind_speed)} km/h
                  <span style="display: inline-block; transform: rotate(${hour.wind_direction}deg);">↑</span>
                  (${this.getWindDirection(hour.wind_direction)})
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.dataContainer.innerHTML = html;
  }

  renderHourlyPrecip(hour) {
    // Prefer explicit fields if present
    const rain = (typeof hour.rain !== 'undefined' && hour.rain !== null) ? Number(hour.rain) : null;
    const snowfall = (typeof hour.snowfall !== 'undefined' && hour.snowfall !== null) ? Number(hour.snowfall) : null;
    const precip = Number(hour.precipitation) || 0;
    // If both rain and snow exist, show both
    if (rain && rain > 0 && snowfall && snowfall > 0) {
      const rainStr = rain % 1 === 0 ? `${rain}` : rain.toFixed(1);
      const snowStr = snowfall % 1 === 0 ? `${snowfall}` : snowfall.toFixed(1);
      return `Rain: ${rainStr} mm / Snow: ${snowStr} cm`;
    }

    if (snowfall && snowfall > 0) {
      const snowStr = snowfall % 1 === 0 ? `${snowfall}` : snowfall.toFixed(1);
      return `Snow: ${snowStr} cm`;
    }

    if (rain && rain > 0) {
      const rainStr = rain % 1 === 0 ? `${rain}` : rain.toFixed(1);
      return `Rain: ${rainStr} mm`;
    }

    if (precip && precip > 0) {
      return `Precipitation: ${precip % 1 === 0 ? precip : precip.toFixed(1)} mm`;
    }

    return 'Precipitation: 0 mm';
  }

  getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  formatHour(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
  }

  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
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

customElements.define('weather-modal', WeatherModal);