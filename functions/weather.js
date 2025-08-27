const axios = require("axios");

const API_KEY = "ffef98ef8efc4a17bd8215521252708";
const CACHE_TTL = 5 * 60 * 1000;
let cache = { data: null, timestamp: 0 };

async function getFullWeather(location = "Waterloo,Ontario,Canada") {
  if (Date.now() - cache.timestamp < CACHE_TTL && cache.data && cache.data.locationName === location) {
    return cache.data.weather;
  }

  try {
    // Use forecast API with days=1 to get current, forecast day, and astronomy data
    const url = `http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(
      location
    )}&days=1&aqi=yes&alerts=yes`;

    const response = await axios.get(url);
    const data = response.data;

    // Extract current weather
    const current = data.current;
    // Extract forecast day (today)
    const forecastDay = data.forecast.forecastday[0].day;
    // Extract astronomy
    const astro = data.forecast.forecastday[0].astro;

    // Extract alerts if any
    const alerts = data.alerts?.alert || [];

    // Compose a comprehensive weather object
    const weather = {
      location: {
        name: data.location.name,
        region: data.location.region,
        country: data.location.country,
        lat: data.location.lat,
        lon: data.location.lon,
        tz_id: data.location.tz_id,
        localtime: data.location.localtime,
        localtime_epoch: data.location.localtime_epoch,
      },
      current: {
        last_updated: current.last_updated,
        last_updated_epoch: current.last_updated_epoch,
        temp_c: current.temp_c,
        feelslike_c: current.feelslike_c,
        windchill_c: current.windchill_c,
        heatindex_c: current.heatindex_c,
        condition: {
          text: current.condition.text,
          icon: current.condition.icon,
          code: current.condition.code,
        },
        wind_kph: current.wind_kph,
        wind_dir: current.wind_dir,
        precip_mm: current.precip_mm,
        humidity: current.humidity,
        cloud: current.cloud,
        uv: current.uv,
        gust_kph: current.gust_kph,
        snow_cm: current.snow_cm || 0,
        air_quality_index_us_epa: current.air_quality ? current.air_quality["us-epa-index"] : null,
      },
      forecast: {
        daily_will_it_rain: forecastDay.daily_will_it_rain,
        daily_will_it_snow: forecastDay.daily_will_it_snow,
        daily_chance_of_rain: forecastDay.daily_chance_of_rain,
        daily_chance_of_snow: forecastDay.daily_chance_of_snow,
        totalsnow_cm: forecastDay.totalsnow_cm,
        maxtemp_c: forecastDay.maxtemp_c,
        mintemp_c: forecastDay.mintemp_c,
        avgtemp_c: forecastDay.avgtemp_c,
        maxwind_kph: forecastDay.maxwind_kph,
        totalprecip_mm: forecastDay.totalprecip_mm,
        avghumidity: forecastDay.avghumidity,
        condition: {
          text: forecastDay.condition.text,
          icon: forecastDay.condition.icon,
          code: forecastDay.condition.code,
        },
        uv: forecastDay.uv,
      },
      astronomy: {
        sunrise: astro.sunrise,
        sunset: astro.sunset,
        moonrise: astro.moonrise,
        moonset: astro.moonset,
        moon_phase: astro.moon_phase,
        moon_illumination: astro.moon_illumination,
        is_moon_up: astro.is_moon_up,
        is_sun_up: astro.is_sun_up,
      },
      alerts: alerts.map(alert => ({
        headline: alert.headline,
        severity: alert.severity,
        urgency: alert.urgency,
        areas: alert.areas,
        category: alert.category,
        certainty: alert.certainty,
        event: alert.event,
        effective: alert.effective,
        expires: alert.expires,
        desc: alert.desc,
        instruction: alert.instruction,
      })),
    };

    cache = { data: { locationName: location, weather }, timestamp: Date.now() };
    return weather;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${JSON.stringify(error.response.data)}`);
    } else {
      throw new Error(`Network/Code Error: ${error.message}`);
    }
  }
}

module.exports = { getFullWeather };