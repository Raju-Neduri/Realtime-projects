const form = document.querySelector(".main_form");
const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const genderInput = document.getElementById("gender");
const countryInput = document.getElementById("country");
const scoreInput = document.getElementById("score");
const submitBtn = document.querySelector(".main_form-submit-btn");
const errorPrompter = document.querySelector(".main_error-prompter");
const scoreboardWrapper = document.querySelector(".main_scoreboard-wrapper");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

let players = JSON.parse(localStorage.getItem("players")) || [];
let rankData = JSON.parse(localStorage.getItem("rankData")) || {};

// Assign unique IDs to players if missing
function ensurePlayerIds() {
  players.forEach((p) => {
    if (!p.id) {
      p.id =
        "player_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
    }
  });
}

// Save players list to localStorage
function savePlayers() {
  localStorage.setItem("players", JSON.stringify(players));
}

// Save rankData to localStorage
function saveRankData() {
  localStorage.setItem("rankData", JSON.stringify(rankData));
}

// Show error message temporarily
function showError(message) {
  errorPrompter.textContent = message;
  errorPrompter.style.display = "block";
  setTimeout(() => {
    errorPrompter.style.display = "none";
  }, 3000);
}

// Capitalize first letter only
function formatName(name) {
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

// Validate country: only letters and spaces
function isValidCountry(country) {
  return /^[a-zA-Z\s]+$/.test(country);
}

// Sort players based on selection
function getSortedPlayers() {
  let sortedPlayers = [...players];
  const sortVal = sortSelect.value;
  if (sortVal === "name") {
    sortedPlayers.sort((a, b) =>
      (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName)
    );
  } else if (sortVal === "country") {
    sortedPlayers.sort((a, b) => a.country.localeCompare(b.country));
  } else if (sortVal === "score") {
    sortedPlayers.sort((a, b) => b.score - a.score);
  }
  return sortedPlayers;
}

// Main render function with improved rank+score movement tracking
function renderPlayers() {
  ensurePlayerIds();

  const sorted = getSortedPlayers();
  const filterText = searchInput.value.toLowerCase().trim();
  const filtered = sorted.filter(
    (p) =>
      (p.firstName + " " + p.lastName).toLowerCase().includes(filterText) ||
      p.country.toLowerCase().includes(filterText)
  );

  scoreboardWrapper.innerHTML = "";

  // Temporary store current ranks for updating rankData AFTER rendering
  const currentRanks = {};

  filtered.forEach((player, index) => {
    const currentRank = index + 1;
    currentRanks[player.id] = currentRank;

    const prevRankEntry = rankData[player.id];

    // Default movement arrow is no change
    let movement = "–";

    if (!prevRankEntry) {
      // First time, no previous data
      movement = "–";
      rankData[player.id] = {
        rank: currentRank,
        score: player.score,
        movement: movement,
      };
    } else {
      // Compare current and previous rank and score
      if (currentRank < prevRankEntry.rank) {
        // Improved rank
        movement = "▲";
      } else if (currentRank > prevRankEntry.rank) {
        // Worse rank
        movement = "▼";
      } else {
        // Rank same, check score change
        if (player.score > (prevRankEntry.score ?? player.score)) {
          movement = "▲";
        } else if (player.score < (prevRankEntry.score ?? player.score)) {
          movement = "▼";
        } else {
          // No change in score or rank, keep previous movement
          movement = prevRankEntry.movement || "–";
        }
      }
      // Update stored movement and score for next render
      rankData[player.id].movement = movement;
      rankData[player.id].score = player.score;
      rankData[player.id].rank = currentRank;
    }

    const playerRow = document.createElement("div");
    playerRow.className = "main_scoreboard fade-in";

    // Left container with rank + arrow + player info
    const leftDiv = document.createElement("div");
    leftDiv.style.display = "flex";
    leftDiv.style.alignItems = "center";
    leftDiv.style.gap = "1rem";
    leftDiv.style.flexGrow = "1";
    leftDiv.style.minWidth = "0";

    // Rank display: crown for 1st, number otherwise
    const rankSpan = document.createElement("span");
    rankSpan.className = "main_player-rank";
    if (index === 0) {
      rankSpan.textContent = "👑";
      rankSpan.style.fontSize = "1.3rem";
    } else {
      rankSpan.textContent = currentRank;
    }
    leftDiv.appendChild(rankSpan);

    // Movement arrow span
    const movementSpan = document.createElement("span");
    movementSpan.textContent = movement;
    movementSpan.className =
      movement === "▲"
        ? "arrow-up"
        : movement === "▼"
        ? "arrow-down"
        : "arrow-placeholder";
    leftDiv.appendChild(movementSpan);

    // Player name + timestamp container
    const playerInfo = document.createElement("div");
    playerInfo.style.display = "flex";
    playerInfo.style.flexDirection = "column";
    playerInfo.style.minWidth = "0";

    const playerName = document.createElement("span");
    playerName.className = "main_player-name";
    playerName.textContent = player.firstName + " " + player.lastName;
    playerName.style.whiteSpace = "nowrap";
    playerName.style.overflow = "hidden";
    playerName.style.textOverflow = "ellipsis";
    playerInfo.appendChild(playerName);

    const timeStamp = document.createElement("span");
    timeStamp.className = "main_time-stamp";
    timeStamp.textContent = new Date(player.timestamp).toLocaleString();
    timeStamp.style.fontSize = "0.85rem";
    timeStamp.style.color = "#666";
    timeStamp.style.marginTop = "4px";
    playerInfo.appendChild(timeStamp);

    leftDiv.appendChild(playerInfo);
    playerRow.appendChild(leftDiv);

    // Gender column (new column)
    const genderSpan = document.createElement("span");
    genderSpan.className = "main_player-gender";
    genderSpan.textContent = player.gender;
    genderSpan.style.fontWeight = "600";
    genderSpan.style.fontSize = "1rem";
    genderSpan.style.color = "#666";
    genderSpan.style.minWidth = "60px";
    genderSpan.style.textAlign = "center";
    playerRow.appendChild(genderSpan);

    // Country display (uppercase)
    const countrySpan = document.createElement("span");
    countrySpan.className = "main_player-country";
    countrySpan.textContent = player.country.toUpperCase();
    playerRow.appendChild(countrySpan);

    // Score controls: decrease, score display, increase
    const scoreDiv = document.createElement("div");
    scoreDiv.className = "main_player-score";

    const decreaseBtn = document.createElement("button");
    decreaseBtn.textContent = "-";
    decreaseBtn.title = "Decrease score";
    decreaseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (player.score > 0) {
        player.score--;
        player.timestamp = Date.now();
        sortSelect.value = "score"; // Change sort to score on click
        savePlayers();
        renderPlayers();
      }
    });

    const scoreSpan = document.createElement("span");
    scoreSpan.textContent = player.score;

    const increaseBtn = document.createElement("button");
    increaseBtn.textContent = "+";
    increaseBtn.title = "Increase score";
    increaseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      player.score++;
      player.timestamp = Date.now();
      sortSelect.value = "score"; // Change sort to score on click
      savePlayers();
      renderPlayers();
    });

    scoreDiv.appendChild(decreaseBtn);
    scoreDiv.appendChild(scoreSpan);
    scoreDiv.appendChild(increaseBtn);
    playerRow.appendChild(scoreDiv);

    // Delete button container
    const btnContainer = document.createElement("div");
    btnContainer.className = "main_scoreboard-btn-container";

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = "🗑️";
    deleteBtn.title = "Delete player";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      playerRow.classList.add("fade-out");
      setTimeout(() => {
        players = players.filter((p) => p !== player);
        savePlayers();

        // Remove rankData for deleted player
        delete rankData[player.id];
        saveRankData();

        // Also switch sort to score after deletion
        sortSelect.value = "score";

        renderPlayers();
      }, 400);
    });

    btnContainer.appendChild(deleteBtn);
    playerRow.appendChild(btnContainer);

    scoreboardWrapper.appendChild(playerRow);
  });

  saveRankData();
}

// Form submit handler
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const firstName = formatName(firstNameInput.value.trim());
  const lastName = formatName(lastNameInput.value.trim());
  const gender = genderInput.value;
  const country = countryInput.value.trim();
  const score = parseInt(scoreInput.value, 10) || 0;

  if (!firstName || !lastName || !gender || !country) {
    showError("Please fill all fields.");
    return;
  }

  if (!isValidCountry(country)) {
    showError("Country must contain only letters.");
    return;
  }

  // Check for duplicates by full name (case-insensitive)
  const exists = players.some(
    (p) =>
      p.firstName.toLowerCase() === firstName.toLowerCase() &&
      p.lastName.toLowerCase() === lastName.toLowerCase()
  );
  if (exists) {
    showError("Player with this name already exists.");
    return;
  }

  const newPlayer = {
    firstName,
    lastName,
    gender,
    country,
    score,
    timestamp: Date.now(),
  };

  players.push(newPlayer);
  savePlayers();
  renderPlayers();

  // Clear inputs
  firstNameInput.value = "";
  lastNameInput.value = "";
  genderInput.value = "";
  countryInput.value = "";
  scoreInput.value = "";
});

// Render on search input change
searchInput.addEventListener("input", renderPlayers);
// Render on sort selection change
sortSelect.addEventListener("change", renderPlayers);

// Initial render
renderPlayers();

//toggle
const toggleBtn = document.getElementById("themeToggle");
const body = document.body;

// Load saved theme
if (localStorage.getItem("theme") === "dark") {
  body.classList.add("dark-mode");
} else {
  body.classList.add("light-mode");
}

toggleBtn.addEventListener("click", () => {
  body.classList.toggle("dark-mode");
  body.classList.toggle("light-mode");
  localStorage.setItem(
    "theme",
    body.classList.contains("dark-mode") ? "dark" : "light"
  );
});
