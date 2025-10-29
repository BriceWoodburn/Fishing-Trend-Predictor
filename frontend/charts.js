const backendUrl = "http://127.0.0.1:8000";
let chartInstance = null;

async function fetchCatches() {
  const res = await fetch(`${backendUrl}/catches`);
  const json = await res.json();
  return json.data || [];
}

async function renderChart(type) {
  const data = await fetchCatches();
  if (!data.length) return;

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
            backgroundColor: "rgba(54,162,235,0.5)",
            borderColor: "rgba(54,162,235,1)",
            borderWidth: 1
          }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
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
            tension: 0.2
          }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
      break;
    }

    case "avgWeightChart": {
      const speciesWeights = {}, counts = {};
      data.forEach(c => {
        if (!c.species || !c.weight_lbs) return;
        speciesWeights[c.species] = (speciesWeights[c.species] || 0) + parseFloat(c.weight_lbs);
        counts[c.species] = (counts[c.species] || 0) + 1;
      });

      const species = Object.keys(speciesWeights);
      const avgWeights = species.map(s => speciesWeights[s] / counts[s]);

      chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: species,
          datasets: [{
            label: "Average Weight (lbs)",
            data: avgWeights,
            backgroundColor: "rgba(255,159,64,0.6)"
          }]
        },
        options: { responsive: true }
      });
      break;
    }

    case "baitChart": {
      const baitCounts = {};
      data.forEach(c => {
        const bait = c.bait || "Unknown";
        baitCounts[bait] = (baitCounts[bait] || 0) + 1;
      });

      chartInstance = new Chart(ctx, {
        type: "pie",
        data: {
          labels: Object.keys(baitCounts),
          datasets: [{
            data: Object.values(baitCounts),
            backgroundColor: [
              "rgba(255,99,132,0.6)",
              "rgba(54,162,235,0.6)",
              "rgba(255,206,86,0.6)",
              "rgba(75,192,192,0.6)"
            ]
          }]
        },
        options: { responsive: true, plugins: { legend: { position: "bottom" } } }
      });
      break;
    }

    case "avgLengthChart": {
      const speciesLengths = {}, counts = {};
      data.forEach(c => {
        if (!c.species || !c.length_in) return;
        speciesLengths[c.species] = (speciesLengths[c.species] || 0) + parseFloat(c.length_in);
        counts[c.species] = (counts[c.species] || 0) + 1;
      });

      const species = Object.keys(speciesLengths);
      const avgLengths = species.map(s => speciesLengths[s] / counts[s]);

      chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: species,
          datasets: [{
            label: "Average Length (in)",
            data: avgLengths,
            backgroundColor: "rgba(153,102,255,0.6)"
          }]
        },
        options: { responsive: true, indexAxis: "y" }
      });
      break;
    }
  }
}

document.getElementById("chartSelect").addEventListener("change", e => {
  renderChart(e.target.value);
});

// Default chart on load
renderChart("fishChart");
