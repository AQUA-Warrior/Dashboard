const axios = require("axios");

const CACHE_TTL = 5 * 60 * 1000;
let cache = { data: null, timestamp: 0 };

const weatherCodeToText = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail"
};

function getCurrentHourData(hourlyData, currentTime) {
  const currentHour = new Date(currentTime).toISOString().slice(0, 13);
  const hourIndex = hourlyData.time.findIndex(t => t.startsWith(currentHour));
  
  if (hourIndex === -1) return null;
  
  return {
    temperature: hourlyData.temperature_2m[hourIndex],
    apparent_temperature: hourlyData.apparent_temperature[hourIndex],
    humidity: hourlyData.relative_humidity_2m[hourIndex],
    dew_point: hourlyData.dew_point_2m[hourIndex],
    precipitation: hourlyData.precipitation[hourIndex],
    rain: hourlyData.rain[hourIndex],
    showers: hourlyData.showers[hourIndex],
    snowfall: hourlyData.snowfall[hourIndex],
    precipitation_probability: hourlyData.precipitation_probability[hourIndex],
    visibility: hourlyData.visibility[hourIndex],
    cloud_cover: hourlyData.cloud_cover[hourIndex],
    cloud_cover_low: hourlyData.cloud_cover_low[hourIndex],
    cloud_cover_mid: hourlyData.cloud_cover_mid[hourIndex],
    cloud_cover_high: hourlyData.cloud_cover_high[hourIndex],
    wind_speed: hourlyData.wind_speed_10m[hourIndex],
    wind_direction: hourlyData.wind_direction_10m[hourIndex],
    wind_gusts: hourlyData.wind_gusts_10m[hourIndex],
    uv_index: hourlyData.uv_index[hourIndex],
    weather_code: hourlyData.weather_code[hourIndex],
    is_day: hourlyData.is_day[hourIndex],
    snow_depth: hourlyData.snow_depth[hourIndex]
  };
}

function getTodayData(dailyData, hourlyData) {
  const today = new Date().toISOString().slice(0, 10);
  const dayIndex = dailyData.time.findIndex(t => t === today);
  
  if (dayIndex === -1) return null;
  
  let humidityAvg = null, visibilityMin = null, pressureAvg = null;
  if (hourlyData) {
    const todayStart = `${today}T00:00`;
    const todayEnd = `${today}T23:59`;
    const todayHours = hourlyData.time.filter((t, i) => t >= todayStart && t <= todayEnd);
    const todayIndices = todayHours.map(t => hourlyData.time.indexOf(t));
    
    if (todayIndices.length > 0) {
      const humidities = todayIndices.map(i => hourlyData.relative_humidity_2m[i]).filter(h => h !== null);
      if (humidities.length > 0) {
        humidityAvg = Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length);
      }
      
      const visibilities = todayIndices.map(i => hourlyData.visibility[i]).filter(v => v !== null);
      if (visibilities.length > 0) {
        visibilityMin = Math.min(...visibilities);
      }
      
      const pressures = todayIndices.map(i => hourlyData.surface_pressure ? hourlyData.surface_pressure[i] : null).filter(p => p !== null);
      if (pressures.length > 0) {
        pressureAvg = Math.round(pressures.reduce((a, b) => a + b, 0) / pressures.length * 10) / 10;
      }
    }
  }
  
  return {
    date: dailyData.time[dayIndex],
    temperature_max: dailyData.temperature_2m_max[dayIndex],
    temperature_min: dailyData.temperature_2m_min[dayIndex],
    apparent_temperature_max: dailyData.apparent_temperature_max[dayIndex],
    apparent_temperature_min: dailyData.apparent_temperature_min[dayIndex],
    sunrise: dailyData.sunrise[dayIndex],
    sunset: dailyData.sunset[dayIndex],
    daylight_duration: dailyData.daylight_duration[dayIndex],
    sunshine_duration: dailyData.sunshine_duration[dayIndex],
    uv_index_max: dailyData.uv_index_max[dayIndex],
    precipitation_sum: dailyData.precipitation_sum[dayIndex],
    rain_sum: dailyData.rain_sum[dayIndex],
    showers_sum: dailyData.showers_sum[dayIndex],
    snowfall_sum: dailyData.snowfall_sum[dayIndex],
    precipitation_hours: dailyData.precipitation_hours[dayIndex],
    precipitation_probability_max: dailyData.precipitation_probability_max[dayIndex],
    wind_speed_max: dailyData.wind_speed_10m_max[dayIndex],
    wind_gusts_max: dailyData.wind_gusts_10m_max[dayIndex],
    wind_direction_dominant: dailyData.wind_direction_10m_dominant[dayIndex],
    weather_code: dailyData.weather_code[dayIndex],
    weather_text: weatherCodeToText[dailyData.weather_code[dayIndex]] || "Unknown",
    humidity_avg: humidityAvg,
    visibility_min: visibilityMin,
    pressure_avg: pressureAvg
  };
}

function getForecastDays(dailyData, days = 7) {
  const forecast = [];
  const today = new Date().toISOString().slice(0, 10);
  const todayIndex = dailyData.time.findIndex(t => t === today);
  
  if (todayIndex === -1) return forecast;
  
  for (let i = 0; i < days && (todayIndex + i) < dailyData.time.length; i++) {
    const idx = todayIndex + i;
    forecast.push({
      date: dailyData.time[idx],
      temperature_max: dailyData.temperature_2m_max[idx],
      temperature_min: dailyData.temperature_2m_min[idx],
      precipitation_sum: dailyData.precipitation_sum[idx],
      rain_sum: dailyData.rain_sum[idx],
      snowfall_sum: dailyData.snowfall_sum[idx],
      precipitation_probability_max: dailyData.precipitation_probability_max[idx],
      weather_code: dailyData.weather_code[idx],
      weather_text: weatherCodeToText[dailyData.weather_code[idx]] || "Unknown",
      sunrise: dailyData.sunrise[idx],
      sunset: dailyData.sunset[idx],
      wind_speed_max: dailyData.wind_speed_10m_max[idx],
      uv_index_max: dailyData.uv_index_max[idx]
    });
  }
  
  return forecast;
}

function getHourlyForecast(hourlyData, hours = 24) {
  const forecast = [];
  const currentTime = new Date();
  const currentHour = currentTime.toISOString().slice(0, 13);
  const startIndex = hourlyData.time.findIndex(t => t.startsWith(currentHour));
  
  if (startIndex === -1) return forecast;
  
  for (let i = 0; i < hours && (startIndex + i) < hourlyData.time.length; i++) {
    const idx = startIndex + i;
    forecast.push({
      time: hourlyData.time[idx],
      temperature: hourlyData.temperature_2m[idx],
      apparent_temperature: hourlyData.apparent_temperature[idx],
      precipitation: hourlyData.precipitation[idx],
      precipitation_probability: hourlyData.precipitation_probability[idx],
      rain: hourlyData.rain ? hourlyData.rain[idx] : null,
      showers: hourlyData.showers ? hourlyData.showers[idx] : null,
      snowfall: hourlyData.snowfall ? hourlyData.snowfall[idx] : null,
      weather_code: hourlyData.weather_code[idx],
      weather_text: weatherCodeToText[hourlyData.weather_code[idx]] || "Unknown",
      wind_speed: hourlyData.wind_speed_10m[idx],
      wind_direction: hourlyData.wind_direction_10m[idx],
      cloud_cover: hourlyData.cloud_cover[idx],
      is_day: hourlyData.is_day[idx]
    });
  }
  
  return forecast;
}

async function getOpenMeteoWeather(latitude = 43.455045, longitude = -80.55851, location = null) {
  const cacheKey = `${latitude},${longitude}`;
  
  if (Date.now() - cache.timestamp < CACHE_TTL && cache.data && cache.data.cacheKey === cacheKey) {
    return cache.data.weather;
  }

  try {
    const params = new URLSearchParams({
      latitude: latitude,
      longitude: longitude,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code,surface_pressure',
      hourly: 'temperature_2m,apparent_temperature,relative_humidity_2m,dew_point_2m,precipitation,rain,showers,snowfall,precipitation_probability,visibility,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,sunshine_duration,cloud_cover_low,cloud_cover_high,cloud_cover_mid,is_day,snow_depth,weather_code',
      daily: 'temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max,rain_sum,showers_sum,snowfall_sum,precipitation_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,weather_code',
      timezone: 'auto',
      forecast_days: 14,
      past_days: 1
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    const response = await axios.get(url);
    const data = response.data;

    const weather = {
      location: {
        name: location || `${data.latitude}, ${data.longitude}`,
        latitude: data.latitude,
        longitude: data.longitude,
        elevation: data.elevation,
        timezone: data.timezone,
        timezone_abbreviation: data.timezone_abbreviation
      },
      
      current: {
        time: data.current.time,
        temperature: data.current.temperature_2m,
        feelslike: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        is_day: data.current.is_day === 1,
        conditions: weatherCodeToText[data.current.weather_code] || "Unknown",
        weather_code: data.current.weather_code,
        cloud_cover: data.current.cloud_cover,
        pressure: data.current.surface_pressure,
        wind: {
          speed_kmh: data.current.wind_speed_10m,
          direction: data.current.wind_direction_10m,
          gusts_kmh: data.current.wind_gusts_10m
        },
        precipitation: {
          total: data.current.precipitation,
          rain: data.current.rain,
          showers: data.current.showers,
          snow: data.current.snowfall
        }
      },
      
      today: getTodayData(data.daily, data.hourly),
      
      forecast: {
        daily: getForecastDays(data.daily, 7),
        hourly: getHourlyForecast(data.hourly, 24)
      },
      
      raw: {
        daily: data.daily,
        hourly: data.hourly
      }
    };

    cache = { 
      data: { 
        cacheKey: cacheKey, 
        weather 
      }, 
      timestamp: Date.now() 
    };
    
    return weather;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${JSON.stringify(error.response.data)}`);
    } else {
      throw new Error(`Network/Code Error: ${error.message}`);
    }
  }
}

module.exports = { getOpenMeteoWeather };