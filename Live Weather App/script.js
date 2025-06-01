const apiKey = "YOUR_API_KEY"; // Get from https://openweathermap.org/api

async function getWeather() {
  const city = document.getElementById("cityInput").value;
  if (!city) return alert("Please enter a city.");

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
  );
  const data = await res.json();

  if (data.cod !== 200) {
    alert("City not found");
    return;
  }

  const weatherHTML = `
    <div class="weather-box">
      <h2>${data.name}, ${data.sys.country}</h2>
      <p>${data.weather[0].main}</p>
      <p><strong>${Math.round(data.main.temp)}°C</strong></p>
      <p>Humidity: ${data.main.humidity}%</p>
      <p>Wind: ${data.wind.speed} m/s</p>
      <p>Pressure: ${data.main.pressure} hPa</p>
    </div>
  `;

  document.getElementById("weatherDisplay").innerHTML = weatherHTML;
}
