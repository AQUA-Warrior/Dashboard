const { getOpenMeteoWeather } = require('./functions/weather');

// cardinal direction helper
function getWindDirection(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

getOpenMeteoWeather(43.455045, -80.55851, "Waterloo, Ontario")
  .then(weather => {
    // Access current conditions
    console.log("Current Temperature:", weather.current.temperature + "°C");
    console.log("Feels Like:", weather.current.feelslike + "°C");
    console.log("Conditions:", weather.current.conditions);
    console.log("Humidity:", weather.current.humidity + "%");
    console.log("Wind Speed:", weather.current.wind.speed_kmh + " km/h");
    console.log("Wind Direction:", weather.current.wind.direction + "° (" + getWindDirection(weather.current.wind.direction) + ")");
    
    // Access today's forecast
    console.log("\nToday's Forecast:");
    console.log("High:", weather.today.temperature_max + "°C");
    console.log("Low:", weather.today.temperature_min + "°C");
    console.log("Precipitation:", weather.today.precipitation_sum + " mm");
    
    // Access 7-day forecast
    console.log("\n7-Day Forecast:");
    weather.forecast.daily.forEach(day => {
      console.log(`${day.date}: ${day.weather_text}, High: ${day.temperature_max}°C, Low: ${day.temperature_min}°C`);
    });
    
    // Access hourly forecast (next 24 hours)
    console.log("\nNext 24 Hours:");
    weather.forecast.hourly.slice(0, 24).forEach(hour => {
      console.log(`${hour.time}: ${hour.temperature}°C, ${hour.weather_text}`);
    });
  })
  .catch(error => {
    console.error('Error:', error.message);
  });