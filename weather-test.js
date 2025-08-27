const { getFullWeather } = require("./functions/weather");

(async () => {
  const weatherData = await getFullWeather("Waterloo,Ontario,Canada");
  console.log("Weather Data:", JSON.stringify(weatherData, null, 2));

})();