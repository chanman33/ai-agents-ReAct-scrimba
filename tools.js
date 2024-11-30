/**
 * Get current weather for a location
 * @param {Object} params
 * @param {string} params.location - Location to get weather for
 * @param {('celsius'|'fahrenheit')} params.unit - Temperature unit
 * @returns {Promise<Object>} Weather data
 */
export async function getCurrentWeather({ location, unit = 'celsius' }) {
    try {
        const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
        const units = unit === 'celsius' ? 'metric' : 'imperial';
        
        // First, get coordinates for the location
        const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${API_KEY}`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();
        
        if (!geoData.length) {
            throw new Error(`Location not found: ${location}`);
        }
        
        const { lat, lon } = geoData[0];
        
        // Then get weather data using coordinates
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();
        
        if (weatherResponse.status !== 200) {
            throw new Error(`Weather API error: ${weatherData.message}`);
        }
        
        return {
            location: weatherData.name,
            temperature: Math.round(weatherData.main.temp),
            unit: unit === 'celsius' ? '°C' : '°F',
            description: weatherData.weather[0].description,
            humidity: weatherData.main.humidity,
            windSpeed: weatherData.wind.speed,
            forecast: weatherData.weather[0].main
        };
    } catch (error) {
        console.error('Error fetching weather:', error);
        throw new Error(`Failed to get weather for ${location}: ${error.message}`);
    }
}

export async function getLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/')
        const text = await response.json()
        return JSON.stringify(text)
    } catch (err) {
        console.log(err)
    }
}

