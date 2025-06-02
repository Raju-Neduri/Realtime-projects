// Initialize with sample data
document.addEventListener("DOMContentLoaded", function () {
  // Set current date and time
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  document.getElementById("currentDate").textContent = now.toLocaleDateString(
    "en-US",
    options
  );
  document.getElementById("date").textContent = now.toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" }
  );

  // Update time every minute
  setInterval(updateTime, 60000);
  updateTime();
});

function updateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  document.getElementById("time").textContent = timeString;
}

function dateFormat(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

function showLoading() {
  document.getElementById("spinner").style.display = "block";
  document.getElementById("errorMessage").style.display = "none";
}

function hideLoading() {
  document.getElementById("spinner").style.display = "none";
}

function showError() {
  document.getElementById("errorMessage").style.display = "block";
}

async function fetchAQIData(lat, lon) {
  try {
    let response = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=d28274b5fe592e1f1e558103a5e66370`
    );
    if (!response.ok) throw new Error("AQI data unavailable");

    let data = await response.json();
    let list = data.list[0].components;

    $("#no2Value")[0].innerText = list.no2.toFixed(1);
    $("#o3Value")[0].innerText = list.o3.toFixed(1);
    $("#coValue")[0].innerText = list.co.toFixed(1);
    $("#so2Value")[0].innerText = list.so2.toFixed(1);
  } catch (error) {
    console.error("Error fetching AQI data:", error);
    $("#no2Value")[0].innerText = "N/A";
    $("#o3Value")[0].innerText = "N/A";
    $("#coValue")[0].innerText = "N/A";
    $("#so2Value")[0].innerText = "N/A";
  }
}

async function nextFiveDays(lat, lon) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=d28274b5fe592e1f1e558103a5e66370&units=metric`
    );
    if (!response.ok) throw new Error("Forecast data unavailable");

    const data = await response.json();
    let dailyForecasts = {};

    // Extract unique daily data
    data.list.forEach((item) => {
      let date = item.dt_txt.split(" ")[0];
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = {
          temp: item.main.temp.toFixed(1),
          icon: item.weather[0].icon,
          day: new Date(date).toLocaleDateString("en-US", {
            weekday: "long",
          }),
          date: new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        };
      }
    });

    // Get first 5 unique days
    let forecastHtml = "";
    Object.keys(dailyForecasts)
      .slice(0, 5)
      .forEach((date) => {
        let forecast = dailyForecasts[date];
        forecastHtml += `
                <div class="forecastRow">
                  <div class="forecast1 d-flex align-items-center">
                    <img src="https://openweathermap.org/img/wn/${forecast.icon}.png" alt="Weather" width="35">
                    <h6 class="m-0">${forecast.temp} &deg;C</h6>
                  </div>
                  <div class="forecast2">
                    <h6 class="m-0">${forecast.day}</h6>
                    <h6 class="m-0">${forecast.date}</h6>
                  </div>
                </div>
              `;
      });

    document.getElementById("forecastContainer").innerHTML = forecastHtml;
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    document.getElementById("forecastContainer").innerHTML =
      '<p class="text-center">Forecast data unavailable</p>';
  }
}

async function todayTemps(lat, lon) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=d28274b5fe592e1f1e558103a5e66370&units=metric`
    );
    if (!response.ok) throw new Error("Hourly data unavailable");

    const data = await response.json();
    let now = new Date();
    let todayDate = now.toISOString().split("T")[0];
    let currentHour = now.getHours();

    // Find the closest forecast point to the current hour
    let closestIndex = 0;
    let minDiff = 24;
    for (let i = 0; i < data.list.length; i++) {
      let itemHour = new Date(data.list[i].dt_txt).getHours();
      let itemDate = data.list[i].dt_txt.split(" ")[0];
      let diff = Math.abs(
        (itemDate === todayDate ? itemHour : itemHour + 24) - currentHour
      );
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    // Collect up to 24 forecast points from the closest to now
    let nextForecasts = data.list.slice(closestIndex, closestIndex + 24);

    let todayHtml = "";
    nextForecasts.forEach((item, idx) => {
      let itemDate = item.dt_txt.split(" ")[0];
      let showDate = "";
      if (itemDate !== todayDate) {
        // Format as e.g. Jun 3
        let d = new Date(item.dt_txt);
        showDate = `<div style='font-size:0.95em;opacity:0.8;margin-bottom:2px;'>${d.toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric" }
        )}</div>`;
      }
      let time = new Date(item.dt_txt).toLocaleTimeString("en-US", {
        hour: "numeric",
        hour12: true,
      });
      let temp = item.main.temp.toFixed(1);
      let icon = item.weather[0].icon;
      todayHtml += `
              <div class="todayTemp">
                ${showDate}
                <h6 class="m-0">${idx === 0 ? "Now" : time}</h6>
                <img src="https://openweathermap.org/img/wn/${icon}.png" alt="Weather" width="50">
                <h5>${temp}&deg;C</h5>
              </div>
            `;
    });

    document.getElementById("todayTempContainer").innerHTML = todayHtml;
  } catch (error) {
    console.error("Error fetching hourly data:", error);
    document.getElementById("todayTempContainer").innerHTML =
      '<p class="text-center">Hourly data unavailable</p>';
  }
}

async function fetchData() {
  const cityInput = document.getElementById("cityInput");
  let cityName = cityInput.value.trim();

  if (!cityName) {
    cityInput.focus();
    return;
  }

  showLoading();

  try {
    let response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=d28274b5fe592e1f1e558103a5e66370&units=metric`
    );

    if (!response.ok) {
      throw new Error("City not found");
    }

    let data = await response.json();
    console.log("Weather Data: ", data);

    // Update main weather info
    $("#cityName").text(data.name);
    $("#cityTemp").text(data.main.temp.toFixed(1));
    $("#skyDesc").text(data.weather[0].description);

    // Update weather icon
    const iconCode = data.weather[0].icon;
    $("#weatherIcon").attr(
      "src",
      `https://openweathermap.org/img/wn/${iconCode}@2x.png`
    );

    // Update metrics
    $("#humidity").text(`${data.main.humidity}%`);
    $("#pressure").text(`${data.main.pressure} hPa`);
    $("#feelsLike").text(`${data.main.feels_like.toFixed(1)} °C`);
    $("#visiblity").text(`${(data.visibility / 1000).toFixed(1)} km`);

    // Update date and time
    let properDate = dateFormat(data.dt);
    let date = properDate.split(",")[0];
    let time = properDate.split(",")[1] ? properDate.split(",")[1].trim() : "";
    $("#date").text(date);
    $("#time").text(time);

    // Update sunrise and sunset
    let sunrise = new Date(data.sys.sunrise * 1000);
    let sunset = new Date(data.sys.sunset * 1000);
    $("#sunriseTime")[0].innerText = sunrise.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    $("#sunsetTime")[0].innerText = sunset.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    // Fetch additional data
    let lat = data.coord.lat;
    let lon = data.coord.lon;
    await Promise.all([
      fetchAQIData(lat, lon),
      nextFiveDays(lat, lon),
      todayTemps(lat, lon),
    ]);

    hideLoading();
    showError(false);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    hideLoading();
    showError();
    return;
  }

  // After updating all weather data, ensure responsive layout refresh
  // Remove any fixed heights that may cause overflow or layout issues
  $(".mainContentParentDiv").css({
    height: "",
    minHeight: "",
    maxHeight: "",
  });
  $(".leftDiv").css({ height: "", minHeight: "", maxHeight: "" });
  $(".rightDiv").css({ height: "", minHeight: "", maxHeight: "" });
  $(".currentTempDiv").css({ height: "", minHeight: "", maxHeight: "" });
  $(".nextFiveDays").css({ height: "", minHeight: "", maxHeight: "" });
  // Optionally, trigger a window resize event to force reflow
  window.dispatchEvent(new Event("resize"));
  // Hide error message if data loaded successfully
  $("#errorMessage").hide();
}

// Enable search on Enter key
document
  .getElementById("cityInput")
  .addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      fetchData();
    }
  });
