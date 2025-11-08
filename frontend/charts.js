const backendUrl = "http://127.0.0.1:8000";
let chartInstance = null;

async function fetchCatches() {
  try {
    const res = await fetch(`${backendUrl}/catches`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Error fetching catches:", err);
    return [];
  }
}

async function renderChart(type) {
  const data = await fetchCatches();
  if (!data.length) {
    // show empty chart or clear
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    return;
  }

  const ctx = document.getElementById("chartCanvas").getContext("2d");
  if (chartInstance) chartInstance.destroy();

  switch (type) {
    case "fishChart": {
      const speciesCounts = {};
      data.forEach(c => speciesCounts[c.species] = (speciesCounts[c.species] || 0) + 1);

      chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: Object.keys(speciesCounts),
          datasets: [{
            label: "Number of Fish Caught",
            data: Object.values(speciesCounts),
            backgroundColor: "rgba(54,162,235,0.6)",
            borderColor: "rgba(54,162,235,1)",
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
      break;
    }

    case "timeChart": {
      const catchesByDate = {};
      data.forEach(c => {
        const date = c.date ? c.date.split("T")[0] : "Unknown";
        catchesByDate[date] = (catchesByDate[date] || 0) + 1;
      });

      const dates = Object.keys(catchesByDate).sort();
      const counts = dates.map(d => catchesByDate[d]);

      chartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels: dates,
          datasets: [{
            label: "Catches Over Time",
            data: counts,
            borderColor: "rgba(75,192,192,1)",
            fill: false,
            tension: 0.25,
            pointBackgroundColor: "rgba(75,192,192,1)"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { x: { title: { display: true, text: "Date" } }, y: { beginAtZero: true, title: { display: true, text: "Catches" } } }
        }
      });
      break;
    }

    case "avgWeightChart": {
      const sums = {}, counts = {};
      data.forEach(c => {
        if (!c.species || !c.weight_lbs) return;
        sums[c.species] = (sums[c.species] || 0) + parseFloat(c.weight_lbs);
        counts[c.species] = (counts[c.species] || 0) + 1;
      });

      const species = Object.keys(sums);
      const values = species.map(s => sums[s] / counts[s]);

      chartInstance = new Chart(ctx, {
        type: "bar",
        data: { labels: species, datasets: [{ label: "Average Weight (lbs)", data: values, backgroundColor: "rgba(255,159,64,0.6)" }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
      });
      break;
    }

    case "baitChart": {
      const counts = {};
      data.forEach(c => { const bait = c.bait || "Unknown"; counts[bait] = (counts[bait] || 0) + 1; });

      chartInstance = new Chart(ctx, {
        type: "pie",
        data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: ["rgba(255,99,132,0.6)","rgba(54,162,235,0.6)","rgba(255,206,86,0.6)","rgba(75,192,192,0.6)","rgba(153,102,255,0.6)"] }] },
        options: { responsive: true, maintainAspectRatio: false, plugins:{ legend:{ position:"bottom" } } }
      });
      break;
    }

    case "avgLengthChart": {
      const sums = {}, counts = {};
      data.forEach(c => {
        if (!c.species || !c.length_in) return;
        sums[c.species] = (sums[c.species] || 0) + parseFloat(c.length_in);
        counts[c.species] = (counts[c.species] || 0) + 1;
      });

      const species = Object.keys(sums);
      const values = species.map(s => sums[s] / counts[s]);

      chartInstance = new Chart(ctx, {
        type: "bar",
        data: { labels: species, datasets: [{ label: "Average Length (in)", data: values, backgroundColor: "rgba(153,102,255,0.6)" }] },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: "y", scales: { x: { beginAtZero: true } } }
      });
      break;
    }
  }
}

// Hook up select
document.addEventListener("DOMContentLoaded", () => {
  const sel = document.getElementById("chartSelect");
  if (sel) {
    sel.addEventListener("change", (e) => renderChart(e.target.value));
    renderChart(sel.value || "fishChart");
  }
});

// Ensure DOM loaded before querying controls
document.addEventListener("DOMContentLoaded", () => {
  const chartSelect = document.getElementById("chartSelect");
  const chartButtons = Array.from(document.querySelectorAll(".chart-buttons button"));

  if (!chartSelect) return; // safety

  // Sync: when select changes, update active button and call change handler
  chartSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    chartButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.chart === val));
    // Call your existing chart update function here if it expects a string
    // Example: updateChart(val);
    if (typeof updateChart === "function") updateChart(val);
  });

  // When a button is clicked, set select value and dispatch change event
  chartButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      chartSelect.value = btn.dataset.chart;
      // Trigger same behavior as select change
      const ev = new Event("change", { bubbles: true });
      chartSelect.dispatchEvent(ev);
    });
  });

  // Initialize active button to match current select default
  const initial = chartSelect.value;
  chartButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.chart === initial));
});


