const backendUrl = "http://127.0.0.1:8000";

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
  try {
    const res = await fetch(`${backendUrl}/catches`);
    const json = await res.json();
    const tbody = document.querySelector("#catchesTable tbody");
    tbody.innerHTML = "";

    (json.data || []).forEach(c => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${c.date}</td>
        <td>${c.time}</td>
        <td>${escapeHtml(c.location)}</td>
        <td>${escapeHtml(c.species)}</td>
        <td>${c.length_in ?? ''}</td>
        <td>${c.weight_lbs ?? ''}</td>
        <td>${escapeHtml(c.weather || "")}</td>
        <td>${escapeHtml(c.bait || "")}</td>
        <td>
          <button class="edit" onclick='openEditForm(${JSON.stringify(c)})'>Edit</button>
          <button class="delete" onclick='deleteCatch(${c.id})'>Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // If charts page also loaded in same SPA, optionally reload charts
    if (typeof loadAllCharts === "function") {
      try { await loadAllCharts(); } catch (e) { /* ignore if not present */ }
    }
  } catch (err) {
    console.error("Failed to load catches:", err);
  }
}

function escapeHtml(text = "") {
  return String(text).replace(/[&<>"']/g, function (m) {
    return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m];
  });
}

// Delete catch
async function deleteCatch(id) {
  if (id.deleteCatch) return;
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
  modal.setAttribute("aria-hidden", "false");
  modal.style.display = "flex";

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
  const modal = document.getElementById("editModal");
  modal.setAttribute("aria-hidden", "true");
  modal.style.display = "none";
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

// Close modal on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeEditForm();
});
