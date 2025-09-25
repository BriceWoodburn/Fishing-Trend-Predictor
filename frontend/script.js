const backendUrl = "http://127.0.0.1:8000"; // replace with your deployed backend if needed

// Submit new catch
document.getElementById("catchForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const catchData = Object.fromEntries(formData);

  // Optional: default date/time to now
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
      alert("✅ Catch logged!");
      e.target.reset(); // clear the form
      loadCatches();
    } else {
      alert("❌ Error logging catch: " + JSON.stringify(result));
    }
  } catch (err) {
    alert("❌ Network or server error: " + err.message);
  }
});

// Load and display catches
async function loadCatches() {
  try {
    const res = await fetch(`${backendUrl}/catches`);
    const data = await res.json();
    const tbody = document.querySelector("#catchesTable tbody");
    tbody.innerHTML = "";

    data.data.forEach(c => {
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
        <td><button onclick="deleteCatch(${c.id})">Delete</button></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading catches:", err);
  }
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


// Load catches on page load
loadCatches();
