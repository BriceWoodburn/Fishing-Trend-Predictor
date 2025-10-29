const backendUrl = "http://127.0.0.1:8000";

// Chart instances
let fishChartInstance = null;
let timeChartInstance = null;
let baitChartInstance = null;
let avgWeightChartInstance = null;
let avgLengthChartInstance = null;

/* -------------------- Home Page: Catches -------------------- */
if (document.getElementById("catchForm")) {
  const catchForm = document.getElementById("catchForm");

  catchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(catchForm);
    const catchData = Object.fromEntries(formData);

    // Default date/time
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
        catchForm.reset();
        await loadCatches();
      } else {
        alert("❌ Error logging catch: " + JSON.stringify(result));
      }
    } catch (err) {
      alert("❌ Network or server error: " + err.message);
    }
  });

  loadCatches();
}

// Load catches and populate table
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

  // Refresh charts if on charts page
  if (document.getElementById("fishChart")) {
    await loadAllCharts();
  }
}

// Delete catch
async function deleteCatch(id) {
  try {
    const res = await fetch(`${backendUrl}/delete-catch/${id}`, { method: "DELETE" });
    const result = await res.json();
    if (result.success) loadCatches();
    else alert("❌ Error deleting catch: " + (result.message || "Unknown error"));
  } catch (err) {
    alert("❌ Network or server error: " + err.message);
  }
}

// Edit modal
function openEditForm(c) {
  const modal = document.getElementById("editModal");
  modal.style.display = "block";

  document.getElementById("editId").value = c.id;
  document.getElementById("editDate").value = c.date || "";
  document.getElementById("editTime").value = c.time || "";
  document.getElementById("editLocation").value = c.location || "";
  document.getElementById("editSpecies").value = c.species || "";
  document.getElementById("editLength").value = c.length_in || "";
  document.getElementById("editWeight").value = c.weight_lbs || "";
  document.getElementById("editWeather").value = c.weather || "";
  document.getElementById("editBait").value = c.bait || "";
}

function closeEditForm() {
  document.getElementById("editModal").style.display = "none";
}

if (document.getElementById("editForm")) {
  document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
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
        loadCatches();
      } else {
        console.error("Failed to update catch");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  });
}

/* -------------------- Charts Page -------------------- */
async function loadAllCharts() {
  await loadChart();
  await loadTimeChart();
  await loadAverageWeightChart();
  await loadBaitChart();
  await loadAverageLengthChart();
}

async function loadChart() {
  const data = await fetchCatches();
  if (!data.length) return;

  const counts = {};
  data.forEach(c => counts[c.species] = (counts[c.species] || 0) + 1);
  const species = Object.keys(counts);
  const values = Object.values(counts);

  const ctx = document.getElementById("fishChart").getContext("2d");
  if (fishChartInstance) fishChartInstance.destroy();
  fishChartInstance = new Chart(ctx, {
    type: "bar",
    data: { labels: species, datasets: [{ label: "Number of Fish Caught", data: values, backgroundColor: "rgba(54, 162, 235, 0.5)", borderColor: "rgba(54, 162, 235,1)", borderWidth:1 }] },
    options: { responsive: true, scales: { y: { beginAtZero:true } } }
  });
}

async function loadTimeChart() {
  const data = await fetchCatches();
  if (!data.length) return;

  const counts = {};
  data.forEach(c => {
    const d = c.date ? c.date.split("T")[0] : "Unknown";
    counts[d] = (counts[d] || 0) + 1;
  });

  const dates = Object.keys(counts).sort();
  const values = dates.map(d => counts[d]);

  const ctx = document.getElementById("timeChart").getContext("2d");
  if (timeChartInstance) timeChartInstance.destroy();
  timeChartInstance = new Chart(ctx, {
    type: "line",
    data: { labels: dates, datasets:[{label:"Number of Fish Caught", data: values, borderColor:"rgba(75,192,192,1)", fill:false, tension:0.2, pointBackgroundColor:"rgba(75,192,192,1)"}] },
    options:{responsive:true, scales:{ x:{ title:{ display:true, text:"Date" } }, y:{ beginAtZero:true, title:{ display:true, text:"Catches" }, ticks:{ stepSize:1 } } } }
  });
}

async function loadAverageWeightChart() {
  const data = await fetchCatches();
  if (!data.length) return;

  const sums = {}, counts = {};
  data.forEach(c => {
    if (!c.species || !c.weight_lbs) return;
    sums[c.species] = (sums[c.species] || 0) + parseFloat(c.weight_lbs);
    counts[c.species] = (counts[c.species] || 0) + 1;
  });

  const species = Object.keys(sums);
  const values = species.map(s => sums[s]/counts[s]);

  const ctx = document.getElementById("avgWeightChart").getContext("2d");
  if (avgWeightChartInstance) avgWeightChartInstance.destroy();
  avgWeightChartInstance = new Chart(ctx, {
    type: "bar",
    data: { labels: species, datasets:[{ label:"Average Weight (lbs)", data: values, backgroundColor:"rgba(255,159,64,0.5)", borderColor:"rgba(255,159,64,1)", borderWidth:1 }] },
    options:{ responsive:true, scales:{ y:{ beginAtZero:true } } }
  });
}

async function loadBaitChart() {
  const data = await fetchCatches();
  if (!data.length) return;

  const counts = {};
  data.forEach(c => {
    const bait = c.bait || "Unknown";
    counts[bait] = (counts[bait] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const values = Object.values(counts);

  const ctx = document.getElementById("baitChart").getContext("2d");
  if (baitChartInstance) baitChartInstance.destroy();
  baitChartInstance = new Chart(ctx, {
    type: "pie",
    data:{ labels, datasets:[{ data: values, backgroundColor: ["rgba(255,99,132,0.6)","rgba(54,162,235,0.6)","rgba(255,206,86,0.6)","rgba(75,192,192,0.6)","rgba(153,102,255,0.6)","rgba(255,159,64,0.6)"], borderColor:"white", borderWidth:2 }]},
    options:{ responsive:true, plugins:{ legend:{ position:"bottom" } } }
  });
}

async function loadAverageLengthChart() {
  const data = await fetchCatches();
  if (!data.length) return;

  const sums = {}, counts = {};
  data.forEach(c => {
    if (!c.species || !c.length_in) return;
    sums[c.species] = (sums[c.species] || 0) + parseFloat(c.length_in);
    counts[c.species] = (counts[c.species] || 0) + 1;
  });

  const species = Object.keys(sums);
  const values = species.map(s => sums[s]/counts[s]);

  const ctx = document.getElementById("avgLengthChart").getContext("2d");
  if (avgLengthChartInstance) avgLengthChartInstance.destroy();
  avgLengthChartInstance = new Chart(ctx, {
    type: "bar",
    data:{ labels: species, datasets:[{ label:"Average Length (inches)", data: values, backgroundColor:"rgba(153,102,255,0.6)", borderColor:"rgba(153,102,255,1)", borderWidth:1 }]},
    options:{ indexAxis:"y", responsive:true, scales:{ x:{ beginAtZero:true }, y:{ title:{ display:true, text:"Species" } } } }
  });
}

// Fetch catches helper
async function fetchCatches() {
  const res = await fetch(`${backendUrl}/catches`);
  const json = await res.json();
  return json.data || [];
}
