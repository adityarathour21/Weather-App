const WMO_CODES = {
  0:  { desc: "Clear sky",              icon: "☀️", theme: "sunny" },
  1:  { desc: "Mainly clear",           icon: "🌤️", theme: "sunny" },
  2:  { desc: "Partly cloudy",          icon: "⛅",  theme: "cloudy" },
  3:  { desc: "Overcast",               icon: "☁️", theme: "cloudy" },
  45: { desc: "Fog",                    icon: "🌫️", theme: "cloudy" },
  48: { desc: "Depositing rime fog",    icon: "🌫️", theme: "cloudy" },
  51: { desc: "Light drizzle",          icon: "🌦️", theme: "rainy" },
  53: { desc: "Moderate drizzle",       icon: "🌦️", theme: "rainy" },
  55: { desc: "Dense drizzle",          icon: "🌧️", theme: "rainy" },
  61: { desc: "Slight rain",            icon: "🌦️", theme: "rainy" },
  63: { desc: "Moderate rain",          icon: "🌧️", theme: "rainy" },
  65: { desc: "Heavy rain",             icon: "🌧️", theme: "rainy" },
  71: { desc: "Slight snow",            icon: "🌨️", theme: "snowy" },
  73: { desc: "Moderate snow",          icon: "🌨️", theme: "snowy" },
  75: { desc: "Heavy snow",             icon: "❄️", theme: "snowy" },
  77: { desc: "Snow grains",            icon: "❄️", theme: "snowy" },
  80: { desc: "Slight rain showers",    icon: "🌦️", theme: "rainy" },
  81: { desc: "Moderate rain showers",  icon: "🌧️", theme: "rainy" },
  82: { desc: "Violent rain showers",   icon: "⛈️", theme: "rainy" },
  85: { desc: "Slight snow showers",    icon: "🌨️", theme: "snowy" },
  86: { desc: "Heavy snow showers",     icon: "🌨️", theme: "snowy" },
  95: { desc: "Thunderstorm",           icon: "⛈️", theme: "rainy" },
  96: { desc: "Thunderstorm w/ hail",   icon: "⛈️", theme: "rainy" },
  99: { desc: "Thunderstorm w/ heavy hail", icon: "⛈️", theme: "rainy" },
};

const main = document.getElementById("main");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const geoBtn = document.getElementById("geoBtn");

function showLoading() {
  main.innerHTML = `<div class="loading"><div class="spinner"></div><p style="margin-top:15px;">Loading weather...</p></div>`;
}

function showError(msg) {
  main.innerHTML = `<div class="error">⚠️ ${msg}</div>`;
}

async function geocode(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.results || data.results.length === 0) throw new Error("City not found");
  return data.results[0];
}

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
              `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m` +
              `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
              `&timezone=auto&forecast_days=7`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch weather");
  return res.json();
}

function windDir(deg) {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function dayName(iso, idx) {
  if (idx === 0) return "Today";
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short" });
}

function render(location, data) {
  const c = data.current;
  const d = data.daily;
  const wmo = WMO_CODES[c.weather_code] || { desc: "Unknown", icon: "❓", theme: "cloudy" };

  let theme = wmo.theme;
  if (c.is_day === 0 && (theme === "sunny" || theme === "cloudy")) theme = "night";
  document.body.className = theme;

  const forecastHTML = d.time.map((t, i) => {
    const dw = WMO_CODES[d.weather_code[i]] || { icon: "❓" };
    return `
      <div class="day">
        <div class="name">${dayName(t, i)}</div>
        <div class="icon">${dw.icon}</div>
        <div class="temps">
          <span class="hi">${Math.round(d.temperature_2m_max[i])}°</span>
          <span class="lo">${Math.round(d.temperature_2m_min[i])}°</span>
        </div>
      </div>`;
  }).join("");

  main.innerHTML = `
    <div class="card current">
      <div class="location">${location.name}${location.admin1 ? ", " + location.admin1 : ""}${location.country ? ", " + location.country : ""}</div>
      <div class="date">${formatDate(d.time[0])}</div>
      <div class="icon">${wmo.icon}</div>
      <div class="temp">${Math.round(c.temperature_2m)}°C</div>
      <div class="desc">${wmo.desc}</div>
      <div class="details">
        <div class="detail">
          <div class="label">Feels like</div>
          <div class="value">${Math.round(c.apparent_temperature)}°</div>
        </div>
        <div class="detail">
          <div class="label">Humidity</div>
          <div class="value">${c.relative_humidity_2m}%</div>
        </div>
        <div class="detail">
          <div class="label">Wind</div>
          <div class="value">${Math.round(c.wind_speed_10m)} km/h ${windDir(c.wind_direction_10m)}</div>
        </div>
        <div class="detail">
          <div class="label">Sunrise</div>
          <div class="value">${new Date(d.sunrise[0]).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
        </div>
        <div class="detail">
          <div class="label">Sunset</div>
          <div class="value">${new Date(d.sunset[0]).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="forecast-title">7-DAY FORECAST</div>
      <div class="forecast">${forecastHTML}</div>
    </div>
  `;
}

async function loadCity(city) {
  showLoading();
  try {
    const loc = await geocode(city);
    const data = await fetchWeather(loc.latitude, loc.longitude);
    render(loc, data);
  } catch (e) {
    showError(e.message);
  }
}

async function loadCoords(lat, lon, name) {
  showLoading();
  try {
    const data = await fetchWeather(lat, lon);
    render({ name: name || "Your Location" }, data);
  } catch (e) {
    showError(e.message);
  }
}

searchBtn.addEventListener("click", () => {
  const v = cityInput.value.trim();
  if (v) loadCity(v);
});

cityInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const v = cityInput.value.trim();
    if (v) loadCity(v);
  }
});

geoBtn.addEventListener("click", () => {
  if (!navigator.geolocation) return showError("Geolocation not supported");
  showLoading();
  navigator.geolocation.getCurrentPosition(
    pos => loadCoords(pos.coords.latitude, pos.coords.longitude, "Your Location"),
    () => showError("Location permission denied")
  );
});

// Default load
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    pos => loadCoords(pos.coords.latitude, pos.coords.longitude, "Your Location"),
    () => loadCity("London")
  );
} else {
  loadCity("London");
}