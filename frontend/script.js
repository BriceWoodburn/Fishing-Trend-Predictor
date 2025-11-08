const backendUrl = "http://127.0.0.1:8000";
let allCatches = [];
let filteredCatches = [];
let currentPage = 1;
const itemsPerPage = 25;

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
async function loadCatches(keepPage = false) {
  try {
    const res = await fetch(`${backendUrl}/catches`);
    const json = await res.json();
    allCatches = json.data || [];

    // Initially, filteredCatches = allCatches
    filteredCatches = [...allCatches];

    const pageToShow = keepPage ? currentPage : 1;
    renderTablePage(pageToShow);
  } catch (err) {
    console.error("Failed to load catches:", err);
  }
}

const searchInput = document.getElementById("catchSearch");
searchInput?.addEventListener("input", () => {
  const keyword = searchInput.value.toLowerCase().trim();

  filteredCatches = allCatches.filter(c => {
  const formattedDate = c.date ? formatDate(c.date) : "";
  const formattedTime = c.time ? formatTime(c.time) : "";

  return (
    formattedDate.toLowerCase().includes(keyword) ||
    formattedTime.toLowerCase().includes(keyword) ||
    Object.entries(c).some(([key, val]) => {
      // skip date and time since already checked
      if (key === "date" || key === "time") return false;
      return val !== null && val !== undefined && String(val).toLowerCase().includes(keyword);
    })
  );
  });

  // Reset to page 1 whenever a search is performed
  renderTablePage(1);
});

function renderTablePage(page) {
  currentPage = page;
  const tbody = document.querySelector("#catchesTable tbody");
  tbody.innerHTML = "";

  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
const pageData = filteredCatches.slice(start, end);

  pageData.forEach(c => {
    const tr = document.createElement("tr");

    // Format date and time for display
    const formattedDate = c.date ? formatDate(c.date) : "";
    const formattedTime = c.time ? formatTime(c.time) : "";

    tr.innerHTML = `
      <td>${formattedDate}</td>
      <td>${formattedTime}</td>
      <td>${escapeHtml(c.location)}</td>
      <td>${escapeHtml(c.species)}</td>
      <td>${c.length_in ?? ''}</td>
      <td>${c.weight_lbs ?? ''}</td>
      <td>${c.temperature ?? ''}</td>
      <td>${escapeHtml(c.bait || "")}</td>
      <td>
        <button class="edit" onclick='openEditForm(${JSON.stringify(c)})'>Edit</button>
        <button class="delete" onclick='deleteCatch(${c.id})'>Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updatePaginationControls();
}

function updatePaginationControls() {
  const totalPages = Math.ceil(filteredCatches.length / itemsPerPage);
  document.getElementById("pageInfo").textContent = `Page ${currentPage} of ${totalPages}`;

  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled = currentPage === totalPages;
}

// Scroll smoothly to top of table section
function scrollToTableTop() {
  const tableSection = document.querySelector(".catches-wrap");
  if (tableSection) {
    tableSection.scrollIntoView({ behavior: "smooth" });
  }
}

// Page navigation
document.getElementById("prevPage")?.addEventListener("click", () => {
  if (currentPage > 1) {
    renderTablePage(currentPage - 1);
    scrollToTableTop();
  }
});

document.getElementById("nextPage")?.addEventListener("click", () => {
  const totalPages = Math.ceil(allCatches.length / itemsPerPage);
  if (currentPage < totalPages) {
    renderTablePage(currentPage + 1);
    scrollToTableTop();
  }
});

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
    if (result.success) loadCatches(true);
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

  // Clean up time to be HH:MM only
  let cleanTime = c.time || "";
  if (cleanTime.includes(":")) {
    // If time has seconds (HH:MM:SS), trim to HH:MM
    cleanTime = cleanTime.split(":").slice(0, 2).join(":");
  }

  document.getElementById("editId").value = c.id;
  document.getElementById("editDate").value = c.date || "";
  document.getElementById("editTime").value = cleanTime;
  document.getElementById("editLocation").value = c.location || "";
  document.getElementById("editSpecies").value = c.species || "";
  document.getElementById("editLength").value = c.length_in || "";
  document.getElementById("editWeight").value = c.weight_lbs || "";
  document.getElementById("editTemperature").value = c.temperature || "";
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
      temperature: document.getElementById("editTemperature").value,
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
        loadCatches(true);
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

function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

// Utility: format time as HH:MM AM/PM
function formatTime(timeString) {
  // Create a temporary Date object with today's date + given time
  const [hour, minute] = timeString.split(":");
  const date = new Date();
  date.setHours(hour, minute);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
