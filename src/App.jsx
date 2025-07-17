import React, { useState, useEffect } from "react";
import WeatherBackground from "./components/WeatherBackground";
import axios from "axios";
import {
  convertTemperature,
  getHumidityValue,
  getVisibilityValue,
  getWindDirection,
} from "./components/Helper";
import {
  HumidityIcon,
  WindIcon,
  VisibilityIcon,
  SunriseIcon,
  SunsetIcon,
} from "./components/Icons";

const App = () => {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState("");
  const [suggestion, setSuggestion] = useState([]);
  const [unit, setUnit] = useState("C");
  const [error, setError] = useState("");

  const API_KEY = "23598358356b9e87f0b18be236e8bc8c";

  useEffect(() => {
    if (city.trim().length >= 3 && !weather) {
      const timer = setTimeout(() => fetchSuggestion(city), 500);
      return () => clearTimeout(timer);
    }
    setSuggestion([]);
  }, [city, weather]);

  const fetchSuggestion = async (query) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`
      );
      res.ok ? setSuggestion(await res.json()) : setSuggestion([]);
    } catch {
      setSuggestion([]);
    }
  };

  const fetchWeatherData = async (url, placeName = "") => {
    try {
      const res = await axios.get(url);
      setWeather(res.data);
      setCity(placeName || res.data.name);
      setSuggestion([]);
      setError("");
    } catch (err) {
      console.error("Error fetching weather:", err);
      setError("Location not found. Please try again.");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (city.length < 3) return;
    try {
      const geoRes = await axios.get(
        `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=5&appid=${API_KEY}`
      );
      setSuggestion(geoRes.data);
    } catch (err) {
      console.error("Geocoding error:", err);
      setError("Unable to locate the specified city.");
    }
  };

  const getWeatherCondition = () =>
    weather && {
      main: weather.weather[0].main,
      isDay:
        Date.now() / 1000 > weather.sys.sunrise &&
        Date.now() / 1000 < weather.sys.sunset,
    };

  const convertTemp = (tempC) => {
    return unit === "C"
      ? `${tempC}°C`
      : `${((tempC * 9) / 5 + 32).toFixed(1)}°F`;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen">
      <WeatherBackground condition={getWeatherCondition()} />
      <div className="flex items-center justify-center p-6 min-h-screen">
        <div className="bg-transparent backdrop-blur-md rounded-xl shadow-2xl p-8 max-w-md text-white w-full border border-white/30 relative z-30">
          <h1 className="text-4xl font-extrabold text-center mb-6">
            Weather Forecast
          </h1>

          {error && <p className="text-red-400 text-center mb-2">{error}</p>}

          {!weather ? (
            <form
              onSubmit={handleSearch}
              className="flex flex-col relative text-white"
            >
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city name (minimum 3 characters)"
                className="mb-4 p-3 rounded border border-white bg-transparent text-white placeholder-white focus:outline-none focus:border-blue-300 transition duration-300"
              />

              {suggestion.length > 0 && (
                <div className="absolute top-12 left-0 right-0 bg-white text-black shadow-md rounded z-10">
                  {suggestion.map((s) => (
                    <button
                      type="button"
                      key={`${s.lat}-${s.lon}`}
                      onClick={() =>
                        fetchWeatherData(
                          `https://api.openweathermap.org/data/2.5/weather?lat=${s.lat}&lon=${s.lon}&appid=${API_KEY}&units=metric`,
                          `${s.name}, ${s.country}${
                            s.state ? `, ${s.state}` : ""
                          }`
                        )
                      }
                      className="block hover:bg-blue-700 px-4 py-2 text-sm text-left w-full transition-colors"
                    >
                      {s.name}, {s.country}
                      {s.state && `, ${s.state}`}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="submit"
                className="bg-purple-700 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                Search Weather
              </button>
            </form>
          ) : (
            <div className="mt-6 text-center transition-opacity duration-500">
              <h2 className="text-xl font-semibold mb-4">{city}</h2>
              <p className="text-lg capitalize">
                {weather.weather[0].description},{" "}
                {convertTemp(weather.main.temp)}
              </p>

              <div className="flex justify-between items-center mt-4">
                <h2 className="text-2xl font-bold">{weather.name}</h2>
                <button
                  onClick={() => setUnit((u) => (u === "C" ? "F" : "C"))}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-1 px-3 rounded transition-colors"
                >
                  &deg;{unit}
                </button>
              </div>

              <img
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                alt={weather.weather[0].description}
                className="mx-auto my-4 animate-bounce"
              />

              <p className="text-4xl mb-1">
                {convertTemperature(weather.main.temp, unit)}°{unit}
              </p>
              <p className="capitalize mb-4">
                {weather.weather[0].description}
              </p>

              <div className="flex flex-wrap justify-around mt-6">
                {[
                  [
                    HumidityIcon,
                    "Humidity",
                    `${weather.main.humidity}% (${getHumidityValue(
                      weather.main.humidity
                    )})`,
                  ],
                  [
                    WindIcon,
                    "Wind Speed",
                    `${weather.wind.speed} m/s (${getWindDirection(
                      weather.wind.deg
                    )})`,
                  ],
                  [
                    VisibilityIcon,
                    "Visibility",
                    getVisibilityValue(weather.visibility),
                  ],
                  [SunriseIcon, "Sunrise", formatTime(weather.sys.sunrise)],
                  [SunsetIcon, "Sunset", formatTime(weather.sys.sunset)],
                ].map(([Icon, label, value]) => (
                  <div key={label} className="flex flex-col items-center m-2">
                    <Icon />
                    <p className="mt-1 font-semibold">{label}</p>
                    <p className="text-sm">{value}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setWeather(null);
                  setCity("");
                }}
                className="mt-4 bg-purple-900 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded transition-colors"
              >
                Search Another Location
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;