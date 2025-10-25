const backendUrl = "http://127.0.0.1:8000"; // replace with your deployed backend if needed

//chart variables
let fishChartInstance = null;
let timeChartInstance = null;

// Submit new catch
document.getElementById("catchForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const catchData = Object.fromEntries(formData);

  if (!catchData.date) catchData.date = new Date().toISOString().slice(0, 10);
  if (!catchData.time) catchData.time = new Date().toLocaleTimeString('en-GB', { hour12: false });

  try {
    const res = await fetch(`${backendUrl}/log-catch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(catchData),
    });

    const result = await res.json();

    if (result.success) {
      e.target.reset();
      await loadCatches();
      await loadChart();
      await loadTimeChart();
    } else {
      alert("❌ Error logging catch: " + JSON.stringify(result));
    }
  } catch (err) {
    alert("❌ Network or server error: " + err.message);
  }
});

async function loadCatches() {
  const res = await fetch(`${backendUrl}/catches`);
  const json = await res.json();
  const tbody = document.querySelector("#catchesTable tbody");
  tbody.innerHTML = "";

  json.data.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.date}</td>
      <td>${c.time}</td>
      <td>${c.location}</td>
      <td>${c.species}</td>
      <td>${c.length_in}</td>
      <td>${c.weight_lbs}</td>
      <td>${c.weather || ""}</td>
      <td>${c.bait || ""}</td>
      <td>
        <button onclick='openEditForm(${JSON.stringify(c)})'>Edit</button>
        <button onclick='deleteCatch(${c.id})'>Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Refresh charts **after** table is loaded
  await loadChart();
  await loadTimeChart();
}



// Delete a catch by ID
async function deleteCatch(id) {
  try {
    const res = await fetch(`${backendUrl}/delete-catch/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" } // optional for DELETE
    });

    const result = await res.json();

    if (result.success) {
      loadCatches();
    } else {
      alert("❌ Error deleting catch: " + (result.message || "Unknown error"));
    }
  } catch (err) {
    alert("❌ Network or server error: " + err.message);
  }
}


// Open modal and pre-fill values
function openEditForm(catchData) {
  document.getElementById("editModal").style.display = "block";

  // populate fields
  document.getElementById("editId").value = catchData.id;
  document.getElementById("editDate").value = catchData.date || "";
  document.getElementById("editTime").value = catchData.time || "";
  document.getElementById("editLocation").value = catchData.location || "";
  document.getElementById("editSpecies").value = catchData.species || "";
  document.getElementById("editLength").value = catchData.length_in || "";
  document.getElementById("editWeight").value = catchData.weight_lbs || "";
  document.getElementById("editWeather").value = catchData.weather || "";
  document.getElementById("editBait").value = catchData.bait || "";
}


// Close modal
function closeEditForm() {
  document.getElementById("editModal").style.display = "none";
}

// Handle save
document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // stop the page from reloading

  const id = document.getElementById("editId").value;

  const updatedCatch = {
    date: document.getElementById("editDate").value,
    time: document.getElementById("editTime").value,
    location: document.getElementById("editLocation").value,
    species: document.getElementById("editSpecies").value,
    length_in: parseFloat(document.getElementById("editLength").value),
    weight_lbs: parseFloat(document.getElementById("editWeight").value),
    weather: document.getElementById("editWeather").value,
    bait: document.getElementById("editBait").value,
  };

  try {
    const res = await fetch(`${backendUrl}/edit-catch/${id}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(updatedCatch),
});


    if (res.ok) {
      closeEditForm();
      loadCatches(); // refresh table
    } else {
      console.error("Failed to update row");
    }
  } catch (err) {
    console.error("Error:", err);
  }
});

async function loadChart() {
  const res = await fetch(`${backendUrl}/catches`);
  const json = await res.json();
  const data = json.data;

  if (!data || data.length === 0) return;

  const speciesCounts = {};
  data.forEach(c => {
    speciesCounts[c.species] = (speciesCounts[c.species] || 0) + 1;
  });

  const species = Object.keys(speciesCounts);
  const counts = Object.values(speciesCounts);

  const ctx = document.getElementById("fishChart").getContext("2d");

  // Destroy old chart if it exists
  if (fishChartInstance) fishChartInstance.destroy();

  fishChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: species,
      datasets: [{
        label: "Number of Fish Caught",
        data: counts,
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}

async function loadTimeChart() {
  const res = await fetch(`${backendUrl}/catches`);
  const json = await res.json();
  const data = json.data;

  if (!data || data.length === 0) return;

  const catchesByDate = {};
  data.forEach(c => {
    const date = c.date ? c.date.split("T")[0] : "Unknown";
    catchesByDate[date] = (catchesByDate[date] || 0) + 1;
  });

  const sortedDates = Object.keys(catchesByDate).sort();
  const catchCounts = sortedDates.map(date => catchesByDate[date]);

  const ctx = document.getElementById("timeChart").getContext("2d");

  if (timeChartInstance) timeChartInstance.destroy();

  timeChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: sortedDates,
      datasets: [{
        label: "Number of Fish Caught",
        data: catchCounts,
        fill: false,
        borderColor: "rgba(75, 192, 192, 1)",
        tension: 0.2,
        pointBackgroundColor: "rgba(75, 192, 192, 1)"
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Date" } },
        y: { beginAtZero: true, title: { display: true, text: "Catches" }, ticks: { stepSize: 1 } }
      }
    }
  });
}


// Load catches and charts on page load
loadTimeChart();
loadChart();
loadCatches();
